import { api } from '@api/axios.config'

// Types
export interface ChatMessage {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: string
  conversationId?: string
}

export interface SendMessageRequest {
  message: string
  language?: 'en' | 'am' | 'om'
  messageType?: 'text' | 'tour_recommendation' | 'cultural_info' | 'travel_advice'
  context?: {
    tourId?: string
    location?: string
    budget?: number
    interests?: string[]
    travelDates?: {
      startDate?: string
      endDate?: string
    }
  }
}

export interface SendMessageResponse {
  userMessage: {
    id: string
    message: string
    language: string
    messageType: string
    createdAt: string
  }
  aiResponse: {
    id: string
    message: string
    response: string
    language: string
    messageType: string
    createdAt: string
  }
}

export interface ChatHistoryResponse {
  messages: Array<{
    id: string
    message: string
    response?: string
    language: string
    messageType: string
    createdAt: string
    user?: {
      id: string
      name: string
      avatar?: string
    }
  }>
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Chat Service
export const chatService = {
  /**
   * Send a message to the AI and get a response
   * @param data - Message content and optional context
   * @returns AI response
   */
  sendMessage: async (data: SendMessageRequest): Promise<SendMessageResponse> => {
    try {
      const response = await api.post<SendMessageResponse>('/chat/messages', data)
      return response.data
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to send message. Please try again.'
      )
    }
  },

  /**
   * Get chat history with pagination and filtering
   * @param params - Optional pagination and filter params
   * @returns Chat history with messages
   */
  getChatHistory: async (params?: {
    page?: number
    limit?: number
    language?: 'en' | 'am' | 'om'
    messageType?: 'text' | 'tour_recommendation' | 'cultural_info' | 'travel_advice'
    search?: string
    startDate?: string
    endDate?: string
  }): Promise<ChatHistoryResponse> => {
    try {
      const response = await api.get<ChatHistoryResponse>('/chat/messages', {
        params,
      })
      return response.data
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to load chat history.'
      )
    }
  },

  /**
   * Get recent messages for the current user
   * @param limit - Number of recent messages to retrieve
   * @returns Recent messages
   */
  getRecentMessages: async (limit: number = 10): Promise<{
    messages: Array<{
      id: string
      message: string
      response?: string
      language: string
      messageType: string
      createdAt: string
    }>
  }> => {
    try {
      const response = await api.get('/chat/recent', {
        params: { limit },
      })
      return response.data
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to load recent messages.'
      )
    }
  },

  /**
   * Get specific message by ID
   * @param messageId - Message ID
   * @returns Message details
   */
  getMessageById: async (messageId: string): Promise<{
    message: {
      id: string
      message: string
      response?: string
      language: string
      messageType: string
      createdAt: string
      user?: {
        id: string
        name: string
        avatar?: string
      }
    }
  }> => {
    try {
      const response = await api.get(`/chat/messages/${messageId}`)
      return response.data
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to load message.'
      )
    }
  },

  /**
   * Delete a specific message
   * @param messageId - Message ID
   */
  deleteMessage: async (messageId: string): Promise<void> => {
    try {
      await api.delete(`/chat/messages/${messageId}`)
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to delete message.'
      )
    }
  },

  /**
   * Clear all messages for the current user
   */
  clearAllMessages: async (): Promise<void> => {
    try {
      await api.delete('/chat/messages')
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to clear all messages.'
      )
    }
  },

  /**
   * Get AI suggestions based on context
   * @param context - Context for suggestions (e.g., current location, interests)
   * @returns Array of suggested questions
   */
  getSuggestions: async (context?: {
    location?: string
    budget?: number
    interests?: string[]
    language?: 'en' | 'am' | 'om'
  }): Promise<string[]> => {
    try {
      const response = await api.post<{ suggestions: string[] }>(
        '/chat/suggestions',
        context || {}
      )
      return response.data.suggestions
    } catch (error: any) {
      // Return default suggestions on error
      const language = context?.language || 'en'
      
      if (language === 'am') {
        return [
          'በኢትዮጵያ ውስጥ ምርጥ የቱሪዝም ቦታዎች የትኞቹ ናቸው?',
          'ስለ ላሊበላ ቤተ ክርስቲያናት ንገረኝ',
          'የኢትዮጵያ ባህላዊ ምግቦች ምንድን ናቸው?',
        ]
      }
      
      if (language === 'om') {
        return [
          'Bakka turizimii Itoophiyaa keessaa hundarra gaarii kamtu?',
          'Waaʼee mana sagadaa Lalibaalaa natti himi',
          'Nyaanni aadaa Itoophiyaa maali?',
        ]
      }
      
      return [
        'What are the best tours in Ethiopia?',
        'Tell me about Ethiopian coffee culture',
        'What should I visit in Lalibela?',
      ]
    }
  },

  /**
   * Submit feedback for a message
   * @param messageId - Message ID
   * @param rating - Rating (1-5)
   * @param feedback - Optional feedback text
   */
  submitFeedback: async (
    messageId: string,
    rating: number,
    feedback?: string
  ): Promise<void> => {
    try {
      await api.post(`/chat/messages/${messageId}/feedback`, {
        rating,
        feedback,
      })
    } catch (error: any) {
      // Silent fail for feedback - don't interrupt user experience
      console.error('Failed to submit feedback:', error)
    }
  },

  /**
   * Export conversation history
   * @param format - Export format ('text' | 'json')
   * @returns Exported data as downloadable content
   */
  exportChatHistory: async (format: 'text' | 'json' = 'json'): Promise<string> => {
    try {
      const response = await api.get('/chat/export', {
        params: { format },
        responseType: 'text',
      })
      return response.data
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to export chat history.'
      )
    }
  },

  /**
   * Get conversation summary
   * @param limit - Number of messages to include in summary
   * @returns Conversation summary
   */
  getConversationSummary: async (limit: number = 50): Promise<{
    summary: {
      totalMessages: number
      dateRange: {
        earliest?: string
        latest?: string
      }
      languages: string[]
      messageTypes: string[]
      hasResponses: boolean
      averageMessageLength: number
    }
  }> => {
    try {
      const response = await api.get('/chat/summary', {
        params: { limit },
      })
      return response.data
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to get conversation summary.'
      )
    }
  },

  /**
   * Check chat system health
   * @returns System health status
   */
  getSystemHealth: async (): Promise<{
    status: string
    timestamp: string
    services: {
      database: string
      openai: string
    }
    features: {
      aiResponses: boolean
      messageStorage: boolean
      multilingual: boolean
      feedback: boolean
    }
  }> => {
    try {
      const response = await api.get('/chat/health')
      return response.data
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to check system health.'
      )
    }
  },

  /**
   * Test AI response (development only)
   * @param message - Test message
   * @param context - Optional context
   * @returns AI response for testing
   */
  testAIResponse: async (
    message: string,
    context?: {
      language?: 'en' | 'am' | 'om'
      messageType?: 'text' | 'tour_recommendation' | 'cultural_info' | 'travel_advice'
      tourId?: string
      location?: string
      budget?: number
      interests?: string[]
      travelDates?: {
        startDate?: string
        endDate?: string
      }
    }
  ): Promise<{
    userMessage: string
    aiResponse: string
    context?: any
    timestamp: string
  }> => {
    try {
      const response = await api.post('/chat/test', {
        message,
        context,
      })
      return response.data
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to test AI response.'
      )
    }
  },
}

export default chatService

// Simulated responses for development (remove when backend is ready)
export const simulatedChatService = {
  sendMessage: async (data: { message: string; conversationId?: string }): Promise<{
    id: string
    content: string
    role: 'assistant'
    timestamp: string
    conversationId?: string
  }> => {
    try {
      // Try to use real AI backend first
      const response = await api.post('/ai/chat', {
        message: data.message,
        context: 'You are a helpful AI guide for Ethiopia tourism. Provide informative, friendly responses about Ethiopian culture, destinations, tours, and travel advice.'
      })

      if (response.data?.success && response.data?.data?.message) {
        return {
          id: Date.now().toString(),
          content: response.data.data.message,
          role: 'assistant',
          timestamp: new Date().toISOString(),
          conversationId: data.conversationId || 'default',
        }
      }
    } catch (error) {
      console.warn('AI backend not available, using simulated response:', error)
    }

    // Fallback to simulated response
    await new Promise((resolve) => setTimeout(resolve, 1500))
    const response = getSimulatedResponse(data.message)

    return {
      id: Date.now().toString(),
      content: response,
      role: 'assistant',
      timestamp: new Date().toISOString(),
      conversationId: data.conversationId || 'default',
    }
  },

  getChatHistory: async (conversationId: string): Promise<{
    conversationId: string
    messages: any[]
    createdAt: string
    updatedAt: string
  }> => {
    await new Promise((resolve) => setTimeout(resolve, 500))

    return {
      conversationId,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  },

  clearChatSession: async (_conversationId: string): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    // Simulated clear
  },
}

// Simulated AI responses
function getSimulatedResponse(userMessage: string): string {
  const lowerMessage = userMessage.toLowerCase()

  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return 'Hello! How can I help you explore Ethiopia today?'
  }
  if (lowerMessage.includes('tour') || lowerMessage.includes('trip')) {
    return 'Ethiopia offers amazing tours! Some popular options include:\n\n🏛️ Historic Route - Visit Lalibela, Gondar, and Axum\n🏔️ Simien Mountains Trek - Stunning mountain landscapes\n🌋 Danakil Depression - One of the hottest places on Earth\n🎭 Omo Valley - Experience diverse tribal cultures\n\nWould you like more details about any of these?'
  }
  if (lowerMessage.includes('lalibela')) {
    return "Lalibela is home to 11 incredible rock-hewn churches carved from solid rock in the 12th century. It's a UNESCO World Heritage site and one of Ethiopia's most sacred places. The churches are still active places of worship today!"
  }
  if (lowerMessage.includes('food') || lowerMessage.includes('eat')) {
    return 'Ethiopian cuisine is delicious and unique! Must-try dishes include:\n\n🍽️ Injera - Spongy sourdough flatbread\n🥘 Doro Wat - Spicy chicken stew\n🌱 Shiro - Chickpea stew\n☕ Ethiopian Coffee - The birthplace of coffee!\n\nWould you like restaurant recommendations?'
  }
  if (lowerMessage.includes('coffee')) {
    return "Ethiopia is the birthplace of coffee! ☕ The traditional Ethiopian coffee ceremony is a beautiful cultural experience. Coffee beans are roasted, ground, and brewed in front of you. It's served in three rounds: Abol, Tona, and Baraka. A must-experience tradition!"
  }
  if (lowerMessage.includes('when') || lowerMessage.includes('best time')) {
    return "The best time to visit Ethiopia is during the dry season from October to March. The weather is pleasant, and it's perfect for trekking and sightseeing. September is also great if you want to experience Meskel, one of Ethiopia's biggest festivals!"
  }
  if (lowerMessage.includes('language')) {
    return "Ethiopia has over 80 languages! The official language is Amharic (አማርኛ), but Oromo (Afaan Oromoo) and Tigrinya are also widely spoken. English is commonly used in tourism and business. Don't worry - most tour guides speak English!"
  }

  return "That's a great question! Ethiopia has so much to offer. Could you tell me more about what you're interested in? I can help with:\n\n• Tour recommendations\n• Cultural information\n• Travel tips\n• Destination details\n• Food and dining\n• Best times to visit"
}
