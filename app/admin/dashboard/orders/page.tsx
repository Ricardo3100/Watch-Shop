import { verifyAdminPage } from "../../../lib/verifyadmin";
import OrderDAO from "../../../api/Mongo-DB/dataaccessobject/orderdao";
import Link from "next/link";
import { AiOutlineArrowLeft } from "react-icons/ai";
import { AiOutlineArrowRight } from "react-icons/ai";

export default async function AdminOrdersPage() {
  await verifyAdminPage();

  const orders = await OrderDAO.getCompletedOrders();

  return (
    <div className="min-h-screen bg-gray-100 p-10">
     <div className="flex justify-between items-center mb-8">
  <Link href="/admin/dashboard" className="flex items-center gap-2">
    <AiOutlineArrowLeft />
    Back to Dashboard
  </Link>

  <Link href="/admin/dashboard/shipping" className="flex items-center gap-2">
    To Shipping
    <AiOutlineArrowRight />  {/* ✅ arrow on the right side of the text */}
  </Link>
</div>

      <h1 className="text-3xl font-bold mb-8">Orders</h1>

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
                Total
              </th>

              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Payment
              </th>

              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Fulfillment
              </th>

              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {orders.map((order: any) => (
              <tr key={order._id.toString()} className="hover:bg-gray-50">
                {/* Order ID */}
                <td className="px-6 py-4 text-sm text-gray-900">
                  {order._id.toString()}
                </td>

                {/* Customer */}
                <td className="px-6 py-4 text-sm text-gray-700">
                  {order.shipping?.name || "—"}
                </td>

                {/* Total */}
                <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                  ${order.total}
                </td>

                {/* Payment Status */}
                <td className="px-6 py-4 text-sm">
                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                    {order.paymentStatus}
                  </span>
                </td>

                {/* Fulfillment Status */}
                <td className="px-6 py-4 text-sm">
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    {order.fulfillmentStatus || "unfulfilled"}
                  </span>
                </td>

                {/* Date */}
                <td className="px-6 py-4 text-sm text-gray-500">
                  {order.createdAt
                    ? new Date(order.createdAt).toLocaleDateString()
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
