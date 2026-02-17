"use client";
import React, { useRef } from "react";
import Link from "next/link";
import { AiOutlineMinus, AiOutlinePlus, AiOutlineLeft, AiOutlineShopping } from "react-icons/ai";
import { TiDeleteOutline } from "react-icons/ti";
import { useStateContext } from "../context/statecontext";

const Cart = () => {
  const cartRef = useRef();
  const {
    totalPrice,
    totalQuantities,
    cartItems,
    showCart,
    setShowCart,
    toggleCartItemQuantity,
    onRemove,
  } = useStateContext();

  const eUSLocale = (x) => x.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 });

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={() => setShowCart(false)}
      />

      {/* Modal Content */}
      <div
        ref={cartRef}
        className="fixed top-1/2 left-1/2 z-50 w-11/12 max-w-md bg-white rounded-lg shadow-lg transform -translate-x-1/2 -translate-y-1/2 flex flex-col max-h-[80vh] overflow-hidden"
      >
        {/* Header */}
        <div className="cart-heading flex items-center p-4 border-b">
          <AiOutlineLeft size={20} onClick={() => setShowCart(false)} className="cursor-pointer" />
          <span className="ml-2 font-semibold text-lg">Your Cart</span>
          <span className="ml-auto text-gray-500">({totalQuantities} items)</span>
        </div>

        {/* Empty Cart */}
        {cartItems.length < 1 && (
          <div className="empty-cart flex flex-col items-center justify-center flex-1 text-center px-4 py-10">
            <AiOutlineShopping size={120} className="text-gray-300" />
            <h3 className="mt-4 text-xl font-medium">Your shopping bag is empty</h3>
            <Link href="/">
              <button
                type="button"
                onClick={() => setShowCart(false)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Continue Shopping
              </button>
            </Link>
          </div>
        )}

        {/* Products */}
        {cartItems.length >= 1 && (
          <div className="product-container flex-1 overflow-y-auto p-4 space-y-4">
            {cartItems.map((item) => (
              <div key={item._id} className="product flex items-center gap-4">
                <button onClick={() => onRemove(item)} className="remove-item text-red-500">
                  <TiDeleteOutline size={20} />
                </button>

                <img
                  src={item?.image}
                  alt={item?.name}
                  className="cart-product-image w-20 h-20 object-cover rounded"
                />

                <div className="item-desc flex-1 flex flex-col justify-between h-full">
                  <div>
                    <span className="font-medium">{item.name}</span>
                    <span className="block text-gray-500">
                      {item.quantity} × ${eUSLocale(item.price)}
                    </span>
                  </div>

                  <div className="quantity-desc flex items-center gap-2 mt-2">
                    <button
                      onClick={() => toggleCartItemQuantity(item._id, "dec")}
                      className="px-2 py-1 border rounded"
                    >
                      <AiOutlineMinus />
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() => toggleCartItemQuantity(item._id, "inc")}
                      className="px-2 py-1 border rounded"
                    >
                      <AiOutlinePlus />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cart Bottom */}
        {cartItems.length >= 1 && (
          <div className="cart-bottom p-4 border-t">
            <div className="flex justify-between font-semibold text-lg">
              <span>Subtotal:</span>
              <span>${eUSLocale(totalPrice)}</span>
            </div>
            <button className="mt-4 w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">
              Checkout
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default Cart;
