import api from '@/api/axios';
import { API_ENDPOINTS } from '@/utils/constants';

export interface CreatePaymentIntentData {
  bookingId?: string;
  orderId?: string;
  amount: number;
  currency?: string;
  paymentMethod?: 'STRIPE' | 'CHAPA' | 'TELEBIRR' | 'CBE_BIRR';
  metadata?: Record<string, any>;
}

export interface InitializeChapaPaymentData {
  bookingId?: string;
  orderId?: string;
  amount: number;
  currency?: 'ETB' | 'USD';
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  returnUrl: string;
  callbackUrl?: string;
  customization?: {
    title?: string;
    description?: string;
  };
}

export interface ConfirmPaymentData {
  paymentIntentId: string;
  paymentMethodId?: string;
}

export interface PaymentQueryParams {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'amount' | 'status';
  sortOrder?: 'asc' | 'desc';
  status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  method?: 'STRIPE' | 'CHAPA' | 'TELEBIRR' | 'CBE_BIRR';
  bookingId?: string;
  orderId?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface RefundPaymentData {
  amount?: number;
  reason: string;
}

class PaymentService {
  /**
   * Create Stripe payment intent
   */
  async createStripePaymentIntent(data: CreatePaymentIntentData) {
    const response = await api.post(API_ENDPOINTS.PAYMENTS.STRIPE.CREATE_INTENT, data);
    return response.data;
  }

  /**
   * Confirm Stripe payment
   */
  async confirmStripePayment(data: ConfirmPaymentData) {
    const response = await api.post(API_ENDPOINTS.PAYMENTS.STRIPE.CONFIRM, data);
    return response.data;
  }

  /**
   * Get Stripe configuration (publishable key)
   */
  async getStripeConfig() {
    const response = await api.get(API_ENDPOINTS.PAYMENTS.STRIPE.CONFIG);
    return response.data;
  }

  /**
   * Initialize Chapa payment
   */
  async initializeChapaPayment(data: InitializeChapaPaymentData) {
    const response = await api.post(API_ENDPOINTS.PAYMENTS.CHAPA.INITIALIZE, data);
    return response.data;
  }

  /**
   * Verify Chapa payment
   */
  async verifyChapaPayment(txRef: string) {
    const response = await api.get(API_ENDPOINTS.PAYMENTS.CHAPA.VERIFY(txRef));
    return response.data;
  }

  /**
   * Get all payments (admin)
   */
  async getPayments(params?: PaymentQueryParams) {
    const response = await api.get(API_ENDPOINTS.PAYMENTS.LIST, { params });
    return response.data;
  }

  /**
   * Get user's payments
   */
  async getMyPayments(params?: PaymentQueryParams) {
    const response = await api.get(API_ENDPOINTS.PAYMENTS.MY_PAYMENTS, { params });
    return response.data;
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(id: string) {
    const response = await api.get(API_ENDPOINTS.PAYMENTS.BY_ID(id));
    return response.data;
  }

  /**
   * Refund payment (admin)
   */
  async refundPayment(id: string, data: RefundPaymentData) {
    const response = await api.post(API_ENDPOINTS.PAYMENTS.REFUND(id), data);
    return response.data;
  }

  /**
   * Get payment statistics (admin)
   */
  async getPaymentStats(params?: {
    startDate?: string;
    endDate?: string;
    method?: 'STRIPE' | 'CHAPA' | 'TELEBIRR' | 'CBE_BIRR';
    userId?: string;
  }) {
    const response = await api.get(API_ENDPOINTS.PAYMENTS.STATS, { params });
    return response.data;
  }
}

export default new PaymentService();
