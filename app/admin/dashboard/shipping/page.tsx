import { verifyAdminPage } from "../../../lib/verifyadmin";
import OrderDAO from "../../../api/Mongo-DB/dataaccessobject/orderdao";
import Link from "next/link";
import { AiOutlineArrowLeft, AiOutlineArrowRight } from "react-icons/ai";
import ShipButton from "./shipbutton/page";
import { safeDecrypt } from "../../../lib/encryption";

export default async function ShippingPage() {
  await verifyAdminPage();

  // getPendingOrders filters by fulfillmentStatus: "pending"
  // so only unshipped paid orders appear here
  const orders = await OrderDAO.getPendingOrders();

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <div className="flex justify-between items-center mb-8">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <AiOutlineArrowLeft />
          Back to Dashboard
        </Link>
        <Link href="/admin/orders" className="flex items-center gap-2">
          To Orders
          <AiOutlineArrowRight />
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-2">Shipping</h1>
      <p className="text-gray-500 mb-8">
        These orders have been paid and are waiting to be shipped.
      </p>

      {orders.length === 0 && (
        <div className="bg-white shadow rounded-lg p-10 text-center text-gray-500">
          No orders waiting to be shipped.
        </div>
      )}

      {orders.length > 0 && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fulfillment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ship
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order: any) => {
                // ----------------------------
                // 🔓 DECRYPT PII FOR DISPLAY
                // ----------------------------
                // These fields were encrypted when the order
                // was created in the Stripe webhook.
                // We decrypt here only for display —
                // the decrypted values exist in memory only
                // for the duration of this page render.
                const shippingName = safeDecrypt(order.shippingName) || "—";
                const customerEmail = safeDecrypt(order.email) || "—";

                // shippingAddress was stored as an encrypted
                // JSON string — decrypt then parse it back
                // into an object so we can access the fields
                const shippingAddress = (() => {
                  try {
                    const raw = safeDecrypt(order.shippingAddress);
                    return raw ? JSON.parse(raw) : null;
                  } catch {
                    return null;
                  }
                })();

                const fullAddress = shippingAddress
                  ? [
                      shippingAddress.line1,
                      `${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postal_code}`,
                      shippingAddress.country,
                    ]
                      .filter(Boolean)
                      .join(", ")
                  : "—";

                return (
                  <tr key={order._id.toString()} className="hover:bg-gray-50">
                    {/* Customer name — decrypted */}
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {shippingName}
                    </td>

                    {/* Customer email — decrypted */}
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {customerEmail}
                    </td>

                    {/* Full address — decrypted and parsed */}
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {fullAddress}
                    </td>

                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      ${order.total}
                    </td>

                    {/* Payment status — set by Stripe, never changes */}
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        {order.paymentStatus || "paid"}
                      </span>
                    </td>

                    {/* Fulfillment status — starts pending, becomes shipped */}
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                        {order.fulfillmentStatus || "pending"}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-500">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString()
                        : "—"}
                    </td>

                    {/* Ship button — calls FedEx sandbox API */}
                    <td className="px-6 py-4 text-sm">
                      <ShipButton orderId={order._id.toString()} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
