import ProductDAO from "../api/Mongo-DB/dataaccessobject/productdao";

export default async function ShopPage() {
  const products = await ProductDAO.getAll();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
      {products.map((product: any) => (
        <div
          key={product._id.toString()}
          className="relative rounded-lg shadow h-80 flex items-end p-6 text-white"
          style={{
            backgroundImage: `url(${product.image})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-black/50 rounded-lg"></div>

          <div className="relative z-10">
            <h2 className="text-xl font-bold">{product.name}</h2>

            <p className="mt-2 text-lg">${product.price}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
