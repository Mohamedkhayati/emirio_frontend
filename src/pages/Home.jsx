import UserIconMenu from "../components/UserIconMenu";
import "../styles/home.css";
import { useTranslation } from "react-i18next";

export default function Home() {
  const { t, i18n } = useTranslation();

  const setLang = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem("language", lng); // keep choice after refresh
  };

  return (
    <div className="home">
      <UserIconMenu />

      {/* Language buttons */}
      <div className="langSwitcher">
        <button type="button" onClick={() => setLang("en")}>EN</button>
        <button type="button" onClick={() => setLang("fr")}>FR</button>
        <button type="button" onClick={() => setLang("ar")}>AR</button>
      </div>

      <div className="homeCenter">
        <div className="homeBrand">
          <div className="homeTitle">{t("home.title")}</div>
          <div className="homeSub">{t("home.sub")}</div>
        </div>
      </div>
    </div>
  );
}
