// src/pages/admin/VendeurDashboardPage.jsx
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { api } from "../../lib/api";
import { Chart } from "primereact/chart";
import { fmtPrice } from "./adminShared";

export default function VendeurDashboardPage() {
const { isCatalogManager, isAdminGeneral } = useOutletContext();
const isVendeur = isCatalogManager || isAdminGeneral;
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Chart data states
  const [topArticlesChartData, setTopArticlesChartData] = useState(null);
  const [topCategoriesChartData, setTopCategoriesChartData] = useState(null);
  const [chartOptions, setChartOptions] = useState({});

  useEffect(() => {
    const documentStyle = getComputedStyle(document.documentElement);
    setChartOptions({
      plugins: { legend: { labels: { usePointStyle: true, color: documentStyle.getPropertyValue('--text-color') } } },
      maintainAspectRatio: false,
    });
  }, []);

  async function loadDashboard() {
    if (!isVendeur) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/api/vendeur/dashboard/stats");
      const data = res.data;
      setStats(data);

      // Prepare top articles pie chart
      if (data.topArticles?.length) {
        const labels = data.topArticles.map(a => a.articleNom);
        const values = data.topArticles.map(a => a.totalQuantitySold);
        const bgColors = ['#5b5ef7', '#7c3aed', '#f59e0b', '#10b981', '#ef4444'];
        setTopArticlesChartData({
          labels,
          datasets: [{ data: values, backgroundColor: bgColors.slice(0, values.length), hoverBackgroundColor: bgColors.map(c => c + 'cc') }]
        });
      } else {
        setTopArticlesChartData(null);
      }

      // Prepare top categories doughnut chart
      if (data.topCategories?.length) {
        const labels = data.topCategories.map(c => c.categoryNom);
        const values = data.topCategories.map(c => c.totalQuantitySold);
        const bgColors = ['#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
        setTopCategoriesChartData({
          labels,
          datasets: [{ data: values, backgroundColor: bgColors.slice(0, values.length), hoverBackgroundColor: bgColors.map(c => c + 'cc') }]
        });
      } else {
        setTopCategoriesChartData(null);
      }
    } catch (e) {
      setError(e?.response?.data?.message || "Cannot load dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, [isVendeur]);

  if (!isVendeur) return <div className="admAlert">Access denied</div>;

  return (
    <div className="fadeInUp">
      <div className="admPage">
        <div className="admHeader">
          <div><div className="admH1">Seller Dashboard</div><div className="admH2">Your sales performance</div></div>
          <button className="admBtn" onClick={loadDashboard}>Refresh</button>
        </div>
        {error && <div className="admAlert">{error}</div>}
        {loading && <div className="admEmpty">Loading dashboard...</div>}
        {stats && !loading && (
          <>
            <div className="dashboardTopGrid">
              <div className="admCard statCard"><div>Total Sales</div><div className="statValue">{fmtPrice(stats.totalSales)}</div></div>
              <div className="admCard statCard"><div>Total Orders</div><div className="statValue">{stats.totalOrders}</div></div>
              <div className="admCard statCard"><div>Items Sold</div><div className="statValue">{stats.totalItemsSold}</div></div>
              <div className="admCard statCard"><div>Products on Sale</div><div className="statValue">—</div></div>
            </div>
            <div className="admGrid" style={{ gridTemplateColumns: "1fr 1fr", gap: "18px" }}>
              <div className="admCard">
                <div className="admCardTop"><div className="admCardTitle">Top Selling Articles</div></div>
                <div className="admDialogBody" style={{ padding: "16px" }}>
                  {topArticlesChartData ? <Chart type="pie" data={topArticlesChartData} options={chartOptions} style={{ height: "280px" }} /> : <div className="admEmpty">No data</div>}
                </div>
              </div>
              <div className="admCard">
                <div className="admCardTop"><div className="admCardTitle">Top Categories</div></div>
                <div className="admDialogBody" style={{ padding: "16px" }}>
                  {topCategoriesChartData ? <Chart type="doughnut" data={topCategoriesChartData} options={{ ...chartOptions, cutout: "60%" }} style={{ height: "280px" }} /> : <div className="admEmpty">No data</div>}
                </div>
              </div>
            </div>
            <div className="admCard">
              <div className="admCardTop"><div className="admCardTitle">Best Selling Articles (details)</div></div>
              <div className="adminDataTableWrap">
                <table className="adminDataTable">
                  <thead><tr><th>Article</th><th>Quantity Sold</th><th>Revenue</th></tr></thead>
                  <tbody>
                    {stats.topArticles?.map((a, i) => (
                      <tr key={a.articleId}><td>{a.articleNom}</td><td>{a.totalQuantitySold}</td><td>{fmtPrice(a.totalRevenue)}</td></tr>
                    ))}
                    {(!stats.topArticles || stats.topArticles.length === 0) && <tr><td colSpan="3"><div className="admEmpty">No sales yet</div></td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}