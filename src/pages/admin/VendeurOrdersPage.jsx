// src/pages/admin/VendeurOrdersPage.jsx
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { api } from "../../lib/api";
import { fmt, fmtPrice, fullImageUrl, getOrderBadgeClass, getOrderBadgeLabel } from "./adminShared";

export default function VendeurOrdersPage() {
 const { isEcommerceManager, isAdminGeneral, isCatalogManager } = useOutletContext();
   const isVendeur = isEcommerceManager || isAdminGeneral || isCatalogManager;

   const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  async function loadOrders() {
    if (!isVendeur) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/api/vendeur/orders");
      setOrders(res.data || []);
    } catch (e) {
      setError(e?.response?.data?.message || "Cannot load orders");
    } finally {
      setLoading(false);
    }
  }

  async function openHistory(order) {
    setSelectedOrder(order);
    setHistoryOpen(true);
    setHistoryLoading(true);
    try {
      const res = await api.get(`/api/vendeur/orders/${order.id}/actions`); // optional, we may not have this endpoint yet
      setHistoryItems(res.data || []);
    } catch {
      setHistoryItems([]);
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, [isVendeur]);

  const filteredOrders = orders.filter(o => {
    const q = search.toLowerCase();
    const customer = `${o.prenomClient} ${o.nomClient}`.toLowerCase();
    const ref = o.referenceCommande.toLowerCase();
    return customer.includes(q) || ref.includes(q);
  });

  if (!isVendeur) return <div className="admAlert">Access denied</div>;

  return (
    <div className="fadeInUp">
      <div className="admPage ordersPage">
        <div className="ordersHero">
          <div><div className="admH1">My Orders</div><div className="admH2">Orders containing your products</div></div>
          <div className="ordersHeroActions"><button className="admBtn" onClick={loadOrders}>Refresh</button></div>
        </div>
        {error && <div className="admAlert">{error}</div>}
        <div className="ordersShell">
          <div className="ordersTopBar">
            <div className="ordersSearchBox"><span className="ordersSearchIcon">⌕</span><input className="ordersSearchInput" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by customer or order #" /></div>
          </div>
          <div className="ordersTable">
            <div className="ordersTableHead"><div>Customer</div><div>Order #</div><div>Status</div><div>Date</div><div>Products</div><div>Total</div><div>Actions</div></div>
            {loading ? <div className="ordersEmpty">Loading orders...</div> : !filteredOrders.length ? <div className="ordersEmpty">No orders found.</div> : filteredOrders.map(order => {
              const customerName = `${order.prenomClient || ""} ${order.nomClient || ""}`.trim() || "Unknown";
              const lines = order.lignesVendeur || order.lignes || [];
              const thumbs = lines.slice(0, 3);
              const moreCount = lines.length - 3;
              return (
                <div key={order.id} className="ordersRow">
                  <div className="ordersCustomerCell"><div className="ordersAvatar">{customerName.slice(0,2).toUpperCase()}</div><div><div className="ordersCustomerName">{customerName}</div><div className="ordersCustomerSub">{order.emailClient}</div></div></div>
                  <div className="ordersRef">{order.referenceCommande}</div>
                  <div><span className={getOrderBadgeClass(order.statutCommande)}>{getOrderBadgeLabel(order.statutCommande)}</span></div>
                  <div className="ordersDate">{fmt(order.dateCommande)}</div>
                  <div className="ordersDetailsCell"><div className="ordersThumbGroup">{thumbs.map((line, i) => line.imageUrl ? <img key={i} src={fullImageUrl(line.imageUrl)} className="ordersThumb" alt="" /> : <div key={i} className="ordersThumb fallback">{line.articleNom?.slice(0,1)}</div>)}{moreCount > 0 && <div className="ordersMoreThumb">+{moreCount}</div>}</div></div>
                  <div className="ordersTotalCell"><strong>{fmtPrice(order.total)}</strong></div>
                  <div className="ordersActionsCell"><button className="admBtn mini" onClick={() => openHistory(order)}>History</button></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {historyOpen && (
        <div className="ordersHistoryOverlay" onClick={() => setHistoryOpen(false)}>
          <div className="ordersHistoryModal" onClick={e => e.stopPropagation()}>
            <div className="ordersHistoryHead"><div><h3>Order history</h3><p>{selectedOrder?.referenceCommande}</p></div><button className="admBtn mini" onClick={() => setHistoryOpen(false)}>Close</button></div>
            {historyLoading ? <div className="ordersEmpty">Loading history...</div> : !historyItems.length ? <div className="ordersEmpty">No history found.</div> : (
              <div className="ordersHistoryList">{historyItems.map(item => (<div key={item.id} className="ordersHistoryItem"><div className="ordersHistoryDot" /><div className="ordersHistoryContent"><div className="ordersHistoryTop"><strong>{item.typeAction}</strong><span>{fmt(item.dateAction)}</span></div><div className="ordersHistoryMeta">{item.ancienStatut && <span>From: {item.ancienStatut}</span>}{item.nouveauStatut && <span>To: {item.nouveauStatut}</span>}</div><div className="ordersHistoryDetails">{item.details}</div></div></div>))}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}