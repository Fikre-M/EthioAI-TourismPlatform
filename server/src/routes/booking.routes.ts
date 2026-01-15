import { Router } from 'express';
import { BookingController } from '../controllers/booking.controller';
import { authenticate, requireRoles } from '../middlewares/auth.middleware';
import { validate, commonSchemas } from '../middlewares/validation.middleware';
import {
  createBookingSchema,
  updateBookingSchema,
  bookingQuerySchema,
  updateBookingStatusSchema,
  validatePromoCodeSchema,
  cancelBookingSchema,
  bookingStatsQuerySchema,
} from '../schemas/booking.schemas';

const router = Router();

/**
 * Booking Routes
 * All routes are prefixed with /api/bookings
 */

// Public routes (require authentication)
router.post('/validate-promo', 
  authenticate,
  validate({ body: validatePromoCodeSchema }), 
  BookingController.validatePromoCode
);

// Protected routes (user must be authenticated)
router.post('/', 
  authenticate, 
  validate({ body: createBookingSchema }), 
  BookingController.createBooking
);

router.get('/my-bookings', 
  authenticate,
  validate({ query: bookingQuerySchema }), 
  BookingController.getMyBookings
);

router.get('/upcoming', 
  authenticate, 
  BookingController.getUpcomingBookings
);

router.get('/past', 
  authenticate,
  validate({ query: bookingQuerySchema }), 
  BookingController.getPastBookings
);

router.get('/number/:bookingNumber', 
  authenticate, 
  BookingController.getBookingByNumber
);

router.get('/:id', 
  authenticate,
  validate({ params: commonSchemas.uuidParam.params }), 
  BookingController.getBookingById
);

router.put('/:id', 
  authenticate,
  validate({ 
    params: commonSchemas.uuidParam.params,
    body: updateBookingSchema 
  }), 
  BookingController.updateBooking
);

router.post('/:id/cancel', 
  authenticate,
  validate({ 
    params: commonSchemas.uuidParam.params,
    body: cancelBookingSchema 
  }), 
  BookingController.cancelBooking
);

// Admin routes
router.get('/', 
  authenticate, 
  requireRoles.admin,
  validate({ query: bookingQuerySchema }), 
  BookingController.getBookings
);

router.patch('/:id/status', 
  authenticate, 
  requireRoles.admin,
  validate({ 
    params: commonSchemas.uuidParam.params,
    body: updateBookingStatusSchema 
  }), 
  BookingController.updateBookingStatus
);

router.get('/admin/stats', 
  authenticate, 
  requireRoles.admin,
  validate({ query: bookingStatsQuerySchema }), 
  BookingController.getBookingStats
);

export default router;
