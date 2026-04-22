// src/components/FloatingChat.jsx
import { useState, useEffect, useRef } from "react";
import { api } from "../lib/api";   // ✅ fixed import path

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
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
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

  const getStatusBadge = (status) => {
    const base = "px-2 py-0.5 rounded-full text-xs font-semibold";
    switch (status) {
      case "OPEN": return `${base} bg-red-100 text-red-800`;
      case "IN_PROGRESS": return `${base} bg-yellow-100 text-yellow-800`;
      case "RESOLVED": return `${base} bg-green-100 text-green-800`;
      case "CLOSED": return `${base} bg-gray-100 text-gray-800`;
      default: return `${base} bg-gray-100 text-gray-800`;
    }
  };

  // Inline styles (no Tailwind needed)
  const buttonStyle = {
    position: "fixed", bottom: "24px", right: "24px", zIndex: 99999,
    backgroundColor: "#2563eb", color: "white", border: "none",
    borderRadius: "9999px", width: "56px", height: "56px", cursor: "pointer",
    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", transition: "transform 0.2s",
    display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px",
  };

  const widgetStyle = {
    position: "fixed", bottom: "96px", right: "24px", width: "384px", height: "500px",
    backgroundColor: "white", borderRadius: "12px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
    border: "1px solid #e5e7eb", zIndex: 99999, display: isOpen ? "flex" : "none",
    flexDirection: "column", overflow: "hidden",
  };

  if (!isLoggedIn) {
    return (
      <div style={buttonStyle}>
        <button onClick={() => (window.location.href = "/auth")} style={{ ...buttonStyle, all: "unset", ...buttonStyle, cursor: "pointer" }}>
          💬
        </button>
      </div>
    );
  }

  return (
    <>
      <button style={buttonStyle} onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? "✕" : "💬"}
      </button>
      <div style={widgetStyle}>
        <div style={{ backgroundColor: "#2563eb", color: "white", padding: "12px 16px", display: "flex", justifyContent: "space-between", fontWeight: "bold" }}>
          <span>Customer Support</span>
          <button onClick={() => setIsOpen(false)} style={{ background: "none", border: "none", color: "white", cursor: "pointer", fontSize: "20px" }}>✕</button>
        </div>
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* Left sidebar */}
          <div style={{ width: "33.33%", borderRight: "1px solid #e5e7eb", backgroundColor: "#f9fafb", display: "flex", flexDirection: "column" }}>
            {isClient && (
              <div style={{ padding: "8px" }}>
                <button onClick={() => setShowNewForm(!showNewForm)} style={{ width: "100%", backgroundColor: "#3b82f6", color: "white", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer" }}>
                  + New claim
                </button>
              </div>
            )}
            <div style={{ flex: 1, overflowY: "auto" }}>
              {loading && <div style={{ padding: "8px", textAlign: "center" }}>Loading...</div>}
              {!loading && reclamations.length === 0 && (
                <div style={{ padding: "8px", textAlign: "center", color: "#9ca3af" }}>{isClient ? "No claims yet" : "No customer claims to display"}</div>
              )}
              {reclamations.map(rec => (
                <button key={rec.id} onClick={() => handleSelect(rec)} style={{ width: "100%", textAlign: "left", padding: "8px", borderBottom: "1px solid #e5e7eb", backgroundColor: selected?.id === rec.id ? "#dbeafe" : "transparent", cursor: "pointer" }}>
                  <div style={{ fontWeight: "500", overflow: "hidden", textOverflow: "ellipsis" }}>{rec.subject}</div>
                  <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>{new Date(rec.createdAt).toLocaleDateString()}</div>
                  <div style={{ marginTop: "4px" }}><span dangerouslySetInnerHTML={{ __html: getStatusBadge(rec.status) }} /></div>
                </button>
              ))}
            </div>
          </div>
          {/* Right side */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            {showNewForm && isClient ? (
              <div style={{ padding: "12px" }}>
                <h4 style={{ fontWeight: "500", marginBottom: "8px" }}>New Claim</h4>
                <form onSubmit={handleCreateReclamation}>
                  <input type="text" placeholder="Subject" value={newSubject} onChange={e => setNewSubject(e.target.value)} style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: "6px", padding: "6px", marginBottom: "8px" }} required />
                  <textarea placeholder="Description" value={newDescription} onChange={e => setNewDescription(e.target.value)} rows={3} style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: "6px", padding: "6px", marginBottom: "8px" }} required />
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button type="submit" disabled={sending} style={{ backgroundColor: "#2563eb", color: "white", border: "none", padding: "8px 16px", borderRadius: "8px", cursor: "pointer" }}>Submit</button>
                    <button type="button" onClick={() => setShowNewForm(false)} style={{ backgroundColor: "#e5e7eb", border: "none", padding: "8px 16px", borderRadius: "8px", cursor: "pointer" }}>Cancel</button>
                  </div>
                </form>
              </div>
            ) : selected ? (
              <>
                <div style={{ flex: 1, overflowY: "auto", padding: "12px", backgroundColor: "#f9fafb", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {selected.messages?.map(msg => (
                    <div key={msg.id} style={{ display: "flex", justifyContent: msg.senderRole === "Client" ? "flex-start" : "flex-end" }}>
                      <div style={{ maxWidth: "80%", padding: "8px 12px", borderRadius: "12px", backgroundColor: msg.senderRole === "Client" ? "#e5e7eb" : "#3b82f6", color: msg.senderRole === "Client" ? "#1f2937" : "white" }}>
                        <div style={{ fontSize: "12px", fontWeight: "bold" }}>{msg.senderName} • {msg.senderRole}</div>
                        <div>{msg.content}</div>
                        <div style={{ fontSize: "10px", textAlign: "right", marginTop: "4px", opacity: 0.7 }}>{new Date(msg.timestamp).toLocaleTimeString()}</div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                <div style={{ padding: "8px", borderTop: "1px solid #e5e7eb", display: "flex", gap: "8px" }}>
                  <textarea rows={1} value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Type your reply..." style={{ flex: 1, border: "1px solid #d1d5db", borderRadius: "8px", padding: "8px", resize: "none" }} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }} />
                  <button onClick={handleSendReply} disabled={sending || !replyText.trim()} style={{ backgroundColor: "#2563eb", color: "white", border: "none", padding: "8px 16px", borderRadius: "8px", cursor: "pointer" }}>Send</button>
                </div>
              </>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#9ca3af", textAlign: "center", padding: "16px" }}>
                {isClient ? "Select a claim or create new" : "Only customers can create claims.\nYou can view and reply to existing claims in the admin panel."}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}