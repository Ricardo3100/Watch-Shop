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
  const [shipping, setShipping] = useState({
    fullName: "",
    email: "",
    line1: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",

  });

  // Wait for cart hydration
  useEffect(() => {
    const storedCart = localStorage.getItem("cart");
    if (storedCart) {
      setIsReady(true);
    }
  }, []);

  // Create PaymentIntent ONLY ONCE when cart is ready
  // useEffect(() => {

  //   async function init() {
  //     if (!isReady || cartItems.length === 0) return;

  //     const secret = await createPaymentIntent(cartItems);
  //     setClientSecret(secret);
  //   }

  //   init();
  // }, [isReady, cartItems])
  // ;

  if (!cartItems.length) {
    return <div>Your cart is empty.</div>;
  }

  // Calculate total for display ONLY
  const total = cartItems.reduce((acc, item) => {
    return acc + item.price * item.quantity;
  }, 0);

  return (
    <div>
      <div className="bg-blue-900 text-white p-4 rounded-lg mb-6">
        <strong>Demo Environment:</strong> This is a training project. No real
        payments are processed and no orders will be shipped.
      </div>
      <div className="max-w-2xl mx-auto p-6">
        {/* ORDER SUMMARY */}
        <div className="mb-8 border-b pb-6">
          <h2 className="text-xl font-bold mb-4">
            This site is a non-commercial demonstration project. It does not
            process real payments or ship products. All payment interactions
            occur in test mode, and any shipping information provided is used
            only to simulate order processing and is not permanently stored.
          </h2>

          <h2 className="text-xl font-bold mb-4">Order Summary</h2>

          {cartItems.map((item) => (
            <div
              key={item._id}
              className="flex items-center justify-between mb-4"
            >
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
        {!clientSecret && (
          <div className="mb-8 space-y-4">
            <h2 className="text-xl font-bold">Shipping Information</h2>

            <input
              type="text"
              placeholder="Full Name"
              className="w-full border p-2 rounded"
              onChange={(e) =>
                setShipping({ ...shipping, fullName: e.target.value })
              }
            />

            <input
              type="text"
              placeholder="Email"
              className="w-full border p-2 rounded"
              onChange={(e) =>
                setShipping({ ...shipping, email: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="Street Address"
              className="w-full border p-2 rounded"
              onChange={(e) =>
                setShipping({ ...shipping, line1: e.target.value })
              }
            />

            <input
              type="text"
              placeholder="City"
              className="w-full border p-2 rounded"
              onChange={(e) =>
                setShipping({ ...shipping, city: e.target.value })
              }
            />

            <input
              type="text"
              placeholder="State"
              className="w-full border p-2 rounded"
              onChange={(e) =>
                setShipping({ ...shipping, state: e.target.value })
              }
            />

            <input
              type="text"
              placeholder="Postal Code"
              className="w-full border p-2 rounded"
              onChange={(e) =>
                setShipping({ ...shipping, postalCode: e.target.value })
              }
            />

            <input
              type="text"
              placeholder="Country"
              className="w-full border p-2 rounded"
              onChange={(e) =>
                setShipping({ ...shipping, country: e.target.value })
              }
            />

            <button
              onClick={async () => {
                const secret = await createPaymentIntent(cartItems, shipping);
                if (secret) {
                  setClientSecret(secret);
                }
              }}
              className="w-full bg-black text-white py-2 rounded"
            >
              Continue to Payment
            </button>
          </div>
        )}

        {/* STRIPE FORM */}
        {clientSecret && (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm total={total} />
          </Elements>
        )}
      </div>
    </div>
  );
}
