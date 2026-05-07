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
  action?: EmbedAction;
};

type BackendChatResponse = Partial<ChatResponse> & {
  message?: string;
  actions?: EmbedAction[];
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
    "### NIBE S2125\n\nNIBE S2125 patrí medzi riešenia tepelných čerpadiel pre domy, kde sa rieši úsporné vykurovanie a príprava teplej vody. Pri výbere však nestačí pozerať iba na značku alebo model, ale hlavne na výkon, tepelné straty domu a spôsob odovzdávania tepla.\n\nAk chcete, viem vám ukázať produktovú sekciu nižšie. Staviate nový dom alebo rekonštruujete?",
    "Produkty",
    "/produkty/",
    "nibe-s2125",
    "NIBE S2125",
  ),
  dotacie: createResponse(
    "### Dotácie OZE\n\nDotácie vedia znížiť vstupnú investíciu, ale vždy závisia od aktuálnych pravidiel programu, typu zariadenia a pripravenosti projektu. Preto je bezpečnejšie najprv vybrať vhodné riešenie a až potom overiť, či sa naň dá použiť podpora.\n\nRiešite dotáciu skôr k tepelnému čerpadlu, fotovoltike alebo rekuperácii?",
    "Produkty",
    "/produkty/",
    "dotacie",
    "Dotácie",
  ),
  montaz: createResponse(
    "### Montáž systému\n\nMontáž pri takomto riešení nie je len osadenie zariadenia. Dôležitá je príprava, správne zapojenie technológie, spustenie systému a nastavenie tak, aby dom kúril úsporne a stabilne.\n\nMáte už vybraný konkrétny systém alebo ste ešte vo fáze návrhu?",
    "Produkty",
    "/produkty/",
    "montaz",
    "Montáž",
  ),
  servis: createResponse(
    "### Servis a nastavenie\n\nServis je dôležitý hlavne preto, aby systém nefungoval iba technicky správne, ale aj úsporne. Pri tepelných čerpadlách a rekuperácii často rozhoduje práve nastavenie prevádzky, nie iba samotné zariadenie.\n\nMáte už existujúce zariadenie, alebo servis riešite až k novej inštalácii?",
    "Produkty",
    "/produkty/",
    "servis",
    "Servis",
  ),
  hlucnost: createResponse(
    "### Hlučnosť tepelného čerpadla\n\nHlučnosť závisí od konkrétneho modelu, výkonu, umiestnenia vonkajšej jednotky a kvality montáže. Pri správnom návrhu sa dá riziko nepríjemného hluku výrazne znížiť, najmä ak sa jednotka neumiestni priamo k oddychovej zóne alebo k susedom.\n\nIde u vás o novostavbu alebo už existujúci dom?",
    "FAQ",
    "/faq/",
    "faq-hlucnost",
    "Hlučnosť",
  ),
  cena: createResponse(
    "### Cena závisí od domu\n\nPresnú cenu bez vstupov nechcem hádať. Najviac ju ovplyvní plocha domu, tepelné straty, typ systému, príprava rozvodov a rozsah montáže. Pri dobrom návrhu sa však nepozerá iba na najnižšiu cenu, ale aj na dlhodobé náklady.\n\nAká je približne plocha domu v m²?",
    "FAQ",
    "/faq/",
    "faq-cena",
    "Cena",
  ),
  kontakt: createResponse(
    "### Kontakt na odborný návrh\n\nKontakt dáva zmysel vtedy, keď už chcete riešiť konkrétny dom, cenu alebo vhodnú kombináciu technológií. Najlepšie je pripraviť si základné údaje: typ stavby, plochu domu, aktuálne kúrenie a prioritu.\n\nChcete skôr orientačne poradiť tu v chate, alebo už riešite konkrétnu ponuku?",
    "Kontakt",
    "/kontakt/",
    "kontakt-formular",
    "Kontaktný formulár",
  ),
  realizacie: createResponse(
    "### Realizácie\n\nRealizácie sú dobré na to, aby ste videli, ako podobné riešenia vyzerajú v praxi. Pri vykurovaní, chladení a vetraní je však dôležité porovnávať domy s podobnou veľkosťou, izoláciou a očakávaným komfortom.\n\nChcete pozrieť skôr realizácie tepelných čerpadiel alebo rekuperácie?",
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
    "### Pomôžem vám vybrať smer\n\nNajlepšie je začať od situácie domu, nie od konkrétneho produktu. GEOTHERM rieši hlavne tepelné čerpadlá, podlahové kúrenie, chladenie, rekuperáciu, fotovoltiku, servis a dotácie OZE.\n\nStaviate nový dom alebo rekonštruujete?",
    "Kontakt",
    "/kontakt/",
    "kontakt-formular",
    "Kontaktný formulár",
  );
}

function normalizeChatResponse(data: BackendChatResponse): ChatResponse {
  return {
    answer: data.answer ?? data.message ?? "### GEOTHERM odpoveď\n\nNemám pripravenú odpoveď.\n\nStaviate nový dom alebo rekonštruujete?",
    sources: data.sources ?? [],
    action: data.action ?? data.actions?.[0],
  };
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
      return normalizeChatResponse((await response.json()) as BackendChatResponse);
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
                        <button type="button" onClick={() => message.response?.action && runAction(message.response.action)}>
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
        const action = fakeLocalResponse(name).action;
        if (action) runAction(action);
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
