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
  const { isAdminGeneral } = useOutletContext();

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [busyOrderId, setBusyOrderId] = useState(null);
  const [orderQ, setOrderQ] = useState("");
  const [orderTab, setOrderTab] = useState("PENDING");
  const [orderSort, setOrderSort] = useState("newest");
  const [orderPage, setOrderPage] = useState(1);

  async function loadOrders() {
    if (!isAdminGeneral) return;
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

  async function confirmOrder(id) {
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
  }, [isAdminGeneral]);

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
        return (
          customerName.includes(qv) ||
          ref.includes(qv) ||
          email.includes(qv) ||
          phone.includes(qv)
        );
      });
    }

    list.sort((a, b) => {
      if (orderSort === "oldest") {
        return new Date(a.dateCommande || 0).getTime() - new Date(b.dateCommande || 0).getTime();
      }
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

  if (!isAdminGeneral) {
    return (
      <div className="fadeInUp">
        <div className="admPage">
          <div className="admAlert">Access denied.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fadeInUp">
      <div className="admPage ordersPage">
        <div className="ordersHero">
          <div>
            <div className="admH1">Order management</div>
            <div className="admH2">
              Track store orders with quick filters, thumbnails and smooth actions.
            </div>
          </div>

          <div className="ordersHeroActions">
            <button className="admBtn" onClick={loadOrders}>
              Refresh
            </button>
          </div>
        </div>

        {ordersError ? <div className="admAlert">{ordersError}</div> : null}

        <div className="ordersShell">
          <div className="ordersTopBar">
            <div className="ordersSearchBox">
              <span className="ordersSearchIcon">⌕</span>
              <input
                className="ordersSearchInput"
                value={orderQ}
                onChange={(e) => setOrderQ(e.target.value)}
                placeholder="Search orders"
              />
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
              <button
                key={tab.key}
                type="button"
                className={`ordersTab ${orderTab === tab.key ? "active" : ""}`}
                onClick={() => setOrderTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="ordersTable">
            <div className="ordersTableHead">
              <div>Customer Name</div>
              <div>NO. Order</div>
              <div>Order Status</div>
              <div>Order Date</div>
              <div>Details</div>
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
                const customerName =
                  `${order.prenomClient || ""} ${order.nomClient || ""}`.trim() || "Unknown customer";
                const customerSub = order.emailClient || order.telephone || order.adresse || "-";
                const ref = order.referenceCommande || `#${order.id}`;
                const lines = Array.isArray(order.lignes) ? order.lignes : [];
                const thumbs = lines.slice(0, 3);
                const moreCount = Math.max(0, lines.length - 3);
                const normalizedStatus = normalizeOrderStatus(order.statutCommande);

                return (
                  <div
                    key={order.id || ref}
                    className="ordersRow"
                    style={{ animationDelay: `${index * 70}ms` }}
                  >
                    <div className="ordersCustomerCell">
                      <div className="ordersAvatar">
                        {customerName
                          .split(" ")
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((p) => p[0])
                          .join("")
                          .toUpperCase() || "U"}
                      </div>

                      <div>
                        <div className="ordersCustomerName">{customerName}</div>
                        <div className="ordersCustomerSub">{customerSub}</div>
                      </div>
                    </div>

                    <div className="ordersRef">{ref}</div>

                    <div>
                      <span className={getOrderBadgeClass(order.statutCommande)}>
                        {getOrderBadgeLabel(order.statutCommande)}
                      </span>
                    </div>

                    <div className="ordersDate">{fmt(order.dateCommande)}</div>

                    <div className="ordersDetailsCell">
                      <div className="ordersThumbGroup">
                        {thumbs.map((line, i) =>
                          line.imageUrl ? (
                            <img
                              key={`${line.id || i}-${i}`}
                              src={fullImageUrl(line.imageUrl)}
                              alt={line.articleNom || line.nomProduit || "Product"}
                              className="ordersThumb"
                            />
                          ) : (
                            <div key={`${line.id || i}-${i}`} className="ordersThumb fallback">
                              {(line.articleNom || line.nomProduit || "?")
                                .slice(0, 1)
                                .toUpperCase()}
                            </div>
                          )
                        )}
                        {moreCount > 0 ? <div className="ordersMoreThumb">+{moreCount}</div> : null}
                      </div>
                    </div>

                    <div className="ordersTotalCell">
                      <strong>{fmtPrice(order.total)}</strong>
                    </div>

                    <div className="ordersActionsCell">
                      <button
                        type="button"
                        className="admBtn mini primary"
                        onClick={() => confirmOrder(order.id)}
                        disabled={
                          busyOrderId === order.id ||
                          normalizedStatus === "CONFIRMEE" ||
                          normalizedStatus === "ANNULEE" ||
                          normalizedStatus === "LIVREE"
                        }
                      >
                        Confirm
                      </button>

                      <button
                        type="button"
                        className="admBtn mini danger"
                        onClick={() => cancelOrder(order.id)}
                        disabled={
                          busyOrderId === order.id ||
                          normalizedStatus === "ANNULEE" ||
                          normalizedStatus === "LIVREE"
                        }
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        className="admBtn mini"
                        onClick={() => reviewPayment(order.id, true)}
                        disabled={busyOrderId === order.id || order.statutPaiement === "ACCEPTE"}
                      >
                        Accept payment
                      </button>

                      <button
                        type="button"
                        className="admBtn mini danger"
                        onClick={() => reviewPayment(order.id, false)}
                        disabled={busyOrderId === order.id || order.statutPaiement === "REFUSE"}
                      >
                        Reject payment
                      </button>

                      <button
                        type="button"
                        className="admBtn mini primary"
                        onClick={() => markDelivered(order.id)}
                        disabled={
                          busyOrderId === order.id ||
                          normalizeOrderStatus(order.statutCommande) === "LIVREE"
                        }
                      >
                        Delivered
                      </button>
                    </div>

                    <div className="ordersPaymentCell">
                      <div>
                        <strong>{order.modePaiement || "-"}</strong>
                      </div>
                      <div>{order.statutPaiement || "-"}</div>
                      <div>
                        {order.cardLast4 ? `Card **** ${order.cardLast4}` : null}
                        {order.cardLast4 && (order.d17Phone || order.d17Reference || order.bankReference)
                          ? " • "
                          : null}
                        {order.d17Phone ? `D17: ${order.d17Phone}` : null}
                        {order.d17Phone && (order.d17Reference || order.bankReference) ? " • " : null}
                        {order.d17Reference ? `Ref: ${order.d17Reference}` : null}
                        {order.d17Reference && order.bankReference ? " • " : null}
                        {order.bankReference ? `Bank ref: ${order.bankReference}` : null}
                      </div>
                      <small>{order.paymentInstructions || "-"}</small>
                    </div>

                    <div className="ordersInvoiceCell">
                      <div>{order.invoiceNumber || "-"}</div>
                      {order.invoiceUrl ? (
                        <a href={fullImageUrl(order.invoiceUrl)} target="_blank" rel="noreferrer">
                          Open invoice
                        </a>
                      ) : (
                        "-"
                      )}
                    </div>

                    <div className="ordersSignatureCell">
                      {order.signatureDataUrl ? (
                        <a href={order.signatureDataUrl} target="_blank" rel="noreferrer">
                          View signature
                        </a>
                      ) : (
                        "-"
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="ordersPagination">
            <button
              type="button"
              className="ordersPageBtn"
              disabled={orderPage <= 1}
              onClick={() => setOrderPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>

            {Array.from({ length: totalOrderPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                className={`ordersPageBtn ${orderPage === p ? "active" : ""}`}
                onClick={() => setOrderPage(p)}
              >
                {p}
              </button>
            ))}

            <button
              type="button"
              className="ordersPageBtn"
              disabled={orderPage >= totalOrderPages}
              onClick={() => setOrderPage((p) => Math.min(totalOrderPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}