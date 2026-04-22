import { useEffect, useState, useRef } from "react";
import { api } from "../../lib/api";
import { formatDistanceToNow, format } from "date-fns";
import "./ReclamationsPage.css";

const statusConfig = {
  OPEN: { label: "Open", color: "status-open" },
  IN_PROGRESS: { label: "In Progress", color: "status-progress" },
  RESOLVED: { label: "Resolved", color: "status-resolved" },
  CLOSED: { label: "Closed", color: "status-closed" },
};

export default function ReclamationsPage({ currentLang = "en" }) {
  const [reclamations, setReclamations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyEntries, setHistoryEntries] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const messagesEndRef = useRef(null);

  const fetchReclamations = async () => {
    try {
      const res = await api.get("/api/reclamations");
      setReclamations(res.data);
    } catch (err) {
      console.error("Failed to load reclamations", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReclamationDetail = async (id) => {
    try {
      const res = await api.get(`/api/reclamations/${id}`);
      setSelected(res.data);
    } catch (err) {
      console.error("Failed to load detail", err);
    }
  };

  const fetchHistory = async (id) => {
    setLoadingHistory(true);
    try {
      const res = await api.get(`/api/reclamations/${id}/history`);
      setHistoryEntries(res.data);
      setShowHistoryModal(true);
    } catch (err) {
      console.error("Failed to load history", err);
      alert("Could not load history");
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchReclamations();
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selected?.messages]);

  const handleSelect = (reclamation) => {
    setSelected(null);
    fetchReclamationDetail(reclamation.id);
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selected) return;
    setSending(true);
    try {
      await api.post(`/api/reclamations/${selected.id}/messages`, { content: replyText });
      setReplyText("");
      await fetchReclamationDetail(selected.id);
      await fetchReclamations();
    } catch (err) {
      console.error("Failed to send reply", err);
      alert("Error sending message");
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!selected) return;
    setUpdatingStatus(true);
    try {
      await api.patch(`/api/reclamations/${selected.id}/status?status=${newStatus}`);
      await fetchReclamationDetail(selected.id);
      await fetchReclamations();
    } catch (err) {
      console.error("Failed to update status", err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case "CREATED": return "📝";
      case "STATUS_CHANGED": return "🔄";
      case "MESSAGE_ADDED": return "💬";
      default: return "📌";
    }
  };

  if (loading) {
    return (
      <div className="loading-skeleton">
        <div className="skeleton-card"></div>
        <div className="skeleton-card"></div>
      </div>
    );
  }

  return (
    <div className="reclamations-container">
      <div className="page-header animate-fadeIn">
        <h1 className="page-title">Customer Claims</h1>
        <p className="page-subtitle">View, reply, and manage customer complaints</p>
      </div>

      <div className="reclamations-grid animate-slideUp">
        {/* Left sidebar - list */}
        <div className="reclamations-list">
          <div className="list-header">
            <h2>All claims</h2>
          </div>
          <div className="list-items">
            {reclamations.length === 0 ? (
              <div className="empty-state">No reclamations yet</div>
            ) : (
              reclamations.map((rec, idx) => (
                <button
                  key={rec.id}
                  onClick={() => handleSelect(rec)}
                  className={`list-item ${selected?.id === rec.id ? "active" : ""} animate-fadeIn`}
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <div className="item-header">
                    <span className="item-subject">{rec.subject}</span>
                    <span className={`status-badge ${statusConfig[rec.status]?.color}`}>
                      {statusConfig[rec.status]?.label}
                    </span>
                  </div>
                  <div className="item-meta">
                    {rec.userName} • {new Date(rec.createdAt).toLocaleDateString()}
                  </div>
                  <div className="item-preview">{rec.description}</div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right side - chat */}
        <div className="chat-panel">
          {!selected ? (
            <div className="empty-chat">
              <div className="empty-icon">💬</div>
              <p>Select a claim to view conversation</p>
            </div>
          ) : (
            <>
              <div className="chat-header">
                <div className="chat-header-info">
                  <h3>{selected.subject}</h3>
                  <div className="chat-meta">
                    From: {selected.userName} ({selected.userEmail})
                  </div>
                  <div className="chat-date">
                    Created {formatDistanceToNow(new Date(selected.createdAt), { addSuffix: true })}
                  </div>
                </div>
                <div className="chat-header-actions">
                  <button className="client-info-btn" onClick={() => setShowClientModal(true)}>
                    👤 Client Info
                  </button>
                  <button className="history-btn" onClick={() => fetchHistory(selected.id)}>
                    📜 History
                  </button>
                  <select
                    value={selected.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={updatingStatus}
                    className="status-select"
                  >
                    {Object.entries(statusConfig).map(([key, { label }]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="messages-area">
                {selected.messages?.map((msg, idx) => (
                  <div
                    key={msg.id}
                    className={`message ${msg.senderRole === "Client" ? "client" : "admin"} animate-messageIn`}
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <div className="message-bubble">
                      <div className="message-sender">{msg.senderName} • {msg.senderRole}</div>
                      <div className="message-content">{msg.content}</div>
                      <div className="message-time">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="reply-area">
                <textarea
                  rows={2}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply here... (customer will receive an email)"
                  disabled={sending}
                />
                <button onClick={handleSendReply} disabled={sending || !replyText.trim()}>
                  {sending ? "Sending..." : "Send reply"}
                </button>
                <p className="reply-note">The customer will receive an email with your reply.</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Client Info Modal */}
      {showClientModal && selected && (
        <div className="modal-overlay" onClick={() => setShowClientModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Customer Information</h3>
              <button className="modal-close" onClick={() => setShowClientModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="info-row">
                <span className="info-label">Name:</span>
                <span className="info-value">{selected.userName}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Email:</span>
                <span className="info-value">{selected.userEmail}</span>
              </div>
              <div className="info-row">
                <span className="info-label">User ID:</span>
                <span className="info-value">{selected.userId || "—"}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Total claims:</span>
                <span className="info-value">
                  {reclamations.filter(r => r.userEmail === selected.userEmail).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="modal-container history-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reclamation History</h3>
              <button className="modal-close" onClick={() => setShowHistoryModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {loadingHistory ? (
                <div className="loading-history">Loading history...</div>
              ) : historyEntries.length === 0 ? (
                <div className="empty-history">No history available</div>
              ) : (
                <div className="timeline">
                  {historyEntries.map((entry, idx) => (
                    <div key={entry.id} className="timeline-item animate-fadeIn" style={{ animationDelay: `${idx * 0.03}s` }}>
                      <div className="timeline-icon">{getActionIcon(entry.action)}</div>
                      <div className="timeline-content">
                        <div className="timeline-header">
                          <strong>{entry.actorName}</strong>
                          <span className="timeline-role">({entry.actorRole})</span>
                          <span className="timeline-action">{entry.action.replace(/_/g, ' ')}</span>
                        </div>
                        <div className="timeline-details">
                          {entry.action === "STATUS_CHANGED" && (
                            <span>Changed from <span className="old-value">{entry.oldValue}</span> → <span className="new-value">{entry.newValue}</span></span>
                          )}
                          {entry.action === "MESSAGE_ADDED" && entry.details && (
                            <span>{entry.details}</span>
                          )}
                          {entry.action === "CREATED" && entry.details && (
                            <span>{entry.details}</span>
                          )}
                          {!entry.details && entry.action !== "STATUS_CHANGED" && (
                            <span>—</span>
                          )}
                        </div>
                        <div className="timeline-date">
                          {format(new Date(entry.createdAt), "dd MMM yyyy, HH:mm")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}