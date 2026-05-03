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
    if (isAdminGeneral) return "Admin General Panel";
    if (isEcommerceManager) return "E-commerce Manager Panel";
    if (isCatalogManager) return "Catalog Manager Panel";
    return "Panel";
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
            onClick={() => setSection("customers")}
          >
            Customers
          </button>
        )}

        {/* Workers - ONLY Administrateur */}
        {isAdminGeneral && (
          <button
            className={`adminMenuItem ${section === "workers" ? "active" : ""}`}
            onClick={() => setSection("workers")}
          >
            Workers
          </button>
        )}

        {/* Reclamations - Admin and E-commerce Manager */}
        {(isAdminGeneral || isEcommerceManager) && (
          <button
            className={`adminMenuItem ${section === "reclamations" ? "active" : ""}`}
            onClick={() => setSection("reclamations")}
          >
            Reclamations
          </button>
        )}

        {/* Catalog - ALL THREE ROLES */}
        {(isAdminGeneral || isCatalogManager || isEcommerceManager) && (
          <button
            className={`adminMenuItem ${section === "catalog" ? "active" : ""}`}
            onClick={() => setSection("catalog")}
          >
            Catalog
          </button>
        )}

        {/* Dashboard - ONLY Administrateur */}
        {isAdminGeneral && (
          <button
            className={`adminMenuItem ${section === "dashboard" ? "active" : ""}`}
            onClick={() => setSection("dashboard")}
          >
            Dashboard
          </button>
        )}

        {/* Orders - ALL THREE ROLES */}
        {(isAdminGeneral || isCatalogManager || isEcommerceManager) && (
          <button
            className={`adminMenuItem ${section === "orders" ? "active" : ""}`}
            onClick={() => setSection("orders")}
          >
            Orders
          </button>
        )}
      </div>
    </aside>
  );
}