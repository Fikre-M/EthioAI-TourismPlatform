// server/src/modules/booking/booking.controller.ts
import { Controller, Get, Post, Body, Query, UseGuards } from "@nestjs/common";
import { BookingService } from "./booking.service";
import { CreateBookingDto } from "./dto/create-booking.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { GetUser } from "../auth/decorators/get-user.decorator";
import { User } from "../user/entities/user.entity";

@Controller("api/bookings")
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Get("availability")
  async checkAvailability(
    @Query("tourId") tourId: string,
    @Query("date") date: string
  ) {
    return this.bookingService.checkTourAvailability(tourId, date);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createBooking(
    @Body() createBookingDto: CreateBookingDto,
    @GetUser() user: User
  ) {
    return this.bookingService.createBooking(createBookingDto, user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getUserBookings(
    @GetUser() user: User,
    @Query("status") status?: string
  ) {
    return this.bookingService.getUserBookings(user.id, status);
  }
}
