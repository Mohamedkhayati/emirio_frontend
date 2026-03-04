import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import "../../styles/forgot-password.css";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    setOk(false);

    try {
      const res = await api.post("/api/auth/password/reset/request", { email });

      setMsg(typeof res.data === "string" ? res.data : "Code envoyé. Vérifiez votre email.");
      setOk(true);

      // ✅ Go to confirm page automatically
      setTimeout(() => {
        navigate(`/reset-password?email=${encodeURIComponent(email)}`, { replace: true });
      }, 700);
    } catch (err) {
      const data = err?.response?.data;
      const text =
        data?.message ||
        (typeof data === "string" ? data : "") ||
        `Erreur (${err?.response?.status || "no status"})`;

      setMsg(text || "Erreur");
      setOk(false);

      setShake(true);
      setTimeout(() => setShake(false), 380);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fpPage">
      <div className="fpBg" />
      <div className={`fpCard ${shake ? "shake" : ""}`}>
        <div className="fpLeft">
          <h2 className="fpTitle">Réinitialiser son mot de passe</h2>
          <p className="fpSub">Entrez votre email, on vous envoie un code.</p>

          <form className="fpForm" onSubmit={onSubmit}>
            <label className="fpLabel">Email</label>
            <input
              className="fpInput"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="name@example.com"
              required
            />

            <button className="fpBtn" disabled={loading}>
              {loading ? "Envoi..." : "Envoyer le code"}
            </button>
          </form>

          {msg && <div className={`fpAlert ${ok ? "ok" : "err"}`}>{msg}</div>}
        </div>

        <div className="fpRight">
          <div className="fpBrand">emirio</div>
          <div className="fpSlogan">Un pas d’avance… un pas d’élégance!</div>
        </div>
      </div>
    </div>
  );
}
