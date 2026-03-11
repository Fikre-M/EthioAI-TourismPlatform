import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index';
import { UnauthorizedError, ForbiddenError } from './error.middleware';
import { log } from '../utils/logger';
import { AuthRequest, UserRole } from '../modules/auth/auth.types';

/**
 * Authenticate user using JWT token
 */
export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const decoded = jwt.verify(token, config.jwt.accessSecret) as any;
      
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role as UserRole
      };
      
      next();
    } catch (jwtError: any) {
      if (jwtError.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Token expired');
      } else if (jwtError.name === 'JsonWebTokenError') {
        throw new UnauthorizedError('Invalid token');
      } else {
        throw new UnauthorizedError('Token verification failed');
      }
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication - doesn't fail if no token provided
 */
export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, config.jwt.accessSecret) as any;
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role as UserRole
      };
    } catch (jwtError) {
      // Ignore JWT errors for optional auth
      log.warn('Optional auth failed:', jwtError);
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Require specific roles
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user?.role) {
        throw new UnauthorizedError('Authentication required');
      }

      if (!allowedRoles.includes(req.user.role)) {
        log.security('Unauthorized role access attempt', req.user?.id, req.get('User-Agent'), {
          requiredRoles: allowedRoles,
          userRole: req.user.role,
          ip: req.ip
        });
        throw new ForbiddenError('Insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Require specific roles (exported as object for compatibility)
 */
export const requireRoles = {
  admin: requireRole(['ADMIN']),
  guideOrAdmin: requireRole(['GUIDE', 'ADMIN']),
  vendorOrAdmin: requireRole(['VENDOR', 'ADMIN']),
  guide: requireRole(['GUIDE']),
  vendor: requireRole(['VENDOR'])
};

/**
 * Validate refresh token
 */
export const validateRefreshToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      throw new UnauthorizedError('Refresh token required');
    }

    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as any;
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role as UserRole
      };
      next();
    } catch (jwtError: any) {
      if (jwtError.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Refresh token expired');
      } else {
        throw new UnauthorizedError('Invalid refresh token');
      }
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user owns resource or is admin
 */
export const requireOwnershipOrAdmin = (userIdField: string = 'userId') => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      const resourceUserId = req.params[userIdField] || req.body[userIdField];
      
      if (!resourceUserId) {
        throw new ForbiddenError('Resource user ID not found');
      }

      // Allow if user owns the resource or is admin
      if (req.user?.id === resourceUserId || req.user?.role === 'ADMIN') {
        return next();
      }

      log.security('Unauthorized resource access attempt', req.user?.id, req.get('User-Agent'), {
        resourceUserId,
        requestedBy: req.user?.id,
        ip: req.ip
      });

      throw new ForbiddenError('Access denied');
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Rate limiting by user
 */
export const rateLimitByUser = (maxRequests: number, windowMs: number) => {
  const userRequests = new Map<string, { count: number; resetTime: number }>();

  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return next(); // Skip rate limiting for unauthenticated requests
      }

      const now = Date.now();
      const userLimit = userRequests.get(userId);

      if (!userLimit || now > userLimit.resetTime) {
        // Reset or initialize user limit
        userRequests.set(userId, {
          count: 1,
          resetTime: now + windowMs
        });
        return next();
      }

      if (userLimit.count >= maxRequests) {
        log.security('Rate limit exceeded', userId, req.get('User-Agent'), {
          maxRequests,
          windowMs,
          ip: req.ip
        });
        
        res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again later.',
            retryAfter: Math.ceil((userLimit.resetTime - now) / 1000)
          }
        });
        return;
      }

      // Increment request count
      userLimit.count++;
      userRequests.set(userId, userLimit);

      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': (maxRequests - userLimit.count).toString(),
        'X-RateLimit-Reset': Math.ceil(userLimit.resetTime / 1000).toString()
      });

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if user's email is verified
 */
export const requireEmailVerification = (req: AuthRequest, res: Response, next: NextFunction): void => {
  // This would require checking the user's email verification status
  // For now, we'll skip this check if email verification is not required
  if (!config.features.emailVerificationRequired) {
    return next();
  }

  // TODO: Implement email verification check
  // const user = await getUserById(req.user?.id);
  // if (!user.isEmailVerified) {
  //   throw new ForbiddenError('Email verification required');
  // }

  next();
};
