import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import "../styles/product-details.css";
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

const starsText = (n) => "★".repeat(n) + "☆".repeat(5 - n);

function hasValidSaleFields(p) {
  return p && (p.salePrice !== null && p.salePrice !== undefined && p.salePrice !== "");
}

function isSaleActive(p) {
  if (!p || !hasValidSaleFields(p)) return false;
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
  return Math.round(((Number(p.prix) - Number(p.salePrice)) / Number(p.prix)) * 100);
}

function getDisplayPrice(p) {
  return isSaleActive(p) ? Number(p.salePrice) : Number(p.prix);
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

function mergeSaleFields(detailProduct, listProduct) {
  if (!detailProduct) return null;
  if (!listProduct) return detailProduct;

  return {
    ...detailProduct,
    salePrice:
      detailProduct.salePrice ?? listProduct.salePrice ?? null,
    saleStartAt:
      detailProduct.saleStartAt ?? listProduct.saleStartAt ?? null,
    saleEndAt:
      detailProduct.saleEndAt ?? listProduct.saleEndAt ?? null,
    prix:
      detailProduct.prix ?? listProduct.prix ?? null,
    categorieNom:
      detailProduct.categorieNom ?? listProduct.categorieNom ?? "",
    categorieId:
      detailProduct.categorieId ?? listProduct.categorieId ?? null,
    marque:
      detailProduct.marque ?? listProduct.marque ?? "",
    matiere:
      detailProduct.matiere ?? listProduct.matiere ?? "",
    sku:
      detailProduct.sku ?? listProduct.sku ?? "",
    imageUrl:
      detailProduct.imageUrl ?? listProduct.imageUrl ?? "",
    imageUrl2:
      detailProduct.imageUrl2 ?? listProduct.imageUrl2 ?? "",
    imageUrl3:
      detailProduct.imageUrl3 ?? listProduct.imageUrl3 ?? "",
    imageUrl4:
      detailProduct.imageUrl4 ?? listProduct.imageUrl4 ?? "",
  };
}

export default function ProductDetailsPage({ me, setMe }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [article, setArticle] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [related, setRelated] = useState([]);
  const [activeImage, setActiveImage] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("details");
  const [qty, setQty] = useState(1);
  const [nowTick, setNowTick] = useState(Date.now());
  const [error, setError] = useState("");

  async function loadData() {
    setError("");

    const [detailRes, reviewsRes, listRes] = await Promise.all([
      api.get(`/api/articles/${id}`),
      api.get(`/api/articles/${id}/reviews`),
      api.get("/api/articles"),
    ]);

    const detailProduct = detailRes.data;
    const all = Array.isArray(listRes.data) ? listRes.data : [];
    const listProduct = all.find((a) => Number(a.id) === Number(id));
    const mergedProduct = mergeSaleFields(detailProduct, listProduct);

    setArticle(mergedProduct);
    setReviews(Array.isArray(reviewsRes.data) ? reviewsRes.data : []);

    const imgs = [
      mergedProduct?.imageUrl,
      mergedProduct?.imageUrl2,
      mergedProduct?.imageUrl3,
      mergedProduct?.imageUrl4,
    ].filter(Boolean);

    setActiveImage(imgs[0] || "");

    const rel = all
      .filter((a) => a.actif !== false)
      .filter((a) => Number(a.id) !== Number(id))
      .filter((a) =>
        mergedProduct?.categorieId
          ? Number(a.categorieId) === Number(mergedProduct.categorieId)
          : true
      )
      .slice(0, 4);

    setRelated(rel);
  }

  useEffect(() => {
    setLoading(true);
    loadData()
      .catch((e) => {
        console.error(e);
        setError(e?.response?.data?.message || "Cannot load product");
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const tick = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  const gallery = useMemo(() => {
    if (!article) return [];
    return [article.imageUrl, article.imageUrl2, article.imageUrl3, article.imageUrl4].filter(Boolean);
  }, [article]);

  const avg = useMemo(() => {
    if (!reviews.length) return 0;
    return reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / reviews.length;
  }, [reviews]);

  async function submitReview(e) {
    e.preventDefault();

    if (!me) {
      alert("Login first");
      return;
    }

    await api.post(`/api/articles/${id}/reviews`, {
      rating,
      comment: reviewText,
    });

    setReviewText("");
    setRating(5);
    await loadData();
    setTab("reviews");
  }

  function addToCart() {
    if (!article) return;

    const item = {
      id: article.id,
      nom: article.nom,
      prix: getDisplayPrice(article),
      qty,
      imageUrl: article.imageUrl || "",
    };

    const existing = JSON.parse(localStorage.getItem("cart") || "[]");
    const found = existing.find((x) => Number(x.id) === Number(article.id));

    const next = found
      ? existing.map((x) =>
          Number(x.id) === Number(article.id)
            ? { ...x, qty: Number(x.qty || 0) + qty }
            : x
        )
      : [...existing, item];

    localStorage.setItem("cart", JSON.stringify(next));
    alert("Added to cart");
  }

  if (loading) return <div className="pdInfo">Loading...</div>;
  if (error) return <div className="pdInfo error">{error}</div>;
  if (!article) return <div className="pdInfo error">Product not found.</div>;

  const onSale = isSaleActive(article);
  const discount = getDiscountPercent(article);

  return (
    <div className="pdPage">
      <header className="storeHeader pdNav">
        <Link to="/" className="logo">EMIRIO</Link>

        <nav className="mainNav">
          <Link to="/">Home</Link>
          <Link to="/catalog">Catalog</Link>
          <a href="#pd-reviews">Reviews</a>
          <a href="#pd-related">Related</a>
        </nav>

        <div className="headerActions">
          <button type="button" className="viewAllBtn" onClick={() => navigate("/catalog")}>
            Shop
          </button>
          <UserIconMenu me={me} setMe={setMe} />
        </div>
      </header>

      <div className="pdContainer">
        <div className="pdBreadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/catalog">Shop</Link>
          <span>/</span>
          <span>{article.categorieNom || "Product"}</span>
          <span>/</span>
          <strong>{article.nom}</strong>
        </div>

        <section className="pdHero">
          <div className="pdGallery">
            <div className="pdThumbs">
              {gallery.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  className={`pdThumb ${activeImage === img ? "active" : ""}`}
                  onClick={() => setActiveImage(img)}
                >
                  <img src={toAbs(img)} alt="" />
                </button>
              ))}
            </div>

            <div className="pdMainImageWrap">
              {activeImage || gallery[0] ? (
                <img
                  src={toAbs(activeImage || gallery[0])}
                  alt={article.nom}
                  className="pdMainImage"
                />
              ) : (
                <div className="pdEmptyImage">No image</div>
              )}

              {onSale && discount ? (
                <div className="pdSaleBadge">SALE -{discount}%</div>
              ) : null}
            </div>
          </div>

          <div className="pdSummary">
            <div className="brandTitle">EMIRIO</div>
            <h1>{article.nom}</h1>

            <div className="pdRatingLine">
              <span className="stars">{starsText(Math.round(avg || 0))}</span>
              <span>{avg ? avg.toFixed(1) : "0.0"}/5</span>
              <span>({reviews.length} reviews)</span>
            </div>

            <div className="pdPriceLine">
              <span className="pdPriceNow">{fmtPrice(getDisplayPrice(article))}</span>
              {onSale ? <span className="pdPriceOld">{fmtPrice(article.prix)}</span> : null}
              {onSale && discount ? <span className="pdDiscountChip">-{discount}%</span> : null}
            </div>

            {onSale ? (
              <div className="pdSaleInfo">
                <div className="pdSaleLine">
                  <span className="pdSaleLabel">Sale price</span>
                  <strong>{fmtPrice(article.salePrice)}</strong>
                </div>
                <div className="pdSaleLine">
                  <span className="pdSaleLabel">Ends in</span>
                  <strong>{formatCountdown(article.saleEndAt, nowTick)}</strong>
                </div>
              </div>
            ) : null}

            {!onSale && hasValidSaleFields(article) ? (
              <div className="pdInfo error" style={{ margin: "16px 0 0", width: "100%" }}>
                Sale exists but is not active now. Check sale dates and price.
              </div>
            ) : null}

            <p className="pdDesc">
              {article.description || "No description available for this product."}
            </p>

            <div className="pdDivider" />

            <div className="pdMetaGrid">
              <div>
                <span>Category</span>
                <strong>{article.categorieNom || "-"}</strong>
              </div>
              <div>
                <span>Brand</span>
                <strong>{article.marque || "-"}</strong>
              </div>
              <div>
                <span>Material</span>
                <strong>{article.matiere || "-"}</strong>
              </div>
              <div>
                <span>SKU</span>
                <strong>{article.sku || "-"}</strong>
              </div>
            </div>

            <div className="pdDivider" />

            <div className="pdLabel">Quantity</div>

            <div className="pdCartRow">
              <div className="qtyBox">
                <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))}>-</button>
                <strong>{qty}</strong>
                <button type="button" onClick={() => setQty((q) => q + 1)}>+</button>
              </div>

              <button type="button" className="addCartBtn" onClick={addToCart}>
                Add to Cart
              </button>
            </div>
          </div>
        </section>

        <section className="pdTabsBlock">
          <div className="pdTabs">
            <button type="button" className={tab === "details" ? "active" : ""} onClick={() => setTab("details")}>
              Product Details
            </button>
            <button type="button" className={tab === "reviews" ? "active" : ""} onClick={() => setTab("reviews")}>
              Rating & Reviews
            </button>
            <button type="button" className={tab === "shipping" ? "active" : ""} onClick={() => setTab("shipping")}>
              Info
            </button>
          </div>

          {tab === "details" && (
            <div className="pdLongInfo">
              <h3>Product details</h3>
              <p>{article.details || "No more details."}</p>
            </div>
          )}

          {tab === "shipping" && (
            <div className="pdLongInfo">
              <h3>Delivery information</h3>
              <p>Orders are prepared as quickly as possible. Delivery timing depends on your location and stock availability.</p>
            </div>
          )}

          {tab === "reviews" && (
            <div className="pdLongInfo" id="pd-reviews">
              <div className="pdReviewsHead">
                <h3>All Reviews ({reviews.length})</h3>
              </div>

              <form className="reviewForm" onSubmit={submitReview}>
                <div className="starsInput">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      type="button"
                      key={n}
                      className={rating >= n ? "starBtn active" : "starBtn"}
                      onClick={() => setRating(n)}
                    >
                      ★
                    </button>
                  ))}
                </div>

                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Write your review..."
                  rows="4"
                  required
                />

                <button type="submit" className="submitReviewBtn">
                  Write a Review
                </button>
              </form>

              <div className="pdReviewsGrid">
                {reviews.map((r) => (
                  <div key={r.id} className="pdReviewCard">
                    <div className="reviewStars">{starsText(Number(r.rating || 0))}</div>
                    <h4>{r.userFullName || "User"}</h4>
                    <div className="reviewDate">{r.createdAtText}</div>
                    <p>{r.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="pdRelated" id="pd-related">
          <h2>YOU MIGHT ALSO LIKE</h2>

          <div className="pdRelatedGrid">
            {related.map((p) => {
              const relatedSale = isSaleActive(p);
              const relatedDiscount = getDiscountPercent(p);
              const relatedImage = [p.imageUrl, p.imageUrl2, p.imageUrl3, p.imageUrl4].filter(Boolean)[0];

              return (
                <Link key={p.id} to={`/product/${p.id}`} className="pdProductCard">
                  <div className="pdProductImageWrap">
                    {relatedImage ? (
                      <img src={toAbs(relatedImage)} alt={p.nom} className="pdProductImage" />
                    ) : (
                      <div className="pdEmptySmall">No image</div>
                    )}
                    {relatedSale && relatedDiscount ? (
                      <div className="pdMiniSale">-{relatedDiscount}%</div>
                    ) : null}
                  </div>

                  <div className="pdProductName">{p.nom}</div>

                  <div className="pdProductPriceRow">
                    <strong>{fmtPrice(getDisplayPrice(p))}</strong>
                    {relatedSale ? <span className="pdOldInline">{fmtPrice(p.prix)}</span> : null}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
