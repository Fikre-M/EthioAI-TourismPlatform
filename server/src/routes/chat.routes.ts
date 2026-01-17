import { Router } from 'express';
import { z } from 'zod';
import { ChatController } from '../controllers/chat.controller';
import { authenticate, optionalAuth, requireRoles } from '../middlewares/auth.middleware';
import { validate, commonSchemas } from '../middlewares/validation.middleware';

// Import schemas
import {
  sendMessageSchema,
  chatQuerySchema,
  updateMessageSchema,
  createChatSessionSchema,
  chatFeedbackSchema,
  chatStatsQuerySchema,
  aiPromptConfigSchema,
} from '../schemas/chat.schemas';

const router = Router();

/**
 * Chat Routes
 * All routes are prefixed with /api/chat
 */

// ===== PUBLIC CHAT ROUTES =====

/**
 * Send a message and get AI response
 * POST /api/chat/messages
 * Can be used with or without authentication
 */
router.post('/messages', 
  optionalAuth,
  validate({ body: sendMessageSchema }), 
  ChatController.sendMessage
);

/**
 * Get AI suggestions based on context
 * POST /api/chat/suggestions
 * Public endpoint for getting conversation starters
 */
router.post('/suggestions', 
  optionalAuth,
  validate({ 
    body: z.object({
      location: z.string().optional(),
      budget: z.number().positive().optional(),
      interests: z.array(z.string()).optional(),
      language: z.enum(['en', 'am', 'om']).optional(),
    }).optional().default({})
  }),
  ChatController.getSuggestions
);

/**
 * Health check for chat system
 * GET /api/chat/health
 * Public endpoint to check system status
 */
router.get('/health', 
  ChatController.healthCheck
);

// ===== AUTHENTICATED USER ROUTES =====

/**
 * Get user's chat messages with filtering and pagination
 * GET /api/chat/messages
 */
router.get('/messages', 
  authenticate,
  validate({ query: chatQuerySchema }),
  ChatController.getMessages
);

/**
 * Get specific message by ID
 * GET /api/chat/messages/:id
 */
router.get('/messages/:id', 
  authenticate,
  validate({ params: commonSchemas.uuidParam.params }),
  ChatController.getMessageById
);

/**
 * Delete a specific message
 * DELETE /api/chat/messages/:id
 */
router.delete('/messages/:id', 
  authenticate,
  validate({ params: commonSchemas.uuidParam.params }),
  ChatController.deleteMessage
);

/**
 * Clear all messages for current user
 * DELETE /api/chat/messages
 */
router.delete('/messages', 
  authenticate,
  ChatController.clearMessages
);

/**
 * Submit feedback for a message
 * POST /api/chat/messages/:id/feedback
 */
router.post('/messages/:id/feedback', 
  authenticate,
  validate({ 
    params: commonSchemas.uuidParam.params,
    body: z.object({
      rating: z.number().int().min(1).max(5),
      feedback: z.string().max(1000).optional(),
    })
  }),
  ChatController.submitFeedback
);

/**
 * Get user's recent messages
 * GET /api/chat/recent
 */
router.get('/recent', 
  authenticate,
  validate({ 
    query: z.object({
      limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 10),
    }).optional().default({})
  }),
  ChatController.getRecentMessages
);

/**
 * Export chat history
 * GET /api/chat/export
 */
router.get('/export', 
  authenticate,
  validate({ 
    query: z.object({
      format: z.enum(['json', 'text']).optional().default('json'),
    }).optional().default({})
  }),
  ChatController.exportChatHistory
);

/**
 * Get conversation summary
 * GET /api/chat/summary
 */
router.get('/summary', 
  authenticate,
  validate({ 
    query: z.object({
      limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 50),
    }).optional().default({})
  }),
  ChatController.getConversationSummary
);

// ===== ADMIN ROUTES =====

/**
 * Update message (admin only)
 * PUT /api/chat/messages/:id
 */
router.put('/messages/:id', 
  authenticate,
  requireRoles.admin,
  validate({ 
    params: commonSchemas.uuidParam.params,
    body: updateMessageSchema 
  }),
  ChatController.updateMessage
);

/**
 * Get chat statistics (admin only)
 * GET /api/chat/stats
 */
router.get('/stats', 
  authenticate,
  requireRoles.admin,
  validate({ query: chatStatsQuerySchema }),
  ChatController.getChatStats
);

/**
 * Get popular chat topics (admin only)
 * GET /api/chat/topics
 */
router.get('/topics', 
  authenticate,
  requireRoles.admin,
  validate({ 
    query: z.object({
      limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 10),
    }).optional().default({})
  }),
  ChatController.getPopularTopics
);

// ===== DEVELOPMENT/TESTING ROUTES =====

/**
 * Test AI response (development only)
 * POST /api/chat/test
 * Only available in development environment
 */
if (process.env.NODE_ENV === 'development') {
  router.post('/test', 
    optionalAuth,
    validate({ 
      body: z.object({
        message: z.string().min(1).max(2000),
        context: z.object({
          language: z.enum(['en', 'am', 'om']).optional(),
          messageType: z.enum(['text', 'tour_recommendation', 'cultural_info', 'travel_advice']).optional(),
          tourId: z.string().uuid().optional(),
          location: z.string().optional(),
          budget: z.number().positive().optional(),
          interests: z.array(z.string()).optional(),
          travelDates: z.object({
            startDate: z.string().optional(),
            endDate: z.string().optional(),
          }).optional(),
        }).optional(),
      })
    }),
    ChatController.testAIResponse
  );
}

export default router;