import { KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
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
  type?: string;
  url?: string;
  selector?: string;
  anchorId?: string;
  highlightText?: string;
  label?: string;
};

type ChatResponse = {
  answer?: string;
  message?: string;
  conversationState?: unknown;
  action?: ChatAction | null;
  actions?: ChatAction[];
  images?: ChatImage[];
};

type ChatImage = {
  id?: string;
  url: string;
  alt?: string;
  description?: string;
};

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  action?: ChatAction | null;
  images?: ChatImage[];
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

function createMessageId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `arcigy-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getConfig() {
  const config = window.ArcigyChatbotConfig;
  if (!config?.restUrl) throw new Error("ArcigyChatbotConfig.restUrl is missing.");
  return config;
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

  if (action.url && !samePage(action.url)) {
    logAction("REDIRECTING", action.url);
    sessionStorage.setItem(pendingActionKey, JSON.stringify(action));
    window.location.href = new URL(action.url, window.location.origin).toString();
    return;
  }

  const selector = action.selector || (action.anchorId ? `#${action.anchorId}` : "");
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

function sanitizeMarkdownForPlainText(value: string) {
  return value
    .replace(/!\[[^\]]*]\([^)]*\)/g, "")
    .replace(/^#{1,4}\s*/gm, "")
    .replace(/\*\*/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function ArcigyCodexChatbot() {
  const [isOpen, setIsOpen] = useState(true);
  const [answerOpen, setAnswerOpen] = useState(true);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationState, setConversationState] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    logAction("PLUGIN_ASSETS_LOADED", getConfig().pluginVersion);
    logAction("ROOT_FOUND", Boolean(document.querySelector("#arcigy-chatbot-root")));
    executePendingAction();
  }, []);

  useEffect(() => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading, answerOpen]);

  const sendMessage = useCallback(async (event: SubmitEvent) => {
    event.preventDefault();

    const text = (inputRef.current?.value || input).trim();
    if (!text || isLoading) return;

    const userMessage: Message = { id: createMessageId(), role: "user", text };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setAnswerOpen(true);
    setInput("");
    if (inputRef.current) inputRef.current.value = "";
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
          messages: nextMessages.map((message) => ({
            role: message.role,
            content: message.text,
          })),
          conversationState,
          currentUrl: window.location.href,
        }),
      });

      const data = (await response.json()) as ChatResponse;
      if (!response.ok) throw new Error(data.message || "Chat request failed.");

      if (data.conversationState) setConversationState(data.conversationState);

      const assistantText = sanitizeMarkdownForPlainText(data.answer || data.message || "Nemam pripravenu odpoved.");
      const action = data.action || data.actions?.[0] || null;
      const images = Array.isArray(data.images) ? data.images.filter((image) => Boolean(image.url)) : [];

      setMessages((current) => [
        ...current,
        {
          id: createMessageId(),
          role: "assistant",
          text: assistantText,
          action,
          images,
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: createMessageId(),
          role: "assistant",
          text: "Spojenie s lokalnym backendom zlyhalo. Skontrolujte, ci bezi Next server na 127.0.0.1:3000.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [conversationState, input, isLoading, messages]);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    const handler = (event: SubmitEvent) => {
      void sendMessage(event);
    };

    form.addEventListener("submit", handler);
    return () => form.removeEventListener("submit", handler);
  }, [sendMessage]);

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  if (!isOpen) {
    return (
      <section className="arcigy-codex is-collapsed" aria-label="Arcigy Codex chatbot">
        <button className="arcigy-codex__mini" type="button" onClick={() => setIsOpen(true)} aria-label="Otvorit chat">
          <svg aria-hidden="true" viewBox="0 0 32 32">
            <path d="M16 7v3" />
            <path d="M12.5 7h7" />
            <rect x="8.5" y="11" width="15" height="13" rx="5" />
            <path d="M8.5 17H6.2" />
            <path d="M25.8 17h-2.3" />
            <path d="M13 18h.1" />
            <path d="M19 18h.1" />
            <path d="M13.5 22h5" />
          </svg>
        </button>
      </section>
    );
  }

  return (
    <section className="arcigy-codex is-open" aria-label="Arcigy Codex chatbot">
      {(messages.length > 0 || isLoading) && answerOpen ? (
        <div className="arcigy-codex__answer">
          <button className="arcigy-codex__answerTop" type="button" onClick={() => setAnswerOpen(false)}>
            <span>GEOTHERM AI</span>
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          <div className="arcigy-codex__messages" ref={messagesRef}>
            {messages.map((message) => (
              <article className={`arcigy-codex__message is-${message.role}`} key={message.id}>
                <p>{message.text}</p>
                {message.images?.length ? (
                  <div className="arcigy-codex__images">
                    {message.images.map((image) => (
                      <a
                        className="arcigy-codex__imageLink"
                        href={image.url}
                        key={image.id || image.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={image.url} alt={image.alt || image.description || "Geotherm obrazok"} />
                      </a>
                    ))}
                  </div>
                ) : null}
                {message.action ? (
                  <button type="button" onClick={() => executeAction(message.action!)}>
                    {message.action.label || "Ukazat na stranke"}
                  </button>
                ) : null}
              </article>
            ))}
            {isLoading ? <div className="arcigy-codex__typing">Pripravujem odpoved...</div> : null}
          </div>
        </div>
      ) : null}

      {!answerOpen && messages.length > 0 ? (
        <button className="arcigy-codex__context" type="button" onClick={() => setAnswerOpen(true)}>
          <span>Najnovsia odpoved</span>
          <span aria-hidden="true">›</span>
        </button>
      ) : null}

      <form className="arcigy-codex__composer" ref={formRef}>
        <button className="arcigy-codex__close" type="button" onClick={() => setIsOpen(false)} aria-label="Zavriet chat">
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="m9 6 6 6-6 6" />
          </svg>
        </button>
        <textarea
          ref={inputRef}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder="Napiste spravu..."
        />
        <button className="arcigy-codex__send" type="submit" disabled={isLoading} aria-label="Odoslat spravu">
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M12 19V5" />
            <path d="m6.5 10.5 5.5-5.5 5.5 5.5" />
          </svg>
        </button>
      </form>
    </section>
  );
}

const rootElement = document.querySelector("#arcigy-chatbot-root");

if (rootElement) {
  createRoot(rootElement).render(<ArcigyCodexChatbot />);
} else {
  logAction("ROOT_NOT_FOUND", "#arcigy-chatbot-root");
}
