import { CSSProperties, KeyboardEvent, PointerEvent, useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./styles.css";

type ArcigyConfig = {
  restUrl: string;
  nonce: string;
  currentUrl: string;
  siteUrl: string;
  pluginVersion: string;
};

type ChatAction = {
  id?: string;
  type?: string;
  url?: string;
  selector?: string;
  anchorId?: string;
  highlightText?: string;
  label?: string;
};

type ChatImage = {
  id?: string;
  url: string;
  alt?: string;
  description?: string;
};

type ChatResponse = {
  answer?: string;
  message?: string;
  conversationState?: unknown;
  action?: ChatAction | null;
  actions?: ChatAction[];
  images?: ChatImage[];
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
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

function sanitizeMarkdown(value: string) {
  return value
    .replace(/!\[[^\]]*]\([^)]*\)/g, "")
    .replace(/^\s*\*?Obr[aá]z(?:ok|ky):.*$/gim, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function MarkdownMessage({ content }: { content: string }) {
  return <ReactMarkdown remarkPlugins={[remarkGfm]}>{sanitizeMarkdown(content)}</ReactMarkdown>;
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

function ArcigyCodexChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationState, setConversationState] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const typingTimerRef = useRef<number | null>(null);

  const hasConversation = messages.length > 0;

  useEffect(() => {
    logAction("PLUGIN_ASSETS_LOADED", getConfig().pluginVersion);
    logAction("ROOT_FOUND", Boolean(document.querySelector("#arcigy-chatbot-root")));
    executePendingAction();
  }, []);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) window.clearInterval(typingTimerRef.current);
    };
  }, []);

  useEffect(() => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading, isOpen]);

  async function animateAssistantMessage(content: string, action?: ChatAction | null, images?: ChatImage[]) {
    const id = createMessageId();
    let index = 0;
    const cleanContent = sanitizeMarkdown(content);

    setMessages((current) => [...current, { id, role: "assistant", content: "", action, images }]);

    return new Promise<void>((resolve) => {
      typingTimerRef.current = window.setInterval(() => {
        index += 4;
        const nextContent = cleanContent.slice(0, index);

        setMessages((current) =>
          current.map((message) => (message.id === id ? { ...message, content: nextContent, action, images } : message)),
        );

        if (index >= cleanContent.length) {
          if (typingTimerRef.current) {
            window.clearInterval(typingTimerRef.current);
            typingTimerRef.current = null;
          }
          resolve();
        }
      }, 12);
    });
  }

  const sendMessage = useCallback(async () => {
    const text = (inputRef.current?.value || input).trim();
    if (!text || isLoading) return;

    if (typingTimerRef.current) window.clearInterval(typingTimerRef.current);

    const userMessage: Message = { id: createMessageId(), role: "user", content: text };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setIsOpen(true);
    setIsCollapsed(false);
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
            content: message.content,
          })),
          conversationState,
          currentUrl: window.location.href,
        }),
      });

      const data = (await response.json()) as ChatResponse;
      if (!response.ok) throw new Error(data.message || "Chat request failed.");

      if (data.conversationState) setConversationState(data.conversationState);

      const action = data.action || data.actions?.[0] || null;
      const images = Array.isArray(data.images) ? data.images.filter((image) => Boolean(image.url)) : [];

      setIsLoading(false);
      await animateAssistantMessage(data.answer || data.message || "Nemám pripravenú odpoveď.", action, images);
    } catch {
      setIsLoading(false);
      await animateAssistantMessage(
        "Spojenie s lokálnym backendom zlyhalo. Skontrolujte, či beží Next server na 127.0.0.1:3000.",
      );
    }
  }, [conversationState, input, isLoading, messages]);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    const handler = (event: SubmitEvent) => {
      event.preventDefault();
      void sendMessage();
    };

    form.addEventListener("submit", handler);
    return () => form.removeEventListener("submit", handler);
  }, [sendMessage]);

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  }

  function onInputChange(value: string) {
    setInput(value);

    if (!inputRef.current) return;

    inputRef.current.style.height = "34px";
    inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 86)}px`;
  }

  function startCloseDrag(event: PointerEvent<HTMLElement>) {
    if (isCollapsed) return;

    const target = event.target as HTMLElement;
    if (target.closest("button:not(.codex-collapse-button), textarea, input")) return;

    const startX = event.clientX;
    let latestOffset = 0;
    setIsDragging(true);

    function onPointerMove(pointerEvent: globalThis.PointerEvent) {
      latestOffset = Math.max(0, Math.min(220, pointerEvent.clientX - startX));
      setDragOffset(latestOffset);
    }

    function onPointerUp() {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      setIsDragging(false);

      if (latestOffset > 110) {
        setDragOffset(0);
        setIsCollapsed(true);
        setIsOpen(false);
      } else {
        setDragOffset(0);
      }
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  }

  return (
    <>
      {!isCollapsed && ((hasConversation && isOpen) || isLoading) ? (
        <section className="perplexity-answer codex-glass-answer" aria-label="GEOTHERM AI odpovede">
          <button className="perplexity-answer-top" type="button" onClick={() => setIsOpen(false)}>
            <span>GEOTHERM AI</span>
            <span aria-hidden="true">⌄</span>
          </button>
          <div className="messages compact" ref={messagesRef}>
            {messages.map((message) => (
              <article className={`message ${message.role}`} key={message.id}>
                {message.role === "assistant" ? (
                  <>
                    <MarkdownMessage content={message.content} />
                    {message.images?.length ? (
                      <div className={`chat-api-images ${message.images.length > 1 ? "two-up" : ""}`}>
                        {message.images.map((image) => (
                          <figure key={image.id || image.url}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={image.url} alt={image.alt || image.description || "Geotherm obrázok"} />
                            <figcaption>{image.description || image.alt}</figcaption>
                          </figure>
                        ))}
                      </div>
                    ) : null}
                    {message.action ? (
                      <div className="chat-actions">
                        <button type="button" onClick={() => executeAction(message.action!)}>
                          {message.action.label || "Ukázať na stránke"}
                        </button>
                      </div>
                    ) : null}
                  </>
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
        </section>
      ) : null}

      {!isCollapsed && (hasConversation || isLoading) ? (
        <button className="codex-context-popup" type="button" onClick={() => setIsOpen(true)}>
          <span>Najnovší príspevok</span>
          <span aria-hidden="true">›</span>
        </button>
      ) : null}

      <section
        className={`perplexity-composer codex-glass-composer ${isCollapsed ? "is-collapsed" : ""} ${
          isDragging ? "is-dragging" : ""
        }`}
        aria-label="GEOTHERM AI Codex asistent"
        onPointerDown={startCloseDrag}
        style={{ "--codex-drag-x": `${dragOffset}px` } as CSSProperties}
      >
        <button
          className="codex-collapse-button"
          type="button"
          aria-label="Zavrieť Codex chat"
          onClick={() => {
            setIsCollapsed(true);
            setIsOpen(false);
          }}
        >
          <span aria-hidden="true">›</span>
        </button>
        <button
          className="codex-mini-bubble"
          type="button"
          aria-label="Otvoriť GEOTHERM AI Codex chat"
          onClick={() => {
            setIsCollapsed(false);
            setIsOpen(true);
          }}
        >
          <svg aria-hidden="true" viewBox="0 0 32 32" className="codex-robot-icon">
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
        <div className="codex-composer-content">
          <form className="chat-input perplexity" ref={formRef}>
            <textarea
              ref={inputRef}
              onChange={(event) => onInputChange(event.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              placeholder="Napíšte správu..."
            />
            <button className="chat-mic-button" type="button" aria-label="Mikrofón">
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M12 4a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V7a3 3 0 0 0-3-3Z" />
                <path d="M5 11a7 7 0 0 0 14 0" />
                <path d="M12 18v3" />
                <path d="M9 21h6" />
              </svg>
            </button>
            <button type="submit" disabled={isLoading} aria-label="Odoslať správu">
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M12 19V5" />
                <path d="m6.5 10.5 5.5-5.5 5.5 5.5" />
              </svg>
            </button>
          </form>
        </div>
      </section>
    </>
  );
}

const rootElement = document.querySelector("#arcigy-chatbot-root");

if (rootElement) {
  createRoot(rootElement).render(<ArcigyCodexChatbot />);
} else {
  logAction("ROOT_NOT_FOUND", "#arcigy-chatbot-root");
}
