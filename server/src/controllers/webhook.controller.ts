import { Request, Response } from "express";
import Stripe from "stripe";
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { log } from '../utils/logger';
import { EmailService } from '../services/email.service';
import { BookingService } from '../services/booking.service';
import { PaymentService } from '../services/payment.service';

// Initialize Stripe only if key is proed
let stripe: Stripe | null = null;

if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-02-25.clover",
  });
} else {
  console.warn('⚠️ Stripe secret key not proed - Stripe webhooks disabled');
}

const prisma = new PrismaClient();

export class WebhookController {
  /**
   * Handle Stripe webhooks with proper verification
   */
  static async handleStripeWebhook(req: Request, res: Response): Promise<v> {
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
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      
      log.info('Stripe webhook received', {
        type: event.type,
       event: event,
        created: event.created
      });
    } catch (err: any) {
      log.error('Stripe webhook signature verification failed', {
        error: err.message,
        signature: sig?.substring(0, 20) + '...'
      });
      res.status(400).json({ error: `Webhook Error: ${err.message}` });
      return;
    }

    try {
      // Process webhook event
      await WebhookController.processStripeEvent(event);
      
      log.info('Stripe webhook processed successfully', {
        type: event.type,
       event: event
      });
      
      res.json({ received: true });
    } catch (error: any) {
      log.error('Stripe webhook processing failed', {
        type: event.type,
       event: event,
        error: error.message
      });
      
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  /**
   * Handle Chapa webhooks with proper verification
   */
  static async handleChapaWebhook(req: Request, res: Response): Promise<v> {
    const signature = req.headers['chapa-signature'] as string;
    const secret = process.env.CHAPA_WEBHOOK_SECRET || '';
    
    if (!secret) {
      log.error('Chapa webhook secret not configured');
      res.status(500).json({ error: 'Webhook configuration error' });
      return;
    }

    try {
      // Verify Chapa webhook signature
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (!crypto.timingSafeEqual(
        Buffer.from(signature || '', 'hex'),
        Buffer.from(expectedSignature, 'hex')
      )) {
        log.security('Chapa webhook signature verification failed', undefined, undefined, {
          proedSignature: signature?.substring(0, 20) + '...',
          expectedSignature: expectedSignature.substring(0, 20) + '...'
        });
        res.status(401).json({ error: 'Inva signature' });
        return;
      }

      log.info('Chapa webhook received', {
        event: req.body.event,
        tx_ref: req.body.tx_ref
      });

      // Process Chapa webhook event
      await WebhookController.processChapaEvent(req.body);
      
      log.info('Chapa webhook processed successfully', {
        event: req.body.event,
        tx_ref: req.body.tx_ref
      });
      
      res.json({ received: true });
    } catch (error: any) {
      log.error('Chapa webhook processing failed', {
        event: req.body.event,
        error: error.message
      });
      
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  /**
   * Process Stripe webhook events
   */
  private static async processStripeEvent(event: Stripe.Event): Promise<v> {
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

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await WebhookController.handleSubscriptionEvent(event);
        break;

      case "invoice.payment_succeeded":
        await WebhookController.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await WebhookController.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case "account.updated":
        await WebhookController.handleAccountUpdated(event.data.object as Stripe.Account);
        break;

      default:
        log.info('Unhandled Stripe webhook event type', { type: event.type });
    }
  }

  /**
   * Process Chapa webhook events
   */
  private static async processChapaEvent(data: any): Promise<v> {
    switch (data.event) {
      case "charge.success":
        await WebhookController.handleChapaChargeSuccess(data);
        break;

      case "charge.failed":
        await WebhookController.handleChapaChargeFailed(data);
        break;

      case "transfer.success":
        await WebhookController.handleChapaTransferSuccess(data);
        break;

      case "transfer.failed":
        await WebhookController.handleChapaTransferFailed(data);
        break;

      default:
        log.info('Unhandled Chapa webhook event type', { event: data.event });
    }
  }

  // Stripe Event Handlers

  private static async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<v> {
    try {
      // Find payment record
      const payment = await prisma.payments.findUnique({
        where: { paymen: paymentIntent },
        include: {
          bookings: {
            include: {
              users: true,
              tour: true
            }
          },
          users: true
        }
      });

      if (!payment) {
        log.error('Payment not found for successful payment intent', {
          paymentInten: paymentIntent
        });
        return;
      }

      // Update payment status
      await prisma.payments.update({
        where: { id: payment },
        data: {
          status: 'COMPLETED',
          gatewayResponse: paymentIntent as any,
          updatedAt: new Date()
        }
      });

      // Update booking status if this is a booking payment
      if (payment.booking) {
        await prisma.bookings.update({
          where: { id: payment.bookingId },
          data: {
            status: 'CONFIRMED',
            updatedAt: new Date()
          }
        });

        // Send booking confirmation email
        await EmailService.sendBookingConfirmation(
          payment.useId.user.email,
          payment.useId.user.name || 'Customer',
          {
            bookin: payment.useId.bookin,
            tourTitle: payment.useId.tour.title,
            startDate: payment.useId.startDate.toDateString(),
            endDate: payment.useId.endDate.toDateString(),
            totalPrice: Number(payment.useId.totalPrice),
            participants: payment.useId.adults + payment.useId.children
          }
        );

        // Send payment confirmation email
        await EmailService.sendPaymentConfirmation(
          payment.use.email,
          payment.use.name || 'Customer',
          {
            amount: Number(payment.amount),
            currency: payment.currency,
            paymentMethod: payment.method,
            bookin: payment.useId.bookin,
            tourTitle: payment.useId.tour.title
          }
        );
      }

      log.info('Payment intent succeeded processed', {
        paymen: payment,
        bookin: payment.useId,
        amount: payment.amount
      });
    } catch (error) {
      log.error('Failed to process payment intent succeeded', error);
      throw error;
    }
  }

  private static async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent): Promise<v> {
    try {
      // Find payment record
      const payment = await prisma.payments.findUnique({
        where: { paymen: paymentIntent },
        include: {
          bookings: {
            include: {
              users: true,
              tour: true
            }
          },
          users: true
        }
      });

      if (!payment) {
        log.error('Payment not found for failed payment intent', {
          paymentInten: paymentIntent
        });
        return;
      }

      // Update payment status
      await prisma.payments.update({
        where: { id: payment },
        data: {
          status: 'FAILED',
          failureReason: paymentIntent.last_payment_error?.message || 'Payment failed',
          gatewayResponse: paymentIntent as any,
          updatedAt: new Date()
        }
      });

      // Update booking status if this is a booking payment
      if (payment.booking) {
        await prisma.bookings.update({
          where: { id: payment.bookingId },
          data: {
            status: 'CANCELLED',
            updatedAt: new Date()
          }
        });

        // Send payment failure notification
        await EmailService.sendEmail({
          to: payment.use.email,
          subject: 'Payment Failed - Booking Cancelled',
          html: `
            <h2>Payment Failed</h2>
            <p>Hello ${payment.use.name || 'Customer'},</p>
            <p>Unfortunately, your payment for booking ${payment.useId.bookin} has failed.</p>
            <p><strong>Reason:</strong> ${paymentIntent.last_payment_error?.message || 'Payment processing error'}</p>
            <p>Your booking has been cancelled. Please try booking again or contact support if you need assistance.</p>
            <p>Best regards,<br>The EthioAI Tourism Team</p>
          `,
          text: `Payment failed for booking ${payment.useId.bookin}. Reason: ${paymentIntent.last_payment_error?.message || 'Payment processing error'}`
        });
      }

      log.info('Payment intent failed processed', {
        paymen: payment,
        bookin: payment.useId,
        reason: paymentIntent.last_payment_error?.message
      });
    } catch (error) {
      log.error('Failed to process payment intent failed', error);
      throw error;
    }
  }

  private static async handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent): Promise<v> {
    try {
      // Find payment record
      const payment = await prisma.payments.findUnique({
        where: { paymen: paymentIntent },
        include: {
          bookings: {
            include: {
              users: true,
              tour: true
            }
          }
        }
      });

      if (!payment) {
        return;
      }

      // Update payment status
      await prisma.payments.update({
        where: { id: payment },
        data: {
          status: 'FAILED',
          failureReason: 'Payment cancelled',
          gatewayResponse: paymentIntent as any,
          updatedAt: new Date()
        }
      });

      // Update booking status if this is a booking payment
      if (payment.booking) {
        await prisma.bookings.update({
          where: { id: payment.bookingId },
          data: {
            status: 'CANCELLED',
            updatedAt: new Date()
          }
        });
      }

      log.info('Payment intent canceled processed', {
        paymen: payment,
        bookin: payment.useId
      });
    } catch (error) {
      log.error('Failed to process payment intent canceled', error);
      throw error;
    }
  }

  private static async handleChargeDispute(dispute: Stripe.Dispute): Promise<v> {
    try {
      // Find payment record by charge
      const payment = await prisma.payments.findFirst({
        where: {
          gatewayResponse: {
            path: ['latest_charge'],
            equals: dispute.charge
          }
        },
        include: {
          bookings: {
            include: {
              users: true,
              tour: true
            }
          },
          users: true
        }
      });

      if (!payment) {
        log.error('Payment not found for dispute', {
          charg: dispute.charge,
          disput: dispute
        });
        return;
      }

      // Send admin notification about dispute
      await EmailService.sendAdminNotification(
        'Payment Dispute Created',
        `A payment dispute has been created for booking ${payment.booking?.bookin || 'N/A'}`,
        {
          disput: dispute,
          charg: dispute.charge,
          amount: dispute.amount,
          reason: dispute.reason,
          status: dispute.status,
          paymen: payment,
          bookin: payment.useId,
          customerEmail: payment.use.email
        }
      );

      log.info('Charge dispute processed', {
        disput: dispute,
        paymen: payment,
        amount: dispute.amount,
        reason: dispute.reason
      });
    } catch (error) {
      log.error('Failed to process charge dispute', error);
      throw error;
    }
  }

  private static async handleSubscriptionEvent(event: Stripe.Event): Promise<v> {
    // Handle subscription events if you have subscription features
    log.info('Subscription event received', {
      type: event.type,
      subscriptio: (event.data.object as any)
    });
  }

  private static async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<v> {
    // Handle successful invoice payments
    log.info('Invoice payment succeeded', {
      invoic: invoice,
      amount: invoice.amount_p
    });
  }

  private static async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<v> {
    // Handle failed invoice payments
    log.info('Invoice payment failed', {
      invoic: invoice,
      amount: invoice.amount_due
    });
  }

  private static async handleAccountUpdated(account: Stripe.Account): Promise<v> {
    // Handle account updates (for marketplace features)
    log.info('Stripe account updated', {
      accoun: account,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled
    });
  }

  // Chapa Event Handlers

  private static async handleChapaChargeSuccess(data: any): Promise<v> {
    try {
      // Find payment record by transaction reference
      const payment = await prisma.payments.findFirst({
        where: {
          gatewayResponse: {
            path: ['tx_ref'],
            equals: data.tx_ref
          }
        },
        include: {
          bookings: {
            include: {
              users: true,
              tour: true
            }
          },
          users: true
        }
      });

      if (!payment) {
        log.error('Payment not found for Chapa charge success', {
          tx_ref: data.tx_ref
        });
        return;
      }

      // Update payment status
      await prisma.payments.update({
        where: { id: payment },
        data: {
          status: 'COMPLETED',
          gatewayResponse: data,
          updatedAt: new Date()
        }
      });

      // Update booking status if this is a booking payment
      if (payment.booking) {
        await prisma.bookings.update({
          where: { id: payment.bookingId },
          data: {
            status: 'CONFIRMED',
            updatedAt: new Date()
          }
        });

        // Send confirmation emails (similar to Stripe success handler)
        await EmailService.sendBookingConfirmation(
          payment.useId.user.email,
          payment.useId.user.name || 'Customer',
          {
            bookin: payment.useId.bookin,
            tourTitle: payment.useId.tour.title,
            startDate: payment.useId.startDate.toDateString(),
            endDate: payment.useId.endDate.toDateString(),
            totalPrice: Number(payment.useId.totalPrice),
            participants: payment.useId.adults + payment.useId.children
          }
        );
      }

      log.info('Chapa charge success processed', {
        paymen: payment,
        tx_ref: data.tx_ref,
        amount: data.amount
      });
    } catch (error) {
      log.error('Failed to process Chapa charge success', error);
      throw error;
    }
  }

  private static async handleChapaChargeFailed(data: any): Promise<v> {
    try {
      // Find payment record by transaction reference
      const payment = await prisma.payments.findFirst({
        where: {
          gatewayResponse: {
            path: ['tx_ref'],
            equals: data.tx_ref
          }
        },
        include: {
          bookings: {
            include: {
              users: true,
              tour: true
            }
          },
          users: true
        }
      });

      if (!payment) {
        log.error('Payment not found for Chapa charge failed', {
          tx_ref: data.tx_ref
        });
        return;
      }

      // Update payment status
      await prisma.payments.update({
        where: { id: payment },
        data: {
          status: 'FAILED',
          failureReason: data.message || 'Payment failed',
          gatewayResponse: data,
          updatedAt: new Date()
        }
      });

      // Update booking status if this is a booking payment
      if (payment.booking) {
        await prisma.bookings.update({
          where: { id: payment.bookingId },
          data: {
            status: 'CANCELLED',
            updatedAt: new Date()
          }
        });

        // Send failure notification
        await EmailService.sendEmail({
          to: payment.use.email,
          subject: 'Payment Failed - Booking Cancelled',
          html: `
            <h2>Payment Failed</h2>
            <p>Hello ${payment.use.name || 'Customer'},</p>
            <p>Unfortunately, your payment for booking ${payment.useId.bookin} has failed.</p>
            <p><strong>Reason:</strong> ${data.message || 'Payment processing error'}</p>
            <p>Your booking has been cancelled. Please try booking again or contact support if you need assistance.</p>
            <p>Best regards,<br>The EthioAI Tourism Team</p>
          `,
          text: `Payment failed for booking ${payment.useId.bookin}. Reason: ${data.message || 'Payment processing error'}`
        });
      }

      log.info('Chapa charge failed processed', {
        paymen: payment,
        tx_ref: data.tx_ref,
        reason: data.message
      });
    } catch (error) {
      log.error('Failed to process Chapa charge failed', error);
      throw error;
    }
  }

  private static async handleChapaTransferSuccess(data: any): Promise<v> {
    // Handle successful transfers (for marketplace payouts)
    log.info('Chapa transfer success', {
      tx_ref: data.tx_ref,
      amount: data.amount
    });
  }

  private static async handleChapaTransferFailed(data: any): Promise<v> {
    // Handle failed transfers
    log.info('Chapa transfer failed', {
      tx_ref: data.tx_ref,
      reason: data.message
    });
  }

  /**
   * Webhook health check endpoint
   */
  static async healthCheck(req: Request, res: Response): Promise<v> {
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
