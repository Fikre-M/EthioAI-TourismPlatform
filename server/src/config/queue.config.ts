import { config as dotenvConfig } from 'dotenv';

// Load environment variables first
dotenvConfig();

export const config = {
  // Server configuration
  server: {
    port: parseInt(process.env.PORT || '5000', 10),
    host: process.env.HOST || 'localhost',
    nodeEnv: process.env.NODE_ENV || 'development',
    apiPrefix: process.env.API_PREFIX || '/api',
  },

  // Database configuration
  database: {
    url: process.env.DATABASE_URL || 'mysql://root:password@localhost:3306/ethioai_tourism',
  },

  // Redis configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB || '0', 10),
    url: process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`,
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    accessSecret: process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'your-access-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'your-refresh-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // Client configuration
  client: {
    url: process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:3002',
  },

  // Email configuration
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
    from: process.env.EMAIL_FROM || 'noreply@ethioai.com',
  },

  // File upload configuration
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  },

  // Cloudinary configuration
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },

  // Payment configuration
  payment: {
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY || '',
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    },
    chapa: {
      secretKey: process.env.CHAPA_SECRET_KEY || '',
      publicKey: process.env.CHAPA_PUBLIC_KEY || '',
      webhookSecret: process.env.CHAPA_WEBHOOK_SECRET || '',
    },
  },

  // Firebase configuration
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
  },

  // Security configuration
  security: {
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },

  // OpenAI configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2000', 10),
    organizationId: process.env.OPENAI_ORGANIZATION_ID || '',
  },

  // AI Services configuration
  ai: {
    // Anthropic Claude
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY || '',
      model: process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307',
      maxTokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS || '2000', 10),
    },

    // Google Gemini
    google: {
      apiKey: process.env.GOOGLE_AI_API_KEY || '',
      model: process.env.GOOGLE_AI_MODEL || 'gemini-1.5-flash',
    },

    // Azure OpenAI
    azure: {
      apiKey: process.env.AZURE_OPENAI_API_KEY || '',
      endpoint: process.env.AZURE_OPENAI_ENDPOINT || '',
      deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || '',
      apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview',
    },

    // Hugging Face
    huggingface: {
      apiKey: process.env.HUGGINGFACE_API_KEY || '',
    },

    // Stability AI
    stability: {
      apiKey: process.env.STABILITY_API_KEY || '',
    },

    // ElevenLabs
    elevenlabs: {
      apiKey: process.env.ELEVENLABS_API_KEY || '',
    },

    // Rate limiting
    rateLimiting: {
      perMinute: parseInt(process.env.AI_RATE_LIMIT_PER_MINUTE || '60', 10),
      perHour: parseInt(process.env.AI_RATE_LIMIT_PER_HOUR || '1000', 10),
    },
  },

  // External APIs
  external: {
    mapbox: {
      secretToken: process.env.MAPBOX_SECRET_TOKEN || '',
    },
    weather: {
      apiKey: process.env.WEATHER_API_KEY || '',
    },
    currency: {
      apiKey: process.env.CURRENCY_API_KEY || '',
    },
    translation: {
      apiKey: process.env.TRANSLATION_API_KEY || '',
    },
  },

  // Admin configuration
  admin: {
    emails: process.env.ADMIN_EMAILS?.split(',') || ['admin@ethioai.com'],
  },

  // Feature flags
  features: {
    emailVerificationRequired: process.env.EMAIL_VERIFICATION_REQUIRED === 'true',
    maintenanceMode: process.env.MAINTENANCE_MODE === 'true',
    registrationEnabled: process.env.REGISTRATION_ENABLED !== 'false',
  },
};

// Validate required configuration
const requiredEnvVars = [
  'JWT_SECRET',
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

// Warn about missing optional but important configuration
const importantEnvVars = [
  'EMAIL_HOST',
  'EMAIL_USER',
  'EMAIL_PASS',
  'CLOUDINARY_CLOUD_NAME',
  'STRIPE_SECRET_KEY',
];

const missingImportantVars = importantEnvVars.filter(envVar => !process.env[envVar]);

if (missingImportantVars.length > 0 && config.server.nodeEnv === 'production') {
  console.warn('Missing important environment variables for production:', missingImportantVars);
}

export default config;
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
import Redis from 'ioredis'
import logger from '../utils/logger'

// Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: 30000,
  connectTimeout: 10000,
  commandTimeout: 5000,
  enableOfflineQueue: false, // Don't queue commands when disconnected
}

// Track Redis availability
let isRedisAvailable = false

// Create Redis instances with graceful fallback
export const redisClient = new Redis(redisConfig)
export const redisSubscriber = new Redis(redisConfig)
export const redisPublisher = new Redis(redisConfig)

// Helper to check if Redis is available
export const isRedisConnected = () => isRedisAvailable

// Graceful Redis wrapper
export const safeRedisOperation = async <T>(
  operation: () => Promise<T>,
  fallback: T
): Promise<T> => {
  if (!isRedisAvailable) {
    logger.debug('Redis not available, using fallback')
    return fallback
  }
  
  try {
    return await operation()
  } catch (error) {
    logger.warn('Redis operation failed, using fallback:', error)
    return fallback
  }
}

// Redis connection event handlers
redisClient.on('connect', () => {
  logger.info('Redis client connected')
  isRedisAvailable = true
})

redisClient.on('ready', () => {
  logger.info('Redis client ready')
  isRedisAvailable = true
})

redisClient.on('error', (error) => {
  logger.error('Redis client error:', error)
  isRedisAvailable = false
})

redisClient.on('close', () => {
  logger.warn('Redis client connection closed')
  isRedisAvailable = false
})

redisClient.on('reconnecting', () => {
  logger.info('Redis client reconnecting')
  isRedisAvailable = false
})

// Subscriber events
redisSubscriber.on('connect', () => {
  logger.info('Redis subscriber connected')
})

redisSubscriber.on('error', (error) => {
  logger.error('Redis subscriber error:', error)
})

// Publisher events
redisPublisher.on('connect', () => {
  logger.info('Redis publisher connected')
})

redisPublisher.on('error', (error) => {
  logger.error('Redis publisher error:', error)
})

// Attempt to connect (but don't crash if it fails)
const connectRedis = async () => {
  try {
    await redisClient.connect()
    logger.info('✅ Redis connected successfully')
  } catch (error) {
    logger.warn('⚠️ Redis connection failed - continuing without Redis:', error)
    isRedisAvailable = false
  }
}

// Connect on startup
connectRedis()

// Graceful shutdown
process.on('SIGINT', async () => {
  if (isRedisAvailable) {
    logger.info('Closing Redis connections...')
    try {
      await Promise.all([
        redisClient.quit(),
        redisSubscriber.quit(),
        redisPublisher.quit()
      ])
      logger.info('Redis connections closed')
    } catch (error) {
      logger.warn('Error closing Redis connections:', error)
    }
  }
})

process.on('SIGTERM', async () => {
  if (isRedisAvailable) {
    logger.info('Closing Redis connections...')
    try {
      await Promise.all([
        redisClient.quit(),
        redisSubscriber.quit(),
        redisPublisher.quit()
      ])
      logger.info('Redis connections closed')
    } catch (error) {
      logger.warn('Error closing Redis connections:', error)
    }
  }
})

export { redisClient };
