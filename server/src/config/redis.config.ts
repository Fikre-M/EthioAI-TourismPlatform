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

export default redisClient