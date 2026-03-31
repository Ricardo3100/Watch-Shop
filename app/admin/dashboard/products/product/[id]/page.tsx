import ProductDAO from "../../../../../api/Mongo-DB/dataaccessobject/productdao";
import Link from "next/link";
import { AiOutlineArrowLeft } from "react-icons/ai";
import Image from "next/image";
import AddToCartButton from "../../../../../components/AddToCartButton";
import { DBProduct, Product } from "@/types/product";
import { ObjectId } from "mongodb";


export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await ProductDAO.getById(id);

  
  const BackLink = (
    <Link href="/products" className="flex items-center gap-2 mb-8">
      <AiOutlineArrowLeft />
      Back to Products
    </Link>
  );

  if (!product) {
    return (
      <section className="max-w-5xl mx-auto px-4 py-16">
        {BackLink}
        <h1 className="text-3xl font-bold">Product not found</h1>
      </section>
    );
  }

  return (
    <section className="max-w-6xl mx-auto px-4 py-16">
      {BackLink}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
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
          <AddToCartButton product={product} />
        </div>
      </div>
    </section>
  );
}
