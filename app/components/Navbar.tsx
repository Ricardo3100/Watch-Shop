"use client";
import { AiOutlineShopping } from "react-icons/ai";
import { AiOutlineSearch, AiOutlineClose, AiOutlineMenu } from "react-icons/ai";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useStateContext } from "../context/statecontext";
import Cart from "./Cart";
import { searchProducts } from "../server-actions-utils/search";

const NAV_LINKS = [
  { label: "Products", href: "/products" },
  { label: "About", href: "/about" },
];

const Navbar = () => {
  const { showCart, setShowCart, totalQuantities } = useStateContext();

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchCompleted, setSearchCompleted] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const desktopSearchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  // Close desktop dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        desktopSearchRef.current &&
        !desktopSearchRef.current.contains(event.target as Node) &&
        mobileSearchRef.current &&
        !mobileSearchRef.current.contains(event.target as Node)
      ) {
        setSearchResults([]);
        setSearchCompleted(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (!value) {
      setSearchResults([]);
      setSearchCompleted(false);
    }
  };

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

  const clearSearch = () => {
    setSearchTerm("");
    setSearchResults([]);
    setSearchCompleted(false);
  };

  const SearchDropdown = () =>
    searchCompleted ? (
      <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 mt-1 rounded-md shadow-lg max-h-60 overflow-y-auto z-50">
        {isSearching ? (
          <div className="p-3 text-gray-500 text-sm">Searching...</div>
        ) : searchResults.length > 0 ? (
          searchResults.map((item) => (
            <Link key={item._id} href={`/product/${item._id}`}>
              <div
                className="p-2 hover:bg-gray-50 cursor-pointer flex items-center gap-3"
                onClick={() => {
                  setMobileMenuOpen(false);
                  clearSearch();
                }}
              >
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-10 h-10 object-cover rounded"
                  />
                )}
                <span className="text-sm">{item.name}</span>
              </div>
            </Link>
          ))
        ) : (
          <div className="p-3 text-gray-500 text-sm">
            No results for <span className="font-semibold">"{searchTerm}"</span>
          </div>
        )}
      </div>
    ) : null;

  return (
    <>
      <nav className="px-4 md:px-12 py-4 bg-white text-black border-b border-gray-100 sticky top-0 z-40">
        {/* ── Desktop layout ── */}
        <div className="hidden md:grid md:grid-cols-3 md:items-center md:gap-4">
          {/* Left — Logo */}
          <div>
            <Link href="/" className="font-bold text-lg tracking-tight">
              Watch Shop
            </Link>
          </div>

          {/* Centre — Search */}
          <div ref={desktopSearchRef} className="relative">
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center gap-2 border border-gray-200 px-3 py-1.5 rounded-full bg-gray-50 focus-within:bg-white focus-within:border-gray-400 transition-colors"
            >
              <AiOutlineSearch className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Search watches..."
                className="outline-none flex-1 bg-transparent text-sm"
                value={searchTerm}
                onChange={handleInputChange}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Clear search"
                >
                  <AiOutlineClose size={14} />
                </button>
              )}
            </form>
            <SearchDropdown />
          </div>

          {/* Right — Nav links + actions */}
          <div className="flex items-center justify-end gap-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-gray-600 hover:text-black transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <button
              type="button"
              className="relative"
              onClick={() => setShowCart(true)}
              aria-label="Open cart"
            >
              <AiOutlineShopping size={24} />
              {totalQuantities > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full px-1.5 text-xs leading-tight">
                  {totalQuantities}
                </span>
              )}
            </button>
            <Link
              href="/admin/login"
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Admin
            </Link>
          </div>
        </div>

        {/* ── Mobile layout ── */}
        <div className="flex md:hidden items-center justify-between gap-3">
          {/* Hamburger */}
          <button
            type="button"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
          >
            {mobileMenuOpen ? (
              <AiOutlineClose size={24} />
            ) : (
              <AiOutlineMenu size={24} />
            )}
          </button>

          {/* Logo — centred */}
          <Link
            href="/"
            className="font-bold text-lg tracking-tight absolute left-1/2 -translate-x-1/2"
          >
            Watch Shop
          </Link>

          {/* Cart */}
          <button
            type="button"
            className="relative"
            onClick={() => setShowCart(true)}
            aria-label="Open cart"
          >
            <AiOutlineShopping size={24} />
            {totalQuantities > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full px-1.5 text-xs leading-tight">
                {totalQuantities}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* ── Mobile menu drawer ── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-[61px] bg-white z-30 flex flex-col p-6 gap-6 md:hidden overflow-y-auto">
          {/* Inline search */}
          <div ref={mobileSearchRef} className="relative">
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center gap-2 border border-gray-300 px-3 py-2 rounded-lg"
            >
              <AiOutlineSearch className="w-5 h-5 text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Search watches..."
                className="outline-none flex-1 text-base"
                value={searchTerm}
                onChange={handleInputChange}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Clear search"
                >
                  <AiOutlineClose size={16} />
                </button>
              )}
            </form>
            <SearchDropdown />
          </div>

          {/* Nav links */}
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="py-3 text-lg font-medium border-b border-gray-100 hover:text-gray-500 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}

      {showCart && <Cart />}
    </>
  );
};

export default Navbar;
