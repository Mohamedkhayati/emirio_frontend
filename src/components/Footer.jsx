import { Link } from "react-router-dom";
import "../styles/footer.css";

export default function Footer() {
  return (
    <footer className="siteFooter">
      <div className="footerGrid">
        <div>
          <h3>Emirio Chaussures</h3>
          <p>
            Emirio Chaussures est une boutique fondée en 2010 par Nejaj Maalej.
            Spécialisée dans la vente de chaussures et accessoires pour toute la famille,
            la marque propose des produits modernes, sport, chic et confortables.
          </p>
        </div>

        <div>
          <h3>Contact</h3>
          <p>Téléphone / WhatsApp : 26907000</p>
          <p>Email : emiriochaussures@gmail.com</p>
          <p>
            Facebook :
            <a
              href="https://www.facebook.com/EmirioChaussures/"
              target="_blank"
              rel="noreferrer"
            >
              Emirio Chaussures
            </a>
          </p>
        </div>

        <div>
          <h3>Nos Boutiques</h3>
          <ul>
            <li>Dar Chaabane Fehri – près du kiosque Raboudi</li>
            <li>À côté de Monoprix Express – près de La Jarre</li>
            <li>En face de la station taxi (Mahfar) – Nabeul</li>
          </ul>
        </div>

        <div>
          <h3>Pages</h3>
          <div className="footerLinks">
            <Link to="/">Home</Link>
            <Link to="/catalog">Catalog</Link>
            <Link to="/about">About Us</Link>
            <Link to="/contact">Contact Us</Link>
          </div>
        </div>
      </div>

      <div className="footerBottom">
        © 2026 Emirio Chaussures. All rights reserved.
      </div>
    </footer>
  );
}