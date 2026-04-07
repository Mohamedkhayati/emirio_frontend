import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import "../styles/admin.css";

function initials(nom, prenom) {
  const a = (prenom || "").trim().slice(0, 1).toUpperCase();
  const b = (nom || "").trim().slice(0, 1).toUpperCase();
  return (a + b) || "U";
}

export default function AdminClients() {
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const res = await api.get("/api/admin/clients");
      setRows(res.data);
      setSelected(res.data?.[0] || null);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load clients");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const selectedName = useMemo(() => {
    if (!selected) return "";
    return `${selected.prenom} ${selected.nom}`;
  }, [selected]);

  async function setStatus(newStatus) {
    if (!selected) return;
    try {
      const res = await api.put(`/api/admin/clients/${selected.id}/status`, {
        statutCompte: newStatus,
      });
      const updated = res.data;
      setSelected(updated);
      setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    } catch (e) {
      alert(e?.response?.data?.message || "Update failed");
    }
  }

  return (
    <div className="grid2">
      <div className="card">
        <div className="cardHead">
          <div className="cardTitle">Customer List</div>
          <button className="btnPrimarySm" onClick={load}>Refresh</button>
        </div>

        {loading && <div className="muted">Loading...</div>}
        {err && <div className="errBox">{err}</div>}

        {!loading && !err && (
          <div className="table">
            <div className="tr th">
              <div>Name</div>
              <div>Email</div>
              <div>Role</div>
              <div>Status</div>
            </div>

            {rows.map((r) => (
              <button
                key={r.id}
                className={`tr rowBtn ${selected?.id === r.id ? "active" : ""}`}
                onClick={() => setSelected(r)}
              >
                <div className="nameCell">
                  <span className="avatarSm">{initials(r.nom, r.prenom)}</span>
                  <span>{r.prenom} {r.nom}</span>
                </div>
                <div className="muted">{r.email}</div>
                <div className="pill">{r.role}</div>
                <div className={`status ${r.statutCompte === "ACTIVE" ? "ok" : "bad"}`}>
                  {r.statutCompte}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="card rightCard">
        {!selected ? (
          <div className="muted">Select a customer</div>
        ) : (
          <>
            <div className="profileBox">
              <div className="avatarLg">{initials(selected.nom, selected.prenom)}</div>
              <div>
                <div className="bigName">{selectedName}</div>
                <div className="muted">{selected.email}</div>
              </div>
            </div>

            <div className="section">
              <div className="secTitle">Account</div>
              <div className="kv">
                <div className="k">Role</div>
                <div className="v">{selected.role}</div>
              </div>
              <div className="kv">
                <div className="k">Status</div>
                <div className="v">
                  <span className={`status ${selected.statutCompte === "ACTIVE" ? "ok" : "bad"}`}>
                    {selected.statutCompte}
                  </span>
                </div>
              </div>
            </div>

            <div className="actions">
              <button className="btnGood" onClick={() => setStatus("ACTIVE")}>Activate</button>
              <button className="btnBad" onClick={() => setStatus("BLOCKED")}>Block</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
