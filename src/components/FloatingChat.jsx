import { useState, useEffect, useRef } from "react";
import { api } from "../lib/api";
import "./FloatingChat.css";

export default function FloatingChat({ me }) {
  const [isOpen, setIsOpen] = useState(false);
  const [reclamations, setReclamations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);
  const messagesEndRef = useRef(null);

  const token = localStorage.getItem("token");
  const isLoggedIn = !!me && !!token;
  const isClient = me?.role === "Client";

  const fetchMyReclamations = async () => {
    if (!isLoggedIn) return;
    setLoading(true);
    try {
      const res = await api.get("/api/reclamations/my");
      setReclamations(res.data);
      if (res.data.length > 0 && !selected) {
        setSelected(res.data[0]);
        fetchReclamationDetail(res.data[0].id);
      }
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
      setReclamations(prev => prev.map(r => r.id === id ? res.data : r));
    } catch (err) {
      console.error("Failed to load detail", err);
    }
  };

  useEffect(() => {
    if (isOpen && isLoggedIn) fetchMyReclamations();
  }, [isOpen, isLoggedIn]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selected?.messages]);

  const handleSelect = (rec) => {
    setSelected(rec);
    fetchReclamationDetail(rec.id);
    setShowNewForm(false);
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selected) return;
    setSending(true);
    try {
      await api.post(`/api/reclamations/${selected.id}/client-messages`, { content: replyText });
      setReplyText("");
      await fetchReclamationDetail(selected.id);
    } catch (err) {
      console.error("Failed to send message", err);
      alert("Error sending message");
    } finally {
      setSending(false);
    }
  };

  const handleCreateReclamation = async (e) => {
    e.preventDefault();
    if (!newSubject.trim() || !newDescription.trim()) return;
    setSending(true);
    try {
      const res = await api.post("/api/reclamations", { subject: newSubject, description: newDescription });
      const newRec = res.data;
      setReclamations(prev => [newRec, ...prev]);
      setSelected(newRec);
      setShowNewForm(false);
      setNewSubject("");
      setNewDescription("");
    } catch (err) {
      console.error("Failed to create reclamation", err);
      alert("Error creating claim");
    } finally {
      setSending(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      "OPEN": "open",
      "IN_PROGRESS": "in_progress",
      "RESOLVED": "resolved",
      "CLOSED": "closed"
    };
    return `status-badge ${statusMap[status] || "closed"}`;
  };

  const getStatusLabel = (status) => {
    const labels = {
      "OPEN": "Open",
      "IN_PROGRESS": "In Progress",
      "RESOLVED": "Resolved",
      "CLOSED": "Closed"
    };
    return labels[status] || status;
  };

  // For non-logged-in users
  if (!isLoggedIn) {
    return (
      <button 
        className="floating-chat-button"
        onClick={() => window.location.href = "/auth"}
        aria-label="Customer Support"
      >
        💬
      </button>
    );
  }

  return (
    <>
      <button 
        className="floating-chat-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close support chat" : "Open customer support"}
      >
        {isOpen ? "✕" : "💬"}
      </button>
      
      <div className={`floating-chat-widget ${isOpen ? "open" : ""}`}>
        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-title">
            <span className="chat-header-icon">🎧</span>
            <span>Customer Support</span>
          </div>
          <button 
            className="chat-header-close"
            onClick={() => setIsOpen(false)}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        
        {/* Main Layout */}
        <div className="chat-layout">
          {/* Left Sidebar - Claims List */}
          <div className="chat-sidebar">
            {isClient && (
              <div className="chat-sidebar-header">
                <button 
                  className="new-claim-btn"
                  onClick={() => setShowNewForm(!showNewForm)}
                >
                  <span>+</span> New Support Ticket
                </button>
              </div>
            )}
            <div className="claims-list">
              {loading && (
                <div className="loading-state">
                  <span className="loading-spinner"></span>
                  Loading tickets...
                </div>
              )}
              {!loading && reclamations.length === 0 && (
                <div className="empty-state">
                  <div className="empty-icon">📭</div>
                  <div className="empty-title">No tickets yet</div>
                  <div className="empty-description">
                    {isClient 
                      ? "Create your first support ticket and we'll get back to you" 
                      : "No customer support tickets to display"}
                  </div>
                  {isClient && (
                    <button 
                      className="empty-action-btn"
                      onClick={() => setShowNewForm(true)}
                    >
                      + Create Ticket
                    </button>
                  )}
                </div>
              )}
              {reclamations.map(rec => (
                <button
                  key={rec.id}
                  className={`claim-item ${selected?.id === rec.id ? "active" : ""}`}
                  onClick={() => handleSelect(rec)}
                >
                  <div className="claim-subject" title={rec.subject}>
                    {rec.subject}
                  </div>
                  <div className="claim-date">
                    {new Date(rec.createdAt).toLocaleDateString(undefined, { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                  <div className="claim-status-badge">
                    <span className={getStatusBadgeClass(rec.status)}>
                      {getStatusLabel(rec.status)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Right Side - Chat Content */}
          <div className="chat-main">
            {showNewForm && isClient ? (
              <div className="new-claim-form">
                <div className="form-header">
                  <span className="form-icon">🎫</span>
                  <h4>Create Support Ticket</h4>
                  <p>Describe your issue and we'll help you asap</p>
                </div>
                <form onSubmit={handleCreateReclamation}>
                  <div className="form-group">
                    <label className="form-label">Subject</label>
                    <input
                      type="text"
                      placeholder="e.g., Order issue, Product question..."
                      value={newSubject}
                      onChange={e => setNewSubject(e.target.value)}
                      className="new-claim-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea
                      placeholder="Please provide details about your issue..."
                      value={newDescription}
                      onChange={e => setNewDescription(e.target.value)}
                      rows={4}
                      className="new-claim-textarea"
                      required
                    />
                  </div>
                  <div className="form-actions">
                    <button type="submit" disabled={sending} className="submit-btn">
                      {sending ? "Submitting..." : "Submit Ticket"}
                    </button>
                    <button type="button" onClick={() => setShowNewForm(false)} className="cancel-btn">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : selected ? (
              <>
                {/* Messages Area */}
                <div className="messages-area">
                  {selected.messages?.map(msg => (
                    <div
                      key={msg.id}
                      className={`message-bubble ${msg.senderRole === "Client" ? "client" : "support"}`}
                    >
                      <div className="message-sender">
                        {msg.senderName}
                      </div>
                      <div className="message-content">{msg.content}</div>
                      <div className="message-time">
                        {new Date(msg.timestamp).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                
                {/* Reply Input */}
                <div className="reply-area">
                  <textarea
                    rows={1}
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Type your reply..."
                    className="reply-input"
                    onKeyDown={e => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendReply();
                      }
                    }}
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={sending || !replyText.trim()}
                    className="send-btn"
                  >
                    Send ➤
                  </button>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">💬</div>
                <div className="empty-title">Select a ticket</div>
                <div className="empty-description">
                  {isClient 
                    ? "Choose a support ticket from the left to view the conversation" 
                    : "Select a customer ticket to view and respond to their inquiry"}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}