"use client";

import { FormEvent, KeyboardEvent, PointerEvent, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type ChatMode = "panel" | "perplexity" | "codex";

const modeLabels: Record<ChatMode, string> = {
  panel: "Panel",
  perplexity: "Perplexity",
  codex: "Codex",
};

function MarkdownMessage({ content }: { content: string }) {
  return <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>;
}

export function GeothermChatbot() {
  const [mode, setMode] = useState<ChatMode>("perplexity");
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 520, height: 720 });
  const [codexCollapsed, setCodexCollapsed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimerRef = useRef<number | null>(null);

  const hasConversation = messages.length > 0;
  const lastAssistantMessage = [...messages].reverse().find((message) => message.role === "assistant");

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isLoading]);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) {
        window.clearInterval(typingTimerRef.current);
      }
    };
  }, []);

  function animateAssistantMessage(content: string) {
    const id = crypto.randomUUID();
    let index = 0;

    setMessages((current) => [...current, { id, role: "assistant", content: "" }]);

    return new Promise<void>((resolve) => {
      typingTimerRef.current = window.setInterval(() => {
        index += 4;
        const nextContent = content.slice(0, index);

        setMessages((current) =>
          current.map((message) => (message.id === id ? { ...message, content: nextContent } : message)),
        );

        if (index >= content.length) {
          if (typingTimerRef.current) {
            window.clearInterval(typingTimerRef.current);
            typingTimerRef.current = null;
          }
          resolve();
        }
      }, 12);
    });
  }

  async function sendMessage(content: string) {
    const trimmed = content.trim();
    if (!trimmed || isLoading) return;

    if (!isOpen) setIsOpen(true);
    if (typingTimerRef.current) window.clearInterval(typingTimerRef.current);

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);
    setCodexCollapsed(false);

    if (textareaRef.current) {
      textareaRef.current.style.height = "48px";
    }

    try {
      const response = await fetch("/api/geotherm-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map(({ role, content }) => ({ role, content })),
        }),
      });

      const data = (await response.json()) as { message?: string; error?: string };
      const assistantContent = response.ok
        ? data.message ?? "Nemám pripravenú odpoveď."
        : `Nepodarilo sa spojiť s AI modelom. ${data.error ?? ""}`;

      setIsLoading(false);
      await animateAssistantMessage(assistantContent);
    } catch {
      setIsLoading(false);
      await animateAssistantMessage("Spojenie sa prerušilo. Skúste to ešte raz.");
    } finally {
      setIsLoading(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input || textareaRef.current?.value || "");
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage(input || textareaRef.current?.value || "");
    }
  }

  function onInputChange(value: string) {
    setInput(value);

    if (!textareaRef.current) return;

    textareaRef.current.style.height = "48px";
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 132)}px`;
  }

  function startResize(event: PointerEvent<HTMLDivElement>) {
    event.preventDefault();
    const startX = event.clientX;
    const startY = event.clientY;
    const startWidth = windowSize.width;
    const startHeight = windowSize.height;

    function onPointerMove(pointerEvent: globalThis.PointerEvent) {
      const maxWidth = window.innerWidth - 28;
      const maxHeight = window.innerHeight - 40;

      setWindowSize({
        width: Math.min(Math.max(390, startWidth + pointerEvent.clientX - startX), maxWidth),
        height: Math.min(Math.max(520, startHeight + pointerEvent.clientY - startY), maxHeight),
      });
    }

    function onPointerUp() {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  }

  const modeSwitcher = (
    <div className="chat-mode-switch" aria-label="Výber vzhľadu chatbota">
      {(Object.keys(modeLabels) as ChatMode[]).map((option) => (
        <button
          className={mode === option ? "active" : ""}
          type="button"
          key={option}
          onClick={() => {
            setMode(option);
            setIsOpen(option !== "panel" || isOpen);
          }}
        >
          {modeLabels[option]}
        </button>
      ))}
    </div>
  );

  const inputForm = (variant: "panel" | "perplexity" | "codex") => (
    <form className={`chat-input ${variant}`} onSubmit={onSubmit}>
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(event) => onInputChange(event.target.value)}
        onKeyDown={onKeyDown}
        rows={1}
        placeholder={variant === "codex" ? "Zadajte / pre režimy vyhľadávania a skratky" : "Napíšte správu..."}
      />
      <button type="submit" disabled={isLoading} aria-label="Odoslať správu">
        ↑
      </button>
    </form>
  );

  if (mode === "perplexity") {
    return (
      <>
        <div className="floating-mode-control">{modeSwitcher}</div>
        {hasConversation || isOpen ? (
          <section className="perplexity-answer" ref={scrollRef} aria-label="GEOTHERM AI odpovede">
            <div className="perplexity-answer-top">
              <span>GEOTHERM AI</span>
              <button type="button" onClick={() => setIsOpen(false)} aria-label="Minimalizovať odpoveď">
                ×
              </button>
            </div>
            <div className="messages compact">
              {messages.map((message) => (
                <article className={`message ${message.role}`} key={message.id}>
                  {message.role === "assistant" ? <MarkdownMessage content={message.content} /> : <p>{message.content}</p>}
                </article>
              ))}
              {isLoading ? (
                <div className="assistant-thinking">
                  <span>Pripravujem odpoveď</span>
                  <i />
                  <i />
                  <i />
                </div>
              ) : null}
            </div>
          </section>
        ) : null}
        <section className="perplexity-composer" aria-label="GEOTHERM AI spodný asistent">
          <div className="perplexity-context">Najnovší príspevok</div>
          {inputForm("perplexity")}
          <div className="perplexity-footer">
            <span>+</span>
            <span>Úplný prístup</span>
            <span>Gemini 2.5 Flash</span>
          </div>
        </section>
        <button className="chat-launcher perplexity" type="button" onClick={() => setIsOpen((current) => !current)}>
          <span className="launcher-orb">AI</span>
          <span>GEOTHERM asistent</span>
        </button>
      </>
    );
  }

  if (mode === "codex") {
    return (
      <>
        <aside className="codex-dock" aria-label="GEOTHERM AI Codex panel">
          <header className="codex-header">
            <span>•••</span>
            {modeSwitcher}
          </header>

          <div className="codex-center" ref={scrollRef}>
            {!lastAssistantMessage ? (
              <div className="codex-empty">
                <span className="codex-mark">◖</span>
                <strong>Asistent</strong>
              </div>
            ) : (
              <article className={`codex-response ${codexCollapsed ? "collapsed" : ""}`}>
                <button type="button" onClick={() => setCodexCollapsed((current) => !current)}>
                  <span>GEOTHERM odpoveď</span>
                  <span>{codexCollapsed ? "Rozbaliť" : "Minimalizovať"}</span>
                </button>
                {!codexCollapsed ? (
                  <div className="message assistant">
                    <MarkdownMessage content={lastAssistantMessage.content} />
                  </div>
                ) : null}
              </article>
            )}
            {isLoading ? (
              <div className="assistant-thinking codex-thinking">
                <span>Pripravujem odpoveď</span>
                <i />
                <i />
                <i />
              </div>
            ) : null}
          </div>

          <div className="codex-bottom">
            <div className="codex-agent-label">
              <span>◉</span>
              <span>GEOTHERM AI Asistent</span>
            </div>
            {inputForm("codex")}
          </div>
        </aside>
      </>
    );
  }

  if (!isOpen) {
    return (
      <>
        <div className="floating-mode-control">{modeSwitcher}</div>
        <button className="chat-launcher" type="button" onClick={() => setIsOpen(true)}>
          <span className="launcher-orb">AI</span>
          <span>GEOTHERM asistent</span>
        </button>
      </>
    );
  }

  return (
    <>
      <div className="floating-mode-control">{modeSwitcher}</div>
      <aside
        className="chat-shell"
        style={{ width: windowSize.width, height: windowSize.height }}
        aria-label="GEOTHERM AI chatbot"
      >
        <header className="chat-header">
          <div className="chat-title">
            <span className="chat-logo">G</span>
            <div>
              <p>GEOTHERM AI</p>
              <span>Odborný návrhový asistent</span>
            </div>
          </div>
          <button type="button" aria-label="Zavrieť chat" onClick={() => setIsOpen(false)}>
            ×
          </button>
        </header>

        <div className="chat-body" ref={scrollRef}>
          {messages.length === 0 ? (
            <section className="chat-empty">
              <span className="empty-mark">AI</span>
              <h2>GEOTHERM AI</h2>
              <p>Profesionálny poradca pre vykurovanie, chladenie a vetranie domu.</p>
            </section>
          ) : null}

          <div className="messages">
            {messages.map((message) => (
              <article className={`message ${message.role}`} key={message.id}>
                {message.role === "assistant" ? <MarkdownMessage content={message.content} /> : <p>{message.content}</p>}
              </article>
            ))}

            {isLoading ? (
              <div className="assistant-thinking">
                <span>Pripravujem odpoveď</span>
                <i />
                <i />
                <i />
              </div>
            ) : null}
          </div>
        </div>

        {inputForm("panel")}
        <div className="chat-resize-grip" aria-hidden="true" onPointerDown={startResize} />
      </aside>
    </>
  );
}
