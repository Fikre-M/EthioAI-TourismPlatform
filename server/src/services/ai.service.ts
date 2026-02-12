import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/index';
import { log } from '../utils/logger';
import { ValidationError, ServiceUnavailableError } from '../utils/errors';
import { RateLimiter } from '../utils/rate-limiter';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
  provider: string;
  model: string;
  tokensUsed?: number;
  cost?: number;
}

export interface AIServiceOptions {
  provider?: 'openai' | 'anthropic' | 'google' | 'azure';
  model?: string;
  temperature?: number;
  maxTokens?: number;
  fallbackProviders?: string[];
}

/**
 * Enhanced AI Service with multiple providers and fallback support
 */
export class AIService {
  private static openaiClient: OpenAI | null = null;
  private static anthropicClient: Anthropic | null = null;
  private static googleClient: GoogleGenerativeAI | null = null;
  private static rateLimiter = new RateLimiter();

  /**
   * Initialize AI clients
   */
  private static initializeClients() {
    // Initialize OpenAI
    if (config.openai.apiKey && !this.openaiClient) {
      this.openaiClient = new OpenAI({
        apiKey: config.openai.apiKey,
        organization: config.openai.organizationId || undefined,
      });
    }

    // Initialize Anthropic
    if (config.ai.anthropic.apiKey && !this.anthropicClient) {
      this.anthropicClient = new Anthropic({
        apiKey: config.ai.anthropic.apiKey,
      });
    }

    // Initialize Google
    if (config.ai.google.apiKey && !this.googleClient) {
      this.googleClient = new GoogleGenerativeAI(config.ai.google.apiKey);
    }
  }

  /**
   * Generate AI response with automatic fallback
   */
  static async generateResponse(
    messages: AIMessage[],
    options: AIServiceOptions = {}
  ): Promise<AIResponse> {
    this.initializeClients();

    // Check rate limits
    await this.rateLimiter.checkLimit('ai-requests');

    const providers = options.fallbackProviders || ['openai', 'anthropic', 'google'];
    const primaryProvider = options.provider || providers[0];

    // Try primary provider first
    try {
      return await this.callProvider(primaryProvider, messages, options);
    } catch (error) {
      log.warn(`Primary AI provider ${primaryProvider} failed`, { error: error.message });

      // Try fallback providers
      for (const provider of providers.slice(1)) {
        try {
          log.info(`Trying fallback provider: ${provider}`);
          return await this.callProvider(provider, messages, options);
        } catch (fallbackError) {
          log.warn(`Fallback provider ${provider} failed`, { error: fallbackError.message });
        }
      }

      throw new ServiceUnavailableError('All AI providers are currently unavailable');
    }
  }

  /**
   * Call specific AI provider
   */
  private static async callProvider(
    provider: string,
    messages: AIMessage[],
    options: AIServiceOptions
  ): Promise<AIResponse> {
    switch (provider) {
      case 'openai':
        return this.callOpenAI(messages, options);
      case 'anthropic':
        return this.callAnthropic(messages, options);
      case 'google':
        return this.callGoogle(messages, options);
      default:
        throw new ValidationError(`Unsupported AI provider: ${provider}`);
    }
  }

  /**
   * Call OpenAI API
   */
  private static async callOpenAI(
    messages: AIMessage[],
    options: AIServiceOptions
  ): Promise<AIResponse> {
    if (!this.openaiClient) {
      throw new ServiceUnavailableError('OpenAI client not initialized');
    }

    const completion = await this.openaiClient.chat.completions.create({
      model: options.model || config.openai.model,
      messages: messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
      temperature: options.temperature || config.openai.temperature,
      max_tokens: options.maxTokens || config.openai.maxTokens,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response generated from OpenAI');
    }

    return {
      content: response,
      provider: 'openai',
      model: completion.model,
      tokensUsed: completion.usage?.total_tokens,
      cost: this.calculateOpenAICost(completion.usage?.total_tokens || 0, completion.model),
    };
  }

  /**
   * Call Anthropic API
   */
  private static async callAnthropic(
    messages: AIMessage[],
    options: AIServiceOptions
  ): Promise<AIResponse> {
    if (!this.anthropicClient) {
      throw new ServiceUnavailableError('Anthropic client not initialized');
    }

    // Convert messages format for Anthropic
    const systemMessage = messages.find(m => m.role === 'system')?.content || '';
    const conversationMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    const response = await this.anthropicClient.messages.create({
      model: options.model || config.ai.anthropic.model,
      max_tokens: options.maxTokens || config.ai.anthropic.maxTokens,
      system: systemMessage,
      messages: conversationMessages,
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Anthropic');
    }

    return {
      content: content.text,
      provider: 'anthropic',
      model: response.model,
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
      cost: this.calculateAnthropicCost(response.usage.input_tokens, response.usage.output_tokens),
    };
  }

  /**
   * Call Google Gemini API
   */
  private static async callGoogle(
    messages: AIMessage[],
    options: AIServiceOptions
  ): Promise<AIResponse> {
    if (!this.googleClient) {
      throw new ServiceUnavailableError('Google AI client not initialized');
    }

    const model = this.googleClient.getGenerativeModel({
      model: options.model || config.ai.google.model,
    });

    // Convert messages to Google format
    const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text();

    if (!content) {
      throw new Error('No response generated from Google AI');
    }

    return {
      content,
      provider: 'google',
      model: options.model || config.ai.google.model,
      tokensUsed: response.usageMetadata?.totalTokenCount,
    };
  }

  /**
   * Calculate OpenAI costs (approximate)
   */
  private static calculateOpenAICost(tokens: number, model: string): number {
    const rates = {
      'gpt-4o': { input: 0.005, output: 0.015 },
      'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
      'gpt-4-turbo': { input: 0.01, output: 0.03 },
      'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
    };

    const rate = rates[model] || rates['gpt-3.5-turbo'];
    return (tokens / 1000) * ((rate.input + rate.output) / 2);
  }

  /**
   * Calculate Anthropic costs (approximate)
   */
  private static calculateAnthropicCost(inputTokens: number, outputTokens: number): number {
    const inputRate = 0.00025; // per 1K tokens
    const outputRate = 0.00125; // per 1K tokens

    return (inputTokens / 1000) * inputRate + (outputTokens / 1000) * outputRate;
  }

  /**
   * Generate suggestions using AI
   */
  static async generateSuggestions(
    context: string,
    count: number = 5,
    options: AIServiceOptions = {}
  ): Promise<string[]> {
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `You are a helpful assistant for a tourism platform. Generate ${count} relevant suggestions based on the context provided. Return only the suggestions, one per line.`,
      },
      {
        role: 'user',
        content: `Context: ${context}\n\nGenerate ${count} helpful suggestions.`,
      },
    ];

    const response = await this.generateResponse(messages, {
      ...options,
      maxTokens: 200,
      temperature: 0.8,
    });

    return response.content
      .split('\n')
      .filter(line => line.trim())
      .slice(0, count);
  }

  /**
   * Validate message content
   */
  static validateMessageContent(content: string): boolean {
    if (!content || typeof content !== 'string') {
      return false;
    }

    // Check length limits
    if (content.length < 1 || content.length > 10000) {
      return false;
    }

    // Check for potentially harmful content (basic check)
    const harmfulPatterns = [
      /\b(hack|exploit|vulnerability)\b/i,
      /\b(password|token|secret|key)\s*[:=]/i,
    ];

    return !harmfulPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Get service health status
   */
  static async getHealthStatus(): Promise<{
    available: boolean;
    providers: Record<string, { available: boolean; model?: string; error?: string }>;
  }> {
    this.initializeClients();

    const providers = {};

    // Test OpenAI
    try {
      if (this.openaiClient) {
        await this.openaiClient.chat.completions.create({
          model: config.openai.model,
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 1,
        });
        providers['openai'] = { available: true, model: config.openai.model };
      } else {
        providers['openai'] = { available: false, error: 'Client not initialized' };
      }
    } catch (error) {
      providers['openai'] = { available: false, error: error.message };
    }

    // Test Anthropic
    try {
      if (this.anthropicClient) {
        providers['anthropic'] = { available: true, model: config.ai.anthropic.model };
      } else {
        providers['anthropic'] = { available: false, error: 'Client not initialized' };
      }
    } catch (error) {
      providers['anthropic'] = { available: false, error: error.message };
    }

    // Test Google
    try {
      if (this.googleClient) {
        providers['google'] = { available: true, model: config.ai.google.model };
      } else {
        providers['google'] = { available: false, error: 'Client not initialized' };
      }
    } catch (error) {
      providers['google'] = { available: false, error: error.message };
    }

    const available = Object.values(providers).some((p: any) => p.available);

    return { available, providers };
  }
}