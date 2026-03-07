import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { setToken } from "../lib/auth";
import rightImg from "../assets/auth-right.jpg";
import "../styles/auth-swap.css";

const API_BASE = "http://localhost:8080";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.4c-.2 1.2-1.4 3.5-5.4 3.5-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C17.8 1.6 15.2 0 12 0 5.4 0 0 5.4 0 12s5.4 12 12 12c6.9 0 11.5-4.8 11.5-11.6 0-.8-.1-1.4-.2-2.1H12z"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#1877F2"
        d="M24 12.1C24 5.4 18.6 0 12 0S0 5.4 0 12.1C0 18.1 4.4 23.1 10.1 24v-8.4H7.1v-3.5h3V9.4c0-3 1.8-4.7 4.6-4.7 1.3 0 2.6.2 2.6.2v2.9h-1.5c-1.5 0-2 .9-2 1.8v2.2h3.4l-.5 3.5h-2.9V24C19.6 23.1 24 18.1 24 12.1z"
      />
    </svg>
  );
}

function startSocialLogin(provider) {
  window.location.href = `${API_BASE}/oauth2/authorization/${provider}`;
}

export default function Auth() {
  const nav = useNavigate();
  const [mode, setMode] = useState("login");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false);

  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(false);

  const isLogin = mode === "login";
  const title = useMemo(() => (isLogin ? "Welcome back!" : "Get Started Now"), [isLogin]);
  const subtitle = useMemo(
    () => (isLogin ? "Enter your credentials to access your account" : "Create your account in seconds"),
    [isLogin]
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const socialToken = params.get("socialToken");
    const socialError = params.get("error");

    if (socialError) {
      setErr(decodeURIComponent(socialError));
      window.history.replaceState({}, "", "/auth");
      return;
    }

    if (socialToken) {
      setToken(decodeURIComponent(socialToken));
      window.history.replaceState({}, "", "/profile");
      nav("/profile", { replace: true });
    }
  }, [nav]);

  function switchMode(next) {
    setErr("");
    setOk("");
    setMode(next);
  }

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setOk("");
    setLoading(true);

    try {
      if (isLogin) {
        const res = await api.post("/api/auth/login", {
          email: loginEmail,
          password: loginPassword,
        });
        setToken(res.data.token);
        nav("/profile", { replace: true });
      } else {
        if (!agree) {
          setErr("Please accept terms & policy.");
          setLoading(false);
          return;
        }

        await api.post("/api/auth/signup", { nom, prenom, email, password });
        setOk("Account created. Switch to login.");
        setMode("login");
        setLoginEmail(email);
        setLoginPassword(password);
      }
    } catch (e2) {
      const data = e2?.response?.data;
      const msg =
        data?.message ||
        (typeof data === "string" ? data : "") ||
        data?.error ||
        `Request failed (${e2?.response?.status || "no status"})`;

      setErr(msg || "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="authShellSwap">
      <div className={`swapCard ${isLogin ? "isLogin" : "isSignup"}`}>
        <div className="panel formPanel">
          <div className="head">
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>

          {err && <div className="alert error">{err}</div>}
          {ok && <div className="alert ok">{ok}</div>}

          <form className="form" onSubmit={submit}>
            {isLogin ? (
              <>
                <label className="label">Email address</label>
                <input
                  className="input"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="name@example.com"
                />

                <label className="label">Password</label>
                <input
                  className="input"
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your password"
                />

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                  <Link to="/forgot-password" className="linkBtn" style={{ padding: 0 }}>
                    Mot de passe oublié ?
                  </Link>
                </div>

                <button className="btnPrimary" disabled={loading}>
                  {loading ? "Logging in..." : "Login"}
                </button>

                <div className="divider">
                  <span>or</span>
                </div>

                <div className="socialRow">
                  <button
                    type="button"
                    className="btnSocial"
                    onClick={() => startSocialLogin("google")}
                  >
                    <GoogleIcon />
                    <span>Continue with Google</span>
                  </button>

                  <button
                    type="button"
                    className="btnSocial"
                    onClick={() => startSocialLogin("facebook")}
                  >
                    <FacebookIcon />
                    <span>Continue with Facebook</span>
                  </button>
                </div>

                <div className="switchLine">
                  Don’t have an account?{" "}
                  <button type="button" className="linkBtn" onClick={() => switchMode("signup")}>
                    Sign up
                  </button>
                </div>
              </>
            ) : (
              <>
                <label className="label">Nom</label>
                <input className="input" value={nom} onChange={(e) => setNom(e.target.value)} />

                <label className="label">Prenom</label>
                <input className="input" value={prenom} onChange={(e) => setPrenom(e.target.value)} />

                <label className="label">Email address</label>
                <input
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                />

                <label className="label">Password</label>
                <input
                  className="input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                />

                <label className="checkRow">
                  <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
                  <span>I agree to the terms & policy</span>
                </label>

                <button className="btnPrimary" disabled={loading}>
                  {loading ? "Creating..." : "Signup"}
                </button>

                <div className="divider">
                  <span>or</span>
                </div>

                <div className="socialRow">
                  <button
                    type="button"
                    className="btnSocial"
                    onClick={() => startSocialLogin("google")}
                  >
                    <GoogleIcon />
                    <span>Continue with Google</span>
                  </button>

                  <button
                    type="button"
                    className="btnSocial"
                    onClick={() => startSocialLogin("facebook")}
                  >
                    <FacebookIcon />
                    <span>Continue with Facebook</span>
                  </button>
                </div>

                <div className="switchLine">
                  Have an account?{" "}
                  <button type="button" className="linkBtn" onClick={() => switchMode("login")}>
                    Sign in
                  </button>
                </div>
              </>
            )}
          </form>
        </div>

        <div className="panel imagePanel" aria-hidden="true">
          <img className="heroImg" src={rightImg} alt="" />
        </div>
      </div>
    </div>
  );
}
