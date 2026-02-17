"use client";

import Link from "next/link";
import { useStateContext } from "../context/statecontext";

export default function ProductCard({ product }: any) {
  const { onAdd } = useStateContext();

  return (
    <div className="relative h-80 rounded-xl overflow-hidden transition-transform duration-300 hover:scale-[1.02]">
      {/* Background Image */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${product.image})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* Dark Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-36 z-10 bg-gradient-to-t from-black/95 via-black/70 to-transparent" />

      {/* Bottom Content */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-6 text-center">
        <h3 className="text-xl font-bold text-white">{product.name}</h3>
        <p className="mt-2 text-lg font-semibold text-white">
          ${product.price}
        </p>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation(); // Prevent triggering the Link
            onAdd(product, 1); // Add to cart
          }}
          className="mt-4 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-neutral-800"
        >
          Add to Cart
        </button>
      </div>

      {/* Clickable Link */}
      <Link href={`/product/${product._id}`} className="absolute inset-0 z-0" />
    </div>
  );
}
