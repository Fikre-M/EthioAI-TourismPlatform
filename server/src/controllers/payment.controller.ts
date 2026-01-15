import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { PaymentService } from '../services/payment.service';
import { ResponseUtil } from '../utils/response';
import { log } from '../utils/logger';
import { asyncHandler } from '../middlewares/error.middleware';
import { 
  CreatePaymentIntentInput, 
  InitializeChapaPaymentInput,
  ConfirmPaymentInput,
  PaymentQueryInput,
  RefundPaymentInput,
  PaymentStatsQueryInput
} from '../schemas/payment.schemas';

export class PaymentController {
  /**
   * Create Stripe payment intent
   * POST /api/payments/stripe/create-intent
   */
  static createStripePaymentIntent = asyncHandler(async (req: AuthRequest, res: Response) => {
    const data: CreatePaymentIntentInput = req.body;
    const userId = req.userId!;
    
    const result = await PaymentService.createStripePaymentIntent(data, userId);
    
    log.info('Stripe payment intent created via API', { 
      paymentId: result.payment.id,
      userId, 
      ip: req.ip 
    });

    return ResponseUtil.created(
      res, 
      { 
        clientSecret: result.clientSecret,
        paymentIntentId: result.paymentIntentId,
        payment: result.payment 
      }, 
      'Payment intent created successfully'
    );
  });

  /**
   * Initialize Chapa payment
   * POST /api/payments/chapa/initialize
   */
  static initializeChapaPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
    const data: InitializeChapaPaymentInput = req.body;
    const userId = req.userId!;
    
    const result = await PaymentService.initializeChapaPayment(data, userId);
    
    log.info('Chapa payment initialized via API', { 
      paymentId: result.payment.id,
      userId, 
      ip: req.ip 
    });

    return ResponseUtil.created(
      res, 
      { 
        checkoutUrl: result.checkoutUrl,
        txRef: result.txRef,
        payment: result.payment 
      }, 
      'Payment initialized successfully'
    );
  });

  /**
   * Confirm Stripe payment
   * POST /api/payments/stripe/confirm
   */
  static confirmStripePayment = asyncHandler(async (req: AuthRequest, res: Response) => {
    const data: ConfirmPaymentInput = req.body;
    const userId = req.userId!;
    
    const payment = await PaymentService.confirmStripePayment(data, userId);
    
    log.info('Stripe payment confirmed via API', { 
      paymentId: payment.id,
      userId, 
      ip: req.ip 
    });

    return ResponseUtil.success(res, { payment }, 'Payment confirmed successfully');
  });

  /**
   * Verify Chapa payment
   * GET /api/payments/chapa/verify/:txRef
   */
  static verifyChapaPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { txRef } = req.params;
    const userId = req.userId!;
    
    const payment = await PaymentService.verifyChapaPayment(txRef, userId);
    
    log.info('Chapa payment verified via API', { 
      paymentId: payment.id,
      userId, 
      ip: req.ip 
    });

    return ResponseUtil.success(res, { payment }, 'Payment verified successfully');
  });

  /**
   * Get all payments (admin)
   * GET /api/payments
   */
  static getPayments = asyncHandler(async (req: AuthRequest, res: Response) => {
    const query: PaymentQueryInput = req.query as any;
    
    const result = await PaymentService.getPayments(query);
    
    return ResponseUtil.paginated(
      res, 
      result.payments, 
      result.pagination, 
      'Payments retrieved successfully'
    );
  });

  /**
   * Get payment by ID
   * GET /api/payments/:id
   */
  static getPaymentById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.userId;
    
    const payment = await PaymentService.getPaymentById(id, userId);
    
    return ResponseUtil.success(res, { payment }, 'Payment retrieved successfully');
  });

  /**
   * Get user's payments
   * GET /api/payments/my-payments
   */
  static getMyPayments = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const query: Partial<PaymentQueryInput> = req.query as any;
    
    const result = await PaymentService.getUserPayments(userId, query);
    
    return ResponseUtil.paginated(
      res, 
      result.payments, 
      result.pagination, 
      'Your payments retrieved successfully'
    );
  });

  /**
   * Refund payment (admin)
   * POST /api/payments/:id/refund
   */
  static refundPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const data: RefundPaymentInput = { ...req.body, paymentId: id };
    const userId = req.userId!;
    
    const payment = await PaymentService.refundPayment(data, userId);
    
    log.info('Payment refunded via API', { 
      paymentId: payment.id,
      userId, 
      ip: req.ip 
    });

    return ResponseUtil.success(res, { payment }, 'Payment refunded successfully');
  });

  /**
   * Get payment statistics (admin)
   * GET /api/payments/admin/stats
   */
  static getPaymentStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    const query: PaymentStatsQueryInput = req.query as any;
    
    const stats = await PaymentService.getPaymentStats(query);
    
    return ResponseUtil.success(res, stats, 'Payment statistics retrieved successfully');
  });

  /**
   * Get Stripe config (publishable key)
   * GET /api/payments/stripe/config
   */
  static getStripeConfig = asyncHandler(async (req: AuthRequest, res: Response) => {
    const publishableKey = PaymentService.getStripePublishableKey();
    
    return ResponseUtil.success(
      res, 
      { publishableKey }, 
      'Stripe configuration retrieved successfully'
    );
  });

  /**
   * Stripe webhook handler
   * POST /api/payments/stripe/webhook
   */
  static handleStripeWebhook = asyncHandler(async (req: AuthRequest, res: Response) => {
    // Webhook handling will be implemented with raw body verification
    // For now, return success
    log.info('Stripe webhook received', { 
      type: req.body.type,
      ip: req.ip 
    });

    return res.status(200).json({ received: true });
  });

  /**
   * Chapa webhook handler
   * POST /api/payments/chapa/webhook
   */
  static handleChapaWebhook = asyncHandler(async (req: AuthRequest, res: Response) => {
    // Webhook handling will be implemented
    log.info('Chapa webhook received', { 
      event: req.body.event,
      ip: req.ip 
    });

    return res.status(200).json({ received: true });
  });
}
