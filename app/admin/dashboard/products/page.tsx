import Link from "next/link";
import { verifyAdminPage } from "../../../lib/verifyadmin";
import ProductDAO from "../../../api/Mongo-DB/dataaccessobject/productdao";
import ProductCard from "../../../components/ProductCard";
import { AiOutlineArrowLeft } from "react-icons/ai";

export default async function ProductsPage() {
  // 🔐 Verify admin authentication
  const admin = await verifyAdminPage();

  // 📦 Load all products from Mongo
  const products = await ProductDAO.getAll();

  return (
    <div className="min-h-screen bg-gray-800 p-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 border-b border-gray-700 pb-4">
        <div>
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-2 mb-8"
          >
            <AiOutlineArrowLeft />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-white">Products</h1>
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

      {/* Product Grid */}
      <div className="grid text-center grid-cols-1 md:grid-cols-3 gap-6 p-6">
        {products.map((product: any) => (
          <ProductCard key={product._id.toString()} product={product} />
        ))}
      </div>
    </div>
  );
}
