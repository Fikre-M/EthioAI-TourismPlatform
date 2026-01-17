import { PrismaClient, ChatMessage, Prisma } from '@prisma/client';
import { 
  SendMessageInput, 
  ChatQueryInput,
  UpdateMessageInput,
  CreateChatSessionInput,
  ChatFeedbackInput,
  ChatStatsQueryInput
} from '../schemas/chat.schemas';
import { OpenAIService } from './openai.service';
import { 
  NotFoundError, 
  ValidationError, 
  ForbiddenError 
} from '../middlewares/error.middleware';
import { calculatePagination, PaginationMeta } from '../utils/response';
import { log } from '../utils/logger';

const prisma = new PrismaClient();

export class ChatService {
  /**
   * Send a message and get AI response
   */
  static async sendMessage(
    data: SendMessageInput, 
    userId?: string
  ): Promise<{
    userMessage: ChatMessage;
    aiResponse: ChatMessage;
  }> {
    // Validate message content
    if (!OpenAIService.validateMessageContent(data.message)) {
      throw new ValidationError('Invalid message content');
    }

    // Get conversation history for context (last 10 messages)
    const conversationHistory = userId ? await this.getRecentMessages(userId, 10) : [];

    // Generate AI response
    const aiResponseContent = await OpenAIService.generateChatResponse(
      data.message,
      {
        language: data.language,
        messageType: data.messageType,
        ...data.context,
        conversationHistory: conversationHistory.map(msg => ({
          role: msg.response ? 'assistant' : 'user',
          content: msg.response || msg.message,
        })),
      }
    );

    // Save user message
    const userMessage = await prisma.chatMessage.create({
      data: {
        userId,
        message: data.message,
        language: data.language,
        messageType: data.messageType,
        metadata: data.context ? JSON.stringify(data.context) : null,
      },
    });

    // Save AI response
    const aiResponse = await prisma.chatMessage.create({
      data: {
        userId,
        message: data.message, // Store original user message for context
        response: aiResponseContent,
        language: data.language,
        messageType: data.messageType,
        metadata: data.context ? JSON.stringify(data.context) : null,
      },
    });

    log.info('Chat message processed', {
      userId,
      messageId: userMessage.id,
      responseId: aiResponse.id,
      language: data.language,
      messageType: data.messageType,
    });

    return {
      userMessage,
      aiResponse,
    };
  }

  /**
   * Get chat messages with filtering and pagination
   */
  static async getMessages(
    query: ChatQueryInput,
    userId?: string
  ): Promise<{
    messages: ChatMessage[];
    pagination: PaginationMeta;
  }> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      language,
      messageType,
      startDate,
      endDate,
      search,
    } = query;

    // Build where clause
    const where: Prisma.ChatMessageWhereInput = {};

    if (userId) {
      where.userId = userId;
    }

    if (language) {
      where.language = language;
    }

    if (messageType) {
      where.messageType = messageType;
    }

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    // Search filter
    if (search) {
      where.OR = [
        { message: { contains: search } },
        { response: { contains: search } },
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build order by clause
    const orderBy: Prisma.ChatMessageOrderByWithRelationInput = {};
    orderBy[sortBy] = sortOrder;

    // Execute queries
    const [messages, total] = await Promise.all([
      prisma.chatMessage.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      }),
      prisma.chatMessage.count({ where }),
    ]);

    const pagination = calculatePagination(page, limit, total);

    return {
      messages,
      pagination,
    };
  }

  /**
   * Get recent messages for conversation context
   */
  static async getRecentMessages(
    userId: string, 
    limit: number = 10
  ): Promise<ChatMessage[]> {
    return prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get message by ID
   */
  static async getMessageById(
    id: string, 
    userId?: string
  ): Promise<ChatMessage> {
    const where: Prisma.ChatMessageWhereInput = { id };
    
    if (userId) {
      where.userId = userId;
    }

    const message = await prisma.chatMessage.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    if (!message) {
      throw new NotFoundError('Message not found');
    }

    // Check access permissions
    if (userId && message.userId !== userId) {
      throw new ForbiddenError('You do not have permission to view this message');
    }

    return message;
  }

  /**
   * Update message (admin only)
   */
  static async updateMessage(
    id: string, 
    data: UpdateMessageInput,
    userId: string
  ): Promise<ChatMessage> {
    const message = await prisma.chatMessage.findUnique({
      where: { id },
    });

    if (!message) {
      throw new NotFoundError('Message not found');
    }

    const updatedMessage = await prisma.chatMessage.update({
      where: { id },
      data: {
        response: data.response,
        metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
      },
    });

    log.info('Chat message updated', { messageId: id, userId });

    return updatedMessage;
  }

  /**
   * Delete message
   */
  static async deleteMessage(id: string, userId: string): Promise<void> {
    const message = await prisma.chatMessage.findUnique({
      where: { id },
    });

    if (!message) {
      throw new NotFoundError('Message not found');
    }

    // Users can only delete their own messages
    if (message.userId !== userId) {
      throw new ForbiddenError('You can only delete your own messages');
    }

    await prisma.chatMessage.delete({
      where: { id },
    });

    log.info('Chat message deleted', { messageId: id, userId });
  }

  /**
   * Clear all messages for a user
   */
  static async clearUserMessages(userId: string): Promise<void> {
    const deletedCount = await prisma.chatMessage.deleteMany({
      where: { userId },
    });

    log.info('User chat messages cleared', { 
      userId, 
      deletedCount: deletedCount.count 
    });
  }

  /**
   * Submit chat feedback
   */
  static async submitFeedback(
    data: ChatFeedbackInput,
    userId: string
  ): Promise<void> {
    // Verify message exists and belongs to user
    const message = await prisma.chatMessage.findUnique({
      where: { id: data.messageId },
    });

    if (!message) {
      throw new NotFoundError('Message not found');
    }

    if (message.userId !== userId) {
      throw new ForbiddenError('You can only provide feedback on your own messages');
    }

    // Store feedback in message metadata
    const currentMetadata = message.metadata ? JSON.parse(message.metadata as string) : {};
    const updatedMetadata = {
      ...currentMetadata,
      feedback: {
        rating: data.rating,
        feedback: data.feedback,
        submittedAt: new Date().toISOString(),
      },
    };

    await prisma.chatMessage.update({
      where: { id: data.messageId },
      data: {
        metadata: JSON.stringify(updatedMetadata),
      },
    });

    log.info('Chat feedback submitted', {
      messageId: data.messageId,
      userId,
      rating: data.rating,
    });
  }

  /**
   * Get chat statistics
   */
  static async getChatStats(query: ChatStatsQueryInput = {}): Promise<any> {
    const where: Prisma.ChatMessageWhereInput = {};

    if (query.userId) {
      where.userId = query.userId;
    }

    if (query.language) {
      where.language = query.language;
    }

    if (query.messageType) {
      where.messageType = query.messageType;
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = query.startDate;
      if (query.endDate) where.createdAt.lte = query.endDate;
    }

    const [
      totalMessages,
      messagesWithResponses,
      messagesByLanguage,
      messagesByType,
      uniqueUsers,
    ] = await Promise.all([
      prisma.chatMessage.count({ where }),
      prisma.chatMessage.count({ 
        where: { 
          ...where, 
          response: { not: null } 
        } 
      }),
      prisma.chatMessage.groupBy({
        by: ['language'],
        where,
        _count: { id: true },
      }),
      prisma.chatMessage.groupBy({
        by: ['messageType'],
        where,
        _count: { id: true },
      }),
      prisma.chatMessage.findMany({
        where,
        select: { userId: true },
        distinct: ['userId'],
      }),
    ]);

    return {
      totalMessages,
      messagesWithResponses,
      responseRate: totalMessages > 0 ? (messagesWithResponses / totalMessages) * 100 : 0,
      uniqueUsers: uniqueUsers.length,
      messagesByLanguage: messagesByLanguage.reduce((acc, item) => {
        acc[item.language] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
      messagesByType: messagesByType.reduce((acc, item) => {
        acc[item.messageType] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  /**
   * Get AI suggestions based on context
   */
  static async getSuggestions(context?: {
    location?: string;
    budget?: number;
    interests?: string[];
    language?: string;
  }): Promise<string[]> {
    try {
      return await OpenAIService.generateSuggestions(context);
    } catch (error: any) {
      log.error('Error generating suggestions', { error: error.message });
      
      // Return default suggestions based on language
      const language = context?.language || 'en';
      
      if (language === 'am') {
        return [
          'በኢትዮጵያ ውስጥ ምርጥ የቱሪዝም ቦታዎች የትኞቹ ናቸው?',
          'ስለ ላሊበላ ቤተ ክርስቲያናት ንገረኝ',
          'የኢትዮጵያ ባህላዊ ምግቦች ምንድን ናቸው?',
        ];
      }
      
      if (language === 'om') {
        return [
          'Bakka turizimii Itoophiyaa keessaa hundarra gaarii kamtu?',
          'Waaʼee mana sagadaa Lalibaalaa natti himi',
          'Nyaanni aadaa Itoophiyaa maali?',
        ];
      }
      
      return [
        'What are the best tours in Ethiopia?',
        'Tell me about Ethiopian coffee culture',
        'What should I visit in Lalibela?',
      ];
    }
  }

  /**
   * Export chat history for a user
   */
  static async exportChatHistory(
    userId: string,
    format: 'json' | 'text' = 'json'
  ): Promise<string> {
    const messages = await prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (format === 'text') {
      let textExport = `Chat History Export\n`;
      textExport += `User: ${messages[0]?.user?.name || 'Unknown'}\n`;
      textExport += `Export Date: ${new Date().toISOString()}\n`;
      textExport += `Total Messages: ${messages.length}\n\n`;
      textExport += '=' .repeat(50) + '\n\n';

      messages.forEach((message, index) => {
        textExport += `[${message.createdAt.toISOString()}]\n`;
        textExport += `User: ${message.message}\n`;
        if (message.response) {
          textExport += `Assistant: ${message.response}\n`;
        }
        textExport += '\n' + '-'.repeat(30) + '\n\n';
      });

      return textExport;
    }

    // JSON format
    return JSON.stringify({
      exportDate: new Date().toISOString(),
      user: {
        id: userId,
        name: messages[0]?.user?.name,
        email: messages[0]?.user?.email,
      },
      totalMessages: messages.length,
      messages: messages.map(msg => ({
        id: msg.id,
        message: msg.message,
        response: msg.response,
        language: msg.language,
        messageType: msg.messageType,
        metadata: msg.metadata ? JSON.parse(msg.metadata as string) : null,
        createdAt: msg.createdAt,
      })),
    }, null, 2);
  }

  /**
   * Get popular chat topics/keywords
   */
  static async getPopularTopics(limit: number = 10): Promise<Array<{
    topic: string;
    count: number;
  }>> {
    // This is a simplified implementation
    // In a real-world scenario, you'd use more sophisticated text analysis
    const messages = await prisma.chatMessage.findMany({
      select: { message: true },
      take: 1000, // Analyze recent messages
      orderBy: { createdAt: 'desc' },
    });

    // Simple keyword extraction
    const keywords: Record<string, number> = {};
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'what', 'where', 'when', 'why', 'how', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them']);

    messages.forEach(msg => {
      const words = msg.message
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3 && !commonWords.has(word));

      words.forEach(word => {
        keywords[word] = (keywords[word] || 0) + 1;
      });
    });

    return Object.entries(keywords)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([topic, count]) => ({ topic, count }));
  }
}