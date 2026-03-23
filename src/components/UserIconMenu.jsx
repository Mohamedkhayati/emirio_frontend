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
      localStorage.removeItem("favorites");
      sessionStorage.clear();
      setMe?.(null);
      setOpen(false);
      navigate("/auth", { replace: true });
    }
  };

  if (!me) {
    return (
      <Link to="/auth" className="userMenuLoginBtn">
        {t("auth.login")}
      </Link>
    );
  }

  const initials =
    `${(me?.prenom || "").trim()[0] || ""}${(me?.nom || "").trim()[0] || ""}`.toUpperCase() || "U";

  return (
    <div className="userMenuWrap" ref={ref}>
      <button
        type="button"
        className="userMenuTrigger"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("nav.profile", "Open user menu")}
      >
        <span className="userAvatar">{initials}</span>
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