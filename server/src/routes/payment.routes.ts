import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authenticate, requireRoles } from '../middlewares/auth.middleware';
import { validate, commonSchemas } from '../middlewares/validation.middleware';
import {
  createPaymentIntentSchema,
  initializeChapaPaymentSchema,
  confirmPaymentSchema,
  paymentQuerySchema,
  refundPaymentSchema,
  paymentStatsQuerySchema,
} from '../schemas/payment.schemas';

const router = Router();

/**
 * Payment Routes
 * All routes are prefixed with /api/payments
 */

// Stripe routes
router.post('/stripe/create-intent', 
  authenticate, 
  validate({ body: createPaymentIntentSchema }), 
  PaymentController.createStripePaymentIntent
);

router.post('/stripe/confirm', 
  authenticate, 
  validate({ body: confirmPaymentSchema }), 
  PaymentController.confirmStripePayment
);

router.get('/stripe/config', 
  authenticate, 
  PaymentController.getStripeConfig
);

// Stripe webhook (no authentication - verified by signature)
router.post('/stripe/webhook', 
  PaymentController.handleStripeWebhook
);

// Chapa routes
router.post('/chapa/initialize', 
  authenticate, 
  validate({ body: initializeChapaPaymentSchema }), 
  PaymentController.initializeChapaPayment
);

router.get('/chapa/verify/:txRef', 
  authenticate, 
  PaymentController.verifyChapaPayment
);

// Chapa webhook (no authentication - verified by signature)
router.post('/chapa/webhook', 
  PaymentController.handleChapaWebhook
);

// User payment routes
router.get('/my-payments', 
  authenticate,
  validate({ query: paymentQuerySchema }), 
  PaymentController.getMyPayments
);

router.get('/:id', 
  authenticate,
  validate({ params: commonSchemas.uuidParam.params }), 
  PaymentController.getPaymentById
);

// Admin routes
router.get('/', 
  authenticate, 
  requireRoles.admin,
  validate({ query: paymentQuerySchema }), 
  PaymentController.getPayments
);

router.post('/:id/refund', 
  authenticate, 
  requireRoles.admin,
  validate({ 
    params: commonSchemas.uuidParam.params,
    body: refundPaymentSchema 
  }), 
  PaymentController.refundPayment
);

router.get('/admin/stats', 
  authenticate, 
  requireRoles.admin,
  validate({ query: paymentStatsQuerySchema }), 
  PaymentController.getPaymentStats
);

export default router;
