import { Navigate, Outlet } from "react-router-dom";
import { isLoggedIn } from "../lib/auth";

export default function ProtectedRoute({ isAllowed, redirectTo = "/auth" }) {
  if (!isLoggedIn()) return <Navigate to="/auth" replace />;
  if (!isAllowed) return <Navigate to={redirectTo} replace />;
  return <Outlet />;
}
