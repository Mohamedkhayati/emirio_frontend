import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import "../styles/cart-checkout.css";
import { useCart } from "../context/CartContext";

const PAYMENT_METHODS = [
  { value: "CARTE", label: "Carte bancaire" },
  { value: "LIVRAISON", label: "Paiement à la livraison" },
  { value: "D17", label: "Tunisia Poste D17" },
  { value: "VIREMENT", label: "Virement bancaire" },
];

const toAbs = (path) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
  return `${base}${path}`;
};

const fmtPrice = (v) => `${Number(v || 0).toFixed(3)} TND`;

export default function CartCheckoutPage({ me }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { cartItems, updateCartItemQty, removeFromCart, clearCart } = useCart();

  const canvasRef = useRef(null);
  const drawingRef = useRef(false);

  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [successOrder, setSuccessOrder] = useState(null);

  const [form, setForm] = useState({
    nom: me?.nom || "",
    prenom: me?.prenom || "",
    telephone: "",
    adresse: "",
    ville: "",
    codePostal: "",
    modePaiement: "D17",
    cardName: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
    d17Phone: "",
    d17Reference: "",
    bankReference: "",
    note: "",
    signatureDataUrl: "",
    acceptTerms: false,
  });

  const items = useMemo(() => cartItems || [], [cartItems]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      nom: me?.nom || prev.nom,
      prenom: me?.prenom || prev.prenom,
    }));
  }, [me]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(320, Math.floor(rect.width * ratio));
    canvas.height = Math.floor(180 * ratio);

    const ctx = canvas.getContext("2d");
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111827";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width || 320, 180);
  }, []);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.prix || 0) * Number(item.qty || 0), 0),
    [items]
  );

  const shipping = useMemo(() => (items.length ? 4.0 : 0), [items]);
  const total = useMemo(() => subtotal + shipping, [subtotal, shipping]);
  const cartCount = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.qty || 0), 0),
    [items]
  );

  function onChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function getCanvasPoint(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    if ("touches" in e && e.touches.length) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }

    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  function startDraw(e) {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const point = getCanvasPoint(e);
    drawingRef.current = true;
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  }

  function draw(e) {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const point = getCanvasPoint(e);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();

    setForm((prev) => ({
      ...prev,
      signatureDataUrl: canvas.toDataURL("image/png"),
    }));
  }

  function stopDraw() {
    drawingRef.current = false;
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width || 320, 180);
    setForm((prev) => ({ ...prev, signatureDataUrl: "" }));
  }

  function validate() {
    if (!items.length) return "Your cart is empty";
    if (!me) return "Please login first";
    if (!form.nom || !form.prenom || !form.telephone || !form.adresse || !form.ville) {
      return "Please fill all delivery fields";
    }
    if (!form.signatureDataUrl) return "Online signature is required";
    if (!form.acceptTerms) return "You must accept the invoice and order conditions";

    if (
      form.modePaiement === "CARTE" &&
      (!form.cardName || !form.cardNumber || !form.expiry || !form.cvv)
    ) {
      return "Please fill all card fields";
    }

    if (form.modePaiement === "D17" && !form.d17Phone) {
      return "D17 phone is required";
    }

    if (form.modePaiement === "VIREMENT" && !form.bankReference) {
      return "Bank reference is required";
    }

    return "";
  }

  async function handleCheckout(e) {
    e.preventDefault();
    setServerError("");
    setSuccessOrder(null);

    const error = validate();
    if (error) {
      setServerError(error);
      return;
    }

    try {
      setSubmitting(true);

      await api.put("/api/cart/sync", {
        items: items.map((item) => ({
          articleId: Number(item.articleId),
          variationId: Number(item.variationId),
          nomProduit: item.nom,
          imageUrl: item.imageUrl || "",
          couleurNom: item.couleurNom || "",
          taillePointure: item.taillePointure || "",
          quantite: Number(item.qty || 1),
          prixUnitaire: Number(item.prix || 0),
        })),
      });

      const checkoutPayload = {
        nom: form.nom,
        prenom: form.prenom,
        telephone: form.telephone,
        adresse: form.adresse,
        ville: form.ville,
        codePostal: form.codePostal,
        modePaiement: form.modePaiement,
        cardLast4:
          form.modePaiement === "CARTE"
            ? form.cardNumber.replace(/\s/g, "").slice(-4)
            : "",
        d17Phone: form.modePaiement === "D17" ? form.d17Phone : "",
        d17Reference: form.modePaiement === "D17" ? form.d17Reference : "",
        bankReference: form.modePaiement === "VIREMENT" ? form.bankReference : "",
        note: form.note,
        signatureDataUrl: form.signatureDataUrl,
        acceptTerms: form.acceptTerms,
      };

      const { data } = await api.post("/api/orders/checkout", checkoutPayload);

      clearCart();
      setSuccessOrder(data);
      navigate("/orders", { state: { createdOrder: data } });
    } catch (e2) {
      setServerError(e2?.response?.data?.message || "Checkout failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="checkoutPage">
      <div className="checkoutWrap">
        <section className="cartPanel">
          <div className="checkoutTopRow">
            <button type="button" className="continueBtn" onClick={() => navigate("/catalog")}>
              ← {t("cart.shoppingContinue", "Shopping Continue")}
            </button>

            {!!items.length && (
              <button type="button" className="clearBtn" onClick={clearCart}>
                {t("cart.clearCart", "Clear cart")}
              </button>
            )}
          </div>

          <div className="cartHead">
            <h2>{t("cart.shoppingCart", "Shopping cart")}</h2>
            <p>
              {t("cart.youHave", "You have")} {cartCount}{" "}
              {cartCount === 1 ? t("cart.item", "item") : t("cart.items", "items")}{" "}
              {t("cart.inYourCart", "in your cart")}
            </p>
          </div>

          {serverError ? <div className="homeInfo error">{serverError}</div> : null}

          {!items.length ? (
            <div className="emptyCartBox">
              <h3>{t("cart.empty", "Your cart is empty")}</h3>
              <p>{t("cart.emptyText", "Add products from the catalog to see them here.")}</p>
              <button type="button" className="shopNowBtn" onClick={() => navigate("/catalog")}>
                {t("home.shopNow", "Shop Now")}
              </button>
            </div>
          ) : (
            <div className="cartList">
              {items.map((item) => (
                <article className="cartItem" key={`${item.articleId}-${item.variationId}`}>
                  <div className="cartItemLeft">
                    <div className="cartThumb">
                      {item.imageUrl ? (
                        <img src={toAbs(item.imageUrl)} alt={item.nom} />
                      ) : (
                        <div className="cartNoImage">{t("common.noImage", "No image")}</div>
                      )}
                    </div>

                    <div className="cartMeta">
                      <h3>{item.nom}</h3>
                      <p>
                        {[item.couleurNom, item.taillePointure].filter(Boolean).join(" • ") ||
                          "Product option"}
                      </p>
                    </div>
                  </div>

                  <div className="cartItemRight">
                    <div className="qtyControl">
                      <button
                        type="button"
                        onClick={() => updateCartItemQty(item.variationId, Number(item.qty || 1) - 1)}
                      >
                        −
                      </button>
                      <span>{item.qty}</span>
                      <button
                        type="button"
                        onClick={() => updateCartItemQty(item.variationId, Number(item.qty || 1) + 1)}
                      >
                        +
                      </button>
                    </div>

                    <div className="linePrice">
                      {fmtPrice(Number(item.prix || 0) * Number(item.qty || 0))}
                    </div>

                    <button
                      type="button"
                      className="removeBtn"
                      onClick={() => removeFromCart(item.variationId)}
                    >
                      🗑
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="paymentPanel">
          <div className="paymentCard">
            <div className="paymentHeader">
              <div>
                <h2>Checkout</h2>
                <p>Delivery, payment, invoice and signature</p>
              </div>
              <div className="miniAvatar">{(me?.prenom || "M").slice(0, 1).toUpperCase()}</div>
            </div>

            {successOrder ? (
              <div className="successBox">
                <strong>Commande créée :</strong> {successOrder.referenceCommande}
                <br />
                <strong>Facture :</strong> {successOrder.invoiceNumber}
                <br />
                <strong>Instructions :</strong> {successOrder.paymentInstructions}
              </div>
            ) : null}

            <form onSubmit={handleCheckout} className="paymentForm">
              <div className="paymentGrid">
                <label>
                  <span>Nom</span>
                  <input name="nom" value={form.nom} onChange={onChange} />
                </label>
                <label>
                  <span>Prénom</span>
                  <input name="prenom" value={form.prenom} onChange={onChange} />
                </label>
              </div>

              <label>
                <span>Téléphone</span>
                <input name="telephone" value={form.telephone} onChange={onChange} />
              </label>

              <label>
                <span>Adresse</span>
                <input name="adresse" value={form.adresse} onChange={onChange} />
              </label>

              <div className="paymentGrid">
                <label>
                  <span>Ville</span>
                  <input name="ville" value={form.ville} onChange={onChange} />
                </label>
                <label>
                  <span>Code postal</span>
                  <input name="codePostal" value={form.codePostal} onChange={onChange} />
                </label>
              </div>

              <label>
                <span>Mode de paiement</span>
                <select name="modePaiement" value={form.modePaiement} onChange={onChange}>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </label>

              {form.modePaiement === "CARTE" && (
                <>
                  <label>
                    <span>Name on card</span>
                    <input name="cardName" value={form.cardName} onChange={onChange} />
                  </label>

                  <label>
                    <span>Card Number</span>
                    <input name="cardNumber" value={form.cardNumber} onChange={onChange} />
                  </label>

                  <div className="paymentGrid">
                    <label>
                      <span>Expiration date</span>
                      <input name="expiry" value={form.expiry} onChange={onChange} placeholder="mm/yy" />
                    </label>

                    <label>
                      <span>CVV</span>
                      <input name="cvv" value={form.cvv} onChange={onChange} placeholder="123" />
                    </label>
                  </div>
                </>
              )}

              {form.modePaiement === "D17" && (
                <>
                  <label>
                    <span>Numéro D17</span>
                    <input
                      name="d17Phone"
                      value={form.d17Phone}
                      onChange={onChange}
                      placeholder="+216 ..."
                    />
                  </label>

                  <label>
                    <span>Référence D17</span>
                    <input
                      name="d17Reference"
                      value={form.d17Reference}
                      onChange={onChange}
                      placeholder="Référence optionnelle"
                    />
                  </label>
                </>
              )}

              {form.modePaiement === "VIREMENT" && (
                <label>
                  <span>Référence virement</span>
                  <input
                    name="bankReference"
                    value={form.bankReference}
                    onChange={onChange}
                    placeholder="Référence bancaire"
                  />
                </label>
              )}

              <label>
                <span>Note</span>
                <textarea
                  name="note"
                  value={form.note}
                  onChange={onChange}
                  rows="3"
                  placeholder="Instruction supplémentaire..."
                />
              </label>

              <div className="signatureBox">
                <div className="signatureTop">
                  <h3>Signature en ligne</h3>
                  <button type="button" className="clearBtn" onClick={clearSignature}>
                    Effacer
                  </button>
                </div>

                <canvas
                  ref={canvasRef}
                  className="signatureCanvas"
                  style={{
                    width: "100%",
                    height: "180px",
                    background: "#fff",
                    border: "1px solid #d1d5db",
                    borderRadius: "12px",
                    touchAction: "none",
                    cursor: "crosshair",
                  }}
                  onMouseDown={startDraw}
                  onMouseMove={draw}
                  onMouseUp={stopDraw}
                  onMouseLeave={stopDraw}
                  onTouchStart={startDraw}
                  onTouchMove={draw}
                  onTouchEnd={stopDraw}
                />
              </div>

              <label className="checkRow">
                <input
                  type="checkbox"
                  name="acceptTerms"
                  checked={form.acceptTerms}
                  onChange={onChange}
                />
                <span>J'accepte la facture proforma, le mode de paiement choisi et les conditions de commande.</span>
              </label>

              <div className="summaryBox">
                <div>
                  <span>Subtotal</span>
                  <strong>{fmtPrice(subtotal)}</strong>
                </div>
                <div>
                  <span>Shipping</span>
                  <strong>{fmtPrice(shipping)}</strong>
                </div>
                <div className="totalRow">
                  <span>Total</span>
                  <strong>{fmtPrice(total)}</strong>
                </div>
              </div>

              <button type="submit" className="checkoutBtn" disabled={!items.length || submitting}>
                <span>{submitting ? "Processing..." : fmtPrice(total)}</span>
                <span>Create order & invoice →</span>
              </button>
            </form>
          </div>
        </aside>
      </div>
    </div>
  );
}