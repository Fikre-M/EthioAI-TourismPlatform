import { Router } from 'express';
import { WebhookController } from '../controllers/webhook.controller';
import express from 'express';

const router = Router();

/**
 * Webhook Routes
 * These routes handle payment provider webhooks
 */

// Stripe webhook - requires raw body for signature verification
router.post('/stripe', 
  express.raw({ type: 'application/json' }),
  WebhookController.handleStripeWebhook
);

// Chapa webhook - requires raw body for signature verification
router.post('/chapa',
  express.raw({ type: 'application/json' }),
  WebhookController.handleChapaWebhook
);

// Webhook health check
router.get('/health', WebhookController.healthCheck);

export default router;