import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { api } from "../../lib/api";

export default function DashboardPage() {
  const { isAdminGeneral } = useOutletContext();

  const [rows, setRows] = useState([]);
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [catalogError, setCatalogError] = useState("");

  const [recConfig, setRecConfig] = useState({
    strategy: "HYBRID",
    favoriteWeight: 5,
    clickWeight: 3,
    oldArticleWeight: 1,
    bestSellerWeight: 4,
    oldArticleDays: 120,
    limitCount: 12,
  });

  async function loadRecommendationConfig() {
    if (!isAdminGeneral) return;
    try {
      const res = await api.get("/api/admin/recommendation-config");
      if (res?.data) {
        setRecConfig({
          strategy: res.data.strategy || "HYBRID",
          favoriteWeight: res.data.favoriteWeight ?? 5,
          clickWeight: res.data.clickWeight ?? 3,
          oldArticleWeight: res.data.oldArticleWeight ?? 1,
          bestSellerWeight: res.data.bestSellerWeight ?? 4,
          oldArticleDays: res.data.oldArticleDays ?? 120,
          limitCount: res.data.limitCount ?? 12,
        });
      }
    } catch {}
  }

  async function saveRecommendationConfig() {
    if (!isAdminGeneral) return;
    try {
      await api.put("/api/admin/recommendation-config", recConfig);
    } catch (e) {
      setCatalogError(e?.response?.data?.message || "Save recommendation config failed");
    }
  }

  async function loadDashboardData() {
    if (!isAdminGeneral) return;
    setCatalogError("");
    try {
      const [clientsRes, articlesRes, categoriesRes] = await Promise.all([
        api.get("/api/admin/clients"),
        api.get("/api/admin/articles"),
        api.get("/api/admin/categories"),
      ]);
      setRows(Array.isArray(clientsRes.data) ? clientsRes.data : []);
      setArticles(Array.isArray(articlesRes.data) ? articlesRes.data : []);
      setCategories(Array.isArray(categoriesRes.data) ? categoriesRes.data : []);
    } catch (e) {
      setCatalogError(e?.response?.data?.message || e.message || "Cannot load dashboard");
    }
  }

  useEffect(() => {
    loadDashboardData();
    loadRecommendationConfig();
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

  return (
    <div className="fadeInUp">
      <div className="admPage">
        <div className="admHeader">
          <div>
            <div className="admH1">Dashboard</div>
            <div className="admH2">Store overview</div>
          </div>
        </div>

        {catalogError && <div className="admAlert">{catalogError}</div>}

        <div className="admGrid dashboardTopGrid">
          <div className="admCard statCard">
            <div className="admCardTitle">Customers</div>
            <div className="statValue">{rows.length}</div>
          </div>

          <div className="admCard statCard">
            <div className="admCardTitle">Articles</div>
            <div className="statValue">{articles.length}</div>
          </div>

          <div className="admCard statCard">
            <div className="admCardTitle">Categories</div>
            <div className="statValue">{categories.length}</div>
          </div>

          <div className="admCard statCard">
            <div className="admCardTitle">Recommended</div>
            <div className="statValue">{articles.filter((a) => !!a.recommended).length}</div>
          </div>
        </div>

        <div className="admCard">
          <div className="admCardTop">
            <div className="admCardTitle">Recommendation Settings</div>
            <button className="admBtn primary" onClick={saveRecommendationConfig}>
              Save
            </button>
          </div>

          <div className="productForm admDialogBody">
            <label>
              <span>Strategy</span>
              <select
                value={recConfig.strategy}
                onChange={(e) => setRecConfig({ ...recConfig, strategy: e.target.value })}
              >
                <option value="FAVORITE_CATEGORY">Favorite category</option>
                <option value="CLICK_CATEGORY">Click category</option>
                <option value="OLD_ARTICLES">Old articles</option>
                <option value="BEST_SELLERS">Best sellers</option>
                <option value="HYBRID">Hybrid</option>
              </select>
            </label>

            <label>
              <span>Favorite weight</span>
              <input
                type="number"
                value={recConfig.favoriteWeight}
                onChange={(e) =>
                  setRecConfig({ ...recConfig, favoriteWeight: Number(e.target.value) })
                }
              />
            </label>

            <label>
              <span>Click weight</span>
              <input
                type="number"
                value={recConfig.clickWeight}
                onChange={(e) =>
                  setRecConfig({ ...recConfig, clickWeight: Number(e.target.value) })
                }
              />
            </label>

            <label>
              <span>Old article weight</span>
              <input
                type="number"
                value={recConfig.oldArticleWeight}
                onChange={(e) =>
                  setRecConfig({ ...recConfig, oldArticleWeight: Number(e.target.value) })
                }
              />
            </label>

            <label>
              <span>Best seller weight</span>
              <input
                type="number"
                value={recConfig.bestSellerWeight}
                onChange={(e) =>
                  setRecConfig({ ...recConfig, bestSellerWeight: Number(e.target.value) })
                }
              />
            </label>

            <label>
              <span>Old article days</span>
              <input
                type="number"
                value={recConfig.oldArticleDays}
                onChange={(e) =>
                  setRecConfig({ ...recConfig, oldArticleDays: Number(e.target.value) })
                }
              />
            </label>

            <label>
              <span>Limit</span>
              <input
                type="number"
                value={recConfig.limitCount}
                onChange={(e) =>
                  setRecConfig({ ...recConfig, limitCount: Number(e.target.value) })
                }
              />
            </label>
          </div>
        </div>

        <div className="admCard powerbiCard">
          <div className="admCardTop">
            <div className="admCardTitle">Power BI</div>
          </div>

          <iframe
            title="Power BI Dashboard"
            src="PASTE_YOUR_POWER_BI_EMBED_URL_HERE"
            width="100%"
            height="720"
            frameBorder="0"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}