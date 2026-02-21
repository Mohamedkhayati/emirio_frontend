import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar.jsx";
import AdminTopbar from "./AdminTopbar.jsx";
import "../styles/admin.css";

export default function AdminLayout({ me }) {
  return (
    <div className="adminShell">
      <AdminSidebar />
      <div className="adminMain">
        <AdminTopbar me={me} />
        <div className="adminContent">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
