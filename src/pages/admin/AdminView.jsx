export default function AdminView({
  isAdminGeneral,
  isCatalogManager,  // renamed from isVendeur
  isEcommerceManager, // renamed from isControleur
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
  if (!isAdminGeneral && !isCatalogManager && !isEcommerceManager) {
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
        isCatalogManager={isCatalogManager}
        isEcommerceManager={isEcommerceManager}
        currentLang={currentLang}
        changeLang={changeLang}
        t={t}
        section={section}
        setSection={setSection}
      />

      <main className="adminContent">
        {(isAdminGeneral || isCatalogManager || isEcommerceManager) && section === "orders" && (
          <OrdersPage {...ordersProps} />
        )}

        {section === "customers" && isAdminGeneral && (
          <CustomersPage {...customersProps} />
        )}

        {section === "workers" && isAdminGeneral && (
          <WorkersPage {...workersProps} />
        )}

        {section === "catalog" && (isAdminGeneral || isCatalogManager || isEcommerceManager) && (
          <CatalogPage 
            isAdminGeneral={isAdminGeneral}
            isCatalogManager={isCatalogManager}
            isEcommerceManager={isEcommerceManager}
            {...catalogProps} 
          />
        )}

        {section === "dashboard" && isAdminGeneral && (
          <DashboardPage {...dashboardProps} />
        )}

        <ClientProfileDialog {...clientDialogProps} />
      </main>
    </div>
  );
}