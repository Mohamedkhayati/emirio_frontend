import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../lib/api";

const CartContext = createContext(null);
const GUEST_CART_KEY = "cart_guest";

function isLikelyModelUrl(value = "") {
  const v = String(value || "").toLowerCase();
  return (
    v.includes("model3d") ||
    v.endsWith(".glb") ||
    v.endsWith(".gltf") ||
    v.endsWith(".obj") ||
    v.endsWith(".fbx") ||
    v.endsWith(".stl")
  );
}

function sanitizeImageUrl(value = "") {
  if (!value) return "";
  if (isLikelyModelUrl(value)) return "";
  return String(value);
}

function safeRead(key) {
  if (!key) return [];
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeWrite(key, value) {
  if (!key) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function safeRemove(key) {
  if (!key) return;
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

function emitCartUpdated() {
  window.dispatchEvent(new Event("cart-updated"));
}

function normalizeItem(item = {}) {
  return {
    articleId: Number(item.articleId ?? item.id ?? 0),
    id: Number(item.id ?? item.articleId ?? 0),
    variationId: Number(item.variationId ?? 0),
    nom: item.nom || item.nomProduit || "",
    imageUrl: sanitizeImageUrl(item.imageUrl || item.previewImage || ""),
    couleurId: item.couleurId ?? "",
    couleurNom: item.couleurNom || "",
    tailleId: item.tailleId ?? "",
    taillePointure: item.taillePointure || item.pointure || "",
    prix: Number(item.prix ?? item.prixUnitaire ?? 0),
    qty: Math.max(1, Number(item.qty ?? item.quantite ?? 1)),
  };
}

function serverLineToCartItem(line = {}) {
  return normalizeItem({
    articleId: line.articleId,
    id: line.articleId,
    variationId: line.variationId,
    nomProduit: line.nomProduit,
    imageUrl: line.imageUrl,
    couleurNom: line.couleurNom,
    taillePointure: line.taillePointure,
    quantite: line.quantite,
    prixUnitaire: line.prixUnitaire,
  });
}

function mergeItems(...lists) {
  const map = new Map();

  for (const list of lists) {
    for (const raw of list || []) {
      const item = normalizeItem(raw);

      if (!item.articleId || !item.variationId) continue;

      const key = `${item.articleId}-${item.variationId}`;

      if (!map.has(key)) {
        map.set(key, item);
      } else {
        const old = map.get(key);
        map.set(key, {
          ...old,
          nom: item.nom || old.nom,
          imageUrl: item.imageUrl || old.imageUrl,
          couleurId: item.couleurId || old.couleurId,
          couleurNom: item.couleurNom || old.couleurNom,
          tailleId: item.tailleId || old.tailleId,
          taillePointure: item.taillePointure || old.taillePointure,
          prix: Number(item.prix || old.prix || 0),
          qty: Number(old.qty || 0) + Number(item.qty || 0),
        });
      }
    }
  }

  return Array.from(map.values());
}

function toSyncPayload(items) {
  return {
    items: (items || [])
      .filter((item) => Number(item.articleId) > 0 && Number(item.variationId) > 0)
      .map((item) => ({
        articleId: Number(item.articleId),
        variationId: Number(item.variationId),
        nomProduit: item.nom || "",
        imageUrl: sanitizeImageUrl(item.imageUrl || ""),
        couleurNom: item.couleurNom || "",
        taillePointure: item.taillePointure || "",
        quantite: Math.max(1, Number(item.qty || 1)),
        prixUnitaire: Number(item.prix || 0),
      })),
  };
}

function snapshotCart(items) {
  return JSON.stringify(
    (items || [])
      .map((item) => ({
        articleId: Number(item.articleId || 0),
        variationId: Number(item.variationId || 0),
        qty: Number(item.qty || 0),
        prix: Number(item.prix || 0),
        nom: item.nom || "",
        imageUrl: item.imageUrl || "",
        couleurNom: item.couleurNom || "",
        taillePointure: item.taillePointure || "",
      }))
      .sort((a, b) => {
        if (a.articleId !== b.articleId) return a.articleId - b.articleId;
        return a.variationId - b.variationId;
      })
  );
}

export function CartProvider({ children, me }) {
  const userKey = me?.id ? `cart_${me.id}` : null;
  const activeKey = userKey || GUEST_CART_KEY;

  const hydratedRef = useRef(false);
  const lastSyncedSnapshotRef = useRef("");
  const [cartItems, setCartItems] = useState(() => mergeItems(safeRead(activeKey)));
  const [syncError, setSyncError] = useState("");

  useEffect(() => {
    let cancelled = false;
    hydratedRef.current = false;

    async function hydrateCart() {
      const guestItems = mergeItems(safeRead(GUEST_CART_KEY));

      if (!userKey) {
        if (cancelled) return;

        setCartItems(guestItems);
        safeWrite(GUEST_CART_KEY, guestItems);
        lastSyncedSnapshotRef.current = snapshotCart([]);
        hydratedRef.current = true;
        emitCartUpdated();
        return;
      }

      const cachedUserItems = mergeItems(safeRead(userKey));
      let baseUserItems = cachedUserItems;

      try {
        const { data } = await api.get("/api/cart");
        const serverItems = Array.isArray(data?.items)
          ? data.items.map(serverLineToCartItem)
          : [];
        baseUserItems = mergeItems(serverItems);
      } catch {
        baseUserItems = cachedUserItems;
      }

      const merged = mergeItems(baseUserItems, guestItems);

      if (cancelled) return;

      setCartItems(merged);
      safeWrite(userKey, merged);
      safeRemove(GUEST_CART_KEY);

      lastSyncedSnapshotRef.current = snapshotCart(baseUserItems);
      hydratedRef.current = true;
      emitCartUpdated();
    }

    hydrateCart();

    return () => {
      cancelled = true;
    };
  }, [userKey]);

  useEffect(() => {
    if (!hydratedRef.current) return;

    safeWrite(activeKey, cartItems);
    if (userKey) {
      safeWrite(userKey, cartItems);
    }

    emitCartUpdated();
  }, [activeKey, userKey, cartItems]);

  useEffect(() => {
    if (!hydratedRef.current || !userKey) return;

    const currentSnapshot = snapshotCart(cartItems);
    if (currentSnapshot === lastSyncedSnapshotRef.current) return;

    const timer = setTimeout(async () => {
      try {
        if (cartItems.length > 0) {
          const { data } = await api.put("/api/cart/sync", toSyncPayload(cartItems));
          const normalized = Array.isArray(data?.items)
            ? data.items.map(serverLineToCartItem)
            : [];

          const normalizedSnapshot = snapshotCart(normalized);
          lastSyncedSnapshotRef.current = normalizedSnapshot;
          setSyncError("");

          if (normalizedSnapshot !== currentSnapshot) {
            setCartItems(normalized);
          } else {
            safeWrite(userKey, normalized);
            emitCartUpdated();
          }
        } else {
          await api.delete("/api/cart");
          lastSyncedSnapshotRef.current = snapshotCart([]);
          setSyncError("");
          safeWrite(userKey, []);
          emitCartUpdated();
        }
      } catch (err) {
        setSyncError(err?.response?.data?.message || "Cart sync failed");

        try {
          const { data } = await api.get("/api/cart");
          const normalized = Array.isArray(data?.items)
            ? data.items.map(serverLineToCartItem)
            : [];

          lastSyncedSnapshotRef.current = snapshotCart(normalized);
          setCartItems(normalized);
          safeWrite(userKey, normalized);
        } catch {
          // ignore fallback failure
        }
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [userKey, cartItems]);

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
          nom: item.nom || copy[idx].nom,
          imageUrl: item.imageUrl || copy[idx].imageUrl,
          couleurId: item.couleurId || copy[idx].couleurId,
          couleurNom: item.couleurNom || copy[idx].couleurNom,
          tailleId: item.tailleId || copy[idx].tailleId,
          taillePointure: item.taillePointure || copy[idx].taillePointure,
          prix: Number(item.prix || copy[idx].prix || 0),
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
    safeRemove(activeKey);

    if (userKey) {
      safeRemove(userKey);
    } else {
      safeRemove(GUEST_CART_KEY);
    }

    emitCartUpdated();
  }

  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + Number(item.qty || 0), 0),
    [cartItems]
  );

  const subtotal = useMemo(
    () =>
      cartItems.reduce(
        (sum, item) => sum + Number(item.prix || 0) * Number(item.qty || 0),
        0
      ),
    [cartItems]
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        setCartItems,
        addToCart,
        updateCartItemQty,
        removeFromCart,
        clearCart,
        cartCount,
        subtotal,
        syncError,
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