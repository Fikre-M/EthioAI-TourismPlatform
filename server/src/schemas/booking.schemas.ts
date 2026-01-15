import { z } from 'zod';

/**
 * Booking validation schemas
 */

// Participant schema
const participantSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().optional(),
  age: z.number().int().min(0, 'Age must be positive').optional(),
  passportNumber: z.string().optional(),
  nationality: z.string().optional(),
  dietaryRequirements: z.string().optional(),
  medicalConditions: z.string().optional(),
});

// Create booking schema
export const createBookingSchema = z.object({
  tourId: z.string().uuid('Invalid tour ID'),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid start date'),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid end date'),
  adults: z.number().int().min(1, 'At least one adult is required').max(50, 'Maximum 50 adults'),
  children: z.number().int().min(0, 'Children count cannot be negative').max(50, 'Maximum 50 children').default(0),
  totalPrice: z.number().positive('Total price must be positive'),
  discountAmount: z.number().min(0, 'Discount amount cannot be negative').optional(),
  promoCode: z.string().optional(),
  participants: z.array(participantSchema).min(1, 'At least one participant is required'),
  notes: z.string().max(1000, 'Notes must not exceed 1000 characters').optional(),
  specialRequests: z.string().max(1000, 'Special requests must not exceed 1000 characters').optional(),
}).refine(
  (data) => new Date(data.startDate) < new Date(data.endDate),
  {
    message: 'End date must be after start date',
    path: ['endDate'],
  }
).refine(
  (data) => new Date(data.startDate) > new Date(),
  {
    message: 'Start date must be in the future',
    path: ['startDate'],
  }
).refine(
  (data) => data.participants.length >= data.adults,
  {
    message: 'Number of participants must match or exceed number of adults',
    path: ['participants'],
  }
);

// Update booking schema
export const updateBookingSchema = z.object({
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid start date').optional(),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid end date').optional(),
  adults: z.number().int().min(1).max(50).optional(),
  children: z.number().int().min(0).max(50).optional(),
  participants: z.array(participantSchema).optional(),
  notes: z.string().max(1000).optional(),
  specialRequests: z.string().max(1000).optional(),
});

// Update booking status schema
export const updateBookingStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'REFUNDED']),
  reason: z.string().max(500, 'Reason must not exceed 500 characters').optional(),
  refundAmount: z.number().min(0, 'Refund amount cannot be negative').optional(),
});

// Booking query/filter schema
export const bookingQuerySchema = z.object({
  // Pagination
  page: z.string().optional().transform((val) => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform((val) => val ? parseInt(val, 10) : 10),
  
  // Sorting
  sortBy: z.enum(['createdAt', 'startDate', 'totalPrice', 'status']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  
  // Filtering
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'REFUNDED']).optional(),
  tourId: z.string().uuid('Invalid tour ID').optional(),
  userId: z.string().uuid('Invalid user ID').optional(),
  
  // Date range
  startDateFrom: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  startDateTo: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  
  // Price range
  minPrice: z.string().optional().transform((val) => val ? parseFloat(val) : undefined),
  maxPrice: z.string().optional().transform((val) => val ? parseFloat(val) : undefined),
  
  // Search
  search: z.string().optional(),
  bookingNumber: z.string().optional(),
});

// Promo code validation schema
export const validatePromoCodeSchema = z.object({
  code: z.string().min(1, 'Promo code is required').toUpperCase(),
  tourId: z.string().uuid('Invalid tour ID').optional(),
  totalAmount: z.number().positive('Total amount must be positive'),
});

// Cancel booking schema
export const cancelBookingSchema = z.object({
  reason: z.string().min(10, 'Cancellation reason must be at least 10 characters').max(500, 'Reason must not exceed 500 characters'),
  requestRefund: z.boolean().default(true),
});

// Booking statistics schema
export const bookingStatsQuerySchema = z.object({
  startDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  endDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  tourId: z.string().uuid('Invalid tour ID').optional(),
  userId: z.string().uuid('Invalid user ID').optional(),
});

// Type exports for TypeScript
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;
export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;
export type BookingQueryInput = z.infer<typeof bookingQuerySchema>;
export type ValidatePromoCodeInput = z.infer<typeof validatePromoCodeSchema>;
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;
export type BookingStatsQueryInput = z.infer<typeof bookingStatsQuerySchema>;
export type ParticipantInput = z.infer<typeof participantSchema>;