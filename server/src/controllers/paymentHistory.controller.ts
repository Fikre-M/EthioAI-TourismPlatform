import { Request, Response } from "express";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
});

export const getPaymentHistory = async (req: Request, res: Response) => {
  try {
    const { customerId, limit = 10, startingAfter } = req.query;
    const payments = await stripe.charges.list({
      customer: customerId as string,
      limit: Number(limit) || 10,
      ...(startingAfter && { starting_after: startingAfter as string }),
    });
    res.json(payments.data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
