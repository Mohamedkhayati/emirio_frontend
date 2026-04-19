import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { clearToken } from "../lib/auth";
import { clearStoredAuth } from "./admin/adminShared";
import "../styles/profile.css";

function initials(nom, prenom) {
  const a = (prenom || "").trim().slice(0, 1).toUpperCase();
  const b = (nom || "").trim().slice(0, 1).toUpperCase();
  return (a + b) || "U";
}

function calcAge(dateString) {
  if (!dateString) return null;

  const birth = new Date(dateString);
  if (Number.isNaN(birth.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }

  if (age < 0 || age > 130) return null;
  return age;
}

function extractErrorMessage(e, fallback) {
  const data = e?.response?.data;
  return data?.message || data?.error || (typeof data === "string" ? data : "") || fallback;
}

function Avatar({ src, text, className = "", big = false }) {
  if (src) {
    return (
      <div className={`avatarShell ${className} ${big ? "avatarBig" : ""}`}>
        <img src={src} alt="Profile" className="avatarImg" />
      </div>
    );
  }

  return (
    <div className={`avatarShell avatarFallback ${className} ${big ? "avatarBig" : ""}`}>
      {text}
    </div>
  );
}

export default function Profile({ setMe }) {
  const nav = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const loginTriggeredRef = useRef(Boolean(location.state?.fromFreshLogin));

  const [data, setData] = useState(null);
  const [edit, setEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");
  const [localPreview, setLocalPreview] = useState("");

  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    dateNaissance: "",
    sexe: "",
  });

  useEffect(() => {
    if (location.state?.fromFreshLogin) {
      nav(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, nav]);

  useEffect(() => {
    if (showOnboarding) document.body.classList.add("modal-open");
    else document.body.classList.remove("modal-open");

    return () => document.body.classList.remove("modal-open");
  }, [showOnboarding]);

  useEffect(() => {
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [photoUrl, localPreview]);

  async function loadPhoto() {
    try {
      const res = await api.get("/api/profile/photo", { responseType: "blob" });
      const nextUrl = URL.createObjectURL(res.data);

      setPhotoUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return nextUrl;
      });
    } catch {
      setPhotoUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return "";
      });
    }
  }

  async function load() {
    const res = await api.get("/api/profile");
    const user = res.data;

    setData(user);
    setMe?.(user);

    setForm({
      nom: user.nom || "",
      prenom: user.prenom || "",
      dateNaissance: user.dateNaissance || "",
      sexe: user.sexe || "",
    });

    if (user.hasPhoto) {
      await loadPhoto();
    } else {
      setPhotoUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return "";
      });
    }

    setShowOnboarding(loginTriggeredRef.current && !user.profileCompleted);
  }

  useEffect(() => {
    load().catch(() => {
      clearToken();
      clearStoredAuth();
      setMe?.(null);
      nav("/auth", { replace: true });
    });
  }, [nav, setMe]);

  const avatarText = useMemo(() => initials(form.nom, form.prenom), [form.nom, form.prenom]);
  const previewAge = useMemo(() => calcAge(form.dateNaissance), [form.dateNaissance]);

  function updateField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function validate(requireFullProfile = false) {
    if (!form.nom.trim()) return t("profile.nomRequired", "Last name is required.");
    if (!form.prenom.trim()) return t("profile.prenomRequired", "First name is required.");
    if (requireFullProfile && !form.dateNaissance) {
      return t("profile.birthRequired", "Date of birth is required.");
    }
    if (form.dateNaissance && calcAge(form.dateNaissance) === null) {
      return t("profile.birthInvalid", "Please enter a valid date of birth.");
    }
    if (requireFullProfile && !form.sexe) {
      return t("profile.genderRequired", "Please select gender.");
    }
    return "";
  }

  async function save(options = {}) {
    const requireFullProfile = !!options.requireFullProfile;
    const validationError = validate(requireFullProfile || showOnboarding);

    if (validationError) {
      setErr(validationError);
      setMsg("");
      return;
    }

    setSaving(true);
    setErr("");
    setMsg("");

    try {
      const res = await api.put("/api/profile", {
        nom: form.nom.trim(),
        prenom: form.prenom.trim(),
        dateNaissance: form.dateNaissance || null,
        sexe: form.sexe || null,
      });

      const user = res.data;
      setData(user);
      setMe?.(user);
      setEdit(false);
      setShowOnboarding(false);
      setMsg(t("profile.updated", "Profile updated successfully."));
    } catch (e2) {
      setErr(extractErrorMessage(e2, t("profile.saveFailed", "Failed to save profile.")));
    } finally {
      setSaving(false);
    }
  }

  async function onPhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErr(t("profile.photoInvalid", "Please choose a valid image file."));
      return;
    }

    const tempUrl = URL.createObjectURL(file);
    setLocalPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return tempUrl;
    });

    const fd = new FormData();
    fd.append("photo", file);

    setUploadingPhoto(true);
    setErr("");
    setMsg("");

    try {
      const res = await api.post("/api/profile/photo", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setData(res.data);
      setMe?.(res.data);
      await loadPhoto();
      setMsg(t("profile.photoUpdated", "Profile photo updated successfully."));
    } catch (e2) {
      setErr(
        extractErrorMessage(
          e2,
          t("profile.photoUploadFailed", "Failed to upload profile photo.")
        )
      );
    } finally {
      setUploadingPhoto(false);
    }
  }

  function logout() {
    clearToken();
    clearStoredAuth();
    setMe?.(null);
    nav("/auth", { replace: true });
  }

  if (!data) {
    return <div className="pagePad">{t("common.loading", "Loading...")}</div>;
  }

  const displayedAge = previewAge ?? data.age ?? "—";
  const displayedGender = form.sexe || data.sexe || "—";
  const displayedPhoto = localPreview || photoUrl;

  return (
    <>
      <div className="pagePad">
        <div className="topBar">
          <div>
            <div className="hello">
              {t("profile.welcome", "Welcome")}, {data.prenom || form.prenom || "User"}
            </div>
            <div className="sub">
              {t("profile.manage", "Manage your personal information and profile photo.")}
            </div>
          </div>

          <div className="topActions">
            <button className="btnGhost" onClick={logout}>
              {t("common.logout", "Logout")}
            </button>
            <Avatar src={displayedPhoto} text={avatarText} className="miniAvatar" />
          </div>
        </div>

        <div className="statsGrid">
          <div className="statCard">
            <span>{t("profile.age", "Age")}</span>
            <strong>{displayedAge}</strong>
          </div>

          <div className="statCard">
            <span>{t("profile.gender", "Gender")}</span>
            <strong>{displayedGender}</strong>
          </div>

          <div className="statCard">
            <span>{t("profile.status", "Profile status")}</span>
            <strong>
              {data.profileCompleted
                ? t("profile.complete", "Complete")
                : t("profile.incomplete", "Incomplete")}
            </strong>
          </div>
        </div>

        <div className="card">
          <div className="profileHero">
            <Avatar src={displayedPhoto} text={avatarText} className="heroAvatar" big />

            <div className="heroInfo">
              <div className="name bigName">
                {form.prenom} {form.nom}
              </div>
              <div className="email">{data.email}</div>
              <div className="avatarHint">
                {data.hasPhoto
                  ? t("profile.photoReady", "Your profile photo is stored in the database.")
                  : t("profile.photoFallback", "No profile photo yet. Upload one now.")}
              </div>

              <label className="uploadBtn">
                {uploadingPhoto
                  ? t("profile.uploadingPhoto", "Uploading...")
                  : t("profile.changePhoto", "Upload profile photo")}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={onPhotoChange}
                  hidden
                />
              </label>
            </div>
          </div>

          {(msg || err) && (
            <div className="cardMsg">
              {err && <div className="alert error">{err}</div>}
              {msg && <div className="alert ok">{msg}</div>}
            </div>
          )}

          <div className="cardHeader slimHeader">
            <div className="sectionTitle">{t("profile.personalInfo", "Personal information")}</div>

            <div className="headerButtons">
              {edit && (
                <button
                  className="btnGhost"
                  onClick={() => {
                    setEdit(false);
                    setErr("");
                    setMsg("");
                    setForm({
                      nom: data.nom || "",
                      prenom: data.prenom || "",
                      dateNaissance: data.dateNaissance || "",
                      sexe: data.sexe || "",
                    });
                  }}
                  disabled={saving}
                >
                  {t("common.cancel", "Cancel")}
                </button>
              )}

              <button
                className="btnPink"
                onClick={() => (edit ? save() : setEdit(true))}
                disabled={saving}
              >
                {edit
                  ? saving
                    ? t("profile.saving", "Saving...")
                    : t("common.save", "Save")
                  : t("common.edit", "Edit")}
              </button>
            </div>
          </div>

          <div className="grid">
            <div className="field">
              <label>{t("auth.nom", "Nom")}</label>
              <input
                value={form.nom}
                onChange={(e) => updateField("nom", e.target.value)}
                disabled={!edit}
              />
            </div>

            <div className="field">
              <label>{t("auth.prenom", "Prenom")}</label>
              <input
                value={form.prenom}
                onChange={(e) => updateField("prenom", e.target.value)}
                disabled={!edit}
              />
            </div>

            <div className="field">
              <label>{t("profile.email", "Email")}</label>
              <div className="inputLike">{data.email}</div>
            </div>

            <div className="field">
              <label>{t("profile.dateOfBirth", "Date of birth")}</label>
              <input
                type="date"
                value={form.dateNaissance}
                onChange={(e) => updateField("dateNaissance", e.target.value)}
                disabled={!edit}
                max={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div className="field">
              <label>{t("profile.gender", "Gender")}</label>
              <select
                value={form.sexe}
                onChange={(e) => updateField("sexe", e.target.value)}
                disabled={!edit}
              >
                <option value="">{t("profile.selectGender", "Select gender")}</option>
                <option value="MALE">{t("profile.male", "Male")}</option>
                <option value="FEMALE">{t("profile.female", "Female")}</option>
              </select>
            </div>

            <div className="field">
              <label>{t("profile.age", "Age")}</label>
              <div className="inputLike">{displayedAge}</div>
            </div>
          </div>
        </div>
      </div>

      {showOnboarding && (
        <div className="modalBackdrop">
          <div
            className="profileModal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="complete-profile-title"
          >
            <h2 id="complete-profile-title">
              {t("profile.completeTitle", "Complete your profile")}
            </h2>

            <p className="modalText">
              {t("profile.completeText", "Please complete your profile before continuing.")}
            </p>

            {err && <div className="alert error">{err}</div>}

            <div className="grid modalGrid">
              <div className="field">
                <label>{t("auth.nom", "Nom")}</label>
                <input
                  value={form.nom}
                  onChange={(e) => updateField("nom", e.target.value)}
                />
              </div>

              <div className="field">
                <label>{t("auth.prenom", "Prenom")}</label>
                <input
                  value={form.prenom}
                  onChange={(e) => updateField("prenom", e.target.value)}
                />
              </div>

              <div className="field">
                <label>{t("profile.dateOfBirth", "Date of birth")}</label>
                <input
                  type="date"
                  value={form.dateNaissance}
                  onChange={(e) => updateField("dateNaissance", e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>

              <div className="field">
                <label>{t("profile.gender", "Gender")}</label>
                <select
                  value={form.sexe}
                  onChange={(e) => updateField("sexe", e.target.value)}
                >
                  <option value="">{t("profile.selectGender", "Select gender")}</option>
                  <option value="MALE">{t("profile.male", "Male")}</option>
                  <option value="FEMALE">{t("profile.female", "Female")}</option>
                </select>
              </div>
            </div>

            <div className="modalActions">
              <button className="btnGhost" onClick={logout} disabled={saving}>
                {t("common.logout", "Logout")}
              </button>

              <button
                className="btnPink"
                onClick={() => save({ requireFullProfile: true })}
                disabled={saving}
              >
                {saving
                  ? t("profile.saving", "Saving...")
                  : t("profile.saveContinue", "Save and continue")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}