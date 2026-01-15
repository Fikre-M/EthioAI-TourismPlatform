import axios, { AxiosError } from "axios";
import { API_BASE_URL } from '@utils/constants'

// Create an axios instance with default config using standardized base URL
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Important for cookies if you're using them
  timeout: 10000,
});

// Add a response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    console.error("API Error:", error);
    return Promise.reject(error);
  }
);

interface PaymentIntentResponse {
  clientSecret: string;
  mock?: boolean;
  amount: number;
  currency: string;
}

export const createPaymentIntent = async (
  amount: number,
  currency: string = "usd"
): Promise<PaymentIntentResponse> => {
  try {
    const response = await api.post<PaymentIntentResponse>(
      "/payments/create-payment-intent",
      { amount, currency }
    );
    return response.data;
  } catch (error) {
    console.error("Error creating payment intent:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to create payment intent"
    );
  }
};

export default api;