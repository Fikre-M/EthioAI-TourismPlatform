import { Router } from "express";
import {
  createPaymentIntent,
  getPublishableKey,
} from "../controllers/payment.controller";
import { handleWebhook } from "../controllers/webhook.controller";
import {
  createSubscription,
  cancelSubscription,
} from "../controllers/subscription.controller";
import {
  getPaymentHistory,
  getInvoices,
} from "../controllers/paymentHistory.controller";

const router = Router();

// Get Stripe publishable key
router.get("/config", getPublishableKey);

// Create payment intent
router.post("/create-payment-intent", createPaymentIntent);

// Handle Stripe webhooks
router.post("/webhook", handleWebhook);

// Subscription routes
router.post("/subscriptions", createSubscription);
router.delete("/subscriptions/:subscriptionId", cancelSubscription);

// Payment history routes
router.get("/history", getPaymentHistory);
router.get("/invoices", getInvoices);

export default router;
