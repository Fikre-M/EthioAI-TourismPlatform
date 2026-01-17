import { z } from 'zod';

/**
 * Chat validation schemas
 */

// Send message schema
export const sendMessageSchema = z.object({
  message: z.string()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message must not exceed 2000 characters'),
  language: z.enum(['en', 'am', 'om']).default('en'),
  messageType: z.enum(['text', 'tour_recommendation', 'cultural_info', 'travel_advice']).default('text'),
  context: z.object({
    tourId: z.string().uuid('Invalid tour ID').optional(),
    location: z.string().optional(),
    budget: z.number().positive().optional(),
    interests: z.array(z.string()).optional(),
    travelDates: z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }).optional(),
  }).optional(),
});

// Chat query/filter schema
export const chatQuerySchema = z.object({
  // Pagination
  page: z.string().optional().transform((val) => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform((val) => val ? parseInt(val, 10) : 20),
  
  // Sorting
  sortBy: z.enum(['createdAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  
  // Filtering
  language: z.enum(['en', 'am', 'om']).optional(),
  messageType: z.enum(['text', 'tour_recommendation', 'cultural_info', 'travel_advice']).optional(),
  
  // Date range
  startDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  endDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  
  // Search
  search: z.string().optional(),
});

// Update message schema (for admin/moderation)
export const updateMessageSchema = z.object({
  response: z.string()
    .min(1, 'Response cannot be empty')
    .max(5000, 'Response must not exceed 5000 characters')
    .optional(),
  metadata: z.record(z.any()).optional(),
});

// Chat session schema
export const createChatSessionSchema = z.object({
  title: z.string()
    .min(1, 'Session title is required')
    .max(200, 'Title must not exceed 200 characters')
    .optional(),
  language: z.enum(['en', 'am', 'om']).default('en'),
  context: z.object({
    location: z.string().optional(),
    budget: z.number().positive().optional(),
    interests: z.array(z.string()).optional(),
    travelDates: z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }).optional(),
  }).optional(),
});

// Chat feedback schema
export const chatFeedbackSchema = z.object({
  messageId: z.string().uuid('Invalid message ID'),
  rating: z.number()
    .int('Rating must be a whole number')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must not exceed 5'),
  feedback: z.string()
    .max(1000, 'Feedback must not exceed 1000 characters')
    .optional(),
});

// Chat statistics schema
export const chatStatsQuerySchema = z.object({
  startDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  endDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  language: z.enum(['en', 'am', 'om']).optional(),
  messageType: z.enum(['text', 'tour_recommendation', 'cultural_info', 'travel_advice']).optional(),
  userId: z.string().uuid('Invalid user ID').optional(),
});

// AI prompt configuration schema
export const aiPromptConfigSchema = z.object({
  systemPrompt: z.string()
    .min(10, 'System prompt must be at least 10 characters')
    .max(2000, 'System prompt must not exceed 2000 characters'),
  temperature: z.number()
    .min(0, 'Temperature must be between 0 and 2')
    .max(2, 'Temperature must be between 0 and 2')
    .default(0.7),
  maxTokens: z.number()
    .int('Max tokens must be a whole number')
    .min(50, 'Max tokens must be at least 50')
    .max(4000, 'Max tokens must not exceed 4000')
    .default(1000),
  language: z.enum(['en', 'am', 'om']).default('en'),
});

// Type exports for TypeScript
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type ChatQueryInput = z.infer<typeof chatQuerySchema>;
export type UpdateMessageInput = z.infer<typeof updateMessageSchema>;
export type CreateChatSessionInput = z.infer<typeof createChatSessionSchema>;
export type ChatFeedbackInput = z.infer<typeof chatFeedbackSchema>;
export type ChatStatsQueryInput = z.infer<typeof chatStatsQuerySchema>;
export type AIPromptConfigInput = z.infer<typeof aiPromptConfigSchema>;