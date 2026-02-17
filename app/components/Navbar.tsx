"use client";
import { AiOutlineShopping } from "react-icons/ai";
import Link from "next/link";
import { useStateContext } from "../context/statecontext";
import Cart from "./Cart";

const Navbar = () => {
  const { showCart, setShowCart, totalQuantities } = useStateContext();

  return (
    <nav className="px-4 md:px-12 py-4 md:py-6 bg-white text-black flex items-center justify-between relative">
      {/* Logo */}
      <Link href="/" className="hidden md:inline-block font-bold text-lg">
        Zwatches
      </Link>

      {/* Search */}
      <div className="flex items-center gap-2 border px-3 py-1 rounded-md">
        <svg
          className="w-4 h-4 text-black/70"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 20 20"
        >
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
          />
        </svg>
        <input type="text" placeholder="Search" className="outline-none" />
      </div>

      {/* Right Buttons */}
      <div className="flex items-center gap-4">
        <Link href="/add-product">
          <button className="swiss-btn bg-[#212529] hover:bg-[#0047AB] text-white px-4 py-2 text-sm">
            Add Product
          </button>
        </Link>

        <button
          type="button"
          className="cart-icon relative"
          onClick={() => setShowCart(true)}
        >
          <AiOutlineShopping size={24} />
          {totalQuantities > 0 && (
            <span className="cart-item-qty absolute -top-2 -right-2 bg-red-600 text-white rounded-full px-2 text-xs">
              {totalQuantities}
            </span>
          )}
        </button>
      </div>

      {/* Modal Cart */}
      {showCart && <Cart />}
    </nav>
  );
};

export default Navbar;
