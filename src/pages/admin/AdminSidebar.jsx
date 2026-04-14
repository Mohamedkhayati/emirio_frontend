export default function AdminSidebar({
  isAdminGeneral,
  currentLang,
  changeLang,
  t,
  section,
  setSection,
}) {
  return (
    <aside className="adminSidebar clean">
      <div className="adminSidebarTop">
        <div className="adminBrandBlock">
          <div className="adminBrandTitle">EMIRIO</div>
          <div className="adminBrandSub">
            {isAdminGeneral ? "Admin General Panel" : "Vendeur Panel"}
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
        {isAdminGeneral && (
          <button
            className={`adminMenuItem ${section === "customers" ? "active" : ""}`}
            onClick={() => setSection("customers")}
          >
            Customers
          </button>
        )}

        <button
          className={`adminMenuItem ${section === "catalog" ? "active" : ""}`}
          onClick={() => setSection("catalog")}
        >
          Catalog
        </button>

        {isAdminGeneral && (
          <button
            className={`adminMenuItem ${section === "dashboard" ? "active" : ""}`}
            onClick={() => setSection("dashboard")}
          >
            Dashboard
          </button>
        )}

        {isAdminGeneral && (
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