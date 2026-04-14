import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute({ isAllowed, redirectTo = "/auth" }) {
  return isAllowed ? <Outlet /> : <Navigate to={redirectTo} replace />;
}