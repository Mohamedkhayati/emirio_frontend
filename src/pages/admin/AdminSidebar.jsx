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
  if (isAdminGeneral) return t("admin.panelTitle.general");
  if (isEcommerceManager) return t("admin.panelTitle.ecommerce");
  if (isCatalogManager) return t("admin.panelTitle.catalog");
  return t("admin.panelTitle.default");
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
  {t("admin.menu.customers")}
</button>

        )}

        {/* Workers - ONLY Administrateur */}
        {isAdminGeneral && (
          <button
            className={`adminMenuItem ${section === "workers" ? "active" : ""}`}
            onClick={() => setSection("workers")}>
  {t("admin.menu.workers")}
</button>

        )}

        {/* Reclamations - Admin and E-commerce Manager */}
        {(isAdminGeneral || isEcommerceManager) && (
          <button
            className={`adminMenuItem ${section === "reclamations" ? "active" : ""}`}
            onClick={() => setSection("reclamations")}>
  {t("admin.menu.reclamations")}
</button>
        )}

        {/* Catalog - ALL THREE ROLES */}
        {(isAdminGeneral || isCatalogManager || isEcommerceManager) && (
          <button
            className={`adminMenuItem ${section === "catalog" ? "active" : ""}`}
             onClick={() => setSection("catalog")}>
  {t("admin.menu.catalog")}
</button>
        )}

        {/* Dashboard - ONLY Administrateur */}
        {isAdminGeneral && (
          <button
            className={`adminMenuItem ${section === "dashboard" ? "active" : ""}`}
            onClick={() => setSection("dashboard")}>
  {t("admin.menu.dashboard")}
</button>
        )}

        {/* Orders - ALL THREE ROLES */}
        {(isAdminGeneral || isCatalogManager || isEcommerceManager) && (
          <button
            className={`adminMenuItem ${section === "orders" ? "active" : ""}`}
            onClick={() => setSection("orders")}>
  {t("admin.menu.orders")}
</button>
        )}
      </div>
    </aside>
  );
}