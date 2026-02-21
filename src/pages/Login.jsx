import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthShell";
import { api } from "../lib/api";
import { setToken } from "../lib/auth";
import "../styles/auth2.css";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.2-1.4 3.5-5.4 3.5-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C17.8 1.6 15.2 0 12 0 5.4 0 0 5.4 0 12s5.4 12 12 12c6.9 0 11.5-4.8 11.5-11.6 0-.8-.1-1.4-.2-2.1H12z"/>
    </svg>
  );
}
function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#1877F2" d="M24 12.1C24 5.4 18.6 0 12 0S0 5.4 0 12.1C0 18.1 4.4 23.1 10.1 24v-8.4H7.1v-3.5h3V9.4c0-3 1.8-4.7 4.6-4.7 1.3 0 2.6.2 2.6.2v2.9h-1.5c-1.5 0-2 .9-2 1.8v2.2h3.4l-.5 3.5h-2.9V24C19.6 23.1 24 18.1 24 12.1z"/>
    </svg>
  );
}

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const res = await api.post("/api/auth/login", { email, password });
      setToken(res.data.token);
      nav("/profile");
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      variant="login"
      title="Welcome back!"
      subtitle="Enter your credentials to access your account"
      bottomText="Don’t have an account?"
      bottomLinkText="Sign up"
      bottomLinkTo="/signup"
    >
      {err && <div className="alert error">{err}</div>}

      <form onSubmit={submit} className="form">
        <label className="label">Email address</label>
        <input
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
          autoComplete="email"
        />

        <div className="rowBetween">
          <label className="label">Password</label>
          <Link className="linkSmall" to="/reset">Forgot password?</Link>
        </div>

        <input
          className="input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          autoComplete="current-password"
        />

        <button className="btnPrimary" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <div className="divider"><span>or</span></div>

        <div className="socialRow2">
          <button type="button" className="btnSocial2">
            <GoogleIcon /> <span>Sign in with Google</span>
          </button>
          <button type="button" className="btnSocial2">
            <FacebookIcon /> <span>Sign in with Facebook</span>
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}
