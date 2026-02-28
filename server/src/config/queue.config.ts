import { Queue, Worker, QueueOptions, WorkerOptions } from 'bullmq'
import { redisClient, isRedisConnected } from './redis.config'
import logger from '../utils/logger'
import { NotificationJob } from '../types/notification.types'

// Queue configuration with graceful fallback
const queueOptions: QueueOptions = {
  connection: redisClient,
  defaultJobOptions: {
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 50,      // Keep last 50 failed jobs
    attempts: 3,           // Retry failed jobs 3 times
    backoff: {
      type: 'exponential',
      delay: 2000,         // Start with 2 second delay
    },
  },
}

// Worker configuration
const workerOptions: WorkerOptions = {
  connection: redisClient,
  concurrency: 10,         // Process up to 10 jobs concurrently
  maxStalledCount: 1,      // Max number of stalled jobs
  stalledInterval: 30000,  // Check for stalled jobs every 30 seconds
}

// Create notification queues with error handling
let notificationQueue: Queue<NotificationJob> | null = null
let pushNotificationQueue: Queue<NotificationJob> | null = null
let emailNotificationQueue: Queue<NotificationJob> | null = null
let smsNotificationQueue: Queue<NotificationJob> | null = null

try {
  notificationQueue = new Queue<NotificationJob>('notifications', queueOptions)
  pushNotificationQueue = new Queue<NotificationJob>('push-notifications', queueOptions)
  emailNotificationQueue = new Queue<NotificationJob>('email-notifications', queueOptions)
  smsNotificationQueue = new Queue<NotificationJob>('sms-notifications', queueOptions)
  
  // Queue event handlers
  const setupQueueEvents = (queue: Queue, name: string) => {
    queue.on('error', (error: any) => {
      logger.error(`Queue ${name} error:`, error)
    })
  }

  // Setup events for all queues
  setupQueueEvents(notificationQueue, 'notifications')
  setupQueueEvents(pushNotificationQueue, 'push-notifications')
  setupQueueEvents(emailNotificationQueue, 'email-notifications')
  setupQueueEvents(smsNotificationQueue, 'sms-notifications')
  
  logger.info('✅ Notification queues initialized')
} catch (error) {
  logger.warn('⚠️ Failed to initialize notification queues - continuing without queue support:', error)
}

export { notificationQueue, pushNotificationQueue, emailNotificationQueue, smsNotificationQueue }

// Queue management utilities with graceful fallback
export class QueueManager {
  static async getQueueStats(queueName: string) {
    if (!isRedisConnected()) {
      logger.warn('Redis not connected, cannot get queue stats')
      return {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
      }
    }

    const queue = this.getQueue(queueName)
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`)
    }

    try {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        queue.getWaiting(),
        queue.getActive(),
        queue.getCompleted(),
        queue.getFailed(),
        queue.getDelayed(),
      ])

      return {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
      }
    } catch (error) {
      logger.error('Error getting queue stats:', error)
      return {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
      }
    }
  }

  static async pauseQueue(queueName: string) {
    if (!isRedisConnected()) {
      logger.warn('Redis not connected, cannot pause queue')
      return
    }

    const queue = this.getQueue(queueName)
    if (queue) {
      try {
        await queue.pause()
        logger.info(`Queue ${queueName} paused`)
      } catch (error) {
        logger.error(`Error pausing queue ${queueName}:`, error)
      }
    }
  }

  static async resumeQueue(queueName: string) {
    if (!isRedisConnected()) {
      logger.warn('Redis not connected, cannot resume queue')
      return
    }

    const queue = this.getQueue(queueName)
    if (queue) {
      try {
        await queue.resume()
        logger.info(`Queue ${queueName} resumed`)
      } catch (error) {
        logger.error(`Error resuming queue ${queueName}:`, error)
      }
    }
  }

  static async cleanQueue(queueName: string, grace: number = 0, limit: number = 100) {
    if (!isRedisConnected()) {
      logger.warn('Redis not connected, cannot clean queue')
      return
    }

    const queue = this.getQueue(queueName)
    if (queue) {
      try {
        await queue.clean(grace, limit, 'completed')
        await queue.clean(grace, limit, 'failed')
        logger.info(`Queue ${queueName} cleaned`)
      } catch (error) {
        logger.error(`Error cleaning queue ${queueName}:`, error)
      }
    }
  }

  private static getQueue(queueName: string): Queue | null {
    switch (queueName) {
      case 'notifications':
        return notificationQueue
      case 'push-notifications':
        return pushNotificationQueue
      case 'email-notifications':
        return emailNotificationQueue
      case 'sms-notifications':
        return smsNotificationQueue
      default:
        return null
    }
  }
}

// Graceful shutdown
const gracefulShutdown = async () => {
  if (!isRedisConnected()) {
    logger.info('Redis not connected, skipping queue shutdown')
    return
  }

  logger.info('Closing notification queues...')
  
  try {
    const closePromises = []
    if (notificationQueue) closePromises.push(notificationQueue.close())
    if (pushNotificationQueue) closePromises.push(pushNotificationQueue.close())
    if (emailNotificationQueue) closePromises.push(emailNotificationQueue.close())
    if (smsNotificationQueue) closePromises.push(smsNotificationQueue.close())
    
    await Promise.all(closePromises)
    logger.info('Notification queues closed')
  } catch (error) {
    logger.error('Error closing notification queues:', error)
  }
}

process.on('SIGINT', gracefulShutdown)
process.on('SIGTERM', gracefulShutdown)

export { workerOptions }