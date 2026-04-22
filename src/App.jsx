import { Navigate, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "./lib/api";
import { useTranslation } from "react-i18next";
import WorkersPage from "./pages/admin/WorkersPage";

import CartCheckoutPage from "./pages/CartCheckoutPage";
import OrderHistoryPage from "./pages/OrderHistoryPage";
import VendeurCatalogPage from "./pages/admin/VendeurCatalogPage";
import VendeurOrdersPage from "./pages/admin/VendeurOrdersPage";
import VendeurDashboardPage from "./pages/admin/VendeurDashboardPage";
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
import AdminCustomersPage from "./pages/admin/ClientsPage.jsx";
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
        console.log("📊 App - User data from backend:", res.data);
        console.log("📊 App - User role:", res.data.role);
        setMe(res.data);
      } catch (error) {
        console.error("Failed to load user:", error);
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
  
  // Check specific roles
  const isSuperAdmin = role === "Administrateur";
  const isCatalogManager = role === "Gestionnaire de catalogue";
  const isEcommerceManager = role === "Responsable e-commerce";

  // Has any admin access?
  const isAdmin = isSuperAdmin || isCatalogManager || isEcommerceManager;

  console.log("🔍 App.jsx - User role:", role);
  console.log("🔍 App.jsx - isAdmin:", isAdmin);
  console.log("🔍 App.jsx - isSuperAdmin:", isSuperAdmin);
  console.log("🔍 App.jsx - isCatalogManager:", isCatalogManager);
  console.log("🔍 App.jsx - isEcommerceManager:", isEcommerceManager);

  // Dynamic redirect for the base `/admin` route based on user role
  const getAdminRedirect = () => {
    if (isSuperAdmin) return "dashboard";
    if (isCatalogManager) return "catalog";
    if (isEcommerceManager) return "orders";
    return "/";
  };

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

          {/* Admin Routes */}
          <Route
            path="/admin/*"
            element={<ProtectedRoute isAllowed={isAdmin} redirectTo="/" />}
          >
            <Route element={<AdminLayout />}>
              {/* Dynamic Redirect based on role */}
              <Route index element={<Navigate to={getAdminRedirect()} replace />} />
              
              {/* Customers & Workers - only for Administrateur */}
              {isSuperAdmin && (
                <>
                  <Route path="customers" element={<AdminCustomersPage />} />
                  <Route path="workers" element={<WorkersPage />} />
                </>
              )}
              
              {/* Catalog - Admins see all catalog, Catalog Managers see their catalog */}
              {(isSuperAdmin || isCatalogManager) && (
                <Route 
                  path="catalog" 
                  element={isCatalogManager ? <VendeurCatalogPage /> : <AdminCatalogPage />} 
                />
              )}
              
              {/* Dashboard - Admins see main dashboard, Catalog Managers see their vendor dashboard */}
              {(isSuperAdmin || isCatalogManager) && (
                <Route 
                  path="dashboard" 
                  element={isCatalogManager ? <VendeurDashboardPage /> : <AdminDashboardPage />} 
                />
              )}
              
              {/* Orders - Admins and Ecommerce Managers see all orders, Catalog managers see their orders */}
              {(isSuperAdmin || isEcommerceManager || isCatalogManager) && (
                <Route 
                  path="orders" 
                  element={isCatalogManager ? <VendeurOrdersPage /> : <AdminOrdersPage />} 
                />
              )}
              
              {/* Fallback for unauthorized admin routes */}
              <Route path="*" element={<Navigate to={`/admin/${getAdminRedirect()}`} replace />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </CartProvider>
  );
}