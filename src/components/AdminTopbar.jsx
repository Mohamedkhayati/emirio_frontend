import { useNavigate } from "react-router-dom";
import { clearToken } from "../lib/auth";
import "../styles/admin.css";

export default function AdminTopbar({ me }) {
  const nav = useNavigate();

  function logout() {
    clearToken();
    nav("/auth");
  }

  return (
    <header className="top">
      <div>
        <div className="topTitle">Customer List</div>
        <div className="topSub">Manage client accounts</div>
      </div>

      <div className="topRight">
        <div className="miniCard">
          <div className="miniName">{me?.prenom} {me?.nom}</div>
          <div className="miniRole">{me?.role}</div>
        </div>
        <button className="btnLogout" onClick={logout}>Logout</button>
      </div>
    </header>
  );
}
