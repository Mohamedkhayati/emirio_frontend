import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import Footer from "../components/Footer";
import "../styles/home.css";
import "../styles/catalog.css";

const toAbs = (path, mimeType) => {
  if (!path) return "";

  const value = String(path);

  if (value.startsWith("data:")) return value;
  if (value.startsWith("http")) return value;

  if (mimeType && !value.startsWith("/")) {
    return `data:${mimeType};base64,${value}`;
  }

  const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
  return `${base}${value}`;
};

const fmtPrice = (v) => {
  if (v === null || v === undefined || v === "") return "-";
  return `${Number(v).toFixed(3)} TND`;
};

function readFavorites() {
  try {
    const value = JSON.parse(localStorage.getItem("favorites") || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

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
  return normalizeId(
    v?.couleurId ??
      v?.couleurid ??
      v?.colorId ??
      v?.colorid ??
      v?.couleur?.id ??
      v?.color?.id ??
      v?.couleur?.value ??
      v?.color?.value
  );
}

function getVariationSizeId(v) {
  return normalizeId(
    v?.tailleId ??
      v?.tailleid ??
      v?.sizeId ??
      v?.sizeid ??
      v?.taille?.id ??
      v?.size?.id ??
      v?.taille?.value ??
      v?.size?.value
  );
}

function getArticleColorIds(a) {
  const ids = new Set();

  (a?.variations || []).forEach((v) => {
    const id = getVariationColorId(v);
    if (id) ids.add(id);
  });

  (a?.colors || []).forEach((c) => {
    const id = normalizeId(c?.id ?? c?.couleurId ?? c?.couleurid ?? c?.colorId ?? c?.colorid);
    if (id) ids.add(id);
  });

  return [...ids];
}

function getArticleSizeIds(a) {
  const ids = new Set();

  (a?.variations || []).forEach((v) => {
    const id = getVariationSizeId(v);
    if (id) ids.add(id);
  });

  (a?.sizes || []).forEach((s) => {
    const id = normalizeId(s?.id ?? s?.tailleId ?? s?.tailleid ?? s?.sizeId ?? s?.sizeid);
    if (id) ids.add(id);
  });

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

function getImagesFromObject(obj) {
  if (!obj) return [];

  const images = [
    obj?.imageUrl,
    obj?.imageUrl2,
    obj?.imageUrl3,
    obj?.imageUrl4,

    obj?.imageData1 ? toAbs(obj.imageData1, obj?.imageType1 ?? obj?.imagetype1) : "",
    obj?.imageData2 ? toAbs(obj.imageData2, obj?.imageType2 ?? obj?.imagetype2) : "",
    obj?.imageData3 ? toAbs(obj.imageData3, obj?.imageType3 ?? obj?.imagetype3) : "",
    obj?.imageData4 ? toAbs(obj.imageData4, obj?.imageType4 ?? obj?.imagetype4) : "",

    obj?.imagedata1 ? toAbs(obj.imagedata1, obj?.imagetype1 ?? obj?.imageType1) : "",
    obj?.imagedata2 ? toAbs(obj.imagedata2, obj?.imagetype2 ?? obj?.imageType2) : "",
    obj?.imagedata3 ? toAbs(obj.imagedata3, obj?.imagetype3 ?? obj?.imageType3) : "",
    obj?.imagedata4 ? toAbs(obj.imagedata4, obj?.imagetype4 ?? obj?.imageType4) : "",
  ].filter(Boolean);

  return [...new Set(images.map((img) => toAbs(img)))];
}

function getProductImages(product, selectedColorId) {
  const articleImages = getImagesFromObject(product);
  const variations = Array.isArray(product?.variations) ? product.variations : [];

  if (selectedColorId) {
    const matchingVariations = variations.filter(
      (v) => String(getVariationColorId(v)) === String(normalizeId(selectedColorId))
    );

    const matchingImages = [...new Set(matchingVariations.flatMap((v) => getImagesFromObject(v)))];
    if (matchingImages.length) return matchingImages;
  }

  if (articleImages.length) return articleImages;

  const variationImages = [...new Set(variations.flatMap((v) => getImagesFromObject(v)))];
  if (variationImages.length) return variationImages;

  return [];
}

function ProductCard({
  p,
  onOpen,
  favorites,
  toggleFavorite,
  nowTick,
  selectedColorId,
}) {
  const { t } = useTranslation();
  const images = useMemo(() => getProductImages(p, selectedColorId), [p, selectedColorId]);
  const [currentImage, setCurrentImage] = useState(0);

  const onSale = isSaleActive(p);
  const discount = getDiscountPercent(p);
  const fav = favorites.includes(p.id);

  useEffect(() => {
    setCurrentImage(0);
  }, [p.id, selectedColorId, images.length]);

  useEffect(() => {
    if (images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div
      className="productCard fadeUp"
      onClick={() => onOpen(p.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onOpen(p.id)}
    >
      <div className="productImageWrap">
        {onSale ? <div className="saleRibbon pulse">SALE -{discount}%</div> : null}

        <button
          type="button"
          className={`favoriteBtn ${fav ? "active" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(p.id);
          }}
          aria-label={t("catalog.toggleFavorite", "Toggle favorite")}
        >
          {fav ? "♥" : "♡"}
        </button>

        {images.length > 0 ? (
          <img
            src={images[currentImage]}
            alt={p.nom}
            className="productImage imageFade"
          />
        ) : (
          <div className="productImage emptyImage">
            {t("common.noImage", "No image")}
          </div>
        )}

        {images.length > 1 && (
          <div className="sliderDots">
            {images.map((_, index) => (
              <span
                key={index}
                className={`sliderDot ${index === currentImage ? "active" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImage(index);
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="productName">{p.nom}</div>

      <div className="productMeta">
        {p.marque || "EMIRIO"} {p.recommended ? `• ${t("nav.bestChoice", "Best choice")}` : ""}
      </div>

      {onSale ? (
        <div className="saleCountdownMini">
          {t("home.endsIn", "Ends in")} {formatCountdown(p.saleEndAt, nowTick, t)}
        </div>
      ) : null}

      <div className="productPriceRow">
        <span className="priceNow">{fmtPrice(getDisplayPrice(p))}</span>
        {onSale ? <span className="priceOld">{fmtPrice(p.prix)}</span> : null}
        {onSale && discount !== null ? <span className="discountTag">-{discount}%</span> : null}
      </div>

      <button
        type="button"
        className="catalogOpenBtn"
        onClick={(e) => {
          e.stopPropagation();
          onOpen(p.id);
        }}
      >
        {t("catalog.viewProduct", "View Product")}
      </button>
    </div>
  );
}

export default function CatalogPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [brand, setBrand] = useState("");
  const [material, setMaterial] = useState("");
  const [sku, setSku] = useState("");
  const [colorId, setColorId] = useState("");
  const [sizeId, setSizeId] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [nowTick, setNowTick] = useState(Date.now());

  const [favorites, setFavorites] = useState(readFavorites);

  useEffect(() => {
    const tick = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    const qpCategory = searchParams.get("categorieId") || "";
    setCategoryId(qpCategory);
  }, [searchParams]);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");

        const [aRes, cRes, colorRes, sizeRes] = await Promise.all([
          api.get("/api/articles"),
          api.get("/api/categories"),
          api.get("/api/admin/colors"),
          api.get("/api/admin/sizes"),
        ]);

        setArticles((aRes.data || []).filter((a) => a.actif !== false));
        setCategories(cRes.data || []);
        setColors(colorRes.data || []);
        setSizes(sizeRes.data || []);
      } catch (e) {
        setError(e?.response?.data?.message || "Cannot load catalog");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);

  const filtered = useMemo(() => {
    return articles.filter((a) => {
      const s = search.trim().toLowerCase();

      const matchesSearch =
        !s ||
        `${a.nom || ""} ${a.description || ""} ${a.marque || ""} ${a.matiere || ""} ${a.sku || ""} ${a.categorieNom || ""}`
          .toLowerCase()
          .includes(s);

      const matchesCategory = !categoryId || String(a.categorieId) === String(categoryId);
      const matchesBrand = !brand || (a.marque || "").toLowerCase().includes(brand.toLowerCase());
      const matchesMaterial =
        !material || (a.matiere || "").toLowerCase().includes(material.toLowerCase());
      const matchesSku = !sku || (a.sku || "").toLowerCase().includes(sku.toLowerCase());

      const price = Number(getDisplayPrice(a) || 0);
      const matchesMin = !minPrice || price >= Number(minPrice);
      const matchesMax = !maxPrice || price <= Number(maxPrice);

      const matchesColor = articleMatchesColor(a, colorId);
      const matchesSize = articleMatchesSize(a, sizeId);
      const matchesFavorites = !favoritesOnly || favorites.includes(a.id);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesBrand &&
        matchesMaterial &&
        matchesSku &&
        matchesMin &&
        matchesMax &&
        matchesColor &&
        matchesSize &&
        matchesFavorites
      );
    });
  }, [
    articles,
    search,
    categoryId,
    brand,
    material,
    sku,
    minPrice,
    maxPrice,
    colorId,
    sizeId,
    favoritesOnly,
    favorites,
  ]);

  function resetFilters() {
    setSearch("");
    setCategoryId("");
    setBrand("");
    setMaterial("");
    setSku("");
    setColorId("");
    setSizeId("");
    setMinPrice("");
    setMaxPrice("");
    setFavoritesOnly(false);
  }

  function toggleFavorite(id) {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  const openProduct = (id) => navigate(`/product/${id}`);

  return (
    <div className="homePage catalogPageWrap">
      <div className="catalogLayout">
        <aside className="filterSidebar slideInLeft" id="filters">
          <div className="filterHead">
            <h2>{t("catalog.filters", "Filters")}</h2>
          </div>

          <div className="filterBlock">
            <input
              className="searchBox"
              placeholder={t("common.searchAnything", "Search anything")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filterBlock">
            <div className="filterTitle">{t("catalog.category", "Category")}</div>
            <div className="stackBtns">
              <button
                type="button"
                className={!categoryId ? "catBtn active" : "catBtn"}
                onClick={() => setCategoryId("")}
              >
                {t("common.all", "All")}
              </button>

              {categories.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  className={String(categoryId) === String(c.id) ? "catBtn active" : "catBtn"}
                  onClick={() => setCategoryId(c.id)}
                >
                  {c.nom}
                </button>
              ))}
            </div>
          </div>

          <div className="filterBlock">
            <div className="filterTitle">{t("catalog.price", "Price")}</div>
            <div className="rangeGrid">
              <input
                type="number"
                placeholder={t("catalog.min", "Min")}
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
              <input
                type="number"
                placeholder={t("catalog.max", "Max")}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
          </div>

          <div className="filterBlock">
            <div className="filterTitle">{t("catalog.brand", "Brand")}</div>
            <input
              className="searchBox"
              placeholder="Nike, Adidas..."
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
            />
          </div>

          <div className="filterBlock">
            <div className="filterTitle">{t("catalog.material", "Material")}</div>
            <input
              className="searchBox"
              placeholder="Leather, Cotton..."
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
            />
          </div>

          <div className="filterBlock">
            <div className="filterTitle">{t("catalog.sku", "SKU")}</div>
            <input
              className="searchBox"
              placeholder="Search SKU..."
              value={sku}
              onChange={(e) => setSku(e.target.value)}
            />
          </div>

          <div className="filterBlock">
            <div className="filterTitle">{t("catalog.colors", "Colors")}</div>
            <div className="colorGrid">
              <button
                type="button"
                className={!colorId ? "allFilterBtn active" : "allFilterBtn"}
                onClick={() => setColorId("")}
              >
                {t("common.all", "All")}
              </button>

              {colors.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  className={`colorPick ${String(colorId) === String(c.id) ? "selected" : ""}`}
                  style={{ background: c.codeHex || c.codehex || "#ddd" }}
                  title={c.nom}
                  onClick={() => setColorId(c.id)}
                />
              ))}
            </div>
          </div>

          <div className="filterBlock">
            <div className="filterTitle">{t("catalog.size", "Size")}</div>
            <div className="sizeGrid">
              <button
                type="button"
                className={!sizeId ? "sizeBtn active" : "sizeBtn"}
                onClick={() => setSizeId("")}
              >
                {t("common.all", "All")}
              </button>

              {sizes.map((s) => (
                <button
                  type="button"
                  key={s.id}
                  className={String(sizeId) === String(s.id) ? "sizeBtn active" : "sizeBtn"}
                  onClick={() => setSizeId(s.id)}
                >
                  {s.pointure}
                </button>
              ))}
            </div>
          </div>

          <div className="filterBlock">
            <button
              type="button"
              className={`favoriteFilterBtn ${favoritesOnly ? "active" : ""}`}
              onClick={() => setFavoritesOnly((v) => !v)}
            >
              {favoritesOnly
                ? t("catalog.favoritesOnlyActive", "Favorites only active")
                : t("catalog.favoritesOnly", "Favorites only")}
            </button>
          </div>

          <div className="filterBlock">
            <button type="button" className="applyBtn" onClick={resetFilters}>
              {t("common.resetFilters", "Reset filters")}
            </button>
          </div>
        </aside>

        <section className="catalogContent fadeInUp">
          <div className="catalogTop">
            <div>
              <h2>{t("catalog.title", "Catalog")}</h2>
              <p>
                {filtered.length} {t("catalog.found", "found")}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="homeInfo">{t("home.loadingProducts", "Loading products...")}</div>
          ) : error ? (
            <div className="homeInfo error">{error}</div>
          ) : !filtered.length ? (
            <div className="homeInfo">{t("catalog.noMatch", "No products match your filters")}</div>
          ) : (
            <div className="productsGrid catalogProductsGrid" id="catalog-grid">
              {filtered.map((p) => (
                <ProductCard
                  key={p.id}
                  p={p}
                  onOpen={openProduct}
                  favorites={favorites}
                  toggleFavorite={toggleFavorite}
                  nowTick={nowTick}
                  selectedColorId={colorId}
                />
              ))}
            </div>
          )}
        </section>
      </div>

    </div>
  );
}