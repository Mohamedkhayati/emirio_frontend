// src/pages/admin/AdminLayout.jsx
import { useEffect, useMemo, useState } from "react";
import { NavLink, Navigate, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../../lib/api";
import VendeurCatalogPage from "./VendeurCatalogPage";
import CatalogPage from "./CatalogPage";
import "./admin.css";

// Helper functions
const getStoredToken = () => localStorage.getItem("token");
const getStoredRole = () => localStorage.getItem("userRole") || "";
const clearStoredAuth = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("userRole");
};
const persistAuth = (token, role) => {
  localStorage.setItem("token", token);
  localStorage.setItem("userRole", role);
};

// Normalize role to match new naming convention
const normalizeRole = (role) => {
  if (!role) return "";
  const normalized = String(role).trim();
  
  if (normalized === "ADMIN_GENERAL" || normalized === "ADMIN") return "Administrateur";
  if (normalized === "VENDEUR" || normalized === "SELLER") return "Gestionnaire de catalogue";
  if (normalized === "CONTROLEUR" || normalized === "CONTROLLER") return "Responsable e-commerce";
  if (normalized.toLowerCase() === "responsable e-commerce") return "Responsable e-commerce";
  if (normalized.toLowerCase() === "ecommerce_manager") return "Responsable e-commerce";
  
  return normalized;
};

// Role check functions
const isAdminRole = (role) => role === "Administrateur";
const isCatalogManagerRole = (role) => role === "Gestionnaire de catalogue";
const isEcommerceManagerRole = (role) => role === "Responsable e-commerce";

function SidebarLink({ to, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `adminMenuItem ${isActive ? "active" : ""}`}
    >
      {label}
    </NavLink>
  );
}

// Component to render the correct catalog page based on role
function CatalogRenderer({ isCatalogManager, isAdminGeneral, isEcommerceManager, ...props }) {
  console.log("🔍 CatalogRenderer - isCatalogManager:", isCatalogManager);
  console.log("🔍 CatalogRenderer - isAdminGeneral:", isAdminGeneral);
  
  // If user is a Catalog Manager, show VendeurCatalogPage
  if (isCatalogManager) {
    console.log("✅ Rendering VendeurCatalogPage for Catalog Manager");
    return <VendeurCatalogPage {...props} />;
  }
  
  // For Admin General or E-commerce Manager, show regular CatalogPage
  console.log("✅ Rendering regular CatalogPage");
  return <CatalogPage {...props} />;
}

export default function AdminLayout() {
  const { t, i18n } = useTranslation();
  const location = useLocation();

  const [role, setRole] = useState(getStoredRole());
  const [roleLoading, setRoleLoading] = useState(true);

  const isAdminGeneral = useMemo(() => isAdminRole(role), [role]);
  const isCatalogManager = useMemo(() => isCatalogManagerRole(role), [role]);
  const isEcommerceManager = useMemo(() => isEcommerceManagerRole(role), [role]);

  const allowedSections = useMemo(() => {
    if (isAdminGeneral) return ["customers", "workers", "catalog", "dashboard", "orders", "reclamations"];
    if (isCatalogManager) return ["catalog", "dashboard", "orders"];
    if (isEcommerceManager) return ["orders", "reclamations", "catalog"];
    return [];
  }, [isAdminGeneral, isCatalogManager, isEcommerceManager]);

  console.log("🔍 AdminLayout - Role:", role);
  console.log("🔍 AdminLayout - isCatalogManager:", isCatalogManager);
  console.log("🔍 AdminLayout - Allowed sections:", allowedSections);

  const debugAuth = () => {
    const token = localStorage.getItem("token");
    const storedRole = localStorage.getItem("userRole");
    console.log("🔍 Debug Auth - Token:", token ? `${token.substring(0, 20)}...` : "No token");
    console.log("🔍 Debug Auth - Stored role:", storedRole);
    
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        console.log("🔍 JWT Payload:", payload);
        console.log("🔍 JWT Role claim:", payload.role || payload.authorities);
      } catch (e) {
        console.error("Failed to decode token:", e);
      }
    }
  };

  useEffect(() => {
    debugAuth();
  }, []);

  const currentLang = useMemo(() => {
    const lng = i18n.resolvedLanguage || i18n.language || localStorage.getItem("language") || "en";
    if (lng.startsWith("fr")) return "fr";
    if (lng.startsWith("ar")) return "ar";
    return "en";
  }, [i18n.language, i18n.resolvedLanguage]);

  useEffect(() => {
    let mounted = true;
    async function bootstrapRole() {
      try {
        const token = getStoredToken();
        if (!token) {
          clearStoredAuth();
          if (mounted) setRole("");
          setRoleLoading(false);
          return;
        }
        
        const res = await api.get("/api/profile");
        const backendRole = res?.data?.role || "";
        const normalizedRole = normalizeRole(backendRole);
        
        console.log("🔐 AdminLayout - Raw role from backend:", backendRole);
        console.log("🔐 AdminLayout - Normalized role:", normalizedRole);
        console.log("🔐 AdminLayout - isAdminGeneral:", isAdminRole(normalizedRole));
        console.log("🔐 AdminLayout - isCatalogManager:", isCatalogManagerRole(normalizedRole));
        console.log("🔐 AdminLayout - isEcommerceManager:", isEcommerceManagerRole(normalizedRole));
        
        persistAuth(token, normalizedRole);
        if (mounted) setRole(normalizedRole);
      } catch (err) {
        console.error("Role bootstrap error:", err);
        clearStoredAuth();
        if (mounted) setRole("");
      } finally {
        if (mounted) setRoleLoading(false);
      }
    }
    bootstrapRole();
    return () => { mounted = false; };
  }, []);

  async function changeLang(lng) {
    await i18n.changeLanguage(lng);
    localStorage.setItem("language", lng);
    document.documentElement.lang = lng;
    document.documentElement.dir = i18n.dir(lng);
  }

  if (roleLoading) {
    return (
      <div className="adminLayout">
        <main className="adminContent">
          <div className="fadeInUp">
            <div className="admPage">
              <div className="admAlert">Loading...</div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!isAdminGeneral && !isCatalogManager && !isEcommerceManager) {
    return (
      <div className="adminLayout">
        <main className="adminContent">
          <div className="fadeInUp">
            <div className="admPage">
              <div className="admAlert">
                Access denied. Your role ({role || "none"}) is not allowed to open this page.
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const currentSection = location.pathname.split("/").filter(Boolean).pop();
  
  console.log("🔍 AdminLayout - Current section:", currentSection);
  console.log("🔍 AdminLayout - Pathname:", location.pathname);
  
  // Redirect root /admin to the first allowed section
  if (location.pathname === "/admin") {
    const first = allowedSections[0];
    console.log("🔍 AdminLayout - Redirecting from root to:", first);
    if (first) return <Navigate to={`/admin/${first}`} replace />;
    return <Navigate to="/" replace />;
  }
  
  // If current section is not allowed, redirect to first allowed
  if (currentSection && !allowedSections.includes(currentSection)) {
    console.log("🔍 AdminLayout - Section not allowed, redirecting to:", allowedSections[0]);
    return <Navigate to={`/admin/${allowedSections[0]}`} replace />;
  }

  function getPanelTitle() {
    if (isAdminGeneral) return "Administrator Panel";
    if (isEcommerceManager) return "E-commerce Manager Panel";
    if (isCatalogManager) return "Catalog Manager Panel";
    return "Panel";
  }

  // Context to pass to child routes
  const outletContext = {
    role,
    isAdminGeneral,
    isCatalogManager,
    isEcommerceManager,
    currentLang,
    changeLang,
    t
  };

  return (
    <div className="adminLayout">
      <aside className="adminSidebar clean">
        <div className="adminSidebarTop">
          <div className="adminBrandBlock">
            <div className="adminBrandTitle">EMIRIO</div>
            <div className="adminBrandSub">{getPanelTitle()}</div>
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
            <SidebarLink to="/admin/customers" label="Clients" />
          )}
          
          {(isAdminGeneral || isEcommerceManager) && (
            <SidebarLink to="/admin/reclamations" label="Reclamations" />
          )}
          
          {isAdminGeneral && (
            <SidebarLink to="/admin/workers" label="Workers" />
          )}
          
          {(isAdminGeneral || isCatalogManager || isEcommerceManager) && (
            <SidebarLink to="/admin/catalog" label="Catalog" />
          )}
          
          {(isAdminGeneral || isCatalogManager) && (
            <SidebarLink to="/admin/dashboard" label="Dashboard" />
          )}

          {(isAdminGeneral || isEcommerceManager || isCatalogManager) && (
            <SidebarLink to="/admin/orders" label="Orders" />
          )}
        </div>
      </aside>
      
      <main className="adminContent">
        <Outlet context={outletContext} />
      </main>
    </div>
  );
}