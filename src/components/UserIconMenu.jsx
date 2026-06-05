import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { clearToken } from "../lib/auth";

export default function UserIconMenu({ me, setMe }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    function onDocClick(e) {
      if (!ref.current?.contains(e.target)) setOpen(false);
    }

    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const logout = async () => {
    try {
      await api.post("/api/auth/logout").catch(() => null);
    } finally {
      clearToken();

      localStorage.removeItem("emirio_token");
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("auth");
      localStorage.removeItem("favorites");
      localStorage.removeItem("user");
      localStorage.removeItem("cart");
      localStorage.removeItem("cart_guest");

      sessionStorage.clear();
      setMe?.(null);
      setOpen(false);
      navigate("/", { replace: true });
    }
  };

  if (!me) {
    return (
      <Link to="/auth?mode=login" className="userMenuLoginBtn">
        {t("auth.login")}
      </Link>
    );
  }

  return (
    <div className="userMenuWrap" ref={ref}>
      <button
        type="button"
        className="userMenuTrigger"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("nav.profile", "Open user menu")}
      >
        <svg 
          className="userIcon" 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" 
            fill="currentColor"
          />
        </svg>
      </button>

      {open && (
        <div className="userDropdown">
          <div className="userDropdownHead">
            <div className="userDropdownName">
              {me.prenom} {me.nom}
            </div>
            <div className="userDropdownEmail">{me.email}</div>
          </div>

          <Link to="/profile" className="userDropdownItem" onClick={() => setOpen(false)}>
            {t("nav.profile", "Profile")}
          </Link>

          <Link to="/favorites" className="userDropdownItem" onClick={() => setOpen(false)}>
            {t("nav.favorites", "Favorites")}
          </Link>

          <button type="button" className="userDropdownItem danger" onClick={logout}>
            {t("common.logout")}
          </button>
        </div>
      )}
    </div>
  );
}