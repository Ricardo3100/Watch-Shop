"use client";

import Link from "next/link";
import { useStateContext } from "../context/statecontext";

export default function ProductCard({ product }) {
  const { onAdd } = useStateContext();

  return (
    <div className="border p-4">
      {/* Clickable Area */}
      <Link href={`/product/${product._id}`}>
        <div className="cursor-pointer">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-60 object-cover"
          />

          <h3 className="mt-4 font-semibold">{product.name}</h3>
          
          <p className="text-gray-600">${product.price}</p>
          <p className="text-gray-600">{product.stock} in stock</p>
        </div>
      </Link>

      {/* Button (Not Inside Link) */}
      <button
        onClick={() => onAdd(product, 1)}
        className="mt-3 bg-black text-white px-4 py-2 w-full"
      >
        Add to Cart
      </button>
    </div>
  );
}
