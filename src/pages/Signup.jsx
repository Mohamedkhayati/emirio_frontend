import { useState } from "react";
import AuthLayout from "../components/AuthShell";
import { api } from "../lib/api";
import "../styles/auth2.css";

export default function Signup() {
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setOk("");

    if (!agree) {
      setErr("Please accept terms & policy.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/api/auth/signup", { nom, prenom, email, password });
      setOk("Account created. You can login now.");
    } catch (e2) {
      // IMPORTANT: show real backend message
      const msg =
        e2?.response?.data?.message ||
        e2?.response?.data?.error ||
        "Signup failed";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      variant="signup"
      title="Get Started Now"
      subtitle=""
      bottomText="Have an account?"
      bottomLinkText="Sign in"
      bottomLinkTo="/login"
    >
      {err && <div className="alert error">{err}</div>}
      {ok && <div className="alert ok">{ok}</div>}

      <form onSubmit={submit} className="form">
        <label className="label">Nom</label>
        <input className="input" value={nom} onChange={(e) => setNom(e.target.value)} />

        <label className="label">Prenom</label>
        <input className="input" value={prenom} onChange={(e) => setPrenom(e.target.value)} />

        <label className="label">Email address</label>
        <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />

        <label className="label">Password</label>
        <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

        <label className="checkRow">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          <span>I agree to the terms & policy</span>
        </label>

        <button className="btnPrimary" disabled={loading}>
          {loading ? "Creating..." : "Signup"}
        </button>
      </form>
    </AuthLayout>
  );
}
