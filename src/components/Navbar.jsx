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
    .replace(/[\s-]+/g, "_");
}

function getStoredRole() {
  try {
    if (meetsRole(localStorage.getItem("role"))) {
      return normalizeRole(localStorage.getItem("role"));
    }

    const authRaw = localStorage.getItem("auth");
    if (!authRaw) return "";

    const auth = JSON.parse(authRaw);
    return normalizeRole(auth?.role || auth?.user?.role || "");
  } catch {
    return "";
  }
}

function meetsRole(role) {
  const r = normalizeRole(role);
  return r === "ADMIN_GENERAL" || r === "ADMIN" || r === "VENDEUR" || r === "SELLER";
}

export default function Navbar({ me, setMe }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(getCartCount);
  const [currentRole, setCurrentRole] = useState(() => normalizeRole(me?.role || getStoredRole()));

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

  useEffect(() => {
    setCurrentRole(normalizeRole(me?.role || getStoredRole()));
  }, [me]);

  const canAccessAdmin = useMemo(() => meetsRole(currentRole), [currentRole]);

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
              onClick={() => navigate("/admin")}
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
          <UserIconMenu me={me} setMe={setMe} />
        </div>
      </header>
    </>
  );
}