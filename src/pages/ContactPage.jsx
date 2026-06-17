import { useTranslation } from "react-i18next";
import "../styles/static-page.css";

export default function ContactPage() {
  const { t } = useTranslation();

  return (
    <div className="staticPage">
      <div className="staticPageContainer">
        <h1>{t("contact.title")}</h1>
        <p><strong>{t("contact.phone")} :</strong> 26907000</p>
        <p><strong>{t("contact.email")} :</strong> emiriochaussures@gmail.com</p>
        <p>
          <strong>{t("contact.facebook")} :</strong>{" "}
          <a href="https://www.facebook.com/EmirioChaussures/" target="_blank" rel="noreferrer">
            https://www.facebook.com/EmirioChaussures/
          </a>
        </p>

        <h2>{t("contact.ourStores")}</h2>
        <ul>
          <li>{t("contact.store1")}</li>
          <li>{t("contact.store2")}</li>
          <li>{t("contact.store3")}</li>
        </ul>
      </div>
    </div>
  );
}