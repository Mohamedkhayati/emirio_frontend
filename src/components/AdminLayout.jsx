import AdminSidebar from "./AdminSidebar";

export default function AdminLayout({
  children,
  section,
  setSection,
  currentLang,
  changeLang,
}) {
  return (
    <div className="adminLayout">
      <AdminSidebar
        section={section}
        setSection={setSection}
        currentLang={currentLang}
        changeLang={changeLang}
      />
      <main className="adminContent">{children}</main>
    </div>
  );
}