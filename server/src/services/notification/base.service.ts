import { PrismaClient } from '@prisma/client'
import {
  NotificationService as INotificationService,
  CreateNotificationRequest,
  Notification,
  NotificationFilters,
  NotificationPreferences,
  BroadcastMessage,
  UserSegment,
  NotificationError,
  ValidationError,
  NotFoundError,
  DeliveryChannel,
  NotificationType,
  NotificationPriority,
  NotificationStatus
} from '../../types/notification.types'
import logger from '../../utils/logger'

export class BaseNotificationService implements INotificationService {
  constructor(protected prisma: PrismaClient) {}

  async createNotification(request: CreateNotificationRequest): Promise<Notification> {
    try {
      // Validate request
      this.validateCreateRequest(request)

      // Get user preferences to determine actual channels
      const preferences = await this.getPreferences(request.userId)
      const effectiveChannels = this.determineEffectiveChannels(request, preferences)

      // Create notification in database
      const notification = await this.prisma.notification.create({
        data: {
          userId: request.userId,
          type: request.type as any, // Cast to Prisma enum
          title: request.title,
          content: request.content,
          data: request.data || {},
          channels: effectiveChannels as any, // Cast to JSON
          priority: this.mapPriorityToPrismaEnum(request.priority) as any, // Map to Prisma enum
          status: 'PENDING' as any, // Use string literal
          scheduledAt: request.scheduledAt,
          expiresAt: request.expiresAt,
        },
      })

      logger.info(`Notification created: ${notification.id} for user ${request.userId}`)
      return this.mapPrismaNotification(notification)
    } catch (error) {
      logger.error('Error creating notification:', error)
      throw new NotificationError('Failed to create notification', 'CREATE_FAILED')
    }
  }

  async getNotifications(userId: string, filters: NotificationFilters): Promise<Notification[]> {
    try {
      const where: any = { userId }

      // Apply filters
      if (filters.type) where.type = filters.type
      if (filters.status) where.status = filters.status
      if (filters.priority) where.priority = filters.priority
      if (filters.startDate || filters.endDate) {
        where.createdAt = {}
        if (filters.startDate) where.createdAt.gte = filters.startDate
        if (filters.endDate) where.createdAt.lte = filters.endDate
      }

      const notifications = await this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters.limit || 50,
        skip: filters.offset || 0,
      })

      return notifications.map(this.mapPrismaNotification)
    } catch (error) {
      logger.error('Error fetching notifications:', error)
      throw new NotificationError('Failed to fetch notifications', 'FETCH_FAILED')
    }
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      const notification = await this.prisma.notification.findFirst({
        where: { id: notificationId, userId },
      })

      if (!notification) {
        throw new NotFoundError('Notification not found')
      }

      await this.prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: 'READ' as any,
          readAt: new Date(),
        },
      })

      logger.info(`Notification ${notificationId} marked as read for user ${userId}`)
    } catch (error) {
      if (error instanceof NotFoundError) throw error
      logger.error('Error marking notification as read:', error)
      throw new NotificationError('Failed to mark notification as read', 'UPDATE_FAILED')
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    try {
      await this.prisma.notification.updateMany({
        where: {
          userId,
          status: { not: 'READ' as any },
        },
        data: {
          status: 'READ' as any,
          readAt: new Date(),
        },
      })

      logger.info(`All notifications marked as read for user ${userId}`)
    } catch (error) {
      logger.error('Error marking all notifications as read:', error)
      throw new NotificationError('Failed to mark all notifications as read', 'UPDATE_FAILED')
    }
  }

  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    try {
      const notification = await this.prisma.notification.findFirst({
        where: { id: notificationId, userId },
      })

      if (!notification) {
        throw new NotFoundError('Notification not found')
      }

      await this.prisma.notification.delete({
        where: { id: notificationId },
      })

      logger.info(`Notification ${notificationId} deleted for user ${userId}`)
    } catch (error) {
      if (error instanceof NotFoundError) throw error
      logger.error('Error deleting notification:', error)
      throw new NotificationError('Failed to delete notification', 'DELETE_FAILED')
    }
  }

  async updatePreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    try {
      const existingPrefs = await this.prisma.notificationPreferences.findUnique({
        where: { userId },
      })

      const updatedPrefs = await this.prisma.notificationPreferences.upsert({
        where: { userId },
        create: {
          userId,
          channels: preferences.channels || this.getDefaultChannelPreferences(),
          quietHours: preferences.quietHours as any || null,
          frequency: preferences.frequency || 'immediate',
          language: preferences.language || 'en',
          timezone: preferences.timezone || 'UTC',
        },
        update: {
          channels: preferences.channels as any || existingPrefs?.channels,
          quietHours: preferences.quietHours !== undefined ? preferences.quietHours as any : existingPrefs?.quietHours,
          frequency: preferences.frequency || existingPrefs?.frequency,
          language: preferences.language || existingPrefs?.language,
          timezone: preferences.timezone || existingPrefs?.timezone,
        },
      })

      logger.info(`Notification preferences updated for user ${userId}`)
      return this.mapPrismaPreferences(updatedPrefs)
    } catch (error) {
      logger.error('Error updating notification preferences:', error)
      throw new NotificationError('Failed to update preferences', 'UPDATE_FAILED')
    }
  }

  async getPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      let preferences = await this.prisma.notificationPreferences.findUnique({
        where: { userId },
      })

      // Create default preferences if none exist
      if (!preferences) {
        preferences = await this.prisma.notificationPreferences.create({
          data: {
            userId,
            channels: this.getDefaultChannelPreferences(),
            frequency: 'immediate',
            language: 'en',
            timezone: 'UTC',
          },
        })
      }

      return this.mapPrismaPreferences(preferences)
    } catch (error) {
      logger.error('Error fetching notification preferences:', error)
      throw new NotificationError('Failed to fetch preferences', 'FETCH_FAILED')
    }
  }

  async sendBroadcast(message: BroadcastMessage, audience: UserSegment): Promise<void> {
    try {
      // Get target user IDs based on audience criteria
      const userIds = await this.getAudienceUserIds(audience)

      // Create notifications for all target users
      const notifications = userIds.map(userId => ({
        userId,
        type: message.type as any,
        title: message.title,
        content: message.content,
        data: message.data || {},
        channels: message.channels as any,
        priority: this.mapPriorityToPrismaEnum(message.priority) as any,
        status: 'PENDING' as any,
      }))

      await this.prisma.notification.createMany({
        data: notifications,
      })

      logger.info(`Broadcast notification sent to ${userIds.length} users`)
    } catch (error) {
      logger.error('Error sending broadcast notification:', error)
      throw new NotificationError('Failed to send broadcast', 'BROADCAST_FAILED')
    }
  }

  // Helper methods
  protected validateCreateRequest(request: CreateNotificationRequest): void {
    if (!request.userId) {
      throw new ValidationError('User ID is required')
    }
    if (!request.title || request.title.trim().length === 0) {
      throw new ValidationError('Title is required')
    }
    if (!request.content || request.content.trim().length === 0) {
      throw new ValidationError('Content is required')
    }
    if (!request.channels || request.channels.length === 0) {
      throw new ValidationError('At least one delivery channel is required')
    }
  }

  protected mapPriorityToPrismaEnum(priority: NotificationPriority): string {
    switch (priority) {
      case NotificationPriority.LOW:
        return 'LOW'
      case NotificationPriority.NORMAL:
        return 'NORMAL'
      case NotificationPriority.HIGH:
        return 'HIGH'
      case NotificationPriority.CRITICAL:
        return 'CRITICAL'
      default:
        return 'NORMAL'
    }
  }

  protected determineEffectiveChannels(
    request: CreateNotificationRequest,
    preferences: NotificationPreferences
  ): DeliveryChannel[] {
    // For critical notifications, use all requested channels
    if (request.priority === NotificationPriority.CRITICAL) {
      return request.channels
    }

    // Check quiet hours for non-critical notifications
    if (this.isInQuietHours(preferences)) {
      return request.channels.filter(channel => 
        channel === DeliveryChannel.IN_APP // Always allow in-app during quiet hours
      )
    }

    // Use user preferences to filter channels
    const userChannels = preferences.channels[request.type] || []
    return request.channels.filter(channel => userChannels.includes(channel))
  }

  protected isInQuietHours(preferences: NotificationPreferences): boolean {
    if (!preferences.quietHours?.enabled) {
      return false
    }

    const now = new Date()
    const currentTime = now.toLocaleTimeString('en-US', {
      hour12: false,
      timeZone: preferences.timezone,
    }).slice(0, 5) // HH:mm format

    const { startTime, endTime } = preferences.quietHours

    // Handle quiet hours that span midnight
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime
    } else {
      return currentTime >= startTime && currentTime <= endTime
    }
  }

  protected getDefaultChannelPreferences(): any {
    return {
      [NotificationType.BOOKING_CONFIRMATION]: [DeliveryChannel.IN_APP, DeliveryChannel.EMAIL],
      [NotificationType.BOOKING_REMINDER]: [DeliveryChannel.IN_APP, DeliveryChannel.PUSH],
      [NotificationType.BOOKING_CANCELLED]: [DeliveryChannel.IN_APP, DeliveryChannel.EMAIL],
      [NotificationType.PAYMENT_SUCCESS]: [DeliveryChannel.IN_APP, DeliveryChannel.EMAIL],
      [NotificationType.PAYMENT_FAILED]: [DeliveryChannel.IN_APP, DeliveryChannel.PUSH, DeliveryChannel.EMAIL],
      [NotificationType.CHAT_MESSAGE]: [DeliveryChannel.IN_APP, DeliveryChannel.PUSH],
      [NotificationType.CHAT_MENTION]: [DeliveryChannel.IN_APP, DeliveryChannel.PUSH],
      [NotificationType.SYSTEM_ANNOUNCEMENT]: [DeliveryChannel.IN_APP],
      [NotificationType.SECURITY_ALERT]: [DeliveryChannel.IN_APP, DeliveryChannel.PUSH, DeliveryChannel.EMAIL],
      [NotificationType.PROMOTIONAL]: [DeliveryChannel.IN_APP],
    }
  }

  protected async getAudienceUserIds(audience: UserSegment): Promise<string[]> {
    if (audience.all) {
      const users = await this.prisma.user.findMany({
        select: { id: true },
      })
      return users.map(user => user.id)
    }

    if (audience.userIds) {
      return audience.userIds
    }

    const where: any = {}
    if (audience.roles) {
      where.role = { in: audience.roles }
    }
    if (audience.locations) {
      where.location = { in: audience.locations }
    }

    const users = await this.prisma.user.findMany({
      where,
      select: { id: true },
    })

    return users.map(user => user.id)
  }

  protected mapPrismaNotification(notification: any): Notification {
    return {
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      content: notification.content,
      data: notification.data,
      channels: notification.channels,
      priority: notification.priority,
      status: notification.status,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
      scheduledAt: notification.scheduledAt,
      expiresAt: notification.expiresAt,
    }
  }

  protected mapPrismaPreferences(preferences: any): NotificationPreferences {
    return {
      userId: preferences.userId,
      channels: preferences.channels,
      quietHours: preferences.quietHours,
      frequency: preferences.frequency,
      language: preferences.language,
      timezone: preferences.timezone,
      createdAt: preferences.createdAt,
      updatedAt: preferences.updatedAt,
    }
  }
}