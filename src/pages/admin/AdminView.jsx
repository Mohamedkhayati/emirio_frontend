// src/pages/admin/AdminSidebar.jsx
export default function AdminSidebar({
  isAdminGeneral,
  isCatalogManager,
  isEcommerceManager,
  currentLang,
  changeLang,
  t,
  section,
  setSection,
}) {
  // Determine panel title
  const getPanelTitle = () => {
    if (isAdminGeneral) return t("admin.panelTitle.general") || "Administrator Panel";
    if (isEcommerceManager) return t("admin.panelTitle.ecommerce") || "E-commerce Manager Panel";
    if (isCatalogManager) return t("admin.panelTitle.catalog") || "Catalog Manager Panel";
    return t("admin.panelTitle.default") || "Panel";
  };

  return (
    <aside className="adminSidebar clean">
      <div className="adminSidebarTop">
        <div className="adminBrandBlock">
          <div className="adminBrandTitle">EMIRIO</div>
          <div className="adminBrandSub">
            {getPanelTitle()}
          </div>
        </div>

        <div className="adminLangBox">
          <label className="adminLangLabel" htmlFor="admin-language">
            {t("admin.language") || "Language"}
          </label>

          <select
            id="admin-language"
            className="adminLangSelect"
            value={currentLang}
            onChange={(e) => changeLang(e.target.value)}
          >
            <option value="en">English</option>
            <option value="fr">Français</option>
            <option value="ar">العربية</option>
          </select>
        </div>
      </div>

      <div className="adminMenu onlyMenu">
        {/* Customers - ONLY Administrateur */}
        {isAdminGeneral && (
          <button
            className={`adminMenuItem ${section === "customers" ? "active" : ""}`}
            onClick={() => setSection("customers")}>
            {t("admin.menu.customers") || "Clients"}
          </button>
        )}

        {/* Workers - ONLY Administrateur */}
        {isAdminGeneral && (
          <button
            className={`adminMenuItem ${section === "workers" ? "active" : ""}`}
            onClick={() => setSection("workers")}>
            {t("admin.menu.workers") || "Workers"}
          </button>
        )}

        {/* Reclamations - Admin and E-commerce Manager */}
        {(isAdminGeneral || isEcommerceManager) && (
          <button
            className={`adminMenuItem ${section === "reclamations" ? "active" : ""}`}
            onClick={() => setSection("reclamations")}>
            {t("admin.menu.reclamations") || "Reclamations"}
          </button>
        )}

        {/* Catalog - ALL THREE ROLES */}
        {(isAdminGeneral || isCatalogManager || isEcommerceManager) && (
          <button
            className={`adminMenuItem ${section === "catalog" ? "active" : ""}`}
            onClick={() => setSection("catalog")}>
            {t("admin.menu.catalog") || "Catalog"}
          </button>
        )}

        {/* Dashboard - ONLY Administrateur */}
        {isAdminGeneral && (
          <button
            className={`adminMenuItem ${section === "dashboard" ? "active" : ""}`}
            onClick={() => setSection("dashboard")}>
            {t("admin.menu.dashboard") || "Dashboard"}
          </button>
        )}

        {/* Orders - ALL THREE ROLES */}
        {(isAdminGeneral || isCatalogManager || isEcommerceManager) && (
          <button
            className={`adminMenuItem ${section === "orders" ? "active" : ""}`}
            onClick={() => setSection("orders")}>
            {t("admin.menu.orders") || "Orders"}
          </button>
        )}
      </div>
    </aside>
  );
}