import { useState } from "react";
import { useStripe, useElements } from "@stripe/react-stripe-js";
import { createPaymentIntent } from "../utils/api";

export const usePayment = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentIntent, setPaymentIntent] = useState(null);

  const createPayment = async (amount, currency = "usd") => {
    if (!stripe || !elements) {
      return { error: "Stripe has not been initialized" };
    }

    setLoading(true);
    setError(null);

    try {
      // Create payment intent on the server
      const { clientSecret } = await createPaymentIntent(amount, currency);

      // Confirm the payment on the client
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success`,
        },
        redirect: "if_required",
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      setPaymentIntent(result.paymentIntent);
      return { paymentIntent: result.paymentIntent };
    } catch (err) {
      setError(err.message);
      return { error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return { createPayment, loading, error, paymentIntent };
};
