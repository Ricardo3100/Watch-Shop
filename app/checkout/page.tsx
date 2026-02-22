"use client";

import { useEffect, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useStateContext } from "../context/statecontext";
import { createPaymentIntent } from "../server-actions-utils/create-payment-intent";
import CheckoutForm from "../components/CheckOutForm";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

export default function CheckoutPage() {
  const { cartItems } = useStateContext();
  const [clientSecret, setClientSecret] = useState("");
  const [isReady, setIsReady] = useState(false);

  // Wait for cart hydration
  useEffect(() => {
    const storedCart = localStorage.getItem("cart");
    if (storedCart) {
      setIsReady(true);
    }
  }, []);

  // Create PaymentIntent ONLY ONCE when cart is ready
  useEffect(() => {
    async function init() {
      if (!isReady || cartItems.length === 0) return;

      const secret = await createPaymentIntent(cartItems);
      setClientSecret(secret);
    }

    init();
  }, [isReady, cartItems]);

  if (!cartItems.length) {
    return <div>Your cart is empty.</div>;
  }

  if (!clientSecret) {
    return <div>Loading payment form...</div>;
  }

  // Calculate total for display ONLY
  const total = cartItems.reduce((acc, item) => {
    return acc + item.price * item.quantity;
  }, 0);

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* ORDER SUMMARY */}
      <div className="mb-8 border-b pb-6">
        <h2 className="text-xl font-bold mb-4">Order Summary</h2>

        {cartItems.map((item) => (
          <div key={item.id} className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <img
                src={item.image}
                alt={item.name}
                className="w-16 h-16 object-cover rounded"
              />

              <div>
                <p className="font-semibold">{item.name}</p>
                <p className="text-sm text-gray-500">
                  ${item.price} × {item.quantity}
                </p>
              </div>
            </div>

            <div>${(item.price * item.quantity).toFixed(2)}</div>
          </div>
        ))}

        <div className="flex justify-between font-bold mt-4 text-lg">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      {/* STRIPE FORM */}
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <CheckoutForm total={total} />
      </Elements>
    </div>
  );
}
