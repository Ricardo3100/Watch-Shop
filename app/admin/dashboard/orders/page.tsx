import { verifyAdminPage } from "../../../lib/verifyadmin";
import OrderDAO from "../../../api/Mongo-DB/dataaccessobject/orderdao";
import { safeDecrypt } from "../../../lib/encryption";
import OrdersClient from "./OrdersClient";
import Link from "next/link";
import { AiOutlineArrowLeft, AiOutlineArrowRight } from "react-icons/ai";

export default async function AdminOrdersPage() {
  await verifyAdminPage();

  const rawOrders = await OrderDAO.getCompletedOrders();

  // Decrypt PII here in the server component
  const orders = rawOrders.map((order: any) => ({
    id: order._id.toString(),
    customerName: safeDecrypt(order.shippingName) || "—",
    customerEmail: safeDecrypt(order.email) || "—",
    total: order.total,
    paymentStatus: order.paymentStatus,
    fulfillmentStatus: order.fulfillmentStatus || "unfulfilled",
    createdAt: order.createdAt
      ? new Date(order.createdAt).toLocaleDateString()
      : "—",
    refundStatus: order.refundStatus || "none",
    refundReason: order.refundReason || null,
    refundNote: order.refundNote || null,
  }));

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <div className="flex justify-between items-center mb-8">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <AiOutlineArrowLeft />
          Back to Dashboard
        </Link>
        <Link href="/admin/shipping" className="flex items-center gap-2">
          To Shipping
          <AiOutlineArrowRight />
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-8">Orders</h1>

      <OrdersClient orders={orders} />
    </div>
  );
}
