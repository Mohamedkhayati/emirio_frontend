import AdminSidebar from "./AdminSidebar";
import CustomersPage from "./CustomersPage";
import CatalogPage from "./CatalogPage";
import DashboardPage from "./DashboardPage";
import OrdersPage from "./OrdersPage";
import ClientProfileDialog from "./ClientProfileDialog";

export default function AdminView({
  isAdminGeneral,
  isVendeur,
  isControleur,  // ← MAKE SURE THIS IS HERE
  currentLang,
  changeLang,
  t,
  section,
  setSection,
  customersProps,
  catalogProps,
  dashboardProps,
  ordersProps,
  clientDialogProps,
}) {
  // ALLOW CONTROLEUR to access admin panel
  if (!isAdminGeneral && !isVendeur && !isControleur) {
    return (
      <div className="fadeInUp">
        <div className="admPage">
          <div className="admAlert">Access denied. You don't have permission to view this page.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="adminLayout">
      <AdminSidebar
        isAdminGeneral={isAdminGeneral}
        isVendeur={isVendeur}
        isControleur={isControleur}
        currentLang={currentLang}
        changeLang={changeLang}
        t={t}
        section={section}
        setSection={setSection}
      />

      <main className="adminContent">
        {/* Orders - accessible by Admin General AND Controleur */}
        {(isAdminGeneral || isControleur) && section === "orders" && (
          <OrdersPage {...ordersProps} />
        )}

        {/* Customers - only Admin General */}
        {section === "customers" && isAdminGeneral && (
          <CustomersPage {...customersProps} />
        )}

        {/* Catalog - Admin General and Vendeur (NOT Controleur) */}
        {section === "catalog" && (isAdminGeneral || isVendeur) && (
          <CatalogPage {...catalogProps} />
        )}

        {/* Dashboard - only Admin General */}
        {section === "dashboard" && isAdminGeneral && (
          <DashboardPage {...dashboardProps} />
        )}

        <ClientProfileDialog {...clientDialogProps} />
      </main>
    </div>
  );
}