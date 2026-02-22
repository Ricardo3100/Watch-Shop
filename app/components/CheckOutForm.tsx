"use client";

import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useState } from "react";

export default function CheckoutForm({ total }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/success`,
      },
    });

    if (error) {
      setMessage(error.message ?? "Payment failed");
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      <PaymentElement />

      <button
        className="w-full bg-black text-white py-3 rounded-lg text-lg font-semibold focus:outline-none focus:ring-4 focus:ring-black"
        disabled={loading}
      >
        {loading ? "Processing..." : `You will be charged a total of $${total.toFixed(2)}`}
      </button>

      {message && <p className="text-red-600 font-semibold">{message}</p>}
    </form>
  );
}
