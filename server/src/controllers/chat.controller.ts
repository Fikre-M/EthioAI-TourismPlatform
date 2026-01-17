import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { ChatService } from '../services/chat.service';
import { ResponseUtil } from '../utils/response';
import { log } from '../utils/logger';
import { asyncHandler } from '../middlewares/error.middleware';
import { 
  SendMessageInput, 
  ChatQueryInput,
  UpdateMessageInput,
  CreateChatSessionInput,
  ChatFeedbackInput,
  ChatStatsQueryInput
} from '../schemas/chat.schemas';

export class ChatController {
  /**
   * Send a message and get AI response
   * POST /api/chat/messages
   */
  static sendMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
    const data: SendMessageInput = req.body;
    const userId = req.userId; // Optional for anonymous chat
    
    const result = await ChatService.sendMessage(data, userId);
    
    log.info('Chat message sent via API', { 
      userId, 
      messageId: result.userMessage.id,
      responseId: result.aiResponse.id,
      ip: req.ip 
    });

    return ResponseUtil.success(res, {
      userMessage: result.userMessage,
      aiResponse: result.aiResponse,
    }, 'Message sent successfully');
  });

  /**
   * Get chat messages with filtering and pagination
   * GET /api/chat/messages
   */
  static getMessages = asyncHandler(async (req: AuthRequest, res: Response) => {
    const query: ChatQueryInput = req.query as any;
    const userId = req.userId; // Optional for admin access
    
    const result = await ChatService.getMessages(query, userId);
    
    return ResponseUtil.paginated(
      res, 
      result.messages, 
      result.pagination, 
      'Messages retrieved successfully'
    );
  });

  /**
   * Get message by ID
   * GET /api/chat/messages/:id
   */
  static getMessageById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.userId;
    
    const message = await ChatService.getMessageById(id, userId);
    
    return ResponseUtil.success(res, { message }, 'Message retrieved successfully');
  });

  /**
   * Update message (admin only)
   * PUT /api/chat/messages/:id
   */
  static updateMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const data: UpdateMessageInput = req.body;
    const userId = req.userId!;
    
    const message = await ChatService.updateMessage(id, data, userId);
    
    log.info('Chat message updated via API', { messageId: id, userId, ip: req.ip });

    return ResponseUtil.success(res, { message }, 'Message updated successfully');
  });

  /**
   * Delete message
   * DELETE /api/chat/messages/:id
   */
  static deleteMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.userId!;
    
    await ChatService.deleteMessage(id, userId);
    
    log.info('Chat message deleted via API', { messageId: id, userId, ip: req.ip });

    return ResponseUtil.success(res, null, 'Message deleted successfully');
  });

  /**
   * Clear all messages for current user
   * DELETE /api/chat/messages
   */
  static clearMessages = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    
    await ChatService.clearUserMessages(userId);
    
    log.info('User chat messages cleared via API', { userId, ip: req.ip });

    return ResponseUtil.success(res, null, 'All messages cleared successfully');
  });

  /**
   * Submit feedback for a message
   * POST /api/chat/messages/:id/feedback
   */
  static submitFeedback = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id: messageId } = req.params;
    const data: Omit<ChatFeedbackInput, 'messageId'> = req.body;
    const userId = req.userId!;
    
    await ChatService.submitFeedback({ ...data, messageId }, userId);
    
    log.info('Chat feedback submitted via API', { 
      messageId, 
      userId, 
      rating: data.rating,
      ip: req.ip 
    });

    return ResponseUtil.success(res, null, 'Feedback submitted successfully');
  });

  /**
   * Get AI suggestions based on context
   * POST /api/chat/suggestions
   */
  static getSuggestions = asyncHandler(async (req: AuthRequest, res: Response) => {
    const context = req.body;
    
    const suggestions = await ChatService.getSuggestions(context);
    
    return ResponseUtil.success(res, { suggestions }, 'Suggestions retrieved successfully');
  });

  /**
   * Get chat statistics
   * GET /api/chat/stats
   */
  static getChatStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    const query: ChatStatsQueryInput = req.query as any;
    
    const stats = await ChatService.getChatStats(query);
    
    return ResponseUtil.success(res, stats, 'Chat statistics retrieved successfully');
  });

  /**
   * Export chat history
   * GET /api/chat/export
   */
  static exportChatHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const format = (req.query.format as 'json' | 'text') || 'json';
    
    const exportData = await ChatService.exportChatHistory(userId, format);
    
    // Set appropriate headers for download
    const filename = `chat-history-${userId}-${new Date().toISOString().split('T')[0]}.${format}`;
    const contentType = format === 'json' ? 'application/json' : 'text/plain';
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    log.info('Chat history exported via API', { userId, format, ip: req.ip });

    return res.send(exportData);
  });

  /**
   * Get popular chat topics
   * GET /api/chat/topics
   */
  static getPopularTopics = asyncHandler(async (req: AuthRequest, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 10;
    
    const topics = await ChatService.getPopularTopics(limit);
    
    return ResponseUtil.success(res, { topics }, 'Popular topics retrieved successfully');
  });

  /**
   * Get user's recent messages
   * GET /api/chat/recent
   */
  static getRecentMessages = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const messages = await ChatService.getRecentMessages(userId, limit);
    
    return ResponseUtil.success(res, { messages }, 'Recent messages retrieved successfully');
  });

  /**
   * Health check for chat system
   * GET /api/chat/health
   */
  static healthCheck = asyncHandler(async (req: AuthRequest, res: Response) => {
    // Check if OpenAI service is available
    const { OpenAIService } = await import('../services/openai.service');
    const modelStatus = await OpenAIService.getModelStatus();
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected', // Assume connected if we reach this point
        openai: modelStatus.available ? 'connected' : 'disconnected',
      },
      features: {
        aiResponses: modelStatus.available,
        messageStorage: true,
        multilingual: true,
        feedback: true,
      },
    };
    
    return ResponseUtil.success(res, health, 'Chat system is healthy');
  });

  /**
   * Test AI response (development/testing only)
   * POST /api/chat/test
   */
  static testAIResponse = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { message, context } = req.body;
    
    if (!message) {
      return ResponseUtil.badRequest(res, 'Message is required for testing');
    }
    
    const { OpenAIService } = await import('../services/openai.service');
    
    try {
      const response = await OpenAIService.generateChatResponse(message, context);
      
      return ResponseUtil.success(res, {
        userMessage: message,
        aiResponse: response,
        context,
        timestamp: new Date().toISOString(),
      }, 'AI response generated successfully');
      
    } catch (error: any) {
      log.error('AI response test failed', { error: error.message, message });
      
      return ResponseUtil.error(res, 'Failed to generate AI response', 500, {
        error: error.message,
        message,
      });
    }
  });

  /**
   * Get conversation summary (for long conversations)
   * GET /api/chat/summary
   */
  static getConversationSummary = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const limit = parseInt(req.query.limit as string) || 50;
    
    const messages = await ChatService.getRecentMessages(userId, limit);
    
    // Simple summary - in a real implementation, you might use AI to generate summaries
    const summary = {
      totalMessages: messages.length,
      dateRange: {
        earliest: messages[messages.length - 1]?.createdAt,
        latest: messages[0]?.createdAt,
      },
      languages: [...new Set(messages.map(m => m.language))],
      messageTypes: [...new Set(messages.map(m => m.messageType))],
      hasResponses: messages.some(m => m.response),
      averageMessageLength: messages.reduce((sum, m) => sum + m.message.length, 0) / messages.length,
    };
    
    return ResponseUtil.success(res, { summary }, 'Conversation summary retrieved successfully');
  });
}