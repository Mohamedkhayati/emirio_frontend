import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import "../styles/home.css";

const fallbackImg =
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80";

function resolveImage(src) {
  if (!src) return fallbackImg;
  if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("data:")) {
    return src;
  }
  const base = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
  const path = src.startsWith("/") ? src : `/${src}`;
  return `${base}${path}`;
}

function isSaleActive(p) {
  if (!p?.salePrice || Number(p.salePrice) >= Number(p.prix || 0)) return false;
  const now = Date.now();
  const start = p.saleStartAt ? new Date(p.saleStartAt).getTime() : null;
  const end = p.saleEndAt ? new Date(p.saleEndAt).getTime() : null;
  if (start && now < start) return false;
  if (end && now > end) return false;
  return true;
}

function getDiscountPercent(p) {
  if (!isSaleActive(p)) return null;
  return Math.round(((Number(p.prix) - Number(p.salePrice)) / Number(p.prix)) * 100);
}

function fmtPrice(v) {
  if (v === null || v === undefined || v === "") return "-";
  return `${Number(v).toFixed(3)} TND`;
}

function ProductCard({ p, onOpen, favorites, toggleFavorite }) {
  const image = resolveImage(p.imageUrl || p.imageUrl2 || p.imageUrl3);
  const onSale = isSaleActive(p);
  const discount = getDiscountPercent(p);
  const fav = favorites.includes(p.id);

  return (
    <div className="productCard" onClick={() => onOpen(p.id)}>
      <div className="productImageWrap">
        {onSale ? <div className="saleRibbon">SALE -{discount}%</div> : null}

        <button
          type="button"
          className={`favoriteBtn ${fav ? "active" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(p.id);
          }}
        >
          {fav ? "♥" : "♡"}
        </button>

        <img
          src={image}
          alt={p.nom}
          className="productImage"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = fallbackImg;
          }}
        />
      </div>

      <div className="productName">{p.nom}</div>
      <div className="productMeta">{p.marque || "EMIRIO"}</div>

      <div className="productPriceRow">
        <span className="priceNow">{fmtPrice(onSale ? p.salePrice : p.prix)}</span>
        {onSale ? <span className="priceOld">{fmtPrice(p.prix)}</span> : null}
      </div>
    </div>
  );
}

export default function Favorites() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("favorites") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    async function loadArticles() {
      try {
        const res = await api.get("/api/articles");
        setArticles((res.data || []).filter((a) => a.actif !== false));
      } finally {
        setLoading(false);
      }
    }
    loadArticles();
  }, []);

  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);

  const favoriteArticles = useMemo(
    () => articles.filter((a) => favorites.includes(a.id)),
    [articles, favorites]
  );

  const toggleFavorite = (id) => {
    setFavorites((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  return (
    <div className="homePage">
      <section className="productSection">
        <div className="sectionTopRow">
          <h2>MY FAVORITES</h2>
          <button className="viewAllBtn" onClick={() => navigate("/")}>Back Home</button>
        </div>

        {loading ? (
          <div className="homeInfo">Loading favorites...</div>
        ) : !favoriteArticles.length ? (
          <div className="homeInfo">No favorite products yet.</div>
        ) : (
          <div className="productsGrid">
            {favoriteArticles.map((p) => (
              <ProductCard
                key={p.id}
                p={p}
                onOpen={(id) => navigate(`/product/${id}`)}
                favorites={favorites}
                toggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
