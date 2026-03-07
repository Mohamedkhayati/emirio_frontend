import { useState } from "react";
import AdminCustomersPage from "./AdminCustomersPage";
import AdminCatalogPage from "./AdminCatalogPage";
import "./admin.css";

export default function AdminShell() {
  const [section, setSection] = useState("customers");

  return (
    <div className="adminLayout">
      <aside className="adminSidebar">
        <div className="adminBrand">
          <div className="adminLogo">E</div>
          <div>
            <div className="adminBrandName">Emirio</div>
            <div className="adminBrandSub">Admin Panel</div>
          </div>
        </div>

        <div className="adminMenu">
          <button
            className={`adminMenuItem ${section === "customers" ? "active" : ""}`}
            onClick={() => setSection("customers")}
          >
            Customer List
          </button>

          <button
            className={`adminMenuItem ${section === "catalog" ? "active" : ""}`}
            onClick={() => setSection("catalog")}
          >
            Manage Catalog
          </button>
        </div>
      </aside>

      <main className="adminContent">
        {section === "customers" && <AdminCustomersPage />}
        {section === "catalog" && <AdminCatalogPage />}
      </main>
    </div>
  );
}
