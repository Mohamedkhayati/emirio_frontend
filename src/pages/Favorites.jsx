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
  const version = getImageVersion(p);
  const articleImages = [p?.imageUrl, p?.imageUrl2, p?.imageUrl3, p?.imageUrl4];
  const variationImages = Array.isArray(p?.variations)
    ? p.variations.flatMap((v) => [v?.imageUrl, v?.imageUrl2, v?.imageUrl3, v?.imageUrl4])
    : [];
  const colorPreviewImages = Array.isArray(p?.colors)
    ? p.colors.map((c) => c?.previewImage)
    : [];
  return uniqueImages([...articleImages, ...variationImages, ...colorPreviewImages]).map((img) => toAbs(img, version));
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
        {onSale && discount !== null && <div className="saleRibbon pulse">SALE -{discount}%</div>}
        <button
          type="button"
          className={`favoriteBtn ${fav ? "active" : ""}`}
          onClick={(e) => { e.stopPropagation(); toggleFavorite(p.id); }}
          aria-label={t("catalog.toggleFavorite", "Toggle favorite")}
        >
          {fav ? "♥" : "♡"}
        </button>
        {images.length > 0 ? (
          <img src={images[currentImage]} alt={p.nom} className="productImage imageFade" />
        ) : (
          <div className="productImage emptyImage">{t("common.noImage", "No image")}</div>
        )}
        {images.length > 1 && (
          <div className="sliderDots">
            {images.map((_, index) => (
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
        {p.marque || "EMIRIO"} {p.recommended ? `• ${t("nav.bestChoice", "Best choice")}` : ""}
      </div>
      {onSale && (
        <div className="saleCountdownMini">
          {t("home.endsIn", "Ends in")} {formatCountdown(p.saleEndAt, nowTick, t)}
        </div>
      )}
      <div className="productPriceRow">
        <span className="priceNow">{fmtPrice(getDisplayPrice(p))}</span>
        {onSale && <span className="priceOld">{fmtPrice(p.prix)}</span>}
        {onSale && discount !== null && <span className="discountTag">-{discount}%</span>}
      </div>
      <button type="button" className="catalogOpenBtn" onClick={(e) => { e.stopPropagation(); onOpen(p.id); }}>
        {t("catalog.viewProduct", "View product")}
      </button>
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
        setArticles((res.data || []).filter((a) => a.actif !== false));
      } catch (e) {
        setError(e?.response?.data?.message || "Cannot load favorites");
      } finally {
        setLoadingArticles(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return articles
      .filter((a) => favorites.includes(a.id))
      .filter((a) => {
        if (!s) return true;
        return `${a.nom || ""} ${a.description || ""} ${a.marque || ""} ${a.matiere || ""} ${a.sku || ""} ${a.categorieNom || ""}`
          .toLowerCase()
          .includes(s);
      });
  }, [articles, favorites, search]);

  const openProduct = (id) => navigate(`/product/${id}`);
  const isLoading = loadingArticles || favLoading;

  return (
    <div className="homePage catalogPageWrap">
      <div className="catalogLayout">
        <section className="catalogContent fadeInUp" style={{ width: "100%" }}>
          <div className="catalogTop">
            <div>
              <h2>{t("nav.favorites", "Favorites")} ({filtered.length})</h2>
              <p>{filtered.length} {t("catalog.found", "found")}</p>
            </div>
            <div className="searchBar" style={{ maxWidth: 320 }}>
              <input type="text" placeholder={t("common.searchProducts", "Search products")} value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          {isLoading ? (
            <div className="homeInfo">{t("common.loading", "Loading...")}</div>
          ) : error ? (
            <div className="homeInfo error">{error}</div>
          ) : !filtered.length ? (
            <div className="homeInfo">{t("catalog.noMatch", "No matching products found.")}</div>
          ) : (
            <div className="productsGrid catalogProductsGrid" id="catalog-grid">
              {filtered.map((p) => (
                <ProductCard key={p.id} p={p} onOpen={openProduct} favorites={favorites} toggleFavorite={toggleFavorite} nowTick={nowTick} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}