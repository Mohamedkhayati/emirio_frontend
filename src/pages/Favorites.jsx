import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { useFavorites } from "../hooks/useFavorites";
import "../styles/home.css";
import "../styles/catalog.css";

const toAbs = (path, version = "") => {
  if (!path) return "";
  if (path.startsWith("data:")) return path;
  if (path.startsWith("http")) return path;
  const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
  return `${base}${path}${path.includes("?") ? "&" : "?"}v=${encodeURIComponent(version)}`;
};

const fmtPrice = (v) => {
  if (v === null || v === undefined || v === "") return "-";
  return `${Number(v).toFixed(3)} TND`;
};

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

function getDisplayPrice(p) {
  return isSaleActive(p) ? Number(p.salePrice) : Number(p.prix);
}

function uniqueImages(list) {
  return [...new Set(list.filter(Boolean))];
}

function getImageVersion(p) {
  return [
    p?.id ?? "",
    p?.imageUrl ?? "",
    p?.imageUrl2 ?? "",
    p?.imageUrl3 ?? "",
    p?.imageUrl4 ?? "",
    ...(Array.isArray(p?.variations)
      ? p.variations.flatMap((v) => [v?.id ?? "", v?.imageUrl ?? "", v?.imageUrl2 ?? "", v?.imageUrl3 ?? "", v?.imageUrl4 ?? ""])
      : []),
    ...(Array.isArray(p?.colors)
      ? p.colors.flatMap((c) => [c?.couleurId ?? c?.id ?? "", c?.previewImage ?? ""])
      : []),
    p?.salePrice ?? "",
    p?.saleStartAt ?? "",
    p?.saleEndAt ?? "",
    p?.recommended ?? "",
  ].join("-");
}

function getProductImages(p) {
  if (!p) return [];
  const version = getImageVersion(p);
  
  let allImages = [];
  
  if (p?.imageUrl) allImages.push(p.imageUrl);
  if (p?.imageUrl2) allImages.push(p.imageUrl2);
  if (p?.imageUrl3) allImages.push(p.imageUrl3);
  if (p?.imageUrl4) allImages.push(p.imageUrl4);
  
  if (Array.isArray(p?.variations)) {
    p.variations.forEach(v => {
      if (v?.imageUrl) allImages.push(v.imageUrl);
      if (v?.imageUrl2) allImages.push(v.imageUrl2);
      if (v?.imageUrl3) allImages.push(v.imageUrl3);
      if (v?.imageUrl4) allImages.push(v.imageUrl4);
    });
  }
  
  if (Array.isArray(p?.colors)) {
    p.colors.forEach(c => {
      if (c?.previewImage) allImages.push(c.previewImage);
    });
  }
  
  const unique = [...new Set(allImages.filter(Boolean))];
  return unique.map(img => toAbs(img, version));
}

function getMainProductImage(p) {
  const images = getProductImages(p);
  return images.length > 0 ? images[0] : null;
}

function formatCountdown(endAt, nowTick, t) {
  if (!endAt) return t("home.limitedOffer", "Limited offer");
  const diff = new Date(endAt).getTime() - nowTick;
  if (diff <= 0) return t("home.saleEnded", "Sale ended");
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

function handleKeyboardOpen(e, onOpen, id) {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    onOpen(id);
  }
}

function ProductCard({ p, onOpen, favorites, toggleFavorite, nowTick }) {
  const { t } = useTranslation();
  const images = useMemo(() => getProductImages(p), [p]);
  const mainImage = useMemo(() => getMainProductImage(p), [p]);
  const [currentImage, setCurrentImage] = useState(0);
  const onSale = isSaleActive(p);
  const discount = getDiscountPercent(p);
  const fav = favorites.includes(p.id);

  useEffect(() => {
    setCurrentImage(0);
  }, [p.id, images.length]);

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="productCard fadeUp" onClick={() => onOpen(p.id)} role="button" tabIndex={0} onKeyDown={(e) => handleKeyboardOpen(e, onOpen, p.id)}>
      <div className="productImageWrap">
        {onSale && discount !== null && (
          <div className="saleRibbon pulse">
            SALE -{discount}%
          </div>
        )}
        <button
          type="button"
          className={`favoriteBtn ${fav ? "active" : ""}`}
          onClick={(e) => { e.stopPropagation(); toggleFavorite(p.id); }}
          aria-label={t("catalog.toggleFavorite", "Toggle favorite")}
        >
          {fav ? "♥" : "♡"}
        </button>
        {mainImage ? (
          <img 
            src={mainImage} 
            alt={p.nom} 
            className="productImage imageFade" 
            onError={(e) => {
              e.target.style.display = "none";
              if (e.target.parentElement) {
                const fallback = e.target.parentElement.querySelector(".emptyImageFallback");
                if (fallback) fallback.style.display = "flex";
              }
            }}
          />
        ) : null}
        {!mainImage && (
          <div className="productImage emptyImage emptyImageFallback" style={{ display: "flex" }}>
            {t("common.noImage", "No image")}
          </div>
        )}
        {images.length > 1 && (
          <div className="sliderDots">
            {images.slice(0, 5).map((_, index) => (
              <span
                key={index}
                className={`sliderDot ${index === currentImage ? "active" : ""}`}
                onClick={(e) => { e.stopPropagation(); setCurrentImage(index); }}
              />
            ))}
          </div>
        )}
      </div>
      <div className="productName">{p.nom}</div>
      <div className="productMeta">
        {p.marque || "EMIRIO"} 
        {p.recommended && ` • ${t("nav.bestChoice", "Best choice")}`}
      </div>
      {onSale && (
        <div className="saleCountdownMini">
          {t("home.endsIn", "Ends in")} {formatCountdown(p.saleEndAt, nowTick, t)}
        </div>
      )}
      <div className="productPriceRow">
        <span className="priceNow">{fmtPrice(getDisplayPrice(p))}</span>
        {onSale && (
          <>
            <span className="priceOld">{fmtPrice(p.prix)}</span>
            {discount !== null && (
              <span className="discountTag">-{discount}%</span>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function FavoritesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [articles, setArticles] = useState([]);
  const [loadingArticles, setLoadingArticles] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [nowTick, setNowTick] = useState(Date.now());

  const { favorites, toggleFavorite, loading: favLoading } = useFavorites();

  useEffect(() => {
    const tick = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        setLoadingArticles(true);
        setError("");
        const res = await api.get("/api/articles");
        const activeArticles = (res.data || []).filter((a) => a.actif !== false);
        setArticles(activeArticles);
      } catch (e) {
        console.error("Error loading articles:", e);
        setError(e?.response?.data?.message || "Cannot load favorites");
      } finally {
        setLoadingArticles(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    let favoriteArticles = articles
      .filter((a) => favorites.includes(a.id))
      .filter((a) => {
        if (!s) return true;
        return `${a.nom || ""} ${a.description || ""} ${a.marque || ""} ${a.matiere || ""} ${a.sku || ""} ${a.categorieNom || ""}`
          .toLowerCase()
          .includes(s);
      });
    
    favoriteArticles.sort((a, b) => b.id - a.id);
    return favoriteArticles;
  }, [articles, favorites, search]);

  const openProduct = (id) => navigate(`/product/${id}`);
  const isLoading = loadingArticles || favLoading;

  return (
    <div className="homePage catalogPageWrap">
      <div className="catalogLayout" style={{ display: "block" }}>
        <section className="catalogContent fadeInUp" style={{ width: "100%", maxWidth: "1400px", margin: "0 auto" }}>
          <div className="catalogTop">
            <div>
              <h2 style={{ animation: "fadeUp 0.5s ease" }}>
                {t("nav.favorites", "My Favorites")} 
                <span style={{ fontSize: "24px", marginLeft: "12px", color: "#e91e63" }}>❤️</span>
                <span style={{ fontSize: "20px", marginLeft: "8px", color: "#666" }}>({filtered.length})</span>
              </h2>
              <p style={{ animation: "fadeUp 0.6s ease" }}>
                {filtered.length} {t("catalog.found", "products saved")}
              </p>
            </div>
            <div className="searchBar" style={{ maxWidth: 320, animation: "fadeUp 0.4s ease" }}>
              <input 
                type="text" 
                placeholder={t("common.searchProducts", "Search in favorites...")} 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
              />
            </div>
          </div>
          
          {isLoading ? (
            <div className="homeInfo" style={{ animation: "fadeUp 0.5s ease" }}>
              {t("common.loading", "Loading your favorites...")}
            </div>
          ) : error ? (
            <div className="homeInfo error" style={{ animation: "fadeUp 0.5s ease" }}>
              {error}
            </div>
          ) : !filtered.length ? (
            <div className="favoritesEmptyState" style={{ 
              textAlign: "center", 
              padding: "80px 20px",
              animation: "fadeScale 0.6s ease"
            }}>
              <div style={{ fontSize: "80px", marginBottom: "20px", animation: "pulse 2s infinite" }}>💔</div>
              <h3 style={{ fontSize: "28px", marginBottom: "12px" }}>{t("favorites.noFavorites", "No favorites yet")}</h3>
              <p style={{ color: "#666", marginBottom: "24px" }}>
                {t("favorites.startAdding", "Start adding products you love by clicking the heart icon.")}
              </p>
              <button 
                className="applyBtn" 
                onClick={() => navigate("/catalog")}
                style={{ 
                  marginTop: "20px", 
                  padding: "14px 32px",
                  fontSize: "16px",
                  transition: "transform 0.3s ease, box-shadow 0.3s ease"
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = "translateY(-3px)";
                  e.target.style.boxShadow = "0 14px 28px rgba(0,0,0,0.2)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "none";
                }}
              >
                {t("favorites.browseCatalog", "Browse Catalog")} →
              </button>
            </div>
          ) : (
            <div className="productsGrid catalogProductsGrid" style={{ 
              animation: "fadeUp 0.5s ease",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "24px",
              marginTop: "20px"
            }}>
              {filtered.map((p, index) => (
                <div 
                  key={p.id} 
                  style={{ 
                    animation: `fadeUp 0.4s ease ${index * 0.05}s both`,
                  }}
                >
                  <ProductCard 
                    p={p} 
                    onOpen={openProduct} 
                    favorites={favorites} 
                    toggleFavorite={toggleFavorite} 
                    nowTick={nowTick} 
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}