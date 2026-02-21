import { NavLink } from "react-router-dom";
import "../styles/admin.css";

export default function AdminSidebar() {
  return (
    <aside className="side">
      <div className="sideBrand">
        <div className="sideDot" />
        <div className="sideName">Base</div>
      </div>

      <nav className="nav">
        <NavLink to="/admin/clients" className="navItem">
          <span className="navIcon">👤</span>
          <span>Customer List</span>
        </NavLink>
      </nav>

      <div className="sideFooter">
        <button className="upgradeBtn">Upgrade Now</button>
      </div>
    </aside>
  );
}
