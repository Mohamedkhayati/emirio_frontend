import { useEffect, useMemo, useState } from "react";
import api from "../../lib/api";
import "./catalog-history-modal.css";

function titleCase(value) {
  if (!value) return "-";
  return String(value)
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function initials(name) {
  if (!name) return "?";
  return String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function actionTone(action) {
  if (action === "CREATE") return "create";
  if (action === "DELETE") return "delete";
  return "update";
}

function targetLabel(targetType) {
  if (targetType === "ARTICLE") return "Article";
  if (targetType === "VARIATION") return "Variation";
  return titleCase(targetType);
}

function safeFmt(fmt, value) {
  try {
    return fmt ? fmt(value) : new Date(value).toLocaleString();
  } catch {
    return value ? new Date(value).toLocaleString() : "-";
  }
}

function normalizeText(v) {
  return String(v ?? "").trim().toLowerCase();
}

export default function CatalogHistoryModal({
  open,
  onClose,
  tx,
  fmt,
  fullImageUrl,
}) {
  const t = (key, fallback) => (typeof tx === "function" ? tx(key, fallback) : fallback);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [action, setAction] = useState("ALL");
  const [targetType, setTargetType] = useState("ALL");
  const [actor, setActor] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [brokenActors, setBrokenActors] = useState({});

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;

    let mounted = true;
    setLoading(true);
    setError("");

    api
      .get("/api/admin/catalog/history")
      .then((res) => {
        if (!mounted) return;
        setRows(Array.isArray(res.data) ? res.data : []);
      })
      .catch((e) => {
        if (!mounted) return;
        setRows([]);
        setError(
          e?.response?.data?.message ||
            e?.message ||
            t("admin.catalog.errLoadHistory", "Cannot load history")
        );
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [open]);

  const stats = useMemo(() => {
    const total = rows.length;
    const created = rows.filter((r) => r.action === "CREATE").length;
    const updated = rows.filter((r) => r.action === "UPDATE").length;
    const deleted = rows.filter((r) => r.action === "DELETE").length;
    return { total, created, updated, deleted };
  }, [rows]);

  const filteredRows = useMemo(() => {
    const searchValue = normalizeText(search);
    const actorValue = normalizeText(actor);

    const fromTs = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : null;
    const toTs = toDate ? new Date(`${toDate}T23:59:59`).getTime() : null;

    return rows.filter((row) => {
      if (action !== "ALL" && row.action !== action) return false;
      if (targetType !== "ALL" && row.targetType !== targetType) return false;

      if (actorValue) {
        const actorHaystack = [
          row.actorName,
          row.actorEmail,
          String(row.actorUserId ?? ""),
        ]
          .join(" ")
          .toLowerCase();
        if (!actorHaystack.includes(actorValue)) return false;
      }

      if (fromTs || toTs) {
        const rowTs = row.actionAt ? new Date(row.actionAt).getTime() : null;
        if (fromTs && (!rowTs || rowTs < fromTs)) return false;
        if (toTs && (!rowTs || rowTs > toTs)) return false;
      }

      if (searchValue) {
        const haystack = [
          row.articleName,
          row.variationLabel,
          row.summary,
          row.detailsJson,
          row.actorName,
          row.actorEmail,
          row.action,
          row.targetType,
          String(row.articleId ?? ""),
          String(row.variationId ?? ""),
          String(row.targetId ?? ""),
        ]
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(searchValue)) return false;
      }

      return true;
    });
  }, [rows, search, action, targetType, actor, fromDate, toDate]);

  const activeFiltersCount = useMemo(() => {
    return [search, actor, fromDate, toDate].filter(Boolean).length +
      (action !== "ALL" ? 1 : 0) +
      (targetType !== "ALL" ? 1 : 0);
  }, [search, actor, fromDate, toDate, action, targetType]);

  function clearFilters() {
    setSearch("");
    setAction("ALL");
    setTargetType("ALL");
    setActor("");
    setFromDate("");
    setToDate("");
  }

  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onClose?.();
  }

  function actorImageBroken(row) {
    const key = String(row?.id ?? "");
    return !!brokenActors[key];
  }

  function markActorBroken(row) {
    const key = String(row?.id ?? "");
    setBrokenActors((prev) => ({ ...prev, [key]: true }));
  }

  if (!open) return null;

  return (
    <div className="historyModalOverlay" onMouseDown={handleBackdrop}>
      <div
        className="historyModalPanel historyModalEnter"
        role="dialog"
        aria-modal="true"
        aria-labelledby="catalog-history-modal-title"
      >
        <div className="historyModalHead">
          <div className="historyModalHeadCopy">
            <div className="historyModalEyebrow">
              {t("admin.catalog.history", "History")}
            </div>
            <h2 id="catalog-history-modal-title" className="historyModalTitle">
              {t("admin.catalog.historyModalTitle", "Catalog activity history")}
            </h2>
            <p className="historyModalSubtitle">
              {t(
                "admin.catalog.historyModalSubtitle",
                "Track who created, edited, or deleted articles and variations."
              )}
            </p>
          </div>

          <button
            type="button"
            className="historyModalClose"
            onClick={onClose}
            aria-label={t("admin.common.close", "Close")}
          >
            <span>✕</span>
          </button>
        </div>

        <div className="historyModalStats">
          <div className="historyStatCard">
            <span className="historyStatLabel">{t("admin.common.total", "Total")}</span>
            <strong>{stats.total}</strong>
          </div>
          <div className="historyStatCard create">
            <span className="historyStatLabel">{t("admin.catalog.created", "Created")}</span>
            <strong>{stats.created}</strong>
          </div>
          <div className="historyStatCard update">
            <span className="historyStatLabel">{t("admin.catalog.edited", "Edited")}</span>
            <strong>{stats.updated}</strong>
          </div>
          <div className="historyStatCard delete">
            <span className="historyStatLabel">{t("admin.catalog.deleted", "Deleted")}</span>
            <strong>{stats.deleted}</strong>
          </div>
        </div>

        <div className="historyModalFilters">
          <label className="historyField historyFieldSearch">
            <span>{t("admin.common.search", "Search")}</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t(
                "admin.catalog.historySearchPlaceholder",
                "Search article, variation, actor, summary..."
              )}
            />
          </label>

          <label className="historyField">
            <span>{t("admin.catalog.filterAction", "Action")}</span>
            <select value={action} onChange={(e) => setAction(e.target.value)}>
              <option value="ALL">{t("admin.catalog.allActions", "All actions")}</option>
              <option value="CREATE">{t("admin.catalog.created", "Created")}</option>
              <option value="UPDATE">{t("admin.catalog.edited", "Edited")}</option>
              <option value="DELETE">{t("admin.catalog.deleted", "Deleted")}</option>
            </select>
          </label>

          <label className="historyField">
            <span>{t("admin.catalog.filterTargetType", "Type")}</span>
            <select value={targetType} onChange={(e) => setTargetType(e.target.value)}>
              <option value="ALL">{t("admin.catalog.allTypes", "All types")}</option>
              <option value="ARTICLE">{t("admin.catalog.article", "Article")}</option>
              <option value="VARIATION">{t("admin.catalog.variation", "Variation")}</option>
            </select>
          </label>

          <label className="historyField">
            <span>{t("admin.catalog.filterActor", "Actor")}</span>
            <input
              value={actor}
              onChange={(e) => setActor(e.target.value)}
              placeholder={t("admin.catalog.filterActorPlaceholder", "Name or email")}
            />
          </label>

          <label className="historyField">
            <span>{t("admin.catalog.filterFrom", "From")}</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </label>

          <label className="historyField">
            <span>{t("admin.catalog.filterTo", "To")}</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </label>

          <div className="historyField historyFieldActions">
            <span>{t("admin.common.actions", "Actions")}</span>
            <button
              type="button"
              className="historyClearBtn"
              onClick={clearFilters}
              disabled={activeFiltersCount === 0}
            >
              {t("admin.catalog.clearFilters", "Clear filters")}
            </button>
          </div>
        </div>

        <div className="historyModalMetaBar">
          <div className="historyResultsCount">
            {filteredRows.length} {t("admin.catalog.results", "results")}
          </div>

          <div className="historyActiveFilters">
            {action !== "ALL" ? (
              <span className="historyFilterChip">{titleCase(action)}</span>
            ) : null}
            {targetType !== "ALL" ? (
              <span className="historyFilterChip">{targetLabel(targetType)}</span>
            ) : null}
            {actor ? <span className="historyFilterChip">{actor}</span> : null}
            {fromDate ? <span className="historyFilterChip">{fromDate}</span> : null}
            {toDate ? <span className="historyFilterChip">{toDate}</span> : null}
            {search ? <span className="historyFilterChip">{search}</span> : null}
          </div>
        </div>

        <div className="historyModalBody">
          {loading ? (
            <div className="historyEmptyState">
              {t("admin.catalog.loadingHistory", "Loading history...")}
            </div>
          ) : error ? (
            <div className="historyErrorBox">{error}</div>
          ) : !filteredRows.length ? (
            <div className="historyEmptyState">
              {t("admin.catalog.noHistoryMatch", "No history matches these filters.")}
            </div>
          ) : (
            <div className="historyTimeline">
              {filteredRows.map((row) => {
                const tone = actionTone(row.action);
                const imgUrl =
                  row.actorPhotoUrl && !actorImageBroken(row) && typeof fullImageUrl === "function"
                    ? fullImageUrl(row.actorPhotoUrl, row.actorUserId || row.id)
                    : row.actorPhotoUrl;

                return (
                  <article key={row.id} className={`historyCard ${tone}`}>
                    <div className="historyCardLine" />

                    <div className="historyActor">
                      {imgUrl && !actorImageBroken(row) ? (
                        <img
                          src={imgUrl}
                          alt={row.actorName || "User"}
                          className="historyAvatar"
                          onError={() => markActorBroken(row)}
                        />
                      ) : (
                        <div className="historyAvatar fallback">
                          {initials(row.actorName || row.actorEmail)}
                        </div>
                      )}
                    </div>

                    <div className="historyCardContent">
                      <div className="historyCardTop">
                        <div className="historyCardIdentity">
                          <div className="historyActorName">{row.actorName || "-"}</div>
                          <div className="historyActorEmail">{row.actorEmail || "-"}</div>
                        </div>

                        <div className="historyCardBadges">
                          <span className={`historyBadge ${tone}`}>
                            {row.actionLabel || titleCase(row.action)}
                          </span>
                          <span className="historyBadge soft">
                            {targetLabel(row.targetType)}
                          </span>
                        </div>
                      </div>

                      <div className="historyCardMain">
                        <h3 className="historyTargetTitle">
                          {row.articleName || row.summary || "-"}
                        </h3>

                        {row.variationLabel ? (
                          <div className="historyVariationLabel">{row.variationLabel}</div>
                        ) : null}

                        {row.summary ? (
                          <p className="historySummary">{row.summary}</p>
                        ) : null}
                      </div>

                      <div className="historyCardMeta">
                        <span>{safeFmt(fmt, row.actionAt)}</span>
                        {row.articleId ? <span>Article #{row.articleId}</span> : null}
                        {row.variationId ? <span>Variation #{row.variationId}</span> : null}
                        {row.targetId ? <span>Target #{row.targetId}</span> : null}
                      </div>

                      {row.detailsJson ? (
                        <details className="historyDetailsBox">
                          <summary>{t("admin.catalog.viewDetails", "View details")}</summary>
                          <pre>{row.detailsJson}</pre>
                        </details>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}