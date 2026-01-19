import { PrismaClient } from '@prisma/client'
import {
  NotificationPreferences,
  ChannelPreferences,
  QuietHours,
  NotificationFrequency,
  NotificationType,
  DeliveryChannel,
  NotificationPriority,
  NotificationError,
  ValidationError
} from '../../types/notification.types'
import logger from '../../utils/logger'

export class NotificationPreferencesService {
  constructor(private prisma: PrismaClient) {}

  // Get user preferences with defaults if not found
  async getPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      let preferences = await this.prisma.notificationPreferences.findUnique({
        where: { userId }
      })

      if (!preferences) {
        // Create default preferences for new user
        preferences = await this.createDefaultPreferences(userId)
        logger.info(`Created default notification preferences for user ${userId}`)
      }

      return this.mapPrismaPreferences(preferences)
    } catch (error) {
      logger.error('Error getting notification preferences:', error)
      throw new NotificationError('Failed to get notification preferences', 'PREFERENCES_FETCH_FAILED')
    }
  }

  // Update user preferences
  async updatePreferences(
    userId: string, 
    updates: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    try {
      // Validate the updates
      this.validatePreferencesUpdate(updates)

      // Get current preferences to merge with updates
      const currentPreferences = await this.getPreferences(userId)

      // Merge channel preferences if provided
      let mergedChannels = currentPreferences.channels
      if (updates.channels) {
        mergedChannels = { ...currentPreferences.channels, ...updates.channels }
      }

      // Merge quiet hours if provided
      let mergedQuietHours = currentPreferences.quietHours
      if (updates.quietHours) {
        mergedQuietHours = { ...currentPreferences.quietHours, ...updates.quietHours }
      }

      // Update preferences in database
      const updatedPreferences = await this.prisma.notificationPreferences.upsert({
        where: { userId },
        update: {
          channels: mergedChannels as any,
          quietHours: mergedQuietHours as any,
          frequency: updates.frequency || currentPreferences.frequency,
          language: updates.language || currentPreferences.language,
          timezone: updates.timezone || currentPreferences.timezone,
          updatedAt: new Date()
        },
        create: {
          userId,
          channels: mergedChannels as any,
          quietHours: mergedQuietHours as any,
          frequency: updates.frequency || NotificationFrequency.IMMEDIATE,
          language: updates.language || 'en',
          timezone: updates.timezone || 'UTC'
        }
      })

      logger.info(`Updated notification preferences for user ${userId}`, {
        hasChannelUpdates: !!updates.channels,
        hasQuietHoursUpdates: !!updates.quietHours,
        frequency: updates.frequency,
        language: updates.language,
        timezone: updates.timezone
      })

      return this.mapPrismaPreferences(updatedPreferences)
    } catch (error) {
      logger.error('Error updating notification preferences:', error)
      if (error instanceof ValidationError || error instanceof NotificationError) {
        throw error
      }
      throw new NotificationError('Failed to update notification preferences', 'PREFERENCES_UPDATE_FAILED')
    }
  }

  // Update channel preferences for specific notification types
  async updateChannelPreferences(
    userId: string,
    channelUpdates: Partial<ChannelPreferences>
  ): Promise<NotificationPreferences> {
    try {
      const currentPreferences = await this.getPreferences(userId)
      
      // Validate channel preferences
      this.validateChannelPreferences(channelUpdates)

      // Merge with existing channel preferences
      const updatedChannels = { ...currentPreferences.channels, ...channelUpdates }

      return await this.updatePreferences(userId, { channels: updatedChannels })
    } catch (error) {
      logger.error('Error updating channel preferences:', error)
      if (error instanceof ValidationError || error instanceof NotificationError) {
        throw error
      }
      throw new NotificationError('Failed to update channel preferences', 'CHANNEL_UPDATE_FAILED')
    }
  }

  // Update quiet hours settings
  async updateQuietHours(userId: string, quietHours: QuietHours): Promise<NotificationPreferences> {
    try {
      this.validateQuietHours(quietHours)
      return await this.updatePreferences(userId, { quietHours })
    } catch (error) {
      logger.error('Error updating quiet hours:', error)
      if (error instanceof ValidationError || error instanceof NotificationError) {
        throw error
      }
      throw new NotificationError('Failed to update quiet hours', 'QUIET_HOURS_UPDATE_FAILED')
    }
  }

  // Check if notifications should be suppressed due to quiet hours
  isInQuietHours(preferences: NotificationPreferences, priority: NotificationPriority): boolean {
    if (!preferences.quietHours || !preferences.quietHours.enabled) {
      return false
    }

    // Always allow critical notifications if configured
    if (priority === NotificationPriority.CRITICAL && preferences.quietHours.allowCritical) {
      return false
    }

    try {
      const now = new Date()
      const userTimezone = preferences.timezone || 'UTC'
      
      // Convert current time to user's timezone
      const userTime = new Intl.DateTimeFormat('en-US', {
        timeZone: userTimezone,
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      }).format(now)

      const currentTime = this.parseTimeString(userTime)
      const startTime = this.parseTimeString(preferences.quietHours.startTime)
      const endTime = this.parseTimeString(preferences.quietHours.endTime)

      // Handle quiet hours that span midnight
      if (startTime > endTime) {
        return currentTime >= startTime || currentTime <= endTime
      } else {
        return currentTime >= startTime && currentTime <= endTime
      }
    } catch (error) {
      logger.error('Error checking quiet hours:', error)
      return false // Default to not suppressing if there's an error
    }
  }

  // Determine effective delivery channels based on preferences
  determineEffectiveChannels(
    preferences: NotificationPreferences,
    notificationType: NotificationType,
    requestedChannels: DeliveryChannel[],
    priority: NotificationPriority
  ): DeliveryChannel[] {
    try {
      // Get user's preferred channels for this notification type
      const preferredChannels = preferences.channels[notificationType] || []

      // Find intersection of requested and preferred channels
      let effectiveChannels = requestedChannels.filter(channel => 
        preferredChannels.includes(channel)
      )

      // Check quiet hours suppression
      if (this.isInQuietHours(preferences, priority)) {
        // During quiet hours, only allow critical notifications through push/SMS
        if (priority === NotificationPriority.CRITICAL && preferences.quietHours?.allowCritical) {
          effectiveChannels = effectiveChannels.filter(channel => 
            channel === DeliveryChannel.PUSH || channel === DeliveryChannel.SMS
          )
        } else {
          // Suppress all channels except in-app during quiet hours
          effectiveChannels = effectiveChannels.filter(channel => 
            channel === DeliveryChannel.IN_APP
          )
        }
      }

      // Apply frequency-based filtering
      if (preferences.frequency !== NotificationFrequency.IMMEDIATE) {
        // For non-immediate frequencies, suppress real-time channels except for critical
        if (priority !== NotificationPriority.CRITICAL) {
          effectiveChannels = effectiveChannels.filter(channel => 
            channel === DeliveryChannel.IN_APP || channel === DeliveryChannel.EMAIL
          )
        }
      }

      return effectiveChannels
    } catch (error) {
      logger.error('Error determining effective channels:', error)
      // Fallback to in-app only if there's an error
      return [DeliveryChannel.IN_APP]
    }
  }

  // Reset preferences to defaults
  async resetToDefaults(userId: string): Promise<NotificationPreferences> {
    try {
      await this.prisma.notificationPreferences.delete({
        where: { userId }
      })

      const defaultPreferences = await this.createDefaultPreferences(userId)
      logger.info(`Reset notification preferences to defaults for user ${userId}`)
      
      return this.mapPrismaPreferences(defaultPreferences)
    } catch (error) {
      logger.error('Error resetting preferences to defaults:', error)
      throw new NotificationError('Failed to reset preferences', 'PREFERENCES_RESET_FAILED')
    }
  }

  // Get preferences for multiple users (for batch operations)
  async getBatchPreferences(userIds: string[]): Promise<Map<string, NotificationPreferences>> {
    try {
      const preferences = await this.prisma.notificationPreferences.findMany({
        where: { userId: { in: userIds } }
      })

      const preferencesMap = new Map<string, NotificationPreferences>()
      
      // Add found preferences
      preferences.forEach(pref => {
        preferencesMap.set(pref.userId, this.mapPrismaPreferences(pref))
      })

      // Create default preferences for users not found
      const missingUserIds = userIds.filter(id => !preferencesMap.has(id))
      for (const userId of missingUserIds) {
        const defaultPrefs = await this.createDefaultPreferences(userId)
        preferencesMap.set(userId, this.mapPrismaPreferences(defaultPrefs))
      }

      return preferencesMap
    } catch (error) {
      logger.error('Error getting batch preferences:', error)
      throw new NotificationError('Failed to get batch preferences', 'BATCH_PREFERENCES_FAILED')
    }
  }

  // Private helper methods

  private async createDefaultPreferences(userId: string) {
    const defaultChannels = this.getDefaultChannelPreferences()
    const defaultQuietHours = this.getDefaultQuietHours()

    return await this.prisma.notificationPreferences.create({
      data: {
        userId,
        channels: defaultChannels as any,
        quietHours: defaultQuietHours as any,
        frequency: NotificationFrequency.IMMEDIATE,
        language: 'en',
        timezone: 'UTC'
      }
    })
  }

  private getDefaultChannelPreferences(): ChannelPreferences {
    return {
      [NotificationType.BOOKING_CONFIRMATION]: [DeliveryChannel.IN_APP, DeliveryChannel.EMAIL, DeliveryChannel.PUSH],
      [NotificationType.BOOKING_REMINDER]: [DeliveryChannel.IN_APP, DeliveryChannel.PUSH],
      [NotificationType.BOOKING_CANCELLED]: [DeliveryChannel.IN_APP, DeliveryChannel.EMAIL, DeliveryChannel.PUSH],
      [NotificationType.PAYMENT_SUCCESS]: [DeliveryChannel.IN_APP, DeliveryChannel.EMAIL],
      [NotificationType.PAYMENT_FAILED]: [DeliveryChannel.IN_APP, DeliveryChannel.EMAIL, DeliveryChannel.PUSH],
      [NotificationType.CHAT_MESSAGE]: [DeliveryChannel.IN_APP, DeliveryChannel.PUSH],
      [NotificationType.CHAT_MENTION]: [DeliveryChannel.IN_APP, DeliveryChannel.PUSH],
      [NotificationType.SYSTEM_ANNOUNCEMENT]: [DeliveryChannel.IN_APP, DeliveryChannel.EMAIL],
      [NotificationType.SECURITY_ALERT]: [DeliveryChannel.IN_APP, DeliveryChannel.EMAIL, DeliveryChannel.PUSH],
      [NotificationType.PROMOTIONAL]: [DeliveryChannel.IN_APP]
    }
  }

  private getDefaultQuietHours(): QuietHours {
    return {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00',
      timezone: 'UTC',
      allowCritical: true
    }
  }

  private validatePreferencesUpdate(updates: Partial<NotificationPreferences>): void {
    if (updates.channels) {
      this.validateChannelPreferences(updates.channels)
    }

    if (updates.quietHours) {
      this.validateQuietHours(updates.quietHours)
    }

    if (updates.frequency && !Object.values(NotificationFrequency).includes(updates.frequency)) {
      throw new ValidationError(`Invalid notification frequency: ${updates.frequency}`)
    }

    if (updates.language && typeof updates.language !== 'string') {
      throw new ValidationError('Language must be a string')
    }

    if (updates.timezone && typeof updates.timezone !== 'string') {
      throw new ValidationError('Timezone must be a string')
    }
  }

  private validateChannelPreferences(channels: Partial<ChannelPreferences>): void {
    for (const [type, channelList] of Object.entries(channels)) {
      if (!Object.values(NotificationType).includes(type as NotificationType)) {
        throw new ValidationError(`Invalid notification type: ${type}`)
      }

      if (!Array.isArray(channelList)) {
        throw new ValidationError(`Channels for ${type} must be an array`)
      }

      for (const channel of channelList) {
        if (!Object.values(DeliveryChannel).includes(channel)) {
          throw new ValidationError(`Invalid delivery channel: ${channel}`)
        }
      }
    }
  }

  private validateQuietHours(quietHours: QuietHours): void {
    if (typeof quietHours.enabled !== 'boolean') {
      throw new ValidationError('Quiet hours enabled must be a boolean')
    }

    if (!this.isValidTimeString(quietHours.startTime)) {
      throw new ValidationError('Invalid start time format. Use HH:mm format')
    }

    if (!this.isValidTimeString(quietHours.endTime)) {
      throw new ValidationError('Invalid end time format. Use HH:mm format')
    }

    if (typeof quietHours.timezone !== 'string') {
      throw new ValidationError('Timezone must be a string')
    }

    if (typeof quietHours.allowCritical !== 'boolean') {
      throw new ValidationError('Allow critical must be a boolean')
    }
  }

  private isValidTimeString(time: string): boolean {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    return timeRegex.test(time)
  }

  private parseTimeString(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number)
    return hours * 60 + minutes // Convert to minutes since midnight
  }

  private mapPrismaPreferences(prismaPreferences: any): NotificationPreferences {
    return {
      userId: prismaPreferences.userId,
      channels: prismaPreferences.channels as ChannelPreferences,
      quietHours: prismaPreferences.quietHours as QuietHours | undefined,
      frequency: prismaPreferences.frequency as NotificationFrequency,
      language: prismaPreferences.language,
      timezone: prismaPreferences.timezone,
      createdAt: prismaPreferences.createdAt,
      updatedAt: prismaPreferences.updatedAt
    }
  }
}