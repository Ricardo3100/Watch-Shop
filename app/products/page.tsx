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

  const { category: requestedCategory = "" } = await searchParams;

  const category = categories.includes(requestedCategory)
    ? requestedCategory
    : "";

  const products = category
    ? await ProductDAO.getByCategory(category)
    : await ProductDAO.getAll();

   

// Serialize MongoDB objects to plain objects
const plainProducts = products.map((p: any) => ({
  _id: p._id.toString(),
  name: p.name,
  price: p.price,
  image: p.image,
  stock: p.stock,
  description: p.description ?? null,
  category: p.category ?? null,
}));

  return (
    <>
      <h1 className="text-3xl font-bold text-center">All Products</h1>
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
        <>
          <div className="grid text-center grid-cols-1 md:grid-cols-3 gap-6 p-6">
            {plainProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
       
        </>
      )}
    </>
  );
}