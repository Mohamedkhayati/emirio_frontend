import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "./lib/api";
import { useTranslation } from "react-i18next";
import Navbar from "./components/Navbar";
import WorkersPage from "./pages/admin/WorkersPage";
import ReclamationsPage from "./pages/admin/ReclamationsPage";
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
import AuthLayout from "./layouts/AuthLayout.jsx";
import AdminLayout from "./pages/admin/AdminLayout.jsx";
import AdminCustomersPage from "./pages/admin/ClientsPage.jsx";
import AdminCatalogPage from "./pages/admin/CatalogPage.jsx";
import AdminDashboardPage from "./pages/admin/DashboardPage.jsx";
import AdminOrdersPage from "./pages/admin/OrdersPage.jsx";
import FloatingChat from "./components/FloatingChat";
import Chatbot from "./components/Chatbot";

// ---------- Visit Tracking Hook ----------
function useVisitTracking() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.startsWith("/admin")) return;
    if (location.pathname.startsWith("/api")) return;

    api.post("/api/visit/track", { page: location.pathname })
      .catch(err => console.error("Visit tracking failed:", err));
  }, [location]);
}

// ---------- Main App ----------
export default function App() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const { i18n } = useTranslation();
  const location = useLocation();

  useVisitTracking();

  useEffect(() => {
    async function loadMe() {
      try {
        const res = await api.get("/api/profile");
        console.log("📊 App - User data:", res.data);
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
  const isSuperAdmin = role === "Administrateur";
  const isCatalogManager = role === "Gestionnaire de catalogue";
  const isEcommerceManager = role === "Responsable e-commerce";
  const isAdmin = isSuperAdmin || isCatalogManager || isEcommerceManager;

  const getAdminRedirect = () => {
    if (isSuperAdmin) return "dashboard";
    if (isCatalogManager) return "catalog";
    if (isEcommerceManager) return "orders";
    return "/";
  };

  const isAdminRoute = location.pathname.startsWith("/admin");
  const isAuthRoute = location.pathname.startsWith("/auth") ||
                      location.pathname === "/forgot-password" ||
                      location.pathname === "/reset-password";

  return (
    <CartProvider me={me}>
      <div className="app-container">
        {!isAuthRoute && <Navbar me={me} setMe={setMe} />}
        <main style={{ minHeight: "calc(100vh - 80px)" }}>
          <Routes>
            <Route element={<AuthLayout />}>
              <Route
                path="/auth"
                element={me ? <Navigate to="/" replace /> : <Auth setMe={setMe} />}
              />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
            </Route>

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
                <Route index element={<Navigate to={getAdminRedirect()} replace />} />

                {isSuperAdmin && (
                  <>
                    <Route path="customers" element={<AdminCustomersPage />} />
                    <Route path="workers" element={<WorkersPage />} />
                  </>
                )}

                {/* Catalog - ALL admin roles can access */}
                {(isSuperAdmin || isCatalogManager || isEcommerceManager) && (
                  <Route path="catalog" element={<AdminCatalogPage />} />
                )}

                {/* Dashboard - Only Admin and Catalog Manager */}
                {(isSuperAdmin || isCatalogManager) && (
                  <Route
                    path="dashboard"
                    element={isCatalogManager ? <VendeurDashboardPage /> : <AdminDashboardPage />}
                  />
                )}

                {/* Orders - ALL admin roles */}
                {(isSuperAdmin || isEcommerceManager || isCatalogManager) && (
                  <Route
                    path="orders"
                    element={isCatalogManager ? <VendeurOrdersPage /> : <AdminOrdersPage />}
                  />
                )}

                {/* Reclamations - Admin and E-commerce Manager only */}
                {(isSuperAdmin || isEcommerceManager) && (
                  <Route
                    path="reclamations"
                    element={<ReclamationsPage currentLang={i18n.language} />}
                  />
                )}

                <Route path="*" element={<Navigate to={`/admin/${getAdminRedirect()}`} replace />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {!isAuthRoute && !isAdminRoute && (
          <>
            <FloatingChat me={me} />
            <Chatbot me={me} />
          </>
        )}
      </div>
    </CartProvider>
  );
}