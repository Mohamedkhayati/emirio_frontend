import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { api } from "../../lib/api";
import {
  fmt,
  fmtPrice,
  fullImageUrl,
  getOrderBadgeClass,
  getOrderBadgeLabel,
  getOrderBucket,
  normalizeOrderStatus,
  ORDER_PAGE_SIZE,
  ORDER_TABS,
} from "./adminShared";

export default function OrdersPage() {
  // 👇 Changed from isControleurRole to isEcommerceManager
  const { isAdminGeneral, isEcommerceManager } = useOutletContext();

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [busyOrderId, setBusyOrderId] = useState(null);
  const [orderQ, setOrderQ] = useState("");
  const [orderTab, setOrderTab] = useState("PENDING");
  const [orderSort, setOrderSort] = useState("newest");
  const [orderPage, setOrderPage] = useState(1);

  // History modal (actions)
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [historyItems, setHistoryItems] = useState([]);

  // Payments modal
  const [paymentsOpen, setPaymentsOpen] = useState(false);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsError, setPaymentsError] = useState("");
  const [paymentsList, setPaymentsList] = useState([]);
  const [selectedOrderForPayments, setSelectedOrderForPayments] = useState(null);

  async function loadOrders() {
    // 👇 Allow both admin and e‑commerce manager
    if (!isAdminGeneral && !isEcommerceManager) return;
    setOrdersError("");
    setOrdersLoading(true);
    try {
      const res = await api.get("/api/admin/orders");
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setOrdersError(e?.response?.data?.message || "Cannot load orders");
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }

  async function openHistory(order) {
    setSelectedOrder(order);
    setHistoryOpen(true);
    setHistoryLoading(true);
    setHistoryError("");
    setHistoryItems([]);
    try {
      const res = await api.get(`/api/admin/orders/${order.id}/actions`);
      setHistoryItems(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setHistoryError(
        e?.response?.data?.message || "Cannot load order history."
      );
      setHistoryItems([]);
    } finally {
      setHistoryLoading(false);
    }
  }

  function closeHistory() {
    setHistoryOpen(false);
    setSelectedOrder(null);
    setHistoryItems([]);
    setHistoryError("");
  }

  async function openPayments(order) {
    setSelectedOrderForPayments(order);
    setPaymentsOpen(true);
    setPaymentsLoading(true);
    setPaymentsError("");
    setPaymentsList([]);
    try {
      const res = await api.get(`/api/admin/orders/${order.id}/payments`);
      setPaymentsList(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setPaymentsError(e?.response?.data?.message || "Cannot load payment details");
      setPaymentsList([]);
    } finally {
      setPaymentsLoading(false);
    }
  }

  function closePayments() {
    setPaymentsOpen(false);
    setSelectedOrderForPayments(null);
    setPaymentsList([]);
    setPaymentsError("");
  }

  async function confirmOrder(id) {
    if (!isAdminGeneral) return;
    setBusyOrderId(id);
    setOrdersError("");
    try {
      await api.patch(`/api/admin/orders/${id}/status`, { statutCommande: "CONFIRMEE" });
      await loadOrders();
    } catch (e) {
      setOrdersError(e?.response?.data?.message || "Cannot confirm order");
    } finally {
      setBusyOrderId(null);
    }
  }

  async function cancelOrder(id) {
    if (!isAdminGeneral) return;
    setBusyOrderId(id);
    setOrdersError("");
    try {
      await api.patch(`/api/admin/orders/${id}/status`, { statutCommande: "ANNULEE" });
      await loadOrders();
    } catch (e) {
      setOrdersError(e?.response?.data?.message || "Cannot cancel order");
    } finally {
      setBusyOrderId(null);
    }
  }

  async function reviewPayment(id, accepted) {
    if (!isAdminGeneral) return;
    setBusyOrderId(id);
    setOrdersError("");
    try {
      await api.patch(`/api/admin/orders/${id}/payment-review`, {
        accepted,
        note: accepted ? "Payment accepted by admin" : "Payment rejected by admin",
      });
      await loadOrders();
    } catch (e) {
      setOrdersError(e?.response?.data?.message || "Cannot review payment");
    } finally {
      setBusyOrderId(null);
    }
  }

  async function markDelivered(id) {
    if (!isAdminGeneral) return;
    setBusyOrderId(id);
    setOrdersError("");
    try {
      await api.patch(`/api/admin/orders/${id}/delivered`);
      await loadOrders();
    } catch (e) {
      setOrdersError(e?.response?.data?.message || "Cannot mark order as delivered");
    } finally {
      setBusyOrderId(null);
    }
  }

  useEffect(() => {
    loadOrders();
  }, [isAdminGeneral, isEcommerceManager]);

  useEffect(() => {
    setOrderPage(1);
  }, [orderQ, orderTab, orderSort]);

  const filteredOrders = useMemo(() => {
    const qv = orderQ.trim().toLowerCase();
    let list = [...orders].filter((o) => getOrderBucket(o.statutCommande) === orderTab);
    if (qv) {
      list = list.filter((o) => {
        const customerName = `${o.prenomClient || ""} ${o.nomClient || ""}`.trim().toLowerCase();
        const ref = String(o.referenceCommande || o.id || "").toLowerCase();
        const email = String(o.emailClient || "").toLowerCase();
        const phone = String(o.telephone || "").toLowerCase();
        return customerName.includes(qv) || ref.includes(qv) || email.includes(qv) || phone.includes(qv);
      });
    }
    list.sort((a, b) => {
      if (orderSort === "oldest") return new Date(a.dateCommande || 0).getTime() - new Date(b.dateCommande || 0).getTime();
      if (orderSort === "amount-high") return Number(b.total || 0) - Number(a.total || 0);
      if (orderSort === "amount-low") return Number(a.total || 0) - Number(b.total || 0);
      return new Date(b.dateCommande || 0).getTime() - new Date(a.dateCommande || 0).getTime();
    });
    return list;
  }, [orders, orderQ, orderTab, orderSort]);

  const totalOrderPages = Math.max(1, Math.ceil(filteredOrders.length / ORDER_PAGE_SIZE));
  const pagedOrders = useMemo(() => {
    const start = (orderPage - 1) * ORDER_PAGE_SIZE;
    return filteredOrders.slice(start, start + ORDER_PAGE_SIZE);
  }, [filteredOrders, orderPage]);

  useEffect(() => {
    if (orderPage > totalOrderPages) setOrderPage(totalOrderPages);
  }, [orderPage, totalOrderPages]);

  // 👇 Allow both admin and e‑commerce manager
  if (!isAdminGeneral && !isEcommerceManager) {
    return (
      <div className="fadeInUp">
        <div className="admPage">
          <div className="admAlert">Access denied. Only administrators and e‑commerce managers can access this page.</div>
        </div>
      </div>
    );
  }

  // 👇 Read‑only mode for e‑commerce manager (they can view but not modify)
  const isReadOnly = isEcommerceManager && !isAdminGeneral;

  return (
    <div className="fadeInUp">
      <div className="admPage ordersPage">
        <div className="ordersHero">
          <div>
            <div className="admH1">Order management</div>
            <div className="admH2">
              {isReadOnly
                ? "View only mode - You can see orders but cannot modify them."
                : "Track store orders, payment verification and order history."}
            </div>
          </div>
          <div className="ordersHeroActions">
            <button className="admBtn" onClick={loadOrders}>Refresh</button>
          </div>
        </div>

        {ordersError ? <div className="admAlert">{ordersError}</div> : null}

        <div className="ordersShell">
          <div className="ordersTopBar">
            <div className="ordersSearchBox">
              <span className="ordersSearchIcon">⌕</span>
              <input className="ordersSearchInput" value={orderQ} onChange={(e) => setOrderQ(e.target.value)} placeholder="Search orders" />
            </div>
            <div className="ordersSortBox">
              <select value={orderSort} onChange={(e) => setOrderSort(e.target.value)}>
                <option value="newest">Sorting by: Newest</option>
                <option value="oldest">Sorting by: Oldest</option>
                <option value="amount-high">Sorting by: Amount high</option>
                <option value="amount-low">Sorting by: Amount low</option>
              </select>
            </div>
          </div>

          <div className="ordersTabs">
            {ORDER_TABS.map((tab) => (
              <button key={tab.key} type="button" className={`ordersTab ${orderTab === tab.key ? "active" : ""}`} onClick={() => setOrderTab(tab.key)}>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="ordersTable">
            <div className="ordersTableHead">
              <div>Customer</div>
              <div>Order #</div>
              <div>Status</div>
              <div>Date</div>
              <div>Products</div>
              <div>Total</div>
              <div>Actions</div>
              <div>Payment</div>
              <div>Invoice</div>
              <div>Signature</div>
            </div>

            {ordersLoading ? (
              <div className="ordersEmpty shimmerCard">Loading orders...</div>
            ) : !pagedOrders.length ? (
              <div className="ordersEmpty">No orders found.</div>
            ) : (
              pagedOrders.map((order, index) => {
                const customerName = `${order.prenomClient || ""} ${order.nomClient || ""}`.trim() || "Unknown customer";
                const customerSub = order.emailClient || order.telephone || order.adresse || "-";
                const ref = order.referenceCommande || `#${order.id}`;
                const lines = Array.isArray(order.lignes) ? order.lignes : [];
                const thumbs = lines.slice(0, 3);
                const moreCount = Math.max(0, lines.length - 3);
                const normalizedStatus = normalizeOrderStatus(order.statutCommande);

                return (
                  <div key={order.id || ref} className="ordersRow" style={{ animationDelay: `${index * 70}ms` }}>
                    <div className="ordersCustomerCell">
                      <div className="ordersAvatar">
                        {customerName.split(" ").filter(Boolean).slice(0,2).map(p=>p[0]).join("").toUpperCase() || "U"}
                      </div>
                      <div>
                        <div className="ordersCustomerName">{customerName}</div>
                        <div className="ordersCustomerSub">{customerSub}</div>
                      </div>
                    </div>
                    <div className="ordersRef">{ref}</div>
                    <div><span className={getOrderBadgeClass(order.statutCommande)}>{getOrderBadgeLabel(order.statutCommande)}</span></div>
                    <div className="ordersDate">{fmt(order.dateCommande)}</div>
                    <div className="ordersDetailsCell">
                      <div className="ordersThumbGroup">
                        {thumbs.map((line, i) => line.imageUrl ? (
                          <img key={`${line.id || i}-${i}`} src={fullImageUrl(line.imageUrl)} alt={line.articleNom || line.nomProduit || "Product"} className="ordersThumb" />
                        ) : (
                          <div key={`${line.id || i}-${i}`} className="ordersThumb fallback">{(line.articleNom || line.nomProduit || "?").slice(0,1).toUpperCase()}</div>
                        ))}
                        {moreCount > 0 && <div className="ordersMoreThumb">+{moreCount}</div>}
                      </div>
                    </div>
                    <div className="ordersTotalCell"><strong>{fmtPrice(order.total)}</strong></div>
                    <div className="ordersActionsCell">
                      <button type="button" className="admBtn mini" onClick={() => openHistory(order)}>History</button>
                      <button type="button" className="admBtn mini" onClick={() => openPayments(order)}>Payments</button>
                      <button type="button" className="admBtn mini primary" onClick={() => confirmOrder(order.id)} disabled={isReadOnly || busyOrderId === order.id || normalizedStatus === "CONFIRMEE" || normalizedStatus === "ANNULEE" || normalizedStatus === "LIVREE"}>Confirm</button>
                      <button type="button" className="admBtn mini danger" onClick={() => cancelOrder(order.id)} disabled={isReadOnly || busyOrderId === order.id || normalizedStatus === "ANNULEE" || normalizedStatus === "LIVREE"}>Cancel</button>
                      <button type="button" className="admBtn mini" onClick={() => reviewPayment(order.id, true)} disabled={isReadOnly || busyOrderId === order.id || order.statutPaiement === "ACCEPTE"}>Accept payment</button>
                      <button type="button" className="admBtn mini danger" onClick={() => reviewPayment(order.id, false)} disabled={isReadOnly || busyOrderId === order.id || order.statutPaiement === "REFUSE"}>Reject payment</button>
                      <button type="button" className="admBtn mini primary" onClick={() => markDelivered(order.id)} disabled={isReadOnly || busyOrderId === order.id || normalizeOrderStatus(order.statutCommande) === "LIVREE"}>Delivered</button>
                    </div>
                    <div className="ordersPaymentCell">
                      <div><strong>{order.modePaiement || "-"}</strong></div>
                      <div>{order.statutPaiement || "-"}</div>
                      <div>
                        {order.cardLast4 && `Card **** ${order.cardLast4}`}
                        {order.cardLast4 && (order.d17Phone || order.d17Reference || order.bankReference) && " • "}
                        {order.d17Phone && `D17: ${order.d17Phone}`}
                        {order.d17Phone && (order.d17Reference || order.bankReference) && " • "}
                        {order.d17Reference && `Ref: ${order.d17Reference}`}
                        {order.d17Reference && order.bankReference && " • "}
                        {order.bankReference && `Bank ref: ${order.bankReference}`}
                      </div>
                      <small>{order.paymentInstructions || "-"}</small>
                    </div>
                    <div className="ordersInvoiceCell">
                      <div>{order.invoiceNumber || "-"}</div>
                      {order.invoiceUrl ? <a href={fullImageUrl(order.invoiceUrl)} target="_blank" rel="noreferrer">Open invoice</a> : "-"}
                    </div>
                    <div className="ordersSignatureCell">
                      {order.signatureDataUrl ? <a href={order.signatureDataUrl} target="_blank" rel="noreferrer">View signature</a> : "-"}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="ordersPagination">
            <button type="button" className="ordersPageBtn" disabled={orderPage <= 1} onClick={() => setOrderPage(p => Math.max(1, p-1))}>Previous</button>
            {Array.from({ length: totalOrderPages }, (_, i) => i+1).map(p => (
              <button key={p} type="button" className={`ordersPageBtn ${orderPage === p ? "active" : ""}`} onClick={() => setOrderPage(p)}>{p}</button>
            ))}
            <button type="button" className="ordersPageBtn" disabled={orderPage >= totalOrderPages} onClick={() => setOrderPage(p => Math.min(totalOrderPages, p+1))}>Next</button>
          </div>
        </div>
      </div>

      {/* History Modal (actions) */}
      {historyOpen && (
        <div className="ordersHistoryOverlay" onClick={closeHistory}>
          <div className="ordersHistoryModal" onClick={e => e.stopPropagation()}>
            <div className="ordersHistoryHead">
              <div><h3>Order history</h3><p>{selectedOrder?.referenceCommande || "-"}</p></div>
              <button type="button" className="admBtn mini" onClick={closeHistory}>Close</button>
            </div>
            {historyLoading ? <div className="ordersEmpty">Loading history...</div> : historyError ? <div className="admAlert">{historyError}</div> : !historyItems.length ? <div className="ordersEmpty">No history found.</div> : (
              <div className="ordersHistoryList">
                {historyItems.map((item, idx) => (
                  <div className="ordersHistoryItem" key={item.id || idx}>
                    <div className="ordersHistoryDot" />
                    <div className="ordersHistoryContent">
                      <div className="ordersHistoryTop"><strong>{item.typeAction || item.actionType || "ACTION"}</strong><span>{fmt(item.dateAction || item.createdAt)}</span></div>
                      <div className="ordersHistoryMeta">
                        {item.ancienStatut && <span>From: {item.ancienStatut}</span>}
                        {item.nouveauStatut && <span>To: {item.nouveauStatut}</span>}
                        {(item.utilisateurNom || item.userName) && <span>By: {item.utilisateurNom || item.userName}</span>}
                      </div>
                      <div className="ordersHistoryDetails">{item.details || item.note || "No details"}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payments Modal */}
      {paymentsOpen && (
        <div className="ordersHistoryOverlay" onClick={closePayments}>
          <div className="ordersHistoryModal" style={{ maxWidth: "720px" }} onClick={e => e.stopPropagation()}>
            <div className="ordersHistoryHead">
              <div><h3>Payment transactions</h3><p>{selectedOrderForPayments?.referenceCommande || "-"}</p></div>
              <button type="button" className="admBtn mini" onClick={closePayments}>Close</button>
            </div>
            {paymentsLoading ? <div className="ordersEmpty">Loading payments...</div> : paymentsError ? <div className="admAlert">{paymentsError}</div> : !paymentsList.length ? <div className="ordersEmpty">No payment records found.</div> : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {paymentsList.map(pmt => (
                  <div key={pmt.id} style={{ border: "1px solid #e2e8f0", borderRadius: "16px", padding: "14px", background: "#fafcff" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
                      <div><strong>{pmt.modePaiement || pmt.mode_paiement || "-"}</strong> <span className="admBadge" style={{ marginLeft: "8px" }}>{pmt.statutPaiement || pmt.statut_paiement || "-"}</span></div>
                      <div style={{ fontFamily: "monospace" }}>{fmtPrice(pmt.montant)}</div>
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "#475569", display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "8px" }}>
                      <span>📅 {fmt(pmt.datePaiement || pmt.date_paiement)}</span>
                      {pmt.referenceTransaction && <span>🔖 Ref: {pmt.referenceTransaction}</span>}
                    </div>
                    {pmt.details && <div style={{ fontSize: "0.85rem", color: "#334155", borderTop: "1px solid #eef2f6", paddingTop: "8px", marginTop: "6px" }}>{pmt.details}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}