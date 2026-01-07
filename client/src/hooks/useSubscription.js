import { useState } from 'react';
import { useStripe, useElements } from '@stripe/react-stripe-js';
import { createSubscription, cancelSubscription } from '../utils/api';

export const useSubscription = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [subscription, setSubscription] = useState(null);

  const subscribe = async (priceId, customerId) => {
    if (!stripe || !elements) {
      return { error: 'Stripe has not been initialized' };
    }

    setLoading(true);
    setError(null);

    try {
      // Create payment method
      const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: elements.getElement(CardElement)!,
      });

      if (paymentMethodError) {
        throw new Error(paymentMethodError.message);
      }

      // Create subscription
      const subscription = await createSubscription(customerId, priceId, paymentMethod.id);
      setSubscription(subscription);
      return { subscription };
    } catch (err) {
      setError(err.message);
      return { error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const cancel = async (subscriptionId) => {
    setLoading(true);
    setError(null);

    try {
      const result = await cancelSubscription(subscriptionId);
      setSubscription(null);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return { subscribe, cancel, loading, error, subscription };
};