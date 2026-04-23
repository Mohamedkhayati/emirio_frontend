import { useState, useEffect, useRef } from "react";
import { api } from "../lib/api";
import "./Chatbot.css";

export default function Chatbot({ me }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const isLoggedIn = me && localStorage.getItem("token");

  // Suggested questions (you can customize)
  const suggestedQuestions = [
    "Quels sont vos horaires d'ouverture ?",
    "Où se trouve votre boutique ?",
    "Avez-vous des chaussures Nike Air Max en stock ?",
    "Quel est l'article le plus vendu ?",
    "Y a-t-il des promotions en cours ?",
    "Listez tous les articles disponibles"
  ];

  // Load chat history when widget opens
  useEffect(() => {
    if (isOpen && isLoggedIn && !historyLoaded) {
      fetchHistory();
    }
  }, [isOpen, isLoggedIn, historyLoaded]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/chat/history");
      // Backend returns array of {id, question, response, createdAt}
      const history = res.data.flatMap(msg => [
        { id: `${msg.id}_q`, text: msg.question, sender: "user", timestamp: msg.createdAt },
        { id: `${msg.id}_a`, text: msg.response, sender: "bot", timestamp: msg.createdAt }
      ]);
      setMessages(history);
      setHistoryLoaded(true);
    } catch (err) {
      console.error("Failed to load chat history", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (questionText) => {
    if (!questionText.trim() || sending) return;

    const userMessage = {
      id: Date.now(),
      text: questionText.trim(),
      sender: "user",
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setSending(true);

    try {
      const res = await api.post("/api/chat/send", { question: userMessage.text });
      const botMessage = {
        id: Date.now() + 1,
        text: res.data.answer,
        sender: "bot",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error("Chat send error", err);
      let errorText = "Désolé, une erreur s'est produite. Veuillez réessayer.";
      if (err.response?.status === 401) {
        errorText = "Veuillez vous reconnecter.";
      } else if (err.response?.data?.message) {
        errorText = err.response.data.message;
      }
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: errorText,
        sender: "bot",
        timestamp: new Date().toISOString(),
        isError: true
      }]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestedClick = (question) => {
    sendMessage(question);
  };

  // Not logged in – show login button
  if (!isLoggedIn) {
    return (
      <div className="chatbot-button" onClick={() => window.location.href = "/auth"}>
        💬
      </div>
    );
  }

  return (
    <>
      <button
        className={`chatbot-toggle ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? "✕" : "💬"}
      </button>

      {isOpen && (
        <div className="chatbot-widget">
          <div className="chatbot-header">
            <span>🤖 Assistant Emirio</span>
            <button onClick={() => setIsOpen(false)}>✕</button>
          </div>

          <div className="chatbot-messages">
            {loading && <div className="loading-indicator">Chargement de l'historique...</div>}
            
            {!loading && messages.length === 0 && (
              <div className="empty-state">
                <p>👋 Bonjour ! Je suis l'assistant d'Emirio Chaussures.</p>
                <p>Posez-moi des questions sur :</p>
                <ul>
                  <li>📍 Nos boutiques et coordonnées</li>
                  <li>👟 Disponibilité des articles</li>
                  <li>🏆 Meilleures ventes</li>
                  <li>🔥 Promotions en cours</li>
                  <li>📋 Catalogue complet</li>
                </ul>
                <div className="suggested-questions">
                  <p>Cliquez sur une question :</p>
                  <div className="suggested-buttons">
                    {suggestedQuestions.map((q, idx) => (
                      <button key={idx} onClick={() => handleSuggestedClick(q)}>
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`message ${msg.sender === "user" ? "user" : "bot"}`}
              >
                <div className="message-bubble">
                  <div className="message-text">{msg.text}</div>
                  <div className="message-time">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            {sending && (
              <div className="message bot">
                <div className="message-bubble typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="chatbot-input" onSubmit={handleSubmit}>
            <textarea
              ref={inputRef}
              rows="1"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Écrivez votre message..."
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <button type="submit" disabled={sending || !input.trim()}>
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
}