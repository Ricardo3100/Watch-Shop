import { verifyAdminPage } from "../../../lib/verifyadmin";
import OrderDAO from "../../../api/Mongo-DB/dataaccessobject/orderdao";
import Link from "next/link";
import { AiOutlineArrowLeft } from "react-icons/ai";

export default async function ShippingPage() {
  await verifyAdminPage(); // ✅ still protects the page

  // ✅ Call the database directly — no HTTP round trip needed
  const orders = await OrderDAO.getCompletedOrders();

    const BackLink = (
    <Link href="/admin/dashboard" className="flex items-center gap-2 mb-8">
      <AiOutlineArrowLeft />
      Back to Dashboard
    </Link>
  );
  return (
    <div className="min-h-screen bg-gray-100 p-10">
      {BackLink}
      <h1 className="text-3xl font-bold mb-8">Shipping Information</h1>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order: any) => (
              <tr key={order._id.toString()} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {order._id.toString()}{" "}
                  {/* ✅ ObjectId must be converted to string */}
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {order.shipping?.name || "—"}{" "}
                  {/* ✅ your docs have name in shipping, not email */}
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                  ${order.total}
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                    {order.status}
                  </span>
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
