import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import "../styles/footer.css";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="siteFooter">
      <div className="footerGrid">
        <div>
          <h3>Emirio Chaussures</h3>
          <p>{t("footer.about")}</p>
        </div>

        <div>
          <h3>{t("footer.contact")}</h3>
          <p>{t("footer.phone")} : 26907000</p>
          <p>{t("footer.email")} : emiriochaussures@gmail.com</p>
          <p>
            {t("footer.facebook")} :
            <a href="https://www.facebook.com/EmirioChaussures/" target="_blank" rel="noreferrer">
              Emirio Chaussures
            </a>
          </p>
        </div>

        <div>
          <h3>{t("footer.ourStores")}</h3>
          <ul>
            <li>{t("footer.store1")}</li>
            <li>{t("footer.store2")}</li>
            <li>{t("footer.store3")}</li>
          </ul>
        </div>

        <div>
          <h3>{t("footer.pages")}</h3>
          <div className="footerLinks">
            <Link to="/">{t("nav.home")}</Link>
            <Link to="/catalog">{t("nav.catalog")}</Link>
            <Link to="/about">{t("nav.about")}</Link>
            <Link to="/contact">{t("nav.contact")}</Link>
          </div>
        </div>
      </div>

      <div className="footerBottom">
        © 2026 Emirio Chaussures. {t("footer.rights")}
      </div>
    </footer>
  );
}