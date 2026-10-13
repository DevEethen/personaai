"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const STARTER_PROMPTS = [
  { icon: "⌘", title: "Help me code", text: "Help me write and understand some code" },
  { icon: "✳", title: "Explain anything", text: "Explain a difficult topic in simple words" },
  { icon: "↗", title: "Brainstorm ideas", text: "Help me come up with some original ideas" },
  { icon: "◷", title: "Plan my day", text: "Help me make a realistic plan for today" },
];

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function Brand({ small = false }) {
  return (
    <div className={`brand ${small ? "brand-small" : ""}`}>
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 36 36" fill="none"><path d="M18 3.5 21.6 13l9.5 5-9.5 3.6-3.6 10-3.6-10L4.5 18l9.9-5L18 3.5Z" fill="currentColor"/><circle cx="27.8" cy="7.6" r="2.1" fill="#B5A5FF"/><circle cx="7.2" cy="27.8" r="1.5" fill="#B5A5FF"/></svg>
      </span>
      <span>persona<span className="brand-ai"> AI</span></span>
    </div>
  );
}

function Icon({ name, size = 18 }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
  if (name === "plus") return <svg {...common}><path d="M12 5v14M5 12h14" /></svg>;
  if (name === "send") return <svg {...common}><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>;
  if (name === "menu") return <svg {...common}><path d="M4 6h16M4 12h16M4 18h16"/></svg>;
  if (name === "spark") return <svg {...common}><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-2-5.8L4 11l6-2.2L12 3Z"/><path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z"/></svg>;
  if (name === "trash") return <svg {...common}><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6"/></svg>;
  if (name === "arrow") return <svg {...common}><path d="M7 17 17 7M7 7h10v10"/></svg>;
  return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/></svg>;
}

function MessageContent({ content }) {
  return <div className="markdown"><ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown></div>;
}

export default function Home() {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const textareaRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("persona-ai-conversations-v1");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setConversations(parsed.slice(0, 30));
          if (parsed.length) setActiveId(parsed[0].id);
        }
      }
    } catch { /* Ignore corrupted local history. */ }
    setReady(true);
  }, []);

  useEffect(() => {
    function handleShortcut(event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        newChat();
      }
      if (event.key === "Escape") setSidebarOpen(false);
    }
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [newChat]);

  useEffect(() => {
    if (ready) {
      try { localStorage.setItem("persona-ai-conversations-v1", JSON.stringify(conversations.slice(0, 30))); }
      catch { /* Continue chatting if storage is full or unavailable. */ }
    }
  }, [conversations, ready]);

  const activeChat = conversations.find((chat) => chat.id === activeId) || null;
  const messages = activeChat?.messages || [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  const newChat = useCallback(() => {
    setActiveId(null);
    setInput("");
    setError("");
    setSidebarOpen(false);
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, []);

  const updateChat = (id, updater) => {
    setConversations((current) => current.map((chat) => chat.id === id ? updater(chat) : chat));
  };

  async function sendMessage(text = input) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    if (trimmed.length > 6000) {
      setError("Keep each message under 6,000 characters.");
      return;
    }
    setInput("");
    setError("");
    setLoading(true);

    const userMessage = { role: "user", content: trimmed };
    let chatId = activeId;
    let priorMessages = messages;
    if (!chatId) {
      chatId = uid();
      priorMessages = [];
      const newConversation = {
        id: chatId,
        title: trimmed.length > 34 ? `${trimmed.slice(0, 34).trim()}…` : trimmed,
        messages: [userMessage],
        updatedAt: Date.now(),
      };
      setConversations((current) => [newConversation, ...current].slice(0, 30));
      setActiveId(chatId);
    } else {
      updateChat(chatId, (chat) => ({ ...chat, messages: [...chat.messages, userMessage], updatedAt: Date.now() }));
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...priorMessages, userMessage].slice(-24) }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Persona AI couldn't answer just now.");
      updateChat(chatId, (chat) => ({
        ...chat,
        messages: [...chat.messages, { role: "assistant", content: data.answer }],
        updatedAt: Date.now(),
      }));
    } catch (err) {
      const reason = err?.message || "Connection failed. Check your internet and try again.";
      setError(reason);
      // Keep the user's message in the conversation so they can retry it.
    } finally {
      setLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  }

  function removeConversation(event, id) {
    event.stopPropagation();
    setConversations((current) => current.filter((chat) => chat.id !== id));
    if (activeId === id) setActiveId(null);
  }

  const hasMessages = messages.length > 0;

  return (
    <main className={`app-shell ${sidebarOpen ? "sidebar-open" : ""}`}>
      <div className="mobile-backdrop" onClick={() => setSidebarOpen(false)} />
      <aside className="sidebar">
        <div className="sidebar-top">
          <Brand />
          <button className="icon-button mobile-close" aria-label="Close menu" onClick={() => setSidebarOpen(false)}><Icon name="menu" /></button>
        </div>
        <button className="new-chat-button" onClick={newChat}><Icon name="plus" size={17} /><span>New chat</span><span className="shortcut">Ctrl K</span></button>
        <div className="side-label">YOUR SPACE</div>
        <div className="history-list">
          {conversations.length === 0 ? <div className="empty-history">Your conversations<br />will appear here.</div> : conversations.map((chat) => (
            <button className={`history-item ${activeId === chat.id ? "active" : ""}`} key={chat.id} onClick={() => { setActiveId(chat.id); setError(""); setSidebarOpen(false); }} title={chat.title}>
              <span className="history-dot" />
              <span className="history-title">{chat.title}</span>
              <span className="delete-chat" role="button" aria-label="Delete conversation" onClick={(e) => removeConversation(e, chat.id)}><Icon name="trash" size={14} /></span>
            </button>
          ))}
        </div>
        <div className="sidebar-bottom">
          <div className="profile-avatar">P</div>
          <div className="profile-copy"><strong>Persona AI</strong><span>Your personal assistant</span></div>
          <span className="online-dot" title="Ready" />
        </div>
      </aside>

      <section className="main-panel">
        <header className="topbar">
          <div className="mobile-brand"><button className="icon-button mobile-menu" aria-label="Open menu" onClick={() => setSidebarOpen(true)}><Icon name="menu" /></button><Brand small /></div>
          <div className="topbar-center"><span className="status-dot" /> Ready to help</div>
          <button className="top-new-chat" onClick={newChat}><Icon name="plus" size={16} /><span>New chat</span></button>
        </header>

        <div className={`conversation-area ${hasMessages ? "has-messages" : "welcome-mode"}`}>
          {!hasMessages ? (
            <div className="welcome-content">
              <div className="welcome-orb"><div className="orb-core"><Icon name="spark" size={34} /></div><span className="orb-ring ring-one" /><span className="orb-ring ring-two" /><span className="orb-star star-one">✦</span><span className="orb-star star-two">✧</span></div>
              <div className="eyebrow"><span /> YOUR AI, YOUR WAY</div>
              <h1>Big thoughts.<br /><span>Meet Persona.</span></h1>
              <p className="welcome-subtitle">A curious mind for whatever’s on yours.<br className="desktop-break" /> Ask, explore, create — let’s get into it.</p>
              <div className="starter-grid">
                {STARTER_PROMPTS.map((prompt) => <button className="starter-card" key={prompt.title} onClick={() => sendMessage(prompt.text)}><span className="starter-icon">{prompt.icon}</span><span className="starter-text"><strong>{prompt.title}</strong><small>{prompt.text}</small></span><span className="starter-arrow"><Icon name="arrow" size={15} /></span></button>)}
              </div>
            </div>
          ) : (
            <div className="message-list">
              {messages.map((message, index) => <div className={`message-row ${message.role === "user" ? "user-row" : "assistant-row"}`} key={`${activeId}-${index}`}>
                {message.role === "assistant" && <div className="assistant-avatar"><Icon name="spark" size={16} /></div>}
                <div className={`message-bubble ${message.role === "user" ? "user-bubble" : "assistant-bubble"}`}>
                  {message.role === "assistant" ? <MessageContent content={message.content} /> : <p>{message.content}</p>}
                </div>
              </div>)}
              {loading && <div className="message-row assistant-row"><div className="assistant-avatar"><Icon name="spark" size={16} /></div><div className="message-bubble assistant-bubble loading-bubble"><span className="typing-dot"/><span className="typing-dot"/><span className="typing-dot"/><span className="thinking-label">Thinking it through…</span></div></div>}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <div className="composer-wrap">
          {error && <div className="error-message" role="alert"><Icon name="info" size={16} /><span>{error}</span><button onClick={() => setError("")} aria-label="Dismiss error">×</button></div>}
          <form className="composer" onSubmit={(event) => { event.preventDefault(); sendMessage(); }}>
            <textarea ref={textareaRef} value={input} onChange={(event) => { setInput(event.target.value); event.target.style.height = "auto"; event.target.style.height = `${Math.min(event.target.scrollHeight, 180)}px`; }} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendMessage(); } }} placeholder="Ask Persona anything…" rows={1} maxLength={6000} aria-label="Message Persona AI" />
            <div className="composer-footer"><span className="composer-hint"><span className="keyboard-key">↵</span> to send <span className="hint-divider">·</span> shift + enter for a new line</span><div className="composer-actions"><span className="char-count">{input.length > 0 ? `${input.length}/6000` : ""}</span><button className="send-button" type="submit" disabled={!input.trim() || loading} aria-label="Send message"><Icon name="send" size={17} /></button></div></div>
          </form>
          <p className="disclaimer">Persona AI can make mistakes. Double-check important information.</p>
        </div>
      </section>
    </main>
  );
}
