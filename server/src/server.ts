import { config } from 'dotenv';
import { app } from './app';
import { log } from './utils/logger';

// Load environment variables
config();

// Initialize AI and Map services
let googleAI = null;
let mapboxClient = null;

// Google AI (Gemini) - ACTIVE
if (process.env.GOOGLE_AI_API_KEY) {
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    googleAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    log.info('✅ Google AI (Gemini) initialized');
  } catch (error) {
    log.warn('⚠️ Google AI initialization failed:', error.message);
  }
}

// Mapbox - ACTIVE
if (process.env.MAPBOX_SECRET_TOKEN) {
  try {
    // Mapbox client setup (using axios for API calls)
    const axios = require('axios');
    mapboxClient = {
      baseURL: 'https://api.mapbox.com',
      token: process.env.MAPBOX_SECRET_TOKEN,
      async request(endpoint, params = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const response = await axios.get(url, {
          params: { ...params, access_token: this.token }
        });
        return response.data;
      }
    };
    log.info('✅ Mapbox client initialized');
  } catch (error) {
    log.warn('⚠️ Mapbox initialization failed:', error.message);
  }
}

// OpenAI - PREPARED (commented out for later)
// let openaiClient = null;
// if (process.env.OPENAI_API_KEY) {
//   try {
//     const OpenAI = require('openai');
//     openaiClient = new OpenAI({
//       apiKey: process.env.OPENAI_API_KEY,
//       organization: process.env.OPENAI_ORGANIZATION_ID || undefined,
//     });
//     log.info('✅ OpenAI initialized');
//   } catch (error) {
//     log.warn('⚠️ OpenAI initialization failed:', error.message);
//   }
// }

// Anthropic - PREPARED (commented out for later)
// let anthropicClient = null;
// if (process.env.ANTHROPIC_API_KEY) {
//   try {
//     const Anthropic = require('@anthropic-ai/sdk');
//     anthropicClient = new Anthropic({
//       apiKey: process.env.ANTHROPIC_API_KEY,
//     });
//     log.info('✅ Anthropic initialized');
//   } catch (error) {
//     log.warn('⚠️ Anthropic initialization failed:', error.message);
//   }
// }

// Export clients for use in routes
export { googleAI, mapboxClient };
// Export prepared clients (commented out)
// export { openaiClient, anthropicClient };

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || 'localhost';

// Start server
const server = app.listen(PORT, () => {
  log.info(`🚀 Server running on http://${HOST}:${PORT}`);
  log.info(`📚 API Documentation: http://${HOST}:${PORT}/api/docs`);
  log.info(`🏥 Health Check: http://${HOST}:${PORT}/health`);
  log.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Log active services
  if (googleAI) log.info('🤖 Google AI service: ACTIVE');
  if (mapboxClient) log.info('🗺️ Mapbox service: ACTIVE');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  log.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    log.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  log.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    log.info('Process terminated');
    process.exit(0);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  log.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception thrown:', error);
  process.exit(1);
});

export default server;