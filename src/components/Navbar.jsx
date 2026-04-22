import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import UserIconMenu from "./UserIconMenu";
import LanguageMenu from "./LanguageMenu";
import "../styles/navbar.css";

function getCartCount() {
  try {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    if (!Array.isArray(cart)) return 0;
    return cart.reduce((sum, item) => sum + Number(item.qty || 0), 0);
  } catch {
    return 0;
  }
}

function normalizeRole(role) {
  return String(role || "")
    .trim()
    .toUpperCase()
    .replace(/^ROLE_/, "")
    .replace(/[\s-]+/g, "_");
}

function canAccessAdminPanel(role) {
  const r = normalizeRole(role);
  
  console.log("🔍 canAccessAdminPanel - Input role:", role);
  console.log("🔍 canAccessAdminPanel - Normalized role:", r);
  
  const hasAccess = (
    r === "ADMINISTRATEUR" ||  // Changed from "Administrateur"
    r === "GESTIONNAIRE_DE_CATALOGUE" ||  // Changed from "Gestionnaire de catalogue"
    r === "RESPONSABLE_E_COMMERCE"  // Changed from "Responsable e-commerce"
  );
  
  console.log("🔍 canAccessAdminPanel - Has access:", hasAccess);
  return hasAccess;
}

export default function Navbar({ me, setMe }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(getCartCount);

  const isLoggedIn = !!me;
  
  console.log("📊 Navbar - me object:", me);
  console.log("📊 Navbar - isLoggedIn:", isLoggedIn);
  console.log("📊 Navbar - user role:", me?.role);

  const canAccessAdmin = useMemo(() => {
    const access = isLoggedIn && canAccessAdminPanel(me?.role);
    console.log("📊 Navbar - canAccessAdmin computed:", access);
    return access;
  }, [isLoggedIn, me?.role]);

  useEffect(() => {
    const syncCart = () => setCartCount(getCartCount());
    syncCart();
    window.addEventListener("storage", syncCart);
    window.addEventListener("focus", syncCart);
    window.addEventListener("cart-updated", syncCart);

    return () => {
      window.removeEventListener("storage", syncCart);
      window.removeEventListener("focus", syncCart);
      window.removeEventListener("cart-updated", syncCart);
    };
  }, []);

  return (
    <>
      <div className="topStrip">
        <span>{t("home.topStrip")}</span>
      </div>

      <header className="navbarPro">
        <NavLink to="/" className="navbarLogoWrap">
          <img src="/emirio-logo.jpg?v=2" alt="Emirio" className="navbarLogoImg" />
        </NavLink>

        <nav className="navbarLinks">
          <NavLink to="/" className={({ isActive }) => `navbarLink ${isActive ? "active" : ""}`}>
            {t("nav.home", "Home")}
          </NavLink>

          <NavLink
            to="/catalog"
            className={({ isActive }) => `navbarLink ${isActive ? "active" : ""}`}
          >
            {t("nav.catalog", "Catalog")}
          </NavLink>

          <NavLink
            to="/about"
            className={({ isActive }) => `navbarLink ${isActive ? "active" : ""}`}
          >
            {t("nav.about", "About Us")}
          </NavLink>

          <NavLink
            to="/contact"
            className={({ isActive }) => `navbarLink ${isActive ? "active" : ""}`}
          >
            {t("nav.contact", "Contact Us")}
          </NavLink>

          <NavLink
            to="/favorites"
            className={({ isActive }) => `navbarLink ${isActive ? "active" : ""}`}
          >
            {t("nav.favorites", "Favorites")}
          </NavLink>

          <NavLink
            to="/orders"
            className={({ isActive }) => `navbarLink ${isActive ? "active" : ""}`}
          >
            {t("nav.orders", "Orders")}
          </NavLink>
        </nav>

        <div className="navbarActions">
          {canAccessAdmin && (
            <button
              type="button"
              className="navbarAdminBtn"
              onClick={() => {
                console.log("🖱️ Admin button clicked, navigating to /admin");
                navigate("/admin");
              }}
            >
              <span className="navbarAdminBtnIcon">⚙</span>
              <span>{t("nav.adminPanel", "Admin Panel")}</span>
            </button>
          )}

          <button
            type="button"
            className="navbarCartBtn"
            onClick={() => navigate("/cart")}
          >
            <span>🛒</span>
            <span>{t("nav.cart", "Cart")}</span>
            {cartCount > 0 ? <span className="navbarCartBadge">{cartCount}</span> : null}
          </button>

          <LanguageMenu />

          {!isLoggedIn ? (
            <div className="navbarAuthBtns">
              <button
                type="button"
                className="navbarLoginBtn"
                onClick={() => navigate("/auth?mode=login")}
              >
                {t("auth.login", "Login")}
              </button>

              <button
                type="button"
                className="navbarSignupBtn"
                onClick={() => navigate("/auth?mode=signup")}
              >
                {t("auth.signUp", "Sign Up")}
              </button>
            </div>
          ) : (
            <UserIconMenu me={me} setMe={setMe} />
          )}
        </div>
      </header>
    </>
  );
}