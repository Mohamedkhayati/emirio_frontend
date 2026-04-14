import AdminSidebar from "./AdminSidebar";
import CustomersPage from "./CustomersPage";
import CatalogPage from "./CatalogPage";
import DashboardPage from "./DashboardPage";
import OrdersPage from "./OrdersPage";
import ClientProfileDialog from "./ClientProfileDialog";

export default function AdminView({
  isAdminGeneral,
  isVendeur,
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
  return (
    <div className="adminLayout">
      <AdminSidebar
        isAdminGeneral={isAdminGeneral}
        currentLang={currentLang}
        changeLang={changeLang}
        t={t}
        section={section}
        setSection={setSection}
      />

      <main className="adminContent">
        {section === "orders" && isAdminGeneral && <OrdersPage {...ordersProps} />}

        {section === "customers" && isAdminGeneral && (
          <CustomersPage {...customersProps} />
        )}

        {section === "catalog" && <CatalogPage {...catalogProps} />}

        {section === "dashboard" && isAdminGeneral && (
          <DashboardPage {...dashboardProps} />
        )}

        <ClientProfileDialog {...clientDialogProps} />
      </main>
    </div>
  );
}