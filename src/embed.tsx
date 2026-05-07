import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
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
  text: string;
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
    "NIBE S2125 je ukážkový produktový intent pre tepelné čerpadlá. V testovacom režime ťa viem presunúť na sekciu produktu.",
    "Produkty",
    "/produkty/",
    "nibe-s2125",
    "NIBE S2125",
  ),
  dotacie: createResponse(
    "Dotácie závisia od aktuálneho programu a technického riešenia. V testovacom režime ťa presuniem na dotačnú sekciu.",
    "Produkty",
    "/produkty/",
    "dotacie",
    "Dotácie",
  ),
  montaz: createResponse(
    "Montáž zahŕňa prípravu, osadenie technológie, zapojenie, spustenie a základné zaškolenie.",
    "Produkty",
    "/produkty/",
    "montaz",
    "Montáž",
  ),
  servis: createResponse(
    "Servis rieši kontrolu systému, nastavenie prevádzky a technickú podporu po montáži.",
    "Produkty",
    "/produkty/",
    "servis",
    "Servis",
  ),
  hlucnost: createResponse(
    "Hlučnosť závisí od konkrétneho zariadenia, umiestnenia a montáže. Dôležitý je správny návrh výkonu a pozície jednotky.",
    "FAQ",
    "/faq/",
    "faq-hlucnost",
    "Hlučnosť",
  ),
  cena: createResponse(
    "Cena závisí od veľkosti domu, typu riešenia a rozsahu montáže. Presnú cenu by mal potvrdiť technik po základných vstupoch.",
    "FAQ",
    "/faq/",
    "faq-cena",
    "Cena",
  ),
  kontakt: createResponse(
    "Kontakt je najlepší ďalší krok, keď už chceš riešiť konkrétny dom alebo cenový odhad.",
    "Kontakt",
    "/kontakt/",
    "kontakt-formular",
    "Kontaktný formulár",
  ),
  realizacie: createResponse(
    "Realizácie pomáhajú ukázať, ako vyzerá riešenie v praxi na konkrétnom dome.",
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
    sources: [
      {
        pageTitle,
        url,
        sectionId,
        selector,
        heading,
      },
    ],
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
    "Zatiaľ som v testovacom režime. Skús sa spýtať na NIBE, dotácie, montáž, servis, cenu alebo kontakt.",
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
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  async function submitMessage() {
    const text = (textareaRef.current?.value || input).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = { id: createId(), role: "user", text };
    setMessages((current) => [...current, userMessage]);
    setInput("");
    if (textareaRef.current) textareaRef.current.value = "";
    setIsLoading(true);

    try {
      const response = await sendMessage(text, config);
      setMessages((current) => [
        ...current,
        {
          id: createId(),
          role: "assistant",
          text: response.answer,
          response,
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: createId(),
          role: "assistant",
          text: "Niečo sa pokazilo. Skús to prosím ešte raz.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitMessage();
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submitMessage();
    }
  }

  if (!isOpen) {
    return (
      <section className="arcigy-chatbot" aria-label="Arcigy chatbot">
        <button className="arcigy-chatbot__launcher" type="button" onClick={() => setIsOpen(true)} aria-label="Otvoriť chat">
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
    <section className="arcigy-chatbot" aria-label="Arcigy chatbot">
      <aside className="arcigy-chatbot__panel">
        <header className="arcigy-chatbot__header">
          <div className="arcigy-chatbot__brand">
            <span className="arcigy-chatbot__mark">AI</span>
            <div>
              <strong>Arcigy Chatbot</strong>
              <span>{config.mode === "preview" ? "Preview režim" : "Online režim"}</span>
            </div>
          </div>
          <button className="arcigy-chatbot__close" type="button" onClick={() => setIsOpen(false)} aria-label="Zavrieť chat">
            ×
          </button>
        </header>

        <div className="arcigy-chatbot__messages" ref={scrollRef}>
          {!messages.length ? (
            <div className="arcigy-chatbot__empty">
              Skús otázku: NIBE, dotácie, montáž, servis, hlučnosť, cena, kontakt alebo realizácie.
            </div>
          ) : null}

          {messages.map((message) => (
            <article className={`arcigy-chatbot__message is-${message.role}`} key={message.id}>
              <p>{message.text}</p>
              {message.response?.sources?.[0] ? (
                <div className="arcigy-chatbot__source">
                  Zdroj: {message.response.sources[0].pageTitle} · {message.response.sources[0].heading}
                </div>
              ) : null}
              {message.response?.action ? (
                <button className="arcigy-chatbot__action" type="button" onClick={() => runAction(message.response!.action)}>
                  Ukázať na stránke
                </button>
              ) : null}
            </article>
          ))}

          {isLoading ? (
            <div className="arcigy-chatbot__loading">
              <span>Pripravujem odpoveď</span>
              <i />
              <i />
              <i />
            </div>
          ) : null}
        </div>

        <form className="arcigy-chatbot__form" onSubmit={onSubmit}>
          <textarea
            ref={textareaRef}
            rows={1}
            placeholder="Napíšte správu..."
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={onKeyDown}
          />
          <button className="arcigy-chatbot__send" type="submit" disabled={isLoading} aria-label="Odoslať správu">
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M12 19V5" />
              <path d="m6.5 10.5 5.5-5.5 5.5 5.5" />
            </svg>
          </button>
        </form>
      </aside>
    </section>
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
