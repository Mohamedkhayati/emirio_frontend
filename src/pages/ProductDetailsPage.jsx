import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import Footer from "../components/Footer";
import ProductModelViewer from "../components/ProductModelViewer";
import "../styles/home.css";
import "../styles/product-details.css";
import { useCart } from "../context/CartContext";

const toAbs = (path, version = "") => {
  if (!path) return "";
  if (path.startsWith("data:")) return path;
  if (path.startsWith("blob:")) return path;
  if (path.startsWith("http")) return path;
  const base = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080").replace(/\/+$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleanPath}${cleanPath.includes("?") ? "&" : "?"}v=${encodeURIComponent(version)}`;
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

function isLikelyModelUrl(value = "") {
  const v = String(value || "").toLowerCase();
  return (
    v.includes("/model3d") ||
    v.endsWith(".glb") ||
    v.endsWith(".gltf") ||
    v.endsWith(".obj") ||
    v.endsWith(".fbx") ||
    v.endsWith(".stl")
  );
}

function toSafeCartImagePath(value = "") {
  if (!value) return "";
  return isLikelyModelUrl(value) ? "" : value;
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

function pickModelUrl(obj) {
  return (
    obj?.model3dUrl ||
    obj?.model3DUrl ||
    obj?.modelUrl ||
    obj?.modele3dUrl ||
    obj?.modele3DUrl ||
    obj?.previewModel3dUrl ||
    obj?.previewModel3DUrl ||
    ""
  );
}

function normalizeImageItem(img) {
  if (!img) return "";

  if (typeof img === "string") return img;

  return (
    img?.imageUrl ||
    img?.url ||
    img?.path ||
    img?.src ||
    img?.downloadUrl ||
    img?.previewUrl ||
    img?.fileUrl ||
    ""
  );
}

function dedupeImages(list = []) {
  return [...new Set(list.filter((x) => Boolean(x) && !isLikelyModelUrl(x)))];
}

function pickImageList(obj) {
  if (!obj) return [];

  const arrayCandidates = [
    obj?.imageUrls,
    obj?.images,
    obj?.previewImages,
    obj?.gallery,
    obj?.photos,
    obj?.media,
  ];

  const fromArrays = arrayCandidates.flatMap((arr) =>
    Array.isArray(arr) ? arr.map(normalizeImageItem) : []
  );

  const normalizedArray = dedupeImages(fromArrays);

  if (normalizedArray.length > 0) {
    return normalizedArray;
  }

  const legacyFields = [
    obj?.imageUrl,
    obj?.imageUrl2,
    obj?.imageUrl3,
    obj?.imageUrl4,
    obj?.image1Url,
    obj?.image2Url,
    obj?.image3Url,
    obj?.image4Url,
    obj?.previewImage,
  ];

  return dedupeImages(legacyFields);
}

export default function ProductDetailsPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const { addToCart, cartItems } = useCart();

  const [article, setArticle] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [related, setRelated] = useState([]);
  const [activeImage, setActiveImage] = useState("");
  const [activeMediaType, setActiveMediaType] = useState("");
  const [resolvedModelSrc, setResolvedModelSrc] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("details");
  const [qty, setQty] = useState(1);
  const [error, setError] = useState("");
  const [selectedColorId, setSelectedColorId] = useState("");
  const [selectedSizeId, setSelectedSizeId] = useState("");
  const [cartMessage, setCartMessage] = useState("");
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [fullscreenType, setFullscreenType] = useState("");
  const [fullscreenSrc, setFullscreenSrc] = useState("");

  async function loadData() {
    setError("");

    const [detailRes, reviewsRes, listRes] = await Promise.allSettled([
      api.get(`/api/articles/${id}`),
      api.get(`/api/articles/${id}/reviews`),
      api.get("/api/articles"),
    ]);

    if (detailRes.status !== "fulfilled") {
      throw detailRes.reason;
    }

    const detailProduct = detailRes.value.data;

    const all =
      listRes.status === "fulfilled" && Array.isArray(listRes.value.data)
        ? listRes.value.data
        : [];

    setArticle(detailProduct);

    if (reviewsRes.status === "fulfilled") {
      setReviews(Array.isArray(reviewsRes.value.data) ? reviewsRes.value.data : []);
    } else {
      setReviews([]);
    }

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
    let mounted = true;

    async function run() {
      setLoading(true);
      try {
        if (mounted) {
          await loadData();
        }
      } catch (e) {
        if (mounted) {
          setError(e?.response?.data?.message || t("product.cannotLoad", "Cannot load product"));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    run();

    return () => {
      mounted = false;
    };
  }, [id, t]);

  const variations = useMemo(() => {
    const raw =
      article?.variations ??
      article?.variationArticles ??
      article?.variationDtos ??
      article?.variantes ??
      [];
    return Array.isArray(raw) ? raw : [];
  }, [article]);

  const colors = useMemo(() => {
    const map = new Map();

    variations.forEach((v) => {
      const colorId = getVariationColorId(v);
      if (!colorId) return;

      const variationImages = pickImageList(v);

      if (!map.has(colorId)) {
        map.set(colorId, {
          couleurId: colorId,
          couleurNom: getVariationColorName(v),
          couleurCodeHex: getVariationColorHex(v),
          totalStock: 0,
          previewImage: variationImages[0] || "",
          previewImages: variationImages,
          previewModel3dUrl: pickModelUrl(v),
        });
      }

      const row = map.get(colorId);
      row.totalStock += getVariationStock(v);

      if (!row.couleurNom) row.couleurNom = getVariationColorName(v);

      if (!row.couleurCodeHex || row.couleurCodeHex === "#ddd") {
        row.couleurCodeHex = getVariationColorHex(v);
      }

      if (!row.previewImage) row.previewImage = variationImages[0] || "";

      row.previewImages = dedupeImages([...(row.previewImages || []), ...variationImages]);

      if (!row.previewModel3dUrl) {
        row.previewModel3dUrl = pickModelUrl(v);
      }
    });

    if (Array.isArray(article?.colors)) {
      article.colors.forEach((c) => {
        const colorId = getColorId(c);
        if (!colorId) return;

        const colorImages = pickImageList(c);

        if (!map.has(colorId)) {
          map.set(colorId, {
            couleurId: colorId,
            couleurNom: getColorName(c),
            couleurCodeHex: getColorHex(c),
            totalStock: 0,
            previewImage: colorImages[0] || c?.previewImage || "",
            previewImages: colorImages,
            previewModel3dUrl: pickModelUrl(c),
          });
        } else {
          const row = map.get(colorId);

          if (!row.couleurNom) row.couleurNom = getColorName(c);

          if (!row.couleurCodeHex || row.couleurCodeHex === "#ddd") {
            row.couleurCodeHex = getColorHex(c);
          }

          if (!row.previewImage) {
            row.previewImage = colorImages[0] || c?.previewImage || "";
          }

          row.previewImages = dedupeImages([...(row.previewImages || []), ...colorImages]);

          if (!row.previewModel3dUrl) {
            row.previewModel3dUrl = pickModelUrl(c);
          }
        }
      });
    }

    return Array.from(map.values()).map((color) => {
      const reservedInCart = cartItems.reduce((sum, item) => {
        return String(item.couleurId ?? "") === String(color.couleurId)
          ? sum + Number(item.qty || 0)
          : sum;
      }, 0);

      return {
        ...color,
        remainingStock: Math.max(0, Number(color.totalStock || 0) - reservedInCart),
      };
    });
  }, [article, variations, cartItems]);

  useEffect(() => {
    if (!colors.length) {
      setSelectedColorId("");
      return;
    }

    const stillExists = colors.some((c) => String(c.couleurId) === String(selectedColorId));
    if (stillExists) return;

    const firstAvailableColor =
      colors.find((c) => Number(c.remainingStock || 0) > 0) || colors[0];

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

    const stillExists = sizeOptions.some(
      (v) => String(getVariationSizeId(v)) === String(selectedSizeId)
    );
    if (stillExists) return;

    const firstAvailable = sizeOptions.find((v) => getVariationStock(v) > 0) || sizeOptions[0];
    setSelectedSizeId(String(getVariationSizeId(firstAvailable)));
    setQty(1);
  }, [sizeOptions, selectedSizeId]);

  const selectedVariation = useMemo(() => {
    return sizeOptions.find((v) => String(getVariationSizeId(v)) === String(selectedSizeId)) || null;
  }, [sizeOptions, selectedSizeId]);

  const articleModelUrl = useMemo(() => {
    return pickModelUrl(article);
  }, [article]);

  const activeModelUrl = useMemo(() => {
    if (selectedVariation) {
      const exactVariationModel = pickModelUrl(selectedVariation);
      if (exactVariationModel) {
        return toAbs(exactVariationModel, `model-${selectedVariation.id}`);
      }
    }

    const colorLevel = colors.find((c) => String(c.couleurId) === String(selectedColorId));
    if (colorLevel?.previewModel3dUrl) {
      return toAbs(colorLevel.previewModel3dUrl, `color-model-${colorLevel.couleurId}`);
    }

    if (articleModelUrl) {
      return toAbs(articleModelUrl, `article-model-${article?.id || id}`);
    }

    return "";
  }, [selectedVariation, colors, selectedColorId, articleModelUrl, article?.id, id]);

  useEffect(() => {
    let cancelled = false;
    let objectUrl = "";

    async function loadProtectedModel() {
      if (!activeModelUrl) {
        setResolvedModelSrc("");
        return;
      }

      try {
        const base = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080").replace(/\/+$/, "");
        let requestUrl = activeModelUrl;

        if (activeModelUrl.startsWith(base)) {
          requestUrl = activeModelUrl.slice(base.length);
        }

        if (!requestUrl.startsWith("http") && !requestUrl.startsWith("/")) {
          requestUrl = `/${requestUrl}`;
        }

        const res = await api.get(requestUrl, {
          responseType: "blob",
        });

        objectUrl = URL.createObjectURL(res.data);

        if (!cancelled) {
          setResolvedModelSrc(objectUrl);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Authenticated model fetch failed:", err);
          setResolvedModelSrc("");
        }
      }
    }

    loadProtectedModel();

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [activeModelUrl]);

  const imageVersion = useMemo(() => {
    if (selectedVariation?.id) return `var-${selectedVariation.id}`;
    if (article?.id) return `article-${article.id}`;
    return `route-${id}`;
  }, [selectedVariation, article, id]);

  const gallery = useMemo(() => {
    if (selectedVariation) {
      const exactImages = pickImageList(selectedVariation);
      if (exactImages.length > 0) return exactImages;
    }

    const colorLevel = colors.find((c) => String(c.couleurId) === String(selectedColorId));
    if (colorLevel?.previewImages?.length) {
      return colorLevel.previewImages;
    }
    if (colorLevel?.previewImage) {
      return [colorLevel.previewImage];
    }

    const articleImages = pickImageList(article);
    if (articleImages.length > 0) return articleImages;

    return [];
  }, [selectedVariation, article, colors, selectedColorId]);

  useEffect(() => {
    if (!gallery.length) {
      setActiveImage("");
      return;
    }

    if (!gallery.includes(activeImage)) {
      setActiveImage(gallery[0]);
    }
  }, [gallery, activeImage]);

  useEffect(() => {
    setQty(1);
  }, [selectedVariation?.id]);

  useEffect(() => {
    if (gallery.length) {
      setActiveMediaType("image");
    } else if (resolvedModelSrc) {
      setActiveMediaType("model");
    } else {
      setActiveMediaType("");
    }
  }, [resolvedModelSrc, selectedVariation?.id, selectedColorId, gallery.length]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setFullscreenOpen(false);
      }
    };

    if (fullscreenOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", onKeyDown);
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [fullscreenOpen]);

  const avg = useMemo(() => {
    if (!reviews.length) return 0;
    return reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / reviews.length;
  }, [reviews]);

  function openImageFullscreen() {
    if (!activeImage) return;
    setFullscreenType("image");
    setFullscreenSrc(toAbs(activeImage, `fs-${imageVersion}`));
    setFullscreenOpen(true);
  }

  function openModelFullscreen() {
    if (!resolvedModelSrc) return;
    setFullscreenType("model");
    setFullscreenSrc(resolvedModelSrc);
    setFullscreenOpen(true);
  }

  function closeFullscreen() {
    setFullscreenOpen(false);
    setFullscreenType("");
    setFullscreenSrc("");
  }

  async function submitReview(e) {
    e.preventDefault();

    try {
      await api.post(`/api/articles/${id}/reviews`, {
        rating,
        comment: reviewText,
      });

      setReviewText("");
      setRating(5);
      await loadData();
      setTab("reviews");
    } catch (e2) {
      console.error(e2);
      alert(e2?.response?.data?.message || "Cannot submit review right now");
    }
  }

  const onSale = isSaleActive(article);
  const currentPrice = onSale
    ? Number(article?.salePrice)
    : Number(selectedVariation ? getVariationPrice(selectedVariation, article) : article?.prix);

  const rawStock = selectedVariation ? getVariationStock(selectedVariation) : 0;

  const qtyAlreadyInCart = selectedVariation
    ? cartItems.reduce((sum, item) => {
        return Number(item.variationId) === Number(selectedVariation.id)
          ? sum + Number(item.qty || 0)
          : sum;
      }, 0)
    : 0;

  const remainingStock = Math.max(0, rawStock - qtyAlreadyInCart);

  function handleAddToCart() {
    if (!article || !selectedVariation) return;

    if (remainingStock <= 0) {
      alert(t("product.soldOut", "Sold out"));
      return;
    }

    const limitedQty = Math.min(qty, remainingStock);
    const safeCartImage = toSafeCartImagePath(gallery[0] || "");

    addToCart(
      {
        articleId: Number(article.id),
        id: Number(article.id),
        variationId: Number(selectedVariation.id),
        nom: article.nom,
        prix: isSaleActive(article)
          ? Number(article.salePrice)
          : getVariationPrice(selectedVariation, article),
        imageUrl: safeCartImage,
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

  return (
    <div className="pdPage">
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
              {resolvedModelSrc ? (
                <button
                  type="button"
                  className={`pdThumb pdThumb3d ${activeMediaType === "model" ? "active" : ""}`}
                  onClick={() => setActiveMediaType("model")}
                  title="Show 3D model"
                >
                  <span className="pdThumb3dBadge">3D</span>
                </button>
              ) : null}

              {gallery.map((img, i) => (
                <button
                  key={`${img}-${i}`}
                  type="button"
                  className={`pdThumb ${activeMediaType === "image" && activeImage === img ? "active" : ""}`}
                  onClick={() => {
                    setActiveImage(img);
                    setActiveMediaType("image");
                  }}
                >
                  <img src={toAbs(img, `${imageVersion}-${i}`)} alt={`${article.nom} ${i + 1}`} />
                </button>
              ))}
            </div>

            <div className="pdMainImageWrap">
              {activeMediaType === "model" && resolvedModelSrc ? (
                <>
                  <button
                    type="button"
                    className="pdFullscreenBtn"
                    onClick={openModelFullscreen}
                  >
                    Full screen
                  </button>

                  <div className="pdMediaClickLayer">
                    <ProductModelViewer src={resolvedModelSrc} alt={article.nom} />
                  </div>
                </>
              ) : activeImage ? (
                <>
                  <button
                    type="button"
                    className="pdFullscreenBtn"
                    onClick={openImageFullscreen}
                  >
                    Full screen
                  </button>

                  <img
                    src={toAbs(activeImage, `main-${imageVersion}`)}
                    alt={article.nom}
                    className="pdMainImage clickable"
                    onClick={openImageFullscreen}
                  />
                </>
              ) : resolvedModelSrc ? (
                <>
                  <button
                    type="button"
                    className="pdFullscreenBtn"
                    onClick={openModelFullscreen}
                  >
                    Full screen
                  </button>

                  <div className="pdMediaClickLayer">
                    <ProductModelViewer src={resolvedModelSrc} alt={article.nom} />
                  </div>
                </>
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
                const soldOut = Number(c.remainingStock || 0) <= 0;

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
                      {soldOut ? "Sold out" : `${c.remainingStock} in stock`}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="pdLabel" style={{ marginTop: 18 }}>
              {t("product.size", "Size")}
            </div>

            <div className="pdSizeRow">
              {sizeOptions.map((v) => {
                const sizeId = getVariationSizeId(v);
                const active = String(sizeId) === String(selectedSizeId);
                const stockForThisSize = getVariationStock(v);
                const reservedForThisSize = cartItems.reduce((sum, item) => {
                  return Number(item.variationId) === Number(v.id)
                    ? sum + Number(item.qty || 0)
                    : sum;
                }, 0);
                const remainingForThisSize = Math.max(0, stockForThisSize - reservedForThisSize);
                const soldOut = remainingForThisSize <= 0;

                return (
                  <button
                    key={v.id}
                    type="button"
                    className={`pdSizeBtn ${active ? "active" : ""} ${soldOut ? "sold" : ""}`}
                    onClick={() => setSelectedSizeId(String(sizeId))}
                  >
                    <span>{getVariationSizeLabel(v)}</span>
                    <small>{soldOut ? "Sold out" : `${remainingForThisSize} left`}</small>
                  </button>
                );
              })}
            </div>

            <div className={`pdStockNotice ${remainingStock > 0 ? "ok" : "bad"}`}>
              {selectedVariation
                ? remainingStock > 0
                  ? `Selected: ${getVariationColorName(selectedVariation)} / ${getVariationSizeLabel(selectedVariation)} · ${remainingStock} left (${qtyAlreadyInCart} in cart)`
                  : `Selected: ${getVariationColorName(selectedVariation)} / ${getVariationSizeLabel(selectedVariation)} · Sold out`
                : "Select color and size"}
            </div>

            <div className="pdDivider" />

            <div className="pdLabel">{t("product.quantity", "Quantity")}</div>

            <div className="pdCartRow">
              <div className="qtyBox">
                <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                  -
                </button>
                <strong>{qty}</strong>
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.min(q + 1, Math.max(1, remainingStock)))}
                  disabled={remainingStock <= qty}
                >
                  +
                </button>
              </div>

              <button
                type="button"
                className="addCartBtn"
                onClick={handleAddToCart}
                disabled={!selectedVariation || remainingStock <= 0}
              >
                {!selectedVariation
                  ? "Select size"
                  : remainingStock > 0
                  ? t("product.addToCart", "Add to Cart")
                  : t("product.soldOut", "Sold out")}
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
                <h3>
                  {t("product.allReviews", "All Reviews")} ({reviews.length})
                </h3>
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
              const relatedImage = pickImageList(p)[0] || "";

              return (
                <Link key={p.id} to={`/product/${p.id}`} className="pdProductCard">
                  <div className="pdProductImageWrap">
                    {relatedImage ? (
                      <img
                        src={toAbs(relatedImage, `related-${p.id}`)}
                        alt={p.nom}
                        className="pdProductImage"
                      />
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

      {fullscreenOpen ? (
        <div className="pdFullscreenOverlay" onClick={closeFullscreen}>
          <button
            type="button"
            className="pdFullscreenClose"
            onClick={closeFullscreen}
          >
            ✕
          </button>

          <div
            className="pdFullscreenContent"
            onClick={(e) => e.stopPropagation()}
          >
            {fullscreenType === "model" ? (
              <ProductModelViewer src={fullscreenSrc} alt={`${article.nom} full screen 3D`} />
            ) : (
              <img
                src={fullscreenSrc}
                alt={article.nom}
                className="pdFullscreenImage"
              />
            )}
          </div>
        </div>
      ) : null}

      <Footer />
    </div>
  );
}