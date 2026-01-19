import { PrismaClient } from '@prisma/client'
import { BaseNotificationService } from './base.service'
import { NotificationPreferencesService } from './preferences.service'
import {
  CreateNotificationRequest,
  Notification,
  NotificationType,
  DeliveryChannel,
  NotificationPriority,
  NotificationStatus,
  NotificationError,
  ValidationError
} from '../../types/notification.types'
import logger from '../../utils/logger'

export class EnhancedNotificationService extends BaseNotificationService {
  private preferencesService: NotificationPreferencesService

  constructor(prisma: PrismaClient) {
    super(prisma)
    this.preferencesService = new NotificationPreferencesService(prisma)
  }

  async createNotification(request: CreateNotificationRequest): Promise<Notification> {
    try {
      // Enhanced validation
      this.validateCreateRequestEnhanced(request)

      // Validate notification type and channels compatibility
      this.validateChannelCompatibility(request.type, request.channels)

      // Check for duplicate notifications (within last 5 minutes)
      await this.checkForDuplicates(request)

      // Get user preferences and apply smart channel selection
      const preferences = await this.preferencesService.getPreferences(request.userId)
      const effectiveChannels = this.preferencesService.determineEffectiveChannels(
        preferences,
        request.type,
        request.channels,
        request.priority
      )

      if (effectiveChannels.length === 0) {
        logger.warn(`No effective channels for notification to user ${request.userId}`)
        // Still create the notification but mark it as suppressed
      }

      // Apply content filtering and sanitization
      const sanitizedRequest = this.sanitizeNotificationContent(request)

      // Set expiration time based on notification type
      const expiresAt = request.expiresAt || this.calculateExpirationTime(request.type)

      // Create notification in database with enhanced data
      const notification = await this.prisma.notification.create({
        data: {
          userId: sanitizedRequest.userId,
          type: sanitizedRequest.type as any,
          title: sanitizedRequest.title,
          content: sanitizedRequest.content,
          data: {
            ...sanitizedRequest.data,
            originalChannels: request.channels,
            effectiveChannels: effectiveChannels,
            createdBy: 'system',
            version: '1.0'
          },
          channels: effectiveChannels as any,
          priority: this.mapPriorityToPrismaEnum(sanitizedRequest.priority) as any,
          status: effectiveChannels.length > 0 ? 'PENDING' as any : 'SENT' as any,
          scheduledAt: sanitizedRequest.scheduledAt,
          expiresAt: expiresAt,
        },
      })

      logger.info(`Enhanced notification created: ${notification.id} for user ${request.userId}`, {
        type: notification.type,
        channels: effectiveChannels,
        priority: notification.priority,
        hasData: !!notification.data
      })

      return this.mapPrismaNotification(notification)
    } catch (error) {
      logger.error('Error in enhanced notification creation:', error)
      if (error instanceof ValidationError || error instanceof NotificationError) {
        throw error
      }
      throw new NotificationError('Failed to create enhanced notification', 'CREATE_FAILED')
    }
  }

  // Enhanced validation with more comprehensive checks
  private validateCreateRequestEnhanced(request: CreateNotificationRequest): void {
    // Basic validation from parent class
    super['validateCreateRequest'](request)

    // Additional enhanced validations
    if (request.title.length > 200) {
      throw new ValidationError('Title must be 200 characters or less')
    }

    if (request.content.length > 2000) {
      throw new ValidationError('Content must be 2000 characters or less')
    }

    // Validate notification type
    if (!Object.values(NotificationType).includes(request.type)) {
      throw new ValidationError(`Invalid notification type: ${request.type}`)
    }

    // Validate channels
    for (const channel of request.channels) {
      if (!Object.values(DeliveryChannel).includes(channel)) {
        throw new ValidationError(`Invalid delivery channel: ${channel}`)
      }
    }

    // Validate priority
    if (!Object.values(NotificationPriority).includes(request.priority)) {
      throw new ValidationError(`Invalid priority: ${request.priority}`)
    }

    // Validate scheduled time (if provided)
    if (request.scheduledAt && request.scheduledAt <= new Date()) {
      throw new ValidationError('Scheduled time must be in the future')
    }

    // Validate expiration time (if provided)
    if (request.expiresAt && request.expiresAt <= new Date()) {
      throw new ValidationError('Expiration time must be in the future')
    }

    if (request.scheduledAt && request.expiresAt && request.scheduledAt >= request.expiresAt) {
      throw new ValidationError('Expiration time must be after scheduled time')
    }
  }

  // Validate that channels are appropriate for the notification type
  private validateChannelCompatibility(type: NotificationType, channels: DeliveryChannel[]): void {
    const incompatibleCombinations: Record<NotificationType, DeliveryChannel[]> = {
      [NotificationType.CHAT_MESSAGE]: [], // All channels allowed
      [NotificationType.CHAT_MENTION]: [], // All channels allowed
      [NotificationType.BOOKING_CONFIRMATION]: [], // All channels allowed
      [NotificationType.BOOKING_REMINDER]: [], // All channels allowed
      [NotificationType.BOOKING_CANCELLED]: [], // All channels allowed
      [NotificationType.PAYMENT_SUCCESS]: [], // All channels allowed
      [NotificationType.PAYMENT_FAILED]: [], // All channels allowed
      [NotificationType.SYSTEM_ANNOUNCEMENT]: [DeliveryChannel.SMS], // SMS not appropriate for announcements
      [NotificationType.SECURITY_ALERT]: [], // All channels allowed for security
      [NotificationType.PROMOTIONAL]: [DeliveryChannel.SMS], // SMS not appropriate for promotions
    }

    const incompatible = incompatibleCombinations[type] || []
    const hasIncompatible = channels.some(channel => incompatible.includes(channel))

    if (hasIncompatible) {
      throw new ValidationError(`Channels ${incompatible.join(', ')} are not compatible with notification type ${type}`)
    }
  }

  // Check for duplicate notifications to prevent spam
  private async checkForDuplicates(request: CreateNotificationRequest): Promise<void> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

    const existingNotification = await this.prisma.notification.findFirst({
      where: {
        userId: request.userId,
        type: request.type as any,
        title: request.title,
        createdAt: {
          gte: fiveMinutesAgo
        }
      }
    })

    if (existingNotification) {
      logger.warn(`Duplicate notification detected for user ${request.userId}`, {
        type: request.type,
        title: request.title,
        existingId: existingNotification.id
      })
      throw new ValidationError('Duplicate notification detected within the last 5 minutes')
    }
  }

  // Sanitize notification content to prevent XSS and other issues
  private sanitizeNotificationContent(request: CreateNotificationRequest): CreateNotificationRequest {
    return {
      ...request,
      title: this.sanitizeText(request.title),
      content: this.sanitizeText(request.content),
      data: request.data ? this.sanitizeData(request.data) : undefined
    }
  }

  private sanitizeText(text: string): string {
    // Basic HTML/script tag removal
    return text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .trim()
  }

  private sanitizeData(data: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {}
    
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeText(value)
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeData(value)
      } else {
        sanitized[key] = value
      }
    }
    
    return sanitized
  }

  // Calculate appropriate expiration time based on notification type
  private calculateExpirationTime(type: NotificationType): Date {
    const now = new Date()
    const expirationHours: Record<NotificationType, number> = {
      [NotificationType.CHAT_MESSAGE]: 24,        // 1 day
      [NotificationType.CHAT_MENTION]: 48,        // 2 days
      [NotificationType.BOOKING_CONFIRMATION]: 168, // 7 days
      [NotificationType.BOOKING_REMINDER]: 24,    // 1 day
      [NotificationType.BOOKING_CANCELLED]: 168,  // 7 days
      [NotificationType.PAYMENT_SUCCESS]: 168,    // 7 days
      [NotificationType.PAYMENT_FAILED]: 72,      // 3 days
      [NotificationType.SYSTEM_ANNOUNCEMENT]: 168, // 7 days
      [NotificationType.SECURITY_ALERT]: 72,      // 3 days
      [NotificationType.PROMOTIONAL]: 48,         // 2 days
    }

    const hours = expirationHours[type] || 24
    return new Date(now.getTime() + hours * 60 * 60 * 1000)
  }

  // Enhanced notification retrieval with better filtering and sorting
  async getNotificationsEnhanced(
    userId: string,
    options: {
      types?: NotificationType[]
      priorities?: NotificationPriority[]
      channels?: DeliveryChannel[]
      unreadOnly?: boolean
      includeExpired?: boolean
      limit?: number
      offset?: number
      sortBy?: 'createdAt' | 'priority' | 'type'
      sortOrder?: 'asc' | 'desc'
    } = {}
  ): Promise<{
    notifications: Notification[]
    total: number
    unreadCount: number
  }> {
    try {
      const where: any = { userId }

      // Apply filters
      if (options.types && options.types.length > 0) {
        where.type = { in: options.types }
      }

      if (options.priorities && options.priorities.length > 0) {
        where.priority = { in: options.priorities.map(p => this.mapPriorityToPrismaEnum(p)) }
      }

      if (options.unreadOnly) {
        where.status = { not: 'READ' }
      }

      if (!options.includeExpired) {
        where.OR = [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      }

      // Get total count
      const total = await this.prisma.notification.count({ where })

      // Get unread count
      const unreadCount = await this.prisma.notification.count({
        where: {
          userId,
          status: { not: 'READ' },
          OR: options.includeExpired ? undefined : [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        }
      })

      // Build order by clause
      const orderBy: any = {}
      const sortBy = options.sortBy || 'createdAt'
      const sortOrder = options.sortOrder || 'desc'
      
      if (sortBy === 'priority') {
        // Custom priority ordering (CRITICAL > HIGH > NORMAL > LOW)
        orderBy.priority = sortOrder
      } else {
        orderBy[sortBy] = sortOrder
      }

      // Get notifications
      const notifications = await this.prisma.notification.findMany({
        where,
        orderBy,
        take: options.limit || 50,
        skip: options.offset || 0,
      })

      return {
        notifications: notifications.map(this.mapPrismaNotification),
        total,
        unreadCount
      }
    } catch (error) {
      logger.error('Error in enhanced notification retrieval:', error)
      throw new NotificationError('Failed to retrieve notifications', 'FETCH_FAILED')
    }
  }

  // Bulk operations for better performance
  async markMultipleAsRead(notificationIds: string[], userId: string): Promise<number> {
    try {
      const result = await this.prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId,
          status: { not: 'READ' }
        },
        data: {
          status: 'READ' as any,
          readAt: new Date(),
        },
      })

      logger.info(`Marked ${result.count} notifications as read for user ${userId}`)
      return result.count
    } catch (error) {
      logger.error('Error marking multiple notifications as read:', error)
      throw new NotificationError('Failed to mark notifications as read', 'UPDATE_FAILED')
    }
  }

  async deleteMultipleNotifications(notificationIds: string[], userId: string): Promise<number> {
    try {
      const result = await this.prisma.notification.deleteMany({
        where: {
          id: { in: notificationIds },
          userId
        }
      })

      logger.info(`Deleted ${result.count} notifications for user ${userId}`)
      return result.count
    } catch (error) {
      logger.error('Error deleting multiple notifications:', error)
      throw new NotificationError('Failed to delete notifications', 'DELETE_FAILED')
    }
  }

  // Clean up expired notifications
  async cleanupExpiredNotifications(): Promise<number> {
    try {
      const result = await this.prisma.notification.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      })

      logger.info(`Cleaned up ${result.count} expired notifications`)
      return result.count
    } catch (error) {
      logger.error('Error cleaning up expired notifications:', error)
      throw new NotificationError('Failed to cleanup expired notifications', 'CLEANUP_FAILED')
    }
  }

  // Get notification statistics for a user
  async getNotificationStats(userId: string): Promise<{
    total: number
    unread: number
    byType: Record<string, number>
    byPriority: Record<string, number>
    byChannel: Record<string, number>
  }> {
    try {
      const notifications = await this.prisma.notification.findMany({
        where: { userId },
        select: {
          type: true,
          priority: true,
          channels: true,
          status: true
        }
      })

      const stats = {
        total: notifications.length,
        unread: notifications.filter(n => n.status !== 'READ').length,
        byType: {} as Record<string, number>,
        byPriority: {} as Record<string, number>,
        byChannel: {} as Record<string, number>
      }

      // Count by type
      notifications.forEach(n => {
        stats.byType[n.type] = (stats.byType[n.type] || 0) + 1
      })

      // Count by priority
      notifications.forEach(n => {
        stats.byPriority[n.priority] = (stats.byPriority[n.priority] || 0) + 1
      })

      // Count by channel
      notifications.forEach(n => {
        const channels = Array.isArray(n.channels) ? n.channels : []
        channels.forEach((channel: any) => {
          if (typeof channel === 'string') {
            stats.byChannel[channel] = (stats.byChannel[channel] || 0) + 1
          }
        })
      })

      return stats
    } catch (error) {
      logger.error('Error getting notification stats:', error)
      throw new NotificationError('Failed to get notification statistics', 'STATS_FAILED')
    }
  }

  // Expose preferences service for external use
  getPreferencesService(): NotificationPreferencesService {
    return this.preferencesService
  }
}