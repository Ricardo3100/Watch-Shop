import ProductDAO from "../../api/Mongo-DB/dataaccessobject/productdao";
import Image from "next/image";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const product = await ProductDAO.getById(id);

  if (!product) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold">Product not found</h1>
      </div>
    );
  }

  return (
    <section className="max-w-6xl mx-auto px-4 py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Image Section */}
        {/* Image Section */}
        <div className="flex items-start">
          <div className="w-full max-w-md mx-auto md:mx-0">
            <Image
              src={product.image}
              alt={product.name}
              width={500}
              height={500}
              className="w-full h-auto object-contain rounded-2xl"
              priority
            />
          </div>
        </div>

        {/* Info Section */}
        <div>
          <h1 className="text-4xl font-bold text-neutral-900">
            {product.name}
          </h1>

          <p className="mt-6 text-2xl font-semibold text-neutral-900">
            ${product.price}
          </p>

          {product.description && (
            <p className="mt-8 text-lg leading-relaxed text-neutral-800">
              {product.description}
            </p>
          )}

          {/* Example Button */}
          <button className="mt-10 bg-black text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-neutral-800 focus:outline-none focus:ring-4 focus:ring-black">
            Add to Cart
          </button>
        </div>
      </div>
    </section>
  );
}
