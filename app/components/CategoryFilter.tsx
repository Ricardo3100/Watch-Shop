"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function CategoryFilter({
  categories,
}: {
  categories: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("category") || "";

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    if (value) {
      router.push(`/products?category=${value}`);
    } else {
      router.push("/products");
    }
  }

  return (
    
    <div className="flex justify-center mb-6">

      
      <select
        value={current}
        onChange={handleChange}
        className="border border-gray-300 rounded-md px-4 py-2 text-sm text-gray-700 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-black"
      >
        <option value="">All Watches</option>
        {categories.map((cat) => (
          <option key={cat} value={cat}>
            {/* Capitalise and replace hyphens for display */}
            {cat
              .split("-")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ")}
          </option>
        ))}
      </select>
    </div>
  );
}