import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext();

export function CartProvider({ children, me }) {
  const userId = me?.id || "guest";
  const storageKey = useMemo(() => `cart_${userId}`, [userId]);
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      setCartItems(raw ? JSON.parse(raw) : []);
    } catch {
      setCartItems([]);
    }
  }, [storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(cartItems));
  }, [storageKey, cartItems]);

  function mergeGuestCartIntoUser(userId) {
    const guestKey = "cart_guest";
    const userKey = `cart_${userId}`;

    const guest = JSON.parse(localStorage.getItem(guestKey) || "[]");
    const userCart = JSON.parse(localStorage.getItem(userKey) || "[]");

    const merged = [...userCart];

    for (const item of guest) {
      const idx = merged.findIndex(
        (x) =>
          x.articleId === item.articleId &&
          x.variationId === item.variationId
      );

      if (idx !== -1) {
        merged[idx] = { ...merged[idx], qty: merged[idx].qty + item.qty };
      } else {
        merged.push(item);
      }
    }

    localStorage.setItem(userKey, JSON.stringify(merged));
    localStorage.removeItem(guestKey);
    setCartItems(merged);
  }

  function addToCart(product, qty = 1) {
    setCartItems((prev) => {
      const idx = prev.findIndex(
        (x) =>
          x.articleId === product.articleId &&
          x.variationId === product.variationId
      );

      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + qty };
        return copy;
      }

      return [...prev, { ...product, qty }];
    });
  }

  function logoutCartCleanup() {
    setCartItems([]);
  }

  return (
    <CartContext.Provider
      value={{
        cartItems,
        setCartItems,
        addToCart,
        logoutCartCleanup,
        mergeGuestCartIntoUser,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}