"use client";

import { FormEvent, KeyboardEvent, PointerEvent, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export function GeothermChatbot() {
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 520, height: 720 });
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isLoading]);

  async function sendMessage(content: string) {
    const trimmed = content.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);

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

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: response.ok
            ? data.message ?? "Nemám pripravenú odpoveď."
            : `Nepodarilo sa spojiť s AI modelom. ${data.error ?? ""}`,
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Spojenie sa prerušilo. Skúste to ešte raz.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage(input);
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

  if (!isOpen) {
    return (
      <button className="chat-launcher" type="button" onClick={() => setIsOpen(true)}>
        <span className="launcher-orb">AI</span>
        <span>GEOTHERM asistent</span>
      </button>
    );
  }

  return (
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
              {message.role === "assistant" ? (
                <ReactMarkdown>{message.content}</ReactMarkdown>
              ) : (
                <p>{message.content}</p>
              )}
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

      <form className="chat-input" onSubmit={onSubmit}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(event) => onInputChange(event.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder="Napíšte správu..."
        />
        <button type="submit" disabled={isLoading || !input.trim()} aria-label="Odoslať správu">
          ↑
        </button>
      </form>
      <div className="chat-resize-grip" aria-hidden="true" onPointerDown={startResize} />
    </aside>
  );
}
