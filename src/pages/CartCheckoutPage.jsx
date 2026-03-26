import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import "../styles/cart-checkout.css";
import UserIconMenu from "../components/UserIconMenu";
import LanguageMenu from "../components/LanguageMenu";

const toAbs = (path) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
  return `${base}${path}`;
};

const fmtPrice = (v) => `${Number(v || 0).toFixed(3)} TND`;

function readCart() {
  try {
    const data = JSON.parse(localStorage.getItem("cart") || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function getCartCount(items) {
  return items.reduce((sum, item) => sum + Number(item.qty || 0), 0);
}

export default function CartCheckoutPage({ me, setMe }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [items, setItems] = useState(() => readCart());
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
    modePaiement: "CARTE",
    cardName: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
    note: "",
  });

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items));
    window.dispatchEvent(new Event("cart-updated"));
  }, [items]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      nom: me?.nom || prev.nom,
      prenom: me?.prenom || prev.prenom,
    }));
  }, [me]);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.prix || 0) * Number(item.qty || 0), 0),
    [items]
  );

  const shipping = useMemo(() => (items.length ? 4.0 : 0), [items]);
  const total = useMemo(() => subtotal + shipping, [subtotal, shipping]);
  const cartCount = useMemo(() => getCartCount(items), [items]);

  function updateQty(variationId, nextQty) {
    setItems((prev) =>
      prev
        .map((item) =>
          Number(item.variationId) === Number(variationId)
            ? { ...item, qty: Math.max(1, Number(nextQty || 1)) }
            : item
        )
        .filter((item) => Number(item.qty) > 0)
    );
  }

  function removeItem(variationId) {
    setItems((prev) => prev.filter((item) => Number(item.variationId) !== Number(variationId)));
  }

  function clearCart() {
    setItems([]);
  }

  function onChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleCheckout(e) {
    e.preventDefault();
    setServerError("");
    setSuccessOrder(null);

    if (!items.length) {
      alert("Your cart is empty");
      return;
    }

    if (!me) {
      navigate("/login");
      return;
    }

    if (!form.telephone || !form.adresse || !form.ville || !form.modePaiement) {
      alert("Please fill the delivery fields");
      return;
    }

    if (
      form.modePaiement === "CARTE" &&
      (!form.cardName || !form.cardNumber || !form.expiry || !form.cvv)
    ) {
      alert("Please fill all card fields");
      return;
    }

    try {
      setSubmitting(true);

      await api.put("/api/cart/sync", {
        items: items.map((item) => ({
          articleId: Number(item.id),
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
        note: form.note,
      };

      const { data } = await api.post("/api/orders/checkout", checkoutPayload);

      localStorage.removeItem("cart");
      setItems([]);
      setSuccessOrder(data);
      window.dispatchEvent(new Event("cart-updated"));

      navigate("/orders", { state: { createdOrder: data } });
    } catch (e) {
      setServerError(e?.response?.data?.message || "Checkout failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="checkoutPage">
      <header className="storeHeader checkoutHeader">
        <Link to="/" className="logo">EMIRIO</Link>

        <nav className="mainNav">
          <Link to="/">{t("nav.home", "Home")}</Link>
          <Link to="/catalog">{t("nav.catalog", "Catalog")}</Link>
          <Link to="/cart">{t("nav.cart", "Cart")}</Link>
          <Link to="/orders">{t("nav.orders", "Orders")}</Link>
        </nav>

        <div className="headerActions">
          <button type="button" className="cartHeaderBtn" onClick={() => navigate("/cart")}>
            <span>🛒</span>
            <span>{t("nav.cart", "Cart")}</span>
            {cartCount > 0 ? <span className="cartBadge">{cartCount}</span> : null}
          </button>
          <LanguageMenu />
          <UserIconMenu me={me} setMe={setMe} />
        </div>
      </header>

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
                <article className="cartItem" key={`${item.id}-${item.variationId}`}>
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
                        onClick={() => updateQty(item.variationId, Number(item.qty || 1) - 1)}
                      >
                        −
                      </button>
                      <span>{item.qty}</span>
                      <button
                        type="button"
                        onClick={() => updateQty(item.variationId, Number(item.qty || 1) + 1)}
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
                      onClick={() => removeItem(item.variationId)}
                      aria-label="Remove item"
                      title="Remove item"
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
                <h2>{t("cart.checkoutTitle", "Checkout")}</h2>
                <p>{t("cart.checkoutSubtitle", "Delivery, payment and validation")}</p>
              </div>
              <div className="miniAvatar">{(me?.prenom || "M").slice(0, 1).toUpperCase()}</div>
            </div>

            {successOrder ? (
              <div className="successBox">
                <strong>Commande créée :</strong> {successOrder.referenceCommande}
              </div>
            ) : null}

            <form onSubmit={handleCheckout} className="paymentForm">
              <div className="paymentGrid">
                <label>
                  <span>Nom</span>
                  <input name="nom" value={form.nom} onChange={onChange} placeholder="Nom" />
                </label>

                <label>
                  <span>Prénom</span>
                  <input name="prenom" value={form.prenom} onChange={onChange} placeholder="Prénom" />
                </label>
              </div>

              <label>
                <span>Téléphone</span>
                <input
                  name="telephone"
                  value={form.telephone}
                  onChange={onChange}
                  placeholder="+216 ..."
                />
              </label>

              <label>
                <span>Adresse</span>
                <input
                  name="adresse"
                  value={form.adresse}
                  onChange={onChange}
                  placeholder="Adresse complète"
                />
              </label>

              <div className="paymentGrid">
                <label>
                  <span>Ville</span>
                  <input name="ville" value={form.ville} onChange={onChange} placeholder="Ville" />
                </label>

                <label>
                  <span>Code postal</span>
                  <input
                    name="codePostal"
                    value={form.codePostal}
                    onChange={onChange}
                    placeholder="1000"
                  />
                </label>
              </div>

              <label>
                <span>Mode de paiement</span>
                <select
                  name="modePaiement"
                  value={form.modePaiement}
                  onChange={onChange}
                  className="checkoutSelect"
                >
                  <option value="CARTE">Carte</option>
                  <option value="LIVRAISON">Paiement à la livraison</option>
                </select>
              </label>

              {form.modePaiement === "CARTE" ? (
                <>
                  <label>
                    <span>{t("cart.nameOnCard", "Name on card")}</span>
                    <input
                      name="cardName"
                      value={form.cardName}
                      onChange={onChange}
                      placeholder="Name"
                    />
                  </label>

                  <label>
                    <span>{t("cart.cardNumber", "Card Number")}</span>
                    <input
                      name="cardNumber"
                      value={form.cardNumber}
                      onChange={onChange}
                      placeholder="1111 2222 3333 4444"
                    />
                  </label>

                  <div className="paymentGrid">
                    <label>
                      <span>{t("cart.expirationDate", "Expiration date")}</span>
                      <input
                        name="expiry"
                        value={form.expiry}
                        onChange={onChange}
                        placeholder="mm/yy"
                      />
                    </label>

                    <label>
                      <span>CVV</span>
                      <input
                        name="cvv"
                        value={form.cvv}
                        onChange={onChange}
                        placeholder="123"
                      />
                    </label>
                  </div>
                </>
              ) : null}

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

              <div className="summaryBox">
                <div>
                  <span>{t("cart.subtotal", "Subtotal")}</span>
                  <strong>{fmtPrice(subtotal)}</strong>
                </div>
                <div>
                  <span>{t("cart.shipping", "Shipping")}</span>
                  <strong>{fmtPrice(shipping)}</strong>
                </div>
                <div className="totalRow">
                  <span>{t("cart.total", "Total")}</span>
                  <strong>{fmtPrice(total)}</strong>
                </div>
              </div>

              <button type="submit" className="checkoutBtn" disabled={!items.length || submitting}>
                <span>{submitting ? "Processing..." : fmtPrice(total)}</span>
                <span>{t("cart.checkout", "Checkout")} →</span>
              </button>
            </form>
          </div>
        </aside>
      </div>
    </div>
  );
}