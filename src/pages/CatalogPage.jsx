import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { api, recommendationsApi } from "../lib/api";
import { useFavorites } from "../hooks/useFavorites";
import Footer from "../components/Footer";
import "../styles/home.css";
import "../styles/catalog.css";

// ========== HELPER FUNCTIONS ==========

const toAbs = (path, version = "") => {
  if (!path) return "";
  const value = String(path);
  if (value.startsWith("data:")) return value;
  if (value.startsWith("http")) return value;
  const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
  return `${base}${value}${value.includes("?") ? "&" : "?"}v=${encodeURIComponent(version)}`;
};

const fmtPrice = (v) => {
  if (v === null || v === undefined || v === "") return "-";
  return `${Number(v).toFixed(3)} TND`;
};

function isSaleActive(p) {
  if (p?.salePrice === null || p?.salePrice === undefined || p?.salePrice === "") return false;
  if (Number(p.salePrice) >= Number(p.prix || 0)) return false;
  const now = Date.now();
  const start = p.saleStartAt ? new Date(p.saleStartAt).getTime() : null;
  const end = p.saleEndAt ? new Date(p.saleEndAt).getTime() : null;
  if (start && now < start) return false;
  if (end && now > end) return false;
  return true;
}

function getDiscountPercent(p) {
  if (!isSaleActive(p)) return null;
  const base = Number(p.prix || 0);
  const sale = Number(p.salePrice || 0);
  if (!base || sale >= base) return null;
  return Math.round(((base - sale) / base) * 100);
}

function getDisplayPrice(p) {
  return isSaleActive(p) ? Number(p.salePrice) : Number(p.prix);
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

function normalizeId(v) {
  if (v === null || v === undefined || v === "") return "";
  return String(v);
}

function getVariationColorId(v) {
  return normalizeId(v?.couleurId ?? v?.couleurid ?? v?.colorId ?? v?.colorid ?? v?.couleur?.id ?? v?.color?.id ?? v?.couleur?.value ?? v?.color?.value);
}

function getVariationSizeId(v) {
  return normalizeId(v?.tailleId ?? v?.tailleid ?? v?.sizeId ?? v?.sizeid ?? v?.taille?.id ?? v?.size?.id ?? v?.taille?.value ?? v?.size?.value);
}

function getArticleColorIds(a) {
  const ids = new Set();
  (a?.variations || []).forEach((v) => { const id = getVariationColorId(v); if (id) ids.add(id); });
  (a?.colors || []).forEach((c) => { const id = normalizeId(c?.id ?? c?.couleurId ?? c?.couleurid ?? c?.colorId ?? c?.colorid); if (id) ids.add(id); });
  return [...ids];
}

function getArticleSizeIds(a) {
  const ids = new Set();
  (a?.variations || []).forEach((v) => { const id = getVariationSizeId(v); if (id) ids.add(id); });
  (a?.sizes || []).forEach((s) => { const id = normalizeId(s?.id ?? s?.tailleId ?? s?.tailleid ?? s?.sizeId ?? s?.sizeid); if (id) ids.add(id); });
  return [...ids];
}

function articleMatchesColor(a, colorId) {
  if (!colorId) return true;
  return getArticleColorIds(a).includes(normalizeId(colorId));
}

function articleMatchesSize(a, sizeId) {
  if (!sizeId) return true;
  return getArticleSizeIds(a).includes(normalizeId(sizeId));
}

function uniqueImages(list) {
  return [...new Set(list.filter(Boolean))];
}

function getImageVersion(product) {
  return [
    product?.id ?? "",
    product?.imageUrl ?? "",
    product?.imageUrl2 ?? "",
    product?.imageUrl3 ?? "",
    product?.imageUrl4 ?? "",
    ...(Array.isArray(product?.variations)
      ? product.variations.flatMap((v) => [v?.id ?? "", v?.imageUrl ?? "", v?.imageUrl2 ?? "", v?.imageUrl3 ?? "", v?.imageUrl4 ?? ""])
      : []),
    ...(Array.isArray(product?.colors)
      ? product.colors.flatMap((c) => [c?.couleurId ?? c?.id ?? "", c?.previewImage ?? ""])
      : []),
    product?.salePrice ?? "",
    product?.saleStartAt ?? "",
    product?.saleEndAt ?? "",
    product?.recommended ?? "",
  ].join("-");
}

function getImagesFromObject(obj, version) {
  if (!obj) return [];
  return uniqueImages([obj?.imageUrl, obj?.imageUrl2, obj?.imageUrl3, obj?.imageUrl4, obj?.previewImage]).map((img) => toAbs(img, version));
}

function getProductImages(product, selectedColorId) {
  const version = getImageVersion(product);
  const articleImages = getImagesFromObject(product, version);
  const variations = Array.isArray(product?.variations) ? product.variations : [];
  const colors = Array.isArray(product?.colors) ? product.colors : [];

  if (selectedColorId) {
    const matchingVariations = variations.filter((v) => String(getVariationColorId(v)) === String(normalizeId(selectedColorId)));
    const matchingVariationImages = uniqueImages(matchingVariations.flatMap((v) => getImagesFromObject(v, version)));
    if (matchingVariationImages.length) return matchingVariationImages;
    const matchingColorPreview = colors
      .filter((c) => String(normalizeId(c?.couleurId ?? c?.id)) === String(normalizeId(selectedColorId)))
      .flatMap((c) => getImagesFromObject(c, version));
    if (matchingColorPreview.length) return uniqueImages(matchingColorPreview);
  }
  if (articleImages.length) return articleImages;
  const variationImages = uniqueImages(variations.flatMap((v) => getImagesFromObject(v, version)));
  if (variationImages.length) return variationImages;
  const colorPreviewImages = uniqueImages(colors.flatMap((c) => getImagesFromObject(c, version)));
  return colorPreviewImages.length ? colorPreviewImages : [];
}

function handleKeyboardOpen(e, onOpen, id) {
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(id); }
}

// ========== ProductCard Component ==========
function ProductCard({ p, onOpen, favorites, toggleFavorite, nowTick, selectedColorId }) {
  const { t } = useTranslation();
  const images = useMemo(() => getProductImages(p, selectedColorId), [p, selectedColorId]);
  const [currentImage, setCurrentImage] = useState(0);
  const onSale = isSaleActive(p);
  const discount = getDiscountPercent(p);
  const fav = favorites.includes(p.id);

  useEffect(() => { setCurrentImage(0); }, [p.id, selectedColorId, images.length]);
  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => { setCurrentImage((prev) => (prev + 1) % images.length); }, 3000);
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
        {t("catalog.viewProduct", "View Product")}
      </button>
    </div>
  );
}

// ========== Category helpers ==========
function flattenCategoriesFromStructure(categoryStructure) {
  const flat = [];
  if (!categoryStructure) return flat;
  if (categoryStructure.chaussures && typeof categoryStructure.chaussures === 'object') {
    Object.values(categoryStructure.chaussures).forEach(subCategory => {
      flat.push({ id: subCategory.id, nom: subCategory.nom, parentId: null, level: 'SUB' });
      if (subCategory.children && Array.isArray(subCategory.children)) {
        subCategory.children.forEach(child => {
          flat.push({ id: child.id, nom: child.nom, originalNom: child.nom, parentId: subCategory.id, level: 'SUB_SUB' });
        });
      }
    });
  }
  if (categoryStructure.accessoires && Array.isArray(categoryStructure.accessoires)) {
    categoryStructure.accessoires.forEach(accessory => {
      flat.push({ id: accessory.id, nom: accessory.nom, parentId: null, level: 'SUB' });
    });
  }
  return flat;
}

function buildCategoryTree(categories, parentId = null, level = 0) {
  if (!Array.isArray(categories)) return [];
  return categories
    .filter(c => c.parentId === parentId)
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
    .map(c => ({ ...c, level, children: buildCategoryTree(categories, c.id, level + 1) }));
}

function getCategoryPath(categoryId, categories) {
  if (!Array.isArray(categories)) return "-";
  const path = [];
  let currentId = categoryId;
  const categoryMap = new Map(categories.map(c => [c.id, c]));
  while (currentId && categoryMap.has(currentId)) {
    const cat = categoryMap.get(currentId);
    path.unshift(cat.nom);
    currentId = cat.parentId;
  }
  return path.join(" > ");
}

// ========== Main CatalogPage Component ==========
export default function CatalogPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryTree, setCategoryTree] = useState([]);
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedMainCategoryId, setSelectedMainCategoryId] = useState("");
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState("");
  const [selectedSubSubCategoryId, setSelectedSubSubCategoryId] = useState("");
  const [brand, setBrand] = useState("");
  const [material, setMaterial] = useState("");
  const [sku, setSku] = useState("");
  const [colorId, setColorId] = useState("");
  const [sizeId, setSizeId] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [nowTick, setNowTick] = useState(Date.now());
  const [userPreferredCategory, setUserPreferredCategory] = useState(null);


  // AI recommendations state
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);

  const { favorites, toggleFavorite } = useFavorites();

  // Derived category lists
  const mainCategories = useMemo(() => {
    if (!Array.isArray(categories)) return [];
    return categories.filter(c => !c.parentId);
  }, [categories]);
  // After articles state is populated (inside the component)
const uniqueBrands = useMemo(() => {
  if (!Array.isArray(articles)) return [];
  const brands = new Set();
  articles.forEach(article => {
    if (article.marque && article.marque.trim()) {
      brands.add(article.marque.trim());
    }
  });
  return Array.from(brands).sort();
}, [articles]);

const uniqueMaterials = useMemo(() => {
  if (!Array.isArray(articles)) return [];
  const materials = new Set();
  articles.forEach(article => {
    if (article.matiere && article.matiere.trim()) {
      materials.add(article.matiere.trim());
    }
  });
  return Array.from(materials).sort();
}, [articles]);

  const subCategories = useMemo(() => {
    if (!Array.isArray(categories) || !selectedMainCategoryId) return [];
    return categories.filter(c => c.parentId === selectedMainCategoryId);
  }, [categories, selectedMainCategoryId]);

  const subSubCategories = useMemo(() => {
    if (!Array.isArray(categories) || !selectedSubCategoryId) return [];
    return categories.filter(c => c.parentId === selectedSubCategoryId);
  }, [categories, selectedSubCategoryId]);

  // Timers and query param
  useEffect(() => {
    const tick = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);
  useEffect(() => {
  if (!articles.length) return;
  
  // Get user's preferred category from localStorage or use first sub category
  const savedCategory = localStorage.getItem("preferredCategory");
  if (savedCategory) {
    setUserPreferredCategory(parseInt(savedCategory));
  } else {
    // Find a sub category with most products
    const categoryCount = {};
    articles.forEach(a => {
      if (a.categorieId) {
        categoryCount[a.categorieId] = (categoryCount[a.categorieId] || 0) + 1;
      }
    });
    const topCategory = Object.entries(categoryCount).sort((a,b) => b[1] - a[1])[0];
    if (topCategory) {
      setUserPreferredCategory(parseInt(topCategory[0]));
    }
  }
}, [articles]);


  useEffect(() => {
    const qpCategory = searchParams.get("categorieId") || "";
    if (qpCategory) setSelectedSubSubCategoryId(qpCategory);
  }, [searchParams]);

  // Load articles and categories
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");
        const [aRes, cRes, colorRes, sizeRes] = await Promise.all([
          api.get("/api/articles"),
          api.get("/api/categories"),
          api.get("/api/colors"),
          api.get("/api/sizes"),
        ]);
        setArticles((aRes.data || []).filter((a) => a.actif !== false));
        const categoryData = cRes.data || {};
        const flatCategories = flattenCategoriesFromStructure(categoryData);
        setCategories(flatCategories);
        const tree = buildCategoryTree(flatCategories);
        setCategoryTree(tree);
        setColors(colorRes.data || []);
        setSizes(sizeRes.data || []);
      } catch (e) {
        console.error("Error loading catalog:", e);
        setError(e?.response?.data?.message || e.message || "Cannot load catalog");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Fetch AI recommendations
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setLoadingAI(true);
    recommendationsApi.get(20)
      .then(res => {
        const recs = (res.data || []).map(r => ({ id: r.articleId, score: r.score }));
        setAiRecommendations(recs);
      })
      .catch(err => console.error("Failed to load AI recommendations:", err))
      .finally(() => setLoadingAI(false));
  }, []);

  const recommendedIds = useMemo(() => new Set(aiRecommendations.map(r => r.id)), [aiRecommendations]);

  // Reset subcategories when main category changes
  useEffect(() => {
    setSelectedSubCategoryId("");
    setSelectedSubSubCategoryId("");
  }, [selectedMainCategoryId]);

  useEffect(() => {
    setSelectedSubSubCategoryId("");
  }, [selectedSubCategoryId]);

  // Filtered and sorted articles (recommended first)
  const filtered = useMemo(() => {
    if (!Array.isArray(articles)) return [];

    let filteredList = articles.filter((a) => {
      const s = search.trim().toLowerCase();
      const matchesSearch = !s ||
        `${a.nom || ""} ${a.description || ""} ${a.marque || ""} ${a.matiere || ""} ${a.sku || ""} ${a.categorieNom || ""}`.toLowerCase().includes(s);
      let matchesCategory = true;
      if (selectedSubSubCategoryId) {
        matchesCategory = String(a.categorieId) === String(selectedSubSubCategoryId);
      } else if (selectedSubCategoryId) {
        const subSubIds = subSubCategories.map(c => String(c.id));
        matchesCategory = subSubIds.includes(String(a.categorieId));
      } else if (selectedMainCategoryId) {
        const allChildIds = (Array.isArray(categories) ? categories : [])
          .filter(c => c.parentId === selectedMainCategoryId)
          .flatMap(c => [String(c.id), ...(Array.isArray(categories) ? categories.filter(sc => sc.parentId === c.id).map(sc => String(sc.id)) : [])]);
        matchesCategory = allChildIds.includes(String(a.categorieId));
      }
      const matchesBrand = !brand || (a.marque || "").toLowerCase().includes(brand.toLowerCase());
      const matchesMaterial = !material || (a.matiere || "").toLowerCase().includes(material.toLowerCase());
      const matchesSku = !sku || (a.sku || "").toLowerCase().includes(sku.toLowerCase());
      const price = Number(getDisplayPrice(a) || 0);
      const matchesMin = !minPrice || price >= Number(minPrice);
      const matchesMax = !maxPrice || price <= Number(maxPrice);
      const matchesColor = articleMatchesColor(a, colorId);
      const matchesSize = articleMatchesSize(a, sizeId);
      const matchesFavorites = !favoritesOnly || favorites.includes(a.id);
      return matchesSearch && matchesCategory && matchesBrand && matchesMaterial && matchesSku && matchesMin && matchesMax && matchesColor && matchesSize && matchesFavorites;
    });

    // Sort: recommended first (by score), then by id
filteredList.sort((a, b) => {
    const aMatchesPref = userPreferredCategory && a.categorieId === userPreferredCategory;
    const bMatchesPref = userPreferredCategory && b.categorieId === userPreferredCategory;
    if (aMatchesPref !== bMatchesPref) return aMatchesPref ? -1 : 1;
    return a.id - b.id;
  });

    return filteredList;
}, [articles, search, selectedMainCategoryId, selectedSubCategoryId, selectedSubSubCategoryId,
    brand, material, sku, minPrice, maxPrice, colorId, sizeId, favoritesOnly, favorites,
    categories, subSubCategories, userPreferredCategory]);

  function resetFilters() {
    setSearch("");
    setSelectedMainCategoryId("");
    setSelectedSubCategoryId("");
    setSelectedSubSubCategoryId("");
    setBrand("");
    setMaterial("");
    setSku("");
    setColorId("");
    setSizeId("");
    setMinPrice("");
    setMaxPrice("");
    setFavoritesOnly(false);
  }

  const openProduct = (id) => navigate(`/product/${id}`);

  return (
    <div className="homePage catalogPageWrap">
      <div className="catalogLayout">
        <aside className="filterSidebar slideInLeft" id="filters">
          <div className="filterHead"><h2>{t("catalog.filters", "Filters")}</h2></div>
          <div className="filterContent">
            <div className="filterBlock">
              <input className="searchBox" placeholder={t("common.searchAnything", "Search anything")} value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="filterBlock">
              <div className="filterTitle">{t("catalog.category", "Category")}</div>
              <div className="stackBtns">
                <button type="button" className={!selectedMainCategoryId && !selectedSubCategoryId && !selectedSubSubCategoryId ? "catBtn active" : "catBtn"} onClick={() => { setSelectedMainCategoryId(""); setSelectedSubCategoryId(""); setSelectedSubSubCategoryId(""); }}>{t("common.all", "All")}</button>
                {mainCategories.map((c) => (<button key={c.id} type="button" className={selectedMainCategoryId === c.id ? "catBtn active" : "catBtn"} onClick={() => setSelectedMainCategoryId(c.id)} style={{ fontWeight: "bold" }}>{c.nom}</button>))}
              </div>
              {subCategories.length > 0 && (
                <>
                  <div className="filterSubtitle" style={{ marginTop: "12px", fontSize: "13px", fontWeight: "500", color: "#666" }}>{t("catalog.subCategory", "Sub Category")}</div>
                  <div className="stackBtns">
                    {subCategories.map((c) => (<button key={c.id} type="button" className={selectedSubCategoryId === c.id ? "catBtn active" : "catBtn"} onClick={() => setSelectedSubCategoryId(c.id)} style={{ marginLeft: "8px" }}>{c.nom}</button>))}
                  </div>
                </>
              )}
              {subSubCategories.length > 0 && (
                <>
                  <div className="filterSubtitle" style={{ marginTop: "12px", fontSize: "13px", fontWeight: "500", color: "#666" }}>{t("catalog.productType", "Product Type")}</div>
                  <div className="stackBtns">
                    {subSubCategories.map((c) => (<button key={c.id} type="button" className={selectedSubSubCategoryId === c.id ? "catBtn active" : "catBtn"} onClick={() => setSelectedSubSubCategoryId(c.id)} style={{ marginLeft: "16px" }}>{c.nom}</button>))}
                  </div>
                </>
              )}
            </div>
            <div className="filterBlock">
              <div className="filterTitle">{t("catalog.price", "Price")}</div>
              <div className="rangeGrid">
                <input type="number" placeholder={t("catalog.min", "Min")} value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
                <input type="number" placeholder={t("catalog.max", "Max")} value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
              </div>
            </div>
            <div className="filterBlock">
  <div className="filterTitle">{t("catalog.brand", "Brand")}</div>
  <select 
    className="searchBox" 
    value={brand} 
    onChange={(e) => setBrand(e.target.value)}
  >
    <option value="">{t("common.all", "All")}</option>
    {uniqueBrands.map(b => (
      <option key={b} value={b}>{b}</option>
    ))}
  </select>
</div>
            <div className="filterBlock">
  <div className="filterTitle">{t("catalog.material", "Material")}</div>
  <select 
    className="searchBox" 
    value={material} 
    onChange={(e) => setMaterial(e.target.value)}
  >
    <option value="">{t("common.all", "All")}</option>
    {uniqueMaterials.map(m => (
      <option key={m} value={m}>{m}</option>
    ))}
  </select>
</div>
            <div className="filterBlock">
              <div className="filterTitle">{t("catalog.sku", "SKU")}</div>
              <input className="searchBox" placeholder="Search SKU..." value={sku} onChange={(e) => setSku(e.target.value)} />
            </div>
            <div className="filterBlock">
              <div className="filterTitle">{t("catalog.colors", "Colors")}</div>
              <div className="colorGrid">
                <button type="button" className={!colorId ? "allFilterBtn active" : "allFilterBtn"} onClick={() => setColorId("")}>{t("common.all", "All")}</button>
                {colors.map((c) => (<button key={c.id} type="button" className={`colorPick ${String(colorId) === String(c.id) ? "selected" : ""}`} style={{ background: c.codeHex || c.codehex || "#ddd" }} title={c.nom} onClick={() => setColorId(c.id)} />))}
              </div>
            </div>
            <div className="filterBlock">
              <div className="filterTitle">{t("catalog.size", "Size")}</div>
              <div className="sizeGrid">
                <button type="button" className={!sizeId ? "sizeBtn active" : "sizeBtn"} onClick={() => setSizeId("")}>{t("common.all", "All")}</button>
                {sizes.map((s) => (<button key={s.id} type="button" className={String(sizeId) === String(s.id) ? "sizeBtn active" : "sizeBtn"} onClick={() => setSizeId(s.id)}>{s.pointure}</button>))}
              </div>
            </div>
            <div className="filterBlock">
              <button type="button" className={`favoriteFilterBtn ${favoritesOnly ? "active" : ""}`} onClick={() => setFavoritesOnly((v) => !v)}>
                {favoritesOnly ? t("catalog.favoritesOnlyActive", "Favorites only active") : t("catalog.favoritesOnly", "Favorites only")}
              </button>
            </div>
            <div className="filterBlock">
              <button type="button" className="applyBtn" onClick={resetFilters}>{t("common.resetFilters", "Reset filters")}</button>
            </div>
          </div>
        </aside>
        <section className="catalogContent fadeInUp">
          <div className="catalogTop">
            <div><h2>{t("catalog.title", "Catalog")}</h2><p>{filtered.length} {t("catalog.found", "found")}</p></div>
          </div>
          {selectedSubSubCategoryId && (
            <div className="selectedCategoryPath" style={{ marginBottom: "20px", padding: "10px 15px", background: "#f5f5f5", borderRadius: "8px", fontSize: "14px" }}>
              <strong>{t("catalog.selectedCategory", "Selected category")}:</strong> {getCategoryPath(selectedSubSubCategoryId, categories)}
            </div>
          )}
          {loading ? (
            <div className="homeInfo">{t("home.loadingProducts", "Loading products...")}</div>
          ) : error ? (
            <div className="homeInfo error">{error}</div>
          ) : !filtered.length ? (
            <div className="homeInfo">{t("catalog.noMatch", "No products match your filters")}</div>
          ) : (
            <div className="productsGrid catalogProductsGrid" id="catalog-grid">
              {filtered.map((p) => (
                <ProductCard key={p.id} p={p} onOpen={openProduct} favorites={favorites} toggleFavorite={toggleFavorite} nowTick={nowTick} selectedColorId={colorId} />
              ))}
            </div>
          )}
        </section>
      </div>
      <Footer />
    </div>
  );
}