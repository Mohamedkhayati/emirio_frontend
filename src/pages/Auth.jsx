import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { setToken } from "../lib/auth";
import { persistAuth, normalizeRole } from "./admin/adminShared";
import rightImg from "../assets/auth-right.jpg";
import "../styles/auth-swap.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

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

function extractErrorMessage(e, fallback) {
  const data = e?.response?.data;
  return data?.message || data?.error || (typeof data === "string" ? data : "") || fallback;
}

function getLoginErrorMessage(error) {
  // 401 Unauthorized → definitely incorrect credentials
  if (error?.response?.status === 401) {
    return "Incorrect email or password. Please try again.";
  }

  const message = error?.response?.data?.message || error?.response?.data?.error || "";
  const lowerMsg = message.toLowerCase();

  if (
    lowerMsg.includes("invalid") ||
    lowerMsg.includes("incorrect") ||
    lowerMsg.includes("wrong") ||
    lowerMsg.includes("credentials") ||
    lowerMsg.includes("password") ||
    lowerMsg.includes("email")
  ) {
    return "Incorrect email or password. Please check your credentials.";
  }

  // If we can't detect, return the original message or a fallback
  return message || "Login failed. Please try again later.";
}

export default function Auth({ setMe }) {
  const nav = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

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

  // Animated alert state
  const [alert, setAlert] = useState({ show: false, message: "", type: "error" });

  const isLogin = mode === "login";

  const title = useMemo(
    () => (isLogin ? t("auth.welcomeBack") : t("auth.getStarted")),
    [isLogin, t]
  );

  const subtitle = useMemo(
    () => (isLogin ? t("auth.loginSubtitle") : t("auth.signupSubtitle")),
    [isLogin, t]
  );

  const syncMeAndGo = useCallback(
    async (tokenValue = "") => {
      try {
        const res = await api.get("/api/profile");
        const me = res.data;
        setMe?.(me);
        if (tokenValue) {
          persistAuth(tokenValue, normalizeRole(me?.role || ""));
        }
      } catch {
        setMe?.(null);
      }
      nav("/profile", {
        replace: true,
        state: { fromFreshLogin: true },
      });
    },
    [nav, setMe]
  );

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const requestedMode = params.get("mode");
    setMode(requestedMode === "signup" ? "signup" : "login");
  }, [location.search]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const socialToken = params.get("socialToken");
    const socialError = params.get("error");

    if (socialError) {
      const decodedError = decodeURIComponent(socialError);
      showAlert(decodedError, "error");
      window.history.replaceState({}, "", "/auth?mode=login");
      return;
    }

    if (socialToken) {
      const decodedToken = decodeURIComponent(socialToken);
      setToken(decodedToken);
      syncMeAndGo(decodedToken);
    }
  }, [location.search, syncMeAndGo]);

  function showAlert(message, type = "error") {
    setAlert({ show: true, message, type });
    setTimeout(() => {
      setAlert({ show: false, message: "", type: "error" });
    }, 4000);
  }

  function switchMode(next) {
    setErr("");
    setOk("");
    setMode(next);
    nav(`/auth?mode=${next}`, { replace: true });
  }

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setOk("");
    setLoading(true);

    try {
      if (isLogin) {
        const res = await api.post("/api/auth/login", {
          email: loginEmail.trim(),
          password: loginPassword,
        });
        const token = res?.data?.token || "";
        setToken(token);
        await syncMeAndGo(token);
      } else {
        if (!agree) {
          const msg = t("auth.acceptTerms");
          setErr(msg);
          showAlert(msg, "error");
          setLoading(false);
          return;
        }

        await api.post("/api/auth/signup", {
          nom: nom.trim(),
          prenom: prenom.trim(),
          email: email.trim(),
          password,
        });

        const loginRes = await api.post("/api/auth/login", {
          email: email.trim(),
          password,
        });
        const token = loginRes?.data?.token || "";
        setToken(token);
        await syncMeAndGo(token);
      }
    } catch (e2) {
      let errorMsg;
      if (isLogin) {
        errorMsg = getLoginErrorMessage(e2);
      } else {
        errorMsg = extractErrorMessage(e2, t("auth.signupFailed", "Signup failed."));
      }
      setErr(errorMsg);
      showAlert(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="authShellSwap">
      {/* Animated Alert */}
      {alert.show && (
        <div className={`animatedAlert ${alert.type}`}>
          <div className="alertContent">
            <span className="alertIcon">{alert.type === "error" ? "⚠️" : "✅"}</span>
            <span className="alertMessage">{alert.message}</span>
            <button
              className="alertClose"
              onClick={() => setAlert({ show: false, message: "", type: "error" })}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className={`swapCard ${isLogin ? "isLogin" : "isSignup"}`}>
        <div className="panel formPanel">
          <div className="head">
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>

          {err && !alert.show && <div className="alert error">{err}</div>}
          {ok && !alert.show && <div className="alert ok">{ok}</div>}

          <form className="authFormReal" onSubmit={submit}>
            {isLogin ? (
              <>
                <label className="authLabelReal">{t("auth.email")}</label>
                <input
                  className="authInputReal"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder={t("auth.emailPlaceholder")}
                  required
                />

                <label className="authLabelReal">{t("auth.password")}</label>
                <input
                  className="authInputReal"
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder={t("auth.passwordPlaceholder")}
                  required
                />

                <div className="forgotRowReal">
                  <Link to="/forgot-password" className="linkBtnReal">
                    {t("auth.forgotPassword")}
                  </Link>
                </div>

                <button type="submit" className="btnPrimaryReal" disabled={loading}>
                  {loading ? t("auth.loggingIn") : t("auth.login")}
                </button>

                <div className="dividerReal">
                  <span>{t("auth.or")}</span>
                </div>

                <div className="socialRowReal">
                  <button
                    type="button"
                    className="btnSocialReal"
                    onClick={() => startSocialLogin("google")}
                  >
                    <GoogleIcon />
                    <span>{t("auth.continueGoogle")}</span>
                  </button>
                  <button
                    type="button"
                    className="btnSocialReal"
                    onClick={() => startSocialLogin("facebook")}
                  >
                    <FacebookIcon />
                    <span>{t("auth.continueFacebook")}</span>
                  </button>
                </div>

                <div className="switchLineReal">
                  {t("auth.noAccount")}{" "}
                  <button
                    type="button"
                    className="linkBtnReal inlineBtnReal"
                    onClick={() => switchMode("signup")}
                  >
                    {t("auth.signUp")}
                  </button>
                </div>
              </>
            ) : (
              <>
                <label className="authLabelReal">{t("auth.nom")}</label>
                <input
                  className="authInputReal"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  required
                />

                <label className="authLabelReal">{t("auth.prenom")}</label>
                <input
                  className="authInputReal"
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  required
                />

                <label className="authLabelReal">{t("auth.email")}</label>
                <input
                  className="authInputReal"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("auth.emailPlaceholder")}
                  required
                />

                <label className="authLabelReal">{t("auth.password")}</label>
                <input
                  className="authInputReal"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("auth.passwordMin")}
                  minLength={8}
                  required
                />

                <label className="checkRowReal">
                  <input
                    type="checkbox"
                    checked={agree}
                    onChange={(e) => setAgree(e.target.checked)}
                  />
                  <span>{t("auth.agreeTerms")}</span>
                </label>

                <button type="submit" className="btnPrimaryReal" disabled={loading}>
                  {loading ? t("auth.creating") : t("auth.signup")}
                </button>

                <div className="dividerReal">
                  <span>{t("auth.or")}</span>
                </div>

                <div className="socialRowReal">
                  <button
                    type="button"
                    className="btnSocialReal"
                    onClick={() => startSocialLogin("google")}
                  >
                    <GoogleIcon />
                    <span>{t("auth.continueGoogle")}</span>
                  </button>
                  <button
                    type="button"
                    className="btnSocialReal"
                    onClick={() => startSocialLogin("facebook")}
                  >
                    <FacebookIcon />
                    <span>{t("auth.continueFacebook")}</span>
                  </button>
                </div>

                <div className="switchLineReal">
                  {t("auth.haveAccount")}{" "}
                  <button
                    type="button"
                    className="linkBtnReal inlineBtnReal"
                    onClick={() => switchMode("login")}
                  >
                    {t("auth.signIn")}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>

        <div className="panel imagePanel" aria-hidden="true">
          <img className="heroImg" src={rightImg} alt="EMIRIO" />
          <div className="imageOverlayBrand">
            <div className="brandMini">emirio</div>
            <div className="brandMiniText">Un pas d'avance...un pas d'élégance!</div>
          </div>
        </div>
      </div>
    </div>
  );
}