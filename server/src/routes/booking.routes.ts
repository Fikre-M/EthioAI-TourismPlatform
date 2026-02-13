import { Router } from 'express';
import { authenticate, requireRoles } from '../middlewares/auth.middleware';
import { BookingController } from '../controllers/booking.controller';
import { validate, commonSchemas } from '../middlewares/validation.middleware';
import { userCache, invalidateCache } from '../middlewares/cache.middleware';
import { CacheTTL } from '../services/cache.service';
import {
  createBookingSchema,
  updateBookingSchema,
  bookingQuerySchema,
  updateBookingStatusSchema,
  validatePromoCodeSchema,
  cancelBookingSchema,
} from '../schemas/booking.schemas';

const router = Router();

/**
 * Booking Routes
 * All routes are prefixed with /api/bookings
 */

// Protected Routes (require authentication)
router.post('/',
  authenticate,
  validate({ body: createBookingSchema }),
  invalidateCache(['bookings:*']),
  BookingController.createBooking
);

router.get('/',
  authenticate,
  validate({ query: bookingQuerySchema }),
  userCache(CacheTTL.SHORT),
  BookingController.getBookings
);

router.get('/my-bookings',
  authenticate,
  validate({ query: bookingQuerySchema }),
  userCache(CacheTTL.SHORT),
  BookingController.getMyBookings
);

router.get('/upcoming',
  authenticate,
  userCache(CacheTTL.SHORT),
  BookingController.getUpcomingBookings
);

router.get('/past',
  authenticate,
  validate({ query: bookingQuerySchema }),
  userCache(CacheTTL.MEDIUM),
  BookingController.getPastBookings
);

router.get('/number/:bookingNumber',
  authenticate,
  BookingController.getBookingByNumber
);

router.get('/:id',
  authenticate,
  validate({ params: commonSchemas.uuidParam.params }),
  userCache(CacheTTL.SHORT),
  BookingController.getBookingById
);

router.put('/:id',
  authenticate,
  validate({
    params: commonSchemas.uuidParam.params,
    body: updateBookingSchema
  }),
  invalidateCache((req) => [`booking:${req.params.id}:*`, 'bookings:*']),
  BookingController.updateBooking
);

router.post('/:id/cancel',
  authenticate,
  validate({
    params: commonSchemas.uuidParam.params,
    body: cancelBookingSchema
  }),
  invalidateCache((req) => [`booking:${req.params.id}:*`, 'bookings:*']),
  BookingController.cancelBooking
);

router.post('/validate-promo',
  authenticate,
  validate({ body: validatePromoCodeSchema }),
  BookingController.validatePromoCode
);

// Admin Routes
router.patch('/:id/status',
  authenticate,
  requireRoles.admin,
  validate({
    params: commonSchemas.uuidParam.params,
    body: updateBookingStatusSchema
  }),
  invalidateCache((req) => [`booking:${req.params.id}:*`, 'bookings:*']),
  BookingController.updateBookingStatus
);

router.get('/admin/stats',
  authenticate,
  requireRoles.admin,
  userCache(CacheTTL.SHORT),
  BookingController.getBookingStats
);

export default router;