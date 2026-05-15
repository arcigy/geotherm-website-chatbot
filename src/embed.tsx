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
  sectionId?: string;
  selector?: string;
  heading?: string;
  sectionHeading?: string;
  snippet?: string;
};

type ChatResponse = {
  answer: string;
  sources: Source[];
  action?: EmbedAction;
  conversationId?: string;
  confidence?: "high" | "medium" | "low";
  intent?: string;
  topScore?: number;
  leadCapture?: {
    shouldAsk: boolean;
    nextQuestion: string | null;
  };
  lead?: {
    captured: boolean;
    score: number;
  };
  fallbackUsed?: boolean;
  debug?: unknown;
};

type BackendChatResponse = Partial<ChatResponse> & {
  message?: string;
  actions?: EmbedAction[];
  action?: EmbedAction | null;
  confidence?: "high" | "medium" | "low";
  topScore?: number;
  intent?: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  response?: ChatResponse;
};

type DebugTurn = {
  timestamp: string;
  requestStartedAt: string;
  responseReceivedAt: string;
  responseTimeMs: number;
  responseTimeSeconds: number;
  userMessage: string;
  assistantAnswer: string;
  confidence: ChatResponse["confidence"] | null;
  intent: string | null;
  topScore: number | null;
  sources: Source[];
  leadCapture: ChatResponse["leadCapture"] | null;
  lead: ChatResponse["lead"] | null;
  debug: unknown | null;
  fallbackUsed: boolean;
};

type DebugTranscript = {
  exportedAt: string;
  version: string;
  config: Pick<EmbedConfig, "mode" | "apiBase" | "siteId" | "siteUrl" | "debug">;
  turns: DebugTurn[];
};

type StoredConversation = {
  version: string;
  updatedAt: number;
  messages: ChatMessage[];
  debugTurns: DebugTurn[];
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    ARCIGY_CHATBOT_CONFIG?: Partial<EmbedConfig>;
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
    webkitAudioContext?: typeof AudioContext;
    arcigyChatbot?: {
      runAction: typeof runAction;
      version: string;
      config: EmbedConfig;
      exportDebugTranscript: (options?: { download?: boolean; copy?: boolean }) => DebugTranscript;
      test: {
        validateSelector: typeof validateSelector;
        runFakeAction: (name: string) => void;
      };
    };
  }
}

const version = "0.1.0";
const conversationMemoryMs = 2 * 60 * 60 * 1000;
const anonymousIdStorageKey = "arcigy-chatbot-anonymous-id";
const voiceWaveBarCount = 64;

function idleVoiceLevels() {
  return Array.from({ length: voiceWaveBarCount }, (_, index) => 0.045 + ((index * 7) % 5) * 0.008);
}

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

function createTextResponse(answer: string): ChatResponse {
  return {
    answer,
    sources: [],
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

function ensureAnonymousId() {
  if (!window.localStorage.getItem(anonymousIdStorageKey)) {
    window.localStorage.setItem(anonymousIdStorageKey, createId());
  }
}

function conversationStorageKey(config: EmbedConfig) {
  return `arcigy-chatbot-conversation:${config.siteId}:${config.apiBase || config.siteUrl}`;
}

function parseStoredConversation(value: string | null): StoredConversation | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<StoredConversation>;
    if (!Array.isArray(parsed.messages) || !Array.isArray(parsed.debugTurns) || typeof parsed.updatedAt !== "number") return null;
    if (Date.now() - parsed.updatedAt > conversationMemoryMs) return null;
    return {
      version: typeof parsed.version === "string" ? parsed.version : version,
      updatedAt: parsed.updatedAt,
      messages: parsed.messages
        .filter((message): message is ChatMessage => {
          return (
            Boolean(message) &&
            (message.role === "user" || message.role === "assistant") &&
            typeof message.id === "string" &&
            typeof message.content === "string"
          );
        })
        .map((message) => ({
          ...message,
          content: message.role === "assistant" ? cleanAssistantContent(message.content) : message.content,
          response: message.response
            ? {
                ...message.response,
                answer: cleanAssistantContent(message.response.answer),
              }
            : message.response,
        })),
      debugTurns: parsed.debugTurns.map((turn) => ({
        ...turn,
        assistantAnswer: typeof turn.assistantAnswer === "string" ? cleanAssistantContent(turn.assistantAnswer) : turn.assistantAnswer,
      })),
    };
  } catch {
    return null;
  }
}

function sanitizeMarkdown(value: string) {
  return value
    .replace(/!\[[^\]]*]\([^)]*\)/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cleanAssistantContent(value: string) {
  const renderStructured = (object: Record<string, unknown>): string | null => {
    const structured =
      object.structuredAnswer && typeof object.structuredAnswer === "object"
        ? (object.structuredAnswer as Record<string, unknown>)
        : object;
    const shortAnswer = typeof structured.shortAnswer === "string" ? structured.shortAnswer.trim() : "";
    const details = Array.isArray(structured.details)
      ? structured.details.filter((item): item is string => typeof item === "string" && item.trim().length > 0).slice(0, 4)
      : [];
    const followUp = typeof structured.followUpQuestion === "string" ? structured.followUpQuestion.trim() : "";
    if (!shortAnswer && !details.length && !followUp) return null;
    return [
      shortAnswer ? `### Stručne k otázke\n\n${shortAnswer}` : "### Stručne k otázke",
      details.length ? details.map((item) => `- ${item.trim()}`).join("\n") : "",
      followUp,
    ]
      .filter(Boolean)
      .join("\n\n");
  };

  let content = value.trim();
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      const parsed = JSON.parse(content.slice(start, end + 1)) as unknown;
      if (typeof parsed === "string") content = parsed;
      if (parsed && typeof parsed === "object") {
        const object = parsed as Record<string, unknown>;
        const direct = ["answer", "message", "content", "assistantAnswer"].find((key) => typeof object[key] === "string");
        content = direct ? (object[direct] as string) : renderStructured(object) || content;
      }
    } catch {
      // Keep original content and still decode escaped text.
    }
  }
  return content
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, " ")
    .replace(/\\"/g, '"')
    .replace(/\n?\s*["'}\]]+\s*$/g, "")
    .trim();
}

function isFallbackAnswer(answer: string, confidence?: ChatResponse["confidence"]) {
  const normalized = normalize(answer);
  return confidence === "low" || normalized.includes("nenasiel dostatocne jasnu odpoved") || normalized.includes("nemozem") || normalized.includes("neviem");
}

function downloadJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function copyJson(payload: unknown) {
  const text = JSON.stringify(payload, null, 2);
  if (navigator.clipboard?.writeText) {
    void navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
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

  return createTextResponse(
    "### Pomôžem vám vybrať smer\n\nNajlepšie je začať od situácie domu, nie od konkrétneho produktu. GEOTHERM rieši hlavne tepelné čerpadlá, podlahové kúrenie, chladenie, rekuperáciu, fotovoltiku, servis a dotácie OZE.\n\nStaviate nový dom alebo rekonštruujete?",
  );
}

function normalizeChatResponse(data: BackendChatResponse): ChatResponse {
  const answer = cleanAssistantContent(data.answer ?? data.message ?? "### GEOTHERM odpoveď\n\nNemám pripravenú odpoveď.\n\nStaviate nový dom alebo rekonštruujete?");
  return {
    answer,
    sources: data.sources ?? [],
    action: data.action ?? data.actions?.[0],
    conversationId: typeof data.conversationId === "string" ? data.conversationId : undefined,
    confidence: data.confidence,
    intent: typeof data.intent === "string" ? data.intent : undefined,
    topScore: typeof data.topScore === "number" ? data.topScore : undefined,
    leadCapture: data.leadCapture,
    lead: data.lead,
    debug: data.debug,
    fallbackUsed:
      data.fallbackUsed ??
      (Boolean((data.debug as { llmError?: string | null } | undefined)?.llmError) || isFallbackAnswer(answer, data.confidence)),
  };
}

async function sendMessage(message: string, config: EmbedConfig): Promise<ChatResponse> {
  if (config.apiBase) {
    try {
      const response = await fetch(`${config.apiBase.replace(/\/$/, "")}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          currentUrl: window.location.href,
          siteId: config.siteId,
          anonymousId: window.localStorage.getItem(anonymousIdStorageKey) || undefined,
          metadata: {
            userAgent: window.navigator.userAgent,
            referrer: document.referrer,
          },
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
  const [debugTurns, setDebugTurns] = useState<DebugTurn[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceLevels, setVoiceLevels] = useState<number[]>(() => idleVoiceLevels());
  const [debugCopyLabel, setDebugCopyLabel] = useState("Copy JSON");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimerRef = useRef<number | null>(null);
  const debugTurnsRef = useRef<DebugTurn[]>([]);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const waveFrameRef = useRef<number | null>(null);
  const syntheticWaveTimerRef = useRef<number | null>(null);
  const audioNoiseFloorRef = useRef(0.018);
  const audioSmoothedLevelRef = useRef(0.05);
  const speechBaseTextRef = useRef("");
  const skipNextStorageWriteRef = useRef(false);
  const storageKey = conversationStorageKey(config);

  const hasConversation = messages.length > 0;

  useEffect(() => {
    debugTurnsRef.current = debugTurns;
  }, [debugTurns]);

  useEffect(() => {
    ensureAnonymousId();
  }, []);

  useEffect(() => {
    const rawStored = window.localStorage.getItem(storageKey);
    const stored = parseStoredConversation(rawStored);
    if (!stored) {
      if (rawStored) {
        window.localStorage.removeItem(storageKey);
        window.localStorage.removeItem(anonymousIdStorageKey);
        ensureAnonymousId();
      }
      return;
    }
    skipNextStorageWriteRef.current = true;
    setMessages(stored.messages.slice(-40));
    setDebugTurns(stored.debugTurns.slice(-40));
    setIsOpen(false);
  }, [storageKey]);

  useEffect(() => {
    if (!messages.length && !debugTurns.length) return;
    if (skipNextStorageWriteRef.current) {
      skipNextStorageWriteRef.current = false;
      return;
    }
    const stored: StoredConversation = {
      version,
      updatedAt: Date.now(),
      messages: messages.slice(-40),
      debugTurns: debugTurns.slice(-40),
    };
    window.localStorage.setItem(storageKey, JSON.stringify(stored));
  }, [messages, debugTurns, storageKey]);

  useEffect(() => {
    window.arcigyChatbot = {
      ...(window.arcigyChatbot || {
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
      }),
      config,
      exportDebugTranscript(options?: { download?: boolean; copy?: boolean }) {
        const transcript: DebugTranscript = {
          exportedAt: new Date().toISOString(),
          version,
          config: {
            mode: config.mode,
            apiBase: config.apiBase,
            siteId: config.siteId,
            siteUrl: config.siteUrl,
            debug: config.debug,
          },
          turns: debugTurnsRef.current,
        };
        if (options?.download !== false) {
          downloadJson(`arcigy-chat-debug-${new Date().toISOString().replace(/[:.]/g, "-")}.json`, transcript);
        }
        if (options?.copy) copyJson(transcript);
        if (config.debug) console.log("[ArcigyChatbot] Debug transcript", transcript);
        return transcript;
      },
    };
  }, [config]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading, isOpen]);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) window.clearInterval(typingTimerRef.current);
      recognitionRef.current?.stop();
      stopVoiceMonitor();
    };
  }, []);

  function stopVoiceMonitor() {
    if (waveFrameRef.current) {
      window.cancelAnimationFrame(waveFrameRef.current);
      waveFrameRef.current = null;
    }
    if (syntheticWaveTimerRef.current) {
      window.clearInterval(syntheticWaveTimerRef.current);
      syntheticWaveTimerRef.current = null;
    }
    audioStreamRef.current?.getTracks().forEach((track) => track.stop());
    audioStreamRef.current = null;
    void audioContextRef.current?.close().catch(() => undefined);
    audioContextRef.current = null;
    audioNoiseFloorRef.current = 0.018;
    audioSmoothedLevelRef.current = 0.05;
    setVoiceLevels(idleVoiceLevels());
  }

  function resetTextareaHeight() {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "34px";
  }

  function startSyntheticVoiceWave() {
    const levels = idleVoiceLevels();
    syntheticWaveTimerRef.current = window.setInterval(() => {
      levels.shift();
      levels.push(0.045 + Math.random() * 0.05);
      setVoiceLevels([...levels]);
    }, 74);
  }

  async function startVoiceMonitor() {
    stopVoiceMonitor();
    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
    if (!window.navigator.mediaDevices?.getUserMedia || !AudioContextConstructor) {
      startSyntheticVoiceWave();
      return;
    }

    try {
      const stream = await window.navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContextConstructor();
      if (audioContext.state === "suspended") await audioContext.resume();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      const levels = idleVoiceLevels();

      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.58;
      const data = new Uint8Array(analyser.fftSize);
      source.connect(analyser);
      audioContextRef.current = audioContext;
      audioStreamRef.current = stream;

      const draw = () => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        let peak = 0;
        let min = 255;
        let max = 0;
        for (const sample of data) {
          min = Math.min(min, sample);
          max = Math.max(max, sample);
          const value = (sample - 128) / 128;
          peak = Math.max(peak, Math.abs(value));
          sum += value * value;
        }
        const rms = Math.sqrt(sum / data.length);
        const hasInvalidFrame = min === 0 && max === 0;
        let targetLevel = 0.045;

        if (!hasInvalidFrame) {
          const noiseFloor = audioNoiseFloorRef.current;
          if (rms < noiseFloor * 1.4) {
            audioNoiseFloorRef.current = noiseFloor * 0.96 + rms * 0.04;
          } else if (rms < noiseFloor) {
            audioNoiseFloorRef.current = noiseFloor * 0.9 + rms * 0.1;
          }

          const signal = Math.max(0, rms - audioNoiseFloorRef.current * 1.35);
          const normalized = Math.min(1, signal / 0.085);
          const peakBoost = signal > 0 ? Math.min(0.22, peak * 0.12) : 0;
          targetLevel = Math.max(0.045, Math.min(1, Math.pow(normalized, 0.68) + peakBoost));
        }

        audioSmoothedLevelRef.current = audioSmoothedLevelRef.current * 0.62 + targetLevel * 0.38;
        const level = audioSmoothedLevelRef.current;
        levels.shift();
        levels.push(level);
        setVoiceLevels([...levels]);
        waveFrameRef.current = window.requestAnimationFrame(draw);
      };

      draw();
    } catch (error) {
      if (config.debug) console.warn("[ArcigyChatbot] Microphone audio monitor failed, using visual fallback.", error);
      startSyntheticVoiceWave();
    }
  }

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
    if (isListening) {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      setIsListening(false);
      stopVoiceMonitor();
    }

    setMessages((current) => [...current, { id: createId(), role: "user", content: text }]);
    setIsOpen(true);
    setIsCollapsed(false);
    setInput("");
    if (textareaRef.current) textareaRef.current.value = "";
    resetTextareaHeight();
    setIsLoading(true);

    try {
      const requestStartedAt = new Date();
      const requestStartedAtMs = performance.now();
      const response = await sendMessage(text, config);
      const responseReceivedAt = new Date();
      const responseTimeMs = Math.round(performance.now() - requestStartedAtMs);
      const debugTurn: DebugTurn = {
        timestamp: responseReceivedAt.toISOString(),
        requestStartedAt: requestStartedAt.toISOString(),
        responseReceivedAt: responseReceivedAt.toISOString(),
        responseTimeMs,
        responseTimeSeconds: Number((responseTimeMs / 1000).toFixed(2)),
        userMessage: text,
        assistantAnswer: response.answer,
        confidence: response.confidence ?? null,
        intent: response.intent ?? null,
        topScore: response.topScore ?? null,
        sources: response.sources ?? [],
        leadCapture: response.leadCapture ?? null,
        lead: response.lead ?? null,
        debug: response.debug ?? null,
        fallbackUsed: response.fallbackUsed ?? isFallbackAnswer(response.answer, response.confidence),
      };
      setDebugTurns((current) => [...current, debugTurn]);
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
    resetTextareaHeight();
  }

  function setTextareaValue(value: string) {
    setInput(value);
    if (!textareaRef.current) return;
    textareaRef.current.value = value;
    resetTextareaHeight();
    textareaRef.current.focus();
  }

  function toggleMicrophone() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      stopVoiceMonitor();
      return;
    }

    if (!SpeechRecognition) {
      if (config.debug) console.warn("[ArcigyChatbot] Speech recognition is not available in this browser.");
      setIsListening(true);
      void startVoiceMonitor();
      textareaRef.current?.focus();
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = "sk-SK";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result?.[0]?.transcript || "")
        .join(" ")
        .trim();
      if (!transcript) return;
      const current = speechBaseTextRef.current;
      setTextareaValue(current ? `${current} ${transcript}` : transcript);
    };
    recognition.onerror = () => {
      if (config.debug) console.warn("[ArcigyChatbot] Speech recognition ended with an error.");
    };
    recognition.onend = () => {
      recognitionRef.current = null;
    };

    try {
      setIsListening(true);
      speechBaseTextRef.current = (textareaRef.current?.value || input).trim();
      void startVoiceMonitor();
      recognition.start();
    } catch (error) {
      if (config.debug) console.warn("[ArcigyChatbot] Speech recognition could not start.", error);
      recognitionRef.current = null;
      setIsListening(true);
      void startVoiceMonitor();
      textareaRef.current?.focus();
    }
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

  const showAnswerShell = !isCollapsed && (hasConversation || isLoading);
  const isAnswerVisible = showAnswerShell && (isOpen || isLoading);

  return (
    <div className="arcigy-chatbot arcigy-chatbot--codex" aria-label="Arcigy Codex chatbot">
      {showAnswerShell ? (
        <div className={`arcigy-chatbot__answer ${isAnswerVisible ? "is-open" : "is-closed"}`} aria-label="Najnovší príspevok">
          <button className="arcigy-chatbot__answerTop" type="button" onClick={() => !isLoading && setIsOpen((current) => !current)}>
            <span>Najnovší príspevok</span>
            <span aria-hidden="true">{isAnswerVisible ? "v" : "›"}</span>
          </button>
          {config.debug ? (
            <button
              className="arcigy-chatbot__debugExport"
              type="button"
              onClick={() => {
                window.arcigyChatbot?.exportDebugTranscript({ download: false, copy: true });
                setDebugCopyLabel("Copied");
                window.setTimeout(() => setDebugCopyLabel("Copy JSON"), 1200);
              }}
            >
              {debugCopyLabel}
            </button>
          ) : null}
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
                <span>Rozmýšľam...</span>
              </div>
            ) : null}
          </div>
        </div>
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
            className={`arcigy-chatbot__input ${isListening ? "is-listening" : ""}`}
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
            <div className="arcigy-chatbot__voiceWave" aria-hidden={!isListening}>
              {voiceLevels.map((level, index) => (
                <span
                  className="arcigy-chatbot__voiceBar"
                  key={index}
                  style={{ "--voice-level": level.toFixed(3) } as CSSProperties}
                />
              ))}
            </div>
            <button
              className={`arcigy-chatbot__mic ${isListening ? "is-listening" : ""}`}
              type="button"
              aria-label="Mikrofón"
              aria-pressed={isListening}
              onClick={toggleMicrophone}
              disabled={isLoading}
            >
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
    exportDebugTranscript(options?: { download?: boolean; copy?: boolean }) {
      const transcript: DebugTranscript = {
        exportedAt: new Date().toISOString(),
        version,
        config: {
          mode: config.mode,
          apiBase: config.apiBase,
          siteId: config.siteId,
          siteUrl: config.siteUrl,
          debug: config.debug,
        },
        turns: [],
      };
      if (options?.download) downloadJson(`arcigy-chat-debug-${new Date().toISOString().replace(/[:.]/g, "-")}.json`, transcript);
      if (options?.copy) copyJson(transcript);
      return transcript;
    },
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
