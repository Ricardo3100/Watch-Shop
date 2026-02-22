"use client";
import { useEffect } from "react";
import { useStateContext } from "../context/statecontext";

export default function SuccessPage() {
  const { clearCart } = useStateContext();

    useEffect(() => {
      clearCart();
    }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
      <h1 className="text-3xl font-bold mb-4">🎉 Payment Successful!</h1>

      <p className="text-gray-600 mb-6">Thank you for your purchase.</p>

      <a href="/" className="bg-black text-white px-6 py-3 rounded-lg">
        Continue Shopping
      </a>
    </div>
  );
}
