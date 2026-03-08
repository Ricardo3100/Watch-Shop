// This is the all product  page that displays all products.
// It fetches product data from the database
//  and renders a ProductCard for each product.
import ProductDAO from "../api/Mongo-DB/dataaccessobject/productdao";
import ProductCard from "../components/ProductCard";
import CategoryFilter from "../components/CategoryFilter";
import { Suspense } from "react";
import Link from "next/link";
import { AiOutlineArrowLeft, AiOutlineArrowRight } from "react-icons/ai";

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const categories = await ProductDAO.getCategories();
const BackLink = (
    <Link href="/products" className="flex items-center gap-2 mb-8">
      <AiOutlineArrowLeft />
      Back to Products
    </Link>
  );


  const { category: requestedCategory = "" } = await searchParams;

  const category = categories.includes(requestedCategory)
    ? requestedCategory
    : "";

  const products = category
    ? await ProductDAO.getByCategory(category)
    : await ProductDAO.getAll();

  return (
    <>
      <h1 className="text-3xl font-bold text-center">All Products</h1>
      <div className="flex justify-between items-center mb-8">
        <Link href="/" className="flex items-center gap-2">
          <AiOutlineArrowLeft />
          Back to Home
        </Link>
      </div>
      <Suspense
        fallback={<div className="text-center mb-6">Loading filter...</div>}
      >
        <CategoryFilter categories={categories} />
      </Suspense>

      {products.length === 0 ? (
        <p className="text-center text-gray-500 mt-10">
          No products found in this category.
        </p>
      ) : (
        <div className="grid text-center grid-cols-1 md:grid-cols-3 gap-6 p-6">
          {products.map((product: any) => (
            <ProductCard key={product._id.toString()} product={product} />
          ))}
        </div>
      )}
    </>
  );
}