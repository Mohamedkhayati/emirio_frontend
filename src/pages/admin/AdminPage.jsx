import { useEffect, useMemo, useState } from "react";
import { apiDelete, apiGet, apiPatch } from "../../api/http";
import "./admin.css";

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");

  async function loadList() {
    setError("");
    const list = await apiGet("/api/admin/users");
    setUsers(list);
    if (list.length && !selected) {
      const details = await apiGet(`/api/admin/users/${list[0].id}`);
      setSelected(details);
    }
  }

  async function selectUser(id) {
    setError("");
    const details = await apiGet(`/api/admin/users/${id}`);
    setSelected(details);
  }

  async function setStatus(id, statutCompte) {
    setError("");
    const details = await apiPatch(`/api/admin/users/${id}/status`, { statutCompte });
    setSelected(details);
    await loadList();
  }

  async function deleteUser(id) {
    setError("");
    await apiDelete(`/api/admin/users/${id}`);
    setSelected(null);
    await loadList();
  }

  useEffect(() => {
    loadList().catch((e) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return users;
    return users.filter((u) =>
      `${u.nom} ${u.prenom} ${u.email}`.toLowerCase().includes(s)
    );
  }, [q, users]);

  return (
    <div className="adminShell">
      <aside className="sidebar">
        <div className="brand">Base</div>
        <nav className="nav">
          <a className="navItem active" href="/admin">Customers</a>
          <a className="navItem" href="#">Dashboard</a>
          <a className="navItem" href="#">Analytics</a>
          <a className="navItem" href="#">Settings</a>
        </nav>
      </aside>

      <main className="main">
        <div className="topbar">
          <div>
            <div className="title">Customer List</div>
            <div className="subtitle">Manage client accounts</div>
          </div>
          <input
            className="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name / email..."
          />
        </div>

        {error && <div className="errorBox">{error}</div>}

        <div className="contentGrid">
          <section className="tableCard">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th style={{ width: 140 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr
                    key={u.id}
                    className={selected?.id === u.id ? "rowActive" : ""}
                    onClick={() => selectUser(u.id).catch((e) => setError(e.message))}
                  >
                    <td>{u.nom} {u.prenom}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`pill ${u.statutCompte === "ACTIVE" ? "ok" : "bad"}`}>
                        {u.statutCompte}
                      </span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="actions">
                        <button onClick={() => setStatus(u.id, "ACTIVE").catch((e) => setError(e.message))}>
                          Enable
                        </button>
                        <button onClick={() => setStatus(u.id, "DISABLED").catch((e) => setError(e.message))}>
                          Disable
                        </button>
                        <button className="danger" onClick={() => deleteUser(u.id).catch((e) => setError(e.message))}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr><td colSpan="4" style={{ padding: 16 }}>No clients.</td></tr>
                )}
              </tbody>
            </table>
          </section>

          <aside className="detailsCard">
            {!selected ? (
              <div className="empty">Select a client to see details</div>
            ) : (
              <>
                <div className="profileHeader">
                  <div className="avatar">{selected.nom?.[0]}{selected.prenom?.[0]}</div>
                  <div>
                    <div className="name">{selected.nom} {selected.prenom}</div>
                    <div className="role">{selected.role}</div>
                  </div>
                </div>

                <div className="infoBlock">
                  <div className="blockTitle">Contact Info</div>
                  <div className="kv"><span>Email</span><span>{selected.email}</span></div>
                  <div className="kv"><span>Status</span><span>{selected.statutCompte}</span></div>
                  <div className="kv"><span>Created</span><span>{new Date(selected.dateDeCreation).toLocaleString()}</span></div>
                </div>

                <div className="infoBlock">
                  <div className="blockTitle">Actions</div>
                  <div className="actionsCol">
                    <button onClick={() => setStatus(selected.id, "ACTIVE").catch((e) => setError(e.message))}>Enable account</button>
                    <button onClick={() => setStatus(selected.id, "DISABLED").catch((e) => setError(e.message))}>Disable account</button>
                    <button className="danger" onClick={() => deleteUser(selected.id).catch((e) => setError(e.message))}>Delete account</button>
                  </div>
                </div>
              </>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
