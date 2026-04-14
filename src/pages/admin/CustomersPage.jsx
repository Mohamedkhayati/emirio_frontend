import { useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../../lib/api";
import { fmt, initials } from "./adminShared";

const EMPTY_FORM = {
    nom: "",
    prenom: "",
    email: "",
    password: "",
    role: "VENDEUR",
    statutCompte: "ACTIVE",
};

export default function CustomersPage() {
    const { t } = useTranslation();
    const { isAdminGeneral } = useOutletContext();

    const [rows, setRows] = useState([]);
    const [selected, setSelected] = useState(null);
    const [historyRows, setHistoryRows] = useState([]);
    const [q, setQ] = useState("");
    const [error, setError] = useState("");
    const [busyId, setBusyId] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);

    const profileDialogRef = useRef(null);
    const createDialogRef = useRef(null);

    const filteredCustomers = useMemo(() => {
        const s = q.trim().toLowerCase();
        if (!s) return rows;
        return rows.filter((u) =>
            `${u.nom || ""} ${u.prenom || ""} ${u.email || ""} ${u.role || ""} ${u.statutCompte || ""}`
                .toLowerCase()
                .includes(s)
        );
    }, [q, rows]);

    function safeOpenDialog(ref) {
        const dialog = ref.current;
        if (dialog && !dialog.open) dialog.showModal();
    }

    function closeDialog(ref) {
        ref.current?.close();
    }

    function onBackdropClose(e) {
        const rect = e.currentTarget.getBoundingClientRect();
        const isInDialog =
            rect.top <= e.clientY &&
            e.clientY <= rect.top + rect.height &&
            rect.left <= e.clientX &&
            e.clientX <= rect.left + rect.width;

        if (!isInDialog) e.currentTarget.close();
    }

    async function loadList(keepSelection = true) {
        if (!isAdminGeneral) return;
        setError("");

        try {
            const res = await api.get("/api/admin/users");
            const list = Array.isArray(res.data) ? res.data : [];
            setRows(list);

            if (!list.length) {
                setSelected(null);
                setHistoryRows([]);
                return;
            }

            if (keepSelection && selected?.id) {
                const stillExists = list.find((u) => u.id === selected.id);
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
            setError(e?.response?.data?.message || "Cannot load users");
            setRows([]);
            setSelected(null);
            setHistoryRows([]);
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

        setError("");
        setBusyId(id);

        try {
            const res = await api.put(`/api/admin/users/${id}/status`, { statutCompte });
            setSelected(res.data);
            await loadList(true);
            await loadProfile(id, false);
        } catch (e) {
            setError(e?.response?.data?.message || "Status update failed");
        } finally {
            setBusyId(null);
        }
    }

    async function updateUserRole(id, role) {
        if (!isAdminGeneral) return;

        setError("");
        setBusyId(id);

        try {
            const res = await api.put(`/api/admin/users/${id}/role`, { role });
            setSelected(res.data);
            await loadList(true);
            await loadProfile(id, false);
        } catch (e) {
            setError(e?.response?.data?.message || "Role update failed");
        } finally {
            setBusyId(null);
        }
    }

    async function deleteUser(id) {
        if (!isAdminGeneral) return;
        if (!window.confirm("Delete this account?")) return;

        setError("");
        setBusyId(id);

        try {
            await api.delete(`/api/admin/users/${id}`);
            closeDialog(profileDialogRef);
            setSelected(null);
            setHistoryRows([]);
            await loadList(false);
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
        } catch (e2) {
            setError(e2?.response?.data?.message || "Create account failed");
        } finally {
            setCreating(false);
        }
    }

    useEffect(() => {
        loadList(false);
    }, [isAdminGeneral]);

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
                    <div className="admHeader">
                        <div>
                            <div className="admH1">{t("admin.customers.title") || "Users"}</div>
                            <div className="admH2">
                                {t("admin.customers.subtitle") || "Manage users, roles and history"}
                            </div>
                        </div>

                        <div className="admHeaderRight">
                            <div className="admSearchWrap">
                                <input
                                    className="admSearch"
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                    placeholder={t("admin.customers.searchPlaceholder") || "Search users"}
                                />
                            </div>

                            <button
                                className="admBtn"
                                onClick={() => selected && loadProfile(selected.id, true)}
                                disabled={!selected}
                            >
                                {t("admin.common.seeProfile") || "See profile"}
                            </button>

                            <button
                                className="admBtn primary"
                                onClick={() => safeOpenDialog(createDialogRef)}
                            >
                                {t("admin.common.create") || "Create account"}
                            </button>
                        </div>
                    </div>

                    {error && <div className="admAlert">{error}</div>}

                    <div className="admGrid">
                        <div className="admCard">
                            <div className="admCardTop">
                                <div className="admCardTitle">
                                    {filteredCustomers.length} {t("admin.common.customersCount") || "users"}
                                </div>

                                <button className="admBtn" onClick={() => loadList(true)}>
                                    {t("admin.common.refresh") || "Refresh"}
                                </button>
                            </div>

                            <div className="admTable">
                                <div className="admTr head">
                                    <div>{t("admin.table.name") || "Name"}</div>
                                    <div>{t("admin.table.email") || "Email"}</div>
                                    <div>{t("admin.table.status") || "Status"}</div>
                                    <div style={{ textAlign: "right" }}>{t("admin.table.actions") || "Actions"}</div>
                                </div>

                                {filteredCustomers.map((u) => (
                                    <div
                                        key={u.id}
                                        className={`admTr row ${selected?.id === u.id ? "active" : ""}`}
                                        onClick={() => setSelected(u)}
                                    >
                                        <div className="admNameCell">
                                            <div className="admAvatar">{initials(u.nom, u.prenom)}</div>
                                            <div>
                                                <div className="admName">
                                                    {u.prenom} {u.nom}
                                                </div>
                                                <div className="admRole">{u.role}</div>
                                            </div>
                                        </div>

                                        <div className="admEmail">{u.email}</div>

                                        <div>
                                            <span className={`admBadge ${u.statutCompte === "ACTIVE" ? "ok" : "bad"}`}>
                                                {u.statutCompte}
                                            </span>
                                        </div>

                                        <div className="admRowActions" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                className="admBtn mini"
                                                disabled={busyId === u.id}
                                                onClick={() => loadProfile(u.id, true)}
                                            >
                                                Profile
                                            </button>

                                            <button
                                                className="admBtn mini"
                                                disabled={busyId === u.id}
                                                onClick={() => setStatus(u.id, "ACTIVE")}
                                            >
                                                Enable
                                            </button>

                                            <button
                                                className="admBtn mini"
                                                disabled={busyId === u.id}
                                                onClick={() => setStatus(u.id, "BLOCKED")}
                                            >
                                                Block
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {!filteredCustomers.length && (
                                    <div className="admEmpty">
                                        {t("admin.customers.selectClient") || "No users found"}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="admCard side">
                            {!selected ? (
                                <div className="admEmpty">Select a user</div>
                            ) : (
                                <>
                                    <div className="admSideTop">
                                        <div className="admAvatar big">{initials(selected.nom, selected.prenom)}</div>
                                        <div>
                                            <div className="admSideName">
                                                {selected.prenom} {selected.nom}
                                            </div>
                                            <div className="admSideRole">{selected.role}</div>
                                        </div>
                                    </div>

                                    <div className="admDivider" />

                                    <div className="admInfo">
                                        <div className="admInfoRow">
                                            <span>Email</span>
                                            <span className="mono">{selected.email}</span>
                                        </div>
                                        <div className="admInfoRow">
                                            <span>Status</span>
                                            <span>{selected.statutCompte}</span>
                                        </div>
                                        <div className="admInfoRow">
                                            <span>Created</span>
                                            <span>{fmt(selected.dateDeCreation)}</span>
                                        </div>
                                    </div>

                                    <div className="admDivider" />

                                    <div className="admFormActions">
                                        <button className="admBtn" onClick={() => loadProfile(selected.id, true)}>
                                            Open profile popup
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <dialog ref={profileDialogRef} className="admDialog admDialogWide" onClick={onBackdropClose}>
                <div className="admDialogHead">
                    <div className="admDialogTitle">User profile</div>
                    <button className="admBtn mini" type="button" onClick={() => closeDialog(profileDialogRef)}>
                        Close
                    </button>
                </div>

                {!selected || loadingProfile ? (
                    <div className="admDialogBody">Loading profile...</div>
                ) : (
                    <div className="admDialogBody">
                        <div className="admProfileTop">
                            <div className="admAvatar huge">{initials(selected.nom, selected.prenom)}</div>
                            <div>
                                <div className="admSideName">
                                    {selected.prenom} {selected.nom}
                                </div>
                                <div className="admSideRole">
                                    {selected.role} • {selected.statutCompte}
                                </div>
                            </div>
                        </div>

                        <div className="admProfileStats">
                            <div className="admProfileStat">
                                <div className="k">ID</div>
                                <div className="v mono">{selected.id}</div>
                            </div>

                            <div className="admProfileStat">
                                <div className="k">Status</div>
                                <div className="v">{selected.statutCompte}</div>
                            </div>

                            <div className="admProfileStat">
                                <div className="k">Created</div>
                                <div className="v">{fmt(selected.dateDeCreation)}</div>
                            </div>

                            <div className="admProfileStat" style={{ gridColumn: "1 / -1" }}>
                                <div className="k">Email</div>
                                <div className="v mono">{selected.email}</div>
                            </div>
                        </div>

                        <div className="admDialogSection">
                            <div className="admSectionTitle">Status</div>
                            <div className="admActionGrid">
                                <button className="admBtn mini" disabled={busyId === selected.id} onClick={() => setStatus(selected.id, "ACTIVE")}>
                                    Active
                                </button>
                                <button className="admBtn mini" disabled={busyId === selected.id} onClick={() => setStatus(selected.id, "BLOCKED")}>
                                    Blocked
                                </button>
                                <button className="admBtn mini" disabled={busyId === selected.id} onClick={() => setStatus(selected.id, "DISABLED")}>
                                    Disabled
                                </button>
                            </div>
                        </div>

                        <div className="admDialogSection">
                            <div className="admSectionTitle">Role</div>
                            <div className="admRolePicker">
                                <button className="admBtn mini" disabled={busyId === selected.id} onClick={() => updateUserRole(selected.id, "USER")}>
                                    USER
                                </button>
                                <button className="admBtn mini" disabled={busyId === selected.id} onClick={() => updateUserRole(selected.id, "VENDEUR")}>
                                    VENDEUR
                                </button>
                                <button className="admBtn mini" disabled={busyId === selected.id} onClick={() => updateUserRole(selected.id, "ADMIN_GENERAL")}>
                                    ADMIN_GENERAL
                                </button>
                                <button className="admBtn mini danger" disabled={busyId === selected.id} onClick={() => deleteUser(selected.id)}>
                                    Delete
                                </button>
                            </div>
                        </div>

                        <div className="admHistoryWrap">
                            <div className="admSectionTitle">Historique</div>

                            {!historyRows.length ? (
                                <div className="admEmpty slim">Aucun historique</div>
                            ) : (
                                <div className="admHistoryList">
                                    {historyRows.map((h) => (
                                        <div key={h.id} className="admHistoryItem">
                                            <div className="admHistoryTop">
                                                <span className="admBadge neutral">{h.action}</span>
                                                <span className="admHistoryDate">{fmt(h.createdAt)}</span>
                                            </div>
                                            <div className="admHistoryText">{h.details || "-"}</div>
                                            <div className="admHistoryMeta">
                                                Par: <span className="mono">{h.actorEmail || "SYSTEM"}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </dialog>

            <dialog ref={createDialogRef} className="admDialog" onClick={onBackdropClose}>
                <form className="admDialogBody admForm" onSubmit={createUser}>
                    <div className="admDialogHead">
                        <div className="admDialogTitle">Create account</div>
                        <button className="admBtn mini" type="button" onClick={() => closeDialog(createDialogRef)}>
                            Close
                        </button>
                    </div>

                    <div className="admFormGrid">
                        <label>
                            <span>First name</span>
                            <input
                                className="admInput"
                                value={form.prenom}
                                onChange={(e) => setForm((p) => ({ ...p, prenom: e.target.value }))}
                                required
                            />
                        </label>

                        <label>
                            <span>Last name</span>
                            <input
                                className="admInput"
                                value={form.nom}
                                onChange={(e) => setForm((p) => ({ ...p, nom: e.target.value }))}
                                required
                            />
                        </label>

                        <label className="full">
                            <span>Email</span>
                            <input
                                type="email"
                                className="admInput"
                                value={form.email}
                                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                                required
                            />
                        </label>

                        <label className="full">
                            <span>Password</span>
                            <input
                                type="password"
                                className="admInput"
                                value={form.password}
                                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                                required
                                minLength={8}
                            />
                        </label>

                        <label>
                            <span>Role</span>
                            <select
                                className="admInput"
                                value={form.role}
                                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                            >
                                <option value="USER">USER</option>
                                <option value="VENDEUR">VENDEUR</option>
                                <option value="ADMIN_GENERAL">ADMIN_GENERAL</option>
                            </select>
                        </label>

                        <label>
                            <span>Status</span>
                            <select
                                className="admInput"
                                value={form.statutCompte}
                                onChange={(e) => setForm((p) => ({ ...p, statutCompte: e.target.value }))}
                            >
                                <option value="ACTIVE">ACTIVE</option>
                                <option value="BLOCKED">BLOCKED</option>
                                <option value="DISABLED">DISABLED</option>
                            </select>
                        </label>
                    </div>

                    <div className="admFormActions">
                        <button className="admBtn" type="button" onClick={() => closeDialog(createDialogRef)}>
                            Cancel
                        </button>
                        <button className="admBtn primary" type="submit" disabled={creating}>
                            {creating ? "Creating..." : "Create account"}
                        </button>
                    </div>
                </form>
            </dialog>
        </>
    );
}   