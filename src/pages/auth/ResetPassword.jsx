import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import "../../styles/reset-password.css";

export default function ResetPassword() {
  const navigate = useNavigate();

  const emailFromUrl = useMemo(() => {
    const p = new URLSearchParams(window.location.search);
    return p.get("email") || "";
  }, []);

  const [email, setEmail] = useState(emailFromUrl);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [isOk, setIsOk] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    setIsOk(false);

    try {
      const res = await api.post("/api/auth/password/reset/confirm", {
        email,
        code,
        newPassword,
      });

      setMsg(typeof res.data === "string" ? res.data : "Mot de passe modifié. Vous pouvez vous connecter.");
      setIsOk(true);

      setTimeout(() => {
        navigate("/auth", { replace: true });
      }, 900);
    } catch (err) {
      const data = err?.response?.data;
      const text =
        data?.message ||
        (typeof data === "string" ? data : "") ||
        `Erreur (${err?.response?.status || "no status"})`;

      setMsg(text || "Erreur");
      setIsOk(false);

      setShake(true);
      setTimeout(() => setShake(false), 380);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rpPage">
      <div className="rpBg" />
      <div className={`rpCard ${shake ? "shake" : ""}`}>
        <div className="rpLeft">
          <h2 className="rpTitle">Confirmer le code</h2>
          <p className="rpSub">Saisissez le code reçu + votre nouveau mot de passe.</p>

          <form className="rpForm" onSubmit={onSubmit}>
            <label className="rpLabel">Email</label>
            <input
              className="rpInput"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="name@example.com"
              required
            />

            <label className="rpLabel">Code de vérification</label>
            <input
              className="rpInput"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              required
            />

            <label className="rpLabel">Nouveau mot de passe</label>
            <input
              className="rpInput"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              type="password"
              placeholder="Min 6 caractères"
              required
            />

            <button className="rpBtn" disabled={loading}>
              {loading ? "Validation..." : "Valider"}
            </button>
          </form>

          {msg && <div className={`rpAlert ${isOk ? "ok" : "err"}`}>{msg}</div>}

          <button className="rpLink" type="button" onClick={() => navigate("/forgot-password")}>
            ← Renvoyer un code
          </button>
        </div>

        <div className="rpRight">
          <div className="rpBrand">emirio</div>
          <div className="rpSlogan">Un pas d’avance… un pas d’élégance!</div>
        </div>
      </div>
    </div>
  );
}
