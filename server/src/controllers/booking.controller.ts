import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { BookingService } from '../services/booking.service';
import { ResponseUtil } from '../utils/response';
import { log } from '../utils/logger';
import { asyncHandler } from '../middlewares/error.middleware';
import { 
  CreateBookingInput, 
  UpdateBookingInput, 
  BookingQueryInput,
  UpdateBookingStatusInput,
  ValidatePromoCodeInput,
  CancelBookingInput,
  BookingStatsQueryInput
} from '../schemas/booking.schemas';

export class BookingController {
  /**
   * Create a new booking
   * POST /api/bookings
   */
  static createBooking = asyncHandler(async (req: AuthRequest, res: Response) => {
    const data: CreateBookingInput = req.body;
    const userId = req.userId!;
    
    const booking = await BookingService.createBooking(data, userId);
    
    log.info('Booking created via API', { 
      bookingId: booking.id, 
      bookingNumber: booking.bookingNumber,
      userId, 
      ip: req.ip 
    });

    return ResponseUtil.created(res, { booking }, 'Booking created successfully');
  });

  /**
   * Get all bookings with filtering and pagination
   * GET /api/bookings
   */
  static getBookings = asyncHandler(async (req: AuthRequest, res: Response) => {
    const query: BookingQueryInput = req.query as any;
    
    const result = await BookingService.getBookings(query);
    
    return ResponseUtil.paginated(
      res, 
      result.bookings, 
      result.pagination, 
      'Bookings retrieved successfully'
    );
  });

  /**
   * Get booking by ID
   * GET /api/bookings/:id
   */
  static getBookingById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.userId;
    
    const booking = await BookingService.getBookingById(id, userId);
    
    return ResponseUtil.success(res, { booking }, 'Booking retrieved successfully');
  });

  /**
   * Update booking
   * PUT /api/bookings/:id
   */
  static updateBooking = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const data: UpdateBookingInput = req.body;
    const userId = req.userId!;
    
    const booking = await BookingService.updateBooking(id, data, userId);
    
    log.info('Booking updated via API', { bookingId: id, userId, ip: req.ip });

    return ResponseUtil.success(res, { booking }, 'Booking updated successfully');
  });

  /**
   * Cancel booking
   * POST /api/bookings/:id/cancel
   */
  static cancelBooking = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const data: CancelBookingInput = req.body;
    const userId = req.userId!;
    
    const booking = await BookingService.cancelBooking(id, data, userId);
    
    log.info('Booking cancelled via API', { 
      bookingId: id, 
      userId, 
      reason: data.reason,
      ip: req.ip 
    });

    return ResponseUtil.success(res, { booking }, 'Booking cancelled successfully');
  });

  /**
   * Update booking status (admin only)
   * PATCH /api/bookings/:id/status
   */
  static updateBookingStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const data: UpdateBookingStatusInput = req.body;
    const userId = req.userId!;
    
    const booking = await BookingService.updateBookingStatus(id, data, userId);
    
    log.info('Booking status updated via API', { 
      bookingId: id, 
      userId, 
      newStatus: data.status,
      ip: req.ip 
    });

    return ResponseUtil.success(res, { booking }, 'Booking status updated successfully');
  });

  /**
   * Validate promo code
   * POST /api/bookings/validate-promo
   */
  static validatePromoCode = asyncHandler(async (req: AuthRequest, res: Response) => {
    const data: ValidatePromoCodeInput = req.body;
    
    const result = await BookingService.validatePromoCode(data);
    
    if (!result.valid) {
      return ResponseUtil.badRequest(res, result.message || 'Invalid promo code');
    }
    
    return ResponseUtil.success(res, result, result.message || 'Promo code is valid');
  });

  /**
   * Get user's bookings
   * GET /api/bookings/my-bookings
   */
  static getMyBookings = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const query: Partial<BookingQueryInput> = req.query as any;
    
    const result = await BookingService.getUserBookings(userId, query);
    
    return ResponseUtil.paginated(
      res, 
      result.bookings, 
      result.pagination, 
      'Your bookings retrieved successfully'
    );
  });

  /**
   * Get booking statistics
   * GET /api/bookings/stats
   */
  static getBookingStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    const query: BookingStatsQueryInput = req.query as any;
    
    const stats = await BookingService.getBookingStats(query);
    
    return ResponseUtil.success(res, stats, 'Booking statistics retrieved successfully');
  });

  /**
   * Get booking by booking number
   * GET /api/bookings/number/:bookingNumber
   */
  static getBookingByNumber = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { bookingNumber } = req.params;
    const userId = req.userId;
    
    const result = await BookingService.getBookings({
      bookingNumber,
      page: 1,
      limit: 1,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    
    if (result.bookings.length === 0) {
      return ResponseUtil.notFound(res, 'Booking not found');
    }
    
    const booking = result.bookings[0];
    
    // Verify ownership if not admin
    if (userId && booking.userId !== userId) {
      return ResponseUtil.forbidden(res, 'You do not have permission to view this booking');
    }
    
    return ResponseUtil.success(res, { booking }, 'Booking retrieved successfully');
  });

  /**
   * Get upcoming bookings
   * GET /api/bookings/upcoming
   */
  static getUpcomingBookings = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const limit = parseInt(req.query.limit as string) || 5;
    
    const result = await BookingService.getUserBookings(userId, {
      status: 'CONFIRMED',
      startDateFrom: new Date(),
      sortBy: 'startDate',
      sortOrder: 'asc',
      limit,
      page: 1,
    });
    
    return ResponseUtil.success(
      res, 
      { bookings: result.bookings }, 
      'Upcoming bookings retrieved successfully'
    );
  });

  /**
   * Get past bookings
   * GET /api/bookings/past
   */
  static getPastBookings = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const query: Partial<BookingQueryInput> = req.query as any;
    
    const result = await BookingService.getUserBookings(userId, {
      ...query,
      status: 'COMPLETED',
      sortBy: 'startDate',
      sortOrder: 'desc',
    });
    
    return ResponseUtil.paginated(
      res, 
      result.bookings, 
      result.pagination, 
      'Past bookings retrieved successfully'
    );
  });
}
