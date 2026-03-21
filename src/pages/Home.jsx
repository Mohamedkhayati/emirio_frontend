import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import "../styles/home.css";
import { useTranslation } from "react-i18next";
import UserIconMenu from "../components/UserIconMenu";

const toAbs = (path) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
  return `${base}${path}`;
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

function getProductImages(p) {
  return [p?.imageUrl, p?.imageUrl2, p?.imageUrl3, p?.imageUrl4]
    .filter(Boolean)
    .map((img) => toAbs(img));
}

function getMainProductImage(p) {
  const images = getProductImages(p);
  return images.length ? images[0] : null;
}

function formatCountdown(endAt, nowTick) {
  if (!endAt) return "Limited offer";
  const diff = new Date(endAt).getTime() - nowTick;
  if (diff <= 0) return "Sale ended";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

function SaleHeroSlider({ articles, onOpen, nowTick }) {
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
            <h1>Discover premium products</h1>
            <p>Shop real products added from your admin dashboard.</p>
            <div className="heroButtons">
              <a href="#new-arrivals" className="shopBtn">Shop Now</a>
            </div>
          </div>

          <div className="saleHeroVisual">
            <div className="saleHeroImage emptyImage">No image</div>
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
          <p>{current.description || "Discover products from your catalog."}</p>

          <div className="heroPriceRow">
            <span className="heroPriceNow">{fmtPrice(getDisplayPrice(current))}</span>
            {onSale ? <span className="heroPriceOld">{fmtPrice(current.prix)}</span> : null}
            {onSale && discount ? <span className="heroDiscount">-{discount}%</span> : null}
          </div>

          {onSale ? (
            <div className="heroCountdown">
              Ends in <strong>{formatCountdown(current.saleEndAt, nowTick)}</strong>
            </div>
          ) : null}

          <div className="heroButtons">
            <button className="shopBtn" onClick={() => onOpen(current.id)}>
              Shop Now
            </button>
          </div>
        </div>

        <div
          className="saleHeroVisual"
          onClick={() => onOpen(current.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && onOpen(current.id)}
        >
          {heroImage ? (
            <img src={heroImage} alt={current.nom} className="saleHeroImage" />
          ) : (
            <div className="saleHeroImage emptyImage">No image</div>
          )}

          {heroItems.length > 1 && (
            <div className="heroDots">
              {heroItems.map((item, i) => (
                <span
                  key={item.id}
                  className={`heroDot ${i === index ? "active" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIndex(i);
                  }}
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
  const images = getProductImages(p);
  const [currentImage, setCurrentImage] = useState(0);

  const onSale = isSaleActive(p);
  const discount = getDiscountPercent(p);
  const fav = favorites.includes(p.id);

  useEffect(() => {
    setCurrentImage(0);
  }, [p.id]);

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
          aria-label="Toggle favorite"
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
          <div className="productImage emptyImage">No image</div>
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
        {p.marque || "EMIRIO"} {p.recommended ? "• Best Choice" : ""}
      </div>

      {onSale ? (
        <div className="saleCountdownMini">
          Ends in {formatCountdown(p.saleEndAt, nowTick)}
        </div>
      ) : null}

      <div className="productPriceRow">
        <span className="priceNow">{fmtPrice(getDisplayPrice(p))}</span>
        {onSale ? <span className="priceOld">{fmtPrice(p.prix)}</span> : null}
        {onSale && discount ? <span className="discountTag">-{discount}%</span> : null}
      </div>
    </div>
  );
}

export default function Home({ me, setMe }) {
  const { i18n } = useTranslation();
  const navigate = useNavigate();

  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingArticles, setLoadingArticles] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [nowTick, setNowTick] = useState(Date.now());
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("favorites") || "[]");
    } catch {
      return [];
    }
  });

  const setLang = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem("language", lng);
  };

  useEffect(() => {
    const tick = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

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
        setCategories(categoriesRes.data || []);
      } catch (e) {
        setError(e?.response?.data?.message || "Cannot load catalog");
      } finally {
        setLoadingArticles(false);
      }
    }

    loadData();
  }, []);

  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);

  const filteredArticles = useMemo(() => {
    let list = [...articles];

    if (selectedCategoryId) {
      list = list.filter((a) => Number(a.categorieId) === Number(selectedCategoryId));
    }

    const s = search.trim().toLowerCase();
    if (!s) return list;

    return list.filter((a) =>
      `${a.nom} ${a.description || ""} ${a.categorieNom || ""} ${a.marque || ""}`
        .toLowerCase()
        .includes(s)
    );
  }, [search, articles, selectedCategoryId]);

  const saleArticles = useMemo(
    () =>
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

  const recommendedArticles = useMemo(
    () =>
      filteredArticles
        .filter((a) => !!a.recommended)
        .slice(0, 8),
    [filteredArticles]
  );

  const newArrivals = useMemo(
    () =>
      [...filteredArticles]
        .sort((a, b) => Number(b.id) - Number(a.id))
        .slice(0, 8),
    [filteredArticles]
  );

  const openProduct = (id) => navigate(`/product/${id}`);
  const openCatalog = () =>
    navigate(selectedCategoryId ? `/catalog?categorieId=${selectedCategoryId}` : "/catalog");

  const toggleFavorite = (id) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="homePage">
      <div className="topStrip">
        <span>Best sale products available now on EMIRIO.</span>
      </div>

      <header className="storeHeader">
        <Link to="/" className="logo">EMIRIO</Link>

        <nav className="mainNav">
          <a href="#sale-products">On Sale</a>
          <a href="#recommended">Best Choice</a>
          <a href="#new-arrivals">New Arrivals</a>
          <a href="#categories">Categories</a>
        </nav>

        <div className="headerActions">
          <div className="searchBar">
            <input
              type="text"
              placeholder="Search for products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="langSwitcher">
            <button type="button" onClick={() => setLang("en")}>EN</button>
            <button type="button" onClick={() => setLang("fr")}>FR</button>
            <button type="button" onClick={() => setLang("ar")}>AR</button>
          </div>

          <UserIconMenu me={me} setMe={setMe} />
        </div>
      </header>

      <SaleHeroSlider articles={filteredArticles} onOpen={openProduct} nowTick={nowTick} />

      <section className="productSection" id="sale-products">
        <div className="sectionTopRow">
          <h2>ON SALE NOW</h2>
          <button className="viewAllBtn" onClick={openCatalog}>View All</button>
        </div>

        {loadingArticles ? (
          <div className="homeInfo">Loading sale products...</div>
        ) : error ? (
          <div className="homeInfo error">{error}</div>
        ) : !saleArticles.length ? (
          <div className="homeInfo">No active sale products now.</div>
        ) : (
          <div className="productsGrid">
            {saleArticles.map((p) => (
              <ProductCard
                key={`sale-${p.id}`}
                p={p}
                onOpen={openProduct}
                favorites={favorites}
                toggleFavorite={toggleFavorite}
                nowTick={nowTick}
              />
            ))}
          </div>
        )}
      </section>

      <section className="productSection withBorder" id="recommended">
        <div className="sectionTopRow">
          <h2>BEST CHOICE</h2>
          <button className="viewAllBtn" onClick={openCatalog}>View All</button>
        </div>

        {loadingArticles ? (
          <div className="homeInfo">Loading recommendations...</div>
        ) : error ? (
          <div className="homeInfo error">{error}</div>
        ) : !recommendedArticles.length ? (
          <div className="homeInfo">No recommended products yet.</div>
        ) : (
          <div className="productsGrid">
            {recommendedArticles.map((p) => (
              <ProductCard
                key={`recommended-${p.id}`}
                p={p}
                onOpen={openProduct}
                favorites={favorites}
                toggleFavorite={toggleFavorite}
                nowTick={nowTick}
              />
            ))}
          </div>
        )}
      </section>

      <section className="categoryBrowseSection" id="categories">
        <div className="sectionTopRow">
          <h2>CATEGORIES</h2>
          <button className="viewAllBtn" onClick={openCatalog}>Open Catalog</button>
        </div>

        <div className="categoryChips">
          <button
            className={`categoryChip ${selectedCategoryId === null ? "active" : ""}`}
            onClick={() => setSelectedCategoryId(null)}
          >
            All
          </button>

          {categories.map((c) => (
            <button
              key={c.id}
              className={`categoryChip ${selectedCategoryId === c.id ? "active" : ""}`}
              onClick={() => setSelectedCategoryId(c.id)}
            >
              {c.nom}
            </button>
          ))}
        </div>
      </section>

      <section className="productSection withBorder" id="new-arrivals">
        <div className="sectionTopRow">
          <h2>NEW ARRIVALS</h2>
          <button className="viewAllBtn" onClick={openCatalog}>View All</button>
        </div>

        {loadingArticles ? (
          <div className="homeInfo">Loading products...</div>
        ) : error ? (
          <div className="homeInfo error">{error}</div>
        ) : !newArrivals.length ? (
          <div className="homeInfo">No products found.</div>
        ) : (
          <div className="productsGrid">
            {newArrivals.map((p) => (
              <ProductCard
                key={`new-${p.id}`}
                p={p}
                onOpen={openProduct}
                favorites={favorites}
                toggleFavorite={toggleFavorite}
                nowTick={nowTick}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
