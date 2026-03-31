"use client";

import { useStateContext } from "../context/statecontext";
import { Product } from "@/types/product";
export default function AddToCartButton({ product }: { product: Product }) {
  const { onAdd } = useStateContext();

  return (
    <button
      onClick={() => onAdd(product, 1)}
      className="mt-4 bg-black text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-neutral-800"
    >
      Add to Cart
    </button>
  );
}
