import { Request, Response } from 'express';

// Mock implementation for testing without Stripe
const MOCK_CLIENT_SECRET = 'pi_mock_123_secret_456';

export const createPaymentIntent = async (req: Request, res: Response) => {
  try {
    const { amount, currency = 'usd' } = req.body;

    // Validate the amount
    if (amount < 1) {
      return res.status(400).json({ error: 'Amount must be at least $1.00' });
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Return a mock payment intent
    res.status(200).json({
      clientSecret: MOCK_CLIENT_SECRET,
      mock: true, // Indicate this is a mock response
      amount,
      currency
    });
  } catch (error: any) {
    console.error('Error in mock payment intent:', error);
    res.status(500).json({ 
      error: error.message || 'Mock payment error',
      mock: true
    });
  }
};

export const getPublishableKey = (req: Request, res: Response) => {
  res.status(200).json({
    publishableKey: 'pk_test_mock_123',
    mock: true
  });
};

// For testing webhook handling
export const handleWebhook = (req: Request, res: Response) => {
  res.status(200).json({
    received: true,
    mock: true,
    event: 'mock_webhook_event'
  });
};

// Mock subscription creation
export const createSubscription = async (req: Request, res: Response) => {
  try {
    const { priceId, customerEmail } = req.body;
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    res.status(200).json({
      subscriptionId: 'sub_mock_123',
      clientSecret: MOCK_CLIENT_SECRET,
      mock: true,
      priceId,
      customerEmail
    });
  } catch (error: any) {
    res.status(500).json({ 
      error: error.message || 'Mock subscription error',
      mock: true
    });
  }
};

// Mock payment history
export const getPaymentHistory = async (req: Request, res: Response) => {
  try {
    const mockPayments = [
      {
        id: 'pi_mock_1',
        amount: 1999,
        currency: 'usd',
        status: 'succeeded',
        created: Math.floor(Date.now() / 1000) - 86400, // 1 day ago
        description: 'Mock Premium Plan'
      },
      {
        id: 'pi_mock_2',
        amount: 999,
        currency: 'usd',
        status: 'succeeded',
        created: Math.floor(Date.now() / 1000) - 172800, // 2 days ago
        description: 'Mock Basic Plan'
      }
    ];

    res.status(200).json({
      payments: mockPayments,
      mock: true
    });
  } catch (error: any) {
    res.status(500).json({ 
      error: error.message || 'Error fetching mock payment history',
      mock: true
    });
  }
};
