import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);

function safeRead(key) {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeItem(item) {
  return {
    articleId: Number(item.articleId ?? item.id ?? 0),
    id: Number(item.id ?? item.articleId ?? 0),
    variationId: Number(item.variationId ?? 0),
    nom: item.nom || item.nomProduit || "",
    imageUrl: item.imageUrl || "",
    couleurNom: item.couleurNom || "",
    taillePointure: item.taillePointure || "",
    prix: Number(item.prix ?? item.prixUnitaire ?? 0),
    qty: Math.max(1, Number(item.qty ?? item.quantite ?? 1)),
  };
}

function mergeItems(...lists) {
  const map = new Map();

  for (const list of lists) {
    for (const raw of list || []) {
      const item = normalizeItem(raw);
      if (!item.articleId || !item.variationId) continue;

      const key = `${item.articleId}-${item.variationId}`;
      if (map.has(key)) {
        const old = map.get(key);
        map.set(key, {
          ...old,
          qty: Number(old.qty || 0) + Number(item.qty || 0),
        });
      } else {
        map.set(key, item);
      }
    }
  }

  return Array.from(map.values());
}

export function CartProvider({ children, me }) {
  const userKey = me?.id ? `cart_${me.id}` : null;
  const activeKey = userKey || "cart_guest";
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    const guestItems = safeRead("cart_guest");
    const userItems = userKey ? safeRead(userKey) : [];
    const merged = mergeItems(guestItems, userItems);

    setCartItems(merged);

    if (userKey) {
      localStorage.setItem(userKey, JSON.stringify(merged));
      if (guestItems.length) {
        localStorage.removeItem("cart_guest");
      }
    } else {
      localStorage.setItem("cart_guest", JSON.stringify(merged));
    }

    window.dispatchEvent(new Event("cart-updated"));
  }, [userKey]);

  useEffect(() => {
    localStorage.setItem(activeKey, JSON.stringify(cartItems));
    if (userKey) {
      localStorage.setItem(userKey, JSON.stringify(cartItems));
    }
    window.dispatchEvent(new Event("cart-updated"));
  }, [activeKey, userKey, cartItems]);

  function addToCart(product, qty = 1) {
    const item = normalizeItem({ ...product, qty });

    if (!item.articleId || !item.variationId) return;

    setCartItems((prev) => {
      const idx = prev.findIndex(
        (x) =>
          Number(x.articleId) === Number(item.articleId) &&
          Number(x.variationId) === Number(item.variationId)
      );

      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = {
          ...copy[idx],
          qty: Number(copy[idx].qty || 0) + Number(item.qty || 1),
        };
        return copy;
      }

      return [...prev, item];
    });
  }

  function updateCartItemQty(variationId, qty) {
    setCartItems((prev) =>
      prev
        .map((item) =>
          Number(item.variationId) === Number(variationId)
            ? { ...item, qty: Math.max(1, Number(qty || 1)) }
            : item
        )
        .filter((item) => Number(item.qty || 0) > 0)
    );
  }

  function removeFromCart(variationId) {
    setCartItems((prev) =>
      prev.filter((item) => Number(item.variationId) !== Number(variationId))
    );
  }

  function clearCart() {
    setCartItems([]);
    localStorage.removeItem(activeKey);
    if (userKey) localStorage.removeItem(userKey);
    localStorage.removeItem("cart_guest");
    window.dispatchEvent(new Event("cart-updated"));
  }

  return (
    <CartContext.Provider
      value={{
        cartItems,
        setCartItems,
        addToCart,
        updateCartItemQty,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return ctx;
}