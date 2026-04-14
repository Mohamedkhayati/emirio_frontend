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
import ShopCatalogPage from "./pages/CatalogPage.jsx";
import ForgotPassword from "./pages/auth/ForgotPassword.jsx";
import ResetPassword from "./pages/auth/ResetPassword.jsx";
import AboutPage from "./pages/AboutPage.jsx";
import ContactPage from "./pages/ContactPage.jsx";

import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { CartProvider } from "./context/CartContext";
import MainLayout from "./layouts/MainLayout.jsx";
import AuthLayout from "./layouts/AuthLayout.jsx";

import AdminLayout from "./pages/admin/AdminLayout.jsx";
import AdminCustomersPage from "./pages/admin/CustomersPage.jsx";
import AdminCatalogPage from "./pages/admin/CatalogPage.jsx";
import AdminDashboardPage from "./pages/admin/DashboardPage.jsx";
import AdminOrdersPage from "./pages/admin/OrdersPage.jsx";

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
  const isAdmin =
    role === "ADMIN_GENERAL" ||
    role === "VENDEUR" ||
    role === "ADMIN" ||
    role === "SELLER";

  return (
    <CartProvider me={me}>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route
            path="/auth"
            element={me ? <Navigate to="/" replace /> : <Auth setMe={setMe} />}
          />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        <Route element={<MainLayout me={me} setMe={setMe} />}>
          <Route path="/" element={<Home />} />
          <Route path="/catalog" element={<ShopCatalogPage me={me} setMe={setMe} />} />
          <Route path="/product/:id" element={<ProductDetailsPage me={me} setMe={setMe} />} />
          <Route path="/favorites" element={<Favorites me={me} setMe={setMe} />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/cart" element={<CartCheckoutPage me={me} setMe={setMe} />} />
          <Route path="/orders" element={<OrderHistoryPage me={me} setMe={setMe} />} />

          <Route
            path="/profile"
            element={<ProtectedRoute isAllowed={!!me} redirectTo="/auth" />}
          >
            <Route index element={<Profile me={me} setMe={setMe} />} />
          </Route>

          <Route
            path="/admin"
            element={<ProtectedRoute isAllowed={isAdmin} redirectTo="/" />}
          >
            <Route element={<AdminLayout />}>
              <Route index element={<Navigate to="catalog" replace />} />
              <Route path="catalog" element={<AdminCatalogPage />} />
              <Route path="customers" element={<AdminCustomersPage />} />
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="orders" element={<AdminOrdersPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </CartProvider>
  );
}