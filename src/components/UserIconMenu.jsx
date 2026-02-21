import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { clearToken, getToken } from "../lib/auth";
import "../styles/menu.css";

function initials() {
  return "ME";
}

function SparkIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2l1.2 6.2L20 10l-6.8 1.8L12 18l-1.2-6.2L4 10l6.8-1.8L12 2zm8 8l.6 3.1L24 14l-3.4.9L20 18l-.6-3.1L16 14l3.4-.9L20 10zM2 14l.6 3.1L6 18l-3.4.9L2 22l-.6-3.1L-2 18l3.4-.9L2 14z"
      />
    </svg>
  );
}

export default function UserIconMenu() {
  const nav = useNavigate();
  const token = getToken();
  const logged = !!token;

  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const text = useMemo(() => initials(), []);

  useEffect(() => {
    function onDown(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function clickMain() {
    if (!logged) nav("/auth");
    else setOpen((v) => !v);
  }

  function logout() {
    clearToken();
    setOpen(false);
    nav("/auth");
  }

  return (
    <div className="userMenu" ref={ref}>
      <button className="fab" onClick={clickMain} aria-label="Account">
        <span className="fabIcon"><SparkIcon /></span>
        <span className="fabText">{logged ? text : "Start"}</span>
      </button>

      {logged && open && (
        <div className="dropdown">
          <Link to="/profile" className="ddItem" onClick={() => setOpen(false)}>
            My profile
          </Link>
          <button className="ddItem danger" onClick={logout}>
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
