"use server";

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function createPaymentIntent(cartItems: any[]) {
  const amount = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount * 100,
    currency: "usd",
    automatic_payment_methods: { enabled: true },
  });

  return paymentIntent.client_secret;
}
