"use client";

/**
 * ShipButton
 *
 * This is a client component — it needs to be because
 * it handles a button click and shows loading state.
 *
 * When clicked it:
 * 1. Calls /api/admin/fedex-shipment with the order ID
 * 2. FedEx sandbox returns a tracking number
 * 3. The tracking number is saved to MongoDB
 * 4. The order disappears from this page on next load
 *    because fulfillmentStatus is now "shipped"
 */

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ShipButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleShip = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/admin/fedex-shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Shipment failed");
        return;
      }

      // Show the tracking number before refreshing
      setTrackingNumber(data.trackingNumber);

      // Wait 2 seconds so admin can see the tracking number
      // then refresh the page — order will be gone from the list
      // setTimeout(() => {
      //   router.refresh();
      // }, 2000);
    } catch (err) {
      setError("Something went wrong. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ---- SUCCESS STATE ----
  if (trackingNumber) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm font-medium text-green-800 mb-1">
          ✅ Shipment created successfully
        </p>
        <p className="text-sm text-green-700">
          Tracking number:{" "}
          <span className="font-mono font-bold">{trackingNumber}</span>
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* ---- ERROR MESSAGE ---- */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* ---- SHIP BUTTON ---- */}
      {/*
        The button copy is intentionally descriptive:
        "Create FedEx Shipment for This Order"
        rather than just "Ship".

        This follows the accessibility design philosophy
        of this project — say the full thing so the
        admin knows exactly what is about to happen
        before they click.
      */}
      <button
        onClick={handleShip}
        disabled={loading}
        className="bg-black text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading
          ? "Creating shipment with FedEx..."
          : "Create FedEx Shipment for This Order"}
      </button>
    </div>
  );
}
