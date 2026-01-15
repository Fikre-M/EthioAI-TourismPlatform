import { PrismaClient, Booking, BookingStatus, Prisma } from '@prisma/client';
import { 
  CreateBookingInput, 
  UpdateBookingInput, 
  BookingQueryInput,
  UpdateBookingStatusInput,
  ValidatePromoCodeInput,
  CancelBookingInput,
  BookingStatsQueryInput
} from '../schemas/booking.schemas';
import { 
  NotFoundError, 
  ValidationError, 
  ForbiddenError 
} from '../middlewares/error.middleware';
import { calculatePagination, PaginationMeta } from '../utils/response';
import { log } from '../utils/logger';

const prisma = new PrismaClient();

export class BookingService {
  /**
   * Generate unique booking number
   */
  private static async generateBookingNumber(): Promise<string> {
    const prefix = 'BK';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const bookingNumber = `${prefix}${timestamp}${random}`;
    
    // Check if booking number already exists
    const existing = await prisma.booking.findUnique({
      where: { bookingNumber },
    });
    
    if (existing) {
      // Recursively generate new number if collision
      return this.generateBookingNumber();
    }
    
    return bookingNumber;
  }

  /**
   * Create a new booking
   */
  static async createBooking(data: CreateBookingInput, userId: string): Promise<Booking> {
    // Verify tour exists and is available
    const tour = await prisma.tour.findUnique({
      where: { id: data.tourId },
    });

    if (!tour) {
      throw new NotFoundError('Tour not found');
    }

    if (tour.status !== 'PUBLISHED') {
      throw new ValidationError('Tour is not available for booking');
    }

    // Check availability
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    const conflictingBookings = await prisma.booking.findMany({
      where: {
        tourId: data.tourId,
        status: { in: ['CONFIRMED', 'PENDING'] },
        OR: [
          {
            startDate: { lte: endDate },
            endDate: { gte: startDate },
          },
        ],
      },
    });

    const totalBookedParticipants = conflictingBookings.reduce(
      (sum, booking) => sum + booking.adults + booking.children,
      0
    );

    const remainingCapacity = tour.maxGroupSize - totalBookedParticipants;
    const requestedParticipants = data.adults + data.children;

    if (requestedParticipants > remainingCapacity) {
      throw new ValidationError(
        `Only ${remainingCapacity} spots available for these dates`
      );
    }

    // Validate promo code if provided
    let discountAmount = data.discountAmount || 0;
    if (data.promoCode) {
      const promoValidation = await this.validatePromoCode({
        code: data.promoCode,
        tourId: data.tourId,
        totalAmount: data.totalPrice,
      });

      if (!promoValidation.valid) {
        throw new ValidationError(promoValidation.message || 'Invalid promo code');
      }

      discountAmount = promoValidation.discountAmount || 0;
    }

    // Generate booking number
    const bookingNumber = await this.generateBookingNumber();

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        bookingNumber,
        userId,
        tourId: data.tourId,
        startDate,
        endDate,
        adults: data.adults,
        children: data.children,
        totalPrice: data.totalPrice,
        discountAmount,
        promoCode: data.promoCode?.toUpperCase(),
        participants: data.participants as any,
        notes: data.notes,
        specialRequests: data.specialRequests,
        status: 'PENDING',
      },
      include: {
        tour: {
          select: {
            title: true,
            images: true,
            price: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    log.info('Booking created', { 
      bookingId: booking.id, 
      bookingNumber: booking.bookingNumber,
      userId, 
      tourId: data.tourId 
    });

    return booking;
  }

  /**
   * Get all bookings with filtering and pagination
   */
  static async getBookings(query: BookingQueryInput): Promise<{
    bookings: Booking[];
    pagination: PaginationMeta;
  }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
      tourId,
      userId,
      startDateFrom,
      startDateTo,
      minPrice,
      maxPrice,
      search,
      bookingNumber,
    } = query;

    // Build where clause
    const where: Prisma.BookingWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (tourId) {
      where.tourId = tourId;
    }

    if (userId) {
      where.userId = userId;
    }

    if (bookingNumber) {
      where.bookingNumber = { contains: bookingNumber };
    }

    // Date range filter
    if (startDateFrom || startDateTo) {
      where.startDate = {};
      if (startDateFrom) where.startDate.gte = startDateFrom;
      if (startDateTo) where.startDate.lte = startDateTo;
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.totalPrice = {};
      if (minPrice !== undefined) where.totalPrice.gte = minPrice;
      if (maxPrice !== undefined) where.totalPrice.lte = maxPrice;
    }

    // Search filter (search in booking number, tour title, user name)
    if (search) {
      where.OR = [
        { bookingNumber: { contains: search } },
        { tour: { title: { contains: search } } },
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } },
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build order by clause
    const orderBy: Prisma.BookingOrderByWithRelationInput = {};
    if (sortBy === 'startDate') {
      orderBy.startDate = sortOrder;
    } else if (sortBy === 'totalPrice') {
      orderBy.totalPrice = sortOrder;
    } else if (sortBy === 'status') {
      orderBy.status = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    // Execute queries
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          tour: {
            select: {
              title: true,
              images: true,
              price: true,
              duration: true,
              category: true,
            },
          },
          user: {
            select: {
              name: true,
              email: true,
              phone: true,
              avatar: true,
            },
          },
          payments: {
            select: {
              id: true,
              amount: true,
              status: true,
              method: true,
              createdAt: true,
            },
          },
        },
      }),
      prisma.booking.count({ where }),
    ]);

    const pagination = calculatePagination(page, limit, total);

    return {
      bookings,
      pagination,
    };
  }

  /**
   * Get booking by ID
   */
  static async getBookingById(id: string, userId?: string): Promise<Booking> {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        tour: {
          include: {
            guide: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                    phone: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        },
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
        payments: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    // If userId is provided, verify ownership (unless admin)
    if (userId && booking.userId !== userId) {
      throw new ForbiddenError('You do not have permission to view this booking');
    }

    return booking;
  }

  /**
   * Update booking
   */
  static async updateBooking(
    id: string, 
    data: UpdateBookingInput, 
    userId: string
  ): Promise<Booking> {
    // Check if booking exists
    const existingBooking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!existingBooking) {
      throw new NotFoundError('Booking not found');
    }

    // Verify ownership
    if (existingBooking.userId !== userId) {
      throw new ForbiddenError('You do not have permission to update this booking');
    }

    // Cannot update confirmed or completed bookings
    if (['COMPLETED', 'CANCELLED', 'REFUNDED'].includes(existingBooking.status)) {
      throw new ValidationError(
        `Cannot update booking with status: ${existingBooking.status}`
      );
    }

    // If dates are being updated, check availability
    if (data.startDate || data.endDate) {
      const startDate = data.startDate ? new Date(data.startDate) : existingBooking.startDate;
      const endDate = data.endDate ? new Date(data.endDate) : existingBooking.endDate;

      const conflictingBookings = await prisma.booking.findMany({
        where: {
          tourId: existingBooking.tourId,
          id: { not: id }, // Exclude current booking
          status: { in: ['CONFIRMED', 'PENDING'] },
          OR: [
            {
              startDate: { lte: endDate },
              endDate: { gte: startDate },
            },
          ],
        },
      });

      if (conflictingBookings.length > 0) {
        throw new ValidationError('Tour is not available for the selected dates');
      }
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
      include: {
        tour: true,
        user: true,
      },
    });

    log.info('Booking updated', { bookingId: id, userId });

    return booking;
  }

  /**
   * Cancel booking
   */
  static async cancelBooking(
    id: string, 
    data: CancelBookingInput, 
    userId: string
  ): Promise<Booking> {
    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    // Verify ownership
    if (booking.userId !== userId) {
      throw new ForbiddenError('You do not have permission to cancel this booking');
    }

    // Cannot cancel already cancelled or completed bookings
    if (['CANCELLED', 'COMPLETED', 'REFUNDED'].includes(booking.status)) {
      throw new ValidationError(
        `Cannot cancel booking with status: ${booking.status}`
      );
    }

    // Update booking status
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        notes: data.reason,
      },
      include: {
        tour: true,
        user: true,
      },
    });

    log.info('Booking cancelled', { 
      bookingId: id, 
      userId, 
      reason: data.reason,
      requestRefund: data.requestRefund 
    });

    // TODO: Process refund if requested
    if (data.requestRefund) {
      // Implement refund logic here
      log.info('Refund requested', { bookingId: id, userId });
    }

    return updatedBooking;
  }

  /**
   * Update booking status (admin only)
   */
  static async updateBookingStatus(
    id: string, 
    data: UpdateBookingStatusInput, 
    userId: string
  ): Promise<Booking> {
    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: data.status,
        notes: data.reason ? `${booking.notes || ''}\n\nStatus Update: ${data.reason}` : booking.notes,
      },
      include: {
        tour: true,
        user: true,
      },
    });

    log.info('Booking status updated by admin', { 
      bookingId: id, 
      userId, 
      oldStatus: booking.status,
      newStatus: data.status,
      reason: data.reason 
    });

    // TODO: Process refund if status is REFUNDED
    if (data.status === 'REFUNDED' && data.refundAmount) {
      log.info('Refund processed', { 
        bookingId: id, 
        refundAmount: data.refundAmount 
      });
    }

    return updatedBooking;
  }

  /**
   * Validate promo code
   */
  static async validatePromoCode(data: ValidatePromoCodeInput): Promise<{
    valid: boolean;
    message?: string;
    discountAmount?: number;
    promoCode?: any;
  }> {
    const promoCode = await prisma.promoCode.findUnique({
      where: { code: data.code },
    });

    if (!promoCode) {
      return {
        valid: false,
        message: 'Invalid promo code',
      };
    }

    // Check if active
    if (!promoCode.isActive) {
      return {
        valid: false,
        message: 'Promo code is no longer active',
      };
    }

    // Check validity dates
    const now = new Date();
    if (now < promoCode.validFrom || now > promoCode.validUntil) {
      return {
        valid: false,
        message: 'Promo code has expired or is not yet valid',
      };
    }

    // Check usage limit
    if (promoCode.usageLimit && promoCode.usageCount >= promoCode.usageLimit) {
      return {
        valid: false,
        message: 'Promo code usage limit reached',
      };
    }

    // Check minimum order amount
    if (promoCode.minOrderAmount && data.totalAmount < Number(promoCode.minOrderAmount)) {
      return {
        valid: false,
        message: `Minimum order amount of $${promoCode.minOrderAmount} required`,
      };
    }

    // Check if applicable to tours
    if (data.tourId && !promoCode.applicableToTours) {
      return {
        valid: false,
        message: 'Promo code not applicable to tours',
      };
    }

    // Calculate discount
    let discountAmount = 0;
    if (promoCode.discountType === 'percentage') {
      discountAmount = (data.totalAmount * Number(promoCode.discountValue)) / 100;
      if (promoCode.maxDiscount) {
        discountAmount = Math.min(discountAmount, Number(promoCode.maxDiscount));
      }
    } else {
      discountAmount = Number(promoCode.discountValue);
    }

    return {
      valid: true,
      message: 'Promo code applied successfully',
      discountAmount,
      promoCode: {
        code: promoCode.code,
        description: promoCode.description,
        discountType: promoCode.discountType,
        discountValue: promoCode.discountValue,
      },
    };
  }

  /**
   * Get user bookings
   */
  static async getUserBookings(userId: string, query: Partial<BookingQueryInput> = {}): Promise<{
    bookings: Booking[];
    pagination: PaginationMeta;
  }> {
    return this.getBookings({
      ...query,
      userId,
      page: query.page || 1,
      limit: query.limit || 10,
      sortBy: query.sortBy || 'createdAt',
      sortOrder: query.sortOrder || 'desc',
    } as BookingQueryInput);
  }

  /**
   * Get booking statistics
   */
  static async getBookingStats(query: BookingStatsQueryInput = {}): Promise<any> {
    const where: Prisma.BookingWhereInput = {};

    if (query.tourId) {
      where.tourId = query.tourId;
    }

    if (query.userId) {
      where.userId = query.userId;
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = query.startDate;
      if (query.endDate) where.createdAt.lte = query.endDate;
    }

    const [
      totalBookings,
      pendingBookings,
      confirmedBookings,
      cancelledBookings,
      completedBookings,
      totalRevenue,
    ] = await Promise.all([
      prisma.booking.count({ where }),
      prisma.booking.count({ where: { ...where, status: 'PENDING' } }),
      prisma.booking.count({ where: { ...where, status: 'CONFIRMED' } }),
      prisma.booking.count({ where: { ...where, status: 'CANCELLED' } }),
      prisma.booking.count({ where: { ...where, status: 'COMPLETED' } }),
      prisma.booking.aggregate({
        where: { ...where, status: { in: ['CONFIRMED', 'COMPLETED'] } },
        _sum: { totalPrice: true },
      }),
    ]);

    return {
      totalBookings,
      pendingBookings,
      confirmedBookings,
      cancelledBookings,
      completedBookings,
      totalRevenue: totalRevenue._sum.totalPrice || 0,
      averageBookingValue: totalBookings > 0 
        ? Number(totalRevenue._sum.totalPrice || 0) / totalBookings 
        : 0,
    };
  }
}
