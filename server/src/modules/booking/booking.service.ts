import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingStatus } from './enums/booking-status.enum';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class BookingService {
  constructor(private prisma: PrismaService) {}

  async createBooking(createBookingDto: CreateBookingDto, userId: string) {
    // Check tour availability
    const tour = await this.prisma.tour.findUnique({
      where: { id: createBookingDto.tourId },
      select: { id: true, price: true, maxGroupSize: true },
    });

    if (!tour) {
      throw new NotFoundException('Tour not found');
    }

    // Check availability for the selected date
    const bookingsOnDate = await this.prisma.booking.count({
      where: {
        tourId: createBookingDto.tourId,
        date: new Date(createBookingDto.date),
        status: {
          in: [BookingStatus.CONFIRMED, BookingStatus.PENDING],
        },
      },
    });

    const availableSpots = tour.maxGroupSize - bookingsOnDate;
    const requestedSpots = createBookingDto.adults + createBookingDto.children;

    if (availableSpots < requestedSpots) {
      throw new BadRequestException('Not enough available spots for the selected date');
    }

    // Calculate total price
    const totalPrice = this.calculateTotalPrice(tour.price, createBookingDto);

    // Create booking
    const booking = await this.prisma.booking.create({
      data: {
        id: uuidv4(),
        bookingReference: this.generateBookingReference(),
        tourId: createBookingDto.tourId,
        userId,
        date: new Date(createBookingDto.date),
        adults: createBookingDto.adults,
        children: createBookingDto.children,
        totalPrice,
        status: BookingStatus.CONFIRMED,
        specialRequests: createBookingDto.specialRequests,
        contactName: createBookingDto.contactName,
        contactEmail: createBookingDto.contactEmail,
        contactPhone: createBookingDto.contactPhone,
        participants: createBookingDto.participants || [],
      },
    });

    return booking;
  }

  async getBookingById(id: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { tour: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Only allow the booking owner or admin to view the booking
    if (booking.userId !== userId) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  async getUserBookings(userId: string, status?: string) {
    const where: any = { userId };
    
    if (status) {
      where.status = status;
    }

    return this.prisma.booking.findMany({
      where,
      include: { tour: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async cancelBooking(id: string, userId: string, reason?: string) {
    const booking = await this.getBookingById(id, userId);

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Booking is already cancelled');
    }

    // Implement cancellation policy (e.g., no refunds within 24 hours)
    const now = new Date();
    const bookingDate = new Date(booking.date);
    const hoursUntilTour = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilTour < 24) {
      throw new BadRequestException('Cannot cancel booking within 24 hours of the tour');
    }

    return this.prisma.booking.update({
      where: { id },
      data: {
        status: BookingStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: reason,
      },
    });
  }

  async checkTourAvailability(tourId: string, date: string) {
    const tour = await this.prisma.tour.findUnique({
      where: { id: tourId },
      select: { maxGroupSize: true },
    });

    if (!tour) {
      throw new NotFoundException('Tour not found');
    }

    const bookingsCount = await this.prisma.booking.count({
      where: {
        tourId,
        date: new Date(date),
        status: {
          in: [BookingStatus.CONFIRMED, BookingStatus.PENDING],
        },
      },
    });

    const availableSpots = Math.max(0, tour.maxGroupSize - bookingsCount);
    
    return {
      available: availableSpots > 0,
      spotsLeft: availableSpots,
      totalCapacity: tour.maxGroupSize,
      isFullyBooked: availableSpots === 0,
      waitlistAvailable: availableSpots === 0,
    };
  }

  private calculateTotalPrice(basePrice: number, bookingData: CreateBookingDto): number {
    // Simple calculation - can be extended with add-ons, discounts, etc.
    const adultPrice = bookingData.adults * basePrice;
    const childPrice = bookingData.children * (basePrice * 0.7); // 30% discount for children
    return adultPrice + childPrice;
  }

  private generateBookingReference(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = 'ETH-';
    
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }
}
