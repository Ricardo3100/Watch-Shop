"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { toast } from "react-hot-toast";

/* ===============================
   TYPES
=============================== */

export interface Product {
  _id: string;
  name: string;
  price: number;
  image?: any;
  quantity: number;
}

interface CartContextType {
  showCart: boolean;
  setShowCart: React.Dispatch<React.SetStateAction<boolean>>;
  cartItems: Product[];
  totalPrice: number;
  totalQuantities: number;
  qty: number;
  incQty: () => void;
  decQty: () => void;
  onAdd: (product: Product, quantity: number) => void;
  toggleCartItemQuantity: (id: string, value: "inc" | "dec") => void;
  onRemove: (product: Product) => void;
  clearCart: () => void;
}

/* ===============================
   CONTEXT
=============================== */

const Context = createContext<CartContextType | undefined>(undefined);

export const StateContext = ({ children }: { children: ReactNode }) => {
  const [showCart, setShowCart] = useState<boolean>(false);
  const [cartItems, setCartItems] = useState<Product[]>([]);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [totalQuantities, setTotalQuantities] = useState<number>(0);
  const [qty, setQty] = useState<number>(1);

  /* ===============================
     LOAD FROM LOCAL STORAGE
  =============================== */
  useEffect(() => {
    const storedCart = localStorage.getItem("cart");

    if (storedCart) {
      const parsedCart = JSON.parse(storedCart);

      setCartItems(parsedCart.cartItems || []);
      setTotalPrice(parsedCart.totalPrice || 0);
      setTotalQuantities(parsedCart.totalQuantities || 0);
    }
  }, []);

  /* ===============================
     SAVE TO LOCAL STORAGE
  =============================== */
  useEffect(() => {
    localStorage.setItem(
      "cart",
      JSON.stringify({
        cartItems,
        totalPrice,
        totalQuantities,
      }),
    );
  }, [cartItems, totalPrice, totalQuantities]);

  /* ===============================
     ADD TO CART
  =============================== */
  const onAdd = (product: Product, quantity: number) => {
    const existingProduct = cartItems.find((item) => item._id === product._id);

    setTotalPrice((prev) => prev + product.price * quantity);
    setTotalQuantities((prev) => prev + quantity);

    if (existingProduct) {
      const updatedCartItems = cartItems.map((item) =>
        item._id === product._id
          ? { ...item, quantity: item.quantity + quantity }
          : item,
      );

      setCartItems(updatedCartItems);
    } else {
      setCartItems([...cartItems, { ...product, quantity }]);
    }

    toast.success(`${quantity} ${product.name} added to the cart.`);
  };

  /* ===============================
     REMOVE
  =============================== */
  const onRemove = (product: Product) => {
    const foundProduct = cartItems.find((item) => item._id === product._id);

    if (!foundProduct) return;

    const newCartItems = cartItems.filter((item) => item._id !== product._id);

    setTotalPrice((prev) => prev - foundProduct.price * foundProduct.quantity);

    setTotalQuantities((prev) => prev - foundProduct.quantity);

    setCartItems(newCartItems);
  };

  /* ===============================
     TOGGLE QUANTITY
  =============================== */
  const toggleCartItemQuantity = (id: string, value: "inc" | "dec") => {
    const updatedCartItems = cartItems.map((item) => {
      if (item._id === id) {
        if (value === "inc") {
          setTotalPrice((prev) => prev + item.price);
          setTotalQuantities((prev) => prev + 1);

          return { ...item, quantity: item.quantity + 1 };
        }

        if (value === "dec" && item.quantity > 1) {
          setTotalPrice((prev) => prev - item.price);
          setTotalQuantities((prev) => prev - 1);

          return { ...item, quantity: item.quantity - 1 };
        }
      }

      return item;
    });

    setCartItems(updatedCartItems);
  };

  /* ===============================
     PRODUCT PAGE QTY
  =============================== */
  const incQty = () => setQty((prev) => prev + 1);

  const decQty = () => setQty((prev) => (prev - 1 < 1 ? 1 : prev - 1));

  /* ===============================
     CLEAR CART
  =============================== */
  const clearCart = () => {
    setCartItems([]);
    setTotalPrice(0);
    setTotalQuantities(0);
    localStorage.removeItem("cart");
  };

  return (
    <Context.Provider
      value={{
        showCart,
        setShowCart,
        cartItems,
        totalPrice,
        totalQuantities,
        qty,
        incQty,
        decQty,
        onAdd,
        toggleCartItemQuantity,
        onRemove,
        clearCart,
      }}
    >
      {children}
    </Context.Provider>
  );
};

/* ===============================
   CUSTOM HOOK
=============================== */

export const useStateContext = () => {
  const context = useContext(Context);
  if (!context) {
    throw new Error("useStateContext must be used inside StateContext");
  }
  return context;
};
