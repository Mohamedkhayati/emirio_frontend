import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { useFavorites } from "../hooks/useFavorites";
import "../styles/home.css";

const toAbs = (path, version = "") => {
  if (!path) return "";
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
      ? p.variations.flatMap((v) => [
          v?.id ?? "",
          v?.imageUrl ?? "",
          v?.imageUrl2 ?? "",
          v?.imageUrl3 ?? "",
          v?.imageUrl4 ?? "",
        ])
      : []),
    ...(Array.isArray(p?.colors)
      ? p.colors.flatMap((c) => [c?.couleurId ?? "", c?.previewImage ?? ""])
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
  return uniqueImages([...articleImages, ...variationImages, ...colorPreviewImages]).map((img) =>
    toAbs(img, version)
  );
}

function getMainProductImage(p) {
  const images = getProductImages(p);
  return images.length ? images[0] : null;
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

function SaleHeroSlider({ articles, onOpen, nowTick }) {
  const { t } = useTranslation();
  const saleItems = articles.filter((a) => isSaleActive(a));
  const heroItems = saleItems.length ? saleItems : articles;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [heroItems.length]);

  useEffect(() => {
    if (heroItems.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % heroItems.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [heroItems.length]);

  useEffect(() => {
    if (index >= heroItems.length) setIndex(0);
  }, [heroItems.length, index]);

  const current = heroItems[index];
  if (!current) {
    return (
      <section className="saleHeroSection">
        <div className="saleGlow one" />
        <div className="saleGlow two" />
        <div className="saleHeroSplit fadeScale">
          <div className="saleHeroContent">
            <div className="saleBadge">EMIRIO</div>
            <h1>{t("home.discoverPremium", "Discover premium products")}</h1>
            <p>{t("home.discoverCatalog", "Shop real products added from your admin dashboard.")}</p>
            <div className="heroButtons">
              <a href="#new-arrivals" className="shopBtn">{t("home.shopNow", "Shop Now")}</a>
            </div>
          </div>
          <div className="saleHeroVisual">
            <div className="saleHeroImage emptyImage">{t("common.noImage", "No image")}</div>
          </div>
        </div>
      </section>
    );
  }

  const onSale = isSaleActive(current);
  const discount = getDiscountPercent(current);
  const heroImage = getMainProductImage(current);

  return (
    <section className="saleHeroSection">
      <div className="saleGlow one" />
      <div className="saleGlow two" />
      <div className="saleHeroSplit fadeScale">
        <div className="saleHeroContent">
          <div className="saleBadge">{onSale ? "EMIRIO SALE" : "EMIRIO"}</div>
          <h1>{current.nom}</h1>
          <p>{current.description || t("home.discoverFromCatalog", "Discover products from your catalog.")}</p>
          <div className="heroPriceRow">
            <span className="heroPriceNow">{fmtPrice(getDisplayPrice(current))}</span>
            {onSale && <span className="heroPriceOld">{fmtPrice(current.prix)}</span>}
            {onSale && discount && <span className="heroDiscount">-{discount}%</span>}
          </div>
          {onSale && (
            <div className="heroCountdown">
              {t("home.endsIn", "Ends in")} <strong>{formatCountdown(current.saleEndAt, nowTick, t)}</strong>
            </div>
          )}
          <div className="heroButtons">
            <button className="shopBtn" onClick={() => onOpen(current.id)}>{t("home.shopNow", "Shop Now")}</button>
          </div>
        </div>
        <div
          className="saleHeroVisual"
          onClick={() => onOpen(current.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => handleKeyboardOpen(e, onOpen, current.id)}
        >
          {heroImage ? (
            <img src={heroImage} alt={current.nom} className="saleHeroImage" />
          ) : (
            <div className="saleHeroImage emptyImage">{t("common.noImage", "No image")}</div>
          )}
          {heroItems.length > 1 && (
            <div className="heroDots">
              {heroItems.map((item, i) => (
                <span
                  key={item.id}
                  className={`heroDot ${i === index ? "active" : ""}`}
                  onClick={(e) => { e.stopPropagation(); setIndex(i); }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ProductCard({ p, onOpen, favorites, toggleFavorite, nowTick }) {
  const { t } = useTranslation();
  const images = getProductImages(p);
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
        {onSale && discount && <div className="saleRibbon pulse">SALE -{discount}%</div>}
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
        {onSale && discount && <span className="discountTag">-{discount}%</span>}
      </div>
    </div>
  );
}

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [flatCategories, setFlatCategories] = useState([]);
  const [loadingArticles, setLoadingArticles] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [nowTick, setNowTick] = useState(Date.now());

  // State for category-based recommendations
  const [categoryRecommendations, setCategoryRecommendations] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  const { favorites, toggleFavorite } = useFavorites();

  useEffect(() => {
    const tick = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  const flattenCategories = (categoryData) => {
    const flat = [];
    if (categoryData.chaussures) {
      Object.values(categoryData.chaussures).forEach(subCategory => {
        flat.push({ id: subCategory.id, nom: subCategory.nom, parentId: null, level: 'SUB' });
        if (subCategory.children && subCategory.children.length) {
          subCategory.children.forEach(child => {
            flat.push({ id: child.id, nom: `${subCategory.nom} > ${child.nom}`, originalNom: child.nom, parentId: subCategory.id, level: 'SUB_SUB' });
          });
        }
      });
    }
    if (categoryData.accessoires && Array.isArray(categoryData.accessoires)) {
      categoryData.accessoires.forEach(accessory => {
        flat.push({ id: accessory.id, nom: accessory.nom, parentId: null, level: 'SUB' });
      });
    }
    return flat;
  };

  useEffect(() => {
    async function loadData() {
      try {
        setLoadingArticles(true);
        setError("");
        const [articlesRes, categoriesRes] = await Promise.all([
          api.get("/api/articles"),
          api.get("/api/categories"),
        ]);
        const list = (articlesRes.data || []).filter((a) => a.actif !== false);
        setArticles(list);
        const categoryData = categoriesRes.data || {};
        setCategories(categoryData);
        const flat = flattenCategories(categoryData);
        setFlatCategories(flat);
      } catch (e) {
        console.error("Error loading data:", e);
        setError(e?.response?.data?.message || "Cannot load catalog");
      } finally {
        setLoadingArticles(false);
      }
    }
    loadData();
  }, []);

  // Get recommendations based on user's most interacted category
  useEffect(() => {
    if (!articles.length || !flatCategories.length) return;
    
    setLoadingRecs(true);
    
    // Get user's favorite categories from localStorage or default to a popular category
    // For demo, show products from a random sub category
    const subCategories = flatCategories.filter(c => c.level === 'SUB');
    if (subCategories.length) {
      // Pick a random sub category or the first one
      const randomSubCat = subCategories[Math.floor(Math.random() * subCategories.length)];
      const recommended = articles.filter(a => 
        a.categorieId === randomSubCat.id && a.actif !== false
      ).slice(0, 8);
      setCategoryRecommendations(recommended);
    } else {
      setCategoryRecommendations(articles.slice(0, 8));
    }
    setLoadingRecs(false);
  }, [articles, flatCategories]);

  const filteredArticles = useMemo(() => {
    let list = [...articles];
    if (selectedCategoryId) {
      list = list.filter((a) => Number(a.categorieId) === Number(selectedCategoryId));
    }
    const s = search.trim().toLowerCase();
    if (!s) return list;
    return list.filter((a) =>
      `${a.nom} ${a.description || ""} ${a.categorieNom || ""} ${a.marque || ""}`.toLowerCase().includes(s)
    );
  }, [search, articles, selectedCategoryId]);

  const saleArticles = useMemo(() =>
    filteredArticles
      .filter((a) => isSaleActive(a))
      .sort((a, b) => {
        const aEnd = a.saleEndAt ? new Date(a.saleEndAt).getTime() : Number.MAX_SAFE_INTEGER;
        const bEnd = b.saleEndAt ? new Date(b.saleEndAt).getTime() : Number.MAX_SAFE_INTEGER;
        return aEnd - bEnd;
      })
      .slice(0, 8),
    [filteredArticles]
  );

  const recommendedArticles = useMemo(() => {
    if (categoryRecommendations.length > 0) {
      return categoryRecommendations;
    }
    return filteredArticles.filter((a) => !!a.recommended).slice(0, 8);
  }, [categoryRecommendations, filteredArticles]);

  const newArrivals = useMemo(() =>
    [...filteredArticles].sort((a, b) => Number(b.id) - Number(a.id)).slice(0, 8),
    [filteredArticles]
  );

  const openProduct = (id) => navigate(`/product/${id}`);
  const openCatalog = () =>
    navigate(selectedCategoryId ? `/catalog?categorieId=${selectedCategoryId}` : "/catalog");

  return (
    <div className="homePage">
      <SaleHeroSlider articles={filteredArticles} onOpen={openProduct} nowTick={nowTick} />

      <section className="productSection">
        <div className="searchBar" style={{ maxWidth: "420px", marginLeft: "auto" }}>
          <input
            type="text"
            placeholder={t("common.searchProducts", "Search products")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </section>

      <section className="productSection" id="sale-products">
        <div className="sectionTopRow">
          <h2>{t("home.saleNow", "Sale now")}</h2>
          <button className="viewAllBtn" onClick={openCatalog}>{t("common.viewAll", "View all")}</button>
        </div>
        {loadingArticles ? (
          <div className="homeInfo">{t("home.loadingSale", "Loading sale products...")}</div>
        ) : error ? (
          <div className="homeInfo error">{error}</div>
        ) : !saleArticles.length ? (
          <div className="homeInfo">{t("home.noSale", "No sale products found")}</div>
        ) : (
          <div className="productsGrid">
            {saleArticles.map((p) => (
              <ProductCard key={`sale-${p.id}`} p={p} onOpen={openProduct} favorites={favorites} toggleFavorite={toggleFavorite} nowTick={nowTick} />
            ))}
          </div>
        )}
      </section>

      <section className="productSection withBorder" id="recommended">
        <div className="sectionTopRow">
          <h2>{t("home.bestChoice", "Best choice")}</h2>
          <button className="viewAllBtn" onClick={openCatalog}>{t("common.viewAll", "View all")}</button>
        </div>
        {loadingArticles || loadingRecs ? (
          <div className="homeInfo">{t("home.loadingRecommendations", "Loading recommendations...")}</div>
        ) : error ? (
          <div className="homeInfo error">{error}</div>
        ) : !recommendedArticles.length ? (
          <div className="homeInfo">{t("home.noRecommended", "No recommended products found")}</div>
        ) : (
          <div className="productsGrid">
            {recommendedArticles.map((p) => (
              <ProductCard key={`recommended-${p.id}`} p={p} onOpen={openProduct} favorites={favorites} toggleFavorite={toggleFavorite} nowTick={nowTick} />
            ))}
          </div>
        )}
      </section>

      <section className="categoryBrowseSection" id="categories">
        <div className="sectionTopRow">
          <h2>{t("home.categories", "Categories")}</h2>
          <button className="viewAllBtn" onClick={openCatalog}>{t("common.openCatalog", "Open catalog")}</button>
        </div>
        <div className="categoryChips">
          <button className={`categoryChip ${selectedCategoryId === null ? "active" : ""}`} onClick={() => setSelectedCategoryId(null)}>
            {t("common.all", "All")}
          </button>
          {flatCategories.map((c) => (
            <button key={c.id} className={`categoryChip ${selectedCategoryId === c.id ? "active" : ""}`} onClick={() => setSelectedCategoryId(c.id)}>
              {c.nom}
            </button>
          ))}
        </div>
      </section>

      <section className="productSection withBorder" id="new-arrivals">
        <div className="sectionTopRow">
          <h2>{t("home.newArrivals", "New arrivals")}</h2>
          <button className="viewAllBtn" onClick={openCatalog}>{t("common.viewAll", "View all")}</button>
        </div>
        {loadingArticles ? (
          <div className="homeInfo">{t("home.loadingProducts", "Loading products...")}</div>
        ) : error ? (
          <div className="homeInfo error">{error}</div>
        ) : !newArrivals.length ? (
          <div className="homeInfo">{t("home.noProducts", "No products found")}</div>
        ) : (
          <div className="productsGrid">
            {newArrivals.map((p) => (
              <ProductCard key={`new-${p.id}`} p={p} onOpen={openProduct} favorites={favorites} toggleFavorite={toggleFavorite} nowTick={nowTick} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}