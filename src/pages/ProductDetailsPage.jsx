import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import "../styles/home.css";
import "../styles/product-details.css";
import UserIconMenu from "../components/UserIconMenu";
import LanguageMenu from "../components/LanguageMenu";
import { useCart } from "../context/CartContext";

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
  return p && p.salePrice !== null && p.salePrice !== undefined && p.salePrice !== "";
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

function normalizeId(v) {
  if (v === null || v === undefined || v === "") return "";
  return String(v);
}

function getColorId(obj) {
  return normalizeId(obj?.couleurId ?? obj?.colorId ?? obj?.id);
}

function getColorName(obj) {
  return obj?.couleurNom ?? obj?.colorName ?? obj?.nom ?? "";
}

function getColorHex(obj) {
  return obj?.couleurCodeHex ?? obj?.colorCodeHex ?? obj?.codeHex ?? obj?.codehex ?? "#ddd";
}

function getSizeId(obj) {
  return normalizeId(obj?.tailleId ?? obj?.sizeId ?? obj?.id);
}

function getVariationColorId(v) {
  return normalizeId(v?.couleurId ?? v?.colorId ?? v?.couleur?.id ?? v?.color?.id);
}

function getVariationColorName(v) {
  return v?.couleurNom ?? v?.colorName ?? v?.couleur?.nom ?? v?.color?.nom ?? "";
}

function getVariationColorHex(v) {
  return v?.couleurCodeHex ?? v?.colorCodeHex ?? v?.couleur?.codeHex ?? v?.couleur?.codehex ?? "#ddd";
}

function getVariationSizeId(v) {
  return normalizeId(v?.tailleId ?? v?.sizeId ?? v?.taille?.id ?? v?.size?.id);
}

function getVariationSizeLabel(v) {
  return v?.taillePointure ?? v?.pointure ?? v?.taille?.pointure ?? v?.size?.pointure ?? "";
}

function getVariationStock(v) {
  return Number(v?.quantiteStock ?? v?.stock ?? 0);
}

function getVariationPrice(v, article) {
  const val = v?.prix ?? article?.prix;
  return Number(val || 0);
}

function getVariationImages(v, article) {
  const variationImages = [v?.imageUrl, v?.imageUrl2, v?.imageUrl3, v?.imageUrl4].filter(Boolean);
  if (variationImages.length) return variationImages;
  return [article?.imageUrl, article?.imageUrl2, article?.imageUrl3, article?.imageUrl4].filter(Boolean);
}

export default function ProductDetailsPage({ me, setMe }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { addToCart, cartItems } = useCart();

  const [article, setArticle] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [related, setRelated] = useState([]);
  const [activeImage, setActiveImage] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("details");
  const [qty, setQty] = useState(1);
  const [error, setError] = useState("");
  const [selectedColorId, setSelectedColorId] = useState("");
  const [selectedSizeId, setSelectedSizeId] = useState("");
  const [cartMessage, setCartMessage] = useState("");

  const cartCount = useMemo(() => {
    return (cartItems || []).reduce((sum, item) => sum + Number(item.qty || 0), 0);
  }, [cartItems]);

  async function loadData() {
    setError("");

    const [detailRes, reviewsRes, listRes] = await Promise.all([
      api.get(`/api/articles/${id}`),
      api.get(`/api/articles/${id}/reviews`),
      api.get("/api/articles"),
    ]);

    const detailProduct = detailRes.data;
    const all = Array.isArray(listRes.data) ? listRes.data : [];

    setArticle(detailProduct);
    setReviews(Array.isArray(reviewsRes.data) ? reviewsRes.data : []);

    const rel = all
      .filter((a) => a.actif !== false)
      .filter((a) => Number(a.id) !== Number(id))
      .filter((a) =>
        detailProduct?.categorieId
          ? Number(a.categorieId) === Number(detailProduct.categorieId)
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
        setError(e?.response?.data?.message || t("product.cannotLoad", "Cannot load product"));
      })
      .finally(() => setLoading(false));
  }, [id, t]);

  const variations = useMemo(() => {
    return Array.isArray(article?.variations) ? article.variations : [];
  }, [article]);

  const colors = useMemo(() => {
    const map = new Map();

    variations.forEach((v) => {
      const colorId = getVariationColorId(v);
      if (!colorId) return;

      if (!map.has(colorId)) {
        map.set(colorId, {
          couleurId: colorId,
          couleurNom: getVariationColorName(v),
          couleurCodeHex: getVariationColorHex(v),
          totalStock: 0,
          previewImage: v?.imageUrl || "",
        });
      }

      const row = map.get(colorId);
      row.totalStock += getVariationStock(v);

      if (!row.couleurNom) row.couleurNom = getVariationColorName(v);
      if (!row.couleurCodeHex || row.couleurCodeHex === "#ddd") {
        row.couleurCodeHex = getVariationColorHex(v);
      }
      if (!row.previewImage && v?.imageUrl) row.previewImage = v.imageUrl;
    });

    if (Array.isArray(article?.colors)) {
      article.colors.forEach((c) => {
        const colorId = getColorId(c);
        if (!colorId) return;

        if (!map.has(colorId)) {
          map.set(colorId, {
            couleurId: colorId,
            couleurNom: getColorName(c),
            couleurCodeHex: getColorHex(c),
            totalStock: 0,
            previewImage: "",
          });
        } else {
          const row = map.get(colorId);
          if (!row.couleurNom) row.couleurNom = getColorName(c);
          if (!row.couleurCodeHex || row.couleurCodeHex === "#ddd") {
            row.couleurCodeHex = getColorHex(c);
          }
        }
      });
    }

    return Array.from(map.values());
  }, [article, variations]);

  useEffect(() => {
    if (!colors.length) {
      setSelectedColorId("");
      return;
    }

    const stillExists = colors.some((c) => String(c.couleurId) === String(selectedColorId));
    if (stillExists) return;

    const firstAvailableColor = colors.find((c) => Number(c.totalStock || 0) > 0) || colors[0];
    setSelectedColorId(String(firstAvailableColor.couleurId));
  }, [colors, selectedColorId]);

  const sizeOptions = useMemo(() => {
    return variations
      .filter((v) => String(getVariationColorId(v)) === String(selectedColorId))
      .sort((a, b) =>
        String(getVariationSizeLabel(a)).localeCompare(String(getVariationSizeLabel(b)), undefined, {
          numeric: true,
        })
      );
  }, [variations, selectedColorId]);

  useEffect(() => {
    if (!sizeOptions.length) {
      setSelectedSizeId("");
      setQty(1);
      return;
    }

    const stillExists = sizeOptions.some((v) => String(getVariationSizeId(v)) === String(selectedSizeId));
    if (stillExists) return;

    const firstAvailable = sizeOptions.find((v) => getVariationStock(v) > 0) || sizeOptions[0];
    setSelectedSizeId(String(getVariationSizeId(firstAvailable)));
    setQty(1);
  }, [sizeOptions, selectedSizeId]);

  const selectedVariation = useMemo(() => {
    return sizeOptions.find((v) => String(getVariationSizeId(v)) === String(selectedSizeId)) || null;
  }, [sizeOptions, selectedSizeId]);

  const gallery = useMemo(() => {
    if (selectedVariation) return getVariationImages(selectedVariation, article);

    const colorPreviewVariation = variations.find(
      (v) => String(getVariationColorId(v)) === String(selectedColorId)
    );

    return getVariationImages(colorPreviewVariation, article);
  }, [selectedVariation, article, variations, selectedColorId]);

  useEffect(() => {
    setActiveImage(gallery[0] || "");
  }, [gallery]);

  const avg = useMemo(() => {
    if (!reviews.length) return 0;
    return reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / reviews.length;
  }, [reviews]);

  async function submitReview(e) {
    e.preventDefault();

    if (!me) {
      alert(t("auth.loginFirst", "Login first"));
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

  function handleAddToCart() {
    if (!article || !selectedVariation) return;

    if (getVariationStock(selectedVariation) <= 0) {
      alert(t("product.soldOut", "Sold out"));
      return;
    }

    const limitedQty = Math.min(qty, Math.max(1, getVariationStock(selectedVariation)));

    addToCart(
      {
        articleId: Number(article.id),
        id: Number(article.id),
        variationId: Number(selectedVariation.id),
        nom: article.nom,
        prix: isSaleActive(article)
          ? Number(article.salePrice)
          : getVariationPrice(selectedVariation, article),
        imageUrl: gallery[0] || "",
        couleurId: getVariationColorId(selectedVariation),
        couleurNom: getVariationColorName(selectedVariation),
        tailleId: getVariationSizeId(selectedVariation),
        taillePointure: getVariationSizeLabel(selectedVariation),
      },
      limitedQty
    );

    setCartMessage(t("product.addedToCart", "Added to cart"));
    setQty(1);

    setTimeout(() => {
      setCartMessage("");
    }, 2000);
  }

  if (loading) return <div className="pdInfo">{t("common.loading", "Loading...")}</div>;
  if (error) return <div className="pdInfo error">{error}</div>;
  if (!article) return <div className="pdInfo error">{t("product.notFound", "Product not found.")}</div>;

  const onSale = isSaleActive(article);
  const currentPrice = onSale
    ? Number(article.salePrice)
    : Number(selectedVariation ? getVariationPrice(selectedVariation, article) : article.prix);

  const currentStock = selectedVariation ? getVariationStock(selectedVariation) : 0;

  return (
    <div className="pdPage">
      <header className="storeHeader pdNav">
        <Link to="/" className="logo">EMIRIO</Link>

        <nav className="mainNav">
          <Link to="/">{t("nav.home", "Home")}</Link>
          <Link to="/catalog">{t("nav.catalog", "Catalog")}</Link>
          <Link to="/cart">{t("nav.cart", "Cart")}</Link>
          <a href="#pd-reviews">{t("product.reviews", "Reviews")}</a>
          <a href="#pd-related">{t("product.related", "Related")}</a>
        </nav>

        <div className="headerActions">
          <button type="button" className="cartHeaderBtn" onClick={() => navigate("/cart")}>
            <span>🛒</span>
            <span>{t("nav.cart", "Cart")}</span>
            {cartCount > 0 ? <span className="cartBadge">{cartCount}</span> : null}
          </button>

          <button type="button" className="viewAllBtn" onClick={() => navigate("/catalog")}>
            {t("product.shop", "Shop")}
          </button>

          <LanguageMenu />
          <UserIconMenu me={me} setMe={setMe} />
        </div>
      </header>

      <div className="pdContainer">
        <div className="pdBreadcrumb">
          <Link to="/">{t("nav.home", "Home")}</Link>
          <span>/</span>
          <Link to="/catalog">{t("product.shop", "Shop")}</Link>
          <span>/</span>
          <span>{article.categorieNom || t("product.product", "Product")}</span>
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
              {activeImage ? (
                <img src={toAbs(activeImage)} alt={article.nom} className="pdMainImage" />
              ) : (
                <div className="pdEmptyImage">{t("common.noImage", "No image")}</div>
              )}
            </div>
          </div>

          <div className="pdSummary">
            <div className="brandTitle">EMIRIO</div>
            <h1>{article.nom}</h1>

            <div className="pdRatingLine">
              <span className="stars">{starsText(Math.round(avg || 0))}</span>
              <span>{avg ? avg.toFixed(1) : "0.0"}/5</span>
              <span>({reviews.length} {t("product.reviewsLower", "reviews")})</span>
            </div>

            <div className="pdPriceLine">
              <span className="pdPriceNow">{fmtPrice(currentPrice)}</span>
              {onSale ? (
                <span className="pdPriceOld">
                  {fmtPrice(selectedVariation ? getVariationPrice(selectedVariation, article) : article.prix)}
                </span>
              ) : null}
            </div>

            <p className="pdDesc">
              {article.description || t("product.noDescription", "No description available for this product.")}
            </p>

            <div className="pdDivider" />

            <div className="pdMetaGrid">
              <div>
                <span>{t("catalog.category", "Category")}</span>
                <strong>{article.categorieNom || "-"}</strong>
              </div>
              <div>
                <span>{t("catalog.brand", "Brand")}</span>
                <strong>{article.marque || "-"}</strong>
              </div>
              <div>
                <span>{t("catalog.material", "Material")}</span>
                <strong>{article.matiere || "-"}</strong>
              </div>
              <div>
                <span>{t("catalog.sku", "SKU")}</span>
                <strong>{article.sku || "-"}</strong>
              </div>
            </div>

            <div className="pdDivider" />

            <div className="pdLabel">{t("product.color", "Color")}</div>
            <div className="pdColorRow">
              {colors.map((c) => {
                const active = String(c.couleurId) === String(selectedColorId);
                const soldOut = Number(c.totalStock || 0) <= 0;

                return (
                  <button
                    key={c.couleurId}
                    type="button"
                    className={`pdColorCard ${active ? "active" : ""} ${soldOut ? "sold" : ""}`}
                    onClick={() => setSelectedColorId(String(c.couleurId))}
                  >
                    <span className="pdColorSwatch" style={{ background: c.couleurCodeHex || "#ddd" }} />
                    <span className="pdColorName">{c.couleurNom || "-"}</span>
                    <span className="pdColorStock">
                      {soldOut ? "Sold out" : `${c.totalStock} in stock`}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="pdLabel" style={{ marginTop: 18 }}>{t("product.size", "Size")}</div>
            <div className="pdSizeRow">
              {sizeOptions.map((v) => {
                const sizeId = getVariationSizeId(v);
                const active = String(sizeId) === String(selectedSizeId);
                const soldOut = getVariationStock(v) <= 0;

                return (
                  <button
                    key={v.id}
                    type="button"
                    className={`pdSizeBtn ${active ? "active" : ""} ${soldOut ? "sold" : ""}`}
                    onClick={() => setSelectedSizeId(String(sizeId))}
                  >
                    <span>{getVariationSizeLabel(v)}</span>
                    <small>{soldOut ? "Sold out" : `${getVariationStock(v)} left`}</small>
                  </button>
                );
              })}
            </div>

            <div className={`pdStockNotice ${currentStock > 0 ? "ok" : "bad"}`}>
              {selectedVariation
                ? currentStock > 0
                  ? `Selected: ${getVariationColorName(selectedVariation)} / ${getVariationSizeLabel(selectedVariation)} · ${currentStock} in stock`
                  : `Selected: ${getVariationColorName(selectedVariation)} / ${getVariationSizeLabel(selectedVariation)} · Sold out`
                : "Select color and size"}
            </div>

            <div className="pdDivider" />

            <div className="pdLabel">{t("product.quantity", "Quantity")}</div>

            <div className="pdCartRow">
              <div className="qtyBox">
                <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))}>-</button>
                <strong>{qty}</strong>
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.min(q + 1, Math.max(1, currentStock)))}
                  disabled={currentStock <= qty}
                >
                  +
                </button>
              </div>

              <button
                type="button"
                className="addCartBtn"
                onClick={handleAddToCart}
                disabled={!selectedVariation || currentStock <= 0}
              >
                {currentStock > 0 ? t("product.addToCart", "Add to Cart") : t("product.soldOut", "Sold out")}
              </button>
            </div>

            {cartMessage ? <div className="cartSuccessMsg">{cartMessage}</div> : null}
          </div>
        </section>

        <section className="pdTabsBlock">
          <div className="pdTabs">
            <button type="button" className={tab === "details" ? "active" : ""} onClick={() => setTab("details")}>
              {t("product.productDetails", "Product Details")}
            </button>
            <button type="button" className={tab === "reviews" ? "active" : ""} onClick={() => setTab("reviews")}>
              {t("product.ratingReviews", "Rating & Reviews")}
            </button>
            <button type="button" className={tab === "shipping" ? "active" : ""} onClick={() => setTab("shipping")}>
              {t("product.info", "Info")}
            </button>
          </div>

          {tab === "details" && (
            <div className="pdLongInfo">
              <h3>{t("product.productDetailsLower", "Product details")}</h3>
              <p>{article.details || t("product.noMoreDetails", "No more details.")}</p>
            </div>
          )}

          {tab === "shipping" && (
            <div className="pdLongInfo">
              <h3>{t("product.deliveryInfo", "Delivery information")}</h3>
              <p>
                {t(
                  "product.deliveryText",
                  "Orders are prepared as quickly as possible. Delivery timing depends on your location and stock availability."
                )}
              </p>
            </div>
          )}

          {tab === "reviews" && (
            <div className="pdLongInfo" id="pd-reviews">
              <div className="pdReviewsHead">
                <h3>{t("product.allReviews", "All Reviews")} ({reviews.length})</h3>
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
                  placeholder={t("product.writeReviewPlaceholder", "Write your review...")}
                  rows="4"
                  required
                />

                <button type="submit" className="submitReviewBtn">
                  {t("product.writeReview", "Write a Review")}
                </button>
              </form>

              <div className="pdReviewsGrid">
                {reviews.map((r) => (
                  <div key={r.id} className="pdReviewCard">
                    <div className="reviewStars">{starsText(Number(r.rating || 0))}</div>
                    <h4>{r.userFullName || t("product.user", "User")}</h4>
                    <div className="reviewDate">{r.createdAtText}</div>
                    <p>{r.comment}</p>
                  </div>
                ))}

                {!reviews.length ? (
                  <div className="pdInfo">{t("product.noReviews", "No reviews yet.")}</div>
                ) : null}
              </div>
            </div>
          )}
        </section>

        <section className="pdRelated" id="pd-related">
          <h2>{t("product.youMightAlsoLike", "YOU MIGHT ALSO LIKE")}</h2>

          <div className="pdRelatedGrid">
            {related.map((p) => {
              const relatedImage = [p.imageUrl, p.imageUrl2, p.imageUrl3, p.imageUrl4].filter(Boolean)[0];

              return (
                <Link key={p.id} to={`/product/${p.id}`} className="pdProductCard">
                  <div className="pdProductImageWrap">
                    {relatedImage ? (
                      <img src={toAbs(relatedImage)} alt={p.nom} className="pdProductImage" />
                    ) : (
                      <div className="pdEmptySmall">{t("common.noImage", "No image")}</div>
                    )}
                  </div>

                  <div className="pdProductName">{p.nom}</div>
                  <div className="pdProductPriceRow">
                    <strong>{fmtPrice(p.salePrice && isSaleActive(p) ? p.salePrice : p.prix)}</strong>
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