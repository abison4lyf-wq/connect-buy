"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface CartItem {
  id: string | number;
  title: string;
  price: number;
  image: string;
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: any) => void;
  removeFromCart: (id: string | number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Hydrate cart from storage
  useEffect(() => {
    const savedCart = localStorage.getItem('nearbuy_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("Cart parse error");
      }
    }
    setIsInitialized(true);
  }, []);

  // Save cart changes unconditionally after initialization
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('nearbuy_cart', JSON.stringify(cart));
      window.dispatchEvent(new Event('nearbuy_sync')); // ensure other tabs see cart change
    }
  }, [cart, isInitialized]);


  const addToCart = (product: any) => {
    const formattedProduct = { ...product, id: String(product.id) };
    setCart((prev) => {
      const existing = prev.find((item) => String(item.id) === formattedProduct.id);
      if (existing) {
        return prev.map((item) =>
          String(item.id) === formattedProduct.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...formattedProduct, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string | number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('nearbuy_cart');
  };

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};
