"use client";

import { useState } from "react";

type Order = {
  id: string;
  customerName: string;
  customerEmail: string;
  total: number;
  paymentStatus: string;
  fulfillmentStatus: string;
  createdAt: string;
  refundStatus: "none" | "requested" | "approved" | "rejected";
  refundReason: string | null;
  refundNote: string | null;
};

export default function OrdersClient({ orders }: { orders: Order[] }) {
  const [orderList, setOrderList] = useState<Order[]>(orders);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRefundAction(
    orderId: string,
    action: "approved" | "rejected",
  ) {
    setLoadingId(orderId);
    setError(null);

    try {
      const res = await fetch(`/api/admin/refund/${orderId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Something went wrong");
      }

      // Update local state so UI reflects change immediately
      setOrderList((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, refundStatus: action } : o,
        ),
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <>
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded">{error}</div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Order ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Payment Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date Of Order
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Refund
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {orderList.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">{order.id}</td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {order.customerName}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {order.customerEmail}
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                  ${order.total}
                </td>

                <td className="px-6 py-4 text-sm">
                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                    {order.paymentStatus}
                  </span>
                </td>

                <td className="px-6 py-4 text-sm">
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    {order.fulfillmentStatus}
                  </span>
                </td>

                <td className="px-6 py-4 text-sm text-gray-500">
                  {order.createdAt}
                </td>

                {/* Refund column */}
                <td className="px-6 py-4 text-sm">
                  {order.refundStatus === "none" && (
                    <span className="text-gray-400">—</span>
                  )}

                  {order.refundStatus === "requested" && (
                    <div className="flex flex-col gap-2">
                      <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full w-fit">
                        Refund Requested
                      </span>
                      {order.refundReason && (
                        <span className="text-xs text-gray-500">
                          Reason: {order.refundReason.replace(/_/g, " ")}
                        </span>
                      )}
                      {order.refundNote && (
                        <span className="text-xs text-gray-500 italic">
                          "{order.refundNote}"
                        </span>
                      )}
                      <div className="flex gap-2 mt-1">
                        <button
                          onClick={() =>
                            handleRefundAction(order.id, "approved")
                          }
                          disabled={loadingId === order.id}
                          className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          {loadingId === order.id ? "Processing..." : "Approve"}
                        </button>
                        <button
                          onClick={() =>
                            handleRefundAction(order.id, "rejected")
                          }
                          disabled={loadingId === order.id}
                          className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                        >
                          {loadingId === order.id ? "Processing..." : "Reject"}
                        </button>
                      </div>
                    </div>
                  )}

                  {order.refundStatus === "approved" && (
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                      Refunded ✅
                    </span>
                  )}

                  {order.refundStatus === "rejected" && (
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                      Rejected
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
