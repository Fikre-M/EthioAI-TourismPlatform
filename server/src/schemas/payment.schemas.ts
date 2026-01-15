import { z } from 'zod';

/**
 * Payment validation schemas
 */

// Create payment intent schema (Stripe)
export const createPaymentIntentSchema = z.object({
  bookingId: z.string().uuid('Invalid booking ID').optional(),
  orderId: z.string().uuid('Invalid order ID').optional(),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
  paymentMethod: z.enum(['STRIPE', 'CHAPA', 'TELEBIRR', 'CBE_BIRR']).default('STRIPE'),
  metadata: z.record(z.any()).optional(),
}).refine(
  (data) => data.bookingId || data.orderId,
  {
    message: 'Either bookingId or orderId is required',
    path: ['bookingId'],
  }
);

// Initialize Chapa payment schema
export const initializeChapaPaymentSchema = z.object({
  bookingId: z.string().uuid('Invalid booking ID').optional(),
  orderId: z.string().uuid('Invalid order ID').optional(),
  amount: z.number().positive('Amount must be positive'),
  currency: z.enum(['ETB', 'USD']).default('ETB'),
  email: z.string().email('Invalid email'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  returnUrl: z.string().url('Invalid return URL'),
  callbackUrl: z.string().url('Invalid callback URL').optional(),
  customization: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
  }).optional(),
}).refine(
  (data) => data.bookingId || data.orderId,
  {
    message: 'Either bookingId or orderId is required',
    path: ['bookingId'],
  }
);

// Confirm payment schema
export const confirmPaymentSchema = z.object({
  paymentIntentId: z.string().min(1, 'Payment intent ID is required'),
  paymentMethodId: z.string().min(1, 'Payment method ID is required').optional(),
});

// Payment query schema
export const paymentQuerySchema = z.object({
  // Pagination
  page: z.string().optional().transform((val) => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform((val) => val ? parseInt(val, 10) : 10),
  
  // Sorting
  sortBy: z.enum(['createdAt', 'amount', 'status']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  
  // Filtering
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED']).optional(),
  method: z.enum(['STRIPE', 'CHAPA', 'TELEBIRR', 'CBE_BIRR']).optional(),
  userId: z.string().uuid('Invalid user ID').optional(),
  bookingId: z.string().uuid('Invalid booking ID').optional(),
  orderId: z.string().uuid('Invalid order ID').optional(),
  
  // Date range
  startDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  endDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  
  // Amount range
  minAmount: z.string().optional().transform((val) => val ? parseFloat(val) : undefined),
  maxAmount: z.string().optional().transform((val) => val ? parseFloat(val) : undefined),
});

// Refund payment schema
export const refundPaymentSchema = z.object({
  paymentId: z.string().uuid('Invalid payment ID'),
  amount: z.number().positive('Refund amount must be positive').optional(),
  reason: z.string().min(10, 'Refund reason must be at least 10 characters').max(500, 'Reason must not exceed 500 characters'),
});

// Webhook verification schema (Stripe)
export const stripeWebhookSchema = z.object({
  type: z.string(),
  data: z.object({
    object: z.any(),
  }),
});

// Chapa webhook schema
export const chapaWebhookSchema = z.object({
  event: z.string(),
  data: z.object({
    tx_ref: z.string(),
    status: z.string(),
    amount: z.number(),
    currency: z.string(),
    charge: z.number().optional(),
    customer: z.object({
      email: z.string(),
      first_name: z.string(),
      last_name: z.string(),
    }).optional(),
  }),
});

// Payment statistics schema
export const paymentStatsQuerySchema = z.object({
  startDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  endDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  method: z.enum(['STRIPE', 'CHAPA', 'TELEBIRR', 'CBE_BIRR']).optional(),
  userId: z.string().uuid('Invalid user ID').optional(),
});

// Type exports for TypeScript
export type CreatePaymentIntentInput = z.infer<typeof createPaymentIntentSchema>;
export type InitializeChapaPaymentInput = z.infer<typeof initializeChapaPaymentSchema>;
export type ConfirmPaymentInput = z.infer<typeof confirmPaymentSchema>;
export type PaymentQueryInput = z.infer<typeof paymentQuerySchema>;
export type RefundPaymentInput = z.infer<typeof refundPaymentSchema>;
export type StripeWebhookInput = z.infer<typeof stripeWebhookSchema>;
export type ChapaWebhookInput = z.infer<typeof chapaWebhookSchema>;
export type PaymentStatsQueryInput = z.infer<typeof paymentStatsQuerySchema>;
