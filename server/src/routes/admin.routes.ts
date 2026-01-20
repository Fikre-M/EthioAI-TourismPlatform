import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import { z } from 'zod';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireRole(['ADMIN']));

/**
 * Dashboard Routes
 */
router.get('/dashboard/stats', AdminController.getDashboardStats);
router.get('/dashboard/activities', AdminController.getRecentActivities);
router.get('/dashboard/health', AdminController.getSystemHealth);

/**
 * User Management Routes
 */
router.get('/users', AdminController.getUsers);
router.get('/users/:userId', AdminController.getUserDetails);
router.put('/users/:userId', AdminController.updateUser);
router.patch('/users/:userId/status', 
  validate({
    body: z.object({
      suspended: z.boolean(),
      reason: z.string().optional()
    })
  }),
  AdminController.toggleUserStatus
);

/**
 * Tour Management Routes
 */
router.get('/tours', AdminController.getTours);
router.patch('/tours/:tourId/status',
  validate({
    body: z.object({
      status: z.enum(['DRAFT', 'PUBLISHED', 'SUSPENDED', 'ARCHIVED']),
      reason: z.string().optional()
    })
  }),
  AdminController.updateTourStatus
);
router.patch('/tours/:tourId/featured',
  validate({
    body: z.object({
      featured: z.boolean()
    })
  }),
  AdminController.toggleTourFeatured
);

/**
 * Booking Management Routes
 */
router.get('/bookings', AdminController.getBookings);
router.patch('/bookings/:bookingId/status',
  validate({
    body: z.object({
      status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'REFUNDED']),
      reason: z.string().optional()
    })
  }),
  AdminController.updateBookingStatus
);

/**
 * Payment Management Routes
 */
router.get('/payments', AdminController.getPayments);
router.post('/payments/:paymentId/refund',
  validate({
    body: z.object({
      amount: z.number().positive().optional(),
      reason: z.string().min(1)
    })
  }),
  AdminController.processRefund
);

/**
 * Review Management Routes
 */
router.get('/reviews', AdminController.getReviews);
router.patch('/reviews/:reviewId/moderate',
  validate({
    body: z.object({
      status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
      reason: z.string().optional()
    })
  }),
  AdminController.moderateReview
);

/**
 * Content Management Routes
 */
router.get('/content', AdminController.getCulturalContent);
router.patch('/content/:contentId/status',
  validate({
    body: z.object({
      status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
      reason: z.string().optional()
    })
  }),
  AdminController.updateContentStatus
);

/**
 * Analytics Routes
 */
router.get('/analytics', AdminController.getAnalytics);
router.get('/analytics/revenue', AdminController.getRevenueAnalytics);

/**
 * System Management Routes
 */
router.get('/system/logs', AdminController.getSystemLogs);
router.get('/system/settings', AdminController.getSystemSettings);
router.put('/system/settings', AdminController.updateSystemSettings);

/**
 * Bulk Operations Routes
 */
router.post('/bulk/users',
  validate({
    body: z.object({
      userIds: z.array(z.string().uuid()),
      action: z.enum(['suspend', 'unsuspend', 'delete', 'update']),
      data: z.object({}).optional()
    })
  }),
  AdminController.bulkUpdateUsers
);

/**
 * Export Routes
 */
router.post('/export',
  validate({
    body: z.object({
      type: z.enum(['users', 'bookings', 'payments', 'reviews', 'tours']),
      format: z.enum(['csv', 'xlsx', 'json']).default('csv'),
      filters: z.object({}).optional()
    })
  }),
  AdminController.exportData
);

export default router;