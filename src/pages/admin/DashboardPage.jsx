import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Chart } from 'primereact/chart';
import { api } from "../../lib/api";

// ---------- Chart Components ----------
function SalesChart({ labels, sales }) {
  const [data, setData] = useState({});
  const [options, setOptions] = useState({});

  useEffect(() => {
    const docStyle = getComputedStyle(document.documentElement);
    const textColor = docStyle.getPropertyValue('--text-color');
    const surfaceBorder = docStyle.getPropertyValue('--surface-border');
    setData({
      labels: labels,
      datasets: [{
        label: 'Sales (€)',
        data: sales,
        fill: true,
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: docStyle.getPropertyValue('--blue-500'),
        tension: 0.4
      }]
    });
    setOptions({
      maintainAspectRatio: false,
      aspectRatio: 0.8,
      plugins: { legend: { labels: { color: textColor } } },
      scales: {
        x: { ticks: { color: textColor }, grid: { color: surfaceBorder } },
        y: { ticks: { color: textColor }, grid: { color: surfaceBorder } }
      }
    });
  }, [labels, sales]);

  return <Chart type="line" data={data} options={options} style={{ height: '300px' }} />;
}

function HorizontalBarChart({ title, items, valueLabel = 'Revenue (€)' }) {
  const [data, setData] = useState({});
  useEffect(() => {
    const docStyle = getComputedStyle(document.documentElement);
    setData({
      labels: items.map(i => i.name),
      datasets: [{
        label: valueLabel,
        data: items.map(i => i.revenue),
        backgroundColor: docStyle.getPropertyValue('--blue-500'),
        borderRadius: 5
      }]
    });
  }, [items, valueLabel]);

  const options = {
    indexAxis: 'y',
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } }
  };
  return (
    <div className="admCard">
      <div className="admCardTitle">{title}</div>
      {items.length === 0 ? <div className="admAlert">No data</div> : <Chart type="bar" data={data} options={options} style={{ height: '300px' }} />}
    </div>
  );
}

function DoughnutChart({ title, labels, dataValues, colors }) {
  const [data, setData] = useState({});
  useEffect(() => {
    const docStyle = getComputedStyle(document.documentElement);
    const colorPalette = colors || ['--blue-500', '--green-500', '--yellow-500', '--orange-500', '--pink-500', '--purple-500'];
    setData({
      labels: labels,
      datasets: [{
        data: dataValues,
        backgroundColor: colorPalette.slice(0, labels.length).map(c => docStyle.getPropertyValue(c)),
        hoverOffset: 10
      }]
    });
  }, [labels, dataValues, colors]);

  return (
    <div className="admCard">
      <div className="admCardTitle">{title}</div>
      {labels.length === 0 ? <div className="admAlert">No data</div> : <Chart type="doughnut" data={data} style={{ height: '250px' }} />}
    </div>
  );
}

// ---------- Main Dashboard ----------
export default function DashboardPage() {
  const { isAdminGeneral } = useOutletContext();

  const [visits, setVisits] = useState({ totalVisits: 0, visitsToday: 0, visitsLast30Days: 0 });
  const [ordersStats, setOrdersStats] = useState({ totalOrders: 0, totalRevenue: 0, averageOrderValue: 0 });
  const [dailySales, setDailySales] = useState({ labels: [], sales: [] });
  const [topArticles, setTopArticles] = useState([]);
  const [topCategories, setTopCategories] = useState([]);
  const [ordersByStatus, setOrdersByStatus] = useState({ labels: [], data: [] });
  const [paymentStatus, setPaymentStatus] = useState({ labels: [], data: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const safeGet = async (url, fallback) => {
    try {
      const res = await api.get(url);
      return res.data;
    } catch (e) {
      console.error(`Error fetching ${url}:`, e.response?.data || e.message);
      return fallback;
    }
  };

  async function loadStats() {
    if (!isAdminGeneral) return;
    setLoading(true);
    setError("");

    const visitsData = await safeGet("/api/admin/stats/visits", { totalVisits: 0, visitsToday: 0, visitsLast30Days: 0 });
    const ordersData = await safeGet("/api/admin/stats/orders", { totalOrders: 0, totalRevenue: 0, averageOrderValue: 0, ordersByStatus: {}, ordersByPaymentStatus: {} });
    const salesData = await safeGet("/api/admin/stats/sales-daily?days=30", { labels: [], sales: [] });
    const topArticlesData = await safeGet("/api/admin/stats/top-articles?limit=5", []);
    const topCategoriesData = await safeGet("/api/admin/stats/top-categories?limit=5", []);

    setVisits(visitsData);
    setOrdersStats({
      totalOrders: ordersData.totalOrders,
      totalRevenue: ordersData.totalRevenue,
      averageOrderValue: ordersData.averageOrderValue
    });
    setOrdersByStatus({
      labels: Object.keys(ordersData.ordersByStatus || {}),
      data: Object.values(ordersData.ordersByStatus || {})
    });
    setPaymentStatus({
      labels: Object.keys(ordersData.ordersByPaymentStatus || {}),
      data: Object.values(ordersData.ordersByPaymentStatus || {})
    });
    setDailySales({ labels: salesData.labels || [], sales: salesData.sales || [] });
    setTopArticles(topArticlesData);
    setTopCategories(topCategoriesData);
    setLoading(false);
  }

  useEffect(() => {
    loadStats();
  }, [isAdminGeneral]);

  if (!isAdminGeneral) {
    return (
      <div className="fadeInUp">
        <div className="admPage">
          <div className="admAlert">Access denied.</div>
        </div>
      </div>
    );
  }

  if (loading) return <div className="admPage">Loading dashboard...</div>;

  return (
    <div className="fadeInUp">
      <div className="admPage">
        <div className="admHeader">
          <div className="admH1">Dashboard</div>
          <div className="admH2">Complete Analytics</div>
        </div>

        {error && <div className="admAlert">{error}</div>}

        {/* KPI Cards */}
        <div className="admGrid dashboardTopGrid">
          <div className="admCard statCard"><div className="admCardTitle">Total visits</div><div className="statValue">{visits.totalVisits}</div></div>
          <div className="admCard statCard"><div className="admCardTitle">Visits today</div><div className="statValue">{visits.visitsToday}</div></div>
          <div className="admCard statCard"><div className="admCardTitle">Orders</div><div className="statValue">{ordersStats.totalOrders}</div></div>
          <div className="admCard statCard"><div className="admCardTitle">Revenue (€)</div><div className="statValue">{ordersStats.totalRevenue.toFixed(2)}</div></div>
          <div className="admCard statCard"><div className="admCardTitle">Avg order value</div><div className="statValue">{ordersStats.averageOrderValue.toFixed(2)} €</div></div>
        </div>

        {/* Daily Sales Line Chart */}
        <div className="admCard">
          <div className="admCardTitle">Daily Sales (last 30 days)</div>
          {dailySales.labels.length === 0 ? <div className="admAlert">No sales data</div> : <SalesChart labels={dailySales.labels} sales={dailySales.sales} />}
        </div>

        {/* Two doughnut charts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <DoughnutChart title="Orders by Status" labels={ordersByStatus.labels} dataValues={ordersByStatus.data} />
          <DoughnutChart title="Payment Status" labels={paymentStatus.labels} dataValues={paymentStatus.data} colors={['--green-500','--red-500','--orange-500']} />
        </div>

        {/* Top Articles & Categories */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <HorizontalBarChart title="Top 5 Selling Articles" items={topArticles} valueLabel="Revenue (€)" />
          <HorizontalBarChart title="Top 5 Categories by Revenue" items={topCategories} valueLabel="Revenue (€)" />
        </div>
      </div>
    </div>
  );
}