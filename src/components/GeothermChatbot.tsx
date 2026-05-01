"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const initialMessages: Message[] = [
  {
    id: "welcome",
    role: "assistant",
    content:
      "Dobrý deň, som **GEOTHERM asistent**. Pomôžem vám zistiť, či je pre dom vhodnejšie tepelné čerpadlo, podlahové vykurovanie, rekuperácia alebo kombinované riešenie.",
  },
];

const quickPrompts = [
  "Aké tepelné čerpadlo je vhodné pre novostavbu?",
  "Chcem návrh zdarma",
  "Mám rekonštrukciu domu",
  "Ako fungujú dotácie?",
];

function shouldShowLeadCard(text: string) {
  const lower = text.toLowerCase();
  return lower.includes("návrh") || lower.includes("ponuk") || lower.includes("kontakt");
}

export function GeothermChatbot() {
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [leadMode, setLeadMode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const visibleLeadCard = useMemo(
    () => leadMode || messages.some((message) => message.role === "user" && shouldShowLeadCard(message.content)),
    [leadMode, messages],
  );

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

  if (!isOpen) {
    return (
      <button className="chat-launcher" type="button" onClick={() => setIsOpen(true)}>
        <span className="launcher-orb">AI</span>
        <span>Poradiť s riešením</span>
      </button>
    );
  }

  return (
    <aside className="chat-shell" aria-label="GEOTHERM AI chatbot">
      <header className="chat-header">
        <div>
          <p>GEOTHERM asistent</p>
          <span>Online návrhový poradca</span>
        </div>
        <button type="button" aria-label="Zavrieť chat" onClick={() => setIsOpen(false)}>
          ×
        </button>
      </header>

      <div className="chat-body">
        <div className="quick-grid">
          {quickPrompts.map((prompt) => (
            <button type="button" key={prompt} onClick={() => void sendMessage(prompt)}>
              {prompt}
            </button>
          ))}
        </div>

        <div className="messages">
          {messages.map((message) => (
            <div className={`message ${message.role}`} key={message.id}>
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          ))}
          {isLoading ? (
            <div className="message assistant loading">
              <span />
              <span />
              <span />
            </div>
          ) : null}
        </div>

        {visibleLeadCard ? (
          <div className="lead-card">
            <p>Agent môže pokračovať akciou</p>
            <strong>Pripraviť podklady pre odborný návrh zdarma</strong>
            <button type="button" onClick={() => setLeadMode(true)}>
              Spustiť dry test akcie
            </button>
          </div>
        ) : null}
      </div>

      <form className="chat-input" onSubmit={onSubmit}>
        <input
          ref={inputRef}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Napíšte otázku o vykurovaní..."
        />
        <button type="submit" disabled={isLoading || !input.trim()}>
          Odoslať
        </button>
      </form>
    </aside>
  );
}
