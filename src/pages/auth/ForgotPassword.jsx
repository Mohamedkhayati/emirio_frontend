import { useState } from "react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      const res = await fetch("http://localhost:8080/api/auth/password/reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const text = await res.text();
      setMsg(text);
      // Navigate to step 2 with email
      window.location.href = `/reset-password?email=${encodeURIComponent(email)}`;
    } catch (err) {
      setMsg("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Réinitialiser son mot de passe</h2>
      <form onSubmit={onSubmit}>
        <label>Email</label><br />
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        <br /><br />
        <button disabled={loading}>{loading ? "Sending..." : "Envoyer le code"}</button>
      </form>
      {msg && <p>{msg}</p>}
    </div>
  );
}
