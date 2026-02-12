import { config } from '../config/index';
import { TooManyRequestsError } from './errors';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

/**
 * In-memory rate limiter for AI requests
 * In production, use Redis for distributed rate limiting
 */
export class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();

  /**
   * Check if request is within rate limits
   */
  async checkLimit(key: string, userId?: string): Promise<void> {
    const limitKey = userId ? `${key}:${userId}` : key;
    const now = Date.now();

    // Clean up expired entries
    this.cleanup();

    const entry = this.limits.get(limitKey);
    const windowMs = 60 * 1000; // 1 minute window
    const maxRequests = config.ai.rateLimiting.perMinute;

    if (!entry) {
      // First request
      this.limits.set(limitKey, {
        count: 1,
        resetTime: now + windowMs,
      });
      return;
    }

    if (now > entry.resetTime) {
      // Window expired, reset
      this.limits.set(limitKey, {
        count: 1,
        resetTime: now + windowMs,
      });
      return;
    }

    if (entry.count >= maxRequests) {
      const resetIn = Math.ceil((entry.resetTime - now) / 1000);
      throw new TooManyRequestsError(
        `Rate limit exceeded. Try again in ${resetIn} seconds.`
      );
    }

    // Increment count
    entry.count++;
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(key);
      }
    }
  }

  /**
   * Get current usage for a key
   */
  getUsage(key: string, userId?: string): { count: number; limit: number; resetTime: number } {
    const limitKey = userId ? `${key}:${userId}` : key;
    const entry = this.limits.get(limitKey);

    return {
      count: entry?.count || 0,
      limit: config.ai.rateLimiting.perMinute,
      resetTime: entry?.resetTime || 0,
    };
  }
}