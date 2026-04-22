export default function AdminSidebar({
  me,  // Pass the user object instead of individual flags
  currentLang,
  changeLang,
  t,
  section,
  setSection,
}) {
  const role = me?.role;
  
  // Determine role-based access
  const isAdministrateur = role === "Administrateur";
  const isGestionnaireCatalogue = role === "Gestionnaire de catalogue";
  const isResponsableEcommerce = role === "Responsable e-commerce";
  
  // Determine panel title
  const getPanelTitle = () => {
    if (isAdministrateur) return "Admin General Panel";
    if (isResponsableEcommerce) return "E-commerce Manager Panel";
    if (isGestionnaireCatalogue) return "Catalog Manager Panel";
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
        {isAdministrateur && (
          <button
            className={`adminMenuItem ${section === "customers" ? "active" : ""}`}
            onClick={() => setSection("customers")}
          >
            Customers
          </button>
        )}

        {/* Workers - ONLY Administrateur (add this if you have workers page) */}
        {isAdministrateur && (
          <button
            className={`adminMenuItem ${section === "workers" ? "active" : ""}`}
            onClick={() => setSection("workers")}
          >
            Workers
          </button>
        )}

        {/* Catalog - Administrateur OR Gestionnaire de catalogue */}
        {(isAdministrateur || isGestionnaireCatalogue) && (
          <button
            className={`adminMenuItem ${section === "catalog" ? "active" : ""}`}
            onClick={() => setSection("catalog")}
          >
            Catalog
          </button>
        )}

        {/* Dashboard - ONLY Administrateur */}
        {isAdministrateur && (
          <button
            className={`adminMenuItem ${section === "dashboard" ? "active" : ""}`}
            onClick={() => setSection("dashboard")}
          >
            Dashboard
          </button>
        )}

        {/* Orders - Administrateur OR Responsable e-commerce */}
        {(isAdministrateur || isResponsableEcommerce) && (
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