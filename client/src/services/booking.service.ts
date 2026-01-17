import { api } from '@/api/axios.config';
import { API_ENDPOINTS } from '@/utils/constants';

export interface Participant {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  age?: number;
  passportNumber?: string;
  nationality?: string;
  dietaryRequirements?: string;
  medicalConditions?: string;
}

export interface CreateBookingData {
  tourId: string;
  startDate: string;
  endDate: string;
  adults: number;
  children: number;
  totalPrice: number;
  discountAmount?: number;
  promoCode?: string;
  participants: Participant[];
  notes?: string;
  specialRequests?: string;
}

export interface UpdateBookingData {
  startDate?: string;
  endDate?: string;
  adults?: number;
  children?: number;
  participants?: Participant[];
  notes?: string;
  specialRequests?: string;
}

export interface BookingQueryParams {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'startDate' | 'totalPrice' | 'status';
  sortOrder?: 'asc' | 'desc';
  status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'REFUNDED';
  tourId?: string;
  startDateFrom?: string;
  startDateTo?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}

export interface ValidatePromoCodeData {
  code: string;
  tourId?: string;
  totalAmount: number;
}

export interface CancelBookingData {
  reason: string;
  requestRefund?: boolean;
}

export interface UpdateBookingStatusData {
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'REFUNDED';
  reason?: string;
  refundAmount?: number;
}

class BookingService {
  /**
   * Create a new booking
   */
  async createBooking(data: CreateBookingData) {
    const response = await api.post(API_ENDPOINTS.BOOKINGS.CREATE, data);
    return response.data;
  }

  /**
   * Get all bookings (admin)
   */
  async getBookings(params?: BookingQueryParams) {
    const response = await api.get(API_ENDPOINTS.BOOKINGS.LIST, { params });
    return response.data;
  }

  /**
   * Get user's bookings
   */
  async getMyBookings(params?: BookingQueryParams) {
    const response = await api.get(API_ENDPOINTS.BOOKINGS.MY_BOOKINGS, { params });
    return response.data;
  }

  /**
   * Get booking by ID
   */
  async getBookingById(id: string) {
    const response = await api.get(API_ENDPOINTS.BOOKINGS.BY_ID(id));
    return response.data;
  }

  /**
   * Get booking by booking number
   */
  async getBookingByNumber(bookingNumber: string) {
    const response = await api.get(API_ENDPOINTS.BOOKINGS.BY_NUMBER(bookingNumber));
    return response.data;
  }

  /**
   * Update booking
   */
  async updateBooking(id: string, data: UpdateBookingData) {
    const response = await api.put(API_ENDPOINTS.BOOKINGS.UPDATE(id), data);
    return response.data;
  }

  /**
   * Cancel booking
   */
  async cancelBooking(id: string, data: CancelBookingData) {
    const response = await api.post(API_ENDPOINTS.BOOKINGS.CANCEL(id), data);
    return response.data;
  }

  /**
   * Update booking status (admin)
   */
  async updateBookingStatus(id: string, data: UpdateBookingStatusData) {
    const response = await api.patch(API_ENDPOINTS.BOOKINGS.UPDATE_STATUS(id), data);
    return response.data;
  }

  /**
   * Validate promo code
   */
  async validatePromoCode(data: ValidatePromoCodeData) {
    const response = await api.post(API_ENDPOINTS.BOOKINGS.VALIDATE_PROMO, data);
    return response.data;
  }

  /**
   * Get upcoming bookings
   */
  async getUpcomingBookings(limit?: number) {
    const response = await api.get(API_ENDPOINTS.BOOKINGS.UPCOMING, {
      params: { limit },
    });
    return response.data;
  }

  /**
   * Get past bookings
   */
  async getPastBookings(params?: BookingQueryParams) {
    const response = await api.get(API_ENDPOINTS.BOOKINGS.PAST, { params });
    return response.data;
  }

  /**
   * Get booking statistics (admin)
   */
  async getBookingStats(params?: {
    startDate?: string;
    endDate?: string;
    tourId?: string;
    userId?: string;
  }) {
    const response = await api.get(API_ENDPOINTS.BOOKINGS.STATS, { params });
    return response.data;
  }
}

export default new BookingService();
