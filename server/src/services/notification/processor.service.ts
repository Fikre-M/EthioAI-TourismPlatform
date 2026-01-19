import { PrismaClient } from '@prisma/client'
import { EnhancedNotificationService } from './enhanced-notification.service'
import { NotificationPreferencesService } from './preferences.service'
import {
  CreateNotificationRequest,
  Notification,
  NotificationType,
  DeliveryChannel,
  NotificationPriority,
  NotificationFrequency,
  NotificationPreferences,
  BroadcastMessage,
  UserSegment,
  NotificationError
} from '../../types/notification.types'
import logger from '../../utils/logger'

export class NotificationProcessorService {
  private notificationService: EnhancedNotificationService
  private preferencesService: NotificationPreferencesService

  constructor(prisma: PrismaClient) {
    this.notificationService = new EnhancedNotificationService(prisma)
    this.preferencesService = new NotificationPreferencesService(prisma)
  }

  // Process a single notification with full preference application
  async processNotification(request: CreateNotificationRequest): Promise<Notification | null> {
    try {
      logger.info(`Processing notification for user ${request.userId}`, {
        type: request.type,
        priority: request.priority,
        requestedChannels: request.channels
      })

      // Get user preferences
      const preferences = await this.preferencesService.getPreferences(request.userId)

      // Apply preference-based modifications to the request
      const processedRequest = await this.applyPreferencesToRequest(request, preferences)

      // Check if notification should be suppressed (no effective channels)
      if (processedRequest.channels.length === 0) {
        logger.info(`Notification suppressed for user ${request.userId} - no effective channels`, {
          type: request.type,
          originalChannels: request.channels,
          reason: 'All channels filtered by user preferences'
        })
        return null
      }

      // Create the notification with processed channels
      const notification = await this.notificationService.createNotification(processedRequest)

      logger.info(`Notification processed successfully: ${notification.id}`, {
        originalChannels: request.channels,
        effectiveChannels: notification.channels,
        preferencesApplied: true
      })

      return notification
    } catch (error) {
      logger.error('Error processing notification:', error)
      throw error
    }
  }

  // Process multiple notifications efficiently
  async processNotificationBatch(requests: CreateNotificationRequest[]): Promise<Notification[]> {
    try {
      logger.info(`Processing batch of ${requests.length} notifications`)

      // Get unique user IDs
      const userIds = [...new Set(requests.map(req => req.userId))]

      // Batch fetch preferences for all users
      const preferencesMap = await this.preferencesService.getBatchPreferences(userIds)

      // Process each notification with its user's preferences
      const processedNotifications: Notification[] = []

      for (const request of requests) {
        const preferences = preferencesMap.get(request.userId)
        if (!preferences) {
          logger.warn(`No preferences found for user ${request.userId}, skipping notification`)
          continue
        }

        const processedRequest = await this.applyPreferencesToRequest(request, preferences)
        
        // Skip if no effective channels
        if (processedRequest.channels.length === 0) {
          logger.info(`Notification suppressed in batch for user ${request.userId} - no effective channels`)
          continue
        }

        const notification = await this.notificationService.createNotification(processedRequest)
        processedNotifications.push(notification)
      }

      logger.info(`Batch processing completed: ${processedNotifications.length} notifications created`)
      return processedNotifications
    } catch (error) {
      logger.error('Error processing notification batch:', error)
      throw error
    }
  }

  // Send broadcast notification to multiple users
  async sendBroadcast(message: BroadcastMessage, audience: UserSegment): Promise<{
    sent: number
    suppressed: number
    failed: number
    details: Array<{ userId: string; status: 'sent' | 'suppressed' | 'failed'; reason?: string }>
  }> {
    try {
      logger.info('Processing broadcast notification', {
        type: message.type,
        priority: message.priority,
        channels: message.channels,
        audience: audience
      })

      // Get target user IDs based on audience
      const targetUserIds = await this.resolveAudience(audience)
      logger.info(`Broadcast targeting ${targetUserIds.length} users`)

      // Get preferences for all target users
      const preferencesMap = await this.preferencesService.getBatchPreferences(targetUserIds)

      const results = {
        sent: 0,
        suppressed: 0,
        failed: 0,
        details: [] as Array<{ userId: string; status: 'sent' | 'suppressed' | 'failed'; reason?: string }>
      }

      // Process each user individually
      for (const userId of targetUserIds) {
        try {
          const preferences = preferencesMap.get(userId)
          if (!preferences) {
            results.failed++
            results.details.push({ userId, status: 'failed', reason: 'No preferences found' })
            continue
          }

          // Create notification request for this user
          const request: CreateNotificationRequest = {
            userId,
            type: message.type,
            title: message.title,
            content: message.content,
            data: message.data,
            channels: message.channels,
            priority: message.priority
          }

          // Apply preferences
          const processedRequest = await this.applyPreferencesToRequest(request, preferences)

          // Check if notification should be sent
          if (processedRequest.channels.length === 0) {
            results.suppressed++
            results.details.push({ userId, status: 'suppressed', reason: 'All channels filtered by preferences' })
            continue
          }

          // Create the notification
          await this.notificationService.createNotification(processedRequest)
          results.sent++
          results.details.push({ userId, status: 'sent' })

        } catch (error) {
          logger.error(`Failed to send broadcast notification to user ${userId}:`, error)
          results.failed++
          results.details.push({ userId, status: 'failed', reason: (error as Error).message })
        }
      }

      logger.info('Broadcast notification completed', results)
      return results
    } catch (error) {
      logger.error('Error sending broadcast notification:', error)
      throw new NotificationError('Failed to send broadcast notification', 'BROADCAST_FAILED')
    }
  }

  // Apply user preferences to modify notification request
  private async applyPreferencesToRequest(
    request: CreateNotificationRequest,
    preferences: NotificationPreferences
  ): Promise<CreateNotificationRequest> {
    // Determine effective channels based on preferences
    const effectiveChannels = this.preferencesService.determineEffectiveChannels(
      preferences,
      request.type,
      request.channels,
      request.priority
    )

    // Apply frequency-based scheduling
    const scheduledAt = this.applyFrequencyScheduling(request, preferences)

    // Apply content localization if needed
    const localizedContent = await this.applyContentLocalization(request, preferences)

    return {
      ...request,
      ...localizedContent,
      channels: effectiveChannels,
      scheduledAt: scheduledAt || request.scheduledAt
    }
  }

  // Apply frequency-based scheduling
  private applyFrequencyScheduling(
    request: CreateNotificationRequest,
    preferences: NotificationPreferences
  ): Date | undefined {
    // If already scheduled or immediate frequency, don't modify
    if (request.scheduledAt || preferences.frequency === NotificationFrequency.IMMEDIATE) {
      return undefined
    }

    // Don't delay critical notifications
    if (request.priority === NotificationPriority.CRITICAL) {
      return undefined
    }

    const now = new Date()

    switch (preferences.frequency) {
      case NotificationFrequency.HOURLY:
        // Schedule for the next hour
        const nextHour = new Date(now)
        nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0)
        return nextHour

      case NotificationFrequency.DAILY:
        // Schedule for 9 AM next day (or today if it's before 9 AM)
        const nextDay = new Date(now)
        nextDay.setHours(9, 0, 0, 0)
        
        // If it's already past 9 AM today, schedule for tomorrow
        if (now.getHours() >= 9) {
          nextDay.setDate(nextDay.getDate() + 1)
        }
        
        return nextDay

      default:
        return undefined
    }
  }

  // Apply content localization based on user preferences
  private async applyContentLocalization(
    request: CreateNotificationRequest,
    preferences: NotificationPreferences
  ): Promise<Partial<CreateNotificationRequest>> {
    // If user's language is English or no localization needed, return as-is
    if (preferences.language === 'en') {
      return {}
    }

    // For now, we'll just add a language indicator to the data
    // In a full implementation, this would use a translation service
    const localizedData = {
      ...request.data,
      originalLanguage: 'en',
      targetLanguage: preferences.language,
      localizationApplied: true
    }

    // In a real implementation, you would:
    // 1. Look up translated templates
    // 2. Apply translation service
    // 3. Format content for the target locale

    return {
      data: localizedData
    }
  }

  // Resolve audience segment to user IDs
  private async resolveAudience(audience: UserSegment): Promise<string[]> {
    if (audience.userIds) {
      return audience.userIds
    }

    if (audience.all) {
      // Get all active users
      const users = await this.notificationService['prisma'].user.findMany({
        select: { id: true }
      })
      return users.map(user => user.id)
    }

    const userIds: string[] = []

    // Filter by roles if specified
    if (audience.roles && audience.roles.length > 0) {
      const usersByRole = await this.notificationService['prisma'].user.findMany({
        where: {
          role: { in: audience.roles as any[] }
        },
        select: { id: true }
      })
      userIds.push(...usersByRole.map(user => user.id))
    }

    // Filter by locations if specified (this would need location data in user model)
    if (audience.locations && audience.locations.length > 0) {
      const usersByLocation = await this.notificationService['prisma'].user.findMany({
        where: {
          location: { in: audience.locations }
        },
        select: { id: true }
      })
      userIds.push(...usersByLocation.map(user => user.id))
    }

    // Remove duplicates
    return [...new Set(userIds)]
  }

  // Get notification service for external access
  getNotificationService(): EnhancedNotificationService {
    return this.notificationService
  }

  // Get preferences service for external access
  getPreferencesService(): NotificationPreferencesService {
    return this.preferencesService
  }

  // Update user preferences with immediate effect on pending notifications
  async updatePreferencesWithImmediateEffect(
    userId: string,
    updates: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    try {
      // Update preferences
      const updatedPreferences = await this.preferencesService.updatePreferences(userId, updates)

      // Apply changes to pending notifications
      await this.applyPreferencesToPendingNotifications(userId, updatedPreferences)

      logger.info(`Updated preferences with immediate effect for user ${userId}`, {
        hasChannelUpdates: !!updates.channels,
        hasQuietHoursUpdates: !!updates.quietHours,
        hasFrequencyUpdates: !!updates.frequency
      })

      return updatedPreferences
    } catch (error) {
      logger.error('Error updating preferences with immediate effect:', error)
      throw error
    }
  }

  // Apply updated preferences to pending notifications
  private async applyPreferencesToPendingNotifications(
    userId: string,
    preferences: NotificationPreferences
  ): Promise<void> {
    try {
      // Get pending notifications for the user
      const pendingNotifications = await this.notificationService['prisma'].notification.findMany({
        where: {
          userId,
          status: 'PENDING'
        }
      })

      if (pendingNotifications.length === 0) {
        return
      }

      logger.info(`Applying preference updates to ${pendingNotifications.length} pending notifications`)

      // Update each pending notification
      for (const notification of pendingNotifications) {
        try {
          // Determine new effective channels
          const effectiveChannels = this.preferencesService.determineEffectiveChannels(
            preferences,
            notification.type as NotificationType,
            Array.isArray(notification.channels) ? notification.channels as DeliveryChannel[] : [],
            notification.priority as unknown as NotificationPriority
          )

          // Update the notification
          await this.notificationService['prisma'].notification.update({
            where: { id: notification.id },
            data: {
              channels: effectiveChannels as any,
              updatedAt: new Date()
            }
          })

        } catch (error) {
          logger.error(`Failed to update pending notification ${notification.id}:`, error)
        }
      }

      logger.info(`Successfully updated ${pendingNotifications.length} pending notifications`)
    } catch (error) {
      logger.error('Error applying preferences to pending notifications:', error)
      // Don't throw here as this is a background operation
    }
  }
}