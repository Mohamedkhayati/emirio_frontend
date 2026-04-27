import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import "../styles/order-history.css"; // external CSS

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
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [displayLimit, setDisplayLimit] = useState(5);

  const createdOrder = location.state?.createdOrder || null;

  async function loadOrders(nextTab = tab) {
    try {
      setLoading(true);
      setError("");
      const { data } = await api.get("/api/commandes/me", {
        params: { archived: nextTab === "archive" },
      });
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.response?.data?.message || "Cannot load orders");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!me) {
      navigate("/login");
      return;
    }
    loadOrders(tab);
  }, [tab, me]);

  useEffect(() => {
    setDisplayLimit(5);
    setExpandedOrderId(null);
  }, [tab]);

  async function archiveOrder(id) {
    try {
      await api.patch(`/api/commandes/${id}/archive`);
      await loadOrders(tab);
    } catch (e) {
      alert(e?.response?.data?.message || "Cannot archive order");
    }
  }

  const displayedOrders = useMemo(() => orders.slice(0, displayLimit), [orders, displayLimit]);
  const hasMore = orders.length > displayLimit;

  const toggleExpand = (orderId) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  const handleShowMore = () => {
    setDisplayLimit((prev) => prev + 5);
  };

  const activeCount = useMemo(() => orders.filter((o) => !o.archived).length, [orders]);
  const archivedCount = useMemo(() => orders.filter((o) => o.archived).length, [orders]);

  return (
    <div className="checkoutPage">
      {/* Minimal header – removed EMIRIO / nav links as requested */}
      

      <div className="checkoutWrap ordersWrapSingle">
        <section className="cartPanel">
          <div className="sectionTopRow">
            <h2>{t("orders.title", "My Orders")}</h2>
            <button className="viewAllBtn" onClick={() => navigate("/catalog")}>
              {t("home.shopNow", "Shop Now")}
            </button>
          </div>

          {createdOrder && (
            <div className="successBox">
              ✨ Order <strong>{createdOrder.referenceCommande}</strong> was created successfully.
              A confirmation email has been sent.
            </div>
          )}

          <div className="ordersTabs">
            <button
              type="button"
              className={`tabBtn ${tab === "active" ? "active" : ""}`}
              onClick={() => setTab("active")}
            >
              Active ({activeCount})
            </button>
            <button
              type="button"
              className={`tabBtn ${tab === "archive" ? "active" : ""}`}
              onClick={() => setTab("archive")}
            >
              Archive ({archivedCount})
            </button>
          </div>

          {loading ? (
            <div className="homeInfo">Loading orders...</div>
          ) : error ? (
            <div className="homeInfo error">{error}</div>
          ) : orders.length === 0 ? (
            <div className="emptyCartBox">
              <h3>No orders found</h3>
              <p>Your validated orders will appear here.</p>
            </div>
          ) : (
            <>
              <div className="treeTableWrapper">
                <table className="ordersTreeTable">
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}></th>
                      <th>Reference</th>
                      <th>Date</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Payment</th>
                      <th>City / Phone</th>
                      <th style={{ width: 110 }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedOrders.map((order) => (
                      <>
                        <tr
                          className="mainOrderRow"
                          key={order.id}
                          onClick={() => toggleExpand(order.id)}
                        >
                          <td>
                            <span className="expandIcon">
                              {expandedOrderId === order.id ? "▼" : "▶"}
                            </span>
                          </td>
                          <td>
                            <span className="orderRef">{order.referenceCommande}</span>
                          </td>
                          <td>{fmtDate(order.dateCommande)}</td>
                          <td>
                            <strong>{fmtPrice(order.total)}</strong>
                          </td>
                          <td>
                            <div className={`badgeStatus ${statusClass(order.statutCommande)}`}>
                              {statusLabel(order.statutCommande)}
                            </div>
                          </td>
                          <td>
                            {order.modePaiement || "-"}
                            {order.modePaiement === "SIMULE" && (
                              <span style={{ fontSize: "0.65rem", marginLeft: "6px" }}>✅ sim</span>
                            )}
                          </td>
                          <td>
                            {order.ville || "-"} / {order.telephone || "-"}
                          </td>
                          <td onClick={(e) => e.stopPropagation()}>
                            {!order.archived ? (
                              <button className="archiveBtn" onClick={() => archiveOrder(order.id)}>
                                Archive
                              </button>
                            ) : (
                              <span className="archivedBadge">archived</span>
                            )}
                          </td>
                        </tr>
                        {expandedOrderId === order.id && (
                          <tr className="expandRow">
                            <td colSpan={8}>
                              <div className="subTableContainer">
                                <table className="subTable">
                                  <thead>
                                    <tr>
                                      <th>Product</th>
                                      <th>Options</th>
                                      <th>Qty</th>
                                      <th>Subtotal</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {order.lignes?.length ? (
                                      order.lignes.map((line) => (
                                        <tr key={line.id}>
                                          <td className="lineProduct">{line.nomProduit}</td>
                                          <td>
                                            {[line.couleurNom, line.taillePointure].filter(Boolean).join(" • ") || "—"}
                                          </td>
                                          <td>x{line.quantite}</td>
                                          <td>{fmtPrice(line.sousTotal)}</td>
                                        </tr>
                                      ))
                                    ) : (
                                      <tr>
                                        <td colSpan="4" style={{ textAlign: "center", color: "#888" }}>
                                          No line items
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                                <div
                                  style={{
                                    marginTop: "12px",
                                    fontSize: "0.75rem",
                                    color: "#4a5568",
                                    display: "flex",
                                    gap: "16px",
                                  }}
                                >
                                  <span>💳 {order.statutPaiement || "pending"}</span>
                                  <span>📍 {order.adresseLivraison || "No address"}</span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
              {hasMore && (
                <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
                  <button className="loadMoreBtn" onClick={handleShowMore}>
                    + Show next {Math.min(5, orders.length - displayLimit)} orders
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}