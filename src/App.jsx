import { Navigate, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "./lib/api";

import Home from "./pages/Home.jsx";
import Auth from "./pages/Auth.jsx";
import Profile from "./pages/Profile.jsx";

import ForgotPassword from "./pages/auth/ForgotPassword.jsx";
import ResetPassword from "./pages/auth/ResetPassword.jsx";

import AdminPage from "./pages/admin/AdminPage.jsx";
import AdminLayout from "./components/AdminLayout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import { useTranslation } from "react-i18next";

export default function App() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const { i18n } = useTranslation();

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

  // ✅ Better: use resolvedLanguage + i18n.dir()
  useEffect(() => {
    const lng = i18n.resolvedLanguage || i18n.language || "en";
    document.documentElement.lang = lng;
    document.documentElement.dir = i18n.dir(lng); // "ltr" or "rtl"
  }, [i18n, i18n.resolvedLanguage, i18n.language]);

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

  const role = me?.role;

  return (
    <Routes>
      <Route path="/" element={<Home me={me} />} />

      {/* Optional: if logged in, don't show Auth page */}
      <Route path="/auth" element={me ? <Navigate to="/profile" replace /> : <Auth />} />

      {/* Reset password pages (public) */}
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route
        path="/profile"
        element={me ? <Profile me={me} /> : <Navigate to="/auth" replace />}
      />

      {/* ADMIN routes */}
   <Route element={<ProtectedRoute isAllowed={role === "ADMIN"} redirectTo="/profile" />}>
  <Route element={<AdminLayout me={me} />}>
    <Route path="/admin" element={<AdminPage />} />
    <Route path="/admin/clients" element={<Navigate to="/admin" replace />} />
  </Route>
</Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
