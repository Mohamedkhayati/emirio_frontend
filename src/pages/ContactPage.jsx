import "../styles/static-page.css";

export default function ContactPage() {
  return (
    <div className="staticPage">
      <div className="staticPageContainer">
        <h1>Contact Us</h1>
        <p><strong>Téléphone / WhatsApp :</strong> 26907000</p>
        <p><strong>Email :</strong> emiriochaussures@gmail.com</p>
        <p>
          <strong>Facebook :</strong>{" "}
          <a
            href="https://www.facebook.com/EmirioChaussures/"
            target="_blank"
            rel="noreferrer"
          >
            https://www.facebook.com/EmirioChaussures/
          </a>
        </p>

        <h2>Nos Boutiques</h2>
        <ul>
          <li>Dar Chaabane Fehri – près du kiosque Raboudi</li>
          <li>À côté de Monoprix Express – près de La Jarre</li>
          <li>En face de la station taxi (Mahfar) – Nabeul</li>
        </ul>
      </div>
    </div>
  );
}