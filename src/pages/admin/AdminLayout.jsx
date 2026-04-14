import { useEffect, useMemo, useState } from "react";
import { NavLink, Navigate, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../../lib/api";
import "./admin.css";
import {
  clearStoredAuth,
  getStoredToken,
  isAdminRole,
  isVendeurRole,
  normalizeRole,
  persistAuth,
} from "./adminShared";

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

  const [role, setRole] = useState("");
  const [roleLoading, setRoleLoading] = useState(true);

  const isAdminGeneral = useMemo(() => isAdminRole(role), [role]);
  const isVendeur = useMemo(() => isVendeurRole(role), [role]);

  const allowedSections = useMemo(() => {
    if (isAdminGeneral) return ["customers", "catalog", "dashboard", "orders"];
    if (isVendeur) return ["catalog"];
    return [];
  }, [isAdminGeneral, isVendeur]);

  const currentLang = useMemo(() => {
    const lng =
      i18n.resolvedLanguage ||
      i18n.language ||
      localStorage.getItem("language") ||
      "en";
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
          if (mounted) {
            setRole("");
            setRoleLoading(false);
          }
          return;
        }

        const res = await api.get("/api/profile");
        const apiRole = normalizeRole(res?.data?.role || "");
        persistAuth(token, apiRole);

        if (mounted) setRole(apiRole);
      } catch {
        clearStoredAuth();
        if (mounted) setRole("");
      } finally {
        if (mounted) setRoleLoading(false);
      }
    }

    bootstrapRole();
    return () => {
      mounted = false;
    };
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

  if (!isAdminGeneral && !isVendeur) {
    return (
      <div className="adminLayout">
        <main className="adminContent">
          <div className="fadeInUp">
            <div className="admPage">
              <div className="admAlert">
                Access denied. Your role is not allowed to open this page.
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const currentSection = location.pathname.split("/").filter(Boolean).pop();

  if (location.pathname === "/admin") {
    return <Navigate to="/admin/catalog" replace />;
  }

  if (currentSection && !allowedSections.includes(currentSection)) {
    return <Navigate to={`/admin/${allowedSections[0]}`} replace />;
  }

  return (
    <div className="adminLayout">
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
          {isAdminGeneral && <SidebarLink to="/admin/customers" label="Customers" />}
          <SidebarLink to="/admin/catalog" label="Catalog" />
          {isAdminGeneral && <SidebarLink to="/admin/dashboard" label="Dashboard" />}
          {isAdminGeneral && <SidebarLink to="/admin/orders" label="Orders" />}
        </div>
      </aside>

      <main className="adminContent">
        <Outlet
          context={{
            role,
            isAdminGeneral,
            isVendeur,
            currentLang,
            changeLang,
          }}
        />
      </main>
    </div>
  );
}