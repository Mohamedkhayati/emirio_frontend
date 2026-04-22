// src/pages/admin/AdminLayout.jsx
import { useEffect, useMemo, useState } from "react";
import { NavLink, Navigate, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../../lib/api";
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
  
  // Map old roles to new ones if needed
  if (normalized === "ADMIN_GENERAL" || normalized === "ADMIN") return "Administrateur";
  if (normalized === "VENDEUR" || normalized === "SELLER") return "Gestionnaire de catalogue";
  if (normalized === "CONTROLEUR" || normalized === "CONTROLLER") return "Responsable e-commerce";
  
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

export default function AdminLayout() {
  const { t, i18n } = useTranslation();
  const location = useLocation();

  const [role, setRole] = useState(getStoredRole());
  const [roleLoading, setRoleLoading] = useState(true);

  const isAdminGeneral = useMemo(() => isAdminRole(role), [role]);
  const isCatalogManager = useMemo(() => isCatalogManagerRole(role), [role]);
  const isEcommerceManager = useMemo(() => isEcommerceManagerRole(role), [role]);

  const allowedSections = useMemo(() => {
    if (isAdminGeneral) return ["customers", "workers", "catalog", "dashboard", "orders"];
    // ✅ Give Catalog Manager access to catalog, dashboard, and orders
    if (isCatalogManager) return ["catalog", "dashboard", "orders"]; 
    if (isEcommerceManager) return ["orders"];
    return [];
  }, [isAdminGeneral, isCatalogManager, isEcommerceManager]);

  // Add this function to debug token and role
  const debugAuth = () => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");
    console.log("🔍 Debug Auth - Token:", token ? `${token.substring(0, 20)}...` : "No token");
    console.log("🔍 Debug Auth - Stored role:", role);
    
    // Decode JWT token to see what's inside
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

  // Call this in useEffect
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

  // If no valid role, deny access
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
  
  // Redirect root /admin to the first allowed section
  if (location.pathname === "/admin") {
    const first = allowedSections[0];
    if (first) return <Navigate to={`/admin/${first}`} replace />;
    return <Navigate to="/" replace />;
  }
  
  // If current section is not allowed, redirect to first allowed
  if (currentSection && !allowedSections.includes(currentSection)) {
    return <Navigate to={`/admin/${allowedSections[0]}`} replace />;
  }

  function getPanelTitle() {
    if (isAdminGeneral) return "Administrator Panel";
    if (isEcommerceManager) return "E-commerce Manager Panel";
    if (isCatalogManager) return "Catalog Manager Panel";
    return "Panel";
  }

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
          {/* Customers - ONLY Administrateur */}
          {isAdminGeneral && (
            <SidebarLink to="/admin/customers" label="Clients" />
          )}
          
          {/* Workers - ONLY Administrateur */}
          {isAdminGeneral && (
            <SidebarLink to="/admin/workers" label="Workers" />
          )}
          
          {/* Catalog: Admin + Gestionnaire de catalogue */}
          {(isAdminGeneral || isCatalogManager) && (
            <SidebarLink to="/admin/catalog" label="Catalog" />
          )}
          
          {/* Dashboard: Admin + Gestionnaire de catalogue */}
          {(isAdminGeneral || isCatalogManager) && (
            <SidebarLink to="/admin/dashboard" label="Dashboard" />
          )}

          {/* Orders: Admin + Ecommerce Manager + Gestionnaire de catalogue */}
          {(isAdminGeneral || isEcommerceManager || isCatalogManager) && (
            <SidebarLink to="/admin/orders" label="Orders" />
          )}
        </div>
      </aside>
      
      <main className="adminContent">
        <Outlet context={{ 
          role, 
          isAdminGeneral, 
          isCatalogManager,
          isEcommerceManager,
          currentLang, 
          changeLang 
        }} />
      </main>
    </div>
  );
}