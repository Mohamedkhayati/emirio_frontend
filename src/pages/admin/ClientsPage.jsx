// src/pages/admin/ClientsPage.jsx
import React, { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { api } from "../../lib/api";
import { fmt, initials } from "./adminShared";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode } from "primereact/api";

const EMPTY_FORM = {
  nom: "",
  prenom: "",
  email: "",
  password: "",
  role: "CLIENT", // ✅ Changed from USER to CLIENT
  statutCompte: "ACTIVE",
};

// ✅ Use exact DB names for values
const ROLE_OPTIONS = ["CLIENT", "Gestionnaire de catalogue", "Responsable e-commerce"];
const STATUS_OPTIONS = ["ACTIVE", "BLOCKED", "DISABLED"];

// ✅ Translate DB names to nice UI names
const getRoleDisplayName = (role) => {
  switch (role) {
    case "CLIENT":
    case "USER":
      return "Client";
    case "VENDEUR":
      return "Gestionnaire de catalogue";
    case "CONTROLEUR":
      return "Responsable e-commerce";
    case "ADMIN_GENERAL":
      return "Administrateur";
    default:
      return role || "-";
  }
};

export default function ClientsPage() {
  const { isAdminGeneral } = useOutletContext();

  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [historyRows, setHistoryRows] = useState([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });
  const [globalFilterValue, setGlobalFilterValue] = useState("");

  const profileDialogRef = useRef(null);
  const createDialogRef = useRef(null);

  const onGlobalFilterChange = (e) => {
    const value = e.target.value;
    setFilters({
      global: { value, matchMode: FilterMatchMode.CONTAINS },
    });
    setGlobalFilterValue(value);
  };

  function safeOpenDialog(ref) {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }

  function closeDialog(ref) {
    ref.current?.close();
  }

  function onBackdropClose(e) {
    if (e.target === e.currentTarget) {
      e.currentTarget.close();
    }
  }

  async function loadList(keepSelection = true) {
    if (!isAdminGeneral) return;

    setError("");
    setLoadingList(true);

    try {
      const res = await api.get("/api/admin/users");
      const all = Array.isArray(res.data) ? res.data : [];
      // ✅ Filter using the DB role name "CLIENT"
      // ✅ Filter using the display role name returned by the backend
      const filtered = all.filter((u) => u.role === "Client" || u.role === "USER");      setRows(filtered);

      if (!filtered.length) {
        setSelected(null);
        setHistoryRows([]);
        return;
      }

      if (keepSelection && selected?.id) {
        const stillExists = filtered.find((u) => u.id === selected.id);
        if (stillExists) {
          await loadProfile(selected.id, false);
          return;
        }
      }

      if (!keepSelection) {
        setSelected(null);
        setHistoryRows([]);
      }
    } catch (e) {
      setError(e?.response?.data?.message || "Cannot load clients");
      setRows([]);
      setSelected(null);
      setHistoryRows([]);
    } finally {
      setLoadingList(false);
    }
  }

  async function loadProfile(id, openModal = true) {
    if (!isAdminGeneral || !id) return;
    setError("");
    setLoadingProfile(true);

    try {
      const [detailRes, historyRes] = await Promise.all([
        api.get(`/api/admin/users/${id}`),
        api.get(`/api/admin/users/${id}/history`),
      ]);

      setSelected(detailRes.data);
      setHistoryRows(Array.isArray(historyRes.data) ? historyRes.data : []);

      if (openModal) safeOpenDialog(profileDialogRef);
    } catch (e) {
      setError(e?.response?.data?.message || "Cannot load profile");
    } finally {
      setLoadingProfile(false);
    }
  }

  async function setStatus(id, statutCompte) {
    if (!isAdminGeneral) return;
    const action = statutCompte === "ACTIVE" ? "activate" : "block";
    const confirmMsg =
      action === "block"
        ? "Are you sure you want to BLOCK this client? They will not be able to log in."
        : "Are you sure you want to ACTIVATE this client?";
    if (!window.confirm(confirmMsg)) return;

    setError("");
    setBusyId(id);

    try {
      const res = await api.put(`/api/admin/users/${id}/status`, { statutCompte });
      setSelected(res.data);
      await loadList(true);
      await loadProfile(id, false);
      window.dispatchEvent(new CustomEvent("userRoleChanged"));
    } catch (e) {
      setError(e?.response?.data?.message || "Status update failed");
    } finally {
      setBusyId(null);
    }
  }

  async function updateUserRole(id, role) {
    if (!isAdminGeneral) return;

    const oldRole = selected?.role;
    setError("");
    setBusyId(id);

    try {
      const res = await api.put(`/api/admin/users/${id}/role`, { role });
      setSelected(res.data);
      await loadList(true);
      await loadProfile(id, false);
      window.dispatchEvent(new CustomEvent("userRoleChanged"));
      
      // ✅ Corrected transition check
      if (oldRole === "CLIENT" && role !== "CLIENT") {
        closeDialog(profileDialogRef);
        alert(`User moved to Workers (${getRoleDisplayName(role)})`);
      }
    } catch (e) {
      setError(e?.response?.data?.message || "Role update failed");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteUser(id) {
    if (!isAdminGeneral) return;
    if (!window.confirm("Delete this client permanently? This action cannot be undone.")) return;

    setError("");
    setBusyId(id);

    try {
      await api.delete(`/api/admin/users/${id}`);
      closeDialog(profileDialogRef);
      setSelected(null);
      setHistoryRows([]);
      await loadList(false);
      window.dispatchEvent(new CustomEvent("userRoleChanged"));
    } catch (e) {
      setError(e?.response?.data?.message || "Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  async function createUser(e) {
    e.preventDefault();
    if (!isAdminGeneral) return;

    setError("");
    setCreating(true);

    try {
      await api.post("/api/admin/users", form);
      setForm(EMPTY_FORM);
      closeDialog(createDialogRef);
      await loadList(false);
      window.dispatchEvent(new CustomEvent("userRoleChanged"));
    } catch (e) {
      setError(e?.response?.data?.message || "Create client failed");
    } finally {
      setCreating(false);
    }
  }

  useEffect(() => {
    loadList(false);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") loadList(false);
    };
    const handleRoleChange = () => loadList(false);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("userRoleChanged", handleRoleChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("userRoleChanged", handleRoleChange);
    };
  }, [isAdminGeneral]);

  const nameBodyTemplate = (rowData) => (
    <div className="flex align-items-center gap-2">
      <div className="admAvatar" style={{ flexShrink: 0 }}>
        {initials(rowData.nom, rowData.prenom)}
      </div>
      <div>
        <div className="font-bold">
          {rowData.prenom} {rowData.nom}
        </div>
        <div className="text-sm text-500">{getRoleDisplayName(rowData.role)}</div>
      </div>
    </div>
  );

  const statusBodyTemplate = (rowData) => {
    let severity = "warning";
    if (rowData.statutCompte === "ACTIVE") severity = "success";
    else if (rowData.statutCompte === "BLOCKED") severity = "danger";
    else severity = "secondary";
    return <Tag value={rowData.statutCompte} severity={severity} />;
  };

  const actionBodyTemplate = (rowData) => (
    <div className="flex gap-2">
      <Button
        icon="pi pi-user"
        rounded
        outlined
        title="Profile"
        onClick={() => loadProfile(rowData.id, true)}
        disabled={busyId === rowData.id}
      />
      {rowData.statutCompte !== "ACTIVE" ? (
        <Button
          icon="pi pi-check"
          rounded
          outlined
          severity="success"
          title="Activate"
          onClick={() => setStatus(rowData.id, "ACTIVE")}
          disabled={busyId === rowData.id}
        />
      ) : (
        <Button
          icon="pi pi-ban"
          rounded
          outlined
          severity="danger"
          title="Block"
          onClick={() => setStatus(rowData.id, "BLOCKED")}
          disabled={busyId === rowData.id}
        />
      )}
    </div>
  );

  const header = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-2 p-3">
      <div>
        <span className="text-xl text-900 font-bold">Clients</span>
        <div className="text-sm text-500 mt-1">{rows.length} clients found</div>
      </div>

      <div className="flex gap-2">
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            value={globalFilterValue}
            onChange={onGlobalFilterChange}
            placeholder="Search name / email..."
          />
        </span>
        <Button
          icon="pi pi-refresh"
          outlined
          onClick={() => loadList(true)}
          title="Refresh"
        />
        <Button
          icon="pi pi-plus"
          label="Create client"
          onClick={() => safeOpenDialog(createDialogRef)}
        />
      </div>
    </div>
  );

  if (!isAdminGeneral) {
    return (
      <div className="fadeInUp">
        <div className="admPage">
          <div className="admAlert">Access denied.</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fadeInUp">
        <div className="admPage">
          {error && <div className="admAlert mb-3">{error}</div>}
          <div className="card">
            <DataTable
              value={rows}
              paginator
              rows={10}
              rowsPerPageOptions={[5, 10, 25, 50]}
              dataKey="id"
              filters={filters}
              loading={loadingList}
              globalFilterFields={["nom", "prenom", "email", "role", "statutCompte"]}
              header={header}
              emptyMessage="No clients found"
              tableStyle={{ minWidth: "50rem" }}
            >
              <Column header="Name" body={nameBodyTemplate} sortable field="nom" style={{ minWidth: "16rem" }} />
              <Column field="email" header="Email" sortable style={{ minWidth: "14rem" }} />
              <Column header="Status" body={statusBodyTemplate} sortable field="statutCompte" style={{ minWidth: "10rem" }} />
              <Column header="Actions" body={actionBodyTemplate} exportable={false} style={{ minWidth: "12rem" }} />
            </DataTable>
          </div>
        </div>
      </div>

      {/* Profile Dialog */}
      <dialog ref={profileDialogRef} className="admDialog admDialogWide" onClick={onBackdropClose}>
        <div className="admDialogHead">
          <div className="admDialogTitle">Client profile</div>
          <button className="admBtn mini" type="button" onClick={() => closeDialog(profileDialogRef)}>
            Close
          </button>
        </div>

        {!selected || loadingProfile ? (
          <div className="admDialogBody">Loading profile...</div>
        ) : (
          <div className="admDialogBody">
            <div className="admProfileTop">
              <div className="admAvatar huge">
                {initials(selected.nom, selected.prenom)}
              </div>
              <div>
                <div className="admSideName">
                  {selected.prenom} {selected.nom}
                </div>
                <div className="admSideRole">
                  {getRoleDisplayName(selected.role)} • {selected.statutCompte}
                </div>
              </div>
            </div>

            <div className="admProfileStats">
              <div className="admProfileStat"><div className="k">ID</div><div className="v mono">{selected.id}</div></div>
              <div className="admProfileStat"><div className="k">Status</div><div className="v">{selected.statutCompte}</div></div>
              <div className="admProfileStat"><div className="k">Created</div><div className="v">{fmt(selected.dateDeCreation)}</div></div>
              <div className="admProfileStat" style={{ gridColumn: "1 / -1" }}><div className="k">Email</div><div className="v mono">{selected.email}</div></div>
            </div>

            <div className="admDialogSection">
              <div className="admSectionTitle">Change Status</div>
              <div className="admActionGrid">
                {STATUS_OPTIONS.map((status) => (
                  <button
                    key={status}
                    className="admBtn mini"
                    disabled={busyId === selected.id || selected.statutCompte === status}
                    onClick={() => setStatus(selected.id, status)}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div className="admDialogSection">
              <div className="admSectionTitle">Role</div>
              <div className="admRolePicker">
                {ROLE_OPTIONS.map((role) => (
                  <button
                    key={role}
                    className="admBtn mini"
                    disabled={busyId === selected.id || selected.role === role}
                    onClick={() => updateUserRole(selected.id, role)}
                  >
                    {getRoleDisplayName(role)}
                  </button>
                ))}
                <button className="admBtn mini danger" disabled={busyId === selected.id} onClick={() => deleteUser(selected.id)}>Delete</button>
              </div>
            </div>

            <div className="admHistoryWrap">
              <div className="admSectionTitle">History</div>
              {!historyRows.length ? (
                <div className="admEmpty slim">No history</div>
              ) : (
                <div className="admHistoryList">
                  {historyRows.map((h) => (
                    <div key={h.id} className="admHistoryItem">
                      <div className="admHistoryTop">
                        <span className="admBadge neutral">{h.action}</span>
                        <span className="admHistoryDate">{fmt(h.createdAt)}</span>
                      </div>
                      <div className="admHistoryText">{h.details || "-"}</div>
                      <div className="admHistoryMeta">By: <span className="mono">{h.actorEmail || "SYSTEM"}</span></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </dialog>

      {/* Create Client Dialog */}
      <dialog ref={createDialogRef} className="admDialog" onClick={onBackdropClose}>
        <form className="admDialogBody admForm" onSubmit={createUser}>
          <div className="admDialogHead">
            <div className="admDialogTitle">Create client</div>
            <button className="admBtn mini" type="button" onClick={() => closeDialog(createDialogRef)}>Close</button>
          </div>

          <div className="admFormGrid">
            <label><span>First name</span><input className="admInput" value={form.prenom} onChange={(e) => setForm((p) => ({ ...p, prenom: e.target.value }))} required /></label>
            <label><span>Last name</span><input className="admInput" value={form.nom} onChange={(e) => setForm((p) => ({ ...p, nom: e.target.value }))} required /></label>
            <label className="full"><span>Email</span><input type="email" className="admInput" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required /></label>
            <label className="full"><span>Password</span><input type="password" className="admInput" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} required minLength={8} /></label>

            <label>
              <span>Role</span>
              <select className="admInput" value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}>
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>{getRoleDisplayName(role)}</option>
                ))}
              </select>
            </label>

            <label>
              <span>Status</span>
              <select className="admInput" value={form.statutCompte} onChange={(e) => setForm((p) => ({ ...p, statutCompte: e.target.value }))}>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="admFormActions">
            <button className="admBtn" type="button" onClick={() => closeDialog(createDialogRef)}>Cancel</button>
            <button className="admBtn primary" type="submit" disabled={creating}>{creating ? "Creating..." : "Create client"}</button>
          </div>
        </form>
      </dialog>
    </>
  );
}