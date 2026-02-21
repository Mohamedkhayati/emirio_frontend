import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { clearToken } from "../lib/auth";
import "../styles/profile.css";

function initials(nom, prenom) {
  const a = (prenom || "").trim().slice(0, 1).toUpperCase();
  const b = (nom || "").trim().slice(0, 1).toUpperCase();
  return (a + b) || "U";
}

export default function Profile() {
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [edit, setEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    phone: "",
    birthday: "",
    country: "Tunisia",
    city: "Sfax",
  });

  async function load() {
    const res = await api.get("/api/profile");
    setData(res.data);
    setForm((f) => ({
      ...f,
      nom: res.data.nom || "",
      prenom: res.data.prenom || "",
    }));
  }

  useEffect(() => {
    load().catch(() => {
      clearToken();
      nav("/login");
    });
  }, []);

  const avatarText = useMemo(
    () => initials(form.nom, form.prenom),
    [form.nom, form.prenom]
  );

  async function save() {
    setSaving(true);
    setErr("");
    setMsg("");
    try {
      await api.put("/api/profile", { nom: form.nom, prenom: form.prenom });
      setMsg("Profile updated");
      setEdit(false);
      await load();
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function logout() {
    clearToken();
    nav("/login");
  }

  if (!data) return <div className="pagePad">Loading...</div>;

  return (
    <div className="pagePad">
      <div className="topBar">
        <div>
          <div className="hello">Welcome, {data.prenom}</div>
          <div className="sub">Manage your personal information</div>
        </div>
        <div className="topActions">
          <button className="btnGhost" onClick={logout}>Logout</button>
          <div className="miniAvatar">{avatarText}</div>
        </div>
      </div>

      <div className="card">
        <div className="cardHeader">
          <div className="profileRow">
            <div className="avatar">{avatarText}</div>
            <div>
              <div className="name">{form.prenom} {form.nom}</div>
              <div className="email">{data.email}</div>
            </div>
          </div>

          <button
            className="btnPink"
            onClick={() => (edit ? save() : setEdit(true))}
            disabled={saving}
          >
            {edit ? (saving ? "Saving..." : "Save") : "Edit"}
          </button>
        </div>

        {(msg || err) && (
          <div className="cardMsg">
            {err && <div className="alert error">{err}</div>}
            {msg && <div className="alert ok">{msg}</div>}
          </div>
        )}

        <div className="grid">
          <div className="field">
            <label>Nom</label>
            <input
              value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
              disabled={!edit}
            />
          </div>

          <div className="field">
            <label>Prenom</label>
            <input
              value={form.prenom}
              onChange={(e) => setForm({ ...form, prenom: e.target.value })}
              disabled={!edit}
            />
          </div>

          <div className="field">
            <label>Numéro téléphone</label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              disabled={!edit}
              placeholder="+216 ..."
            />
          </div>

          <div className="field">
            <label>Date</label>
            <input
              value={form.birthday}
              onChange={(e) => setForm({ ...form, birthday: e.target.value })}
              disabled={!edit}
              placeholder="YYYY-MM-DD"
            />
          </div>

          <div className="field">
            <label>Pays</label>
            <select
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              disabled={!edit}
            >
              <option>Tunisia</option>
              <option>France</option>
              <option>Italy</option>
            </select>
          </div>

          <div className="field">
            <label>Ville</label>
            <select
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              disabled={!edit}
            >
              <option>Sfax</option>
              <option>Tunis</option>
              <option>Sousse</option>
            </select>
          </div>
        </div>

        <div className="note">
          Only <b>Nom</b> and <b>Prenom</b> are saved to backend in Sprint 1.
        </div>
      </div>
    </div>
  );
}
