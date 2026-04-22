import AdminSidebar from "./AdminSidebar";
import CustomersPage from "./ClientsPage";
import WorkersPage from "./WorkersPage";
import CatalogPage from "./CatalogPage";
import DashboardPage from "./DashboardPage";
import OrdersPage from "./OrdersPage";
import ClientProfileDialog from "./ClientProfileDialog";

export default function AdminView({
  isAdminGeneral,
  isVendeur,
  isControleur,
  currentLang,
  changeLang,
  t,
  section,
  setSection,
  customersProps,
  workersProps,
  catalogProps,
  dashboardProps,
  ordersProps,
  clientDialogProps,
}) {
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
        {/* Orders – all three roles */}
        {(isAdminGeneral || isVendeur || isControleur) && section === "orders" && (
          <OrdersPage {...ordersProps} />
        )}

        {/* Customers – only Admin General */}
        {section === "customers" && isAdminGeneral && (
          <CustomersPage {...customersProps} />
        )}

        {/* Workers – only Admin General */}
        {section === "workers" && isAdminGeneral && (
          <WorkersPage {...workersProps} />
        )}

        {/* Catalog – all three roles */}
        {section === "catalog" && (isAdminGeneral || isVendeur || isControleur) && (
          <CatalogPage {...catalogProps} />
        )}

        {/* Dashboard – only Admin General */}
        {section === "dashboard" && isAdminGeneral && (
          <DashboardPage {...dashboardProps} />
        )}

        <ClientProfileDialog {...clientDialogProps} />
      </main>
    </div>
  );
}