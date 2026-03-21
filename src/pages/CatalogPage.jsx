import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import "../styles/catalog.css";
import UserIconMenu from "../components/UserIconMenu";

const toAbs = (path) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
  return `${base}${path}`;
};

const fmtPrice = (v) => `${Number(v || 0).toFixed(3)} TND`;

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

export default function CatalogPage({ me, setMe }) {
  const navigate = useNavigate();

  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [brand, setBrand] = useState("");
  const [material, setMaterial] = useState("");
  const [sku, setSku] = useState("");
  const [colorId, setColorId] = useState("");
  const [sizeId, setSizeId] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  useEffect(() => {
    async function load() {
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
    }

    load().catch(console.error);
  }, []);

  const filtered = useMemo(() => {
    return articles.filter((a) => {
      const s = search.trim().toLowerCase();

      const matchesSearch =
        !s ||
        `${a.nom} ${a.description || ""} ${a.marque || ""} ${a.matiere || ""} ${a.sku || ""} ${a.categorieNom || ""}`
          .toLowerCase()
          .includes(s);

      const matchesCategory = !categoryId || String(a.categorieId) === String(categoryId);
      const matchesBrand = !brand || (a.marque || "").toLowerCase().includes(brand.toLowerCase());
      const matchesMaterial = !material || (a.matiere || "").toLowerCase().includes(material.toLowerCase());
      const matchesSku = !sku || (a.sku || "").toLowerCase().includes(sku.toLowerCase());

      const price = Number(getDisplayPrice(a) || 0);
      const matchesMin = !minPrice || price >= Number(minPrice);
      const matchesMax = !maxPrice || price <= Number(maxPrice);

      const vars = a.variations || [];
      const matchesColor = !colorId || vars.some((v) => String(v.couleurId) === String(colorId));
      const matchesSize = !sizeId || vars.some((v) => String(v.tailleId) === String(sizeId));

      return (
        matchesSearch &&
        matchesCategory &&
        matchesBrand &&
        matchesMaterial &&
        matchesSku &&
        matchesMin &&
        matchesMax &&
        matchesColor &&
        matchesSize
      );
    });
  }, [articles, search, categoryId, brand, material, sku, minPrice, maxPrice, colorId, sizeId]);

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
  }

  return (
    <div className="catalogShell">
      <header className="catalogNavbar">
        <Link to="/" className="catalogLogo">EMIRIO</Link>

        <nav className="catalogNavLinks">
          <Link to="/">Home</Link>
          <a href="#catalog-grid">Shop</a>
          <a href="#filters">Filters</a>
        </nav>

        <div className="catalogNavRight">
          <div className="catalogSearchTop">
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <UserIconMenu me={me} setMe={setMe} />
        </div>
      </header>

      <div className="catalogHero fadeInUp">
        <div>
          <div className="catalogEyebrow">PREMIUM COLLECTION</div>
          <h1>Discover your next favorite pair</h1>
          <p>Browse premium products, active sales, best brands and filtered results in one place.</p>
        </div>
        <div className="catalogHeroStats">
          <div className="heroStatCard">
            <span>{filtered.length}</span>
            <small>Products found</small>
          </div>
          <div className="heroStatCard">
            <span>{articles.filter((a) => isSaleActive(a)).length}</span>
            <small>On sale</small>
          </div>
        </div>
      </div>

      <div className="catalogPage">
        <aside className="filterSidebar slideInLeft" id="filters">
          <div className="filterHead">
            <h2>Filters</h2>
          </div>

          <div className="filterBlock">
            <input
              className="searchBox"
              placeholder="Search anything..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filterBlock">
            <div className="filterTitle">Category</div>
            <div className="stackBtns">
              <button className={!categoryId ? "catBtn active" : "catBtn"} onClick={() => setCategoryId("")}>
                All
              </button>
              {categories.map((c) => (
                <button
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
            <div className="filterTitle">Price</div>
            <div className="rangeGrid">
              <input type="number" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
              <input type="number" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
            </div>
          </div>

          <div className="filterBlock">
            <div className="filterTitle">Brand</div>
            <input
              className="searchBox"
              placeholder="Nike, Adidas..."
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
            />
          </div>

          <div className="filterBlock">
            <div className="filterTitle">Material</div>
            <input
              className="searchBox"
              placeholder="Leather, Cotton..."
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
            />
          </div>

          <div className="filterBlock">
            <div className="filterTitle">SKU</div>
            <input
              className="searchBox"
              placeholder="Search SKU..."
              value={sku}
              onChange={(e) => setSku(e.target.value)}
            />
          </div>

          <div className="filterBlock">
            <div className="filterTitle">Colors</div>
            <div className="colorGrid">
              <button className={!colorId ? "allFilterBtn active" : "allFilterBtn"} onClick={() => setColorId("")}>
                All
              </button>
              {colors.map((c) => (
                <button
                  key={c.id}
                  className={`colorPick ${String(colorId) === String(c.id) ? "selected" : ""}`}
                  style={{ background: c.codeHex }}
                  title={c.nom}
                  onClick={() => setColorId(c.id)}
                />
              ))}
            </div>
          </div>

          <div className="filterBlock">
            <div className="filterTitle">Size</div>
            <div className="sizeGrid">
              <button className={!sizeId ? "sizeBtn active" : "sizeBtn"} onClick={() => setSizeId("")}>
                All
              </button>
              {sizes.map((s) => (
                <button
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
            <button className="applyBtn" onClick={resetFilters}>Reset Filters</button>
          </div>
        </aside>

        <section className="catalogContent fadeInUp">
          <div className="catalogTop">
            <div>
              <h2>Shop catalog</h2>
              <p>{filtered.length} products found</p>
            </div>
          </div>

          <div className="catalogGrid" id="catalog-grid">
            {filtered.map((a, i) => {
              const images = getProductImages(a);
              const mainImage = images[0] || "";
              const onSale = isSaleActive(a);
              const discount = getDiscountPercent(a);

              return (
                <div
                  key={a.id}
                  className="catalogCard fadeInUp"
                  style={{ animationDelay: `${i * 0.04}s` }}
                  onClick={() => navigate(`/product/${a.id}`)}
                >
                  <div className="catalogImageWrap">
                    {onSale ? <div className="catalogSaleBadge">SALE -{discount}%</div> : null}
                    <button
                      className="catalogFavBtn"
                      type="button"
                      onClick={(e) => e.stopPropagation()}
                    >
                      ♡
                    </button>

                    {mainImage ? (
                      <img src={mainImage} alt={a.nom} className="catalogImage" />
                    ) : (
                      <div className="catalogImage empty">No image</div>
                    )}
                  </div>

                  <div className="catalogBody">
                    <div className="catalogName">{a.nom}</div>
                    <div className="catalogMeta">{a.marque || "EMIRIO"}</div>
                    <div className="catalogMeta">{a.categorieNom || "-"}</div>

                    <div className="catalogPriceRow">
                      <span className="catalogPriceNow">{fmtPrice(getDisplayPrice(a))}</span>
                      {onSale ? <span className="catalogPriceOld">{fmtPrice(a.prix)}</span> : null}
                    </div>

                    <button
                      className="catalogViewBtn"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/product/${a.id}`);
                      }}
                    >
                      View Product
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {!filtered.length && (
            <div className="catalogEmpty">No products match your filters.</div>
          )}
        </section>
      </div>
    </div>
  );
}
