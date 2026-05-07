import { FormEvent, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

type ArcigyConfig = {
  restUrl: string;
  nonce: string;
  currentUrl: string;
  siteUrl: string;
  pluginVersion: string;
};

type ChatAction = {
  type: "navigate_and_highlight" | string;
  url?: string;
  selector?: string;
  highlightText?: string;
};

type ChatResponse = {
  answer?: string;
  message?: string;
  sources?: Array<{
    pageTitle?: string;
    url?: string;
    sectionId?: string;
    selector?: string;
    heading?: string;
  }>;
  action?: ChatAction;
};

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  action?: ChatAction;
};

declare global {
  interface Window {
    ArcigyChatbotConfig?: ArcigyConfig;
  }
}

const pendingActionKey = "arcigy_chatbot_pending_action";

function logAction(message: string, detail?: unknown) {
  console.log(`[ArcigyChatbot] ${message}`, detail ?? "");
}

function samePage(url?: string) {
  if (!url) return true;

  const target = new URL(url, window.location.origin);
  const current = new URL(window.location.href);
  const normalize = (value: string) => value.replace(/\/$/, "") || "/";

  return target.origin === current.origin && normalize(target.pathname) === normalize(current.pathname);
}

function highlightTarget(element: HTMLElement) {
  element.classList.add("arcigy-chatbot-highlight");
  window.setTimeout(() => {
    element.classList.remove("arcigy-chatbot-highlight");
    logAction("HIGHLIGHT_DONE");
  }, 1800);
}

function executeAction(action: ChatAction) {
  logAction("ACTION_STARTED", action);

  if (!samePage(action.url)) {
    logAction("REDIRECTING", action.url);
    sessionStorage.setItem(pendingActionKey, JSON.stringify(action));
    window.location.href = new URL(action.url || "/", window.location.origin).toString();
    return;
  }

  const selector = action.selector || (action.highlightText ? `[data-arcigy-heading="${action.highlightText}"]` : "");
  const target = selector ? document.querySelector<HTMLElement>(selector) : null;

  if (!target) {
    logAction("TARGET_NOT_FOUND", selector);
    return;
  }

  logAction("TARGET_FOUND", selector);
  target.scrollIntoView({ behavior: "smooth", block: "center" });
  highlightTarget(target);
}

function executePendingAction() {
  const rawAction = sessionStorage.getItem(pendingActionKey);
  if (!rawAction) return;

  sessionStorage.removeItem(pendingActionKey);

  try {
    const action = JSON.parse(rawAction) as ChatAction;
    window.setTimeout(() => executeAction(action), 350);
  } catch {
    logAction("TARGET_NOT_FOUND", "invalid pending action");
  }
}

function getConfig() {
  const config = window.ArcigyChatbotConfig;

  if (!config?.restUrl) {
    throw new Error("ArcigyChatbotConfig.restUrl is missing.");
  }

  return config;
}

function ArcigyChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logAction("PLUGIN_ASSETS_LOADED", getConfig().pluginVersion);
    logAction("ROOT_FOUND", Boolean(document.querySelector("#arcigy-chatbot-root")));
    executePendingAction();
  }, []);

  useEffect(() => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const text = input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = { id: crypto.randomUUID(), role: "user", text };
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const config = getConfig();
      const response = await fetch(config.restUrl, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "X-WP-Nonce": config.nonce,
        },
        body: JSON.stringify({
          message: text,
          currentUrl: window.location.href,
        }),
      });
      const data = (await response.json()) as ChatResponse;
      const assistantText = data.answer || data.message || "Nemám pripravenú odpoveď.";

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: assistantText,
          action: data.action,
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: "Spojenie s chatbotom zlyhalo. Skúste to znova.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className={`arcigy-chatbot ${isOpen ? "is-open" : ""}`} aria-label="Arcigy chatbot">
      {isOpen ? (
        <div className="arcigy-chatbot__panel">
          <header className="arcigy-chatbot__header">
            <div>
              <strong>Arcigy asistent</strong>
              <span>WordPress embed test</span>
            </div>
            <button type="button" onClick={() => setIsOpen(false)} aria-label="Zavrieť chat">
              ×
            </button>
          </header>

          <div className="arcigy-chatbot__messages" ref={messagesRef}>
            {messages.length === 0 ? (
              <div className="arcigy-chatbot__empty">
                Napíšte otázku k NIBE, dotáciám, kontaktu alebo cene.
              </div>
            ) : null}
            {messages.map((message) => (
              <article className={`arcigy-chatbot__message is-${message.role}`} key={message.id}>
                <p>{message.text}</p>
                {message.action ? (
                  <button type="button" onClick={() => executeAction(message.action!)}>
                    Ukázať na stránke
                  </button>
                ) : null}
              </article>
            ))}
            {isLoading ? <div className="arcigy-chatbot__typing">Pripravujem odpoveď...</div> : null}
          </div>

          <form className="arcigy-chatbot__form" onSubmit={sendMessage}>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              rows={1}
              placeholder="Napíšte správu..."
            />
            <button type="submit" disabled={isLoading} aria-label="Odoslať správu">
              ↑
            </button>
          </form>
        </div>
      ) : null}

      <button className="arcigy-chatbot__launcher" type="button" onClick={() => setIsOpen(true)}>
        AI
      </button>
    </section>
  );
}

const rootElement = document.querySelector("#arcigy-chatbot-root");

if (rootElement) {
  createRoot(rootElement).render(<ArcigyChatbot />);
} else {
  logAction("ROOT_NOT_FOUND", "#arcigy-chatbot-root");
}
