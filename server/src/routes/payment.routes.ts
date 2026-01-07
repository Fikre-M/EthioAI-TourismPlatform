import { Router } from "express";

// Use mock controllers in development when STRIPE_SECRET_KEY is not set
const useMock = !process.env.STRIPE_SECRET_KEY && process.env.NODE_ENV !== 'production';

// Import real or mock controllers based on environment
const { 
  createPaymentIntent,
  getPublishableKey,
  handleWebhook,
  createSubscription,
  getPaymentHistory 
} = useMock 
  ? require('../controllers/payment.controller.mock')
  : {
      ...require('../controllers/payment.controller'),
      ...require('../controllers/webhook.controller'),
      ...require('../controllers/subscription.controller'),
      ...require('../controllers/paymentHistory.controller')
    };

const router = Router();

// Use the appropriate implementation based on environment
router.get("/config", getPublishableKey);
router.post("/create-payment-intent", createPaymentIntent);
router.post("/webhook", handleWebhook);
router.post("/subscriptions", createSubscription);
router.get("/history", getPaymentHistory);

export default router;
