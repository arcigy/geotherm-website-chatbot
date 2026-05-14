import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { type KnowledgeChunk, retrieveKnowledge, tokenize, type RetrievalResult } from "./local-retrieval";
import { loadLocalEnv } from "./env";
import {
  callLlmText,
  composeWithLlm,
  describeLeadWithLlm,
  planRetrievalWithLlm,
  type AnswerMode,
  type LlmComposeResult,
  type RetrievalRouteDecision,
  type StructuredAnswer,
} from "./openai-llm";
import {
  getConversationMessages,
  getOrCreateActiveConversation,
  getSiteByPublicId,
  initDb,
  insertEvent,
  insertMessage,
  insertRetrievalEvent,
  updateConversation,
  upsertLead,
  upsertSession,
} from "./local-db";
import {
  detectIntent,
  extractContact,
  applyLeadDecision,
  leadScore,
  nextLeadQuestion,
  updateQualificationState,
  type LeadDecision,
  type QualificationState,
  type SalesIntent,
} from "./sales-system";

type ChatRequest = {
  message?: string;
  currentUrl?: string;
  siteId?: string;
  anonymousId?: string;
  metadata?: {
    userAgent?: string;
    referrer?: string;
  };
};

type ChatSource = {
  pageTitle: string;
  url: string;
  sectionHeading: string;
  snippet: string;
};

export type ChatResponse = {
  conversationId: string;
  answer: string;
  intent: SalesIntent;
  confidence: "high" | "medium" | "low";
  topScore: number;
  sources: ChatSource[];
  leadCapture: {
    shouldAsk: boolean;
    nextQuestion: string | null;
  };
  lead: {
    captured: boolean;
    score: number;
  };
  debug?: {
    answerMode?: AnswerMode;
    structuredAnswer?: StructuredAnswer;
    llmAttempted?: boolean;
    llmUsed?: boolean;
    llmProvider?: string;
    llmModel?: string;
    llmError?: string | null;
    llmRouterUsed?: boolean;
    llmRouterError?: string | null;
    retrievalQuery?: string;
    contextTopic?: string | null;
    contextCarried?: boolean;
  };
  fallbackUsed?: boolean;
  action: null;
  responseTimeMs?: number;
};

type StartOptions = {
  port?: number;
  host?: string;
  knowledgePath?: string;
};

type AnswerPolicy = {
  kind: "normal" | "ambiguous" | "adversarial" | "sensitive" | "out_of_scope";
  followUp?: string;
  sensitiveKind?: "roi" | "savings" | "subsidy" | "diy" | "price" | "best";
};

const defaultKnowledgePath = path.join(process.cwd(), "knowledge", "chatbot-knowledge.json");
const localOriginPattern = /^https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i;
const safetyFollowUp = "Ide o poruchu existujúceho zariadenia alebo plánujete novú montáž?";

let knowledgeCache: KnowledgeChunk[] | null = null;

async function loadKnowledge(knowledgePath = defaultKnowledgePath): Promise<KnowledgeChunk[]> {
  if (!knowledgeCache) {
    knowledgeCache = JSON.parse(await readFile(knowledgePath, "utf8")) as KnowledgeChunk[];
  }
  return knowledgeCache;
}

function corsHeaders(origin: string | undefined): Record<string, string> {
  const isProduction = process.env.NODE_ENV === "production";
  const configuredOrigins = (process.env.ARCIGY_ALLOWED_ORIGINS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const allowedInProduction = origin ? configuredOrigins.includes(origin) : false;
  const allowedInLocal = !isProduction && (!origin || origin === "null" || localOriginPattern.test(origin));
  const allowedOrigin = allowedInProduction || allowedInLocal ? origin || "*" : "";

  return {
    ...(allowedOrigin ? { "Access-Control-Allow-Origin": allowedOrigin } : {}),
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function writeJson(response: ServerResponse, statusCode: number, body: unknown, origin?: string): void {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    ...corsHeaders(origin),
  });
  response.end(`${JSON.stringify(body, null, 2)}\n`);
}

function writeError(response: ServerResponse, statusCode: number, code: string, message: string, origin?: string): void {
  writeJson(response, statusCode, { error: { code, message } }, origin);
}

function isPreviewEnabled(): boolean {
  return process.env.ARCIGY_PREVIEW_ENABLED !== "false";
}

function previewHtml(): string {
  return `<!doctype html>
<html lang="sk">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Geotherm Chatbot Preview</title>
    <link rel="stylesheet" href="/embed/chatbot.css" />
    <style>
      body {
        margin: 0;
        background: #f5f5f2;
        color: #1f2420;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      main {
        width: min(960px, calc(100vw - 32px));
        margin: 0 auto;
        padding: 56px 0 140px;
      }

      section {
        min-height: 260px;
        margin: 0 0 24px;
        border: 1px solid rgba(31, 36, 32, 0.1);
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.86);
        box-shadow: 0 20px 54px rgba(31, 36, 32, 0.08);
        padding: 30px;
      }

      h1 {
        margin: 0 0 14px;
        font-size: clamp(34px, 5vw, 62px);
        line-height: 0.98;
      }

      h2 {
        margin: 0 0 10px;
        font-size: 28px;
      }

      p {
        max-width: 720px;
        color: #59605a;
        font-size: 18px;
        line-height: 1.55;
      }

      code {
        border-radius: 6px;
        background: rgba(31, 36, 32, 0.08);
        padding: 2px 6px;
      }
    </style>
    <script>
      window.ARCIGY_CHATBOT_CONFIG = {
        mode: "production",
        apiBase: window.location.origin,
        siteId: "geotherm",
        siteUrl: window.location.origin,
        debug: true
      };
    </script>
  </head>
  <body>
    <main>
      <section>
        <h1>Geotherm chatbot preview</h1>
        <p>Toto je dočasná verejná preview stránka pre testovanie embeddable widgetu mimo lokálneho prostredia.</p>
        <p>Chatbot používa <code>/embed/chatbot.js</code>, <code>/embed/chatbot.css</code> a volá rovnaké <code>/chat</code> API na tejto doméne.</p>
      </section>
      <section><h2>Testovacie otázky</h2><p>Skús napríklad: aké čerpadlá predávate, čo vieš o NIBE S2125, aké výhody má stropné chladenie, koľko stojí tepelné čerpadlo, robíte servis?</p></section>
      <section><h2>WordPress simulácia</h2><p>Táto stránka iba simuluje cudziu webstránku. Widget sa vkladá ako externý embed a nemá byť závislý od lokálneho vývojového servera.</p></section>
    </main>
    <div id="arcigy-chatbot-root"></div>
    <script src="/embed/chatbot.js"></script>
  </body>
</html>`;
}

function writePreviewPage(response: ServerResponse): void {
  response.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(previewHtml());
}

async function writeEmbedAsset(requestUrl: string, response: ServerResponse): Promise<boolean> {
  const assets: Record<string, { fileName: string; contentType: string }> = {
    "/embed/chatbot.js": { fileName: "chatbot.js", contentType: "application/javascript; charset=utf-8" },
    "/embed/chatbot.css": { fileName: "chatbot.css", contentType: "text/css; charset=utf-8" },
  };
  const asset = assets[requestUrl];
  if (!asset) return false;

  try {
    const content = await readFile(path.join(process.cwd(), "dist-embed", asset.fileName));
    response.writeHead(200, {
      "Content-Type": asset.contentType,
      "Cache-Control": "public, max-age=300",
    });
    response.end(content);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Embed asset not found.");
  }
  return true;
}

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let total = 0;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.length;
    if (total > 64 * 1024) throw new Error("Request body is too large.");
    chunks.push(buffer);
  }

  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return {};
  return JSON.parse(raw) as unknown;
}

function confidenceFromResult(result: RetrievalResult | undefined): "high" | "medium" | "low" {
  if (!result) return "low";
  if (result.confidence === "confident") return "high";
  if (result.confidence === "uncertain") return "medium";
  return "low";
}

function sourceFromResult(result: RetrievalResult): ChatSource {
  return {
    pageTitle: result.chunk.pageTitle,
    url: result.chunk.url,
    sectionHeading: result.chunk.sectionHeading,
    snippet: result.snippet,
  };
}

function parseState(value: string): QualificationState {
  try {
    return JSON.parse(value) as QualificationState;
  } catch {
    return {};
  }
}

function generatedAnonymousId(): string {
  return `server_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

function normalizePolicyText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\bchlsdenie\b/g, "chladenie")
    .replace(/\bchladnie\b/g, "chladenie")
    .replace(/\bklima\b/g, "klimatizacia")
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

type SafetyRoute = {
  triggered: boolean;
  reason: string;
  intent: SalesIntent;
  answer: string;
  followUp: string | null;
};

const urgentServicePhone = "+421 987 654 321";

function safetyAnswer(reason: string): string {
  const base = [
    "### Toto rieš radšej telefonicky",
    "",
    "Toto vyzerá ako technický alebo bezpečnostný problém, pri ktorom by som ťa nenavádzal na svojpomocný zásah.",
    "",
    `**Najlepšie teraz:** nič nerozoberať, nemanipulovať so zariadením a zavolať technikovi na **${urgentServicePhone}**.`,
  ].join("\n");
  if (reason === "subsidy_guarantee") {
    return ["### Dotáciu nejde garantovať dopredu", "", "Dotáciu sa nedá sľúbiť bez kontroly podmienok programu, oprávnenosti žiadateľa, dostupného rozpočtu a správnosti žiadosti.", "", `Ak to chceš overiť konkrétne, zavolaj na **${urgentServicePhone}**.`].join("\n");
  }
  if (reason === "return_or_savings_guarantee") {
    return ["### Úsporu ani návratnosť by som negarantoval", "", "Presná úspora závisí od domu, spotreby, nákladov, cien energií, technického riešenia a kvality návrhu.", "", `Ak chceš riešiť konkrétny prípad, zavolaj na **${urgentServicePhone}**.`].join("\n");
  }
  if (reason === "date_or_price_guarantee") {
    return ["### Presný termín ani cenu by som nesľuboval bez podkladov", "", "Závisí to od rozsahu prác, dostupnosti, technických podmienok a konkrétneho riešenia.", "", `Najrýchlejšie to vyriešiš telefonicky na **${urgentServicePhone}**.`].join("\n");
  }
  if (reason === "unsupported_guarantee") {
    return ["### Toto by som negarantoval bez posúdenia", "", "Pri tepelnom čerpadle záleží na návrhu, montáži, servise aj reálnych podmienkach domu.", "", `Ak potrebuješ rýchle stanovisko, zavolaj na **${urgentServicePhone}**.`].join("\n");
  }
  if (reason === "diy_install") {
    return ["### Svojpomocnú montáž by som neriskoval", "", "Tepelné čerpadlo potrebuje odborný návrh, odbornú montáž a servis. Pri elektrine, chladive, tlaku alebo zapojení by som to neriešil svojpomocne.", "", `**Najlepšie teraz:** zavolať technikovi na **${urgentServicePhone}**.`].join("\n");
  }
  return base;
}

function detectSafetyRoute(message: string): SafetyRoute {
  const text = normalizePolicyText(message);
  if (isPromptInjection(text)) return { triggered: false, reason: "", intent: "unknown", answer: "", followUp: null };
  const hasAny = (terms: string[]): boolean => terms.some((term) => text.includes(term));
  const hasFaultOrLeakSignal = (): boolean => {
    const padded = ` ${text} `;
    return (
      /\bporuch\w*\b/.test(text) ||
      /\bnefunguje\b/.test(text) ||
      /\balarm\w*\b/.test(text) ||
      /\bchyb\w*\b/.test(text) ||
      /\btecie\b/.test(text) ||
      /\bkvapka\w*\b/.test(text) ||
      padded.includes(" smrdi elektrika ") ||
      /\bunika\b(?:\s+\w+){0,2}\s+\b(voda|chladivo)\b/.test(text)
    );
  };
  const guarantee = hasAny(["garant", "zarucit", "zarucite", "urcite"]);
  const exact = hasAny(["presne", "presnu", "presny", "konkretnu", "kolko presne"]);
  const asksElectricConsumption = hasAny(["spotreb", "zere", "kolko elektriny", "uct", "naklad", "mesac", "plati"]);

  let reason: string | null = null;
  let intent: SalesIntent = "service";

  if (guarantee && hasAny(["dotac", "prispev"])) {
    reason = "subsidy_guarantee";
    intent = "subsidy";
  } else if ((guarantee || exact) && hasAny(["navratnost", "usetr", "uspora", "usetrit"])) {
    reason = "return_or_savings_guarantee";
    intent = "quote";
  } else if ((guarantee || exact) && hasAny(["termin", "cena", "cenu", "montaz"])) {
    reason = "date_or_price_guarantee";
    intent = hasAny(["termin", "montaz"]) ? "installation" : "quote";
  } else if (guarantee && hasAny(["nikdy", "nepokazi", "zaruka", "zaruku"])) {
    reason = "unsupported_guarantee";
  } else if (!asksElectricConsumption && hasAny(["elektrik", "prud", "skrat", "poistk", "istic", "zapojit", "zapojim", "zapojenie", "kabel"])) {
    reason = "electrical_or_wiring";
  } else if (hasAny(["tlak", "natlakovat", "pretlak"])) {
    reason = "pressure";
  } else if (hasAny(["chladivo", "freon", "unik chladiva", "unika chladivo"])) {
    reason = "refrigerant";
  } else if (hasAny(["rozobra", "rozobrat", "rozoberat", "otvorit jednotku", "vonkajsiu jednotku"])) {
    reason = "disassembly";
  } else if (hasAny(["svojpomoc", "namontovat sam", "montovat sam", "zapoji sam", "zapojiť sam", "sam zapojit", "necertifikovaneho montaznika"])) {
    reason = "diy_install";
    intent = "installation";
  } else if (
    hasFaultOrLeakSignal() &&
    !(text.includes("stropne chladenie") && (text.includes("kondenz") || text.includes("kvapka")))
  ) {
    reason = "fault_or_leak";
  } else if (hasAny(["servisny zasah", "servisny ukon", "technicke nastavenie", "ako nastavit", "ako nastavim", "obist povinnu kontrolu", "ignorovat servis"])) {
    reason = "service_intervention";
  }

  if (!reason) return { triggered: false, reason: "", intent: "unknown", answer: "", followUp: null };
  const followUp = null;
  return {
    triggered: true,
    reason,
    intent,
    answer: [safetyAnswer(reason), followUp ? "" : null, followUp].filter(Boolean).join("\n"),
    followUp,
  };
}

function meaningfulTokens(message: string): string[] {
  return tokenize(message).filter((token) => !["prosim", "mate", "chcem", "potrebujem"].includes(token));
}

function isVeryShortQuery(message: string): boolean {
  const tokens = meaningfulTokens(message);
  if (tokens.length >= 3) return false;
  const text = normalizePolicyText(message);
  const clearShortIntent = [
    "cennik",
    "dotac",
    "servis",
    "kontakt",
    "nibe",
    "vaillant",
    "monoblok",
    "split",
    "hluk",
    "huci",
    "rozpocet",
    "vybavujete",
    "robite",
    "kde vas",
    "ako vas",
  ].some((term) => text.includes(term));
  if (tokens.length >= 2 && clearShortIntent) return false;
  const singleEntity = /^(cena|servis|nibe|dotacia|dotacie|cerpadlo|tepelne cerpadlo|hluk|montaz|kontakt|vaillant|daikin|ariston|viessmann)\??$/.test(text);
  return tokens.length < 3 || singleEntity;
}

function ambiguityFollowUp(message: string, intent: SalesIntent): string {
  const text = normalizePolicyText(message);
  if (text.includes("cena") || text.includes("kolko") || text.includes("stoji") || text.includes("vyjde")) {
    return "Riešite skôr nové tepelné čerpadlo, montáž, servis existujúceho zariadenia alebo dotáciu?";
  }
  if (text.includes("servis")) return "Ide o pravidelnú údržbu, poruchu alebo kontrolu pred vykurovacou sezónou?";
  if (text.includes("dotac")) return "Ide o dotáciu na nové tepelné čerpadlo, obnovu domu alebo inú technológiu?";
  if (text.includes("hluk") || text.includes("huci")) return "Riešite hlučnosť konkrétneho modelu alebo umiestnenie vonkajšej jednotky pri dome?";
  if (text.includes("kontakt")) return "Chcete všeobecný kontakt alebo kontakt k cenovej ponuke, servisu či dotácii?";
  if (intent === "noise") return "Kde by bola vonkajšia jednotka umiestnená voči obytným miestnostiam alebo susedom?";
  return "Riešite nové tepelné čerpadlo, servis, dotácie, montáž alebo návrh vykurovania?";
}

function isPromptInjection(text: string): boolean {
  return [
    "ignore previous instructions",
    "disregard instructions",
    "system prompt",
    "reveal prompt",
    "developer mode",
    "act as",
    "pretend",
    "forget rules",
    "zabudni na pravidla",
    "bez zdrojov",
    "ignoruj pravidla",
    "ignoruj predchadzajuce",
    "ignoruj zdroje",
    "napis cokolvek",
    "vymysli",
    "tvar sa",
    "si technik",
    "odpovedz ako admin",
    "tajne interne",
    "interne informacie",
  ].some((term) => text.includes(term));
}

function isContradictoryPrompt(text: string): boolean {
  const pairs = [
    ["nechcem cenu", "kolko"],
    ["nechcem cenu", "stoji"],
    ["nemam dom", "pre dom"],
    ["nemam dom", "cerpadlo pre dom"],
    ["stare zariadenie", "kupit nove"],
    ["servis", "este nemam"],
    ["montaz", "neviem aky"],
    ["zajtra", "neviem aky"],
    ["ignoruj zdroje", "podla webu"],
    ["nechcem kontakt", "zavola"],
    ["bez elektriny", "cerpadlo"],
  ];
  return pairs.some(([a, b]) => text.includes(a) && text.includes(b));
}

function isStandaloneAmbiguous(text: string, message: string): boolean {
  if (isVeryShortQuery(message)) return true;
  const hasSpecificContext = [
    "rozpocet",
    "huci",
    "hucat",
    "hluk",
    "dotac",
    "servis",
    "cennik",
    "nibe",
    "vaillant",
    "monoblok",
    "split",
    "podorys",
    "stropne",
    "zere",
    "spotreb",
  ].some((term) => text.includes(term));
  if (hasSpecificContext && !text.includes("je to vhodne") && !text.includes("kolko to stoji") && !text.includes("ako dlho to trva")) {
    return false;
  }
  return [
    "co odporucate",
    "je to vhodne",
    "je to vhodne pre moj dom",
    "kolko to stoji",
    "kolko ma to bude stat",
    "kolko ma to vyjde",
    "ako dlho to trva",
    "oplati sa",
    "oplati sa to",
    "co s tym",
    "ano alebo nie",
  ].some((term) => text.includes(term));
}

function isSensitiveClaim(text: string): AnswerPolicy | null {
  if ((text.includes("presnu") || text.includes("presne") || text.includes("presny") || text.includes("daj mi")) && (text.includes("cenu") || text.includes("cena") || text.includes("cennik"))) {
    return { kind: "sensitive", sensitiveKind: "price", followUp: "Aby sa dala cena odhadnut zodpovedne, ide o novy system, rekonstrukciu alebo servis?" };
  }
  if (text.includes("garant") && text.includes("dotac")) return { kind: "sensitive", sensitiveKind: "subsidy" };
  if (text.includes("garant") && text.includes("navratnost")) return { kind: "sensitive", sensitiveKind: "roi" };
  if ((text.includes("kolko presne") || text.includes("presne")) && (text.includes("usetr") || text.includes("usetrit"))) {
    return { kind: "sensitive", sensitiveKind: "savings" };
  }
  if (text.includes("najlacnejsie") || text.includes("najlacnejsi") || text.includes("najlepsie") || text.includes("najlepsi") || text.includes("best") || text.includes("cheapest")) {
    return { kind: "sensitive", sensitiveKind: "best", followUp: "Je pre vas dolezitejsia cena, hlucnost, servisne zazemie alebo vhodnost pre konkretny dom?" };
  }
  if (text.includes("namontovat sam") || text.includes("montovat sam") || text.includes("svojpomocne") || text.includes("necertifikovaneho") || text.includes("diy install")) {
    return { kind: "sensitive", sensitiveKind: "diy" };
  }
  return null;
}

function applyConfidencePolicy(
  message: string,
  confidence: "high" | "medium" | "low",
  topScore: number,
  policy: AnswerPolicy,
): "high" | "medium" | "low" {
  if (policy.kind === "adversarial" || policy.kind === "out_of_scope") return "low";
  if (policy.kind === "sensitive" || policy.kind === "ambiguous") return confidence === "low" || topScore < 20 ? "low" : "medium";
  const text = normalizePolicyText(message);
  const noisyLanguage = [
    "heat",
    "pump",
    "noise",
    "contact",
    "sales",
    "service",
    "subsidy",
    "maintenance",
    "installation",
    "timeline",
    "recommend",
    "kolik",
    "kotel",
    "nechci",
    "pomuzete",
    "vytapeni",
    "topeni",
    "jak",
  ].some((term) => text.includes(term));
  if (noisyLanguage && confidence === "high") return "medium";
  if (isVeryShortQuery(message)) return topScore >= 85 ? "medium" : "low";
  return confidence;
}

function classifyAnswerPolicy(message: string, intent: SalesIntent): AnswerPolicy {
  const text = normalizePolicyText(message);
  if (isPromptInjection(text) || text.includes("co na webe nie je") || text.includes("nieco co na webe nie je")) return { kind: "adversarial" };
  if (
    text.includes("pocasie") ||
    text.includes("ake auto") ||
    text.includes("ktore auto") ||
    text.includes("investovat do etf") ||
    text.includes("pobocku v prahe") ||
    text.includes("pobocka v prahe") ||
    text.includes("etf") ||
    text.includes("nonstop") ||
    text.includes("interny rabat") ||
    text.includes("skladom vsetky") ||
    text.includes("kolko mate technikov") ||
    text.includes("ktory zakaznik") ||
    text.includes("presny termin")
  ) {
    return { kind: "out_of_scope" };
  }
  const sensitive = isSensitiveClaim(text);
  if (sensitive) return sensitive;
  if (isContradictoryPrompt(text)) return { kind: "ambiguous", followUp: "Vidím tam protichodné požiadavky. Čo je pre vás hlavný cieľ: cena, servis, dotácia, montáž alebo výber riešenia?" };
  if (isStandaloneAmbiguous(text, message)) return { kind: "ambiguous", followUp: ambiguityFollowUp(message, intent) };
  if (text === "co odporucate") {
    return { kind: "ambiguous", followUp: "RieĹˇite novĂ© tepelnĂ© ÄŤerpadlo, servis, dotĂˇcie alebo nĂˇvrh vykurovania?" };
  }
  if (text.includes("kolko ma to bude stat")) {
    return { kind: "ambiguous", followUp: "Cena zĂˇvisĂ­ od typu rieĹˇenia. Ide o tepelnĂ© ÄŤerpadlo, montĂˇĹľ, servis alebo podlahovĂ© kĂşrenie?" };
  }
  if (text.includes("je to vhodne pre moj dom")) {
    return { kind: "ambiguous", followUp: "Ide o novostavbu alebo rekonĹˇtrukciu a akĂ˝ zdroj vykurovania mĂˇte dnes?" };
  }
  if (text.includes("ako dlho to trva")) {
    return { kind: "ambiguous", followUp: "MyslĂ­te montĂˇĹľ, servis, vybavenie dotĂˇcie alebo prĂ­pravu cenovej ponuky?" };
  }
  if (text.includes("bude to hlucne") || (text.includes("hlucne") && !text.includes("nibe"))) {
    return { kind: "ambiguous", followUp: "Kde by bola vonkajĹˇia jednotka umiestnenĂˇ voÄŤi obytnĂ˝m miestnostiam a susedom?" };
  }
  if (intent === "irrelevant") return { kind: "out_of_scope" };
  return { kind: "normal" };
}

function cleanSnippet(value: string, allowContactDetails: boolean): string {
  let text = value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "")
    .replace(/(?:\+421\s*)?(?:0\s*)?\d{3}[\s.-]?\d{3}[\s.-]?\d{3}/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!allowContactDetails) {
    text = text
      .replace(/\b(?:e-mail|email|mailom|telefonicky|telefĂłn|telefon|tel\.?)\b/gi, "kontakt")
      .replace(/nevĂˇhajte nĂˇs kontaktovaĹĄ[^.]*\./gi, "")
      .replace(/mĂ´Ĺľete nĂˇs kontaktovaĹĄ[^.]*\./gi, "");
  }
  return text
    .replace(/ur\S*ite/gi, "podla kontextu")
    .replace(/\burcite\b/gi, "podla kontextu")
    .replace(/\bpresne\b/gi, "orientacne")
    .replace(/\bgarantujeme\b/gi, "uvadzame")
    .replace(/\bnajlacnejsie\b/gi, "cenovo citlive")
    .replace(/\bnajlepsie\b/gi, "vhodne")
    .replace(/\?/g, ".")
    .slice(0, 340)
    .trim();
}

function sourceBullets(results: RetrievalResult[], confidence: "high" | "medium" | "low", allowContactDetails: boolean): string[] {
  if (confidence === "low") return [];
  return results
    .slice(0, confidence === "high" ? 2 : 1)
    .map((result) => cleanSnippet(result.snippet || result.chunk.text, allowContactDetails))
    .filter(Boolean)
    .map((snippet) => `- ${snippet}`);
}

function evidenceText(results: RetrievalResult[]): string {
  return results
    .map((result) => `${result.chunk.pageTitle} ${result.chunk.sectionHeading} ${result.snippet} ${result.chunk.text.slice(0, 1200)}`)
    .join(" ");
}

function hasEvidence(results: RetrievalResult[], terms: string[]): boolean {
  const text = normalizePolicyText(evidenceText(results));
  return terms.some((term) => text.includes(normalizePolicyText(term)));
}

function evidenceBrands(results: RetrievalResult[]): string[] {
  const text = normalizePolicyText(evidenceText(results));
  return [
    ["NIBE", "nibe"],
    ["Vaillant", "vaillant"],
  ]
    .filter(([, token]) => text.includes(token))
    .map(([label]) => label);
}

function sourceReferences(results: RetrievalResult[], confidence: "high" | "medium" | "low"): string[] {
  if (confidence === "low") return [];
  const seen = new Set<string>();
  const selected = results.filter((result) => {
    const key = result.chunk.url;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const lines = selected.slice(0, confidence === "high" ? 2 : 1).map((result) => `- [${result.chunk.pageTitle.replace(/\?/g, "").trim()}](${result.chunk.url})`);
  return lines.length ? ["", "**K téme:**", ...lines] : [];
}

function answerModeFromPolicy(policy: AnswerPolicy, intent: SalesIntent, confidence: "high" | "medium" | "low"): AnswerMode {
  if (policy.kind === "sensitive") return "safety_fallback";
  if (policy.kind === "out_of_scope" || intent === "irrelevant") return "out_of_scope";
  if (intent === "contact") return "contact_intent";
  if (confidence === "low" || policy.kind === "ambiguous" || policy.kind === "adversarial") return "low_confidence";
  return "rag_answer";
}

function oneLine(value: string, maxLength: number): string {
  const cleaned = value
    .replace(/```[\s\S]*?```/g, "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/\|/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (cleaned.length <= maxLength) return cleaned;
  return (cleaned.slice(0, maxLength).replace(/\s+\S*$/, "").trim() || cleaned.slice(0, maxLength).trim()).replace(/[,:;.-]?$/, ".");
}

function statementText(value: string, maxLength: number): string {
  return oneLine(value, maxLength).replace(/\?/g, ".");
}

function enforceTykanie(value: string): string {
  return value
    .replace(/\bUvažujete\b/g, "Uvažuješ")
    .replace(/\buvažujete\b/g, "uvažuješ")
    .replace(/\bRiešite\b/g, "Riešiš")
    .replace(/\briešite\b/g, "riešiš")
    .replace(/\bMyslíte\b/g, "Myslíš")
    .replace(/\bmyslíte\b/g, "myslíš")
    .replace(/\bChcete\b/g, "Chceš")
    .replace(/\bchcete\b/g, "chceš")
    .replace(/\bMôžete\b/g, "Môžeš")
    .replace(/\bmôžete\b/g, "môžeš")
    .replace(/\bPotrebujete\b/g, "Potrebuješ")
    .replace(/\bpotrebujete\b/g, "potrebuješ")
    .replace(/\bZvážte\b/g, "Zváž")
    .replace(/\bzvážte\b/g, "zváž")
    .replace(/\bPreferujete\b/g, "Preferuješ")
    .replace(/\bpreferujete\b/g, "preferuješ")
    .replace(/\bVyberte\b/g, "Vyber")
    .replace(/\bvyberte\b/g, "vyber")
    .replace(/\bMáte\b/g, "Máš")
    .replace(/\bmáte\b/g, "máš")
    .replace(/\bVám\b/g, "ti")
    .replace(/\bvám\b/g, "ti")
    .replace(/\bVás\b/g, "ťa")
    .replace(/\bvás\b/g, "ťa")
    .replace(/\bVašimi\b/g, "tvojimi")
    .replace(/\bvašimi\b/g, "tvojimi")
    .replace(/\bVašich\b/g, "tvojich")
    .replace(/\bvašich\b/g, "tvojich")
    .replace(/\bVaše\b/g, "tvoje")
    .replace(/\bvaše\b/g, "tvoje")
    .replace(/\bVáš\b/g, "tvoj")
    .replace(/\bváš\b/g, "tvoj")
    .replace(/Váš/g, "tvoj")
    .replace(/váš/g, "tvoj")
    .replace(/Vaš/g, "tvoj")
    .replace(/vaš/g, "tvoj")
    .replace(/\burčite\b/gi, "vo veľa prípadoch")
    .replace(/\bpre ťa\b/g, "pre teba")
    .replace(/\bPre ťa\b/g, "Pre teba")
    .replace(/\baby ste\b/g, "aby si")
    .replace(/\bAby ste\b/g, "Aby si")
    .replace(/\baby si boli\b/g, "aby si bol/a")
    .replace(/\bAby si boli\b/g, "Aby si bol/a");
}

function firstFollowUp(value: string | null | undefined): string | null {
  if (!value) return null;
  const cleaned = oneLine(value, 180);
  const match = cleaned.match(/[^?]+\?/);
  const question = (match?.[0] || cleaned.replace(/\?/g, "").trim()).trim();
  if (!question) return null;
  return question.endsWith("?") ? question : `${question}?`;
}

function sourceLinks(sources: ChatSource[], mode: AnswerMode): string[] {
  if (!sources.length || mode === "out_of_scope" || mode === "safety_fallback" || mode === "low_confidence" || mode === "general_chat") return [];
  const seen = new Set<string>();
  return sources
    .filter((source) => {
      if (!source.url || seen.has(source.url)) return false;
      seen.add(source.url);
      return true;
    })
    .slice(0, 2)
    .map((source) => {
      const title = source.pageTitle
        .replace(/\?/g, "")
        .replace(/najlep(š|s)[íiaey]?\s+/gi, "")
        .trim();
      return `- [${title}](${source.url})`;
    });
}

function asksForContact(value: string): boolean {
  const text = normalizePolicyText(value);
  return (
    /(poslite|napiste|zanechajte|dajte|zadajte|staci|poprosim).*(email|mail|telefon|tel|kontakt|meno)/.test(text) ||
    /(email|telefon|tel).*(poslite|napiste|zanechajte|dajte|zadajte|staci)/.test(text)
  );
}

function containsForbiddenTechnicalInstruction(value: string): boolean {
  const text = normalizePolicyText(value);
  return [
    "zapojte",
    "zapojit elektriku",
    "otvorte jednotku",
    "rozoberte",
    "rozobrat",
    "nastavte tlak",
    "otocit ventil",
    "otocte ventil",
    "doplnt chladivo",
    "doplňte chladivo",
    "vypnite poistku a zapojte",
  ].some((term) => text.includes(normalizePolicyText(term)));
}

function safetyStructuredAnswer(): StructuredAnswer {
  return {
    shortAnswer: "Toto už je technický alebo bezpečnostný zásah, ktorý patrí technikovi.",
    details: ["Pri elektrine, tlaku, chladive, rozoberaní jednotky alebo poruche je bezpečnejšie riešiť to s odborným servisom."],
    followUpQuestion: safetyFollowUp,
    shouldAskFollowUp: true,
    safetyNote: "Neuvádzam postup opravy ani technické inštrukcie, aby nevzniklo bezpečnostné riziko.",
    confidence: "low",
  };
}

function structuredSafetyRouteAnswer(reason: string, followUp: string | null): StructuredAnswer {
  if (reason === "subsidy_guarantee") {
    return {
      shortAnswer: "Dotáciu nejde garantovať dopredu bez overenia konkrétnych podmienok.",
      details: ["Treba overiť program, oprávnenosť žiadateľa, dostupný rozpočet a správnosť žiadosti."],
      followUpQuestion: null,
      shouldAskFollowUp: false,
      safetyNote: "Neuvádzam garanciu dotácie ani istý nárok bez posúdenia.",
      confidence: "low",
    };
  }
  if (reason === "return_or_savings_guarantee") {
    return {
      shortAnswer: "Presnú úsporu ani návratnosť by som negarantoval bez výpočtu pre konkrétny dom.",
      details: ["Závisí od spotreby, nákladov, cien energií, technického riešenia, stavu domu, aktuálneho kúrenia a veľkosti investície."],
      followUpQuestion: "Aké kúrenie používate dnes?",
      shouldAskFollowUp: true,
      safetyNote: "Neuvádzam presné garancie úspory ani návratnosti.",
      confidence: "low",
    };
  }
  if (reason === "date_or_price_guarantee") {
    return {
      shortAnswer: "Presný termín ani cenu by som nesľuboval bez podkladov.",
      details: ["Treba poznať typ objektu, rozsah prác, dostupnosť technológie a technické podmienky."],
      followUpQuestion: "Ide o nové riešenie, montáž alebo úpravu existujúceho systému?",
      shouldAskFollowUp: true,
      safetyNote: "Neuvádzam presné ceny ani termíny bez posúdenia.",
      confidence: "low",
    };
  }
  if (reason === "diy_install") {
    return {
      shortAnswer: "Svojpomocnú montáž tepelného čerpadla by som neodporúčal.",
      details: ["Odborná montáž je dôležitá kvôli bezpečnosti, správnemu návrhu, zapojeniu a spoľahlivej prevádzke."],
      followUpQuestion: "Plánujete novú montáž alebo riešite výmenu existujúceho zariadenia?",
      shouldAskFollowUp: true,
      safetyNote: "Neuvádzam svojpomocné inštrukcie, lebo ide o odborný technický zásah.",
      confidence: "low",
    };
  }
  const base = safetyStructuredAnswer();
  return { ...base, followUpQuestion: followUp, shouldAskFollowUp: Boolean(followUp) };
}

function deterministicStructuredAnswer(
  message: string,
  results: RetrievalResult[],
  confidence: "high" | "medium" | "low",
  intent: SalesIntent,
  policy: AnswerPolicy,
  leadCapture: LeadDecision,
): StructuredAnswer {
  if (policy.kind === "adversarial") {
    return {
      shortAnswer: "Nebudem ignorovať zdroje ani vymýšľať nepodložené informácie.",
      details: ["Viem pomôcť s tepelnými čerpadlami, vykurovaním, chladením, servisom, dotáciami alebo montážou."],
      followUpQuestion: "S čím konkrétne k HVAC téme vám mám pomôcť?",
      shouldAskFollowUp: true,
      safetyNote: null,
      confidence: "low",
    };
  }
  if (policy.kind === "out_of_scope") {
    return {
      shortAnswer: "Na toto nemám dostatočne jasný podklad.",
      details: ["Najlepšie pomôžem s otázkami okolo tepelných čerpadiel, vykurovania, chladenia, servisu, dotácií alebo montáže."],
      followUpQuestion: null,
      shouldAskFollowUp: false,
      safetyNote: null,
      confidence: "low",
    };
  }
  if (policy.kind === "sensitive") {
    const bestDetail =
      policy.sensitiveKind === "best"
        ? "Pri porovnaní rozhoduje konkrétny model, hlučnosť, servisné zázemie, výkon a vhodnosť pre dom."
        : "Pri cene, dotácii, návratnosti, úspore alebo termíne záleží na podkladoch, podmienkach a technickom riešení.";
    return {
      shortAnswer: "Toto by som negarantoval bez posúdenia konkrétneho prípadu.",
      details: [bestDetail],
      followUpQuestion: policy.followUp || leadCapture.nextQuestion,
      shouldAskFollowUp: Boolean(policy.followUp || leadCapture.nextQuestion),
      safetyNote: "Bez zdrojov a posúdenia neuvádzam presné sumy, garancie ani technické sľuby.",
      confidence: "low",
    };
  }
  if (policy.kind === "ambiguous") {
    return {
      shortAnswer: "Bez kontextu by som to nechcel hádať.",
      details: ["Stačí doplniť, či riešite nové tepelné čerpadlo, servis, dotáciu, montáž, chladenie alebo návrh vykurovania."],
      followUpQuestion: policy.followUp || leadCapture.nextQuestion,
      shouldAskFollowUp: Boolean(policy.followUp || leadCapture.nextQuestion),
      safetyNote: null,
      confidence: confidence === "high" ? "medium" : confidence,
    };
  }
  const summary = statementText(topicLeadIn(message) || plainSummary(message, results, intent), 320);
  const details: string[] = [];
  if (intent === "quote") details.push("Cena závisí od typu objektu, tepelných strát, rozsahu montáže a zvoleného riešenia.");
  if (intent === "service") details.push("Servis a údržba pomáhajú držať zariadenie spoľahlivé a včas zachytiť problém.");
  if (intent === "subsidy") details.push("Dotácie závisia od programu, podmienok a konkrétneho projektu.");
  if (intent === "noise") details.push("Hlučnosť ovplyvňuje model, výkon, umiestnenie vonkajšej jednotky a kvalita montáže.");
  if (intent === "installation") details.push("Pri montáži je dôležitý návrh, správny výkon a odborné spustenie systému.");
  if (intent === "product") details.push("Výber riešenia má sedieť k domu, rozpočtu, hlučnosti, servisu a očakávanému komfortu.");
  return {
    shortAnswer: summary || "Na toto potrebujem trochu viac kontextu.",
    details: details.slice(0, 3),
    followUpQuestion: leadCapture.shouldAsk ? leadCapture.nextQuestion : null,
    shouldAskFollowUp: Boolean(leadCapture.shouldAsk && leadCapture.nextQuestion),
    safetyNote: confidence === "low" ? "Beriem to opatrne, lebo zhoda v podkladoch nie je dosť silná." : null,
    confidence,
  };
}

function enforceStructuredAnswer(answer: StructuredAnswer, sources: ChatSource[], mode: AnswerMode): StructuredAnswer {
  const combined = [answer.shortAnswer, ...answer.details, answer.followUpQuestion || "", answer.safetyNote || ""].join(" ");
  if (containsForbiddenTechnicalInstruction(combined)) return safetyStructuredAnswer();

  if (mode === "out_of_scope") {
    return {
      shortAnswer: "Na toto nemám dostatočne jasný podklad v obsahu webu.",
      details: ["Viem ti pomôcť hlavne s vykurovaním, chladením, tepelnými čerpadlami, servisom, montážou alebo dotáciami."],
      followUpQuestion: "Chceš riešiť vykurovanie, chladenie alebo tepelné čerpadlo?",
      shouldAskFollowUp: true,
      safetyNote: null,
      confidence: "low",
    };
  }

  if (mode === "general_chat") {
    const shortAnswer = statementText(enforceTykanie(answer.shortAnswer.replace(/\bHVAC\b/gi, "vykurovanie a chladenie")), 220);
    const details = answer.details
      .map((detail) => enforceTykanie(statementText(detail.replace(/\bHVAC\b/gi, "vykurovanie a chladenie"), 180)))
      .filter(Boolean)
      .slice(0, 2);
    const followUp = firstFollowUp(enforceTykanie((answer.followUpQuestion || "").replace(/\bHVAC\b/gi, "vykurovanie alebo chladenie")));
    return {
      shortAnswer: shortAnswer || "Toto je chat k témam okolo vykurovania, chladenia a tepelných čerpadiel.",
      details,
      followUpQuestion: followUp,
      shouldAskFollowUp: Boolean(answer.shouldAskFollowUp && followUp),
      safetyNote: null,
      confidence: answer.confidence,
    };
  }

  const confidence = !sources.length && mode === "rag_answer" ? "low" : answer.confidence;
  const followUpQuestion =
    mode === "lead_capture" || !asksForContact(answer.followUpQuestion || "") ? firstFollowUp(answer.followUpQuestion) : null;
  const details = answer.details
    .filter((detail) => mode === "lead_capture" || !asksForContact(detail))
    .map((detail) => enforceTykanie(statementText(detail, 220)))
    .filter(Boolean)
    .slice(0, confidence === "low" ? 1 : 4);

  if (confidence === "low" && mode === "rag_answer") {
    return {
      shortAnswer: "Na toto nemám dosť jasný podklad, aby som odpovedal sebavedomo.",
      details,
      followUpQuestion: followUpQuestion || "Myslíte skôr tepelné čerpadlo, servis, dotáciu, montáž alebo chladenie?",
      shouldAskFollowUp: true,
      safetyNote: answer.safetyNote ? statementText(answer.safetyNote, 220) : null,
      confidence: "low",
    };
  }

  return {
    shortAnswer: enforceTykanie(statementText(answer.shortAnswer, 340)),
    details,
    followUpQuestion: followUpQuestion ? enforceTykanie(followUpQuestion) : null,
    shouldAskFollowUp: Boolean(answer.shouldAskFollowUp && followUpQuestion),
    safetyNote: answer.safetyNote ? enforceTykanie(statementText(answer.safetyNote, 220)) : null,
    confidence,
  };
}

function augmentStructuredAnswer(answer: StructuredAnswer, context?: { message: string; intent: SalesIntent }): StructuredAnswer {
  if (!context) return answer;
  const text = normalizePolicyText(context.message);
  const details = [...answer.details];
  const add = (detail: string): void => {
    const key = normalizePolicyText(detail).slice(0, 40);
    if (!details.some((item) => normalizePolicyText(item).startsWith(key))) details.unshift(detail);
  };
  if (text.includes("rozpocet")) add("Rozpočet je dobrý filter, ale výsledná cena závisí od domu, montáže a zvoleného riešenia.");
  if (text.includes("huci") || text.includes("hucat") || text.includes("hluk")) add("Hlučnosť treba posúdiť podľa modelu, výkonu, umiestnenia jednotky a montáže.");
  if (text.includes("dotac") || text.includes("prispev")) {
    add("Pri dotácii alebo príspevku je dôležité overiť podmienok programu a konkrétnu oprávnenosť.");
  }
  if (text.includes("dotac") && text.includes("servis")) {
    add("Záleží hlavne na tom, či riešite nové riešenie s podporou alebo spoľahlivosť existujúceho zariadenia.");
  }
  if (text.includes("podorys") || text.includes("poradit") || text.includes("potrebujete vediet")) {
    add("Pri návrhu pomáha typ domu, pôdorys, plocha, aktuálne kúrenie a tepelné straty.");
  }
  if (text.includes("ake informacie") || text.includes("potrebujete") || text.includes("poradit")) {
    add("Odporúčam brať návrh orientačne, kým nie sú jasné základné podklady o dome a aktuálnom kúrení.");
  }
  if (text.includes("navrh") || text.includes("vykurovania")) add("Tepelné straty sú základ pre správny návrh výkonu a systému.");
  if (text.includes("instalac") || text.includes("montaz") || text.includes("trva")) add("Montáž závisí od rozsahu prác, pripravenosti objektu a technického riešenia.");
  if (text.includes("montaz") && text.includes("servis")) {
    add("Záleží hlavne na tom, či ešte len vyberáte nové riešenie alebo už máte zariadenie, ktoré treba skontrolovať.");
  }
  if (text.includes("navrh") && text.includes("novostav")) {
    add("Odporúčam brať návrh ako individuálnu vec, lebo pri novostavbe rozhodujú tepelné straty, projekt a spôsob vykurovania.");
  }
  if (text.includes("nibe")) add("Pri NIBE aj iných značkách je dôležitý správny výkon pre konkrétny dom.");
  if (text.includes("znack") || (text.includes("vaillant") && text.includes("nibe"))) add("Výber značky má zmysel riešiť spolu so servisom, výkonom, hlučnosťou a vhodnosťou pre dom.");
  if (text.includes("stropne") && text.includes("vyhod")) add("Výhoda stropného chladenia je tichý, plošný komfort bez výrazného prievanu.");
  if (text.includes("stropne") && (text.includes("cena") || text.includes("m2"))) add("Cenu stropného chladenia treba brať orientačne, lebo závisí od skladby systému a stavby.");
  if (text.includes("stropny") && text.includes("vykurovat")) add("Systém vie podľa návrhu pomôcť aj mimo chladiacej sezóny ako veľkoplošné vykurovanie.");
  if (context.intent === "contact" || text.includes("kontakt") || text.includes("najdem")) add("Kontakt a ďalší krok je najlepšie riešiť podľa toho, či ide o ponuku, servis, dotáciu alebo návrh.");
  return { ...answer, details: details.slice(0, 4) };
}

function renderStructuredAnswer(answer: StructuredAnswer, sources: ChatSource[], mode: AnswerMode, context?: { message: string; intent: SalesIntent }): string {
  const enforcedAnswer = enforceStructuredAnswer(answer, sources, mode);
  const safeAnswer = mode === "out_of_scope" ? enforcedAnswer : augmentStructuredAnswer(enforcedAnswer, context);
  const lines = [safeAnswer.shortAnswer || "Na toto potrebujem trochu viac kontextu."];
  if (safeAnswer.details.length) {
    lines.push("", ...safeAnswer.details.map((detail) => `- ${detail}`));
  }
  if (safeAnswer.safetyNote) {
    lines.push("", `**Pozor:** ${safeAnswer.safetyNote}`);
  }
  if (safeAnswer.shouldAskFollowUp && safeAnswer.followUpQuestion) {
    lines.push("", `_${safeAnswer.followUpQuestion}_`);
  }
  const links = sourceLinks(sources, mode);
  if (links.length) lines.push("", "**Zdroje:**", ...links);
  return lines.join("\n").slice(0, 1600).trim();
}

function deterministicLlmResult(answerMode: AnswerMode, answer: string, error: string): LlmComposeResult {
  return {
    used: false,
    provider: "gemini",
    model: "deterministic",
    answerMode,
    answer,
    error,
  };
}

function stateWithLastAskedQuestion(state: QualificationState, answer: StructuredAnswer): QualificationState {
  const next: QualificationState = { ...state };
  const question =
    answer.shouldAskFollowUp && typeof answer.followUpQuestion === "string" && answer.followUpQuestion.trim()
      ? answer.followUpQuestion.trim()
      : undefined;
  if (question) next.last_asked_question = question;
  else delete next.last_asked_question;
  return next;
}

function structuredAnswerForLeadCapture(answer: StructuredAnswer, leadCapture: { shouldAsk: boolean }): StructuredAnswer {
  if (leadCapture.shouldAsk) return answer;
  return { ...answer, shouldAskFollowUp: false, followUpQuestion: "" };
}

function softHandoffOfferQuestion(): string {
  return "Ak chceš, môžeme to posunúť technikovi/odborníkovi, aby sa pozrel na tvoj konkrétny prípad. Chceš, aby ťa niekto kontaktoval?";
}

function filterRetrievalResultsForAnswer(results: RetrievalResult[], message: string, intent: SalesIntent): RetrievalResult[] {
  const text = normalizePolicyText(message);
  const mentionsSubsidy = text.includes("dotac") || text.includes("prispev") || text.includes("poukaz") || text.includes("oze");
  const mentionsContact = intent === "contact" || text.includes("kontakt") || text.includes("telefon") || text.includes("email") || text.includes("adresa");
  const mentionsNewProject = text.includes("novy") || text.includes("novostav") || text.includes("projekt");
  const mentionsVacuum = text.includes("vysavac");
  const mentionsContest = text.includes("sutaz") || text.includes("lego");
  const filtered = results.filter((result) => {
    const sourceText = normalizePolicyText(
      `${result.chunk.pageTitle} ${result.chunk.sectionHeading} ${result.chunk.url} ${result.snippet}`,
    );
    if (!mentionsSubsidy && intent !== "subsidy" && (sourceText.includes("dotac") || sourceText.includes("zelena domacnostiam"))) return false;
    if (!mentionsContact && (sourceText.includes("gdpr") || sourceText.includes("cookies") || sourceText.includes("ochrana osobnych udajov"))) return false;
    if (!mentionsContact && (result.chunk.url.includes("/author/") || sourceText.includes("geotherm sk author"))) return false;
    if (sourceText.includes("dakujeme") || sourceText.includes("vyberove konanie") || sourceText.includes("obchodny zastupca")) return false;
    if (sourceText.includes("novy zavod") || sourceText.includes("postavi pri senici") || sourceText.includes("vyroba tepelnych cerpadiel")) return false;
    if (mentionsNewProject && sourceText.includes("elektrokot")) return false;
    if (!mentionsContest && (sourceText.includes("sutaz") || sourceText.includes("lego"))) return false;
    if (!mentionsVacuum && sourceText.includes("centralne vysavac")) return false;
    if (!text.includes("sport") && (sourceText.includes("simon") || sourceText.includes("sportovcovi"))) return false;
    if (!text.includes("inovato") && sourceText.includes("inovato")) return false;
    if (!text.includes("podcast") && sourceText.includes("podcast")) return false;
    return true;
  });
  return filtered.length ? filtered : results;
}

function hasSubsidyDrift(answer: string, message: string, intent: SalesIntent): boolean {
  if (intent === "subsidy") return false;
  const messageText = normalizePolicyText(message);
  if (messageText.includes("dotac") || messageText.includes("prispev") || messageText.includes("poukaz") || messageText.includes("oze")) return false;
  const answerText = normalizePolicyText(answer);
  return (
    answerText.includes("dotac") ||
    answerText.includes("prispev") ||
    answerText.includes("dotacie a prispevky sa riesia") ||
    answerText.includes("riesis dotaciu") ||
    answerText.includes("dotaciu k novemu") ||
    answerText.includes("zelena domacnostiam")
  );
}

function topicLeadIn(message: string): string | null {
  const text = normalizePolicyText(message);
  const mentionsNewProject =
    text.includes("novy projekt") ||
    text.includes("novostav") ||
    text.includes("aktualne doplnil novy") ||
    text.endsWith(" novy");
  const mentionsSubsidy = text.includes("dotac") || text.includes("prispev");
  const mentionsService = text.includes("servis") || text.includes("udrzb") || text.includes("prehliad");
  const mentionsInstallation = text.includes("montaz") || text.includes("instalac") || text.includes("nov") || text.includes("namont");
  const mentionsDesign = text.includes("navrh") || text.includes("novostav") || text.includes("projekt") || text.includes("podorys") || text.includes("poradit");
  const mentionsCosts = text.includes("naklad") || text.includes("kureni") || text.includes("vykurov") || text.includes("usetr") || text.includes("cena") || text.includes("cenov") || text.includes("ponuk") || text.includes("zerie") || text.includes("nezerie") || text.includes("kolko") || text.includes("stoji") || text.includes("vyjde");

  if (mentionsNewProject && (text.includes("tepelne cerpad") || text.includes("cerpadl") || text.includes("navrh"))) {
    return "Beriem to ako nový projekt. Pri výbere tepelného čerpadla by som najprv neriešil konkrétny model, ale typ domu, plochu, tepelné straty, podlahovku alebo radiátory, prípravu teplej vody a či chceš aj chladenie.";
  }
  if (mentionsSubsidy && mentionsService) {
    return "Dotácia rieši podporu a podmienky programu, servis rieši kontrolu a spoľahlivú prevádzku existujúceho zariadenia. Záleží teda na tom, či riešite nové riešenie s podporou alebo už existujúce zariadenie.";
  }
  if (mentionsInstallation && mentionsService) {
    return "Montáž je návrh a inštalácia nového riešenia. Servis je kontrola, nastavenie alebo údržba existujúceho zariadenia. Záleží hlavne na tom, či už zariadenie máte alebo ešte len vyberáte riešenie.";
  }
  if (mentionsSubsidy) {
    return "Pri dotácii alebo príspevku rozhodujú pravidlá programu, podmienok a konkrétny prípad. Najprv treba vedieť, aké riešenie chcete a či spĺňa podmienky podpory.";
  }
  if (mentionsInstallation) {
    return "Pri montáži rozhoduje pripravenosť domu, rozsah prác, zapojenie do existujúceho systému a odborné spustenie. Bez týchto detailov sa dá hovoriť len orientačne.";
  }
  if (mentionsDesign) {
    return "Pri návrhu vykurovania je dôležité poznať typ domu, tepelné straty, požadovaný systém, projekt alebo pôdorys a to, či ide o novostavbu alebo úpravu existujúceho riešenia. Bez týchto údajov je odporúčanie len orientačné.";
  }
  if (mentionsCosts || text.includes("rozpocet") || text.includes("cennik")) {
    return "Cena, cenník a rozpočet sa pri vykurovaní nedajú brať univerzálne. Závisia od domu, tepelných strát, zvoleného riešenia, montáže a prevádzky. Bez týchto údajov sa dá hovoriť len orientačne.";
  }
  return null;
}

function composeHardenedSensitiveAnswer(policy: AnswerPolicy, results: RetrievalResult[], confidence: "high" | "medium" | "low"): string {
  const evidence = sourceReferences(results, confidence);
  const followUp = policy.followUp ? ["", policy.followUp] : [];
  if (policy.sensitiveKind === "price") {
    return ["### Cena závisí od konkrétneho riešenia", "", "Konkrétnu sumu by som bez parametrov domu nebral zodpovedne.", "", "| Čo cenu mení | Prečo je to dôležité |", "|---|---|", "| Typ objektu | Iné riešenie potrebuje byt, rodinný dom a firemný priestor. |", "| Tepelné straty | Od nich závisí výkon aj typ technológie. |", "| Rozsah prác | Montáž, úpravy systému a zdroj tepla vedia cenu výrazne zmeniť. |", ...followUp, ...evidence].join("\n");
  }
  if (policy.sensitiveKind === "best") {
    return ["### Najlepší model neexistuje bez kontextu", "", "Jeden univerzálne najlepší model by som nevybral zodpovedne. Pri výbere rozhoduje model, výkon, hlučnosť, servis, priestor a rozpočet.", "", "**Prakticky:** najprv treba vedieť, čo má systém riešiť a aké má dom parametre.", ...followUp, ...evidence].join("\n");
  }
  if (policy.sensitiveKind === "savings") {
    return ["### Úspora sa dá len odhadovať podľa domu", "", "Presnú ročnú úsporu by som negarantoval bez výpočtu pre konkrétny dom.", "", "Záleží na spotrebe, nastavení systému, nákladoch, cenách energií a kvalite návrhu.", ...followUp, ...evidence].join("\n");
  }
  if (policy.sensitiveKind === "subsidy") {
    return ["### Dotáciu treba najprv overiť", "", "Dotáciu sa nedá garantovať dopredu.", "", "Záleží od pravidiel programu, oprávnenosti žiadateľa, dostupného rozpočtu a správnosti žiadosti.", ...followUp, ...evidence].join("\n");
  }
  if (policy.sensitiveKind === "diy") {
    return ["### Svojpomocne by som do toho nešiel", "", "Pri tepelnom čerpadle je dôležitý odborný návrh, odborná montáž a servis.", "", "Svojpomocnú montáž by som nebral ako bezpečnú voľbu bez odbornej kontroly.", ...followUp, ...evidence].join("\n");
  }
  return ["### Návratnosť bez výpočtu negarantujem", "", "Návratnosť by som negarantoval bez konkrétneho výpočtu.", "", "Dá sa riešiť len orientačne podľa konkrétneho domu, spotreby, cien energií, technického riešenia a kvality návrhu.", ...followUp, ...evidence].join("\n");
}

function plainSummary(message: string, results: RetrievalResult[], intent: SalesIntent): string {
  const text = normalizePolicyText(message);
  const brands = evidenceBrands(results);
  const interval = hasEvidence(results, ["raz za dva roky", "každé dva roky"]);
  const ceilingCoolingQuery =
    (text.includes("strop") && (text.includes("chladen") || text.includes("chladi"))) ||
    (text.includes("temperovanie betonoveho jadra") && text.includes("chladen"));

  if (ceilingCoolingQuery) {
    if (text.includes("nevyhod") || text.includes("minus") || text.includes("rizik") || text.includes("problem") || text.includes("pomal") || text.includes("pozor") || text.includes("drahs")) {
      return "Stropné chladenie je komfortné, ale nie je to riešenie bez limitov. Treba počítať s pomalším nábehom, vyššou obstarávacou cenou a hlavne s tým, že pri zlom návrhu a vyššej vlhkosti môže vzniknúť riziko kondenzácie.";
    }
    if (text.includes("klimatiz") || text.includes("klim") || text.includes("fuk") || text.includes("pruden") || text.includes("studen")) {
      if (text.includes("lacnejs") || text.includes("cena") || text.includes("cenov")) {
        return "Klimatizácia môže mať cenovú výhodu a vyjsť lacnejšie na začiatku, ale stropné chladenie je komfortnejšie riešenie: chladí plošne, bez studeného prievanu a bez výrazného prúdenia vzduchu.";
      }
      return "Rozdiel je hlavne v pocite. Klimatizácia ochladzuje prúdením vzduchu, kým stropné chladenie chladí plošne. V praxi to znamená menej prievanu, menšie teplotné rozdiely a menej vírenia prachu.";
    }
    if (text.includes("cena") || text.includes("cen") || text.includes("kolko") || text.includes("stoji") || text.includes("m2") || text.includes("zahrn")) {
      return "Cena stropného chladenia sa rieši podľa zvoleného systému: temperovanie betónového jadra, mokrý podomietkový systém alebo sadrokartónový systém. Ceny sú orientačné a nezahŕňa sa do nich zdroj chladu ani súvisiace stavebné práce.";
    }
    if (text.includes("typ") || text.includes("druh") || text.includes("system")) {
      return "Stropné chladenie sa dá riešiť viacerými spôsobmi: v betónovej platni alebo betónovom jadre, ako podomietkový systém, alebo v sadrokartónovom podhľade. Výber závisí hlavne od toho, či ide o novostavbu alebo rekonštrukciu.";
    }
    if (text.includes("rekon") || text.includes("sadrokarton") || text.includes("podhlad")) {
      return "Pri rekonštrukcii dáva najväčší zmysel podomietkový systém alebo chladenie v sadrokartónovom podhľade. Pri novostavbe je lepšie riešiť chladenie už v projekte, lebo sa dá navrhnúť čistejšie a efektívnejšie.";
    }
    if (text.includes("novostav") || text.includes("beton") || text.includes("temper")) {
      return "Pri novostavbe je dobré riešiť stropné chladenie už v projekte. Dá sa integrovať do betónovej platne alebo temperovania betónového jadra, ktoré funguje ako akumulácia chladu alebo tepla.";
    }
    if (text.includes("tepelne cerpadlo") || text.includes("cerpadlo") || text.includes("cerpadl")) {
      return "Stropné chladenie sa dobre kombinuje s tepelným čerpadlom. Výhoda je, že jeden systém vie riešiť chladenie, vykurovanie a pri správnom návrhu aj prípravu teplej vody.";
    }
    if (text.includes("nie je vhod") || text.includes("nevhod") || text.includes("vysok")) {
      return "Stropné chladenie nie je ideálne do každého priestoru. Pozor najmä na priestory so zvýšenou vlhkosťou, kde hrozí riziko kondenzácie, a na objekty s vysokými stropmi, kde nemusí byť efekt taký dobrý.";
    }
    if (text.includes("objekt") || text.includes("vhodne") || text.includes("vhodny")) {
      return "Stropné chladenie môže byť vhodné pre rodinné domy, byty, polyfunkčné objekty, administratívu aj obchodné priestory. Najviac dáva zmysel tam, kde chcete komfortné a nenápadné chladenie bez fúkania vzduchu.";
    }
    if (text.includes("omiet")) {
      return "Podomietkový systém používa rúrky prichytené pod stropom, ktoré sa následne skryjú do omietky. Výsledok je čistý, bez viditeľných jednotiek v miestnosti.";
    }
    if (text.includes("vlhk") || text.includes("kondenz") || text.includes("rosn") || text.includes("kvapka") || text.includes("odborn") || text.includes("navrhn")) {
      return "Pri stropnom chladení je kľúčové strážiť vlhkosť a rosný bod. Systém musí navrhnúť odborník a musí byť odborne navrhnutý tak, aby teplota chladiacej vody neklesla pod rosný bod a na strope nevznikala kondenzácia.";
    }
    if (text.includes("pasiv")) {
      return "Stropné chladenie vie pri vhodnom zdroji využiť aj pasívne chladenie, teda chladenie bez kompresorovej techniky. Práve preto môže mať nízke prevádzkové náklady.";
    }
    if (text.includes("vykurov") || text.includes("kuren")) {
      return "Stropný systém môže fungovať aj ako vykurovanie. Pri tepelnom čerpadle sa vie prepínať medzi chladením a vykurovaním podľa sezóny.";
    }
    return "Stropné chladenie je zaujímavé hlavne komfortom: je tiché a skryté, chladí rovnomerne veľkou plochou, nevytvára studený prievan, nevíri prach a pri dobrom návrhu môže mať nízke prevádzkové náklady.";
  }

  if (
    text.includes("novy projekt") ||
    text.includes("novostav") ||
    text.includes("aktualne doplnil novy") ||
    (text.includes("tepelne cerpadlo") && text.endsWith(" novy"))
  ) {
    return "Pri novom projekte je najlepšie vybrať tepelné čerpadlo spolu s celým systémom domu. Najprv treba vedieť, či pôjde o podlahové kúrenie, radiátory, prípravu teplej vody, chladenie a aké sú tepelné straty domu.";
  }

  if (text.includes("cop") || text.includes("vykurovaci faktor") || text.includes("scop")) {
    return "COP je jednoduchý ukazovateľ účinnosti: hovorí, koľko tepla vie tepelné čerpadlo dodať oproti spotrebovanej elektrine. Pri výbere však nestačí pozerať iba jedno číslo, lebo výkon závisí od teploty vonku, vykurovacej vody a konkrétneho domu.";
  }
  if (text.includes("zem voda") || text.includes("vzduch voda") || text.includes("pozemok")) {
    return "Zem-voda býva stabilnejšie a účinnejšie riešenie počas roka, ale potrebuje pozemok alebo vrt a býva náročnejšie na realizáciu. Vzduch-voda je jednoduchšie na montáž a často lacnejšie na začiatku, no viac závisí od vonkajšej teploty a umiestnenia jednotky.";
  }
  if (text.includes("fotovolta") || text.includes("panel") || text.includes("strech")) {
    return "Tepelné čerpadlo a fotovoltaika môžu dávať zmysel spolu, hlavne ak vie dom časť elektriny spotrebovať priamo. Netreba to však brať ako automatickú úsporu pre každého; rozhoduje spotreba domu, orientácia strechy, veľkosť systému a spôsob riadenia.";
  }
  if (text.includes("rekuper")) {
    return "Rekuperácia rieši výmenu vzduchu bez zbytočných tepelných strát. Pri novostavbe dáva zmysel riešiť ju spolu s vykurovaním a chladením, aby dom fungoval ako jeden systém.";
  }
  if (text.includes("klimatiz")) {
    return "Klimatizácia vie rýchlo chladiť jednotlivé miestnosti, ale centrálne riešenie sa pozerá viac na komfort celého domu, prevádzkové náklady a prepojenie s vykurovaním. Výber závisí od toho, či chcete len chladiť miestnosti, alebo riešiť celý systém v dome.";
  }
  if (text.includes("podlahov") && (text.includes("chladen") || text.includes("chladi") || text.includes("rosi") || text.includes("leto") || text.includes("prijem"))) {
    return "Chladenie cez podlahu vie pomôcť s letným komfortom, ale nie je to klimatizácia. Musí byť dobre regulované kvôli vlhkosti a rosnému bodu, aby sa podlaha nezačala rosiť.";
  }
  if (text.includes("radiator") || text.includes("podlahov") || text.includes("podlahu") || text.includes("podlaha")) {
    return "Tepelné čerpadlo sa dá riešiť aj pri radiátoroch, ale treba posúdiť teplotný spád, veľkosť radiátorov a tepelné straty domu. Podlahové kúrenie je pre čerpadlo prirodzenejšie, no kombinácia radiátorov a podlahovky nemusí byť automaticky problém.";
  }
  if (text.includes("elektrin") || text.includes("zere") || text.includes("spotreb") || text.includes("uct") || text.includes("naklad") || text.includes("uspor")) {
    return "Spotreba tepelného čerpadla sa nedá povedať jedným číslom. Závisí od tepelnej straty domu, typu čerpadla, nastavenej teploty vody, zateplenia a spôsobu používania. Preto je lepšie porovnať konkrétny dom a dnešné účty, nie všeobecné internetové čísla.";
  }
  if (text.includes("-15") || text.includes("minus") || text.includes("mraz") || text.includes("zime") || text.includes("nestih")) {
    return "Pri mrazoch je dôležitý správny návrh výkonu a nastavenie systému. Tepelné čerpadlo nemá byť vybrané len podľa katalógu; musí sedieť na tepelnú stratu domu a vykurovaciu sústavu.";
  }
  if (text.includes("zivotnost") || text.includes("kazit") || text.includes("spolahliv")) {
    return "Spoľahlivosť tepelného čerpadla nestojí len na značke. Rozhoduje správny návrh, kvalitná montáž, rozumné nastavenie, dostupný servis a to, aby zariadenie neštartovalo zbytočne často.";
  }
  if (text.includes("montaz") || text.includes("realizacia") || text.includes("instalacia") || text.includes("bez kurenia")) {
    return "Montáž tepelného čerpadla nie je len osadenie jednotky. Rieši sa zapojenie do vykurovacieho systému, spustenie, nastavenie a kontrola. Presné trvanie závisí od rozsahu prác a pripravenosti domu.";
  }
  if (text.includes("technick") || text.includes("pracka") || text.includes("priestor") || text.includes("vnutorna jednotka")) {
    return "Pri vnútornej jednotke treba rátať nielen s miestom na zariadenie, ale aj s prístupom pre servis, rozvodmi a napojením na vykurovanie alebo zásobník. Či sa zmestí vedľa práčky, závisí od konkrétneho typu riešenia.";
  }
  if (text.includes("byt") && !text.includes("rodin") && !text.includes("byt pocas") && !text.includes("musime byt") && !text.includes("byt doma")) {
    return "Pri byte je tepelné čerpadlo citlivejšia téma než pri rodinnom dome. Treba riešiť priestor, hluk, povolenia, vonkajšiu jednotku a to, či vôbec dáva zmysel oproti klimatizácii alebo inému riešeniu.";
  }
  if (text.includes("firma") || text.includes("kancelar") || text.includes("komerc") || text.includes("600")) {
    return "Pri firemnej alebo kancelárskej budove treba riešiť výkon, prevádzkové režimy, chladenie, vykurovanie a komfort ľudí v budove. Tam už dáva zmysel pozerať sa na systém ako celok, nie iba na jedno zariadenie.";
  }
  if (text.includes("realizac") || text.includes("referenc") || text.includes("pozriet") || text.includes("praxi")) {
    return "Pri realizáciách je najlepšie pozerať podobný typ objektu, nie iba peknú fotku technológie. Dôležité je, či ide o podobnú veľkosť domu, vykurovaciu sústavu a požadované funkcie.";
  }
  if (text.includes("od zaciatku") || text.includes("nevyznam") || text.includes("neviem co potrebujem")) {
    return "Najlepšie je začať jednoducho: aký objekt riešite, čím kúrite dnes, aké máte účty, či chcete aj chladenie a či ide o novostavbu alebo rekonštrukciu. Z toho sa dá postupne zistiť, ktoré riešenie vôbec dáva zmysel.";
  }

  if (text.includes("znack")) {
    return brands.length
      ? `V dostupnom obsahu sa spomína najmä ${brands.join(" a ")}. Neberte to ako rebríček značiek, skôr ako značky, ktoré sa objavujú pri riešeniach tepelných čerpadiel.`
      : "Značku by som nevyberal ako prvú vec. Najprv treba vedieť výkon, typ domu, hlučnosť, servis a rozpočet; až potom dáva zmysel porovnávať konkrétne modely.";
  }
  if (text.includes("monoblok") || text.includes("split")) {
    return "Monoblok a split sú technické varianty tepelného čerpadla. Pre laika je dôležité hlavne to, že výber ovplyvní montáž, servis a vhodnosť pre konkrétny dom.";
  }
  if (text.includes("hluk") || text.includes("hluc") || text.includes("huci") || intent === "noise") {
    return "Hlučnosť sa nedá posúdiť len podľa značky. V praxi rozhoduje najmä konkrétny model, výkon, umiestnenie vonkajšej jednotky a kvalita montáže.";
  }
  if (text.includes("dotac") || text.includes("prispev") || intent === "subsidy") {
    return "Dotácie a príspevky sa riešia podľa konkrétneho programu, podmienok a oprávnenosti žiadateľa. Dôležité je overiť, či sa vybrané riešenie na podporu hodí a čo treba pripraviť k žiadosti.";
  }
  if (text.includes("servis") || text.includes("udrzb") || intent === "service") {
    return interval
      ? "Servis a údržba tepelných čerpadiel dávajú zmysel kvôli spoľahlivosti a správnemu nastaveniu. Pri pravidelnej starostlivosti sa v zdrojoch objavuje aj interval raz za dva roky."
      : "Servis a údržba tepelných čerpadiel dávajú zmysel hlavne pri existujúcom zariadení, poruche, kontrole alebo pravidelnej údržbe.";
  }
  if (text.includes("kontakt") || text.includes("kontaktovat") || intent === "contact") {
    return "Najistejšie je ísť cez kontaktný formulár alebo cenovú ponuku. V chate vám viem najprv pomôcť ujasniť, či ide o cenu, servis, dotáciu alebo výber riešenia.";
  }
  if (text.includes("navrh") || text.includes("projekt") || text.includes("podorys") || text.includes("informac") || text.includes("poradit")) {
    return "Pri návrhu sa oplatí pripraviť základné údaje o dome, aktuálnom kúrení a podklady ako projekt alebo pôdorys. Potom sa dá lepšie posúdiť výkon, typ riešenia aj rozpočet.";
  }
  if (text.includes("strop") && (text.includes("vykurov") || text.includes("kuren"))) {
    return "Stropný systém môže fungovať aj ako vykurovanie. Pri tepelnom čerpadle sa vie prepínať medzi chladením a vykurovaním podľa sezóny.";
  }
  if (text.includes("plyn") || text.includes("vykurov") || text.includes("kuren") || text.includes("naklad")) {
    return "Vykurovanie je dobré riešiť ako celý systém, nie iba ako kúpu zariadenia. Pri dome bez plynu sa prirodzene ponúkajú riešenia okolo tepelného čerpadla a správneho návrhu vykurovania.";
  }
  if (text.includes("nibe")) {
    return "NIBE sa spomína ako riešenie tepelných čerpadiel pre domy. Pri výbere je dôležitý výkon, hlučnosť, umiestnenie vonkajšej jednotky a vhodnosť pre konkrétny objekt.";
  }
  if (text.includes("vaillant")) {
    return "Vaillant sa spomína v súvislosti s tepelnými čerpadlami. Vhodnosť konkrétneho modelu treba brať podľa domu, výkonu a návrhu systému.";
  }
  if (text.includes("tepelne") || text.includes("cerpadl") || text.includes("model")) {
    return "Pri výbere tepelného čerpadla by som nezačínal iba názvom modelu. Najprv treba trafiť typ systému, výkon, hlučnosť, montáž a servis podľa konkrétneho domu.";
  }
  if (intent === "installation") {
    return "Montáž nie je len osadenie zariadenia. Dôležitý je návrh, správne zapojenie, spustenie a nastavenie systému.";
  }
  if (intent === "quote") {
    return "Cenová ponuka sa nedá spraviť rozumne bez základných údajov o dome a požadovanom riešení. Najviac pomôže typ objektu, plocha, aktuálne kúrenie a lokalita.";
  }
  return "Téma sa viaže hlavne na tepelné čerpadlá, vykurovanie, montáž, servis alebo návrh riešenia pre konkrétny dom.";
}

function preferSpecificSummary(message: string): boolean {
  const text = normalizePolicyText(message);
  return (
    (text.includes("strop") && (text.includes("chladen") || text.includes("chladi") || text.includes("vykurov") || text.includes("kuren"))) ||
    (text.includes("temperovanie betonoveho jadra") && text.includes("chladen"))
  );
}

function isCeilingCoolingTopic(message: string): boolean {
  const text = normalizePolicyText(message);
  return (
    (text.includes("strop") && (text.includes("chladen") || text.includes("chladi") || text.includes("vykurov") || text.includes("kuren"))) ||
    (text.includes("temperovanie betonoveho jadra") && text.includes("chladen"))
  );
}

function advisorFollowUp(message: string, intent: SalesIntent, state: QualificationState, confidence: "high" | "medium" | "low"): LeadDecision | null {
  if (confidence === "low" || intent === "contact" || intent === "irrelevant" || intent === "unknown") return null;
  const text = normalizePolicyText(message);
  const relevantTurns = state.relevant_turns || 0;
  const mode = relevantTurns <= 1 ? "informative" : "advisory";

  if (isCeilingCoolingTopic(message)) {
    if (text.includes("cena") || text.includes("kolko") || text.includes("stoji") || text.includes("m2")) {
      return {
        shouldAsk: true,
        nextQuestion: "Riešite stropné chladenie skôr v novostavbe alebo v rekonštrukcii?",
        mode,
        isContactRequest: false,
      };
    }
    if (text.includes("rekon")) {
      return {
        shouldAsk: true,
        nextQuestion: "Je tam skôr sadrokartónový podhľad, alebo chceš riešiť podomietkový systém?",
        mode,
        isContactRequest: false,
      };
    }
    if (text.includes("novostav")) {
      return {
        shouldAsk: true,
        nextQuestion: "Je stropné chladenie už v projekte, alebo to ešte len zvažuješ?",
        mode,
        isContactRequest: false,
      };
    }
    return {
      shouldAsk: true,
      nextQuestion: "Uvažuješ nad stropným chladením v novostavbe alebo rekonštrukcii?",
      mode,
      isContactRequest: false,
    };
  }

  if (intent === "noise") {
    return {
      shouldAsk: true,
      nextQuestion: "Kde by mala byť vonkajšia jednotka - pri obytných miestnostiach alebo skôr bokom od domu?",
      mode,
      isContactRequest: false,
    };
  }

  if (intent === "quote") {
    if (text.includes("elektrin") || text.includes("spotreb") || text.includes("uct") || text.includes("uspor")) {
      return {
        shouldAsk: true,
        nextQuestion: "Vieš približne ročnú spotrebu alebo aspoň aktuálne ročné náklady na kúrenie?",
        mode,
        isContactRequest: false,
      };
    }
    return {
      shouldAsk: true,
      nextQuestion: "Pre aký objekt to riešiš - rodinný dom, byt alebo firemný priestor?",
      mode,
      isContactRequest: false,
    };
  }

  if (intent === "service") {
    return {
      shouldAsk: true,
      nextQuestion: "Ide skôr o pravidelnú údržbu alebo už riešite konkrétnu poruchu?",
      mode,
      isContactRequest: false,
    };
  }

  if (intent === "subsidy") {
    return {
      shouldAsk: true,
      nextQuestion: "Riešiš dotáciu k novému tepelnému čerpadlu alebo už máš vybrané konkrétne riešenie?",
      mode,
      isContactRequest: false,
    };
  }

  if (intent === "installation" || intent === "product") {
    if (text.includes("novy projekt") || text.includes("novostav") || text.includes("aktualne doplnil novy") || text.endsWith(" novy")) {
      return {
        shouldAsk: true,
        nextQuestion: "Aký typ domu riešiš a približne akú bude mať plochu?",
        mode,
        isContactRequest: false,
      };
    }
    if (text.includes("model") || text.includes("znack") || text.includes("nibe") || text.includes("vaillant") || text.includes("daikin")) {
      return {
        shouldAsk: true,
        nextQuestion: "Vyberáš podľa značky, hlučnosti, ceny alebo chceš najprv zistiť vhodný typ čerpadla pre dom?",
        mode,
        isContactRequest: false,
      };
    }
    if (text.includes("podlahov") && (text.includes("chladen") || text.includes("rosi") || text.includes("leto") || text.includes("prijem"))) {
      return {
        shouldAsk: true,
        nextQuestion: "Máš už v dome podlahové kúrenie, alebo by sa systém ešte len navrhoval?",
        mode,
        isContactRequest: false,
      };
    }
    if (text.includes("radiator") || text.includes("podlahov") || text.includes("podlahu")) {
      return {
        shouldAsk: true,
        nextQuestion: "Vieš, akú teplotu vody dnes radiátory potrebujú v zime, alebo máš aspoň projekt kúrenia?",
        mode,
        isContactRequest: false,
      };
    }
    if (text.includes("fotovolta") || text.includes("panel") || text.includes("strech")) {
      return {
        shouldAsk: true,
        nextQuestion: "Chceš fotovoltaiku hlavne na zníženie účtov, alebo už ju plánuješ aj kvôli tepelnému čerpadlu?",
        mode,
        isContactRequest: false,
      };
    }
    if (text.includes("rekuper")) {
      return {
        shouldAsk: true,
        nextQuestion: "Je rekuperácia už zakreslená v projekte, alebo ju ešte len zvažuješ?",
        mode,
        isContactRequest: false,
      };
    }
    if (text.includes("byt") && !text.includes("byt pocas") && !text.includes("musime byt") && !text.includes("byt doma")) {
      return {
        shouldAsk: true,
        nextQuestion: "Ide o byt v bytovke alebo samostatnú bytovú jednotku s možnosťou vonkajšej jednotky?",
        mode,
        isContactRequest: false,
      };
    }
    if (text.includes("firma") || text.includes("kancelar") || text.includes("komerc")) {
      return {
        shouldAsk: true,
        nextQuestion: "Potrebuješ skôr vykurovanie, chladenie, alebo oboje naraz pre celý objekt?",
        mode,
        isContactRequest: false,
      };
    }
    return {
      shouldAsk: true,
      nextQuestion: "Riešiš to pre nový projekt alebo chceš upraviť existujúce kúrenie?",
      mode,
      isContactRequest: false,
    };
  }

  return null;
}

function advisorMarkdown(message: string, summary: string, intent: SalesIntent): string[] {
  const text = normalizePolicyText(message);

  if (isCeilingCoolingTopic(message)) {
    if (
      text.includes("nevyhod") ||
      text.includes("minus") ||
      text.includes("rizik") ||
      text.includes("problem") ||
      text.includes("pomal") ||
      text.includes("pozor") ||
      text.includes("drahs") ||
      text.includes("kondenz") ||
      text.includes("vlhk") ||
      text.includes("nevhod") ||
      text.includes("nie je vhod") ||
      text.includes("vysok")
    ) {
      return [
        "### Stropné chladenie - na čo si dať pozor",
        "",
        summary,
        "",
        "| Riziko | Čo to znamená v praxi |",
        "|---|---|",
        "| Kondenzácia | Treba dobre strážiť vlhkosť a rosný bod. |",
        "| Pomalší nábeh | Nie je to systém na prudké ochladenie miestnosti za pár minút. |",
        "| Vyššiu obstarávaciu cenu | Komfort je vyšší, ale návrh aj montáž bývajú náročnejšie než pri bežnej klimatizácii. |",
      ];
    }

    if (text.includes("cena") || text.includes("cen") || text.includes("kolko") || text.includes("stoji") || text.includes("m2") || text.includes("zahrn")) {
      return [
        "### Cena stropného chladenia",
        "",
        summary,
        "",
        "| Čo cenu najviac mení | Prečo na tom záleží |",
        "|---|---|",
        "| Typ systému | Iné náklady má betónové jadro, podomietkový systém a sadrokartónový podhľad. |",
        "| Stavba vs. rekonštrukcia | Pri novostavbe sa dá systém zapracovať čistejšie už do projektu. |",
        "| Zdroj chladu | Samotné stropné chladenie ešte nerieši celý zdroj chladu a súvisiace práce. |",
      ];
    }

    return [
      "### Stropné chladenie - hlavné výhody",
      "",
      summary,
      "",
      "| Výhoda | Čo to znamená pre vás |",
      "|---|---|",
      "| Tiché a skryté | V miestnosti nemáte viditeľnú vnútornú jednotku ani výrazný hluk. |",
      "| Rovnomerný komfort | Chlad sa rozkladá cez veľkú plochu, nie cez jeden prúd studeného vzduchu. |",
      "| Menej prachu a prievanu | Neochladzuje fúkaním, takže nepôsobí tak agresívne ako klasická klimatizácia. |",
      "| Dobrá kombinácia s tepelným čerpadlom | Pri vhodnom návrhu vie systém riešiť chladenie aj vykurovanie. |",
      "",
      "**Pozor:** najdôležitejší je správny návrh kvôli vlhkosti a rosnému bodu.",
    ];
  }

  if (intent === "quote") {
    return [
      "### Cena a ponuka",
      "",
      summary,
      "",
      "Ak už máte rozpočet, dá sa podľa neho aspoň rozumne filtrovať, čo je reálne a čo by už bolo technicky alebo finančne mimo.",
      "",
      "**Čo najviac pomôže pri orientačnej ponuke:**",
      "",
      "- typ objektu",
      "- približná plocha",
      "- aktuálne kúrenie",
      "- lokalita",
      "- či ide o montáž, výmenu alebo nové riešenie",
    ];
  }

  if (intent === "service") {
    return [
      "### Servis a údržba",
      "",
      summary,
      "",
      "**Prakticky:** servis má zmysel riešiť najmä vtedy, keď chcete predísť poruche, zariadenie horšie kúri/chladí alebo sa zmenilo jeho správanie.",
    ];
  }

  if (intent === "subsidy") {
    return [
      "### Dotácie a príspevky",
      "",
      summary,
      "",
      "**Dobré je pripraviť si:** typ riešenia, stav projektu, základné údaje o dome a informáciu, či už máte vybraný konkrétny zdroj tepla.",
    ];
  }

  if (intent === "noise") {
    return [
      "### Hlučnosť tepelného čerpadla",
      "",
      summary,
      "",
      "**V praxi rozhoduje hlavne:** umiestnenie jednotky, konkrétny model, výkon, vzdialenosť od okien a kvalita montáže.",
    ];
  }

  if (intent === "installation") {
    return [
      "### Montáž a realizácia",
      "",
      summary,
      "",
      "| Časť riešenia | Prečo je dôležitá |",
      "|---|---|",
      "| Návrh | Určí výkon, typ systému a technické riešenie. |",
      "| Montáž | Rozhoduje o spoľahlivosti a hlučnosti v praxi. |",
      "| Spustenie | Systém treba správne nastaviť, nie iba zapojiť. |",
    ];
  }

  if (intent === "contact") {
    return [
      "### Kontakt a ďalší krok",
      "",
      summary,
      "",
      "**Ak chcete riešiť konkrétnu vec, najlepšie je napísať rovno, či ide o:**",
      "",
      "- cenovú ponuku",
      "- servis",
      "- dotáciu",
      "- návrh vykurovania alebo chladenia",
    ];
  }

  if (intent === "product" || text.includes("znack") || text.includes("nibe") || text.includes("vaillant")) {
    return [
      "### Výber riešenia",
      "",
      summary,
      "",
      "| Čo porovnať | Prečo na tom záleží |",
      "|---|---|",
      "| Výkon | Musí sedieť k domu, nie iba k značke. |",
      "| Hlučnosť | Dôležitá je aj poloha vonkajšej jednotky. |",
      "| Servis | Pri technológii je dostupnosť servisu prakticky rovnako dôležitá ako parametre. |",
      "| Rozpočet | Lacnejšie riešenie nemusí byť najvhodnejšie pre prevádzku. |",
    ];
  }

  if (text.includes("navrh") || text.includes("projekt") || text.includes("podorys") || text.includes("poradit")) {
    return [
      "### Návrh riešenia",
      "",
      summary,
      "",
      "**Aby sa dalo poradiť rozumne, treba poznať najmä:**",
      "",
      "- typ objektu a približnú plochu",
      "- aktuálne kúrenie",
      "- či ide o novostavbu alebo rekonštrukciu",
      "- očakávania: vykurovanie, chladenie, teplá voda, servis alebo dotácia",
    ];
  }

  if (text.includes("plyn") || text.includes("vykurov") || text.includes("kuren") || text.includes("naklad")) {
    return [
      "### Vykurovanie domu",
      "",
      summary,
      "",
      "**Rozumný postup:** najprv posúdiť dom a existujúci systém, až potom vyberať konkrétnu technológiu.",
    ];
  }

  return ["### Ako by som to uchopil", "", summary];
}

function composeAnswer(message: string, results: RetrievalResult[], confidence: "high" | "medium" | "low", intent: SalesIntent, policy: AnswerPolicy): string {
  const top = results[0];

  if (policy.kind === "adversarial") {
    return "Viem pomôcť s tepelnými čerpadlami, vykurovaním, servisom alebo dotáciami, ale nebudem ignorovať pravidlá ani vymýšľať nepodložené informácie.\n\nS čím konkrétne vám mám pomôcť?";
  }

  if (policy.kind === "out_of_scope") {
    return [
      "Na toto nemám dostatočne jasný podklad.",
      "",
      "Najlepšie vám pomôžem s otázkami okolo tepelných čerpadiel, vykurovania, chladenia, servisu, dotácií alebo montáže.",
    ].join("\n");
  }

  if (policy.kind === "sensitive") return composeHardenedSensitiveAnswer(policy, results, confidence);

  if (policy.kind === "ambiguous") {
    const leadIn = topicLeadIn(message);
    const summary = preferSpecificSummary(message) ? plainSummary(message, results, intent) : leadIn || plainSummary(message, results, intent);
    const intro =
      confidence === "low"
        ? "Toto by som bez ďalšieho kontextu nechcel hádať."
        : "Dá sa odpovedať orientačne, ale chýba mi ešte jeden detail.";
    return [
      "### Potrebujem trochu kontextu",
      "",
      intro,
      "",
      summary,
      "",
      `**Doplňujúca otázka:** ${policy.followUp}`,
      ...sourceReferences(results, confidence),
    ]
      .filter((line): line is string => line !== null && line !== undefined)
      .join("\n");
  }

  if (!top || confidence === "low") {
    return [
      "Na toto nemám dosť jasný podklad.",
      "",
      "Skúste to prosím upresniť jednou vetou: ide skôr o tepelné čerpadlo, servis, dotáciu, montáž alebo chladenie?",
    ].join("\n");
  }

  const leadIn = topicLeadIn(message);
  const summary = preferSpecificSummary(message) ? plainSummary(message, results, intent) : leadIn || plainSummary(message, results, intent);
  return [
    ...advisorMarkdown(message, summary, intent),
    "",
    confidence === "medium" ? "_Beriem to opatrne, lebo zhoda v zdrojoch nie je úplne silná._" : null,
    ...sourceReferences(results, confidence),
  ]
    .filter((line): line is string => line !== null && line !== undefined)
    .join("\n");
}

function isGeneralChatWithoutRetrieval(message: string): boolean {
  const text = normalizePolicyText(message);
  if (isPageOverviewQuestion(message)) return false;
  const substantiveTerms = [
    "co sa deje",
    "co je",
    "co tu",
    "o com",
    "kolko",
    "cena",
    "stoji",
    "servis",
    "dotac",
    "kontakt",
    "strop",
    "chladen",
    "tepelne",
    "cerpad",
    "nibe",
    "montaz",
    "vykurov",
    "kuren",
    "hluk",
    "huci",
    "porad",
  ];
  const startsWithGreeting = ["ahoj", "cau", "dobry den", "dobry"].some((term) => text.startsWith(`${term} `));
  if (startsWithGreeting && substantiveTerms.some((term) => text.includes(term))) return false;
  return [
    "ahoj",
    "cau",
    "dobry den",
    "dobry",
    "ako sa mas",
    "ako sa mate",
    "co si zac",
    "kto si",
    "dakujem",
    "vdaka",
    "super",
    "ok",
  ].some((term) => text === term || text.startsWith(`${term} `));
}

function isGreetingMessage(message: string): boolean {
  const text = message.trim().toLowerCase();
  return [
    "ahoj",
    "čau",
    "cau",
    "hello",
    "hi",
    "dobrý deň",
    "dobry den",
    "dobrý večer",
    "dobry vecer",
    "dobrý ráno",
    "dobry rano",
    "zdravím",
    "zdravim",
    "hey",
  ].includes(text);
}

type RoutingPlan = {
  needsRetrieval: boolean;
  retrievalQuery: string;
  answerMessage: string;
  contextTopic: string | null;
  intentHint: SalesIntent | null;
  answerMode: AnswerMode;
  confidence: "high" | "medium" | "low";
  reason: string;
  contextCarried: boolean;
};

const salesIntents: SalesIntent[] = ["quote", "service", "subsidy", "product", "installation", "noise", "contact", "greeting", "irrelevant", "unknown"];

function toSalesIntent(value: string | null | undefined): SalesIntent | null {
  return salesIntents.includes(value as SalesIntent) ? (value as SalesIntent) : null;
}

function isPageOverviewQuestion(message: string): boolean {
  const text = normalizePolicyText(message);
  return [
    "co sa deje na tejto stranke",
    "co je na tejto stranke",
    "co je toto za stranku",
    "o com je tato stranka",
    "o com je tento web",
    "co riesi tato stranka",
    "co tu najdem",
    "kde som",
  ].some((term) => text.includes(term));
}

function isContactQuestion(message: string): boolean {
  const text = normalizePolicyText(message);
  return (
    text.includes("kontakt") ||
    text.includes("telefon") ||
    text.includes("email") ||
    text.includes("adresa") ||
    text.includes("kde vas") ||
    text.includes("ako vas") ||
    text.includes("kde ta najdem") ||
    text.includes("kde vas najdem") ||
    text.includes("kde najdem") ||
    text.includes("zavolat")
  );
}

function inferTopicFromHistory(messages: Array<{ role: string; content: string }>): { topic: string; query: string; intent: SalesIntent } | null {
  for (const message of [...messages].reverse().slice(0, 8)) {
    if (message.role !== "user") continue;
    if (isGeneralChatWithoutRetrieval(message.content) || isPageOverviewQuestion(message.content)) continue;
    const text = normalizePolicyText(message.content);
    if (text.includes("strop") && (text.includes("chladen") || text.includes("vykurov") || text.includes("kuren"))) {
      return { topic: "stropné chladenie", query: "stropné chladenie", intent: "product" };
    }
    if (text.includes("nibe")) return { topic: "NIBE tepelné čerpadlo", query: "NIBE tepelné čerpadlo hlučnosť vonkajšia jednotka", intent: "product" };
    if (text.includes("hluk") || text.includes("hluc") || text.includes("huci") || text.includes("vonkajs")) {
      return { topic: "hlučnosť vonkajšej jednotky tepelného čerpadla", query: "hlučnosť tepelné čerpadlo vonkajšia jednotka susedia", intent: "noise" };
    }
    if (text.includes("zem voda") || text.includes("vzduch voda") || text.includes("pozemok")) {
      return { topic: "porovnanie tepelného čerpadla zem-voda a vzduch-voda", query: "tepelné čerpadlo zem voda vzduch voda pozemok spotreba", intent: "product" };
    }
    if (text.includes("cena") || text.includes("cenu") || text.includes("ponuk") || text.includes("orientac") || text.includes("rozpocet") || text.includes("navratnost")) {
      return { topic: "orientačná cena a cenová ponuka tepelného čerpadla", query: "cenová ponuka tepelné čerpadlo cena podklady dom", intent: "quote" };
    }
    if (text.includes("elektrin") || text.includes("spotreb") || text.includes("zere") || text.includes("uct")) {
      return { topic: "spotreba elektriny a náklady tepelného čerpadla", query: "spotreba elektriny tepelné čerpadlo náklady účty", intent: "quote" };
    }
    if (text.includes("fotovolta") || text.includes("panel") || text.includes("strech")) {
      return { topic: "fotovoltaika a tepelné čerpadlo", query: "fotovoltaika tepelné čerpadlo panely spotreba", intent: "product" };
    }
    if (text.includes("rekuper")) {
      return { topic: "rekuperácia a vetranie", query: "rekuperácia vetranie novostavba", intent: "product" };
    }
    if (text.includes("montaz") || text.includes("instalac")) {
      return { topic: "montáž tepelného čerpadla", query: "inštalácia tepelného čerpadla montáž trvanie bez kúrenia", intent: "installation" };
    }
    if (text.includes("realizac") || text.includes("referenc") || text.includes("praxi")) {
      return { topic: "realizácie a referencie", query: "realizácie referencie tepelné čerpadlo", intent: "product" };
    }
    if (text.includes("od zaciatku") || text.includes("nevyznam") || text.includes("neviem co potrebujem")) {
      return { topic: "úvodné poradenstvo k vykurovaniu domu", query: "návrh vykurovania tepelné čerpadlo dom podklady", intent: "product" };
    }
    if (text.includes("podlahove") && (text.includes("chladen") || text.includes("chladi") || text.includes("rosi"))) {
      return { topic: "podlahové chladenie", query: "podlahové chladenie rosný bod kondenzácia leto", intent: "product" };
    }
    if (text.includes("podlahove") && (text.includes("kuren") || text.includes("vykurov"))) {
      return { topic: "podlahové kúrenie", query: "podlahové kúrenie", intent: "product" };
    }
    if (text.includes("servis") || text.includes("udrzb")) return { topic: "servis tepelného čerpadla", query: "servis tepelného čerpadla", intent: "service" };
    if (text.includes("dotac") || text.includes("prispev")) return { topic: "dotácie", query: "dotácie tepelné čerpadlo", intent: "subsidy" };
    if (text.includes("tepelne cerpadlo") || text.includes("cerpadl")) {
      return { topic: "tepelné čerpadlo", query: "tepelné čerpadlo", intent: "product" };
    }
  }
  return null;
}

function isLikelyContextReply(message: string): boolean {
  const text = normalizePolicyText(message);
  const tokens = meaningfulTokens(message);
  if (!text || isGeneralChatWithoutRetrieval(message)) return false;
  if (tokens.length > 8 && message.length > 100) return false;
  const explicitTopicSwitch = [
    "pocasie",
    "auto",
    "hypotek",
    "bitcoin",
    "servis",
    "dotac",
    "kontakt",
    "telefon",
    "email",
    "nibe",
    "vaillant",
    "daikin",
    "ariston",
    "viessmann",
  ].some((term) => text.includes(term));
  if (explicitTopicSwitch) return false;
  const contextWords = [
    "ano",
    "nie",
    "rekon",
    "rekonstruk",
    "rekonstrukcou",
    "novostav",
    "dom",
    "rodin",
    "byt",
    "firma",
    "m2",
    "zilina",
    "podhlad",
    "sadrokarton",
    "podomiet",
    "sused",
    "vecer",
    "elektrin",
    "mesac",
    "uct",
    "naklad",
    "plyn",
    "radiator",
    "podlahov",
    "podlahu",
    "projekt",
    "podorys",
    "pozemok",
    "strech",
    "panel",
    "bungalov",
    "poschod",
    "technick",
    "pracka",
    "mraz",
    "zima",
    "bez kurenia",
    "klimatiz",
    "komfort",
    "vydychany",
    "model",
    "znack",
    "orientac",
    "presna",
    "rata",
    "drah",
    "lacn",
    "podobn",
    "praxi",
    "nevyznam",
    "neviem",
    "potrebujem",
    "riesenie",
    "cca",
    "asi",
    "skor",
    "len",
  ];
  return tokens.length <= 5 || contextWords.some((term) => text.includes(term));
}

function contextualAnswerMessage(message: string, topic: string): string {
  return `Používateľ stále rieši tému: ${topic}. Aktuálne doplnil: ${message}`;
}

function contextualRetrievalQuery(message: string, topic: { topic: string; query: string; intent: SalesIntent }): string {
  const text = normalizePolicyText(message);
  if (
    topic.topic === "tepelné čerpadlo" &&
    (text === "novy" || text === "novy projekt" || text.includes("novostav") || text.includes("novy dom"))
  ) {
    return "tepelné čerpadlo novostavba návrh domu podlahové kúrenie chladenie teplá voda projekt";
  }
  return `${topic.query} ${message}`;
}

function deterministicRoutingPlan(message: string, previousMessages: Array<{ role: string; content: string }>): RoutingPlan {
  if (isPageOverviewQuestion(message)) {
    return {
      needsRetrieval: false,
      retrievalQuery: "",
      answerMessage: message,
      contextTopic: null,
      intentHint: "unknown",
      answerMode: "general_chat",
      confidence: "high",
      reason: "page_overview_without_retrieval",
      contextCarried: false,
    };
  }
  if (isGeneralChatWithoutRetrieval(message)) {
    return {
      needsRetrieval: false,
      retrievalQuery: "",
      answerMessage: message,
      contextTopic: null,
      intentHint: "unknown",
      answerMode: "general_chat",
      confidence: "high",
      reason: "general_chat_without_retrieval",
      contextCarried: false,
    };
  }
  if (isContactQuestion(message)) {
    return {
      needsRetrieval: true,
      retrievalQuery: `kontakt Geotherm telefón email adresa ${message}`,
      answerMessage: message,
      contextTopic: null,
      intentHint: "contact",
      answerMode: "contact_intent",
      confidence: "high",
      reason: "contact_question",
      contextCarried: false,
    };
  }
  const topic = inferTopicFromHistory(previousMessages);
  if (topic && isLikelyContextReply(message)) {
    return {
      needsRetrieval: true,
      retrievalQuery: contextualRetrievalQuery(message, topic),
      answerMessage: contextualAnswerMessage(message, topic.topic),
      contextTopic: topic.topic,
      intentHint: topic.intent,
      answerMode: "rag_answer",
      confidence: "medium",
      reason: "short_reply_inherits_previous_topic",
      contextCarried: true,
    };
  }
  return {
    needsRetrieval: true,
    retrievalQuery: message,
    answerMessage: message,
    contextTopic: null,
    intentHint: null,
    answerMode: "rag_answer",
    confidence: "medium",
    reason: "default_retrieval",
    contextCarried: false,
  };
}

function routingPlanFromLlm(decision: RetrievalRouteDecision | undefined, fallback: RoutingPlan, message: string): RoutingPlan {
  if (!decision) return fallback;
  const intentHint = toSalesIntent(decision.intentHint);
  const contextTopic = decision.contextTopic || fallback.contextTopic;
  const contextCarried = Boolean(contextTopic && normalizePolicyText(message) !== normalizePolicyText(decision.retrievalQuery || message));
  return {
    needsRetrieval: decision.needsRetrieval,
    retrievalQuery: decision.retrievalQuery || fallback.retrievalQuery,
    answerMessage: contextTopic ? contextualAnswerMessage(message, contextTopic) : message,
    contextTopic,
    intentHint: intentHint || fallback.intentHint,
    answerMode: decision.answerMode,
    confidence: decision.confidence,
    reason: decision.reason,
    contextCarried,
  };
}

function mergeRoutingPlans(message: string, fallback: RoutingPlan, llmDecision: RetrievalRouteDecision | undefined): RoutingPlan {
  const llmPlan = routingPlanFromLlm(llmDecision, fallback, message);
  if (fallback.reason === "page_overview_without_retrieval") return fallback;
  if (!fallback.contextCarried) return llmPlan;

  const fallbackTopicKey = normalizePolicyText(fallback.contextTopic || "").split(" ")[0];
  const llmQuery = normalizePolicyText(llmPlan.retrievalQuery);
  if (!fallbackTopicKey || llmQuery.includes(fallbackTopicKey)) return { ...llmPlan, contextCarried: true };
  return fallback;
}

function shouldUseLlmRouter(message: string, fallback: RoutingPlan): boolean {
  if (process.env.ARCIGY_LLM_ROUTER_ENABLED === "false") return false;
  if (fallback.answerMode === "safety_fallback") return false;
  return true;
}

export function planRouterForTest(
  message: string,
  previousMessages: Array<{ role: string; content: string }>,
  llmDecision?: RetrievalRouteDecision,
): RoutingPlan {
  const preRetrievalPolicy = classifyAnswerPolicy(message, "unknown");
  if (isGeneralChatWithoutRetrieval(message)) {
    return {
      needsRetrieval: false,
      retrievalQuery: "",
      answerMessage: message,
      contextTopic: null,
      intentHint: "unknown",
      answerMode: "general_chat",
      confidence: "high",
      reason: "general_chat_without_retrieval",
      contextCarried: false,
    };
  }
  if (preRetrievalPolicy.kind === "out_of_scope") {
    return {
      needsRetrieval: false,
      retrievalQuery: "",
      answerMessage: message,
      contextTopic: null,
      intentHint: "irrelevant",
      answerMode: "out_of_scope",
      confidence: "low",
      reason: "out_of_scope",
      contextCarried: false,
    };
  }
  const fallback = deterministicRoutingPlan(message, previousMessages);
  const contact = extractContact(message);
  if (contact.email || contact.phone) {
    return {
      ...fallback,
      needsRetrieval: true,
      intentHint: "contact",
      answerMode: "contact_intent",
      contextCarried: false,
    };
  }
  return mergeRoutingPlans(message, fallback, llmDecision);
}

function fallbackLeadProfile(input: {
  messages: Array<{ role: string; content: string }>;
  state: QualificationState;
  intent: string;
  score: number;
}): {
  description: string;
  interestLevel: "low" | "medium" | "high";
  stage: string;
  customerSignals: string[];
  riskNotes: string[];
} {
  const userText = input.messages
    .filter((message) => message.role === "user")
    .map((message) => message.content)
    .join(" ");
  const signals = [
    input.state.project_type ? `Projekt: ${input.state.project_type}` : null,
    input.state.property_type ? `Objekt: ${input.state.property_type}` : null,
    input.state.area_m2 ? `Plocha: ${input.state.area_m2} m2` : null,
    input.state.location ? `Lokalita: ${input.state.location}` : null,
    input.state.timeline ? `Termín: ${input.state.timeline}` : null,
    input.state.current_heating ? `Aktuálne kúrenie: ${input.state.current_heating}` : null,
  ].filter((value): value is string => Boolean(value));
  const interestLevel = input.score >= 70 ? "high" : input.score >= 45 ? "medium" : "low";
  return {
    description: `Zákazník rieši tému "${input.intent}". ${signals.length ? signals.join(", ") : "Zatiaľ poskytol skôr základný kontakt a málo technických detailov."} Z textu: ${userText.replace(/\s+/g, " ").slice(0, 260)}`,
    interestLevel,
    stage: input.state.timeline || (input.state.area_m2 || input.state.location ? "konkrétne zisťovanie" : "úvodný záujem"),
    customerSignals: signals,
    riskNotes: input.state.contact_email || input.state.contact_phone ? [] : ["Chýba kontakt."],
  };
}

type QualificationUpdate = Partial<Pick<QualificationState, "project_type" | "property_type" | "area_m2" | "location" | "timeline" | "current_heating">>;

async function extractQualificationUpdate(input: {
  userMessage: string;
  assistantAnswer: string;
  currentState: QualificationState;
}): Promise<QualificationUpdate> {
  const systemPrompt =
    "Extract structured data from this conversation exchange. Return JSON only with ONLY the fields you are confident about based on what the user just said. Use null for unknown fields. Fields: project_type (novostavba|rekonštrukcia), property_type (rodinný dom|bungalov|byt|iné), area_m2 (number), location (string), timeline (string), current_heating (string). Only extract what the user explicitly stated in their message.";

  try {
    const result = await callLlmText({
      systemPrompt,
      prompt: JSON.stringify({ userMessage: input.userMessage, assistantAnswer: input.assistantAnswer }),
      maxOutputTokens: 150,
      timeoutMs: 3000,
      responseMimeType: "application/json",
    });
    if (result.error || !result.content) throw new Error(result.error || "empty qualification extraction response");

    const trimmed = result.content.trim();
    const jsonStart = trimmed.indexOf("{");
    const jsonEnd = trimmed.lastIndexOf("}");
    if (jsonStart < 0 || jsonEnd < jsonStart) throw new Error("qualification extraction response had no JSON object");

    const parsed = JSON.parse(trimmed.slice(jsonStart, jsonEnd + 1)) as Record<string, unknown>;
    const update: QualificationUpdate = {};
    const readString = (field: string): string | undefined => {
      const value = parsed[field];
      return typeof value === "string" && value.trim() ? value.trim() : undefined;
    };

    const projectType = readString("project_type");
    if (projectType && ["novostavba", "rekonštrukcia"].includes(projectType)) update.project_type = projectType;
    const propertyType = readString("property_type");
    if (propertyType && ["rodinný dom", "bungalov", "byt", "iné"].includes(propertyType)) update.property_type = propertyType;
    const area = parsed.area_m2;
    if (typeof area === "number" && Number.isFinite(area)) update.area_m2 = area;
    update.location = readString("location");
    update.timeline = readString("timeline");
    update.current_heating = readString("current_heating");
    return update;
  } catch (error) {
    console.warn(`Qualification extraction skipped: ${error instanceof Error ? error.message : String(error)}`);
    return {};
  }
}

export async function createChatResponse(requestBody: ChatRequest, knowledgePath?: string): Promise<ChatResponse> {
  const responseStartedAt = Date.now();
  loadLocalEnv();

  const parseRouterResponse = (content: string | undefined): { needsRetrieval: boolean; retrievalQuery: string | null } => {
    const fixMojibake = (str: string): string => {
      try {
        const repaired = Buffer.from(str, "latin1").toString("utf8");
        const badChars = (value: string): number => (value.match(/�/g) || []).length;
        return badChars(repaired) < badChars(str) ? repaired : str;
      } catch {
        return str;
      }
    };
    if (!content) return { needsRetrieval: false, retrievalQuery: null };
    const trimmed = content.trim();
    const jsonStart = trimmed.indexOf("{");
    const jsonEnd = trimmed.lastIndexOf("}");
    if (jsonStart < 0 || jsonEnd < jsonStart) return { needsRetrieval: false, retrievalQuery: null };

    try {
      const parsed = JSON.parse(trimmed.slice(jsonStart, jsonEnd + 1)) as {
        needsRetrieval?: unknown;
        retrievalQuery?: unknown;
      };
      const needsRetrieval = parsed.needsRetrieval === true;
      const retrievalQuery =
        typeof parsed.retrievalQuery === "string" && parsed.retrievalQuery.trim() ? fixMojibake(parsed.retrievalQuery.trim()) : null;
      return { needsRetrieval, retrievalQuery };
    } catch {
      return { needsRetrieval: false, retrievalQuery: null };
    }
  };

  const cleanAnswerText = (content: string | undefined): string => {
    const raw = (content || "").trim();
    const decodeEscapedText = (value: string): string =>
      value
        .replace(/\\r\\n/g, "\n")
        .replace(/\\n/g, "\n")
        .replace(/\\t/g, " ")
        .replace(/\\"/g, '"')
        .replace(/\\u([0-9a-f]{4})/gi, (_, code: string) => String.fromCharCode(Number.parseInt(code, 16)));
    const renderStructured = (value: unknown): string | null => {
      if (!value || typeof value !== "object") return null;
      const object = value as Record<string, unknown>;
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
    const extractJsonAnswer = (value: string): string | null => {
      const trimmed = value.replace(/^```(?:json|markdown|text)?\s*/i, "").replace(/```$/i, "").trim();
      const candidates = [trimmed];
      const start = trimmed.indexOf("{");
      const end = trimmed.lastIndexOf("}");
      if (start >= 0 && end > start) candidates.push(trimmed.slice(start, end + 1));
      for (const candidate of candidates) {
        try {
          const parsed = JSON.parse(candidate) as unknown;
          if (typeof parsed === "string") return parsed;
          if (parsed && typeof parsed === "object") {
            const object = parsed as Record<string, unknown>;
            for (const key of ["answer", "message", "content", "assistantAnswer"]) {
              if (typeof object[key] === "string") return object[key] as string;
            }
            const structured = renderStructured(parsed);
            if (structured) return structured;
          }
        } catch {
          // Keep trying less strict candidates.
        }
      }
      return null;
    };
    const answer = decodeEscapedText(extractJsonAnswer(raw) || raw)
      .replace(/^```(?:markdown|text)?\s*/i, "")
      .replace(/```$/i, "")
      .replace(/\n?\s*["'}\]]+\s*$/g, (suffix) => (suffix.includes("\n") ? "" : suffix))
      .trim();
    if (!answer) return "Prepáč, teraz neviem pripraviť dobrú odpoveď. Skús mi prosím napísať otázku ešte raz.";
    return answer;
  };
  const isIncompleteAnswer = (content: string): boolean => {
    const answer = content.trim();
    if (!answer) return true;
    const compact = answer.replace(/\s+/g, " ").trim();
    const lower = compact.toLowerCase();
    if (compact.length < 45 && !/[.!?…]$/.test(compact)) return true;
    if (!/[.!?…]$/.test(compact)) return true;
    if (/[{[]\s*$/.test(compact) || /\\n/.test(compact)) return true;
    return /\b(aby|aby som|že|a|alebo|pre|k|ku|s|so|na|do|od|ak|keď|ktorý|ktorá|ktoré|čo|by|ti|som|mohol|pomohol)$/i.test(lower);
  };
  const fallbackCompleteAnswer = (userMessage: string, answerSources: ChatSource[]): string => {
    if (/^(ahoj|čau|cau|hello|hi|hey|dobrý deň|zdravím|zdravim)$/i.test(userMessage.trim())) {
      return "Ahoj! Som tu pre teba, keď chceš poradiť s tepelným čerpadlom, klimatizáciou, servisom alebo dotáciami.\n\nČo chceš riešiť ako prvé?";
    }
    const source = answerSources[0];
    const sentence = source?.snippet?.replace(/\s+/g, " ").split(/(?<=[.!?])\s+/)[0]?.trim();
    return [
      "### Stručne k otázke",
      "",
      sentence || "K tejto téme mám podklady, ale odpoveď sa nedokončila správne, preto radšej odpoviem opatrne.",
      "",
      "Čo z toho chceš upresniť ako prvé?",
    ].join("\n");
  };
  const shouldPreferTable = (userMessage: string): boolean => {
    const text = normalizePolicyText(userMessage);
    return [
      "ake predavate",
      "ake mate",
      "ake typy",
      "ake cerpadla",
      "rozdiel",
      "porovnaj",
      "co je lepsie",
      "ktore je lepsie",
      "vybrat",
      "vyber",
    ].some((term) => text.includes(term));
  };
  const enforceMarkdownPresentation = (content: string, userMessage: string): string => {
    let answer = content.trim();
    const shortenCell = (value: string, maxLength = 150): string => {
      const compact = value.replace(/\s+/g, " ").trim();
      if (compact.length <= maxLength) return compact;
      const sliced = compact.slice(0, maxLength).replace(/\s+\S*$/, "").trim();
      return `${sliced || compact.slice(0, maxLength).trim()}...`;
    };
    const compactOversizedTables = (value: string): string => {
      const lines = value.split(/\r?\n/);
      const output: string[] = [];
      for (let index = 0; index < lines.length; index += 1) {
        const isTableLine = /^\s*\|.*\|\s*$/.test(lines[index]);
        if (!isTableLine) {
          output.push(lines[index]);
          continue;
        }

        const tableLines: string[] = [];
        while (index < lines.length && /^\s*\|.*\|\s*$/.test(lines[index])) {
          tableLines.push(lines[index]);
          index += 1;
        }
        index -= 1;

        const oversized = tableLines.length > 6 || tableLines.some((line) => line.length > 180);
        if (!oversized) {
          output.push(...tableLines);
          continue;
        }

        const rows = tableLines
          .filter((line) => !/^\s*\|[-:\s|]+\|\s*$/.test(line))
          .slice(1, 5)
          .map((line) =>
            line
              .split("|")
              .slice(1, -1)
              .map((cell) => cell.replace(/\*\*/g, "").trim()),
          )
          .filter((cells) => cells.length >= 2 && cells[0] && cells[1]);

        if (!rows.length) continue;
        output.push(...rows.map((cells) => `- **${shortenCell(cells[0], 42)}:** ${shortenCell(cells.slice(1).join(" - "), 160)}`));
      }
      return output.join("\n").replace(/\n{3,}/g, "\n\n").trim();
    };
    const limitAnswerLength = (value: string, maxLength = 1800): string => {
      if (value.length <= maxLength) return value;
      const cut = value.slice(0, maxLength);
      const sentenceEnd = Math.max(cut.lastIndexOf("."), cut.lastIndexOf("?"), cut.lastIndexOf("!"));
      return (sentenceEnd > 700 ? cut.slice(0, sentenceEnd + 1) : cut).trim();
    };

    answer = compactOversizedTables(answer);
    if (!/^#{1,3}\s+/m.test(answer) && !/^(ahoj|dobry den|dobrý deň|cau|čau|hello|hi)[!.]?\s*$/i.test(userMessage.trim())) {
      answer = `### Stručne k otázke\n\n${answer}`;
    }
    if (!shouldPreferTable(userMessage) || /\|.+\|\s*\r?\n\s*\|[-:\s|]+\|/.test(answer)) return limitAnswerLength(compactOversizedTables(answer));

    const lines = answer.split(/\r?\n/);
    const rows: Array<{ label: string; text: string }> = [];
    let first = -1;
    let last = -1;
    for (let index = 0; index < lines.length; index += 1) {
      const match = lines[index].match(/^\s*[*-]\s+\*\*([^*]+)\*\*:?\s*(.+)$/);
      if (!match) {
        if (rows.length >= 2) break;
        if (rows.length > 0 && !lines[index].trim()) continue;
        rows.length = 0;
        first = -1;
        last = -1;
        continue;
      }
      if (first === -1) first = index;
      last = index;
      rows.push({ label: match[1].trim().replace(/:$/, ""), text: match[2].trim() });
    }
    if (rows.length < 2 || first < 0 || last < first) return answer;

    const table = [
      "| Možnosť | Čo to znamená |",
      "|---|---|",
      ...rows.slice(0, 4).map((row) => `| **${shortenCell(row.label, 42)}** | ${shortenCell(row.text.replace(/\|/g, "/"), 150)} |`),
    ];
    return limitAnswerLength(compactOversizedTables([...lines.slice(0, first), ...table, ...lines.slice(last + 1)].join("\n").replace(/\n{3,}/g, "\n\n").trim()));
  };

  const message = typeof requestBody.message === "string" ? requestBody.message.trim() : "";
  const sitePublicId = typeof requestBody.siteId === "string" ? requestBody.siteId.trim() : "";

  if (!message) throw new Error("message is required");
  if (message.length > 2000) throw new Error("message is too long");
  if (!sitePublicId) throw new Error("siteId is required");

  initDb();
  const site = getSiteByPublicId(sitePublicId);
  if (!site) throw new Error(`Unknown siteId: ${sitePublicId}`);

  const anonymousId = requestBody.anonymousId?.trim() || generatedAnonymousId();
  const session = upsertSession(site, anonymousId, requestBody.metadata?.userAgent);
  const conversation = getOrCreateActiveConversation(site, session);
  const previousMessages = getConversationMessages(conversation.id);
  const previousState = parseState(conversation.qualification_state_json);

  const safetyRoute = detectSafetyRoute(message);
  if (safetyRoute.triggered) {
    const safetySystemPrompt = [
      "Si AI servisný poradca pre Geotherm. Odpovedáš po slovensky, tykáš a píšeš ako skutočný človek.",
      "",
      "Používateľ sa pýta na technicky alebo bezpečnostne rizikovú vec. Musíš odpovedať cez AI, ale nesmieš dávať návod na opravu, zapojenie, rozoberanie, tlak, chladivo ani servisný postup.",
      "",
      `Cieľ odpovede: pokojne vysvetliť, že toto treba riešiť telefonicky s technikom, a jasne priložiť číslo ${urgentServicePhone}.`,
      "",
      "Formát: pekný Markdown, jeden krátky nadpis `### ...`, maximálne 80 slov, žiadna tabuľka, žiadny technický postup.",
    ].join("\n");
    let safetyLlm = await callLlmText({
      systemPrompt: safetySystemPrompt,
      prompt: JSON.stringify(
        {
          userMessage: message,
          safetyReason: safetyRoute.reason,
          previousMessages: previousMessages.slice(-4).map((item) => ({ role: item.role, content: item.content })),
        },
        null,
        2,
      ),
      maxOutputTokens: 320,
      timeoutMs: Number.parseInt(process.env.LLM_SAFETY_TIMEOUT_MS || "7000", 10),
      responseMimeType: "text/plain",
    });
    let safetyCandidate = cleanAnswerText(safetyLlm.content);
    if ((safetyLlm.error || isIncompleteAnswer(safetyCandidate)) && process.env.OPENAI_API_KEY) {
      safetyLlm = await callLlmText({
        provider: "openai",
        systemPrompt: safetySystemPrompt,
        prompt: JSON.stringify(
          {
            userMessage: message,
            safetyReason: safetyRoute.reason,
            previousModelAnswer: safetyCandidate,
            instruction: "Predchádzajúca AI odpoveď bola chýbajúca alebo useknutá. Napíš kompletnú krátku bezpečnú odpoveď s telefónnym číslom.",
          },
          null,
          2,
        ),
        maxOutputTokens: 320,
        timeoutMs: Number.parseInt(process.env.LLM_SAFETY_TIMEOUT_MS || "7000", 10),
        responseMimeType: "text/plain",
      });
      safetyCandidate = cleanAnswerText(safetyLlm.content);
    }
    const safetyWithPhone = safetyCandidate.includes(urgentServicePhone)
      ? safetyCandidate
      : `${safetyCandidate}\n\n**Urgentný kontakt:** ${urgentServicePhone}`;
    const safetyLlmUsed = Boolean(safetyLlm.content && !safetyLlm.error && !isIncompleteAnswer(safetyCandidate));
    const answer = enforceMarkdownPresentation(
      isIncompleteAnswer(safetyWithPhone) ? safetyRoute.answer : safetyWithPhone,
      message,
    );
    const confidence: "low" = "low";
    const sources: ChatSource[] = [];
    const nextState = {
      ...previousState,
      relevant_turns: previousState.relevant_turns ?? 0,
    };

    if (!previousMessages.length) {
      insertEvent({
        siteId: site.id,
        sessionId: session.id,
        conversationId: conversation.id,
        eventType: "widget_opened",
        payload: { inferredFromFirstMessage: true, currentUrl: requestBody.currentUrl },
      });
    }
    insertEvent({
      siteId: site.id,
      sessionId: session.id,
      conversationId: conversation.id,
      eventType: "message_sent",
      payload: { currentUrl: requestBody.currentUrl, referrer: requestBody.metadata?.referrer, messageLength: message.length },
    });
    insertMessage({ conversationId: conversation.id, role: "user", content: message });
    insertEvent({
      siteId: site.id,
      sessionId: session.id,
      conversationId: conversation.id,
      eventType: "safety_router_triggered",
      payload: { reason: safetyRoute.reason, intent: safetyRoute.intent },
    });
    updateConversation(conversation.id, {
      intent: safetyRoute.intent,
      qualificationStateJson: JSON.stringify(nextState),
    });
    insertMessage({ conversationId: conversation.id, role: "assistant", content: answer, confidence, sources });
    insertEvent({
      siteId: site.id,
      sessionId: session.id,
      conversationId: conversation.id,
      eventType: "answer_returned",
      payload: { confidence, intent: safetyRoute.intent, safety: true },
    });

    return {
      conversationId: conversation.id,
      answer,
      intent: safetyRoute.intent,
      confidence,
      topScore: 0,
      sources,
      leadCapture: { shouldAsk: false, nextQuestion: null },
      lead: { captured: false, score: 0 },
      debug: {
        answerMode: "safety_ai",
        llmAttempted: true,
        llmUsed: safetyLlmUsed,
        llmProvider: safetyLlm.provider,
        llmModel: safetyLlm.model,
        llmError: safetyLlm.error || null,
        llmRouterUsed: false,
        llmRouterError: null,
        retrievalQuery: message,
      },
      action: null,
      fallbackUsed: !safetyLlmUsed,
      responseTimeMs: Date.now() - responseStartedAt,
    };
  }

  const routerSystemPrompt = [
    "You are a routing assistant. Decide if external knowledge retrieval is needed to answer the user's message well.",
    "Return JSON only: { needsRetrieval: boolean, retrievalQuery: string | null }",
    "",
    "needsRetrieval = true for ANY of these:",
    "- questions about products, models, brands, specifications",
    "- questions about price, cost, budget",
    "- questions about installation, process, timeline",
    "- questions about subsidies or grants",
    "- questions about efficiency, COP, energy savings",
    "- any question that would benefit from factual information about heat pumps or air conditioning",
    "- when the user mentions a specific product type (vzduch-voda, zem-voda etc.)",
    "",
    "needsRetrieval = false ONLY for:",
    "- pure greetings (ahoj, dobrý deň)",
    "- very short follow-up answers to a direct question (áno, nie, ok, dobre)",
    "- user providing personal data only (name, email, phone, address)",
    "",
    "retrievalQuery: if needsRetrieval is true, write a specific Slovak search query that would find relevant information. If false, set to null.",
  ].join("\n");
  const routerInput = JSON.stringify(
    {
      messages: [
        ...previousMessages.slice(-6).map((item) => ({ role: item.role, content: item.content })),
        { role: "user", content: message },
      ],
    },
    null,
    2,
  );
  const routerLlm = await callLlmText({
    systemPrompt: routerSystemPrompt,
    prompt: routerInput,
    maxOutputTokens: 120,
    timeoutMs: Number.parseInt(process.env.LLM_ROUTER_TIMEOUT_MS || "5000", 10),
    responseMimeType: "application/json",
  });
  const route = parseRouterResponse(routerLlm.content);
  const wordCount = message.trim().split(/\s+/).length;
  const isObviousGreeting = /^(ahoj|čau|cau|hello|hi|hey|dobrý deň|zdravím|zdravim)$/i.test(message.trim());
  if (!isObviousGreeting && wordCount >= 3 && !route.needsRetrieval) {
    route.needsRetrieval = true;
    route.retrievalQuery = message;
  }
  const retrievalQuery = route.needsRetrieval ? route.retrievalQuery || message : null;

  let sources: ChatSource[] = [];
  let topScore = 0;
  let ragContext = "";

  if (route.needsRetrieval && retrievalQuery) {
    const knowledge = await loadKnowledge(knowledgePath);
    const retrieval = retrieveKnowledge(knowledge, retrievalQuery, 5);
    const topResults = retrieval.results.slice(0, 5);
    topScore = topResults[0]?.score.finalScore ?? 0;
    sources = topResults.slice(0, 3).map(sourceFromResult);
    ragContext = topResults
      .map((result, index) =>
        [
          `SOURCE ${index + 1}`,
          `Title: ${result.chunk.pageTitle}`,
          `Section: ${result.chunk.sectionHeading}`,
          `URL: ${result.chunk.url}`,
          `Text: ${(result.snippet || result.chunk.text).replace(/\s+/g, " ").slice(0, 1200)}`,
        ].join("\n"),
      )
      .join("\n\n");

    insertRetrievalEvent({
      conversationId: conversation.id,
      query: retrievalQuery,
      topScore,
      confidence: confidenceFromResult(topResults[0]),
      topSources: sources,
    });
    insertEvent({
      siteId: site.id,
      sessionId: session.id,
      conversationId: conversation.id,
      eventType: "retrieval_performed",
      payload: { query: retrievalQuery, topScore, results: sources.length },
    });
  }

  const composerSystemPrompt = [
    "Si predajný poradca pre Geotherm — slovenská firma predávajúca tepelné čerpadlá a klimatizácie. Vedeš prirodzený predajný rozhovor v slovenčine s tykávaním.",
    "",
    "Tvoja odpoveď má byť pekná, čitateľná a užitočná aj pre laika. Používaj čistý Markdown: krátky nadpis, zvýraznené dôležité slová a odrážky. Tabuľku použi iba vtedy, keď naozaj pomôže porovnať možnosti.",
    "",
    "Pri vecnej odpovedi vždy začni jedným Markdown nadpisom vo forme `### ...`. Nezačínaj vecnú odpoveď slovom Ahoj.",
    "",
    "Nepíš suchý súvislý text. Pri jednoduchej otázke použi krátky nadpis, 2–4 odrážky a jednu prirodzenú otázku na konci. Pri prehľadových otázkach sprav jasný mini-prehľad.",
    "",
    "Ak použiješ tabuľku, musí mať najviac 3 riadky a 2 stĺpce. Každá bunka musí byť krátka, maximálne jedna krátka veta. Nikdy nerob široké tabuľky ani dlhé texty v bunkách.",
    "",
    "Ak sa používateľ pýta „aké predávate“, „aké máte“, „aké typy“, „rozdiel“, „porovnaj“, „čo je lepšie“ alebo chce vybrať produkt, môžeš použiť krátku tabuľku, ale iba ak ostane prehľadná.",
    "",
    "Markdown nepreháňaj: žiadne dlhé články, žiadne marketingové frázy, žiadne zbytočné emoji. Odpoveď drž stručnú, zvyčajne do 120–180 slov, a vždy sa pýtaj maximálne jednu otázku.",
    "",
    "Vraciaš iba finálny Markdown text pre používateľa. Nikdy nevracaj JSON, objekt, escaped text s \\n, úvodzovky okolo celej odpovede ani nedokončenú vetu.",
    "",
    "Ak máš k dispozícii RAG kontext, použi ho ako poznatky na pozadí — informácie z neho zapracuj prirodzene do odpovede. Nekopíruj dlhé vety doslovne, ale môžeš z neho spraviť prehľad, odrážky alebo tabuľku.",
    "",
    "Čo vieš o tomto používateľovi:",
    JSON.stringify(previousState, null, 2),
    "",
    "Konverzácia do tej chvíle ti dáva kontext čo sa už povedalo. Nepýtaj sa na niečo čo už vieš alebo čo si sa už pýtal. Jedna otázka na konci, relevantná k tomu čo ešte nevieš.",
    "",
    "RAG kontext (použi ako poznatky, nekopíruj):",
    ragContext || "Žiadny.",
  ].join("\n");
  const composerInput = JSON.stringify(
    {
      messages: [
        ...previousMessages.map((item) => ({ role: item.role, content: item.content })),
        { role: "user", content: message },
      ],
    },
    null,
    2,
  );
  const composerLlm = await callLlmText({
    systemPrompt: composerSystemPrompt,
    prompt: composerInput,
    maxOutputTokens: 650,
    timeoutMs: Number.parseInt(process.env.LLM_ANSWER_TIMEOUT_MS || "10000", 10),
    responseMimeType: "text/plain",
  });
  const cleanedAnswer = cleanAnswerText(composerLlm.content);
  const answer = enforceMarkdownPresentation(isIncompleteAnswer(cleanedAnswer) ? fallbackCompleteAnswer(message, sources) : cleanedAnswer, message);
  const qualificationUpdate = await extractQualificationUpdate({
    userMessage: message,
    assistantAnswer: answer,
    currentState: previousState,
  });
  const nextState: QualificationState = {
    ...previousState,
    relevant_turns: (previousState.relevant_turns || 0) + 1,
  };
  const mergeIfMissing = <K extends keyof QualificationUpdate>(field: K): void => {
    if (nextState[field] === undefined || nextState[field] === null) {
      const value = qualificationUpdate[field];
      if (value !== undefined && value !== null) {
        nextState[field] = value as never;
      }
    }
  };
  mergeIfMissing("project_type");
  mergeIfMissing("property_type");
  mergeIfMissing("area_m2");
  mergeIfMissing("location");
  mergeIfMissing("timeline");
  mergeIfMissing("current_heating");

  if (!previousMessages.length) {
    insertEvent({
      siteId: site.id,
      sessionId: session.id,
      conversationId: conversation.id,
      eventType: "widget_opened",
      payload: { inferredFromFirstMessage: true, currentUrl: requestBody.currentUrl },
    });
  }
  insertEvent({
    siteId: site.id,
    sessionId: session.id,
    conversationId: conversation.id,
    eventType: "message_sent",
    payload: { currentUrl: requestBody.currentUrl, referrer: requestBody.metadata?.referrer, messageLength: message.length },
  });
  insertMessage({ conversationId: conversation.id, role: "user", content: message });
  insertEvent({
    siteId: site.id,
    sessionId: session.id,
    conversationId: conversation.id,
    eventType: "llm_router_decided",
    payload: {
      used: true,
      provider: routerLlm.provider,
      model: routerLlm.model,
      error: routerLlm.error || null,
      needsRetrieval: route.needsRetrieval,
      retrievalQuery,
    },
  });
  insertEvent({
    siteId: site.id,
    sessionId: session.id,
    conversationId: conversation.id,
    eventType: "llm_answer_composed",
    payload: {
      used: Boolean(composerLlm.content && !composerLlm.error),
      provider: composerLlm.provider,
      model: composerLlm.model,
      error: composerLlm.error || null,
      retrievalUsed: route.needsRetrieval,
    },
  });
  updateConversation(conversation.id, {
    intent: "unknown",
    qualificationStateJson: JSON.stringify(nextState),
  });
  insertMessage({ conversationId: conversation.id, role: "assistant", content: answer, confidence: "high", sources });
  insertEvent({
    siteId: site.id,
    sessionId: session.id,
    conversationId: conversation.id,
    eventType: "answer_returned",
    payload: { confidence: "high", intent: "unknown", retrievalUsed: route.needsRetrieval },
  });

  return {
    conversationId: conversation.id,
    answer,
    intent: "unknown",
    confidence: "high",
    topScore,
    sources,
    leadCapture: { shouldAsk: false, nextQuestion: null },
    lead: { captured: false, score: 0 },
    debug: {
      answerMode: route.needsRetrieval ? "rag_answer" : "general_chat",
      llmAttempted: true,
      llmUsed: Boolean(composerLlm.content && !composerLlm.error),
      llmProvider: composerLlm.provider,
      llmModel: composerLlm.model,
      llmError: composerLlm.error || null,
      llmRouterUsed: true,
      llmRouterError: routerLlm.error || null,
      retrievalQuery: retrievalQuery || message,
      contextTopic: null,
      contextCarried: false,
    },
    action: null,
    responseTimeMs: Date.now() - responseStartedAt,
  };
}

async function legacyCreateChatResponse(requestBody: ChatRequest, knowledgePath?: string): Promise<ChatResponse> {
  const responseStartedAt = Date.now();
  loadLocalEnv();
  const message = typeof requestBody.message === "string" ? requestBody.message.trim() : "";
  const sitePublicId = typeof requestBody.siteId === "string" ? requestBody.siteId.trim() : "";

  if (!message) throw new Error("message is required");
  if (message.length > 2000) throw new Error("message is too long");
  if (!sitePublicId) throw new Error("siteId is required");

  initDb();
  const site = getSiteByPublicId(sitePublicId);
  if (!site) throw new Error(`Unknown siteId: ${sitePublicId}`);

  const anonymousId = requestBody.anonymousId?.trim() || generatedAnonymousId();
  const session = upsertSession(site, anonymousId, requestBody.metadata?.userAgent);
  const conversation = getOrCreateActiveConversation(site, session);
  const previousMessages = getConversationMessages(conversation.id);
  const previousState = parseState(conversation.qualification_state_json);
  const safetyRoute = detectSafetyRoute(message);

  if (safetyRoute.triggered) {
    const confidence: "low" = "low";
    const sources: ChatSource[] = [];
    const topScore = 0;
    const structuredAnswer = structuredSafetyRouteAnswer(safetyRoute.reason, safetyRoute.followUp);
    const answer = renderStructuredAnswer(structuredAnswer, sources, "safety_fallback", { message, intent: safetyRoute.intent });
    const leadCapture = {
      shouldAsk: Boolean(safetyRoute.followUp),
      nextQuestion: safetyRoute.followUp,
    };
    const nextState = updateQualificationState(previousState, message, safetyRoute.intent);
    const finalState = applyLeadDecision(nextState, {
      shouldAsk: leadCapture.shouldAsk,
      nextQuestion: leadCapture.nextQuestion,
      mode: "informative",
      isContactRequest: false,
    });
    const score = leadScore(finalState, safetyRoute.intent);

    if (!previousMessages.length) {
      insertEvent({
        siteId: site.id,
        sessionId: session.id,
        conversationId: conversation.id,
        eventType: "widget_opened",
        payload: { inferredFromFirstMessage: true, currentUrl: requestBody.currentUrl },
      });
    }
    insertEvent({
      siteId: site.id,
      sessionId: session.id,
      conversationId: conversation.id,
      eventType: "message_sent",
      payload: { currentUrl: requestBody.currentUrl, referrer: requestBody.metadata?.referrer, messageLength: message.length },
    });
    insertMessage({ conversationId: conversation.id, role: "user", content: message });
    insertEvent({
      siteId: site.id,
      sessionId: session.id,
      conversationId: conversation.id,
      eventType: "safety_router_triggered",
      payload: { query: message, reason: safetyRoute.reason },
    });
    insertEvent({
      siteId: site.id,
      sessionId: session.id,
      conversationId: conversation.id,
      eventType: "fallback_triggered",
      payload: { query: message, topScore, reason: safetyRoute.reason },
    });
    updateConversation(conversation.id, {
      intent: safetyRoute.intent,
      qualificationStateJson: JSON.stringify(finalState),
    });
    insertMessage({ conversationId: conversation.id, role: "assistant", content: answer, confidence, sources });
    insertEvent({
      siteId: site.id,
      sessionId: session.id,
      conversationId: conversation.id,
      eventType: "answer_returned",
      payload: { confidence, intent: safetyRoute.intent, leadCaptured: false, safety: true },
    });

    return {
      conversationId: conversation.id,
      answer,
      intent: safetyRoute.intent,
      confidence,
      topScore,
      sources,
      leadCapture,
      lead: {
        captured: false,
        score,
      },
      debug: { answerMode: "safety_fallback", structuredAnswer, llmAttempted: false, llmUsed: false },
      action: null,
    };
  }

  const preRetrievalPolicy = classifyAnswerPolicy(message, "unknown");
  const skipRetrieval = preRetrievalPolicy.kind === "out_of_scope";
  if (skipRetrieval) {
    const intent: SalesIntent = "irrelevant";
    const confidence: "low" = "low";
    const sources: ChatSource[] = [];
    const topScore = 0;
    const nextState = updateQualificationState(previousState, message, intent);
    const leadCapture = { shouldAsk: false, nextQuestion: null };
    const finalState = applyLeadDecision(nextState, {
      shouldAsk: false,
      nextQuestion: null,
      mode: "informative",
      isContactRequest: false,
    });
    const score = leadScore(finalState, intent);

    if (!previousMessages.length) {
      insertEvent({
        siteId: site.id,
        sessionId: session.id,
        conversationId: conversation.id,
        eventType: "widget_opened",
        payload: { inferredFromFirstMessage: true, currentUrl: requestBody.currentUrl },
      });
    }
    insertEvent({
      siteId: site.id,
      sessionId: session.id,
      conversationId: conversation.id,
      eventType: "message_sent",
      payload: { currentUrl: requestBody.currentUrl, referrer: requestBody.metadata?.referrer, messageLength: message.length },
    });
    insertMessage({ conversationId: conversation.id, role: "user", content: message });
    insertEvent({
      siteId: site.id,
      sessionId: session.id,
      conversationId: conversation.id,
      eventType: "retrieval_skipped",
      payload: { reason: "out_of_scope" },
    });
    if (confidence === "low") {
      insertEvent({
        siteId: site.id,
        sessionId: session.id,
        conversationId: conversation.id,
        eventType: "fallback_triggered",
        payload: { query: message, topScore },
      });
    }

    const answerMode: AnswerMode = "out_of_scope";
    const fallbackStructured: StructuredAnswer = deterministicStructuredAnswer(message, [], confidence, intent, preRetrievalPolicy, {
      shouldAsk: false,
      nextQuestion: null,
      mode: "informative",
      isContactRequest: false,
    });
    const fallbackAnswer = renderStructuredAnswer(fallbackStructured, sources, answerMode, { message, intent });
    const shouldCallLlm = process.env.ARCIGY_LLM_ENABLED !== "false";
    const llm = shouldCallLlm
      ? await composeWithLlm({
          message,
          intent,
          confidence,
          answerMode,
          sources,
          previousMessages,
          qualificationState: finalState,
          leadCapture,
          retrievalUsed: false,
          policyKind: preRetrievalPolicy.kind,
          fallbackAnswer,
          lastAskedQuestion: previousState.last_asked_question,
        })
      : deterministicLlmResult(answerMode, fallbackAnswer, "deterministic_policy_skip");
    const structuredAnswer = structuredAnswerForLeadCapture(llm.structuredAnswer || fallbackStructured, leadCapture);
    const answer = renderStructuredAnswer(structuredAnswer, sources, llm.structuredAnswer ? llm.answerMode : answerMode, { message, intent });
    const persistedState = stateWithLastAskedQuestion(finalState, structuredAnswer);
    insertEvent({
      siteId: site.id,
      sessionId: session.id,
      conversationId: conversation.id,
      eventType: "llm_answer_composed",
      payload: {
        used: llm.used,
        provider: llm.provider,
        model: llm.model,
        error: llm.error || null,
        retrievalUsed: false,
        answerMode: llm.answerMode,
        structuredAnswer,
        validationErrors: llm.validationErrors || [],
        repaired: Boolean(llm.repaired),
      },
    });
    updateConversation(conversation.id, {
      intent,
      qualificationStateJson: JSON.stringify(persistedState),
    });
    insertMessage({ conversationId: conversation.id, role: "assistant", content: answer, confidence, sources });
    insertEvent({
      siteId: site.id,
      sessionId: session.id,
      conversationId: conversation.id,
      eventType: "answer_returned",
      payload: { confidence, intent, leadCaptured: false, llmUsed: llm.used },
    });

    return {
      conversationId: conversation.id,
      answer,
      intent,
      confidence,
      topScore,
      sources,
      leadCapture,
      lead: {
        captured: false,
        score,
      },
      debug: {
        answerMode: llm.structuredAnswer ? llm.answerMode : answerMode,
        structuredAnswer,
        llmAttempted: shouldCallLlm,
        llmUsed: llm.used,
        llmProvider: llm.provider,
        llmModel: llm.model,
        llmError: llm.error || null,
      },
      action: null,
    };
  }

  const fallbackRoute = deterministicRoutingPlan(message, previousMessages);
  const isShortReply = message.trim().length <= 20 && Boolean(previousState.last_asked_question);
  const isGreeting = !isShortReply && isGreetingMessage(message);
  if (isGreeting) {
    const intent: SalesIntent = "greeting";
    const confidence: "high" = "high";
    const sources: ChatSource[] = [];
    const topScore = 0;
    const answer = "Dobrý deň! Som poradca pre tepelné čerpadlá a klimatizácie Geotherm. Čím vám môžem pomôcť?";
    const leadCapture = { shouldAsk: false, nextQuestion: null };

    if (!previousMessages.length) {
      insertEvent({
        siteId: site.id,
        sessionId: session.id,
        conversationId: conversation.id,
        eventType: "widget_opened",
        payload: { inferredFromFirstMessage: true, currentUrl: requestBody.currentUrl },
      });
    }
    insertEvent({
      siteId: site.id,
      sessionId: session.id,
      conversationId: conversation.id,
      eventType: "message_sent",
      payload: { currentUrl: requestBody.currentUrl, referrer: requestBody.metadata?.referrer, messageLength: message.length },
    });
    insertMessage({ conversationId: conversation.id, role: "user", content: message });
    insertEvent({
      siteId: site.id,
      sessionId: session.id,
      conversationId: conversation.id,
      eventType: "retrieval_skipped",
      payload: { reason: "greeting_fast_path", routerUsed: false },
    });
    updateConversation(conversation.id, {
      intent,
      qualificationStateJson: JSON.stringify(previousState),
    });
    insertMessage({ conversationId: conversation.id, role: "assistant", content: answer, confidence, sources });
    insertEvent({
      siteId: site.id,
      sessionId: session.id,
      conversationId: conversation.id,
      eventType: "answer_returned",
      payload: { confidence, intent, leadCaptured: false, llmUsed: false, retrievalUsed: false },
    });

    return {
      conversationId: conversation.id,
      answer,
      intent,
      confidence,
      topScore,
      sources,
      leadCapture,
      lead: {
        captured: false,
        score: 0,
      },
      debug: {
        answerMode: "general_chat",
        llmAttempted: false,
        llmUsed: false,
        llmRouterUsed: false,
        llmRouterError: null,
        retrievalQuery: "",
        contextTopic: null,
        contextCarried: false,
      },
      action: null,
      responseTimeMs: Date.now() - responseStartedAt,
    };
  }
  const llmRoute = !isShortReply && shouldUseLlmRouter(message, fallbackRoute)
    ? await planRetrievalWithLlm({ message, previousMessages })
    : { used: false, error: null as string | null, decision: undefined };
  let routePlan = isShortReply
    ? {
        needsRetrieval: false,
        retrievalQuery: "",
        answerMessage: message,
        contextTopic: null,
        intentHint: fallbackRoute.intentHint,
        answerMode: "short_followup" as AnswerMode,
        confidence: "medium" as const,
        reason: "short_reply_to_last_question",
        contextCarried: true,
      }
    : mergeRoutingPlans(message, fallbackRoute, llmRoute.decision);
  const originalContact = extractContact(message);
  if (originalContact.email || originalContact.phone || routePlan.intentHint === "contact") {
    routePlan = {
      ...routePlan,
      needsRetrieval: true,
      retrievalQuery: routePlan.retrievalQuery || message,
      answerMessage: routePlan.answerMessage || message,
      intentHint: "contact",
      answerMode: "contact_intent",
    };
  }
  const retrievalQuery = routePlan.retrievalQuery || message;
  const answerMessage = routePlan.answerMessage || message;

  if (!routePlan.needsRetrieval) {
    const intent = routePlan.intentHint || (routePlan.answerMode === "out_of_scope" ? "irrelevant" : "unknown");
    const confidence = routePlan.answerMode === "out_of_scope" ? "low" : routePlan.confidence;
    const sources: ChatSource[] = [];
    const topScore = 0;
    const nextState = updateQualificationState(previousState, message, intent);
    const leadCapture = { shouldAsk: false, nextQuestion: null, mode: "informative" as const, isContactRequest: false };
    const finalState = applyLeadDecision(nextState, leadCapture);
    const score = leadScore(finalState, intent);

    if (!previousMessages.length) {
      insertEvent({
        siteId: site.id,
        sessionId: session.id,
        conversationId: conversation.id,
        eventType: "widget_opened",
        payload: { inferredFromFirstMessage: true, currentUrl: requestBody.currentUrl },
      });
    }
    insertEvent({
      siteId: site.id,
      sessionId: session.id,
      conversationId: conversation.id,
      eventType: "message_sent",
      payload: { currentUrl: requestBody.currentUrl, referrer: requestBody.metadata?.referrer, messageLength: message.length },
    });
    insertMessage({ conversationId: conversation.id, role: "user", content: message });
    insertEvent({
      siteId: site.id,
      sessionId: session.id,
      conversationId: conversation.id,
      eventType: "retrieval_skipped",
      payload: { reason: routePlan.reason, routerUsed: llmRoute.used, contextTopic: routePlan.contextTopic },
    });

    const answerMode = routePlan.answerMode === "rag_answer" ? "general_chat" : routePlan.answerMode;
    const fallbackStructured =
      answerMode === "general_chat"
          ? {
              shortAnswer: "Toto je chat k webu Geotherm a témam okolo vykurovania, chladenia a tepelných čerpadiel.",
              details: ["Vie ti pomôcť zorientovať sa v riešeniach pre dom, servise, dotáciách alebo cenovej orientácii."],
              followUpQuestion: "Čo chceš riešiť ako prvé?",
              shouldAskFollowUp: true,
              safetyNote: null,
              confidence,
            }
        : deterministicStructuredAnswer(answerMessage, [], confidence, intent, { kind: answerMode === "out_of_scope" ? "out_of_scope" : "normal" }, leadCapture);
    const fallbackAnswer = renderStructuredAnswer(fallbackStructured, sources, answerMode, { message: answerMessage, intent });
    const llm = await composeWithLlm({
      message: answerMessage,
      intent,
      confidence,
      answerMode,
      sources,
      previousMessages,
      qualificationState: finalState,
      leadCapture,
      retrievalUsed: false,
      policyKind: answerMode === "out_of_scope" ? "out_of_scope" : "normal",
      fallbackAnswer,
      lastAskedQuestion: previousState.last_asked_question,
    });
    const structuredAnswer = structuredAnswerForLeadCapture(llm.structuredAnswer || fallbackStructured, leadCapture);
    const answer = renderStructuredAnswer(structuredAnswer, sources, llm.structuredAnswer ? llm.answerMode : answerMode, { message: answerMessage, intent });
    const persistedState = stateWithLastAskedQuestion(finalState, structuredAnswer);

    insertEvent({
      siteId: site.id,
      sessionId: session.id,
      conversationId: conversation.id,
      eventType: "llm_answer_composed",
      payload: { used: llm.used, provider: llm.provider, model: llm.model, error: llm.error || null, retrievalUsed: false, answerMode: llm.answerMode },
    });
    updateConversation(conversation.id, {
      intent,
      qualificationStateJson: JSON.stringify(persistedState),
    });
    insertMessage({ conversationId: conversation.id, role: "assistant", content: answer, confidence, sources });
    insertEvent({
      siteId: site.id,
      sessionId: session.id,
      conversationId: conversation.id,
      eventType: "answer_returned",
      payload: { confidence, intent, leadCaptured: false, llmUsed: llm.used },
    });

    return {
      conversationId: conversation.id,
      answer,
      intent,
      confidence,
      topScore,
      sources,
      leadCapture: { shouldAsk: false, nextQuestion: null },
      lead: {
        captured: false,
        score,
      },
      debug: {
        answerMode: llm.structuredAnswer ? llm.answerMode : answerMode,
        structuredAnswer,
        llmAttempted: true,
        llmUsed: llm.used,
        llmProvider: llm.provider,
        llmModel: llm.model,
        llmError: llm.error || null,
        llmRouterUsed: llmRoute.used,
        llmRouterError: llmRoute.error || null,
        retrievalQuery,
        contextTopic: routePlan.contextTopic,
        contextCarried: routePlan.contextCarried,
      },
      action: null,
    };
  }

  const knowledge = await loadKnowledge(knowledgePath);
  let retrieval = retrieveKnowledge(knowledge, retrievalQuery, 5);
  if (routePlan.contextTopic && (!retrieval.results.length || (retrieval.results[0]?.score.finalScore || 0) < 14)) {
    retrieval = retrieveKnowledge(knowledge, routePlan.contextTopic, 5);
  }
  let intent = routePlan.intentHint || detectIntent(retrievalQuery, retrieval.results);
  const earlyNormalizedMessage = normalizePolicyText(answerMessage);
  if (
    earlyNormalizedMessage.includes("zere") ||
    earlyNormalizedMessage.includes("spotreb") ||
    earlyNormalizedMessage.includes("kolko stoji") ||
    earlyNormalizedMessage.includes("cena") ||
    earlyNormalizedMessage.includes("cenu") ||
    earlyNormalizedMessage.includes("cenov") ||
    earlyNormalizedMessage.includes("ponuk") ||
    earlyNormalizedMessage.includes("rozpocet") ||
    earlyNormalizedMessage.includes("naklad") ||
    earlyNormalizedMessage.includes("stoji")
  ) {
    intent = "quote";
  }
  const rawLowerMessage = answerMessage.toLowerCase();
  if (
    earlyNormalizedMessage.includes("kontakt") ||
    earlyNormalizedMessage.includes("najdem") ||
    (earlyNormalizedMessage.includes("kde") && earlyNormalizedMessage.includes("jdem")) ||
    earlyNormalizedMessage.includes("kde vas") ||
    earlyNormalizedMessage.includes("ako vas") ||
    rawLowerMessage.includes("nájdem") ||
    rawLowerMessage.includes("najdem")
  ) {
    intent = "contact";
  }
  let answerPolicy = classifyAnswerPolicy(answerMessage, intent);
  const normalizedMessage = earlyNormalizedMessage;
  if (
    answerPolicy.kind === "adversarial" ||
    (answerPolicy.kind === "ambiguous" && isVeryShortQuery(message)) ||
    (answerPolicy.kind === "ambiguous" && (normalizedMessage === "co odporucate" || normalizedMessage === "oplati sa to"))
  ) {
    intent = "unknown";
  }
  if (
    normalizedMessage.includes("kontakt") ||
    normalizedMessage.includes("najdem") ||
    (normalizedMessage.includes("kde") && normalizedMessage.includes("jdem")) ||
    rawLowerMessage.includes("nájdem") ||
    rawLowerMessage.includes("najdem")
  ) {
    intent = "contact";
    if (answerPolicy.kind === "ambiguous") answerPolicy = { kind: "normal" };
  }
  if (answerPolicy.kind === "ambiguous" && (previousState.relevant_turns || 0) >= 3) {
    answerPolicy = { kind: "normal" };
  }
  if (answerPolicy.kind === "ambiguous" && routePlan.contextCarried) {
    answerPolicy = { kind: "normal" };
  }
  const filteredResults = filterRetrievalResultsForAnswer(retrieval.results, answerMessage, intent);
  const topResult = filteredResults[0];
  const topScore = topResult?.score.finalScore || 0;
  let confidence = applyConfidencePolicy(answerMessage, confidenceFromResult(topResult), topScore, answerPolicy);
  if (
    intent === "contact" &&
    confidence === "low" &&
    topScore >= 20 &&
    retrieval.results.some((result) => normalizePolicyText(`${result.chunk.pageTitle} ${result.chunk.sectionHeading}`).includes("kontakt"))
  ) {
    confidence = "medium";
  }
  const sourceResults =
    answerPolicy.kind === "adversarial"
      ? []
      : intent === "contact"
        ? filteredResults.slice(0, 2)
        : confidence === "low"
          ? []
          : confidence === "medium"
            ? filteredResults.slice(0, 2)
            : filteredResults.slice(0, 3);
  const sources = sourceResults.map(sourceFromResult);
  const nextState = updateQualificationState(previousState, message, intent);
  const contact = extractContact(message);
  const leadCaptured = Boolean(contact.email || contact.phone);
  let leadCapture = nextLeadQuestion(nextState, intent, confidence);
  if (answerPolicy.kind === "out_of_scope" || answerPolicy.kind === "adversarial" || answerPolicy.kind === "sensitive") {
    leadCapture = { shouldAsk: false, nextQuestion: null, mode: nextState.assistant_mode || "informative", isContactRequest: false };
  } else if (answerPolicy.kind === "ambiguous" && answerPolicy.followUp) {
    leadCapture = { shouldAsk: true, nextQuestion: answerPolicy.followUp, mode: "informative", isContactRequest: false };
  } else {
    leadCapture = leadCapture.mode === "soft_handoff_offer" ? leadCapture : advisorFollowUp(answerMessage, intent, nextState, confidence) || leadCapture;
  }
  if (
    !leadCaptured &&
    intent !== "irrelevant" &&
    !nextState.soft_handoff_offered &&
    (nextState.relevant_turns || 0) >= 3 &&
    (nextState.area_m2 || nextState.location || nextState.project_type)
  ) {
    leadCapture = {
      shouldAsk: true,
      nextQuestion: softHandoffOfferQuestion(),
      mode: "soft_handoff_offer",
      isContactRequest: false,
    };
  }
  const finalState = leadCaptured ? nextState : applyLeadDecision(nextState, leadCapture);
  const score = leadScore(finalState, intent);
  if (!previousMessages.length) {
    insertEvent({
      siteId: site.id,
      sessionId: session.id,
      conversationId: conversation.id,
      eventType: "widget_opened",
      payload: { inferredFromFirstMessage: true, currentUrl: requestBody.currentUrl },
    });
  }
  insertEvent({
    siteId: site.id,
    sessionId: session.id,
    conversationId: conversation.id,
    eventType: "message_sent",
    payload: { currentUrl: requestBody.currentUrl, referrer: requestBody.metadata?.referrer, messageLength: message.length },
  });
  insertMessage({ conversationId: conversation.id, role: "user", content: message });
  insertRetrievalEvent({ conversationId: conversation.id, query: retrievalQuery, topScore, confidence, topSources: sources });
  insertEvent({
    siteId: site.id,
    sessionId: session.id,
    conversationId: conversation.id,
    eventType: "retrieval_performed",
    payload: { query: retrievalQuery, originalMessage: message, topScore, confidence, results: sources.length, routerUsed: llmRoute.used, contextTopic: routePlan.contextTopic },
  });
  if (answerPolicy.kind === "adversarial") {
    insertEvent({
      siteId: site.id,
      sessionId: session.id,
      conversationId: conversation.id,
      eventType: "prompt_injection_detected",
      payload: { query: message },
    });
  }

  if (confidence === "low") {
    insertEvent({
      siteId: site.id,
      sessionId: session.id,
      conversationId: conversation.id,
      eventType: "fallback_triggered",
      payload: { query: message, topScore },
    });
  }

  const answerMode = answerModeFromPolicy(answerPolicy, intent, confidence);
  const fallbackStructured = deterministicStructuredAnswer(answerMessage, filteredResults, confidence, intent, answerPolicy, leadCapture);
  const fallbackAnswer = renderStructuredAnswer(fallbackStructured, sources, answerMode, { message: answerMessage, intent });
  const shouldCallLlm = !["adversarial", "sensitive", "out_of_scope"].includes(answerPolicy.kind) && answerMode !== "low_confidence";
  const llm = shouldCallLlm
    ? await composeWithLlm({
        message: answerMessage,
        intent,
        confidence,
        answerMode,
        sources,
        previousMessages,
        qualificationState: finalState,
        leadCapture,
        retrievalUsed: sources.length > 0,
        policyKind: answerPolicy.kind,
        fallbackAnswer,
        lastAskedQuestion: previousState.last_asked_question,
      })
    : deterministicLlmResult(answerMode, fallbackAnswer, "deterministic_policy_skip");
  insertEvent({
    siteId: site.id,
    sessionId: session.id,
    conversationId: conversation.id,
    eventType: "llm_answer_composed",
    payload: {
      used: llm.used,
      provider: llm.provider,
      model: llm.model,
      error: llm.error || null,
      retrievalUsed: sources.length > 0,
      answerMode: llm.answerMode,
      structuredAnswer: llm.structuredAnswer || fallbackStructured,
      validationErrors: llm.validationErrors || [],
      repaired: Boolean(llm.repaired),
    },
  });

  const structuredAnswer = structuredAnswerForLeadCapture(
    leadCapture.mode === "soft_handoff_offer" && leadCapture.nextQuestion
      ? {
          ...(llm.structuredAnswer || fallbackStructured),
          followUpQuestion: leadCapture.nextQuestion,
          shouldAskFollowUp: true,
        }
      : llm.structuredAnswer || fallbackStructured,
    leadCapture,
  );
  let answer = renderStructuredAnswer(structuredAnswer, sources, llm.structuredAnswer ? llm.answerMode : answerMode, { message: answerMessage, intent });
  if (hasSubsidyDrift(answer, answerMessage, intent)) {
    const repairedStructured = deterministicStructuredAnswer(answerMessage, filteredResults, confidence, intent, answerPolicy, leadCapture);
    answer = renderStructuredAnswer(repairedStructured, sources, answerMode, { message: answerMessage, intent });
  }
  const persistedState = stateWithLastAskedQuestion(finalState, structuredAnswer);
  if (leadCaptured) {
    const transcript = getConversationMessages(conversation.id);
    const leadProfile =
      (await describeLeadWithLlm({
        messages: transcript,
        qualificationState: persistedState,
        intent,
        score,
      })) || fallbackLeadProfile({ messages: transcript, state: persistedState, intent, score });
    upsertLead({
      conversationId: conversation.id,
      siteId: site.id,
      name: persistedState.contact_name,
      email: persistedState.contact_email,
      phone: persistedState.contact_phone,
      projectType: persistedState.project_type,
      location: persistedState.location,
      timeline: persistedState.timeline,
      budget: undefined,
      intent,
      score,
      transcript: { messages: transcript, leadProfile },
    });
    updateConversation(conversation.id, {
      status: "lead_captured",
      intent,
      qualificationStateJson: JSON.stringify(persistedState),
    });
    insertEvent({
      siteId: site.id,
      sessionId: session.id,
      conversationId: conversation.id,
      eventType: "lead_captured",
        payload: { score, email: Boolean(persistedState.contact_email), phone: Boolean(persistedState.contact_phone) },
    });
    answer = [
      "### Mám to, ďakujem",
      "",
      "Odovzdám dopyt technikovi alebo obchodníkovi a priložím aj kontext z tejto konverzácie.",
      "",
      `**Zhrnutie pre tím:** ${leadProfile.description}`,
    ].join("\n");
  } else {
    updateConversation(conversation.id, {
      intent,
      qualificationStateJson: JSON.stringify(persistedState),
    });
    if (leadCapture.shouldAsk && leadCapture.nextQuestion && answerPolicy.kind !== "ambiguous") {
      insertEvent({
        siteId: site.id,
        sessionId: session.id,
        conversationId: conversation.id,
        eventType: "lead_question_asked",
        payload: { nextQuestion: leadCapture.nextQuestion, intent },
      });
    }
  }

  insertMessage({ conversationId: conversation.id, role: "assistant", content: answer, confidence, sources });
  insertEvent({
    siteId: site.id,
    sessionId: session.id,
    conversationId: conversation.id,
    eventType: "answer_returned",
    payload: { confidence, intent, leadCaptured },
  });

  return {
    conversationId: conversation.id,
    answer,
    intent,
    confidence,
    topScore,
    sources,
    leadCapture,
      lead: {
        captured: leadCaptured,
        score,
      },
      debug: {
        answerMode: llm.structuredAnswer ? llm.answerMode : answerMode,
        structuredAnswer,
        llmAttempted: shouldCallLlm,
        llmUsed: llm.used,
        llmProvider: llm.provider,
        llmModel: llm.model,
        llmError: llm.error || null,
        llmRouterUsed: llmRoute.used,
        llmRouterError: llmRoute.error || null,
        retrievalQuery,
        contextTopic: routePlan.contextTopic,
        contextCarried: routePlan.contextCarried,
      },
      action: null,
    };
}

function isChatRequest(value: unknown): value is ChatRequest {
  return Boolean(value && typeof value === "object" && "message" in value);
}

export async function startChatServer(options: StartOptions = {}): Promise<Server> {
  const port = options.port ?? Number.parseInt(process.env.CHAT_API_PORT || "4317", 10);
  const host = options.host ?? process.env.CHAT_API_HOST ?? "127.0.0.1";
  const knowledgePath = options.knowledgePath ?? defaultKnowledgePath;
  initDb();
  await loadKnowledge(knowledgePath);

  const server = createServer(async (request, response) => {
    const origin = request.headers.origin;

    if (request.method === "OPTIONS") {
      response.writeHead(204, corsHeaders(origin));
      response.end();
      return;
    }

    if (request.method === "GET" && request.url === "/health") {
      writeJson(response, 200, { ok: true }, origin);
      return;
    }

    if (request.method === "GET" && (request.url === "/" || request.url === "/preview" || request.url === "/embed-preview.html")) {
      if (!isPreviewEnabled()) {
        writeError(response, 404, "not_found", "Preview is disabled.", origin);
        return;
      }
      writePreviewPage(response);
      return;
    }

    if (request.method === "GET" && request.url && (await writeEmbedAsset(request.url, response))) {
      return;
    }

    if (request.method !== "POST" || request.url !== "/chat") {
      writeError(response, 404, "not_found", "Not found", origin);
      return;
    }

    try {
      const body = await readJsonBody(request);
      if (!isChatRequest(body)) {
        writeError(response, 400, "bad_request", "Request must include message.", origin);
        return;
      }

      const chatResponse = await createChatResponse(body, knowledgePath);
      writeJson(response, 200, chatResponse, origin);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const status = message.includes("Unknown siteId") || message.includes("required") || message.includes("too long") ? 400 : 500;
      writeError(response, status, status === 400 ? "bad_request" : "server_error", message, origin);
    }
  });

  await new Promise<void>((resolve) => {
    server.listen(port, host, resolve);
  });

  return server;
}

if (require.main === module) {
  startChatServer()
    .then((server) => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : process.env.CHAT_API_PORT || "4317";
      console.log(`Local chat API listening on http://127.0.0.1:${port}`);
      console.log("POST /chat");
    })
    .catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Chat server failed: ${message}`);
      process.exitCode = 1;
    });
}

