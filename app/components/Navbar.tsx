"use client";
import { AiOutlineShopping } from "react-icons/ai";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useStateContext } from "../context/statecontext";
import Cart from "./Cart";
import { searchProducts } from "../server-actions-utils/search";

const Navbar = () => {
  const { showCart, setShowCart, totalQuantities } = useStateContext();

  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchCompleted, setSearchCompleted] = useState(false);
  const [isSearching, setIsSearching] = useState(false);


  // Ref for click outside
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
 useEffect(() => {
   const handleClickOutside = (event: MouseEvent) => {
     if (
       searchRef.current &&
       !searchRef.current.contains(event.target as Node)
     ) {
       setSearchResults([]);
       setSearchCompleted(false);
       setIsSearching(false);
     }
   };

   document.addEventListener("mousedown", handleClickOutside);
   return () => document.removeEventListener("mousedown", handleClickOutside);
 }, []);


  // Handle typing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (!value) setSearchResults([]); // clear if empty
  };

  // Handle search submit (Enter or button)
 const handleSearchSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
   e.preventDefault();
   if (!searchTerm.trim()) return;

   setIsSearching(true);
   setSearchCompleted(false);

   const results = await searchProducts(searchTerm);

   setSearchResults(results);
   setIsSearching(false);
   setSearchCompleted(true);
 };


  return (
    <nav className="px-4 md:px-12 py-4 md:py-6 bg-white text-black flex items-center justify-between relative">
      {/* Logo */}
      <Link href="/" className="hidden md:inline-block font-bold text-lg">
        Zwatches
      </Link>

      {/* Search */}
      <div ref={searchRef} className="relative flex-1 max-w-md">
        <form
          onSubmit={handleSearchSubmit}
          className="flex items-center gap-2 border px-3 py-1 rounded-md"
        >
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

          <input
            type="text"
            placeholder="Search"
            className="outline-none flex-1"
            value={searchTerm}
            onChange={handleInputChange}
          />

          <button
            type="submit"
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Search
          </button>
        </form>

        {/* Search dropdown */}
        {searchCompleted && (
          <div className="absolute top-full left-0 right-0 bg-white border mt-1 max-h-60 overflow-y-auto z-50">
            {isSearching ? (
              <div className="p-3 text-gray-500">Searching...</div>
            ) : searchResults.length > 0 ? (
              searchResults.map((item) => (
                <Link key={item._id} href={`/product/${item._id}`}>
                  <div className="p-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-10 h-10 object-cover rounded"
                      />
                    )}
                    <span>{item.name}</span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-3 text-gray-500">
                No results found for{" "}
                <span className="font-semibold">"{searchTerm}"</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Buttons */}
      <div className="flex items-center gap-4 ml-4">
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
