import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from 'dotenv';
import { errorHandler } from './middlewares/error.middleware';
import { notFoundHandler } from './middlewares/not-found.middleware';
import { logger } from './utils/logger';

// Import routes
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import tourRoutes from './routes/tour.routes';
import bookingRoutes from './routes/booking.routes';
import paymentRoutes from './routes/payment.routes';
import webhookRoutes from './routes/webhook.routes';
import uploadRoutes from './routes/upload.routes';
import chatRoutes from './routes/chat.routes';
import culturalRoutes from './routes/cultural.routes';
import reviewRoutes from './routes/reviews.routes';
import itineraryRoutes from './routes/itinerary.routes';
import transportRoutes from './routes/transport.routes';
import marketplaceRoutes from './routes/marketplace.routes';

// Import services for initialization
import { EmailService } from './services/email.service';
import { createPasswordResetTable } from './services/password-reset.service';
import { createEmailVerificationTable } from './services/email-verification.service';

// Load environment variables
config();

// Create Express application
export const app: Application = express();

// Initialize services
async function initializeServices() {
  try {
    // Initialize email service
    await EmailService.initialize();
    
    // Create required database tables
    await createPasswordResetTable();
    await createEmailVerificationTable();
    
    logger.info('All services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize services:', error);
  }
}

// Initialize services on startup
initializeServices();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3002',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Body parsing middleware
// Note: Webhook routes need raw body, so they're handled separately
app.use('/api/webhooks', webhookRoutes);

// Regular JSON parsing for other routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API routes
const API_PREFIX = process.env.API_PREFIX || '/api';

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);
app.use(`${API_PREFIX}/tours`, tourRoutes);
app.use(`${API_PREFIX}/bookings`, bookingRoutes);
app.use(`${API_PREFIX}/payments`, paymentRoutes);
app.use(`${API_PREFIX}/upload`, uploadRoutes);
app.use(`${API_PREFIX}/chat`, chatRoutes);
app.use(`${API_PREFIX}/cultural`, culturalRoutes);
app.use(`${API_PREFIX}/reviews`, reviewRoutes);
app.use(`${API_PREFIX}/itineraries`, itineraryRoutes);
app.use(`${API_PREFIX}/transport`, transportRoutes);
app.use(`${API_PREFIX}/marketplace`, marketplaceRoutes);

// API documentation endpoint
app.get(`${API_PREFIX}/docs`, (req: Request, res: Response) => {
  res.json({
    message: 'EthioAI Tourism Platform API',
    version: '1.0.0',
    documentation: 'https://docs.ethioai.com',
    endpoints: {
      auth: `${API_PREFIX}/auth`,
      admin: `${API_PREFIX}/admin`,
      tours: `${API_PREFIX}/tours`,
      bookings: `${API_PREFIX}/bookings`,
      payments: `${API_PREFIX}/payments`,
      webhooks: `${API_PREFIX}/webhooks`,
      upload: `${API_PREFIX}/upload`,
      chat: `${API_PREFIX}/chat`,
      cultural: `${API_PREFIX}/cultural`,
      reviews: `${API_PREFIX}/reviews`,
      itineraries: `${API_PREFIX}/itineraries`,
      transport: `${API_PREFIX}/transport`,
      marketplace: `${API_PREFIX}/marketplace`
    }
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler (must be the last middleware)
app.use(errorHandler);

export default app;









// // server/src/app.module.ts
// import { Module } from '@nestjs/common';
// import { ConfigModule } from '@nestjs/config';
// import { BookingModule } from './modules/booking/booking.module';
// import { PrismaModule } from './prisma/prisma.module';
// import { AuthModule } from './modules/auth/auth.module';

// @Module({
//   imports: [
//     ConfigModule.forRoot({
//       isGlobal: true,
//     }),
//     PrismaModule,
//     AuthModule,
//     BookingModule,
//   ],
// })
// export class AppModule {}