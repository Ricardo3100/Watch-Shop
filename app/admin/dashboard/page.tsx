import Link from "next/link";
import { verifyAdminPage } from "../../lib/verifyadmin";

export default async function AdminDashboard() {
  const admin = await verifyAdminPage();

  return (
    <div className="min-h-screen bg-gray-800 p-10">
      <div className="flex items-center justify-between mb-8 border-b border-gray-700 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-gray-400 text-sm">Welcome back, {admin.name}</p>
        </div>

        <form action="/api/admin/logout" method="POST">
          <button
            type="submit"
            className="bg-red-500 hover:bg-red-600 transition text-white px-4 py-2 rounded"
          >
            Logout
          </button>
        </form>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Link href="/admin/dashboard/products">
          <div className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition cursor-pointer">
            <h2 className="text-xl font-semibold">Products</h2>
            <p className="text-gray-600 mt-2">
              Manage and edit store products.
            </p>
          </div>
        </Link>

        <Link href="/admin/dashboard/orders">
          <div className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition cursor-pointer">
            <h2 className="text-xl font-semibold">Orders</h2>
            <p className="text-gray-600 mt-2">
              View and process recent orders.
            </p>
          </div>
        </Link>

        <Link href="/admin/dashboard/shipping">
          <div className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition cursor-pointer">
            <h2 className="text-xl font-semibold">Shipping</h2>
            <p className="text-gray-600 mt-2">
              Prepare shipments and tracking.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
