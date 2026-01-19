import { PrismaClient } from '@prisma/client'
import { BaseNotificationService } from './base.service'
import { NotificationQueueService } from './queue.service'
import {
  CreateNotificationRequest,
  Notification,
  NotificationJob,
  DeliveryChannel,
  NotificationError
} from '../../types/notification.types'
import logger from '../../utils/logger'

export class NotificationService extends BaseNotificationService {
  private queueService: NotificationQueueService

  constructor(prisma: PrismaClient) {
    super(prisma)
    this.queueService = new NotificationQueueService()
  }

  async createNotification(request: CreateNotificationRequest): Promise<Notification> {
    try {
      // Create the notification record
      const notification = await super.createNotification(request)

      // Queue the notification for delivery
      await this.queueNotificationForDelivery(notification)

      return notification
    } catch (error) {
      logger.error('Error in NotificationService.createNotification:', error)
      throw error
    }
  }

  private async queueNotificationForDelivery(notification: Notification): Promise<void> {
    try {
      // Create notification job
      const job: NotificationJob = {
        id: notification.id,
        type: notification.type,
        userId: notification.userId,
        channels: notification.channels,
        payload: {
          title: notification.title,
          content: notification.content,
          data: notification.data,
        },
        priority: notification.priority,
        delay: notification.scheduledAt ? 
          Math.max(0, notification.scheduledAt.getTime() - Date.now()) : 0,
      }

      // Check rate limiting for each channel
      const allowedChannels: DeliveryChannel[] = []
      for (const channel of notification.channels) {
        const isRateLimited = await this.queueService.isRateLimited(notification.userId, channel)
        if (!isRateLimited) {
          allowedChannels.push(channel)
        } else {
          logger.warn(`Rate limited for user ${notification.userId} on channel ${channel}`)
        }
      }

      if (allowedChannels.length === 0) {
        logger.warn(`All channels rate limited for notification ${notification.id}`)
        return
      }

      // Update job with allowed channels
      job.channels = allowedChannels

      // Add job to queue
      await this.queueService.addNotificationJob(job)

      logger.info(`Queued notification ${notification.id} for delivery via channels: ${allowedChannels.join(', ')}`)
    } catch (error) {
      logger.error(`Error queuing notification ${notification.id}:`, error)
      throw new NotificationError('Failed to queue notification for delivery', 'QUEUE_FAILED')
    }
  }

  // Batch notification creation for better performance
  async createBatchNotifications(requests: CreateNotificationRequest[]): Promise<Notification[]> {
    try {
      const notifications: Notification[] = []
      const jobs: NotificationJob[] = []

      // Create all notifications
      for (const request of requests) {
        const notification = await super.createNotification(request)
        notifications.push(notification)

        // Prepare job for queuing
        const job: NotificationJob = {
          id: notification.id,
          type: notification.type,
          userId: notification.userId,
          channels: notification.channels,
          payload: {
            title: notification.title,
            content: notification.content,
            data: notification.data,
          },
          priority: notification.priority,
          delay: notification.scheduledAt ? 
            Math.max(0, notification.scheduledAt.getTime() - Date.now()) : 0,
        }
        jobs.push(job)
      }

      // Batch similar notifications for efficiency
      const batchedJobs = await this.queueService.batchSimilarNotifications(jobs)

      // Queue all jobs
      await this.queueService.addBatchJobs(batchedJobs)

      logger.info(`Created and queued ${notifications.length} notifications (${batchedJobs.length} jobs)`)
      return notifications
    } catch (error) {
      logger.error('Error creating batch notifications:', error)
      throw new NotificationError('Failed to create batch notifications', 'BATCH_CREATE_FAILED')
    }
  }

  // Get queue statistics
  async getQueueStats() {
    return this.queueService.getQueueStats()
  }

  // Queue management methods
  async pauseNotificationDelivery(): Promise<void> {
    await this.queueService.pauseAllQueues()
    logger.info('Notification delivery paused')
  }

  async resumeNotificationDelivery(): Promise<void> {
    await this.queueService.resumeAllQueues()
    logger.info('Notification delivery resumed')
  }

  async cleanupOldJobs(maxAge: number = 24 * 60 * 60 * 1000): Promise<void> {
    await this.queueService.cleanAllQueues(maxAge)
    logger.info('Old notification jobs cleaned up')
  }

  // Utility method to get unread count for a user
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const count = await this.prisma.notification.count({
        where: {
          userId,
          status: { not: 'READ' },
        },
      })
      return count
    } catch (error) {
      logger.error('Error getting unread count:', error)
      throw new NotificationError('Failed to get unread count', 'COUNT_FAILED')
    }
  }

  // Method to mark notifications as delivered (called by queue processors)
  async markAsDelivered(notificationId: string, channel: DeliveryChannel): Promise<void> {
    try {
      await this.prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: 'DELIVERED',
          updatedAt: new Date(),
        },
      })

      logger.info(`Notification ${notificationId} marked as delivered via ${channel}`)
    } catch (error) {
      logger.error(`Error marking notification ${notificationId} as delivered:`, error)
      throw new NotificationError('Failed to mark notification as delivered', 'UPDATE_FAILED')
    }
  }

  // Method to mark notifications as failed (called by queue processors)
  async markAsFailed(notificationId: string, channel: DeliveryChannel, error: string): Promise<void> {
    try {
      await this.prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: 'FAILED',
          data: {
            error,
            failedChannel: channel,
            failedAt: new Date().toISOString(),
          },
          updatedAt: new Date(),
        },
      })

      logger.error(`Notification ${notificationId} marked as failed via ${channel}: ${error}`)
    } catch (updateError) {
      logger.error(`Error marking notification ${notificationId} as failed:`, updateError)
      throw new NotificationError('Failed to mark notification as failed', 'UPDATE_FAILED')
    }
  }
}

// Export singleton instance
let notificationServiceInstance: NotificationService | null = null

export const getNotificationService = (prisma: PrismaClient): NotificationService => {
  if (!notificationServiceInstance) {
    notificationServiceInstance = new NotificationService(prisma)
  }
  return notificationServiceInstance
}