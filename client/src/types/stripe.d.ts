import { Stripe, StripeElements } from "@stripe/stripe-js";

declare global {
  interface Window {
    Stripe?: Stripe;
    elements?: StripeElements;
  }
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  client_secret: string;
  created: number;
}

export interface Subscription {
  id: string;
  status: string;
  current_period_end: number;
  current_period_start: number;
  items: {
    data: Array<{
      id: string;
      price: {
        id: string;
        unit_amount: number;
        currency: string;
        product: string;
      };
    }>;
  };
}

export interface Price {
  id: string;
  unit_amount: number;
  currency: string;
  recurring: {
    interval: "day" | "week" | "month" | "year";
  };
  product: {
    id: string;
    name: string;
    description: string;
  };
}
