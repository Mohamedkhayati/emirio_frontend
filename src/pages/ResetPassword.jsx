import { useMemo, useState } from "react";
import { api } from "../../lib/api";
import "../../styles/reset-password.css";

export default function ResetPassword() {
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
        window.location.href = "/auth";
      }, 700);
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
      <div className="rpGlow" />
      <div className={`rpCard ${shake ? "rpShake" : ""}`}>
        <h2 className="rpTitle">Réinitialiser le mot de passe</h2>
        <p className="rpSub">Saisir votre email, le code de vérification reçu, puis votre nouveau mot de passe.</p>

        <form className="rpForm" onSubmit={onSubmit}>
          <div>
            <div className="rpLabel">Email</div>
            <input
              className="rpInput"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="name@example.com"
              required
            />
          </div>

          <div>
            <div className="rpLabel">Code de vérification</div>
            <input
              className="rpInput"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              required
            />
          </div>

          <div>
            <div className="rpLabel">Nouveau mot de passe</div>
            <input
              className="rpInput"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              type="password"
              placeholder="Min 6 caractères"
              required
            />
          </div>

          <button className="rpBtn" disabled={loading}>
            {loading ? "Validation..." : "Valider"}
          </button>
        </form>

        {msg && <div className={`rpAlert ${isOk ? "ok" : "err"}`}>{msg}</div>}
      </div>
    </div>
  );
}
