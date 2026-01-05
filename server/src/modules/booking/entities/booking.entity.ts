import { BookingStatus } from '../enums/booking-status.enum';
import { Tour } from '../../tour/entities/tour.entity';
import { User } from '../../user/entities/user.entity';

export class Booking {
  id: string;
  bookingReference: string;
  tourId: string;
  tour?: Tour;
  userId: string;
  user?: User;
  date: Date;
  adults: number;
  children: number;
  totalPrice: number;
  status: BookingStatus;
  specialRequests?: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  addOns?: string[];
  participants?: Array<{
    name: string;
    dietaryRestrictions?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
}
