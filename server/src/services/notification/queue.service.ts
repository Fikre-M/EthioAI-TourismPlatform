import { Job } from 'bullmq'
import {
  notificationQueue,
  pushNotificationQueue,
  emailNotificationQueue,
  smsNotificationQueue,
  QueueManager
} from '../../config/queue.config'
import {
  NotificationJob,
  QueueStats,
  DeliveryChannel,
  NotificationError,
  NotificationPriority
} from '../../types/notification.types'
import logger from '../../utils/logger'

export interface QueueService {
  addNotificationJob(notification: NotificationJob): Promise<Job>
  addBatchJobs(notifications: NotificationJob[]): Promise<Job[]>
  processJob(job: Job): Promise<void>
  retryFailedJob(jobId: string): Promise<void>
  getQueueStats(): Promise<QueueStats>
}

export class NotificationQueueService implements QueueService {
  async addNotificationJob(notification: NotificationJob): Promise<Job> {
    try {
      // Determine which queues to use based on channels
      const jobs: Promise<Job>[] = []

      for (const channel of notification.channels) {
        const queue = this.getQueueForChannel(channel)
        const jobOptions = this.getJobOptions(notification)

        jobs.push(
          queue.add(
            `${channel}-notification`,
            notification,
            jobOptions
          )
        )
      }

      // Wait for all jobs to be added
      const addedJobs = await Promise.all(jobs)
      
      logger.info(`Added ${addedJobs.length} notification jobs for notification ${notification.id}`)
      return addedJobs[0] // Return the first job as primary reference
    } catch (error) {
      logger.error('Error adding notification job:', error)
      throw new NotificationError('Failed to queue notification', 'QUEUE_FAILED')
    }
  }

  async addBatchJobs(notifications: NotificationJob[]): Promise<Job[]> {
    try {
      const allJobs: Job[] = []

      // Group notifications by channel for efficient batching
      const channelGroups = this.groupNotificationsByChannel(notifications)

      for (const [channel, channelNotifications] of channelGroups.entries()) {
        const queue = this.getQueueForChannel(channel)
        
        const batchJobs = channelNotifications.map(notification => ({
          name: `${channel}-notification`,
          data: notification,
          opts: this.getJobOptions(notification)
        }))

        const batchResult = await queue.addBulk(batchJobs)
        allJobs.push(...batchResult)
      }

      logger.info(`Added ${allJobs.length} batch notification jobs`)
      
      return allJobs
    } catch (error) {
      logger.error('Error adding batch notification jobs:', error)
      throw new NotificationError('Failed to queue batch notifications', 'BATCH_QUEUE_FAILED')
    }
  }

  async processJob(job: Job): Promise<void> {
    try {
      const notification = job.data as NotificationJob
      logger.info(`Processing notification job ${job.id} for user ${notification.userId}`)

      // Job processing will be implemented by specific channel processors
      // This is a placeholder for the base processing logic
      
      // Update job progress
      await job.updateProgress(50)
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Mark as completed
      await job.updateProgress(100)
      
      logger.info(`Completed notification job ${job.id}`)
    } catch (error) {
      logger.error(`Error processing job ${job.id}:`, error)
      throw error
    }
  }

  async retryFailedJob(jobId: string): Promise<void> {
    try {
      // Try to find the job in all queues
      const queues = [
        notificationQueue,
        pushNotificationQueue,
        emailNotificationQueue,
        smsNotificationQueue
      ]

      for (const queue of queues) {
        const job = await queue.getJob(jobId)
        if (job && job.failedReason) {
          await job.retry()
          logger.info(`Retried failed job ${jobId}`)
          return
        }
      }

      throw new NotificationError('Job not found or not failed', 'JOB_NOT_FOUND')
    } catch (error) {
      logger.error(`Error retrying job ${jobId}:`, error)
      throw error
    }
  }

  async getQueueStats(): Promise<QueueStats> {
    try {
      const [
        notificationStats,
        pushStats,
        emailStats,
        smsStats
      ] = await Promise.all([
        QueueManager.getQueueStats('notifications'),
        QueueManager.getQueueStats('push-notifications'),
        QueueManager.getQueueStats('email-notifications'),
        QueueManager.getQueueStats('sms-notifications')
      ])

      // Aggregate stats from all queues
      return {
        waiting: notificationStats.waiting + pushStats.waiting + emailStats.waiting + smsStats.waiting,
        active: notificationStats.active + pushStats.active + emailStats.active + smsStats.active,
        completed: notificationStats.completed + pushStats.completed + emailStats.completed + smsStats.completed,
        failed: notificationStats.failed + pushStats.failed + emailStats.failed + smsStats.failed,
        delayed: notificationStats.delayed + pushStats.delayed + emailStats.delayed + smsStats.delayed,
      }
    } catch (error) {
      logger.error('Error getting queue stats:', error)
      throw new NotificationError('Failed to get queue statistics', 'STATS_FAILED')
    }
  }

  // Queue management methods
  async pauseAllQueues(): Promise<void> {
    await Promise.all([
      QueueManager.pauseQueue('notifications'),
      QueueManager.pauseQueue('push-notifications'),
      QueueManager.pauseQueue('email-notifications'),
      QueueManager.pauseQueue('sms-notifications')
    ])
    logger.info('All notification queues paused')
  }

  async resumeAllQueues(): Promise<void> {
    await Promise.all([
      QueueManager.resumeQueue('notifications'),
      QueueManager.resumeQueue('push-notifications'),
      QueueManager.resumeQueue('email-notifications'),
      QueueManager.resumeQueue('sms-notifications')
    ])
    logger.info('All notification queues resumed')
  }

  async cleanAllQueues(grace: number = 24 * 60 * 60 * 1000): Promise<void> {
    await Promise.all([
      QueueManager.cleanQueue('notifications', grace),
      QueueManager.cleanQueue('push-notifications', grace),
      QueueManager.cleanQueue('email-notifications', grace),
      QueueManager.cleanQueue('sms-notifications', grace)
    ])
    logger.info('All notification queues cleaned')
  }

  // Helper methods
  private getQueueForChannel(channel: DeliveryChannel) {
    switch (channel) {
      case DeliveryChannel.PUSH:
        return pushNotificationQueue
      case DeliveryChannel.EMAIL:
        return emailNotificationQueue
      case DeliveryChannel.SMS:
        return smsNotificationQueue
      case DeliveryChannel.IN_APP:
      default:
        return notificationQueue
    }
  }

  private getJobOptions(notification: NotificationJob) {
    const priority = this.getPriorityValue(notification.priority)
    
    return {
      priority,
      delay: notification.delay || 0,
      attempts: notification.attempts || 3,
      backoff: {
        type: 'exponential' as const,
        delay: 2000,
      },
      removeOnComplete: 100,
      removeOnFail: 50,
    }
  }

  private getPriorityValue(priority: number): number {
    // BullMQ uses higher numbers for higher priority
    // Our enum: LOW=1, NORMAL=2, HIGH=3, CRITICAL=4
    // Convert to BullMQ priority (1-10 scale)
    switch (priority) {
      case NotificationPriority.CRITICAL:
        return 10
      case NotificationPriority.HIGH:
        return 7
      case NotificationPriority.NORMAL:
        return 5
      case NotificationPriority.LOW:
        return 2
      default:
        return 5
    }
  }

  private groupNotificationsByChannel(notifications: NotificationJob[]): Map<DeliveryChannel, NotificationJob[]> {
    const groups = new Map<DeliveryChannel, NotificationJob[]>()

    for (const notification of notifications) {
      for (const channel of notification.channels) {
        if (!groups.has(channel)) {
          groups.set(channel, [])
        }
        groups.get(channel)!.push(notification)
      }
    }

    return groups
  }

  // Rate limiting methods
  async isRateLimited(userId: string, channel: DeliveryChannel): Promise<boolean> {
    try {
      const key = `rate_limit:${channel}:${userId}`
      const queue = this.getQueueForChannel(channel)
      
      // Get recent jobs for this user and channel
      const recentJobs = await queue.getJobs(['completed', 'active'], 0, 100)
      const userJobs = recentJobs.filter(job => 
        job.data.userId === userId && 
        job.timestamp && 
        Date.now() - job.timestamp < 60000 // Last minute
      )

      // Rate limits by channel
      const limits = {
        [DeliveryChannel.PUSH]: 10,    // 10 per minute
        [DeliveryChannel.EMAIL]: 5,    // 5 per minute
        [DeliveryChannel.SMS]: 3,      // 3 per minute
        [DeliveryChannel.IN_APP]: 50,  // 50 per minute
      }

      return userJobs.length >= (limits[channel] || 10)
    } catch (error) {
      logger.error('Error checking rate limit:', error)
      return false // Don't block on error
    }
  }

  async batchSimilarNotifications(notifications: NotificationJob[]): Promise<NotificationJob[]> {
    // Group similar notifications for batching
    const groups = new Map<string, NotificationJob[]>()

    for (const notification of notifications) {
      // Create a key based on user, type, and channel combination
      const key = `${notification.userId}:${notification.type}:${notification.channels.join(',')}`
      
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(notification)
    }

    const batchedNotifications: NotificationJob[] = []

    for (const [key, groupNotifications] of groups.entries()) {
      if (groupNotifications.length === 1) {
        batchedNotifications.push(groupNotifications[0])
      } else {
        // Create a batched notification
        const firstNotification = groupNotifications[0]
        const batchedNotification: NotificationJob = {
          ...firstNotification,
          id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          payload: {
            ...firstNotification.payload,
            title: `${groupNotifications.length} notifications`,
            content: `You have ${groupNotifications.length} new notifications`,
            data: {
              ...firstNotification.payload.data,
              batchedNotifications: groupNotifications.map(n => ({
                id: n.id,
                title: n.payload.title,
                content: n.payload.content
              }))
            }
          }
        }
        batchedNotifications.push(batchedNotification)
      }
    }

    logger.info(`Batched ${notifications.length} notifications into ${batchedNotifications.length} jobs`)
    return batchedNotifications
  }
}