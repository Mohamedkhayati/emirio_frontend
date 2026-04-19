export default function AdminSidebar({
  isAdminGeneral,
  isVendeur,      // ← ADD THIS
  isControleur,   // ← ADD THIS
  currentLang,
  changeLang,
  t,
  section,
  setSection,
}) {
  // Determine panel title
  const getPanelTitle = () => {
    if (isAdminGeneral) return "Admin General Panel";
    if (isControleur) return "Order Controller Panel";
    if (isVendeur) return "Vendeur Panel";
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
        {/* Customers - ONLY Admin General */}
        {isAdminGeneral && (
          <button
            className={`adminMenuItem ${section === "customers" ? "active" : ""}`}
            onClick={() => setSection("customers")}
          >
            Customers
          </button>
        )}

        {/* Catalog - Admin General OR Vendeur (NOT Controleur) */}
        {(isAdminGeneral || isVendeur) && !isControleur && (
          <button
            className={`adminMenuItem ${section === "catalog" ? "active" : ""}`}
            onClick={() => setSection("catalog")}
          >
            Catalog
          </button>
        )}

        {/* Dashboard - ONLY Admin General */}
        {isAdminGeneral && (
          <button
            className={`adminMenuItem ${section === "dashboard" ? "active" : ""}`}
            onClick={() => setSection("dashboard")}
          >
            Dashboard
          </button>
        )}

        {/* Orders - Admin General OR Controleur */}
        {(isAdminGeneral || isControleur) && (
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