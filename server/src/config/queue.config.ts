import { Queue, Worker, QueueOptions, WorkerOptions } from 'bullmq'
import { redisClient } from './redis.config'
import logger from '../utils/logger'
import { NotificationJob } from '../types/notification.types'

// Queue configuration
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

// Create notification queues
export const notificationQueue = new Queue<NotificationJob>('notifications', queueOptions)
export const pushNotificationQueue = new Queue<NotificationJob>('push-notifications', queueOptions)
export const emailNotificationQueue = new Queue<NotificationJob>('email-notifications', queueOptions)
export const smsNotificationQueue = new Queue<NotificationJob>('sms-notifications', queueOptions)

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

// Queue management utilities
export class QueueManager {
  static async getQueueStats(queueName: string) {
    const queue = this.getQueue(queueName)
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`)
    }

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
  }

  static async pauseQueue(queueName: string) {
    const queue = this.getQueue(queueName)
    if (queue) {
      await queue.pause()
      logger.info(`Queue ${queueName} paused`)
    }
  }

  static async resumeQueue(queueName: string) {
    const queue = this.getQueue(queueName)
    if (queue) {
      await queue.resume()
      logger.info(`Queue ${queueName} resumed`)
    }
  }

  static async cleanQueue(queueName: string, grace: number = 0, limit: number = 100) {
    const queue = this.getQueue(queueName)
    if (queue) {
      await queue.clean(grace, limit, 'completed')
      await queue.clean(grace, limit, 'failed')
      logger.info(`Queue ${queueName} cleaned`)
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
  logger.info('Closing notification queues...')
  
  await Promise.all([
    notificationQueue.close(),
    pushNotificationQueue.close(),
    emailNotificationQueue.close(),
    smsNotificationQueue.close(),
  ])
  
  logger.info('Notification queues closed')
}

process.on('SIGINT', gracefulShutdown)
process.on('SIGTERM', gracefulShutdown)

export { workerOptions }