import { useState, useEffect, useRef } from "react";
import { api } from "../lib/api";
import "./Chatbot.css";

export default function Chatbot({ me }) {
  const [isOpen, setIsOpen] = useState(false);
  const [stylistMode, setStylistMode] = useState(false);
  const [normalMessages, setNormalMessages] = useState([]);
  const [stylistMessages, setStylistMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const isLoggedIn = me && localStorage.getItem("token");
  const currentMessages = stylistMode ? stylistMessages : normalMessages;
  const setCurrentMessages = stylistMode ? setStylistMessages : setNormalMessages;

  // Load saved conversations from localStorage
  useEffect(() => {
    if (!isLoggedIn) return;
    const savedNormal = localStorage.getItem("chat_normal_messages");
    const savedStylist = localStorage.getItem("chat_stylist_messages");
    if (savedNormal) setNormalMessages(JSON.parse(savedNormal));
    if (savedStylist) setStylistMessages(JSON.parse(savedStylist));
  }, [isLoggedIn]);

  // Save current conversation when it changes
  useEffect(() => {
    if (!isLoggedIn) return;
    const key = stylistMode ? "chat_stylist_messages" : "chat_normal_messages";
    localStorage.setItem(key, JSON.stringify(currentMessages));
  }, [currentMessages, stylistMode, isLoggedIn]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages]);

  const sendMessage = async (questionText) => {
    if (!questionText.trim() || sending) return;

    const userMessage = {
      id: Date.now(),
      text: questionText.trim(),
      sender: "user",
      timestamp: new Date().toISOString()
    };
    setCurrentMessages(prev => [...prev, userMessage]);
    setInput("");
    setSending(true);

    try {
      let endpoint = "/api/chat/send";
      let payload = { question: userMessage.text };

      if (stylistMode) {
        endpoint = "/api/stylist/advice";
        payload = { question: userMessage.text };
      }

      const res = await api.post(endpoint, payload);
      const botMessage = {
        id: Date.now() + 1,
        text: res.data.answer,
        sender: "bot",
        timestamp: new Date().toISOString()
      };
      setCurrentMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error("Send error", err);
      let errorText = "Désolé, une erreur s'est produite. Veuillez réessayer.";
      if (err.response?.status === 401) errorText = "Veuillez vous reconnecter.";
      else if (err.response?.data?.message) errorText = err.response.data.message;
      setCurrentMessages(prev => [...prev, {
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

  const toggleStylistMode = () => {
    setStylistMode(prev => !prev);
  };

  const suggestedQuestions = stylistMode ? [
    "Quelles chaussures avec un jean bleu ?",
    "Conseille-moi une tenue pour un mariage",
    "Quel style de basket pour le sport ?",
    "Sandales élégantes pour l'été ?",
    "Bottines pour une robe noire ?"
  ] : [
    "Quels sont vos horaires d'ouverture ?",
    "Où se trouve votre boutique ?",
    "Avez-vous des chaussures Nike Air Max en stock ?",
    "Quel est l'article le plus vendu ?",
    "Y a-t-il des promotions en cours ?",
    "Listez tous les articles disponibles"
  ];

  // Not logged in
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
            <span>🤖 {stylistMode ? "Conseiller Style" : "Assistant Emirio"}</span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={toggleStylistMode}
                className={`style-btn ${stylistMode ? "active" : ""}`}
                title={stylistMode ? "Désactiver le mode style" : "Activer le mode conseil style"}
              >
                💡 {stylistMode ? "Mode Style ON" : "Conseil Style"}
              </button>
              <button onClick={() => setIsOpen(false)}>✕</button>
            </div>
          </div>

          <div className="chatbot-messages">
            {currentMessages.length === 0 && (
              <div className="empty-state">
                {stylistMode ? (
                  <>
                    <p>✨ Mode Conseil Style activé ! ✨</p>
                    <p>Posez-moi vos questions sur les tenues, les couleurs et les chaussures qui correspondent.</p>
                    <p>Exemples :</p>
                    <ul>
                      <li>👖 "Quelles chaussures avec un jean noir ?"</li>
                      <li>👗 "Bottines pour une robe rouge ?"</li>
                      <li>🏃 "Baskets confortables pour la ville ?"</li>
                    </ul>
                  </>
                ) : (
                  <>
                    <p>👋 Bonjour ! Je suis l'assistant d'Emirio Chaussures.</p>
                    <p>Posez-moi des questions sur :</p>
                    <ul>
                      <li>📍 Nos boutiques et coordonnées</li>
                      <li>👟 Disponibilité des articles</li>
                      <li>🏆 Meilleures ventes</li>
                      <li>🔥 Promotions en cours</li>
                      <li>📋 Catalogue complet</li>
                    </ul>
                  </>
                )}
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

            {currentMessages.map((msg) => (
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
              placeholder={stylistMode ? "💡 Conseil style – Posez votre question..." : "Écrivez votre message..."}
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