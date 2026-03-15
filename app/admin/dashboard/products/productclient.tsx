
"use client";
import React from "react";
import Link from "next/link";
import { AiOutlineArrowLeft } from "react-icons/ai";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Product {
  _id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  description: string;
  image: string;
}


const EMPTY_FORM = {
  name: "",
  price: "",
  stock: "",
  category: "",
  description: "",
  image: "",
};

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ ...EMPTY_FORM });
  const [addForm, setAddForm] = useState({ ...EMPTY_FORM });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ----------------------------
  // 📦 LOAD PRODUCTS
  // ----------------------------
  async function loadProducts() {
    const res = await fetch("/api/admin/product-list");
    const data = await res.json();
    setProducts(data.products || []);
  }

  useEffect(() => {
    loadProducts();
  }, []);

  // ----------------------------
  // ☑️ CHECKBOX LOGIC
  // ----------------------------
  function toggleSelect(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  }

  function toggleSelectAll() {
    if (selected.length === products.length) {
      setSelected([]);
    } else {
      setSelected(products.map((p) => p._id));
    }
  }

  // ----------------------------
  // ➕ ADD PRODUCT
  // ----------------------------
  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...addForm,
        price: parseFloat(addForm.price),
        stock: parseInt(addForm.stock),
      }),
    });

    if (res.ok) {
      setAddForm({ ...EMPTY_FORM });
      setSuccess("Product added successfully");
      await loadProducts();
      // Close the details element
      const details = document.getElementById(
        "add-product-details",
      ) as HTMLDetailsElement;
      if (details) details.open = false;
    } else {
      const data = await res.json();
      setError(data.error || "Failed to add product");
    }
    setLoading(false);
  }

  // ----------------------------
  // ✏️ EDIT PRODUCT
  // ----------------------------
  function startEdit(product: Product) {
    setEditingId(product._id);
    setEditForm({
      name: product.name,
      price: String(product.price),
      stock: String(product.stock),
      category: product.category,
      description: product.description,
      image: product.image,
    });
  }

  async function handleEdit(e: React.FormEvent, id: string) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch(`/api/admin/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...editForm,
        price: parseFloat(editForm.price),
        stock: parseInt(editForm.stock),
      }),
    });

    if (res.ok) {
      setEditingId(null);
      setSuccess("Product updated successfully");
      await loadProducts();
    } else {
      const data = await res.json();
      setError(data.error || "Failed to update product");
    }
    setLoading(false);
  }

  // ----------------------------
  // 🗑️ DELETE SINGLE
  // ----------------------------
  async function handleDeleteSingle(id: string) {
    setLoading(true);
    setError("");

    const res = await fetch(`/api/admin/products/${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setSuccess("Product deleted");
      setSelected((prev) => prev.filter((s) => s !== id));
      await loadProducts();
    } else {
      setError("Failed to delete product");
    }
    setLoading(false);
  }

  // ----------------------------
  // 🗑️ BULK DELETE
  // ----------------------------
  async function handleBulkDelete() {
    if (selected.length === 0) return;
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/products", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selected }),
    });

    if (res.ok) {
      setSuccess(`${selected.length} product(s) deleted`);
      setSelected([]);
      await loadProducts();
    } else {
      setError("Failed to delete products");
    }
    setLoading(false);
  }

  // ----------------------------
  // 🏷️ STATUS BADGE
  // ----------------------------
  function StatusBadge({ stock }: { stock: number }) {
    if (stock === 0) {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
          Out of Stock
        </span>
      );
    }
    if (stock <= 3) {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
          Low Stock
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
        Active
      </span>
    );
  }

  const inputClass =
    "w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500";


  return (
    <div className="min-h-screen bg-gray-800 p-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 border-b border-gray-700 pb-4">
        <div>
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-2 mb-2 text-gray-300 hover:text-white"
          >
            <AiOutlineArrowLeft />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-white">Products</h1>
        </div>
        <form action="/api/admin/logout" method="POST">
          <button
            type="submit"
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
          >
            Logout
          </button>
        </form>
      </div>

      {/* Status messages */}
      {error && (
        <p
          role="alert"
          className="mb-4 text-red-400 bg-red-900/30 px-4 py-2 rounded"
        >
          {error}
        </p>
      )}
      {success && (
        <p
          role="status"
          className="mb-4 text-green-400 bg-green-900/30 px-4 py-2 rounded"
        >
          {success}
        </p>
      )}

      {/* ----------------------------
          ➕ ADD PRODUCT FORM
          Uses <details> for native keyboard toggle
          No JS needed to show/hide
      ----------------------------- */}
      <details id="add-product-details" className="mb-8">
        <summary className="cursor-pointer inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium list-none">
          + Add Product
        </summary>

        <form
          onSubmit={handleAdd}
          className="mt-4 bg-white rounded-lg p-6 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div>
            <label
              htmlFor="add-name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Product Name
            </label>
            <input
              id="add-name"
              type="text"
              required
              value={addForm.name}
              onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="add-price"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Price ($)
            </label>
            <input
              id="add-price"
              type="number"
              step="0.01"
              min="0"
              required
              value={addForm.price}
              onChange={(e) =>
                setAddForm({ ...addForm, price: e.target.value })
              }
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="add-stock"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Stock
            </label>
            <input
              id="add-stock"
              type="number"
              min="0"
              required
              value={addForm.stock}
              onChange={(e) =>
                setAddForm({ ...addForm, stock: e.target.value })
              }
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="add-category"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Category
            </label>
            <select
              id="add-category"
              required
              value={addForm.category}
              onChange={(e) =>
                setAddForm({ ...addForm, category: e.target.value })
              }
              className={inputClass}
            >
              <option value="">Select a category</option>
              <option value="wrist-watch">Wrist Watch</option>
              <option value="smart-watch">Smart Watch</option>
              <option value="pocket-watch">Pocket Watch</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="add-image"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Image URL
            </label>
            <input
              id="add-image"
              type="url"
              required
              value={addForm.image}
              onChange={(e) =>
                setAddForm({ ...addForm, image: e.target.value })
              }
              className={inputClass}
            />
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="add-description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description
            </label>
            <textarea
              id="add-description"
              required
              rows={3}
              value={addForm.description}
              onChange={(e) =>
                setAddForm({ ...addForm, description: e.target.value })
              }
              className={inputClass}
            />
          </div>

          <div className="md:col-span-2 flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-medium disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Product"}
            </button>
            <button
              type="button"
              onClick={() => setAddForm({ ...EMPTY_FORM })}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded font-medium"
            >
              Clear
            </button>
          </div>
        </form>
      </details>

      {/* ----------------------------
          🗑️ BULK DELETE BAR
          Only visible when items are selected
      ----------------------------- */}
      {selected.length > 0 && (
        <div className="mb-4 flex items-center gap-4 bg-red-900/30 border border-red-500 px-4 py-3 rounded-lg">
          <span className="text-red-300 text-sm">
            {selected.length} product(s) selected
          </span>
          <button
            onClick={handleBulkDelete}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded text-sm font-medium disabled:opacity-50"
          >
            Delete Selected
          </button>
          <button
            onClick={() => setSelected([])}
            className="text-gray-400 hover:text-white text-sm"
          >
            Cancel
          </button>
        </div>
      )}

      {/* ----------------------------
          📋 PRODUCTS TABLE
      ----------------------------- */}
      <div className="bg-white rounded-lg overflow-hidden shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  aria-label="Select all products"
                  checked={
                    selected.length === products.length && products.length > 0
                  }
                  onChange={toggleSelectAll}
                  className="rounded"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Product
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Price
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Stock
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {products.map((product) => (
              <React.Fragment key={product._id}>
                {/* NORMAL ROW */}
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label={`Select ${product.name}`}
                      checked={selected.includes(product._id)}
                      onChange={() => toggleSelect(product._id)}
                      className="rounded"
                    />
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-10 h-10 object-cover rounded"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {product.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {product.category}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-700">
                    ${product.price.toFixed(2)}
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-700">
                    {product.stock}
                  </td>

                  <td className="px-4 py-3">
                    <StatusBadge stock={product.stock} />
                  </td>

                  <td className="px-4 py-3">
                    <details className="relative inline-block">
                      <summary
                        className="cursor-pointer px-2 py-1 rounded hover:bg-gray-100 text-gray-600 list-none font-bold"
                        aria-label={`Actions for ${product.name}`}
                      >
                        ⋮
                      </summary>
                      <div className="absolute right-0 mt-1 w-36 bg-white border border-gray-200 rounded shadow-lg z-10">
                        <button
                          onClick={() => startEdit(product)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDeleteSingle(product._id)}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </details>
                  </td>
                </tr>

                {/* INLINE EDIT ROW */}
                {editingId === product._id && (
                  <tr className="bg-blue-50">
                    <td colSpan={6} className="px-4 py-4">
                      <form
                        onSubmit={(e) => handleEdit(e, product._id)}
                        className="grid grid-cols-1 md:grid-cols-3 gap-4"
                      >
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Name
                          </label>
                          <input
                            type="text"
                            required
                            autoFocus
                            value={editForm.name}
                            onChange={(e) =>
                              setEditForm({ ...editForm, name: e.target.value })
                            }
                            className={inputClass}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Price ($)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            value={editForm.price}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                price: e.target.value,
                              })
                            }
                            className={inputClass}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Stock
                          </label>
                          <input
                            type="number"
                            min="0"
                            required
                            value={editForm.stock}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                stock: e.target.value,
                              })
                            }
                            className={inputClass}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Category
                          </label>
                          <select
                            required
                            value={editForm.category}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                category: e.target.value,
                              })
                            }
                            className={inputClass}
                          >
                            <option value="">Select a category</option>
                            <option value="wrist-watch">Wrist Watch</option>
                            <option value="smart-watch">Smart Watch</option>
                            <option value="pocket-watch">Pocket Watch</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Image URL
                          </label>
                          <input
                            type="url"
                            required
                            value={editForm.image}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                image: e.target.value,
                              })
                            }
                            className={inputClass}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Description
                          </label>
                          <input
                            type="text"
                            required
                            value={editForm.description}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                description: e.target.value,
                              })
                            }
                            className={inputClass}
                          />
                        </div>

                        <div className="md:col-span-3 flex gap-3">
                          <button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50"
                          >
                            {loading ? "Saving..." : "Save Changes"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded text-sm font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>

        {products.length === 0 && (
          <p className="text-center text-gray-500 py-10">
            No products found. Add one above.
          </p>
        )}
      </div>
    </div>
  );
}