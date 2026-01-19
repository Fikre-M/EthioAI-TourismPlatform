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
}

// Create Redis instances
export const redisClient = new Redis(redisConfig)
export const redisSubscriber = new Redis(redisConfig)
export const redisPublisher = new Redis(redisConfig)

// Redis connection event handlers
redisClient.on('connect', () => {
  logger.info('Redis client connected')
})

redisClient.on('ready', () => {
  logger.info('Redis client ready')
})

redisClient.on('error', (error) => {
  logger.error('Redis client error:', error)
})

redisClient.on('close', () => {
  logger.warn('Redis client connection closed')
})

redisClient.on('reconnecting', () => {
  logger.info('Redis client reconnecting')
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

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Closing Redis connections...')
  await Promise.all([
    redisClient.quit(),
    redisSubscriber.quit(),
    redisPublisher.quit()
  ])
  logger.info('Redis connections closed')
})

process.on('SIGTERM', async () => {
  logger.info('Closing Redis connections...')
  await Promise.all([
    redisClient.quit(),
    redisSubscriber.quit(),
    redisPublisher.quit()
  ])
  logger.info('Redis connections closed')
})

export default redisClient