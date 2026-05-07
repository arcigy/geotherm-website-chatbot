import { CSSProperties, KeyboardEvent, PointerEvent, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { EmbedAction, runAction, runPendingAction, validateSelector } from "./embed/actionExecutor";
import "./embed.css";

type EmbedConfig = {
  mode: "preview" | "local" | "production";
  apiBase: string;
  siteId: string;
  siteUrl: string;
  debug: boolean;
};

type Source = {
  pageTitle: string;
  url: string;
  sectionId: string;
  selector: string;
  heading: string;
};

type ChatResponse = {
  answer: string;
  sources: Source[];
  action: EmbedAction;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  response?: ChatResponse;
};

declare global {
  interface Window {
    ARCIGY_CHATBOT_CONFIG?: Partial<EmbedConfig>;
    arcigyChatbot?: {
      runAction: typeof runAction;
      version: string;
      config: EmbedConfig;
      test: {
        validateSelector: typeof validateSelector;
        runFakeAction: (name: string) => void;
      };
    };
  }
}

const version = "0.1.0";

const fakeResponses: Record<string, ChatResponse> = {
  nibe: createResponse(
    "### NIBE S2125\n\nNIBE S2125 je ukážkový produktový intent pre tepelné čerpadlá. V testovacom režime ťa viem presunúť na sekciu produktu.",
    "Produkty",
    "/produkty/",
    "nibe-s2125",
    "NIBE S2125",
  ),
  dotacie: createResponse(
    "### Dotácie\n\nDotácie závisia od aktuálneho programu a technického riešenia. V testovacom režime ťa presuniem na dotačnú sekciu.",
    "Produkty",
    "/produkty/",
    "dotacie",
    "Dotácie",
  ),
  montaz: createResponse(
    "### Montáž\n\nMontáž zahŕňa prípravu, osadenie technológie, zapojenie, spustenie a základné zaškolenie.",
    "Produkty",
    "/produkty/",
    "montaz",
    "Montáž",
  ),
  servis: createResponse(
    "### Servis\n\nServis rieši kontrolu systému, nastavenie prevádzky a technickú podporu po montáži.",
    "Produkty",
    "/produkty/",
    "servis",
    "Servis",
  ),
  hlucnost: createResponse(
    "### Hlučnosť\n\nHlučnosť závisí od konkrétneho zariadenia, umiestnenia a montáže. Dôležitý je správny návrh výkonu a pozície jednotky.",
    "FAQ",
    "/faq/",
    "faq-hlucnost",
    "Hlučnosť",
  ),
  cena: createResponse(
    "### Cena\n\nCena závisí od veľkosti domu, typu riešenia a rozsahu montáže. Presnú cenu by mal potvrdiť technik po základných vstupoch.",
    "FAQ",
    "/faq/",
    "faq-cena",
    "Cena",
  ),
  kontakt: createResponse(
    "### Kontakt\n\nKontakt je najlepší ďalší krok, keď už chceš riešiť konkrétny dom alebo cenový odhad.",
    "Kontakt",
    "/kontakt/",
    "kontakt-formular",
    "Kontaktný formulár",
  ),
  realizacie: createResponse(
    "### Realizácie\n\nRealizácie pomáhajú ukázať, ako vyzerá riešenie v praxi na konkrétnom dome.",
    "Realizácie",
    "/realizacie/",
    "realizacia-rodinny-dom",
    "Realizácia rodinný dom",
  ),
};

function createResponse(answer: string, pageTitle: string, url: string, sectionId: string, heading: string): ChatResponse {
  const selector = `#${sectionId}`;

  return {
    answer,
    sources: [{ pageTitle, url, sectionId, selector, heading }],
    action: {
      type: "navigate_and_highlight",
      url,
      selector,
      highlightText: heading,
    },
  };
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function getConfig(): EmbedConfig {
  const provided = window.ARCIGY_CHATBOT_CONFIG ?? {};

  return {
    mode: provided.mode ?? "preview",
    apiBase: provided.apiBase ?? "",
    siteId: provided.siteId ?? "local-test",
    siteUrl: provided.siteUrl ?? window.location.origin,
    debug: provided.debug ?? true,
  };
}

function createId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `arcigy-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function sanitizeMarkdown(value: string) {
  return value
    .replace(/!\[[^\]]*]\([^)]*\)/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function MarkdownMessage({ content }: { content: string }) {
  return <ReactMarkdown remarkPlugins={[remarkGfm]}>{sanitizeMarkdown(content)}</ReactMarkdown>;
}

function fakeLocalResponse(message: string): ChatResponse {
  const normalized = normalize(message);

  if (normalized.includes("nibe")) return fakeResponses.nibe;
  if (normalized.includes("dotac")) return fakeResponses.dotacie;
  if (normalized.includes("montaz")) return fakeResponses.montaz;
  if (normalized.includes("servis")) return fakeResponses.servis;
  if (normalized.includes("hlucnost") || normalized.includes("hluk")) return fakeResponses.hlucnost;
  if (normalized.includes("cena") || normalized.includes("kolko") || normalized.includes("stoji")) return fakeResponses.cena;
  if (normalized.includes("kontakt") || normalized.includes("zavol")) return fakeResponses.kontakt;
  if (normalized.includes("realizac")) return fakeResponses.realizacie;

  return createResponse(
    "### Testovací režim\n\nZatiaľ som v testovacom režime. Skús sa spýtať na **NIBE**, **dotácie**, **montáž**, **servis**, **cenu** alebo **kontakt**.",
    "Produkty",
    "/produkty/",
    "nibe-s2125",
    "NIBE S2125",
  );
}

async function sendMessage(message: string, config: EmbedConfig): Promise<ChatResponse> {
  if (config.apiBase && config.mode !== "preview") {
    try {
      const response = await fetch(`${config.apiBase.replace(/\/$/, "")}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          currentUrl: window.location.href,
          siteId: config.siteId,
        }),
      });

      if (!response.ok) throw new Error("Backend request failed.");
      return (await response.json()) as ChatResponse;
    } catch (error) {
      if (config.debug) console.warn("[ArcigyChatbot] Backend failed, using fake local response.", error);
    }
  }

  return fakeLocalResponse(message);
}

function Chatbot({ config }: { config: EmbedConfig }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimerRef = useRef<number | null>(null);

  const hasConversation = messages.length > 0;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading, isOpen]);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) window.clearInterval(typingTimerRef.current);
    };
  }, []);

  async function animateAssistantMessage(response: ChatResponse) {
    const id = createId();
    let index = 0;
    const content = sanitizeMarkdown(response.answer);

    setMessages((current) => [...current, { id, role: "assistant", content: "", response }]);

    return new Promise<void>((resolve) => {
      typingTimerRef.current = window.setInterval(() => {
        index += 4;
        const nextContent = content.slice(0, index);

        setMessages((current) =>
          current.map((message) => (message.id === id ? { ...message, content: nextContent, response } : message)),
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

  async function submitMessage() {
    const text = (textareaRef.current?.value || input).trim();
    if (!text || isLoading) return;

    if (typingTimerRef.current) window.clearInterval(typingTimerRef.current);

    setMessages((current) => [...current, { id: createId(), role: "user", content: text }]);
    setIsOpen(true);
    setIsCollapsed(false);
    setInput("");
    if (textareaRef.current) textareaRef.current.value = "";
    setIsLoading(true);

    try {
      const response = await sendMessage(text, config);
      setIsLoading(false);
      await animateAssistantMessage(response);
    } catch {
      setIsLoading(false);
      await animateAssistantMessage(
        createResponse("### Chyba\n\nNiečo sa pokazilo. Skús to prosím ešte raz.", "Produkty", "/produkty/", "nibe-s2125", "NIBE S2125"),
      );
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submitMessage();
    }
  }

  function onInputChange(value: string) {
    setInput(value);

    if (!textareaRef.current) return;

    textareaRef.current.style.height = "34px";
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 86)}px`;
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
    <div className="arcigy-chatbot arcigy-chatbot--codex" aria-label="Arcigy Codex chatbot">
      {!isCollapsed && ((hasConversation && isOpen) || isLoading) ? (
        <div className="arcigy-chatbot__answer" aria-label="GEOTHERM AI odpovede">
          <button className="arcigy-chatbot__answerTop" type="button" onClick={() => setIsOpen(false)}>
            <span>GEOTHERM AI</span>
            <span aria-hidden="true">⌄</span>
          </button>
          <div className="arcigy-chatbot__messages" ref={scrollRef}>
            {messages.map((message) => (
              <article className={`arcigy-chatbot__message is-${message.role}`} key={message.id}>
                {message.role === "assistant" ? (
                  <>
                    <MarkdownMessage content={message.content} />
                    {message.response?.action ? (
                      <div className="arcigy-chatbot__actions">
                        <button type="button" onClick={() => runAction(message.response!.action)}>
                          Ukázať na stránke
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
              <div className="arcigy-chatbot__thinking">
                <span>Pripravujem odpoveď</span>
                <i />
                <i />
                <i />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {!isCollapsed && (hasConversation || isLoading) ? (
        <button className="arcigy-chatbot__context" type="button" onClick={() => setIsOpen(true)}>
          <span>Najnovší príspevok</span>
          <span aria-hidden="true">›</span>
        </button>
      ) : null}

      <div
        className={`arcigy-chatbot__composer ${isCollapsed ? "is-collapsed" : ""} ${isDragging ? "is-dragging" : ""}`}
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
        <div className="arcigy-chatbot__composerContent">
          <form
            className="arcigy-chatbot__input"
            onSubmit={(event) => {
              event.preventDefault();
              void submitMessage();
            }}
          >
            <textarea
              ref={textareaRef}
              onChange={(event) => onInputChange(event.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              placeholder="Napíšte správu..."
            />
            <button className="arcigy-chatbot__mic" type="button" aria-label="Mikrofón">
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M12 4a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V7a3 3 0 0 0-3-3Z" />
                <path d="M5 11a7 7 0 0 0 14 0" />
                <path d="M12 18v3" />
                <path d="M9 21h6" />
              </svg>
            </button>
            <button className="arcigy-chatbot__send" type="submit" disabled={isLoading} aria-label="Odoslať správu">
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M12 19V5" />
                <path d="m6.5 10.5 5.5-5.5 5.5 5.5" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function mountWidget() {
  const config = getConfig();
  let root = document.querySelector<HTMLElement>("#arcigy-chatbot-root");

  if (!root) {
    root = document.createElement("div");
    root.id = "arcigy-chatbot-root";
    document.body.appendChild(root);
  }

  window.arcigyChatbot = {
    runAction,
    version,
    config,
    test: {
      validateSelector,
      runFakeAction(name: string) {
        runAction(fakeLocalResponse(name).action);
      },
    },
  };

  runPendingAction();
  createRoot(root).render(<Chatbot config={config} />);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountWidget, { once: true });
} else {
  mountWidget();
}
