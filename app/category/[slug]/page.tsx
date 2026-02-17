import Link from "next/link";
import ProductDAO from "../../api/Mongo-DB/dataaccessobject/productdao";

export default async function CategoryPage(props: any) {
  const params = await props.params; // ✅ unwrap the promise
  const slug = params.slug;

  const products = await ProductDAO.getAll();

  const filteredProducts = products.filter((p: any) => p.category === slug);

  return (
    <section className="w-full py-12">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-4xl font-bold mb-12 capitalize">
          {slug.replace("-", " ")}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {filteredProducts.map((product: any) => (
            <Link
              href={`/product/${product._id}`}
              key={product._id.toString()}
              className="block"
            >
              <div
                className="relative h-80 rounded-xl overflow-hidden flex items-end"
                style={{
                  backgroundImage: `url(${product.image})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/95 to-transparent" />

                <div className="relative z-10 w-full bg-black/90 p-6">
                  <h2 className="text-xl font-bold text-white">
                    {product.name}
                  </h2>
                  <p className="mt-2 text-lg font-semibold text-white">
                    ${product.price}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
