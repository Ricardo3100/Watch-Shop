"use client";
import { useEffect } from "react";
import { useStateContext } from "../context/statecontext";

export default function FailurePage() {
  const { clearCart } = useStateContext();

    useEffect(() => {
      clearCart();
    }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
      <h1 className="text-3xl font-bold mb-4"> Payment Failed!</h1>

      <p className="text-gray-600 mb-6">Consult your bank.</p>

      <a href="/" className="bg-black text-white px-6 py-3 rounded-lg">
        Continue Shopping
      </a>
    </div>
  );
}
