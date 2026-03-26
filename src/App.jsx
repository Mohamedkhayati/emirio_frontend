import { Navigate, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "./lib/api";
import { useTranslation } from "react-i18next";
import CartCheckoutPage from "./pages/CartCheckoutPage";
import OrderHistoryPage from "./pages/OrderHistoryPage";
import Favorites from "./pages/Favorites";
import Home from "./pages/Home.jsx";
import Auth from "./pages/Auth.jsx";
import Profile from "./pages/Profile.jsx";
import ProductDetailsPage from "./pages/ProductDetailsPage.jsx";
import CatalogPage from "./pages/CatalogPage.jsx";
import ForgotPassword from "./pages/auth/ForgotPassword.jsx";
import ResetPassword from "./pages/auth/ResetPassword.jsx";
import AdminPage from "./pages/admin/AdminPage.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

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

  useEffect(() => {
    const lng = i18n.resolvedLanguage || i18n.language || "en";
    document.documentElement.lang = lng;
    document.documentElement.dir = i18n.dir(lng);
  }, [i18n, i18n.resolvedLanguage, i18n.language]);

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

  const role = me?.role;

  return (
    <Routes>
      <Route path="/" element={<Home me={me} setMe={setMe} />} />
      <Route path="/catalog" element={<CatalogPage me={me} setMe={setMe} />} />
      <Route path="/product/:id" element={<ProductDetailsPage me={me} setMe={setMe} />} />
      <Route path="/favorites" element={<Favorites me={me} setMe={setMe} />} />

      <Route
        path="/auth"
        element={me ? <Navigate to="/" replace /> : <Auth setMe={setMe} />}
      />

      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route
        path="/profile"
        element={me ? <Profile me={me} setMe={setMe} /> : <Navigate to="/auth" replace />}
      />
<Route path="/cart" element={<CartCheckoutPage me={me} setMe={setMe} />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute
            isAllowed={role === "ADMIN"}
            redirectTo="/profile"
          />
        }
      >
        <Route index element={<AdminPage />} />
      </Route>
<Route path="/orders" element={<OrderHistoryPage me={me} setMe={setMe} />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}