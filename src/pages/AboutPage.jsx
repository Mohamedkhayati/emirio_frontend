import { useTranslation } from "react-i18next";
import "../styles/static-page.css";

export default function AboutPage() {
  const { t } = useTranslation();

  return (
    <div className="staticPage">
      <div className="staticPageContainer">
        <h1>{t("about.title")}</h1>
        <p>{t("about.description1")}</p>
        <p>{t("about.description2")}</p>
      </div>
    </div>
  );
}