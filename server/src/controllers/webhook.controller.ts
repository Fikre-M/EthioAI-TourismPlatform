import { Request, Response } from "express";
import Stripe from "stripe";
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { log } from '../utils/logger';
import { EmailService } from '../services/email.service';

// Initialize Stripe only if key is provided
let stripe: Stripe | null = null;

if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-01-27.acacia" as any,
  });
} else {
  console.warn('⚠️ Stripe secret key not provided - Stripe webhooks disabled');
}

const prisma = new PrismaClient();

export class WebhookController {
  /**
   * Handle Stripe webhooks with proper verification
   */
  static async handleStripeWebhook(req: Request, res: Response): Promise<void> {
    if (!stripe) {
      log.error('Stripe not configured for webhooks');
      res.status(500).json({ error: 'Stripe not configured' });
      return;
    }

    const sig = req.headers["stripe-signature"] as string;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

    if (!endpointSecret) {
      log.error('Stripe webhook secret not configured');
      res.status(500).json({ error: 'Webhook configuration error' });
      return;
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      log.info('Stripe webhook received', { type: event.type });
    } catch (err: any) {
      log.error('Stripe webhook signature verification failed', err);
      res.status(400).json({ error: `Webhook Error: ${err.message}` });
      return;
    }

    try {
      await WebhookController.processStripeEvent(event);
      res.json({ received: true });
    } catch (error: any) {
      log.error('Stripe webhook processing failed', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  /**
   * Handle Chapa webhooks with proper verification
   */
  static async handleChapaWebhook(req: Request, res: Response): Promise<void> {
    const signature = req.headers['chapa-signature'] as string;
    const secret = process.env.CHAPA_WEBHOOK_SECRET || '';

    if (!secret) {
      log.error('Chapa webhook secret not configured');
      res.status(500).json({ error: 'Webhook configuration error' });
      return;
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (!crypto.timingSafeEqual(
        Buffer.from(signature || '', 'hex'),
        Buffer.from(expectedSignature, 'hex')
      )) {
        log.security('Chapa webhook signature verification failed', undefined, undefined);
        res.status(401).json({ error: 'Invalid signature' });
        return;
      }

      log.info('Chapa webhook received', { event: req.body.event, tx_ref: req.body.tx_ref });
      await WebhookController.processChapaEvent(req.body);
      res.json({ received: true });
    } catch (error: any) {
      log.error('Chapa webhook processing failed', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  /**
   * Process Stripe webhook events
   */
  private static async processStripeEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case "payment_intent.succeeded":
        await WebhookController.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case "payment_intent.payment_failed":
        await WebhookController.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      case "payment_intent.canceled":
        await WebhookController.handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent);
        break;
      case "charge.dispute.created":
        await WebhookController.handleChargeDispute(event.data.object as Stripe.Dispute);
        break;
      case "invoice.payment_succeeded":
        await WebhookController.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case "invoice.payment_failed":
        await WebhookController.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        log.info('Unhandled Stripe webhook event type', { type: event.type });
    }
  }

  /**
   * Process Chapa webhook events
   */
  private static async processChapaEvent(data: any): Promise<void> {
    switch (data.event) {
      case "charge.success":
        await WebhookController.handleChapaChargeSuccess(data);
        break;
      case "charge.failed":
        await WebhookController.handleChapaChargeFailed(data);
        break;
      default:
        log.info('Unhandled Chapa webhook event type', { event: data.event });
    }
  }

  private static async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
      const payment = await prisma.payments.findUnique({
        where: { paymentId: paymentIntent.id },
        include: {
          bookings: {
            include: {
              users: true,
              tours: true
            }
          },
          users: true
        }
      });

      if (!payment) {
        log.error('Payment not found for successful payment intent', { paymentIntentId: paymentIntent.id });
        return;
      }

      await prisma.payments.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          gatewayResponse: JSON.stringify(paymentIntent),
          updatedAt: new Date()
        }
      });

      if (payment.bookingId && payment.bookings) {
        await prisma.bookings.update({
          where: { id: payment.bookingId },
          data: { status: 'CONFIRMED', updatedAt: new Date() }
        });

        if (payment.users && payment.bookings.tours) {
          await EmailService.sendBookingConfirmation(
            payment.users.email,
            payment.users.name || 'Customer',
            {
              bookingNumber: payment.bookings.bookingNumber,
              tourTitle: payment.bookings.tours.title,
              startDate: payment.bookings.startDate.toDateString(),
              endDate: payment.bookings.endDate.toDateString(),
              totalPrice: Number(payment.bookings.totalPrice),
              participants: payment.bookings.adults + payment.bookings.children
            }
          );
        }
      }

      log.info('Payment intent succeeded processed', { paymentId: payment.id });
    } catch (error) {
      log.error('Failed to process payment intent succeeded', error);
      throw error;
    }
  }

  private static async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
      const payment = await prisma.payments.findUnique({
        where: { paymentId: paymentIntent.id },
        include: {
          bookings: true,
          users: true
        }
      });

      if (!payment) {
        log.error('Payment not found for failed payment intent', { paymentIntentId: paymentIntent.id });
        return;
      }

      await prisma.payments.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          failureReason: paymentIntent.last_payment_error?.message || 'Payment failed',
          gatewayResponse: JSON.stringify(paymentIntent),
          updatedAt: new Date()
        }
      });

      if (payment.bookingId) {
        await prisma.bookings.update({
          where: { id: payment.bookingId },
          data: { status: 'CANCELLED', updatedAt: new Date() }
        });
      }

      log.info('Payment intent failed processed', { paymentId: payment.id });
    } catch (error) {
      log.error('Failed to process payment intent failed', error);
      throw error;
    }
  }

  private static async handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
      const payment = await prisma.payments.findUnique({
        where: { paymentId: paymentIntent.id }
      });

      if (!payment) return;

      await prisma.payments.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          failureReason: 'Payment cancelled',
          gatewayResponse: JSON.stringify(paymentIntent),
          updatedAt: new Date()
        }
      });

      if (payment.bookingId) {
        await prisma.bookings.update({
          where: { id: payment.bookingId },
          data: { status: 'CANCELLED', updatedAt: new Date() }
        });
      }

      log.info('Payment intent canceled processed', { paymentId: payment.id });
    } catch (error) {
      log.error('Failed to process payment intent canceled', error);
      throw error;
    }
  }

  private static async handleChargeDispute(dispute: Stripe.Dispute): Promise<void> {
    log.warn('Charge dispute created', {
      disputeId: dispute.id,
      charge: dispute.charge,
      amount: dispute.amount,
      reason: dispute.reason,
      status: dispute.status
    });
  }

  private static async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    log.info('Invoice payment succeeded', { invoiceId: invoice.id, amount: invoice.amount_paid });
  }

  private static async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    log.info('Invoice payment failed', { invoiceId: invoice.id, amount: invoice.amount_due });
  }

  private static async handleChapaChargeSuccess(data: any): Promise<void> {
    try {
      const payment = await prisma.payments.findFirst({
        where: { paymentId: data.tx_ref },
        include: {
          bookings: {
            include: { users: true, tours: true }
          },
          users: true
        }
      });

      if (!payment) {
        log.error('Payment not found for Chapa charge success', { tx_ref: data.tx_ref });
        return;
      }

      await prisma.payments.update({
        where: { id: payment.id },
        data: { status: 'COMPLETED', gatewayResponse: JSON.stringify(data), updatedAt: new Date() }
      });

      if (payment.bookingId) {
        await prisma.bookings.update({
          where: { id: payment.bookingId },
          data: { status: 'CONFIRMED', updatedAt: new Date() }
        });
      }

      log.info('Chapa charge success processed', { paymentId: payment.id, tx_ref: data.tx_ref });
    } catch (error) {
      log.error('Failed to process Chapa charge success', error);
      throw error;
    }
  }

  private static async handleChapaChargeFailed(data: any): Promise<void> {
    try {
      const payment = await prisma.payments.findFirst({
        where: { paymentId: data.tx_ref }
      });

      if (!payment) {
        log.error('Payment not found for Chapa charge failed', { tx_ref: data.tx_ref });
        return;
      }

      await prisma.payments.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          failureReason: data.message || 'Payment failed',
          gatewayResponse: JSON.stringify(data),
          updatedAt: new Date()
        }
      });

      if (payment.bookingId) {
        await prisma.bookings.update({
          where: { id: payment.bookingId },
          data: { status: 'CANCELLED', updatedAt: new Date() }
        });
      }

      log.info('Chapa charge failed processed', { paymentId: payment.id, tx_ref: data.tx_ref });
    } catch (error) {
      log.error('Failed to process Chapa charge failed', error);
      throw error;
    }
  }

  /**
   * Webhook health check endpoint
   */
  static async healthCheck(req: Request, res: Response): Promise<void> {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      webhooks: {
        stripe: {
          configured: !!process.env.STRIPE_WEBHOOK_SECRET,
          endpoint: '/api/webhooks/stripe'
        },
        chapa: {
          configured: !!process.env.CHAPA_WEBHOOK_SECRET,
          endpoint: '/api/webhooks/chapa'
        }
      }
    });
  }
}

// Legacy export for backward compatibility
export const handleWebhook = WebhookController.handleStripeWebhook;
