import ProductDAO from "../api/Mongo-DB/dataaccessobject/productdao";
import ProductCard from "../components/ProductCard";

export default async function ShopPage() {
  const products = await ProductDAO.getAll();

  return (
    <>
      <h1 className = "text-3xl font-bold text-center"> All Products</h1>
      <div className="grid text-center grid-cols-1 md:grid-cols-3 gap-6 p-6">
        {products.map((product: any) => (
          <ProductCard key={product._id.toString()} product={product} />
        ))}
      </div>
    </>
  );
}
