import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import "../styles/cart-checkout.css";
import UserIconMenu from "../components/UserIconMenu";
import LanguageMenu from "../components/LanguageMenu";

const fmtPrice = (v) => `${Number(v || 0).toFixed(3)} TND`;

function fmtDate(value) {
  if (!value) return "-";
  try { return new Date(value).toLocaleString(); } catch { return String(value); }
}

function statusLabel(status) {
  switch (status) {
    case "EN_ATTENTE": case "EN_COURS": return "In progress";
    case "CONFIRMEE": return "Confirmed";
    case "EXPEDIEE": return "Shipped";
    case "LIVREE": return "Delivered";
    case "ANNULEE": return "Cancelled";
    default: return status || "-";
  }
}

function statusClass(status) {
  switch (status) {
    case "EN_ATTENTE": case "EN_COURS": return "statusChip progress";
    case "CONFIRMEE": case "EXPEDIEE": return "statusChip ok";
    case "LIVREE": return "statusChip done";
    case "ANNULEE": return "statusChip bad";
    default: return "statusChip";
  }
}

export default function OrderHistoryPage({ me, setMe }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [tab, setTab] = useState("active");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const createdOrder = location.state?.createdOrder || null;

  async function loadOrders(nextTab = tab) {
    try {
      setLoading(true);
      setError("");
      const { data } = await api.get("/api/commandes/me", { params: { archived: nextTab === "archive" } });
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.response?.data?.message || "Cannot load orders");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!me) { navigate("/login"); return; }
    loadOrders(tab);
  }, [tab, me]);

  async function archiveOrder(id) {
    try {
      await api.patch(`/api/commandes/${id}/archive`);
      await loadOrders(tab);
    } catch (e) {
      alert(e?.response?.data?.message || "Cannot archive order");
    }
  }

  const activeCount = useMemo(() => orders.filter(o => !o.archived).length, [orders]);
  const archivedCount = useMemo(() => orders.filter(o => o.archived).length, [orders]);

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
          <LanguageMenu />
          <UserIconMenu me={me} setMe={setMe} />
        </div>
      </header>

      <div className="checkoutWrap ordersWrapSingle">
        <section className="cartPanel">
          <div className="sectionTopRow">
            <h2>{t("orders.title", "My Orders")}</h2>
            <button className="viewAllBtn" onClick={() => navigate("/catalog")}>{t("home.shopNow", "Shop Now")}</button>
          </div>

          {createdOrder && (
            <div className="successBox" style={{ marginBottom: 18 }}>
              Your order <strong>{createdOrder.referenceCommande}</strong> was created successfully.
              A confirmation email has been sent.
            </div>
          )}

          <div className="ordersTabs">
            <button type="button" className={`tabBtn ${tab === "active" ? "active" : ""}`} onClick={() => setTab("active")}>Active ({activeCount})</button>
            <button type="button" className={`tabBtn ${tab === "archive" ? "active" : ""}`} onClick={() => setTab("archive")}>Archive ({archivedCount})</button>
          </div>

          {loading ? <div className="homeInfo">Loading orders...</div> : error ? <div className="homeInfo error">{error}</div> : !orders.length ? (
            <div className="emptyCartBox"><h3>No orders found</h3><p>Your validated orders will appear here.</p></div>
          ) : (
            <div className="ordersList">
              {orders.map((order) => (
                <article className="orderCard" key={order.id}>
                  <div className="orderTop">
                    <div><h3>{order.referenceCommande}</h3><p>{fmtDate(order.dateCommande)}</p></div>
                    <div className={statusClass(order.statutCommande)}>{statusLabel(order.statutCommande)}</div>
                  </div>
                  <div className="orderMetaGrid">
                    <div><span>Total</span><strong>{fmtPrice(order.total)}</strong></div>
                    <div><span>Payment</span><strong>{order.modePaiement || "-"}</strong> {order.modePaiement === "SIMULE" && <span style={{ color: "green", fontSize: "0.7rem", marginLeft: "6px" }}>✅ simulated</span>}</div>
                    <div><span>Status</span><strong>{order.statutPaiement || "-"}</strong></div>
                    <div><span>City</span><strong>{order.ville || "-"}</strong></div>
                    <div><span>Phone</span><strong>{order.telephone || "-"}</strong></div>
                  </div>
                  <div className="orderLines">
                    {order.lignes?.map((line) => (
                      <div className="orderLine" key={line.id}>
                        <div>
                          <strong>{line.nomProduit}</strong>
                          <p>{[line.couleurNom, line.taillePointure].filter(Boolean).join(" • ") || "Product option"}</p>
                        </div>
                        <div className="orderLineRight"><span>x{line.quantite}</span><strong>{fmtPrice(line.sousTotal)}</strong></div>
                      </div>
                    ))}
                  </div>
                  {!order.archived && (
                    <div className="orderActions">
                      <button type="button" className="clearBtn" onClick={() => archiveOrder(order.id)}>Archive</button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}