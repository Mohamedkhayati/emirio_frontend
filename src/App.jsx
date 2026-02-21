import { Navigate, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "./lib/api";

import Home from "./pages/Home.jsx";
import Auth from "./pages/Auth.jsx";
import Profile from "./pages/Profile.jsx";

import ForgotPassword from "./pages/auth/ForgotPassword.jsx";
import ResetPassword from "./pages/auth/ResetPassword.jsx";

import AdminClients from "./pages/AdminClients.jsx";
import AdminLayout from "./components/AdminLayout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

export default function App() {
  const [me, setMe] = useState(null); // {role, ...}
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMe() {
      try {
        const res = await api.get("/api/profile");
        setMe(res.data);
      } catch {
        setMe(null);
      } finally {
        setLoading(false);
      }
    }
    loadMe();
  }, []);

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

  const role = me?.role; // "ADMIN" or "CLIENT"

  return (
    <Routes>
      <Route path="/" element={<Home me={me} />} />
      <Route path="/auth" element={<Auth />} />

      {/* Reset password */}
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route
        path="/profile"
        element={me ? <Profile me={me} /> : <Navigate to="/auth" replace />}
      />

      {/* ADMIN routes */}
      <Route
        element={<ProtectedRoute isAllowed={role === "ADMIN"} redirectTo="/profile" />}
      >
        <Route element={<AdminLayout me={me} />}>
          <Route path="/admin/clients" element={<AdminClients />} />
          <Route path="/admin" element={<Navigate to="/admin/clients" replace />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
