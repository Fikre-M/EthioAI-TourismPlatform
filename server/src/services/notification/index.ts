// Notification Service Exports
export { NotificationService, getNotificationService } from './notification.service'
export { BaseNotificationService } from './base.service'
export { NotificationQueueService } from './queue.service'

// Re-export types
export * from '../../types/notification.types'

// Re-export queue configurations only (redis.config is already included in queue.config)
export { 
  notificationQueue, 
  pushNotificationQueue, 
  emailNotificationQueue, 
  smsNotificationQueue,
  QueueManager,
  workerOptions
} from '../../config/queue.config'

export { 
  redisClient, 
  redisSubscriber, 
  redisPublisher,
  isRedisConnected,
  safeRedisOperation
} from '../../config/redis.config'