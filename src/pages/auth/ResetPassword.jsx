import { useMemo, useState } from "react";

export default function ResetPassword() {
  const emailFromUrl = useMemo(() => {
    const p = new URLSearchParams(window.location.search);
    return p.get("email") || "";
  }, []);

  const [email, setEmail] = useState(emailFromUrl);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      const res = await fetch("http://localhost:8080/api/auth/password/reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword }),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text);
      setMsg("Mot de passe modifié. Vous pouvez vous connecter.");
      window.location.href = "/auth";
    } catch (err) {
      setMsg(err.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Entrer le code de vérification</h2>
      <form onSubmit={onSubmit}>
        <label>Email</label><br />
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        <br /><br />

        <label>Code</label><br />
        <input value={code} onChange={(e) => setCode(e.target.value)} required />
        <br /><br />

        <label>Nouveau mot de passe</label><br />
        <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" required />
        <br /><br />

        <button disabled={loading}>{loading ? "Saving..." : "Valider"}</button>
      </form>
      {msg && <p>{msg}</p>}
    </div>
  );
}
