import { useState, useEffect, useRef } from "react";
import { api } from "../lib/api";
import "./Chatbot.css";

export default function Chatbot({ me }) {
  const [isOpen, setIsOpen] = useState(false);
  const [stylistMode, setStylistMode] = useState(false);
  const [normalMessages, setNormalMessages] = useState([]);
  const [stylistMessages, setStylistMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const isLoggedIn = me && localStorage.getItem("token");
  const currentMessages = stylistMode ? stylistMessages : normalMessages;
  const setCurrentMessages = stylistMode ? setStylistMessages : setNormalMessages;

  // Load conversation history for normal mode from backend
  useEffect(() => {
    if (!isLoggedIn || stylistMode) return;
    if (!historyLoaded) {
      const fetchHistory = async () => {
        try {
          const res = await api.get("/api/chat/history");
          const history = res.data; // array of { id, question, response, createdAt }
          // Transform each DB record into two messages: user question + bot response
          const messages = [];
          history.forEach(record => {
            messages.push({
              id: record.id + "_user",
              text: record.question,
              sender: "user",
              timestamp: record.createdAt,
            });
            messages.push({
              id: record.id + "_bot",
              text: record.response,
              sender: "bot",
              timestamp: record.createdAt,
            });
          });
          setNormalMessages(messages);
          setHistoryLoaded(true);
        } catch (err) {
          console.error("Failed to load history", err);
          // fallback to empty conversation
          setNormalMessages([]);
          setHistoryLoaded(true);
        }
      };
      fetchHistory();
    }
  }, [isLoggedIn, stylistMode, historyLoaded]);

  // Load stylist messages from localStorage (no backend persistence)
  useEffect(() => {
    if (!isLoggedIn) return;
    if (stylistMode) {
      const saved = localStorage.getItem("chat_stylist_messages");
      if (saved) setStylistMessages(JSON.parse(saved));
    }
  }, [stylistMode, isLoggedIn]);

  // Save stylist messages to localStorage when they change
  useEffect(() => {
    if (!isLoggedIn) return;
    if (stylistMode) {
      localStorage.setItem("chat_stylist_messages", JSON.stringify(stylistMessages));
    }
  }, [stylistMessages, stylistMode, isLoggedIn]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages]);

  const sendMessage = async (questionText) => {
    if (!questionText.trim() || sending) return;

    const userMessage = {
      id: Date.now(),
      text: questionText.trim(),
      sender: "user",
      timestamp: new Date().toISOString(),
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
        timestamp: new Date().toISOString(),
      };
      setCurrentMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error("Send error", err);
      let errorText = "Sorry, an error occurred. Please try again.";
      if (err.response?.status === 401) errorText = "Please login again.";
      else if (err.response?.data?.message) errorText = err.response.data.message;
      setCurrentMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          text: errorText,
          sender: "bot",
          timestamp: new Date().toISOString(),
          isError: true,
        },
      ]);
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

  // Quick actions (normal mode)
  const quickActions = [
    { emoji: "📍", title: "Store Info", description: "Hours & location", question: "What are your opening hours and store location?" },
    { emoji: "👟", title: "Product Availability", description: "Check stock", question: "Do you have Nike Air Max in stock?" },
    { emoji: "🏆", title: "Best Sellers", description: "Popular items", question: "What are your best-selling shoes?" },
    { emoji: "🔥", title: "Promotions", description: "Current deals", question: "Are there any current promotions or sales?" },
    { emoji: "📋", title: "Full Catalog", description: "All products", question: "List all available products in your catalog" },
    { emoji: "🚚", title: "Shipping Info", description: "Delivery details", question: "What are your shipping options and delivery times?" },
  ];

  const sampleQuestions = [
    { icon: "🕒", text: "What are your opening hours?" },
    { icon: "📍", text: "Where is your store located?" },
    { icon: "👟", text: "Do you have Nike shoes in stock?" },
    { icon: "🏆", text: "What's your best-selling item?" },
    { icon: "🔥", text: "Are there any promotions?" },
    { icon: "📋", text: "List all available products" },
  ];

  // Style mode specific content
  const styleQuickActions = [
    { emoji: "👖", title: "Jeans & Shoes", description: "Perfect combinations", question: "What shoes go best with blue jeans?" },
    { emoji: "👗", title: "Dress Shoes", description: "Elegant options", question: "What shoes should I wear with a black dress?" },
    { emoji: "🏃", title: "Sport Style", description: "Active wear", question: "What are the best sneakers for running?" },
    { emoji: "👡", title: "Summer Fashion", description: "Seasonal trends", question: "What are the most stylish sandals for summer?" },
    { emoji: "🎨", title: "Color Matching", description: "Style tips", question: "How to match shoe colors with outfits?" },
    { emoji: "👔", title: "Formal Wear", description: "Office & events", question: "What formal shoes are best for business meetings?" },
  ];

  const styleSampleQuestions = [
    { icon: "👖", text: "What shoes with blue jeans?" },
    { icon: "👗", text: "Boots for a red dress?" },
    { icon: "🏃", text: "Best sneakers for sports?" },
    { icon: "👡", text: "Elegant sandals for summer?" },
    { icon: "👢", text: "Booties for a black dress?" },
    { icon: "🎨", text: "Colors that match with brown?" },
  ];

  // Not logged in
  if (!isLoggedIn) {
    return (
      <button
        className="chatbot-toggle"
        onClick={() => (window.location.href = "/auth")}
        aria-label="Chat with AI Assistant"
      >
        🤖
      </button>
    );
  }

  return (
    <>
      <button
        className={`chatbot-toggle ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? "✕" : "🤖"}
      </button>

      {isOpen && (
        <div className="chatbot-widget">
          <div className="chatbot-header">
            <div className="chatbot-header-left">
              <span className="chatbot-header-icon">{stylistMode ? "✨" : "🤖"}</span>
              <span>{stylistMode ? "Style Advisor" : "Emirio AI Assistant"}</span>
            </div>
            <div className="chatbot-header-actions">
              <button
                onClick={toggleStylistMode}
                className={`style-mode-btn ${stylistMode ? "active" : ""}`}
                title={stylistMode ? "Switch to general assistant" : "Get style advice"}
              >
                {stylistMode ? "✨ Style Mode" : "💡 Style Advice"}
              </button>
              <button onClick={() => setIsOpen(false)} className="close-btn" aria-label="Close">
                ✕
              </button>
            </div>
          </div>

          <div className="chatbot-messages">
            {currentMessages.length === 0 && (
              <div className={`empty-state ${stylistMode ? "style-mode" : ""}`}>
                <div className="welcome-section">
                  <span className="welcome-icon">{stylistMode ? "✨" : "👋"}</span>
                  <h2 className="welcome-title">
                    {stylistMode ? "Style Advisor" : "Hello! I'm Emirio AI"}
                  </h2>
                  <p className="welcome-subtitle">
                    {stylistMode
                      ? "Your personal fashion consultant. Ask me about outfits, colors, and shoe matching!"
                      : "Your intelligent shopping assistant. Ask me anything about our store and products."}
                  </p>
                </div>

                <div className="quick-actions">
                  <div className="quick-actions-title">QUICK ACTIONS</div>
                  <div className="quick-actions-grid">
                    {(stylistMode ? styleQuickActions : quickActions).map((action, idx) => (
                      <button key={idx} className="action-card" onClick={() => handleSuggestedClick(action.question)}>
                        <span className="action-emoji">{action.emoji}</span>
                        <div className="action-title">{action.title}</div>
                        <div className="action-description">{action.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="sample-questions">
                  <div className="sample-header">POPULAR QUESTIONS</div>
                  <div className="sample-list">
                    {(stylistMode ? styleSampleQuestions : sampleQuestions).map((q, idx) => (
                      <button key={idx} className="sample-item" onClick={() => handleSuggestedClick(q.text)}>
                        <span className="sample-icon">{q.icon}</span>
                        <span className="sample-text">{q.text}</span>
                        <span className="sample-arrow">→</span>
                      </button>
                    ))}
                  </div>
                </div>

                {stylistMode && (
                  <div className="style-tip">
                    <span className="style-tip-icon">💡</span>
                    <div className="style-tip-content">
                      <div className="style-tip-title">Pro Tip</div>
                      <div className="style-tip-text">For best results, describe your outfit or occasion in detail!</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentMessages.map((msg) => (
              <div key={msg.id} className={`message ${msg.sender === "user" ? "user" : "bot"}`}>
                <div className="message-bubble">
                  <div className="message-text">{msg.text}</div>
                  <div className="message-time">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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
              placeholder={stylistMode ? "Ask for style advice..." : "Type your message..."}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <button type="submit" disabled={sending || !input.trim()} aria-label="Send">
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
}