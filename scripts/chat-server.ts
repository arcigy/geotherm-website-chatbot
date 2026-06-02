import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { execFileSync } from "node:child_process";
import { createHmac, timingSafeEqual } from "node:crypto";
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
  getAdminConversation,
  getLeadById,
  getSiteByPublicId,
  initDb,
  insertEvent,
  insertMessage,
  insertRetrievalEvent,
  listAdminConversations,
  listOutreachItems,
  listRecentLeads,
  createOrUpdateOutreachItem,
  updateConversation,
  updateLeadById,
  updateOutreachItem,
  upsertLead,
  upsertSession,
  type LeadRecord,
  type OutreachRecord,
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
    reason?: string | null;
    requestedFields?: string[];
  };
  lead: {
    captured: boolean;
    score: number;
    id?: string | null;
    temperature?: string | null;
    status?: string | null;
    extractedContact?: {
      name?: string;
      email?: string;
      phone?: string;
    };
    missingFields?: string[];
    nextAction?: string | null;
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
    enrichedRetrievalQuery?: string;
    storedSlots?: Record<string, unknown>;
    rawUserMessage?: string;
    normalizedUserMessage?: string;
    newlyExtractedSlots?: Record<string, unknown>;
    inferredFromLastQuestion?: boolean;
    serviceType?: string;
    serviceIntent?: string;
    legacyIntent?: string;
    diagnosticFlowVersion?: string;
    serverCommit?: string;
    retrievalSourcesCount?: number;
    contextTopic?: string | null;
    contextCarried?: boolean;
    fallbackUsed?: boolean;
    fallbackType?: string | null;
    validatorsTriggered?: string[];
    bannedClaimsRemoved?: string[];
    questionRoundsCount?: number;
    closureGateTriggered?: boolean;
    closureReason?: string | null;
    directAnswerGateTriggered?: boolean;
    directAnswerReason?: string | null;
    directAnswerComposedByLlm?: boolean;
    directAnswerFallbackUsed?: boolean;
    recommendationOptions?: string[];
    remainingCriticalUnknowns?: string[];
    leadCapture?: {
      shouldAsk: boolean;
      reason: string | null;
      requestedFields: string[];
      nextQuestion: string | null;
    };
    lead?: {
      id: string | null;
      captured: boolean;
      score: number;
      temperature: string;
      status: string;
      extractedContact: Record<string, string>;
      missingFields: string[];
      nextAction: string | null;
    };
    outreach?: {
      created: boolean;
      priority: string | null;
      reason: string | null;
      id: string | null;
    };
    persistence?: {
      conversationSaved: boolean;
      leadSaved: boolean;
      outreachSaved: boolean;
    };
  };
  fallbackUsed?: boolean;
  action: null;
  responseTimeMs?: number;
};

type StartOptions = {
  port?: number;
  host?: string;
  knowledgePath?: string;
  rateLimit?: Partial<RateLimitConfig>;
  siteSignature?: Partial<SiteSignatureConfig>;
};

type RateLimitConfig = {
  enabled: boolean;
  windowMs: number;
  maxRequests: number;
};

type RateLimitBucket = {
  resetAt: number;
  count: number;
};

type SiteSignatureConfig = {
  enabled: boolean;
  secret: string | null;
  maxAgeMs: number;
};

type AnswerPolicy = {
  kind: "normal" | "ambiguous" | "adversarial" | "sensitive" | "out_of_scope";
  followUp?: string;
  sensitiveKind?: "roi" | "savings" | "subsidy" | "diy" | "price" | "best";
};

const defaultKnowledgePath = path.join(process.cwd(), "knowledge", "chatbot-knowledge.json");
const localOriginPattern = /^https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i;
const safetyFollowUp = "Ide o poruchu existujúceho zariadenia alebo plánujete novú montáž?";
const diagnosticFlowVersion = "diagnostic-v5-recommendation-closure";

let knowledgeCache: KnowledgeChunk[] | null = null;
let serverCommitCache: string | null = null;
const chatRateLimitBuckets = new Map<string, RateLimitBucket>();

const supplementalCompanyTruthTexts = [
  {
    id: "geotherm-company-truth-heat-pump-brands",
    heading: "Company truth: znacky tepelných cerpadiel",
    text: [
      "Pri tepelných cerpadlach komunikuj ako potvrdene a bezpecne portfoliove znacky najma NIBE a Vaillant.",
      "IVT komunikuj iba opatrne, ak je potvrdene v aktualnej ponuke alebo ako starsi/nejisty podklad.",
      "Daikin a Mitsubishi nekomunikuj ako aktivne portfoliove znacky tepelných cerpadiel Geotherm, pokial to nie je explicitne potvrdene aktualnym firemnym podkladom.",
      "Mitsubishi moze byt relevantne pri klimatizaciach iba vtedy, ak to potvrdzuje firemny podklad.",
      "Ak sa pouzivatel pyta, ci Geotherm robi Daikin alebo Mitsubishi pri tepelnom cerpadle, odpovedz, ze pri tepelných cerpadlach je bezpecne drzat sa potvrdenych znaciek NIBE a Vaillant a ostatne znacky treba overit podla aktualnej ponuky.",
    ].join(" "),
  },
  {
    id: "geotherm-company-truth-model-status",
    heading: "Company truth: aktualnost modelov tepelných cerpadiel",
    text: [
      "Konkretny model tepelneho cerpadla nesmie byt prezentovany ako finalne najlepsi bez technickeho navrhu.",
      "NIBE F2040 neponukaj ako aktualny odporucany model pre novu realizaciu; ak sa objavi v starsich podkladoch, ber ho ako archivny alebo historicky podklad.",
      "NIBE F2050 nepopisuj parametrami ani dostupnostou, ak nie je potvrdeny v aktualnej firemnej knowledge; povedz, ze aktualnu dostupnost a vhodnost treba overit.",
      "Pri NIBE a Vaillant mozes odporucat vyber z portfolia podla radiátorov, vykonu, teplej vody, technickej miestnosti a aktualnej ponuky.",
    ].join(" "),
  },
  {
    id: "geotherm-company-truth-price-scope",
    heading: "Company truth: ceny a rozsah dodavky",
    text: [
      "Pri cenach tepelných cerpadiel nepouzivaj presnu cenu ako garantovanu cenu bez potvrdeneho cennika alebo konkretnej ponuky.",
      "Vzdy rozlisuj cenu samotnej zostavy a kompletnu realizaciu vratane montaze, hydrauliky, regulacie, uvedenia do prevadzky, elektroprac, demontaze stareho kotla, TUV zasobnika a pripadnej akumulacnej nadrze.",
      "Ak sa pouzivatel pyta, ci je akumulacna nadrz v cene, odpovedz priamo: nie je bezpecne tvrdit, ze je zahrnuta automaticky; musi to byt uvedene v konkretnej ponuke.",
      "Pri staršom dome s radiatormi je 7000 eur skor podozrivo nizka hranica pre kompletnu realizaciu; treba overit, co presne cena obsahuje.",
    ].join(" "),
  },
  {
    id: "geotherm-company-truth-policies",
    heading: "Company truth: obchodne tvrdenia a obhliadka",
    text: [
      "Bez potvrdeneho firemneho podkladu netvrd, ze obhliadka je bezplatna alebo nezavazna.",
      "Pouzivaj neutralne formulacie: dohodnut obhliadku, preverit podklady, pripravit navrh, pripravit ponuku.",
      "Bez potvrdenia netvrd, ze firma servisuje cudzie montaze, vybavuje dotacie kompletne alebo odpocitava dotaciu z ceny.",
      "Ak firemny fakt chyba, povedz, ze ho treba potvrdit podla aktualnych podmienok firmy, ale nezablokuj vseobecnu technicku odpoved.",
      "Po dlhsej kvalifikacii alebo pri poziadavke na zhrnutie uz nepokracuj dalsim dotaznikom; zhrn bezpecny zaver a posun pouzivatela na konzultaciu, stretnutie alebo nacenenie.",
      "Pri kombinacii dotacia a servis povedz, ze dotacie sa bez konkretneho pravidla nespajaju so servisom existujuceho zariadenia; typicky sa riesia pri novej instalacii alebo vymene technologie.",
    ].join(" "),
  },
  {
    id: "geotherm-company-truth-contact",
    heading: "Company truth: kontakt a dalsi krok",
    text: [
      "Pouzi pri otazkach ako vas kontaktovat, kde vas najdem, kontakt, telefon, e-mail alebo kontaktny formular.",
      "Firemne podklady uvadzaju kontakt cez telefon +421 905 665 755 a e-mail sturdik@geotherm.sk a odporucaju osobne stretnutie dohodnut vopred.",
      "Pri technickom dopyte moze chatbot najprv ujasnit, ci ide o ponuku, servis, dotaciu alebo navrh riesenia; pri zbere kontaktu musi povedat, ze kontakt sa pouzije na spatne ozvanie k dopytu.",
    ].join(" "),
  },
  {
    id: "geotherm-company-truth-practical-faq",
    heading: "Company truth: prakticke FAQ potvrdene klientom",
    text: [
      "Klientom potvrdene prakticke odpovede: GEOTHERM robi havarijne vyjazdy u svojich zakaznikov.",
      "Prace je idealne planovat aspon 24 hodin vopred; v ojedinelych pripadoch vedia prist aj dnes, ale dostupnost terminu treba potvrdit.",
      "Cez vikendy zvacsa nerobia.",
      "Pracuju v mestach na zapadnom a strednom Slovensku a v pohranici Rakuska; konkretnu lokalitu treba potvrdit podla sluzby a terminu.",
      "Vedia vymenit aj plynovy kotol. Elektroinstalaciu ku kotlom robia obcas, no zakaznici si ju zvacsa zabezpecuju vlastnym elektrikarom.",
      "Maju certifikaciu na plynove zariadenia a maju poistenie zodpovednosti.",
      "Orientacna ponuka sa da pripravit aj podla dobrych a kvalitnych fotografii.",
      "Cez WhatsApp komunikovat vedia, ale preferuju email alebo telefon. Emailom komunikovat vedia.",
      "Beru zalohy a platba na fakturu je mozna.",
      "Rozdiel servis a montaz: montaz je navrh a instalacia noveho alebo meneneho riesenia; servis je diagnostika, oprava, nastavenie alebo udrzba existujuceho zariadenia.",
      "Cakacia doba na servis a termin technika sa musia potvrdit podla aktualnej kapacity, lokality a typu problemu.",
    ].join(" "),
  },
];

function supplementalCompanyTruthChunks(): KnowledgeChunk[] {
  return supplementalCompanyTruthTexts.map((item, index) => ({
    sourceType: "manual",
    sourceId: 900000 + index,
    pageTitle: "Geotherm company truth",
    url: `manual://geotherm/${item.id}`,
    slug: item.id,
    modified: "2026-05-28",
    sectionHeading: item.heading,
    chunkIndex: 0,
    text: item.text,
    textLength: item.text.length,
  }));
}

function serverCommit(): string {
  if (serverCommitCache) return serverCommitCache;
  serverCommitCache =
    process.env.GIT_COMMIT ||
    process.env.COMMIT_SHA ||
    process.env.SOURCE_VERSION ||
    (() => {
      try {
        return execFileSync("git", ["rev-parse", "--short", "HEAD"], { cwd: process.cwd(), encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
      } catch {
        return "unknown";
      }
    })();
  return serverCommitCache;
}

async function loadKnowledge(knowledgePath = defaultKnowledgePath): Promise<KnowledgeChunk[]> {
  if (!knowledgeCache) {
    knowledgeCache = [
      ...(JSON.parse(await readFile(knowledgePath, "utf8")) as KnowledgeChunk[]),
      ...supplementalCompanyTruthChunks(),
    ];
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
    "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Admin-Token, X-Arcigy-Site-Timestamp, X-Arcigy-Site-Signature",
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

function rateLimitConfig(overrides?: Partial<RateLimitConfig>): RateLimitConfig {
  const disabled = process.env.ARCIGY_RATE_LIMIT_DISABLED === "true";
  const windowMs = Number.parseInt(process.env.ARCIGY_RATE_LIMIT_WINDOW_MS || "", 10);
  const maxRequests = Number.parseInt(process.env.ARCIGY_RATE_LIMIT_MAX_REQUESTS || "", 10);
  return {
    enabled: overrides?.enabled ?? !disabled,
    windowMs: overrides?.windowMs ?? (Number.isFinite(windowMs) && windowMs > 0 ? windowMs : 60_000),
    maxRequests: overrides?.maxRequests ?? (Number.isFinite(maxRequests) && maxRequests > 0 ? maxRequests : 120),
  };
}

function siteSignatureConfig(overrides?: Partial<SiteSignatureConfig>): SiteSignatureConfig {
  const secret = overrides?.secret ?? process.env.ARCIGY_SITE_SIGNATURE_SECRET?.trim() ?? null;
  const configuredMaxAge = Number.parseInt(process.env.ARCIGY_SITE_SIGNATURE_MAX_AGE_MS || "", 10);
  return {
    enabled: overrides?.enabled ?? Boolean(secret),
    secret,
    maxAgeMs: overrides?.maxAgeMs ?? (Number.isFinite(configuredMaxAge) && configuredMaxAge > 0 ? configuredMaxAge : 15 * 60_000),
  };
}

function clientIp(request: IncomingMessage): string {
  const forwarded = request.headers["x-forwarded-for"];
  const value = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return value?.split(",")[0]?.trim() || request.socket.remoteAddress || "unknown";
}

function checkChatRateLimit(request: IncomingMessage, body: ChatRequest, config: RateLimitConfig): { allowed: boolean; retryAfterSeconds: number } {
  if (!config.enabled || config.maxRequests <= 0 || config.windowMs <= 0) return { allowed: true, retryAfterSeconds: 0 };
  const now = Date.now();
  const siteId = body.siteId?.trim() || "unknown-site";
  const anonymousId = body.anonymousId?.trim() || "anonymous";
  const key = `${siteId}:${anonymousId}:${clientIp(request)}`;
  const existing = chatRateLimitBuckets.get(key);

  if (!existing || existing.resetAt <= now) {
    chatRateLimitBuckets.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  if (existing.count <= config.maxRequests) return { allowed: true, retryAfterSeconds: 0 };
  return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)) };
}

function siteSignaturePayload(body: ChatRequest, origin: string | undefined, timestamp: string): string {
  return [body.siteId?.trim() || "", origin || "", timestamp].join("\n");
}

function expectedSiteSignature(secret: string, body: ChatRequest, origin: string | undefined, timestamp: string): string {
  return createHmac("sha256", secret).update(siteSignaturePayload(body, origin, timestamp)).digest("hex");
}

function safeEqualHex(left: string, right: string): boolean {
  try {
    const leftBuffer = Buffer.from(left, "hex");
    const rightBuffer = Buffer.from(right, "hex");
    return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
  } catch {
    return false;
  }
}

function verifySiteSignature(request: IncomingMessage, body: ChatRequest, origin: string | undefined, config: SiteSignatureConfig): boolean {
  if (!config.enabled) return true;
  if (!config.secret) return false;
  const timestamp = Array.isArray(request.headers["x-arcigy-site-timestamp"])
    ? request.headers["x-arcigy-site-timestamp"][0]
    : request.headers["x-arcigy-site-timestamp"];
  const signature = Array.isArray(request.headers["x-arcigy-site-signature"])
    ? request.headers["x-arcigy-site-signature"][0]
    : request.headers["x-arcigy-site-signature"];
  if (!timestamp || !signature) return false;
  const parsedTimestamp = Number.parseInt(timestamp, 10);
  if (!Number.isFinite(parsedTimestamp) || Math.abs(Date.now() - parsedTimestamp) > config.maxAgeMs) return false;
  return safeEqualHex(signature, expectedSiteSignature(config.secret, body, origin, timestamp));
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
      html,
      body {
        min-height: 100%;
        margin: 0;
        background: #fff;
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

function adminTokenConfigured(): string | null {
  return process.env.ADMIN_TOKEN?.trim() || null;
}

function isAdminRequestAuthorized(request: IncomingMessage): boolean {
  const token = adminTokenConfigured();
  if (!token) return false;
  const auth = request.headers.authorization || "";
  const bearer = auth.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  const headerToken = Array.isArray(request.headers["x-admin-token"]) ? request.headers["x-admin-token"][0] : request.headers["x-admin-token"];
  return bearer === token || headerToken === token;
}

function parseLimit(url: URL, fallback = 50): number {
  const parsed = Number.parseInt(url.searchParams.get("limit") || "", 10);
  return Number.isFinite(parsed) && parsed > 0 && parsed <= 500 ? parsed : fallback;
}

async function handleAdminRequest(request: IncomingMessage, response: ServerResponse, url: URL, origin?: string): Promise<boolean> {
  if (!url.pathname.startsWith("/admin/") && url.pathname !== "/webhooks/lead-created") return false;
  if (!adminTokenConfigured()) {
    writeError(response, 503, "admin_token_missing", "ADMIN_TOKEN is required for admin endpoints.", origin);
    return true;
  }
  if (!isAdminRequestAuthorized(request)) {
    writeError(response, 401, "unauthorized", "Admin token is required.", origin);
    return true;
  }

  if (request.method === "GET" && url.pathname === "/admin/conversations") {
    writeJson(response, 200, { items: listAdminConversations(parseLimit(url)) }, origin);
    return true;
  }
  const conversationMatch = url.pathname.match(/^\/admin\/conversations\/([^/]+)$/);
  if (request.method === "GET" && conversationMatch) {
    const detail = getAdminConversation(decodeURIComponent(conversationMatch[1]));
    if (!detail) writeError(response, 404, "not_found", "Conversation not found.", origin);
    else writeJson(response, 200, detail, origin);
    return true;
  }

  if (request.method === "GET" && url.pathname === "/admin/leads") {
    writeJson(response, 200, { items: listRecentLeads(parseLimit(url)) }, origin);
    return true;
  }
  const leadMatch = url.pathname.match(/^\/admin\/leads\/([^/]+)$/);
  if (leadMatch && request.method === "GET") {
    const lead = getLeadById(decodeURIComponent(leadMatch[1]));
    if (!lead) writeError(response, 404, "not_found", "Lead not found.", origin);
    else writeJson(response, 200, lead, origin);
    return true;
  }
  if (leadMatch && request.method === "PATCH") {
    const body = (await readJsonBody(request)) as Partial<LeadRecord>;
    const lead = updateLeadById(decodeURIComponent(leadMatch[1]), {
      status: typeof body.status === "string" ? body.status : undefined,
      owner: typeof body.owner === "string" ? body.owner : undefined,
      next_action: typeof body.next_action === "string" ? body.next_action : undefined,
      next_action_at: typeof body.next_action_at === "string" ? body.next_action_at : undefined,
      last_contacted_at: typeof body.last_contacted_at === "string" ? body.last_contacted_at : undefined,
      notes: typeof body.notes === "string" ? body.notes : undefined,
    });
    if (!lead) writeError(response, 404, "not_found", "Lead not found.", origin);
    else writeJson(response, 200, lead, origin);
    return true;
  }

  if (request.method === "GET" && url.pathname === "/admin/outreach") {
    writeJson(response, 200, { items: listOutreachItems(url.searchParams.get("status") || "open", parseLimit(url)) }, origin);
    return true;
  }
  const outreachMatch = url.pathname.match(/^\/admin\/outreach\/([^/]+)$/);
  if (outreachMatch && request.method === "PATCH") {
    const body = (await readJsonBody(request)) as Partial<OutreachRecord>;
    const item = updateOutreachItem(decodeURIComponent(outreachMatch[1]), {
      status: typeof body.status === "string" ? body.status : undefined,
      priority: typeof body.priority === "string" ? body.priority : undefined,
      suggested_action: typeof body.suggested_action === "string" ? body.suggested_action : undefined,
      due_at: typeof body.due_at === "string" ? body.due_at : undefined,
    });
    if (!item) writeError(response, 404, "not_found", "Outreach item not found.", origin);
    else writeJson(response, 200, item, origin);
    return true;
  }

  if (request.method === "POST" && url.pathname === "/webhooks/lead-created") {
    const body = await readJsonBody(request);
    writeJson(response, 202, { ok: true, accepted: true, payload: body }, origin);
    return true;
  }

  writeError(response, 404, "not_found", "Admin endpoint not found.", origin);
  return true;
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
    .replace(/\bnibee\b/g, "nibe")
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

const urgentServicePhone = "+421 905 665 755";

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
      (/\bchyb\w*\b/.test(text) && /(ako|mozem|môžem|mam|mám|sam|sám|oprav|reset|vymaz|odstran|odstráň)/.test(text)) ||
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

  if (!asksElectricConsumption && hasAny(["elektrik", "prud", "skrat", "poistk", "istic", "zapojit", "zapojim", "zapojenie", "kabel"])) {
    reason = "electrical_or_wiring";
  } else if (hasAny(["natlakovat", "pretlak"]) || (text.includes("tlak") && hasAny(["sam", "svojpomoc", "otvorit", "rozobrat", "nastavit"]))) {
    reason = "pressure";
  } else if (hasAny(["chladivo", "freon", "unik chladiva", "unika chladivo"])) {
    reason = "refrigerant";
  } else if (hasAny(["rozobra", "rozobrat", "rozoberat", "otvorit jednotku", "vonkajsiu jednotku"])) {
    reason = "disassembly";
  } else if (
    hasFaultOrLeakSignal() &&
    !(text.includes("stropne chladenie") && (text.includes("kondenz") || text.includes("kvapka")))
  ) {
    reason = "fault_or_leak";
  } else if (hasAny(["technicke nastavenie", "ako nastavit", "ako nastavim", "obist povinnu kontrolu", "ignorovat servis"])) {
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
    "napis ze ste najlepsi",
    "napis ze sme najlepsi",
    "najlepsi na slovensku",
    "najlepsia firma na slovensku",
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
    ["nechcem plyn", "plynovy kotol"],
    ["nechcem plyn", "plynovy"],
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
  if ((text.includes("urcite") || text.includes("iste") || text.includes("ista") || text.includes("isto")) && text.includes("dotac")) {
    return { kind: "sensitive", sensitiveKind: "subsidy" };
  }
  if (text.includes("garant") && text.includes("navratnost")) return { kind: "sensitive", sensitiveKind: "roi" };
  if ((text.includes("urcite") || text.includes("iste") || text.includes("ista") || text.includes("isto")) && text.includes("navratnost")) {
    return { kind: "sensitive", sensitiveKind: "roi" };
  }
  if (text.includes("garant") && text.includes("termin")) return { kind: "sensitive", sensitiveKind: "price" };
  if (text.includes("garant") && (text.includes("nikdy") || text.includes("nepokazi") || text.includes("zaruka") || text.includes("zaruku"))) {
    return { kind: "sensitive", sensitiveKind: "best" };
  }
  if (text.includes("sto rokov") || (text.includes("vydrz") && text.includes("sto"))) {
    return { kind: "sensitive", sensitiveKind: "best" };
  }
  if (text.includes("servis") && (text.includes("lacny") || text.includes("lacne") || text.includes("lacno") || text.includes("lacn"))) {
    return { kind: "sensitive", sensitiveKind: "price" };
  }
  if ((text.includes("kolko presne") || text.includes("presne")) && (text.includes("usetr") || text.includes("usetrit"))) {
    return { kind: "sensitive", sensitiveKind: "savings" };
  }
  if (text.includes("presne") && text.includes("navratnost")) {
    return { kind: "sensitive", sensitiveKind: "roi" };
  }
  if (text.includes("vzdy") && (text.includes("nizs") || text.includes("uct"))) {
    return { kind: "sensitive", sensitiveKind: "savings" };
  }
  if (text.includes("najlacnejsie") || text.includes("najlacnejsi") || text.includes("najlepsie") || text.includes("najlepsi") || text.includes("best") || text.includes("cheapest")) {
    return { kind: "sensitive", sensitiveKind: "best", followUp: "Je pre vas dolezitejsia cena, hlucnost, servisne zazemie alebo vhodnost pre konkretny dom?" };
  }
  if (text.includes("najtich") || text.includes("uplne nehluc") || text.includes("uplne tich")) {
    return { kind: "sensitive", sensitiveKind: "best", followUp: "Riesis hlucnost tepelneho cerpadla, klimatizacie alebo rekuperacie?" };
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
  if (/(vonkajs|vonkajsi|vonkajsej).*(jednotk)|pod oknom|umiestnenie jednotky/.test(text)) return confidence === "low" ? "low" : "medium";
  if (/(oplat|ma zmysel|dava zmysel)/.test(text)) return confidence === "low" ? "low" : "medium";
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
    text.includes("investovat") ||
    text.includes("pobocku v prahe") ||
    text.includes("pobocka v prahe") ||
    text.includes("praha") ||
    text.includes("prahe") ||
    text.includes("etf") ||
    text.includes("bitcoin") ||
    text.includes("hypotek") ||
    text.includes("interny rabat") ||
    text.includes("skladom vsetky") ||
    text.includes("cennik vsetkych") ||
    text.includes("vsetkych produktov") ||
    text.includes("kolko mate technikov") ||
    text.includes("ktory zakaznik") ||
    text.includes("presny termin") ||
    (text.includes("garant") && (text.includes("najnizsiu cenu") || text.includes("najnizsia cena") || text.includes("najlacnejsiu cenu")))
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
  const safeAnswer =
    mode === "out_of_scope"
      ? enforcedAnswer
      : augmentStructuredAnswer(enforcedAnswer, context);
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
    return ["### Cena závisí od konkrétneho riešenia", "", "Konkrétnu sumu by som bez parametrov domu nebral zodpovedne.", "", "| Čo cenu mení | Prečo je to dôležité |", "|---|---|", "| Typ objektu | Iné riešenie potrebuje byt, rodinný dom a firemný priestor. |", "| Tepelné straty | Od nich závisí výkon aj typ technológie. |", "| Rozsah prác | Montáž, úpravy systému, servisné nastavenie a zdroj tepla vedia cenu aj náklady výrazne zmeniť. |", "", "Najlepší ďalší krok je ponuka alebo konzultácia podľa konkrétneho domu a rozsahu prác.", ...followUp, ...evidence].join("\n");
  }
  if (policy.sensitiveKind === "best") {
    return ["### Najlepší model neexistuje bez kontextu", "", "Jeden univerzálne najlepší model by som nevybral zodpovedne. Pri výbere rozhoduje model, výkon, hlučnosť, servis, priestor a rozpočet.", "", "**Prakticky:** najprv treba vedieť, čo má systém riešiť a aké má dom parametre.", ...followUp, ...evidence].join("\n");
  }
  if (policy.sensitiveKind === "savings") {
    return ["### Úspora sa dá len odhadovať podľa domu", "", "Presnú ročnú úsporu by som negarantoval bez výpočtu pre konkrétny dom.", "", "Záleží na spotrebe, nastavení systému, nákladoch, cenách energií, kvalite návrhu, servise a rozsahu ponuky.", "", "Ak chceš reálny odhad, treba porovnať dnešné účty alebo spotrebu s navrhnutým riešením.", ...followUp, ...evidence].join("\n");
  }
  if (policy.sensitiveKind === "subsidy") {
    return ["### Dotáciu treba najprv overiť", "", "Dotáciu sa nedá garantovať dopredu.", "", "Záleží od pravidiel programu, oprávnenosti žiadateľa, dostupného rozpočtu, správnosti žiadosti a konkrétnej technológie. Dotácia môže znížiť výslednú cenu alebo náklady, ale servis existujúceho zariadenia sa s ňou nespája automaticky.", "", "Najlepší ďalší krok je overiť podmienky a pripraviť ponuku podľa konkrétneho riešenia.", ...followUp, ...evidence].join("\n");
  }
  if (policy.sensitiveKind === "diy") {
    return ["### Svojpomocne by som do toho nešiel", "", "Pri tepelnom čerpadle je dôležitý odborný návrh, odborná montáž a servis.", "", "Svojpomocná montáž môže pokaziť záruku, bezpečnosť, nastavenie aj náklady na prevádzku. Pri dotácii alebo ponuke sa zvyčajne rieši aj správny rozsah dodávky a montáže.", ...followUp, ...evidence].join("\n");
  }
  return ["### Návratnosť bez výpočtu negarantujem", "", "Návratnosť by som negarantoval bez konkrétneho výpočtu.", "", "Dá sa riešiť len orientačne podľa konkrétneho domu, spotreby, cien energií, nákladov, servisu, technického riešenia a kvality návrhu. Praktický ďalší krok je ponuka s jasným rozsahom.", ...followUp, ...evidence].join("\n");
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
    "tc",
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

function isPureSmallTalkMessage(message: string): boolean {
  const text = normalizePolicyText(message);
  if (/(tc|tepel|cerpad|klimatiz|rekuper|servis|dotac|cena|kontakt|montaz|kuren|chladen|vykurov|kotol|radiator|podlah|nibe|vaillant)/.test(text)) return false;
  return /^(ahoj|cau|hello|hi|hey|dobry den|dobry vecer|zdravim|ako sa mas|ako sa mate|ako sa ma|ako sa m|dakujem|vdaka|super|ok|kto si|co si zac)$/.test(text) ||
    /^(ahoj|cau|hello|hi|hey|dobry den|dobry vecer|zdravim)\s+(ako sa mas|ako sa mate|ako sa ma|ako sa m)$/.test(text);
}

function isLooseSmallTalkMessage(message: string): boolean {
  const text = normalizePolicyText(message);
  if (text.length > 60) return false;
  if (/(tc|tepel|cerpad|klimatiz|rekuper|servis|dotac|cena|kontakt|montaz|kuren|chladen|vykurov|kotol|radiator|podlah|nibe|vaillant)/.test(text)) return false;
  return /^(ahoj|cau|hello|hi|hey|dobry den|dobry vecer|zdravim)(\s+(ako sa mas|ako sa mate|ako sa ma|ako sa m))?$/.test(text) ||
    /^(ako sa mas|ako sa mate|ako sa ma|ako sa m)$/.test(text);
}

function pureSmallTalkFallback(message: string): StructuredAnswer {
  const text = normalizePolicyText(message);
  const shortAnswer =
    text.includes("ako sa mas") || text.includes("ako sa mate") || text === "ako sa ma" || text === "ako sa m"
      ? "Mám sa dobre, vďaka. Som tu, keď budeš chcieť s niečím pomôcť."
      : text.includes("dakujem") || text.includes("vdaka")
        ? "Rado sa stalo."
        : text === "ok" || text === "super"
          ? "Jasné."
          : text.includes("kto si") || text.includes("co si zac")
            ? "Som Geotherm chatbot a pomáham s orientáciou v technických riešeniach domu."
            : "Ahoj, som tu.";
  return { shortAnswer, details: [], followUpQuestion: null, shouldAskFollowUp: false, safetyNote: null, confidence: "high" };
}

function compactPureSmallTalkAnswer(answer: string, message: string): string {
  const fallback = pureSmallTalkFallback(message).shortAnswer;
  const cleaned = answer
    .replace(/^```(?:markdown|text)?\s*/i, "")
    .replace(/```$/i, "")
    .trim()
    .split(/\n+/)
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean)
    .find((line) => !line.includes("?"));
  if (!cleaned) return fallback;
  const firstSentence = cleaned.match(/^(.+?[.!…])(?:\s|$)/)?.[1] || cleaned;
  const compact = firstSentence.replace(/\s+/g, " ").replace(/\?+$/g, ".").trim();
  const normalizedMessage = normalizePolicyText(message);
  const normalizedCompact = normalizePolicyText(compact);
  if ((normalizedMessage.includes("ako sa mas") || normalizedMessage.includes("ako sa mate")) && !normalizedCompact.includes("dobre")) return fallback;
  if (/^(ahoj|cau|hello|hi|hey|dobry den|dobry vecer|zdravim)$/.test(normalizedMessage) && !normalizedCompact.includes("som tu")) return fallback;
  if (/(tepelne cerpad|klimatiz|rekuper|podlah|stropne chladen|servis|dotac|nacenen|ponuk)/.test(normalizedCompact)) return fallback;
  return compact.length > 120 ? `${compact.slice(0, 117).trim()}...` : compact || fallback;
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

function isGreetingOnlyMessage(message: string): boolean {
  const text = normalizePolicyText(message);
  if (!text) return false;
  if (["dobry den", "dobry vecer", "dobry rano", "zdravim", "hello", "hi", "hey"].includes(text)) return true;
  return /^(a+h+o+j+|c+a+u+|c+a+w+)$/.test(text);
}

function isSmallTalkMessage(message: string): boolean {
  const text = normalizePolicyText(message);
  return (
    isGreetingOnlyMessage(message) ||
    text.startsWith("ako sa ") ||
    /^(ako sa mas|ako sa mate|ako sa dari|co robis|co robite|si tu|fungujes|dakujem|vdaka|super|ok|okej)\??$/.test(text)
  );
}

function isContextualPriceFollowup(message: string): boolean {
  const text = normalizePolicyText(message);
  if (!text) return false;
  return /^(?:\?|a co|a čo|z coho|z čoho|co je v cene|čo je v cene|je to v cene|a akumulac|akumulac|vratane coho|vrátane čoho|bez montaze|bez montáže|s montazou|s montážou)\??$/.test(text);
}

function isContextualBrandModelFollowup(message: string): boolean {
  const text = normalizePolicyText(message);
  if (!text) return false;
  return /^(?:\?|a znacka|a značka|a model|aky model|aký model|a vaillant|a nibe|a split|split|a f2040|a f2050|co vaillant|čo vaillant|co nibe|čo nibe)\??$/.test(text);
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

type ServiceType =
  | "heat_pump"
  | "air_conditioning"
  | "heat_recovery"
  | "floor_heating"
  | "ceiling_cooling"
  | "service"
  | "subsidy"
  | "complex_solution"
  | "unknown";

type ServiceIntent =
  | "recommendation"
  | "price"
  | "service_fault"
  | "brand_model"
  | "location"
  | "subsidy"
  | "comparison"
  | "process"
  | "quote"
  | "inspection"
  | "contact"
  | "complaint_or_correction"
  | "general";

type ServiceRoute = {
  needsRetrieval: boolean;
  retrievalQuery: string | null;
  directAnswer: string | null;
  serviceType: ServiceType;
  serviceIntent: ServiceIntent;
};

const serviceTypes: ServiceType[] = [
  "heat_pump",
  "air_conditioning",
  "heat_recovery",
  "floor_heating",
  "ceiling_cooling",
  "service",
  "subsidy",
  "complex_solution",
  "unknown",
];

const serviceIntents: ServiceIntent[] = [
  "recommendation",
  "price",
  "service_fault",
  "brand_model",
  "location",
  "subsidy",
  "comparison",
  "process",
  "quote",
  "inspection",
  "contact",
  "complaint_or_correction",
  "general",
];

function normalizeServiceType(value: unknown, fallback: ServiceType): ServiceType {
  return serviceTypes.includes(value as ServiceType) ? (value as ServiceType) : fallback;
}

function normalizeServiceIntent(value: unknown, fallback: ServiceIntent): ServiceIntent {
  return serviceIntents.includes(value as ServiceIntent) ? (value as ServiceIntent) : fallback;
}

function serviceLabel(serviceType: ServiceType): string {
  switch (serviceType) {
    case "heat_pump":
      return "tepelné čerpadlá";
    case "air_conditioning":
      return "klimatizácie";
    case "heat_recovery":
      return "rekuperácia";
    case "floor_heating":
      return "podlahové kúrenie";
    case "ceiling_cooling":
      return "stropné chladenie";
    case "service":
      return "servis zariadení";
    case "subsidy":
      return "dotácie";
    case "complex_solution":
      return "komplexné technické riešenie domu";
    default:
      return "nejasná služba";
  }
}

function serviceSearchKeyword(serviceType: ServiceType): string {
  switch (serviceType) {
    case "heat_pump":
      return "service-card-heat-pump tepelne cerpadla";
    case "air_conditioning":
      return "service-card-air-conditioning klimatizacie";
    case "heat_recovery":
      return "service-card-heat-recovery rekuperacia vetranie";
    case "floor_heating":
      return "service-card-floor-heating podlahove kurenie";
    case "ceiling_cooling":
      return "service-card-ceiling-cooling stropne chladenie";
    case "service":
      return "service-card-service servis porucha";
    case "subsidy":
      return "service-card-subsidy dotacie";
    case "complex_solution":
      return "service-card-complex-house-solution komplexne technicke riesenie domu";
    default:
      return "service-router-rozpoznanie-sluzby";
  }
}

function inferServiceRoute(message: string, state: QualificationState, history: Array<{ role: string; content: string }>): Pick<ServiceRoute, "serviceType" | "serviceIntent"> {
  const text = normalizePolicyText(message);
  const tokenCount = text.split(/\s+/).filter(Boolean).length;
  const previousService = normalizeServiceType(state.service_type, "unknown");
  const previousIntent = normalizeServiceIntent(state.service_intent, "general");
  const heatPumpAbbreviation = /\btc\b/.test(text) || /\b(?:chcem|riesim|potrebujem|mam|mame|ake|mate|robite|montujete|predavate)\s+t\b/.test(text);
  const outdoorUnitPlacement = /(vonkajs|vonkajsi|vonkajsej).*(jednotk)|pod oknom|umiestnenie jednotky/.test(text);
  const hasExplicitServiceSignal =
    heatPumpAbbreviation ||
    outdoorUnitPlacement ||
    /(tepelne cerpad|heat pump|cerpadl|klimatiz|rekuper|vetran|podlahov|strop.*chladen|servis|porucha|dotac|subsidy|poukaz|prispev|plyn|plynov|kotol|radiator|vykurov|kurenie|topeni|topenie)/.test(text);
  const slotOnlyReply =
    !hasExplicitServiceSignal &&
    previousService !== "unknown" &&
    (tokenCount <= 5 ||
      /^\s*(?:\d+\.\s*[^,;\n]+[,;\n\s]*){1,4}$/i.test(message.trim()) ||
      /^(ano|áno|nie|nemam|nemám|neviem|bratislava|kosice|košice|trnava|nitra|zilina|žilin)/i.test(text));
  const recentUserText = history
    .filter((item) => item.role === "user")
    .slice(-4)
    .map((item) => normalizePolicyText(item.content))
    .join(" ");
  const combined = `${recentUserText} ${text}`.trim();
  const boilerOnly = isBoilerOnlyQuestion(text);
  const complexHeatingSignal = /(kuren|vykurov|topen|podlahov|tepelne cerpad|cerpadl|kotol)/.test(combined);
  const complexVentilationSignal = /(vetran|rekuper|vzduch)/.test(combined);
  const complexCoolingSignal = /(chladen|klimatiz|klima|strop.*chladen)/.test(combined);
  const complexSignalCount = [complexHeatingSignal, complexVentilationSignal, complexCoolingSignal].filter(Boolean).length;
  const complexSolutionSignal =
    /(vyber.*riesen|poradit.*riesen|vhodn.*riesen)/.test(text) ||
    (complexHeatingSignal && complexVentilationSignal && complexCoolingSignal) ||
    (complexSignalCount >= 2 && /(novostav|cely system|cel[ey] dom|usporn[ey] riesenie|technicke riesenie|komplex|spolu|\baj\b)/.test(combined));
  const serviceType: ServiceType =
    slotOnlyReply
      ? previousService
      : /(servis|porucha|chyba|diagnostik|revizi|udrzb|údržb|nekuri|nefunguje|hlasi|hlási|tlak|huci|hučí|hluk|hlucnost)/.test(text)
      ? "service"
      : /(dotac|subsidy|poukazk|prispevok|zelen[ae] domacnost)/.test(text)
        ? "subsidy"
        : complexSolutionSignal
          ? "complex_solution"
        : (/(klimatiz|klima|split|multisplit)/.test(text) ||
          (!/(strop|podlah|rekuper|vetran|kuren|vykurov|tepelne cerpad|cerpadl)/.test(text) && /(chladen|chladit|chladiť)/.test(text)))
          ? "air_conditioning"
          : /(strop|strp).*(chladen|vykurov|kuren)|chlad.*strop/.test(text)
            ? "ceiling_cooling"
            : /(rekuper|vetran|vydychany|vzduch)/.test(text)
              ? "heat_recovery"
              : /(podlahov|podlahu|podlahove kurenie)/.test(text) && !/(cerpadl|tepel|\btc\b)/.test(combined)
                ? "floor_heating"
                : boilerOnly
                  ? "complex_solution"
                : outdoorUnitPlacement || heatPumpAbbreviation || /(tepelne cerpad|heat pump|cerpad|vzduch voda|zem voda|voda voda|nibe|vaillant|plyn|plynov|radiator|vykurov|kurenie|topeni|topenie|kotol)/.test(text)
                  ? "heat_pump"
                  : complexSolutionSignal
                  ? "complex_solution"
                  : /\btc\b/.test(combined) || /(tepelne cerpad|heat pump|cerpad|vzduch voda|zem voda|voda voda|nibe|vaillant|plyn|plynov|radiator|vykurov|kurenie|topeni|topenie|kotol)/.test(combined)
                    ? "heat_pump"
                    : previousService !== "unknown" && text.split(/\s+/).filter(Boolean).length <= 4
                      ? previousService
                      : "unknown";

  const serviceIntent: ServiceIntent =
    slotOnlyReply && previousIntent !== "general"
      ? previousIntent
      : isServiceAreaQuestion(message) || /(pridete|chodite|dojdete|vyjazd|lokalit|mesto|okres|som z|sme z|v bratislave|v kosiciach)/.test(text)
      ? "location"
      : /(kontakt|kontaktovat|telefon|email|e-mail|ako vas|kde vas|najdem)/.test(text)
        ? "contact"
      : /(cena|cenu|cennik|kolko|koľko|stoji|stojí|rozpocet|rozpočet|ponuk)/.test(text)
        ? "price"
        : /(porucha|chyba|nekuri|nefunguje|hlasi|hlási|diagnostik|servis|tlak|huci|hučí|hluk|hlucnost)/.test(text)
          ? "service_fault"
          : /(dotac|subsidy|poukazk|prispevok)/.test(text)
            ? "subsidy"
            : /(najleps|najlepší|odporuc|odporúč|ake potrebujem|aky potrebujem|vybrat|výber|chcem|riesim|riešim)/.test(text)
              ? "recommendation"
            : /(znack|model|nibe|vaillant|mitsubishi|daikin|ktore|ake.*\btc\b|ak[eé] mate|predavate|montujete)/.test(text)
              ? "brand_model"
              : /(rozdiel|porovn|lepsie|lepšie|vs|verzus)/.test(text)
                ? "comparison"
                : outdoorUnitPlacement || /(ako dlho|ako prebieha|postup|proces|realizacia|montaz|instalacia)/.test(text)
                  ? "process"
                  : /(odporuc|odporúč|ake potrebujem|aky potrebujem|vybrat|výber|chcem|riesim|riešim)/.test(text)
                    ? "recommendation"
                    : normalizeServiceIntent(state.service_intent, "general");

  return { serviceType, serviceIntent };
}

function mapServiceIntentToSalesIntent(serviceType: ServiceType, serviceIntent: ServiceIntent): SalesIntent {
  if (serviceIntent === "price" || serviceIntent === "quote") return "quote";
  if (serviceIntent === "contact" || serviceIntent === "inspection") return "contact";
  if (serviceIntent === "service_fault" || serviceType === "service") return "service";
  if (serviceIntent === "subsidy" || serviceType === "subsidy") return "subsidy";
  if (serviceIntent === "location" || serviceIntent === "process") return "installation";
  if (serviceType === "unknown" && serviceIntent === "general") return "unknown";
  return "product";
}

function isPersonalDataOnly(message: string): boolean {
  const text = normalizePolicyText(message);
  return (
    /^[+\d\s().-]{7,}$/.test(message.trim()) ||
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(message.trim()) ||
    /^(volam sa|meno je|som)\s+[a-z]+(?:\s+[a-z]+)?$/.test(text)
  );
}

function isShortContextReply(message: string): boolean {
  const text = normalizePolicyText(message);
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return wordCount <= 4 && !isGreetingOnlyMessage(message) && !isPersonalDataOnly(message);
}

function isClarificationOnlyMessage(message: string): boolean {
  const trimmed = message.trim();
  const text = normalizePolicyText(message);
  return /^[?!.\s]{1,4}$/.test(trimmed) || /^(co|čo|ako|nerozumiem|nechapem|nechápem)\??$/.test(text);
}

function isQualificationDataReply(message: string): boolean {
  const text = normalizePolicyText(message);
  return /(novostav|starsi|starší|\b\d+\s*(?:m2|m|osob)|podlah|radiator|radiátor|chladen|tuv|tepla voda|teplá voda|zateplen|drevo|plyn|kotol|ano planujem|áno plánujem)/.test(text);
}

function serviceCardSummary(serviceType: ServiceType): string {
  const common = [
    "Globálne pravidlo: najprv rozpoznaj službu a zámer, potom daj predbežný verdikt, dôvod, typický rozsah, čo treba overiť a najviac 1-2 ďalšie otázky.",
    "Firemné fakty: kompletná realizácia od návrhu po montáž je potvrdená. Následný servis áno, ale servis cudzích montáží nie je potvrdený. Obhliadka bezplatná/nezáväzná nie je potvrdená. Dotácie komunikuj ako pomoc/asistenciu. NIBE a Vaillant sú bezpečné značky tepelných čerpadiel; IVT je neisté. Servisované značky: NIBE, Vaillant, STIEBEL ELTRON. Daikin pri tepelných čerpadlách nespomínaj; Mitsubishi skôr pri klimatizáciách.",
  ];
  const cards: Record<ServiceType, string> = {
    heat_pump:
      "Service card tepelné čerpadlá: minimálne údaje pre verdikt sú novostavba/existujúci dom, plocha a radiátory/podlahovka. Novostavba + podlahovka = predbežne vzduch-voda pre nízkoteplotné kúrenie; ďalej sa pýtaj najmä na počet osôb, teplú vodu a chladenie. Pri novostavbe sa nepýtaj na ročnú spotrebu ako hlavný údaj. Po closure už nepýtaj projekt, energetický certifikát ani tepelnú stratu ako ďalší krok; uzavri odporúčanie a posuň zákazníka na konzultáciu/nacenenie. Starší dom + radiátory = riešenie vhodné pre radiátory, overiť teplotu vody, veľkosť radiátorov, aktuálne kúrenie a spotrebu.",
    air_conditioning:
      "Service card klimatizácie: minimálne údaje sú počet miestností, približná plocha a byt/dom. Pri viacerých miestnostiach predbežne samostatné jednotky alebo multisplit podľa dispozície a vonkajšej jednotky. Nemiešaj to s tepelnými čerpadlami vzduch-voda.",
    heat_recovery:
      "Service card rekuperácia: minimálne údaje sú novostavba/rekonštrukcia, plocha alebo počet miestností a či ide o celý dom. Pri novostavbe je najlepšie riešiť centrálnu rekuperáciu už v projekte. Pri rekonštrukcii rozlišuj centrálne a lokálne možnosti.",
    floor_heating:
      "Service card podlahové kúrenie: minimálne údaje sú novostavba/rekonštrukcia, plocha a zdroj tepla. Pri novostavbe je vhodné pre nízkoteplotné systémy a tepelné čerpadlo. Pri rekonštrukcii treba overiť skladbu podlahy a stavebné možnosti.",
    ceiling_cooling:
      "Service card stropné chladenie: minimálne údaje sú novostavba/rekonštrukcia, rozsah chladenia a projekt. Je komfortné a skryté, ale musí byť navrhnuté projektovo s reguláciou a vlhkosťou. Nesľubuj, že automaticky nahradí klimatizáciu bez projektu.",
    service:
      "Service card servis: minimálne údaje sú značka, model alebo fotka štítku, chybový kód/problém a lokalita. Pri poruche si vypýtaj servisné údaje a neposkytuj nebezpečné technické návody. Servis cudzích montáží treba potvrdiť.",
    subsidy:
      "Service card dotácie: minimálne údaje sú zariadenie, rodinný dom/iný objekt a nová realizácia/výmena. Podmienky sa menia, preto nehovor garancie. Komunikuj pomoc/asistenciu, nie kompletné vybavenie ani odpočítanie z ceny bez potvrdenia.",
    complex_solution:
      "Service card komplexné riešenie domu: použi pri novostavbe alebo keď zákazník rieši kúrenie, chladenie, vetranie a teplú vodu spolu. Predbežný smer je riešiť systém ako celok, aby sa technológie nebili medzi sebou. Pýtaj sa na projekt, plochu, čo všetko chce riešiť a lokalitu.",
    unknown:
      "Service card nejasné: najprv zisti, či zákazník rieši kúrenie, chladenie, vetranie, servis, dotáciu alebo celé technické riešenie domu. Daj krátky smer, nepodsúvaj tepelné čerpadlo nasilu.",
  };
  return [...common, cards[serviceType]].join("\n");
}

function buildStateSignals(state: QualificationState): string[] {
  return [
    state.service_type ? `služba ${serviceLabel(normalizeServiceType(state.service_type, "unknown"))}` : null,
    state.service_intent ? `zámer ${state.service_intent}` : null,
    state.project_type ? `projekt ${state.project_type}` : null,
    state.property_type ? `objekt ${state.property_type}` : null,
    state.area_m2 ? `plocha ${state.area_m2} m2` : null,
    state.heating_distribution ? `vykurovanie ${state.heating_distribution}` : null,
    state.current_heating ? `aktuálne kúrenie ${state.current_heating}` : null,
    state.annual_consumption ? `spotreba ${state.annual_consumption}` : null,
    state.annual_consumption_unknown ? "ročná spotreba nie je známa" : null,
    state.own_wood ? "zákazník má vlastné drevo" : null,
    state.insulation ? `zateplenie ${state.insulation}` : null,
    state.heat_loss_known === false ? "tepelná strata alebo odhad nie je k dispozícii" : null,
    state.heat_loss_known === true ? "má tepelnú stratu alebo energetický odhad" : null,
    state.occupants ? `počet osôb ${state.occupants}` : null,
    state.occupants ? `zásobník TÚV pre ${state.occupants} osôb` : null,
    state.hot_water || state.occupants ? "rieši teplú vodu TÚV" : null,
    state.wants_cooling ? "rieši chladenie" : null,
    state.location ? `lokalita ${state.location}` : null,
    state.timeline ? `termín ${state.timeline}` : null,
  ].filter((value): value is string => Boolean(value));
}

function debugStoredSlots(state: QualificationState): Record<string, unknown> {
  const slots: Record<string, unknown> = {};
  for (const key of qualificationUpdateFields) {
    const value = state[key];
    if (value !== undefined && value !== null && value !== "") slots[key] = value;
  }
  return slots;
}

function debugQualificationUpdate(update: QualificationUpdate): Record<string, unknown> {
  const slots: Record<string, unknown> = {};
  for (const key of qualificationUpdateFields) {
    const value = update[key];
    if (value !== undefined && value !== null && value !== "") slots[key] = value;
  }
  return slots;
}

function scenarioSearchKeywords(state: QualificationState): string[] {
  const normalizedProject = normalizePolicyText(state.project_type || "");
  const normalizedDistribution = normalizePolicyText(state.heating_distribution || "");
  const terms: string[] = [];
  if (normalizedProject.includes("novostav") && normalizedDistribution.includes("podlah")) {
    terms.push("scenar-novostavba-podlahove-kurenie novostavba podlahove kurenie nizkoteplotne vzduch-voda");
  }
  if (normalizedProject.includes("rekon") && normalizedDistribution.includes("radiator")) {
    terms.push("scenar-starsi-dom-radiatory-plyn radiatorovy system vyssia teplota vody");
  }
  if (normalizedDistribution.includes("radiator") && normalizePolicyText(state.current_heating || "").includes("tuhe palivo")) {
    terms.push("scenar-vymena-kotla-na-drevo tuhe palivo radiatory akumulacna nadrz tepelne cerpadlo vzduch-voda");
  }
  if (state.wants_cooling) {
    terms.push("scenar-kurenie-aj-chladenie chladenie cez tepelne cerpadlo stropne chladenie fancoily podlahove chladenie rosny bod");
  }
  if (state.occupants) {
    terms.push(`zasobnik TUV tepla voda pocet osob ${state.occupants}`);
  }
  if (state.heat_loss_known === false) {
    terms.push("projekt energeticky certifikat tepelna strata chyba odhad vykonu");
  }
  return terms;
}

function buildContextualRetrievalQuery(input: {
  message: string;
  route: ServiceRoute;
  state: QualificationState;
  previousMessages: Array<{ role: string; content: string }>;
}): { query: string; contextCarried: boolean } {
  if (isServiceAreaQuestion(input.message)) return { query: serviceAreaRetrievalQuery, contextCarried: true };
  const recentUserMessages = input.previousMessages
    .filter((item) => item.role === "user")
    .slice(-4)
    .map((item) => item.content.replace(/\s+/g, " ").trim())
    .filter((item) => item && !isGreetingOnlyMessage(item));
  const signals = buildStateSignals(input.state);
  const baseQuery = [
    "service router verdict gate",
    serviceSearchKeyword(input.route.serviceType),
    serviceLabel(input.route.serviceType),
    input.route.serviceIntent,
    ...scenarioSearchKeywords(input.state),
    ...signals,
    ...recentUserMessages,
    input.message,
  ]
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  return { query: baseQuery.slice(0, 700), contextCarried: signals.length > 0 || recentUserMessages.length > 0 };
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

function isServicesOverviewQuestion(message: string): boolean {
  const text = normalizePolicyText(message);
  return /(ake sluzby|ake služby|sluzby poskytujete|služby poskytujete|co robite|čo robíte|comu sa venujete|čomu sa venujete)/.test(text);
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

function isPracticalCompanyQuestionThatSkipsServiceFaultTemplate(message: string): boolean {
  const text = normalizePolicyText(message);
  return (
    isContactQuestion(message) ||
    /(nechcem|nedam|nedám).*(email|mail)/.test(text) ||
    /(cakacia|čakacia|cakat|čakať|ako dlho).*(servis|technik|vyjazd|výjazd)|(?:servis|technik|vyjazd|výjazd).*(cakacia|čakacia|cakat|čakať|ako dlho)/.test(text) ||
    /servis.*mont|mont.*servis/.test(text) ||
    /(preco|prečo).*(stale|stále).*(pytate|pýtate)|\bzhr|to je cele|to je celé/.test(text) ||
    /\bdot.*servis|(?:servis).*\bdot/.test(text) ||
    (!/(oplat|ma zmysel|cena|servis|dotac|montaz|porucha|problem|huci|hluci)/.test(text) &&
      (/^(som|sme)\s+v\s+[a-z-]{3,}(?:\s+[a-z-]{3,})?$/.test(text) || /^(som|sme)\s+(pri|z|zo)\s+[a-z-]{3,}(?:\s+[a-z-]{3,})?$/.test(text))) ||
    (!/(kotol|kotla|kotlov|kotly)/.test(text) && /(robite|robíte).*(servis|montaz|montáž)|(?:servis|montaz|montáž).*(robite|robíte)/.test(text))
  );
}

function limitFinalQuestionMarks(answer: string): { answer: string; changed: boolean } {
  const matches = answer.match(/\?/g) || [];
  if (matches.length <= 1) return { answer, changed: false };
  let keptLastQuestion = false;
  let next = "";
  for (let index = answer.length - 1; index >= 0; index -= 1) {
    const char = answer[index];
    if (char === "?") {
      if (!keptLastQuestion) {
        keptLastQuestion = true;
        next = `${char}${next}`;
      } else {
        next = `.${next}`;
      }
      continue;
    }
    next = `${char}${next}`;
  }
  return { answer: next.replace(/\s+\./g, ".").replace(/\.{2,}/g, ".").trim(), changed: true };
}

const serviceAreaRetrievalQuery =
  "Kvalitné vykurovanie tepelné čerpadlo prídeme nainštalovať do týchto okresov Geotherm pôsobnosť mestá okresy";

function isServiceAreaQuestion(message: string): boolean {
  const text = normalizePolicyText(message);
  const hasVisitIntent = [
    "pridete",
    "prist",
    "dojdete",
    "chodite",
    "vyjazd",
    "obhliad",
    "servis",
    "montaz",
    "namont",
    "nainstal",
    "instalac",
    "spravit",
    "urobit",
    "realizac",
  ].some((term) => text.includes(term));
  const hasLocationSignal =
    /\b(som|sme|byvam|byvame|nachadzam|nachadzame)\s+(z|zo|v|vo)\s+[a-z]/.test(text) ||
    /\b(do|v|vo)\s+[a-z][a-z\s-]{2,}/.test(text);
  return hasVisitIntent && hasLocationSignal;
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
    if (text.includes("tepelne cerpadlo") || text.includes("cerpadl") || /\btc\b/.test(text)) {
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
  if (isServicesOverviewQuestion(message)) {
    return {
      needsRetrieval: true,
      retrievalQuery: "Geotherm služby tepelné čerpadlá klimatizácie rekuperácia podlahové kúrenie stropné chladenie servis dotácie rozvody voda",
      answerMessage: message,
      contextTopic: "prehľad služieb Geotherm",
      intentHint: "product",
      answerMode: "rag_answer",
      confidence: "high",
      reason: "services_overview_question",
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
  if (isServiceAreaQuestion(message)) {
    const text = normalizePolicyText(message);
    const intentHint: SalesIntent = text.includes("servis") || text.includes("vyjazd") ? "service" : "installation";
    return {
      needsRetrieval: true,
      retrievalQuery: serviceAreaRetrievalQuery,
      answerMessage: message,
      contextTopic: "pôsobnosť Geotherm podľa okresov",
      intentHint,
      answerMode: "rag_answer",
      confidence: "high",
      reason: "service_area_question",
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
  if (fallback.reason === "services_overview_question") return fallback;
  if (fallback.reason === "service_area_question") return fallback;
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

type QualificationUpdate = Partial<
  Pick<
    QualificationState,
    | "service_type"
    | "service_intent"
    | "project_type"
    | "property_type"
    | "area_m2"
    | "location"
    | "timeline"
    | "current_heating"
    | "heating_distribution"
    | "wants_cooling"
    | "hot_water"
    | "occupants"
    | "insulation"
    | "annual_consumption"
    | "annual_consumption_unknown"
    | "own_wood"
    | "qualification_question_rounds"
    | "recommendation_closure_offered"
    | "last_direct_topic"
    | "last_price_topic"
    | "last_brand_model_topic"
    | "project_available"
    | "heat_loss_known"
  >
>;

function deterministicQualificationUpdate(message: string, route?: Pick<ServiceRoute, "serviceType" | "serviceIntent">): QualificationUpdate {
  const normalized = normalizePolicyText(message);
  const update: QualificationUpdate = {};
  if (route?.serviceType && route.serviceType !== "unknown") update.service_type = route.serviceType;
  if (route?.serviceIntent && route.serviceIntent !== "general") update.service_intent = route.serviceIntent;
  if (/(novostav|novy projekt|novy dom|bungalov)/.test(normalized)) update.project_type = "novostavba";
  if (/(star(?:si|y|e)?(?: dom)?|rekonstruk|existujuci dom|modernizac)/.test(normalized)) update.project_type = "rekonštrukcia";
  if (/bungalov/.test(normalized)) update.property_type = "bungalov";
  else if (/\bbyt\b|byte|bytu/.test(normalized)) update.property_type = "byt";
  else if (/\bdom\b|rodinny dom|rd\b|barak/.test(normalized)) update.property_type = "rodinný dom";
  else if (/\bfirma\b|kancelar|komerc|prevadzka|budova/.test(normalized)) update.property_type = "iné";
  if (/radiator|radiatory/.test(normalized)) update.heating_distribution = "radiátory";
  else if (/podlahov|podlahu|podlahove/.test(normalized)) update.heating_distribution = "podlahové kúrenie";
  if (/chladen|chladit|klimatiz|klima/.test(normalized)) update.wants_cooling = true;
  if (/\bano planujem\b/.test(normalized)) update.wants_cooling = true;
  if (/tepla voda|teplu vodu|tuv|bojler|zasobnik/.test(normalized)) update.hot_water = true;
  if (/projekt|podorys|pôdorys/.test(normalized)) update.project_available = true;
  if (/tepelna strata|tepelnú stratu|energeticky certifikat|energetický certifikát|odhad vykonu|odhad výkonu/.test(normalized)) update.heat_loss_known = true;
  if (/nemam odhad|nemám odhad|neviem odhad|nemam tepelnu stratu|nemám tepelnú stratu|nemam energeticky|nemám energetický/.test(normalized)) update.heat_loss_known = false;
  if (/(neviem|netusim|netuším|nemam|nemám).*(spotreb|odhad|drevo|plyn|m3|kwh)|(?:spotreb|odhad).*(neviem|netusim|netuším|nemam|nemám)/.test(normalized)) {
    update.annual_consumption_unknown = true;
  }
  if (/vlastn[ée] drevo|svoje drevo|mam drevo|mám drevo/.test(normalized)) update.own_wood = true;
  if (/zateplen/.test(normalized)) update.insulation = /nezateplen|nie je zateplen/.test(normalized) ? "nezateplený" : "zateplený alebo čiastočne zateplený";
  const occupantsMatch = normalized.match(/(\d{1,2})\s*(?:osob|ludi|clen)/);
  if (occupantsMatch) update.occupants = Number.parseInt(occupantsMatch[1], 10);
  const consumptionMatch = normalized.match(/(\d[\d\s.,]{2,})\s*(?:m3|kwh|kw h|eur|€)/);
  if (consumptionMatch) update.annual_consumption = consumptionMatch[0].trim();

  const areaMatch = normalized.match(/(\d{2,4})\s*(?:m2|m 2|m²|m\b|metrov|metre)/) || normalized.match(/\b(\d{2,4})\b/);
  if (areaMatch) {
    const area = Number.parseInt(areaMatch[1], 10);
    if (Number.isFinite(area) && area >= 20 && area <= 2000) update.area_m2 = area;
  }

  if (/\bplyn\b|plynov/.test(normalized)) update.current_heating = "plyn";
  else if (/drevo|uhlie|pelety|tuhe palivo|tuhym palivom/.test(normalized)) update.current_heating = "tuhé palivo";
  else if (/elektrin|elektrokotol|elektricky kotol/.test(normalized)) update.current_heating = "elektrina";
  else if (/(?:mam|mame|kurim|kurime|vykurujem|aktualne|teraz).*(?:tepelne cerpadlo|cerpadlom)|cerpadlom/.test(normalized)) update.current_heating = "tepelné čerpadlo";

  const locationMatch = normalized.match(/\b(?:som z|sme z|dom je v|dom mam v|byvam v|lokalita)\s+([a-z]+(?:\s+[a-z]+){0,2})/);
  if (locationMatch) update.location = locationMatch[1].trim();
  if (/urgent|co najskor|este dnes|hned/.test(normalized)) update.timeline = "urgent";
  else if (/1\s*-?\s*3|do troch mesiacov|do 3 mesiacov/.test(normalized)) update.timeline = "1-3 mesiace";
  else if (/3\s*-?\s*6|do pol roka/.test(normalized)) update.timeline = "3-6 mesiacov";
  else if (/do roka|neskor|neskôr/.test(normalized)) update.timeline = "neskôr";
  return update;
}

function deterministicTurnQualificationUpdate(
  message: string,
  previousState: QualificationState,
  previousMessages: Array<{ role: string; content: string }>,
  route?: Pick<ServiceRoute, "serviceType" | "serviceIntent">,
): QualificationUpdate {
  const update = deterministicQualificationUpdate(message, route);
  const normalized = normalizePolicyText(message);
  const lastAssistant = normalizePolicyText([...previousMessages].reverse().find((item) => item.role === "assistant")?.content || "");
  const numberedValues = [...message.matchAll(/(?:^|[,;\n]\s*)\d+\.\s*([^,;\n]+)/g)].map((match) => normalizePolicyText(match[1]));
  const hasDiagnosticHouseContext = Boolean(previousState.project_type || previousState.area_m2 || previousState.heating_distribution);

  if (!update.location) {
    const rawLocation = message.match(/^\s*([A-ZÁÄČĎÉÍĽĹŇÓÔŔŠŤÚÝŽ][\p{L} -]{2,})(?:,|$)/u)?.[1]?.trim();
    const hasContact = Boolean(extractCrmContact(message).phone || extractCrmContact(message).email);
    const looksLikePersonName = rawLocation ? /^[\p{Lu}][\p{L}'-]+(?:\s+[\p{Lu}][\p{L}'-]+){1,3}$/u.test(rawLocation) : false;
    const looksLikeGreeting = rawLocation ? isGreetingLocationValue(rawLocation) : false;
    if (rawLocation && !looksLikeGreeting && !hasContact && !looksLikePersonName && !/^(ano|nie|nemam|neviem)$/i.test(rawLocation)) update.location = rawLocation;
  }

  const numericValues = numberedValues
    .map((value) => Number.parseInt(value, 10))
    .filter((value) => Number.isFinite(value));
  const smallNumber = numericValues.find((value) => value >= 1 && value <= 15);
  if (smallNumber && !update.occupants && (lastAssistant.includes("osob") || hasDiagnosticHouseContext)) {
    update.occupants = smallNumber;
  }

  const yesNoValues = numberedValues.filter((value) => /^(ano|áno|nie|ne)$/.test(value));
  const secondAnswer = numberedValues[1] || "";
  const affirmativeReply = /\b(ano|áno|jasne|planujem|plánujem|chcem|urcite|určite)\b/.test(normalized) && !/\b(nie|nechcem|neplanujem|neplánujem)\b/.test(normalized);
  const negativeReply = /\b(nie|ne|nechcem|neplanujem|neplánujem)\b/.test(normalized);
  const saysYes = /^(ano|áno)$/.test(secondAnswer) || (!secondAnswer && (/^(ano|áno)$/.test(normalized) || affirmativeReply));
  const saysNo = /^(nie|ne)$/.test(secondAnswer) || (!secondAnswer && (/^(nie|ne)$/.test(normalized) || negativeReply));
  if ((yesNoValues.length || saysYes || saysNo) && (lastAssistant.includes("chladen") || previousState.wants_cooling !== undefined)) {
    update.wants_cooling = saysYes ? true : saysNo ? false : update.wants_cooling;
  }
  if (
    update.wants_cooling === undefined &&
    hasDiagnosticHouseContext &&
    normalizePolicyText(previousState.heating_distribution || "").includes("podlah") &&
    /\b(ano planujem|planujem|chcem)\b/.test(normalized)
  ) {
    update.wants_cooling = true;
  }
  if (
    (yesNoValues.length || saysYes || saysNo) &&
    (lastAssistant.includes("teplu vod") || lastAssistant.includes("tuv") || previousState.hot_water !== undefined) &&
    (/\b(teplu vodu|tepla voda|tuv|bojler|zasobnik)\b/.test(normalized) || !lastAssistant.includes("chladen"))
  ) {
    update.hot_water = saysYes ? true : saysNo ? false : update.hot_water;
  }

  if (/nemam odhad|nemám odhad|neviem odhad/.test(normalized)) update.heat_loss_known = false;
  const previousHeating = normalizePolicyText(previousState.current_heating || "");
  const woodConsumptionMatch = normalized.match(/\b(\d+(?:[,.]\d+)?)\s*(?:m3|m 3|m\b|metrov|metre|kubik|kubiky|kubikov|priestorove metre)\b/);
  if (woodConsumptionMatch && previousHeating.includes("tuhe palivo")) {
    update.annual_consumption = `${woodConsumptionMatch[1].replace(",", ".")} m dreva za sezónu`;
  }
  return update;
}

const qualificationUpdateFields: Array<keyof QualificationUpdate> = [
  "service_type",
  "service_intent",
  "project_type",
  "property_type",
  "area_m2",
  "location",
  "timeline",
  "current_heating",
  "heating_distribution",
  "wants_cooling",
  "hot_water",
  "occupants",
  "insulation",
  "annual_consumption",
  "annual_consumption_unknown",
  "own_wood",
  "qualification_question_rounds",
  "recommendation_closure_offered",
  "last_direct_topic",
  "last_price_topic",
  "last_brand_model_topic",
  "project_available",
  "heat_loss_known",
];

function mergeQualificationState(base: QualificationState, update: QualificationUpdate): QualificationState {
  const next: QualificationState = { ...base };
  for (const field of qualificationUpdateFields) {
    const currentValue = next[field];
    const nextValue = update[field];
    if (currentValue === false && nextValue === true) {
      next[field] = nextValue as never;
      continue;
    }
    if ((currentValue === undefined || currentValue === null) && nextValue !== undefined && nextValue !== null) {
      next[field] = nextValue as never;
    }
  }
  if (next.location && isGreetingLocationValue(next.location)) delete next.location;
  return next;
}

function hasMeaningfulQualificationUpdate(update: QualificationUpdate): boolean {
  return qualificationUpdateFields.some((field) => {
    if (field === "service_type" || field === "service_intent" || field === "qualification_question_rounds") return false;
    return update[field] !== undefined && update[field] !== null;
  });
}

function hasActiveDiagnosticState(state: QualificationState): boolean {
  return Boolean(
    state.service_type ||
      state.service_intent ||
      state.project_type ||
      state.property_type ||
      state.area_m2 ||
      state.heating_distribution ||
      state.current_heating ||
      state.occupants ||
      state.wants_cooling !== undefined ||
      state.hot_water !== undefined ||
      state.location,
  );
}

function isNewBuildFloorHeating(state: QualificationState): boolean {
  const service = normalizeServiceType(state.service_type, "unknown");
  return (
    (service === "heat_pump" || service === "complex_solution") &&
    normalizePolicyText(state.project_type || "").includes("novostav") &&
    normalizePolicyText(state.heating_distribution || "").includes("podlah")
  );
}

function isExistingRadiatorSolidFuel(state: QualificationState): boolean {
  const project = normalizePolicyText(state.project_type || "");
  const distribution = normalizePolicyText(state.heating_distribution || "");
  const heating = normalizePolicyText(state.current_heating || "");
  return (project.includes("rekon") || project.includes("starsi") || project.includes("existuj")) && distribution.includes("radiator") && heating.includes("tuhe palivo");
}

function isExistingRadiatorHeatPump(state: QualificationState): boolean {
  const project = normalizePolicyText(state.project_type || "");
  const distribution = normalizePolicyText(state.heating_distribution || "");
  return (project.includes("rekon") || project.includes("starsi") || project.includes("existuj")) && distribution.includes("radiator");
}

function isGreetingLocationValue(value: string): boolean {
  return /^(ahoj|cau|caute|dobry den|zdravim|hello|hi|hey)$/.test(normalizePolicyText(value));
}

function inferExistingRadiatorState(state: QualificationState, message: string, serviceHint?: string): QualificationState | null {
  const normalized = normalizePolicyText(message);
  const project = normalizePolicyText(state.project_type || "");
  const distribution = normalizePolicyText(state.heating_distribution || "");
  const hasExistingProject =
    project.includes("rekon") ||
    project.includes("starsi") ||
    project.includes("existuj") ||
    /\b(star|starsi|stary|rekonstrukcia|existujuci)\b/.test(normalized);
  const hasRadiators = distribution.includes("radiator") || /\bradiator/.test(normalized);
  const areaMatch = normalized.match(/(\d{2,4})\s*(?:m2|m 2|m\b|metrov|metre)/) || normalized.match(/\b(\d{2,4})\b/);
  const inferredArea = areaMatch ? Number.parseInt(areaMatch[1], 10) : undefined;
  const hasArea = Boolean(state.area_m2 || (inferredArea && inferredArea >= 20 && inferredArea <= 2000));
  const service = normalizeServiceType(state.service_type || serviceHint, "unknown");
  if (!hasExistingProject || !hasRadiators || !hasArea || (service !== "heat_pump" && service !== "complex_solution")) return null;
  return {
    ...state,
    service_type: state.service_type || "heat_pump",
    service_intent: state.service_intent || "recommendation",
    project_type: state.project_type || "rekonštrukcia",
    heating_distribution: state.heating_distribution || "radiátory",
    area_m2: state.area_m2 || inferredArea,
  };
}

function requiresHardVerdict(state: QualificationState, route: Pick<ServiceRoute, "serviceType" | "serviceIntent">, message: string): boolean {
  const inferredState = inferExistingRadiatorState(state, message, route.serviceType);
  const service = normalizeServiceType(state.service_type || route.serviceType, "unknown");
  const intent = normalizeServiceIntent(state.service_intent || route.serviceIntent, "general");
  const complaint = /nepovedal|neodpovedal|povedz mi|konkretne|najleps/.test(normalizePolicyText(message));
  if (inferredState && ["recommendation", "comparison", "general"].includes(intent)) return true;
  return (
    (service === "heat_pump" || service === "complex_solution") &&
    Boolean(state.project_type && state.area_m2 && state.heating_distribution) &&
    (["recommendation", "comparison", "general"].includes(intent) || complaint)
  );
}

function requiresInitialHeatPumpRecommendation(state: QualificationState, route: Pick<ServiceRoute, "serviceType" | "serviceIntent">, message: string): boolean {
  return (
    normalizeServiceType(state.service_type || route.serviceType, "unknown") === "heat_pump" &&
    normalizeServiceIntent(state.service_intent || route.serviceIntent, "general") === "recommendation" &&
    !state.project_type &&
    !state.area_m2 &&
    !state.heating_distribution &&
    !isGreetingOnlyMessage(message)
  );
}

function expectedInitialHeatPumpRecommendation(): string {
  return [
    "### Predbežný smer",
    "",
    "Najčastejšie sa pri rodinných domoch začína pri tepelnom čerpadle **vzduch-voda**. Ak ide o novostavbu s podlahovým kúrením, býva to veľmi vhodný smer; pri staršom dome s radiátormi treba najprv overiť potrebnú teplotu vody a výkon radiátorov.",
    "",
    "Aby som ťa zaradil správne, napíš mi:",
    "1. je to novostavba alebo starší dom?",
    "2. koľko m2 chceš vykurovať?",
    "3. máš radiátory alebo podlahové kúrenie?",
  ].join("\n");
}

function expectedVerdictAnswer(state: QualificationState): string {
  if (isNewBuildFloorHeating(state)) {
    const area = state.area_m2 ? ` pri dome cca ${state.area_m2} m²` : "";
    const parts = [
      "### Predbežný verdikt",
      "",
      `Pre teba by som predbežne išiel do tepelného čerpadla **vzduch-voda** pre **novostavbu s nízkoteplotným podlahovým kúrením**${area}. Dáva to zmysel hlavne preto, že podlahovka pracuje s nízkou teplotou vody, čo tepelnému čerpadlu vyhovuje.`,
    ];
    if (state.occupants) {
      parts.push(`Pri ${state.occupants} osobách by som v návrhu rátal aj so **zásobníkom TÚV** primeraným spotrebe domácnosti.`);
    }
    if (state.wants_cooling) {
      parts.push(
        "Chladenie treba navrhnúť cielene: podlahové chladenie vie dom jemne ochladiť, ale má limity a treba riešiť rosný bod; komfortnejšie býva stropné chladenie, fancoily alebo klimatizácia podľa projektu.",
      );
    }
    parts.push("Konkrétny výkon a model by som už riešil v nacenení, nie ďalším dotazníkom.");
    parts.push("");
    if (!state.occupants || state.wants_cooling === undefined) {
      parts.push("Koľko osôb bude v dome a chceš riešiť aj chladenie v lete?");
    } else {
      parts.push("Ďalší krok je krátka konzultácia alebo stretnutie, kde sa porovnajú 2-3 vhodné zostavy a pripraví sa nacenenie.");
    }
    return parts.join("\n");
  }

  if (isExistingRadiatorSolidFuel(state)) {
    const area = state.area_m2 ? ` pri dome cca ${state.area_m2} m²` : "";
    return [
      "### Predbežný verdikt",
      "",
      `Podľa toho, čo píšeš, ide predbežne o výmenu kotla na drevo alebo tuhé palivo za tepelné čerpadlo **vzduch-voda vhodné pre radiátorový systém**${area}. Dôvod je, že radiátory často potrebujú vyššiu teplotu vody než podlahovka, takže treba overiť výkon radiátorov a tepelné straty domu.`,
      "",
      "Typicky by sa riešilo tepelné čerpadlo, úprava kotolne, regulácia, prípadne akumulačná nádrž a ohrev teplej vody. Keďže pri dreve býva spotreba nepresná, stačí orientačne koľko dreva spáliš za sezónu.",
      "",
      "Je dom zateplený a máš už v systéme akumulačnú nádrž?",
    ].join("\n");
  }

  if (isExistingRadiatorHeatPump(state)) {
    const area = state.area_m2 ? ` pri dome cca ${state.area_m2} m²` : "";
    return [
      "### Predbežný verdikt",
      "",
      `Pri staršom alebo existujúcom dome s radiátormi${area} by som predbežne riešil tepelné čerpadlo **vzduch-voda vhodné pre radiátorový systém**. Dôležité je overiť, či radiátory vykúria dom aj pri nižšej teplote vody, alebo či bude treba upraviť časť vykurovania.`,
      "",
      "Pred finálnym návrhom treba poznať aktuálny zdroj tepla, zateplenie a aspoň orientačnú spotrebu alebo náhradný odhad.",
      "",
      "Čím kúriš teraz a je dom zateplený?",
    ].join("\n");
  }

  return [
    "### Predbežný verdikt",
    "",
    "Podľa údajov už viem dať smer, nie iba všeobecné „závisí“. Pri tepelnom čerpadle by som najprv riešil typ domu, plochu a vykurovaciu sústavu, potom výkon, teplú vodu a umiestnenie jednotky.",
    "",
    "Máš projekt, tepelnú stratu alebo fotky technickej miestnosti?",
  ].join("\n");
}

function expectedAirConditioningAnswer(): string {
  return [
    "### Predbežný smer",
    "",
    "Do obývačky a spálne by som predbežne porovnal dve riešenia: buď dve samostatné klimatizačné jednotky, alebo multisplit s jednou vonkajšou jednotkou. Dôvod je, že pri dvoch miestnostiach rozhoduje dispozícia, vzdialenosť potrubia, hlučnosť a miesto pre vonkajšiu jednotku.",
    "",
    "Typicky treba overiť plochu miestností, orientáciu na slnko a kadiaľ sa dajú viesť rozvody.",
    "",
    "Koľko m² má obývačka a spálňa a kde by mohla byť vonkajšia jednotka?",
  ].join("\n");
}

function expectedHeatRecoveryAnswer(): string {
  return [
    "### Predbežný smer",
    "",
    "Ak staviaš dom a chceš lepší vzduch bez otvárania okien, predbežne dáva zmysel riešiť **rekuperáciu už v projekte**. Dôvod je, že pri novostavbe sa dajú správne navrhnúť rozvody, technická miestnosť, prívod čerstvého vzduchu aj odťah z kúpeľní a kuchyne.",
    "",
    "Typicky by sa riešila centrálna rekuperácia pre celý dom, ale treba overiť dispozíciu a priestor pre jednotku.",
    "",
    "Máš už projekt domu a chceš vetrať celý dom alebo len vybrané miestnosti?",
  ].join("\n");
}

function expectedServiceFaultAnswer(message?: string): string {
  const normalizedMessage = normalizePolicyText(message || "");
  if (/^(co s tym|čo s tým|co teraz|čo teraz)$/.test(normalizedMessage)) {
    return [
      "### Čo spraviť najbližšie",
      "",
      "Pri hlučnom alebo podozrivo fungujúcom zariadení nerob nastavovanie naslepo. Najprv si poznač prejav: kedy hučí, či sa menil tlak alebo teplota a či je na displeji hlásenie.",
      "",
      "Potom má zmysel poslať Geotherm krátky popis a dohodnúť servisné preverenie. Technik podľa toho rozhodne, či stačí nastavenie, diagnostika alebo výjazd.",
    ].join("\n");
  }
  if (normalizedMessage.includes("tlak")) {
    return [
      "### Pokles tlaku v kúrení",
      "",
      "Ak **padá tlak v kúrení**, beriem to ako servisný problém. Môže ísť o únik vody, expanznú nádobu, poistný ventil, dopúšťanie alebo problém v kotolni; bez obhliadky by som neradil svojpomocne rozoberať zariadenie.",
      "",
      "Najlepší ďalší krok je poslať značku a model zdroja tepla, aktuálny tlak za studena/tepla, či niekde vidno vodu, lokalitu a kontakt. Technik potom vie potvrdiť, či stačí diagnostika alebo treba výjazd.",
    ].join("\n");
  }
  const mentionedBrand = normalizedMessage.includes("nibe")
    ? "NIBE"
    : normalizedMessage.includes("vaillant")
      ? "Vaillant"
      : normalizedMessage.includes("ivt")
        ? "IVT"
        : null;
  if (mentionedBrand === "NIBE" && /(star|stare|staré|starsie|staršie)/.test(normalizedMessage)) {
    return [
      "### Staršie NIBE",
      "",
      "Pri staršom NIBE by som najprv nerobil záver, že treba výmenu. Môže ísť o nastavenie, opotrebovaný diel, hlučnejší chod, zanesenie alebo problém mimo samotného čerpadla.",
      "",
      "Pre Geotherm je praktické poslať fotku štítku, približný vek zariadenia a popis hluku. Podľa toho sa dá rozhodnúť, či má zmysel servisné preverenie alebo konzultácia k výmene.",
    ].join("\n");
  }
  const deviceLabel = mentionedBrand ? `${mentionedBrand} hlási chybu` : normalizedMessage.includes("kotol") ? "kotol ukazuje chybu" : "zariadenie hlási chybu";
  return [
    "### Servisný smer",
    "",
    `Rozumiem, ${deviceLabel}. Pri poruche by som neradil žiadny svojpomocný zásah do zariadenia; najprv treba zistiť presný model, chybový kód a lokalitu, aby sa dalo posúdiť, či ide o servisný zásah a aký postup je bezpečný.`,
    "",
    "Pri zariadeniach montovaných inou firmou treba dostupnosť servisu potvrdiť podľa značky a prípadu.",
    "",
    "Pošli mi prosím model alebo fotku štítku, chybový kód z displeja a mesto, kde je zariadenie.",
  ].join("\n");
}

type CrmContact = {
  name?: string;
  email?: string;
  phone?: string;
};

type CrmLeadIntent = "inspection" | "quote" | "service_fault" | "callback" | "project" | "general";

type CrmOutcome = {
  leadCapture: {
    shouldAsk: boolean;
    nextQuestion: string | null;
    reason: string | null;
    requestedFields: string[];
  };
  lead: {
    id: string | null;
    captured: boolean;
    score: number;
    temperature: string;
    status: string;
    extractedContact: CrmContact;
    missingFields: string[];
    nextAction: string | null;
  };
  outreach: {
    created: boolean;
    priority: string | null;
    reason: string | null;
    id: string | null;
  };
  persistence: {
    conversationSaved: boolean;
    leadSaved: boolean;
    outreachSaved: boolean;
  };
  nextState: QualificationState;
  answer: string;
  leadRecord: LeadRecord | null;
  outreachRecord: OutreachRecord | null;
};

const crmPhonePattern = /(?:\+421|00421)[\s.-]*(?:\d[\s.-]*){9}|0[\s.-]*(?:\d[\s.-]*){9}|(?<!\d)(?:\d[\s.-]*){9}(?!\d)/;
const crmPhonePatternGlobal = /(?:\+421|00421)[\s.-]*(?:\d[\s.-]*){9}|0[\s.-]*(?:\d[\s.-]*){9}|(?<!\d)(?:\d[\s.-]*){9}(?!\d)/g;

function normalizePhone(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const compact = value.replace(/[()\s.-]/g, "");
  if (/^00421\d{9}$/.test(compact)) return `+421${compact.slice(5)}`;
  if (/^\+421\d{9}$/.test(compact)) return compact;
  if (/^0\d{9}$/.test(compact)) return compact;
  if (/^\d{9}$/.test(compact)) return `0${compact}`;
  return compact;
}

function extractCrmContact(message: string): CrmContact {
  const email = message.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
  const phone = normalizePhone(message.match(crmPhonePattern)?.[0]);
  let name: string | undefined;
  const explicitName = message.match(/\b(?:vol[aá]m sa|meno je|som)\s+([\p{Lu}][\p{L}'-]+(?:\s+[\p{Lu}][\p{L}'-]+){1,3})/u)?.[1];
  if (explicitName) {
    name = explicitName.trim();
  } else if (phone || email) {
    const stripped = message
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, " ")
      .replace(crmPhonePatternGlobal, " ")
      .split(/[,;\n]/)
      .map((part) => part.trim())
      .find((part) => /^[\p{Lu}][\p{L}'-]+(?:\s+[\p{Lu}][\p{L}'-]+){1,3}$/u.test(part));
    if (stripped && !/(bratislava|nitra|trnava|kosice|košice|zilina|žilina|nibe|vaillant)/i.test(stripped)) name = stripped;
  }
  return { ...(name ? { name } : {}), ...(email ? { email } : {}), ...(phone ? { phone } : {}) };
}

function extractCrmLocation(message: string, contact: CrmContact): string | undefined {
  const withoutContact = message
    .replace(contact.email || "\u0000", " ")
    .replace(contact.phone || "\u0000", " ")
    .replace(crmPhonePatternGlobal, " ");
  const match = withoutContact.match(/\b(?:som|sme|byvam|bývam|dom je|zariadenie je)\s+(?:z|zo|v|vo)\s+([\p{Lu}][\p{L}'-]+(?:\s+[\p{Lu}][\p{L}'-]+){0,2})/u);
  return match?.[1]?.trim();
}

function detectCrmLeadIntent(message: string, route: Pick<ServiceRoute, "serviceType" | "serviceIntent">): CrmLeadIntent {
  const text = normalizePolicyText(message);
  if (/(obhliad|prehliad|prist pozriet|prist sa pozriet|dohodnut termin|dohodnut obhliad|chcem aby ste prisli)/.test(text)) return "inspection";
  if (/(cenova ponuka|cenovu ponuku|ponuku|nacenit|nacenenie|poslite cenu|chcem cenu)/.test(text)) return "quote";
  if (/(zavolajte|ozvite|kontaktujte|nech mi zavola|telefonicky)/.test(text)) return "callback";
  if (route.serviceType === "service" || route.serviceIntent === "service_fault" || /(porucha|chyba|hlasi chybu|servis|diagnostik)/.test(text)) return "service_fault";
  if (route.serviceType !== "unknown" || route.serviceIntent !== "general") return "project";
  return "general";
}

function inferCrmLeadIntentFromHistory(messages: Array<{ role: string; content: string }>): CrmLeadIntent {
  const userMessages = messages
    .filter((message) => message.role === "user")
    .slice(-8)
    .map((message) => normalizePolicyText(message.content));
  for (const text of [...userMessages].reverse()) {
    if (/(cenova ponuka|cenovu ponuku|ponuku|nacenit|nacenenie)/.test(text)) return "quote";
    if (/(obhliad|prehliad|dohodnut termin|technik alebo obchodnik|technik obchodnik)/.test(text)) return "inspection";
    if (/(porucha|chyba|servis|diagnostik)/.test(text)) return "service_fault";
    if (/(zavolajte|ozvite|kontaktujte|spatny kontakt|spatne ozvanie)/.test(text)) return "callback";
  }
  return "general";
}

function leadTemperature(score: number): "cold" | "warm" | "hot" {
  if (score >= 61) return "hot";
  if (score >= 31) return "warm";
  return "cold";
}

function boolSlot(value: boolean | undefined): boolean | null {
  return value === undefined ? null : value;
}

function scoreCrmLead(input: {
  state: QualificationState;
  route: Pick<ServiceRoute, "serviceType" | "serviceIntent">;
  contact: CrmContact;
  leadIntent: CrmLeadIntent;
}): number {
  let score = 0;
  if (input.route.serviceType !== "unknown" || input.state.service_type) score += 10;
  if (input.state.project_type) score += 10;
  if (input.state.location) score += 10;
  if (input.state.area_m2 || input.state.heating_distribution || input.state.current_heating) score += 10;
  if (input.leadIntent === "quote") score += 15;
  if (input.leadIntent === "inspection") score += 20;
  if (input.contact.phone || input.contact.email) score += 25;
  if (input.state.timeline) score += 10;
  if (input.leadIntent === "service_fault") score += 10;
  if (input.leadIntent === "general" && !input.state.project_type && input.route.serviceType === "unknown") score -= 20;
  return Math.max(0, Math.min(100, score));
}

function leadStatus(input: {
  leadIntent: CrmLeadIntent;
  hasContact: boolean;
  score: number;
}): string {
  if (input.leadIntent === "service_fault" && input.hasContact) return "service_requested";
  if (input.leadIntent === "inspection" && input.hasContact) return "inspection_requested";
  if (input.leadIntent === "quote" && input.hasContact) return "quote_requested";
  if (input.hasContact) return "contact_captured";
  if (["inspection", "quote", "callback", "service_fault"].includes(input.leadIntent)) return "missing_contact";
  if (input.score >= 45) return "missing_contact";
  if (input.score >= 30) return "qualified";
  return "new";
}

function statusNextAction(status: string, contact: CrmContact): string | null {
  if (status === "inspection_requested") return "Zavolať zákazníkovi a dohodnúť obhliadku.";
  if (status === "quote_requested") return "Kontaktovať zákazníka a vyžiadať podklady na cenovú ponuku.";
  if (status === "service_requested") return "Zavolať zákazníkovi a dohodnúť servisný postup.";
  if (status === "contact_captured") return contact.phone ? "Zavolať zákazníkovi a upresniť dopyt." : "Napísať zákazníkovi a upresniť dopyt.";
  if (status === "missing_contact") return "Vypýtať telefón alebo e-mail pre spätný kontakt.";
  return null;
}

function buildLeadSummary(input: {
  state: QualificationState;
  route: Pick<ServiceRoute, "serviceType" | "serviceIntent">;
  contact: CrmContact;
  leadIntent: CrmLeadIntent;
  status: string;
}): string {
  const who = input.contact.name || "Zákazník";
  const facts = [
    `${who} rieši ${serviceLabel(input.route.serviceType)}.`,
    input.state.project_type ? `Typ projektu: ${input.state.project_type}.` : null,
    input.state.area_m2 ? `Plocha približne ${input.state.area_m2} m².` : null,
    input.state.heating_distribution ? `Vykurovanie: ${input.state.heating_distribution}.` : null,
    input.state.current_heating ? `Aktuálny zdroj: ${input.state.current_heating}.` : null,
    input.state.wants_cooling ? "Zaujíma ho aj chladenie." : null,
    input.state.location ? `Lokalita: ${input.state.location}.` : null,
    input.leadIntent === "inspection" ? "Požiadal o obhliadku." : null,
    input.leadIntent === "quote" ? "Požiadal o cenovú ponuku." : null,
    input.leadIntent === "service_fault" ? "Rieši servis alebo poruchu." : null,
    input.contact.phone ? `Telefón: ${input.contact.phone}.` : null,
    input.contact.email ? `E-mail: ${input.contact.email}.` : null,
    `Status: ${input.status}.`,
  ].filter(Boolean);
  return facts.join(" ");
}

function shouldPersistLead(input: { score: number; contact: CrmContact; leadIntent: CrmLeadIntent; closureTriggered: boolean }): boolean {
  return Boolean(input.contact.phone || input.contact.email || input.score >= 30 || input.closureTriggered || ["inspection", "quote", "callback", "service_fault"].includes(input.leadIntent));
}

function retentionDate(): string {
  const days = Number.parseInt(process.env.LEAD_RETENTION_DAYS || "730", 10);
  const date = new Date();
  date.setDate(date.getDate() + (Number.isFinite(days) && days > 0 ? days : 730));
  return date.toISOString();
}

function buildCrmOutcome(input: {
  siteId: string;
  conversationId: string;
  visitorId: string;
  message: string;
  answer: string;
  route: Pick<ServiceRoute, "serviceType" | "serviceIntent">;
  responseIntent: SalesIntent;
  state: QualificationState;
  previousMessages: Array<{ role: string; content: string; created_at?: string }>;
  closureTriggered: boolean;
  currentUrl?: string;
  referrer?: string;
}): CrmOutcome {
  const currentContact = extractCrmContact(input.message);
  const hasNewContact = Boolean(currentContact.phone || currentContact.email);
  const contact: CrmContact = {
    name: currentContact.name || input.state.contact_name,
    email: currentContact.email || input.state.contact_email,
    phone: currentContact.phone || input.state.contact_phone,
  };
  const location = extractCrmLocation(input.message, contact);
  const directLeadIntent = detectCrmLeadIntent(input.message, input.route);
  const historyLeadIntent = inferCrmLeadIntentFromHistory(input.previousMessages);
  const hasContact = Boolean(contact.phone || contact.email);
  const leadIntent = hasContact && ["general", "project"].includes(directLeadIntent) && historyLeadIntent !== "general" ? historyLeadIntent : directLeadIntent;
  const nextState: QualificationState = {
    ...input.state,
    ...(contact.name ? { contact_name: contact.name } : {}),
    ...(contact.phone ? { contact_phone: contact.phone } : {}),
    ...(contact.email ? { contact_email: contact.email } : {}),
    ...(location && !input.state.location ? { location } : {}),
    ...(hasNewContact && ["inspection", "quote", "callback", "service_fault"].includes(leadIntent) ? { contact_consent: true } : {}),
  };
  const score = scoreCrmLead({ state: nextState, route: input.route, contact, leadIntent });
  const temperature = leadTemperature(score);
  const status = leadStatus({ leadIntent, hasContact, score });
  const missingFields = hasContact ? [] : ["phone_or_email"];
  const normalizedLeadMessage = normalizePolicyText(input.message);
  const serviceContactRequest =
    leadIntent === "service_fault" &&
    /(kontakt|zavol|telefon|email|e mail|objedn|termin|prist|prísť|vyjazd|urgent|havar|kedy)/.test(normalizedLeadMessage);
  const explicitContactIntent = ["inspection", "quote", "callback"].includes(leadIntent) || serviceContactRequest;
  const shouldAskContact = !hasContact && (explicitContactIntent || (input.closureTriggered && score >= 75));
  const requestedFields = shouldAskContact ? ["phone_or_email", "name"] : [];
  const nextQuestion = shouldAskContact
    ? "Jasné, ďalší krok je, aby sa vám vedel ozvať technik alebo obchodník a dohodol postup. Pošlite prosím telefón alebo e-mail, prípadne aj meno. Kontakt použijeme iba na spätné ozvanie k tomuto dopytu."
    : null;
  const nextAction = statusNextAction(status, contact);
  let answer = input.answer;
  if (hasNewContact) {
    const context = [
      nextState.project_type ? nextState.project_type : null,
      input.route.serviceType !== "unknown" ? serviceLabel(input.route.serviceType) : null,
      nextState.heating_distribution ? nextState.heating_distribution : null,
      nextState.wants_cooling ? "chladenie" : null,
    ]
      .filter(Boolean)
      .join(", ");
    answer = [
      "### Kontakt mám poznačený",
      "",
      `Ďakujem, kontakt som si poznačil${contact.name ? `, ${contact.name}` : ""}. Kolega sa vám ozve, aby s vami dohodol ďalší postup${leadIntent === "inspection" ? " k obhliadke" : ""}.`,
      "",
      context ? `Pre istotu: evidujem, že riešime ${context}.` : "Kontakt použijeme iba na spätné ozvanie k tomuto dopytu.",
    ].join("\n");
  } else if (shouldAskContact && nextQuestion && !/(telef[oó]n|e-mail|email|kontakt pouzijeme|kontakt použijeme)/i.test(answer)) {
    answer = `${answer.trim()}\n\n${nextQuestion}`;
  }

  const persistLead = shouldPersistLead({ score, contact, leadIntent, closureTriggered: input.closureTriggered });
  let leadRecord: LeadRecord | null = null;
  let outreachRecord: OutreachRecord | null = null;
  if (persistLead) {
    const summary = buildLeadSummary({ state: nextState, route: input.route, contact, leadIntent, status });
    leadRecord = upsertLead({
      conversationId: input.conversationId,
      siteId: input.siteId,
      visitorId: input.visitorId,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      preferredContactMethod: contact.phone ? "phone" : contact.email ? "email" : null,
      serviceType: input.route.serviceType !== "unknown" ? input.route.serviceType : nextState.service_type ?? null,
      serviceIntent: input.route.serviceIntent,
      projectType: nextState.project_type ?? null,
      location: nextState.location ?? null,
      areaM2: nextState.area_m2 ?? null,
      heatingDistribution: nextState.heating_distribution ?? null,
      currentHeatSource: nextState.current_heating ?? null,
      wantsCooling: boolSlot(nextState.wants_cooling),
      wantsHotWater: boolSlot(nextState.hot_water),
      projectAvailable: boolSlot(nextState.project_available),
      heatLossKnown: boolSlot(nextState.heat_loss_known),
      timeline: nextState.timeline ?? null,
      intent: leadIntent,
      score,
      temperature,
      status,
      nextAction,
      source: input.currentUrl || input.referrer || "chat",
      tags: [input.route.serviceType, leadIntent, temperature].filter((value) => value && value !== "unknown"),
      summary,
      notes: summary,
      consentToContact: hasContact && ["inspection", "quote", "callback", "service_fault"].includes(leadIntent),
      contactRequestedByUser: hasNewContact && ["inspection", "quote", "callback", "service_fault"].includes(leadIntent) ? true : null,
      marketingConsent: false,
      privacyNoticeShown: hasContact || shouldAskContact,
      dataRetentionUntil: retentionDate(),
      transcript: {
        messages: [
          ...input.previousMessages.map((item) => ({ role: item.role, content: item.content, created_at: item.created_at })),
          { role: "user", content: input.message },
          { role: "assistant", content: answer },
        ],
        summary,
        storedSlots: nextState,
        leadIntent,
        status,
      },
    });
  }

  if (leadRecord && (hasContact || shouldAskContact || status === "missing_contact")) {
    const priority: "low" | "medium" | "high" = hasContact && (temperature === "hot" || ["inspection_requested", "quote_requested", "service_requested"].includes(status))
      ? "high"
      : status === "missing_contact"
        ? "medium"
        : "medium";
    const reason = hasContact
      ? contact.phone
        ? "Zákazník poslal telefón"
        : "Zákazník poslal e-mail"
      : leadIntent === "inspection"
        ? "Zákazník požiadal o obhliadku bez kontaktu"
        : leadIntent === "quote"
          ? "Dopyt na cenu bez kontaktu"
          : "Kvalifikovaný lead bez kontaktu";
    outreachRecord = createOrUpdateOutreachItem({
      leadId: leadRecord.id,
      conversationId: input.conversationId,
      siteId: input.siteId,
      priority,
      reason,
      suggestedAction: nextAction || (hasContact ? "Kontaktovať zákazníka." : "Vypýtať kontakt v chate."),
      dueAt: priority === "high" ? new Date(Date.now() + 60 * 60 * 1000).toISOString() : null,
    });
  }

  return {
    leadCapture: {
      shouldAsk: shouldAskContact,
      nextQuestion,
      reason: shouldAskContact ? `${leadIntent}_missing_contact` : null,
      requestedFields,
    },
    lead: {
      id: leadRecord?.id ?? null,
      captured: hasContact,
      score,
      temperature,
      status,
      extractedContact: contact,
      missingFields,
      nextAction,
    },
    outreach: {
      created: Boolean(outreachRecord),
      priority: outreachRecord?.priority ?? null,
      reason: outreachRecord?.reason ?? null,
      id: outreachRecord?.id ?? null,
    },
    persistence: {
      conversationSaved: true,
      leadSaved: Boolean(leadRecord),
      outreachSaved: Boolean(outreachRecord),
    },
    nextState,
    answer,
    leadRecord,
    outreachRecord,
  };
}

type RecommendationClosureDecision = {
  triggered: boolean;
  reason: string | null;
  options: string[];
  remainingCriticalUnknowns: string[];
};

type DirectAnswerDecision = {
  triggered: boolean;
  answerMode: AnswerMode;
  reason: string | null;
  answer: string | null;
  serviceIntent: ServiceIntent | null;
  retrievalQuery: string | null;
  topic: string | null;
};

function projectContextLine(state: QualificationState): string {
  const parts = [
    state.project_type,
    state.area_m2 ? `${state.area_m2} m²` : null,
    state.heating_distribution,
    state.current_heating ? `aktuálne ${state.current_heating}` : null,
  ].filter(Boolean);
  return parts.length ? `Pre tvoj prípad (${parts.join(", ")}) by som to bral ako orientačný výber, nie finálny model.` : "Konkrétny model by som vybral až podľa domu, výkonu a technickej miestnosti.";
}

function isBoilerOnlyQuestion(text: string): boolean {
  return (
    /\b(kotol|kotla|kotle|kotlov|kotly|kondenza|plynovy|plynove|elektricky|elektricke)\b/.test(text) &&
    !/(tepelne cerpad|cerpadl|\btc\b|nahrad|usporn|radiator|podlah|tepelneho cerpadla|certifik|opravnen)/.test(text)
  );
}

function companyPracticalDirectAnswer(message: string): DirectAnswerDecision | null {
  const text = normalizePolicyText(message);
  const raw = message.toLowerCase();
  const answerBase = (title: string, body: string, topic: string, serviceIntent: ServiceIntent, retrievalQuery: string): DirectAnswerDecision => ({
    triggered: true,
    answerMode: "direct_answer",
    reason: `company_practical_${topic}`,
    answer: [`### ${title}`, "", body].join("\n"),
    serviceIntent,
    retrievalQuery,
    topic,
  });

  if (/(zhrn|zhrň|zhrnut|zhrnutie|co vieme|čo vieme|bez garanc)/.test(text)) {
    return answerBase(
      "Bezpečné zhrnutie",
      "Zhrniem to bez ďalšieho dotazníka: pri novom riešení treba najprv technický smer a až potom nacenenie; pri servise rozhoduje identifikácia zariadenia a prejav problému. Bez podkladov je fér nedávať presnú cenu, termín ani garanciu.",
      "conversation_summary",
      "contact",
      "company-truth kontakt konzultacia servis ponuka zhrnutie Geotherm",
    );
  }

  if (/(ake sluzby|aké služby|co poskytujete|čo poskytujete|co robite|čo robíte|sluzby poskytujete|služby poskytujete)/.test(text)) {
    return answerBase(
      "Služby Geotherm",
      "Geotherm rieši technické riešenia domu od návrhu po montáž a servis: tepelné čerpadlá, klimatizácie, rekuperáciu, podlahové kúrenie, stropné chladenie, radiátory, kotly, rozvody vody, fotovoltiku alebo solárne riešenia podľa potvrdeného rozsahu, servis a orientáciu v dotáciách. Ak chceš ísť prakticky ďalej, najprv stačí určiť cieľ: kúrenie, chladenie, vetranie, servis, dotácia alebo kompletné riešenie domu.",
      "services_overview",
      "general",
      "company-truth sluzby Geotherm tepelne cerpadla klimatizacie rekuperacia podlahove kurenie stropne chladenie servis dotacie",
    );
  }

  if (/(ake informacie|aké informácie|ake udaje|aké údaje|co potrebujete|čo potrebujete).*(ponuk|nacenen|cenu)|(?:ponuk|nacenen|cenu).*(ake informacie|aké informácie|ake udaje|aké údaje|co potrebujete|čo potrebujete)/.test(text)) {
    return answerBase(
      "Podklady na ponuku",
      "Na rozumnú cenovú ponuku treba hlavne: čo chceš riešiť, či ide o novostavbu alebo rekonštrukciu, **plocha v m²**, lokalitu, aktuálne kúrenie alebo plánované rozvody, požiadavku na teplú vodu alebo chladenie a ideálne fotky kotolne alebo projekt. Potom má zmysel dohodnúť konzultáciu, kde sa vyberie riešenie a nacení rozsah.",
      "quote_inputs",
      "quote",
      "company-truth pricing-rules podklady na cenovu ponuku plocha fotky projekt Geotherm",
    );
  }

  if (/(plan obnovy|plán obnovy)/.test(text)) {
    return answerBase(
      "Plán obnovy",
      "Pri Pláne obnovy by som to nebral ako bežné nacenenie zariadenia. Najprv treba overiť, či konkrétny dom, technológia a aktuálne pravidlá spĺňajú podmienky podpory alebo dotácie. Bez overenia by som nesľuboval nárok, výšku podpory ani odpočet z ceny. Praktický ďalší krok je konzultácia s Geotherm: preveriť podmienky, potom pripraviť vhodný návrh a až následne nacenenie.",
      "plan_obnovy_subsidy_scope",
      "subsidy",
      "company-truth plan obnovy dotacia podpora overit podmienky tepelne cerpadlo fotovoltaika Geotherm",
    );
  }

  if (/(podmienky podpory|podmienk.*podpor)/.test(text)) {
    return answerBase(
      "Podmienky podpory",
      "Podmienky podpory alebo dotácie treba vždy overiť podľa aktuálneho programu a konkrétneho riešenia. Bez preverenia by som nesľuboval nárok, výšku podpory, odpočet z ceny ani kompletné vybavenie. Pri Geotherm je praktický postup najprv konzultácia, potom overenie podmienok a až následne návrh riešenia s nacenením.",
      "subsidy_conditions_direct_scope",
      "subsidy",
      "company-truth podmienky podpory dotacia podpora overit aktualny program Geotherm",
    );
  }

  if (/(vyrocna dotacia|výročná dotácia)/.test(text)) {
    return answerBase(
      "Výročná dotácia",
      "Výročnú dotáciu alebo podporu pri Vaillant tepelných čerpadlách treba komunikovať opatrne: aktuálne podmienky, dostupnosť akcie a započítanie do ponuky sa musia overiť pri konkrétnej zostave. Bez potvrdenia nesľubujem nárok ani presnú zľavu. Najlepší ďalší krok je konzultácia s Geotherm, kde sa overia podmienky podpory a pripraví aktuálne nacenenie.",
      "vaillant_anniversary_subsidy_scope",
      "subsidy",
      "company-truth vyrocna dotacia Vaillant podpora overit podmienky aktualna ponuka Geotherm",
    );
  }

  if (/(tepelne cerpad|tepelné čerpad|cerpad|čerpad).*(video navod|video návod|navod|návod)|(?:video navod|video návod|navod|návod).*(tepelne cerpad|tepelné čerpad|cerpad|čerpad)/.test(text)) {
    return answerBase(
      "Video návody k tepelným čerpadlám",
      "Video návody sú skôr pomoc k ovládaniu, servisu a údržbe zariadenia, nie samostatné riešenie na nacenenie. Pri tepelnom čerpadle treba vždy poznať konkrétny model a prejav problému alebo otázku k nastaveniu. Ak chceš praktickú pomoc, pošli značku/model zariadenia alebo fotku štítku a Geotherm vie potvrdiť ďalší postup.",
      "heat_pump_video_guides_scope",
      "service_fault",
      "service-card-heat-pump video navody servis udrzba model zariadenie Geotherm",
    );
  }

  if (/(rekuper|vetran).*(video|navod|návod)|(?:video|navod|návod).*(rekuper|vetran)/.test(text)) {
    return answerBase(
      "Video k rekuperácii",
      "Video alebo návod k rekuperácii beriem ako pomoc k zariadeniu, ovládaniu, servisu alebo údržbe, nie ako samostatnú cenovú ponuku. Pri rekuperácii rozhoduje konkrétna jednotka, model, filtre, nastavenie a prejav problému. Ak chceš praktický ďalší krok, pošli značku/model jednotky alebo fotku štítku a Geotherm potvrdí vhodný postup.",
      "heat_recovery_video_scope",
      "service_fault",
      "service-card-heat-recovery rekuperacia video navod servis udrzba model zariadenie filtre Geotherm",
    );
  }

  if (/\bmss\b|mss system|mss systém/.test(text)) {
    return answerBase(
      "MSS systém",
      "MSS systém by som zaradil medzi solárne riešenia a zásobníkové zostavy, nie ako všeobecné tepelné čerpadlo. Pri takomto dopyte treba potvrdiť, či ide o solárny ohrev vody, kolektory, zásobník alebo kombináciu s vykurovaním. Praktický ďalší krok je konzultácia a nacenenie podľa požadovaného objemu zásobníka, počtu kolektorov a napojenia.",
      "mss_solar_system_scope",
      "process",
      "company-truth MSS solarny system solar kolektor zasobnik ohrev vody Geotherm",
    );
  }

  if (/(fotovolt|fotovoltaik).*(tepelne cerpad|tepelné čerpad|cerpad|čerpad|\btc\b|\btč\b)|(?:tepelne cerpad|tepelné čerpad|cerpad|čerpad|\btc\b|\btč\b).*(fotovolt|fotovoltaik)/.test(text)) {
    return answerBase(
      "Fotovoltaika a tepelné čerpadlo",
      "Fotovoltaika a tepelné čerpadlo môžu dávať zmysel ako spoločný systém, ale netreba sľubovať automatickú úsporu bez návrhu. Rozhodujú panely, menič, spotreba domu, riadenie prebytkov, výkon tepelného čerpadla a prípadný zásobník. Najlepší ďalší krok je konzultácia alebo nacenenie celej zostavy, aby sa potvrdilo, čo má pokryť fotovoltaika a čo tepelné čerpadlo.",
      "photovoltaics_heat_pump_scope",
      "process",
      "company-truth fotovoltaika panely tepelne cerpadlo menic zasobnik regulacia Geotherm",
    );
  }

  if (/(to je cele|to je celé|a co dalej|a čo dalej|co dalej|čo dalej)\??$/.test(text)) {
    return answerBase(
      "Ďalší krok",
      "Áno, v chate už stačí. Technické rozhodnutie sa má presunúť do overenia u Geotherm, nie do ďalšieho dotazníka. Výstup má byť konkrétny postup: servisné preverenie pri existujúcom zariadení alebo ponuka pri novom riešení.",
      "next_step_after_summary",
      "contact",
      "company-truth kontakt konzultacia servis ponuka dalsi krok Geotherm",
    );
  }

  if (/(co robit|čo robiť|ukazuje chybu|hlasi chybu|hlási chybu|chyba)/.test(text) && /(kotol|kotla|kotlov|kotly)/.test(text)) {
    return null;
  }

  if (/(barak|barák|dom).*\b\d{2,4}\s*m/.test(text) && /(co s tym|čo s tým|co teraz|čo teraz|co odporuc|čo odporúč)/.test(text)) {
    return answerBase(
      "Najprv zaraďme cieľ",
      "Pri dome s touto plochou by som bez ďalších údajov nevybral konkrétnu technológiu. Geotherm vie riešiť kúrenie, chladenie, vetranie, náklady na prevádzku aj servis existujúceho zariadenia, ale najprv treba určiť smer. Chceš riešiť hlavne kúrenie, chladenie, vetranie alebo servis?",
      "large_house_vague_goal_followup",
      "general",
      "company-truth service router complex solution heat pump air conditioning heat recovery cena náklady servis Geotherm",
    );
  }

  if (/(unik|únik).*(plyn|plynu)|(?:plyn|plynu).*(unik|únik)/.test(text)) {
    return answerBase(
      "Únik plynu",
      "Pri podozrení na únik plynu to neberiem ako bežný servisný dopyt v chate. Najprv treba bezpečne vetrať, nepoužívať otvorený oheň ani elektrické spínače a kontaktovať plynárenskú pohotovosť alebo tiesňovú linku podľa situácie. Geotherm môže následne riešiť vykurovanie alebo výmenu zdroja, ale ak ide o akútny únik plynu, priorita je bezpečnostný zásah.",
      "gas_leak_safety_scope",
      "service_fault",
      "company-truth safety unik plynu pohotovost kotol vykurovanie Geotherm",
    );
  }

  if (/(tepelne cerpad|tepelné čerpad|cerpad|čerpad).*(komfort|dome|domu)|(?:komfort|dome|domu).*(tepelne cerpad|tepelné čerpad|cerpad|čerpad)/.test(text)) {
    return answerBase(
      "Tepelné čerpadlo pre komfort v dome",
      "Tepelné čerpadlo môže byť dobrý základ komfortného vykurovania domu, hlavne ak je správne navrhnuté spolu s vykurovacou sústavou, teplou vodou, reguláciou a servisom. Predbežný smer je často vzduch-voda, ale pri staršom dome s radiátormi treba overiť teplotu vody a výkon radiátorov. Ak chceš riešiť konkrétnu ponuku, najlepší ďalší krok je krátka konzultácia s Geotherm podľa typu domu, plochy a vykurovania.",
      "heat_pump_comfort_scope",
      "recommendation",
      "service-card-heat-pump tepelne cerpadlo komfort dom vzduch-voda radiator podlahove kurenie Geotherm",
    );
  }

  if (
    !/(cena|ceny|cenov|vratane|vrátane|kolko|koľko|stoji|stojí)/.test(text) &&
    (/(instalac|inštalác|montaz|montáž).*(tepelne cerpad|tepelné čerpad|cerpad|čerpad)|(?:tepelne cerpad|tepelné čerpad|cerpad|čerpad).*(instalac|inštalác|montaz|montáž)/.test(text))
  ) {
    return answerBase(
      "Inštalácia tepelného čerpadla",
      "Inštalácia tepelného čerpadla má začať návrhom, nie iba výberom jednotky. Treba overiť výkon pre dom, vykurovaciu sústavu, TÚV, umiestnenie vonkajšej jednotky, elektroprípravu, hydrauliku, montáž a uvedenie do prevádzky. Geotherm vie pripraviť kompletný postup od návrhu po realizáciu; konkrétnu zostavu a cenu by som riešil cez konzultáciu a nacenenie.",
      "heat_pump_installation_scope",
      "process",
      "service-card-heat-pump instalacia tepelne cerpadlo montaz navrh uvedenie do prevadzky Geotherm",
    );
  }

  if (/(tepelne cerpad|tepelné čerpad|cerpad|čerpad).*(vzduch voda|rychly prehlad|rýchly prehľad|prehlad|prehľad)|(?:vzduch voda|rychly prehlad|rýchly prehľad|prehlad|prehľad).*(tepelne cerpad|tepelné čerpad|cerpad|čerpad)/.test(text)) {
    return answerBase(
      "Tepelné čerpadlo vzduch-voda",
      "Tepelné čerpadlo vzduch-voda je najčastejší smer pri rodinných domoch, lebo nepotrebuje vrt ani plošný kolektor a vie riešiť kúrenie aj teplú vodu. Pri novostavbe s podlahovkou býva veľmi vhodné; pri staršom dome s radiátormi treba overiť výkon radiátorov a potrebnú teplotu vody. Konkrétnu zostavu by som riešil cez konzultáciu a nacenenie.",
      "heat_pump_air_water_overview_scope",
      "recommendation",
      "service-card-heat-pump tepelne cerpadlo vzduch-voda rodinny dom radiator podlahove kurenie Geotherm",
    );
  }

  if (/(komfort|rodin|rodina).*(vykurov|kuren|kúren)|(?:vykurov|kuren|kúren).*(komfort|rodin|rodina)/.test(text)) {
    return answerBase(
      "Komfortné vykurovanie",
      "Komfortné vykurovanie pre rodinný dom sa má riešiť ako celý systém: zdroj tepla, podlahové kúrenie alebo radiátory, regulácia, teplá voda a servis. Predbežne môže dávať zmysel tepelné čerpadlo vzduch-voda, najmä pri novostavbe alebo nízkoteplotnom vykurovaní. Pri konkrétnej rodine a dome by som už smer presunul na konzultáciu a nacenenie podľa plochy, vykurovania a požiadaviek na TÚV.",
      "comfortable_heating_scope",
      "recommendation",
      "service-card-heat-pump komfortne vykurovanie tepelne cerpadlo rodinny dom regulacia TUV Geotherm",
    );
  }

  if (/(stars|starš|starsi|starší).*(dom).*(plyn|plynov|ucet|účet).*(cerpad|čerpad|podlah|dotac|dotác)|(?:cerpad|čerpad|podlah|dotac|dotác).*(stars|starš|starsi|starší).*(dom).*(plyn|plynov|ucet|účet)/.test(text)) {
    return answerBase(
      "Najprv rozhodnúť smer",
      "Pri staršom dome s veľkým účtom za plyn by som najprv nerozhodoval naraz tepelné čerpadlo, podlahovku aj dotáciu. Predbežne dáva zmysel preveriť výmenu plynu za tepelné čerpadlo alebo úpravu vykurovania, ale dotácia ani podlahovka nemusia byť automaticky najlepší prvý krok. Čo je hlavný cieľ: znížiť náklady na kúrenie, riešiť komfort, alebo zistiť možnosť dotácie?",
      "older_gas_house_chaotic_followup",
      "recommendation",
      "company-truth scenar-starsi-dom-radiatory-plyn tepelné čerpadlo plyn náklady podlahové kúrenie dotácia Geotherm",
    );
  }

  if (/(dotac|dotác|prispev|príspev|poukaz).*(najprv|najskor|najskôr|kupit|kúpiť|poziadat|požiadať|kontrol)|(?:najprv|najskor|najskôr|kupit|kúpiť|poziadat|požiadať|kontrol).*(dotac|dotác|prispev|príspev|poukaz)/.test(text)) {
    return answerBase(
      "Poradie pri dotácii",
      "Pri dotácii by som nekupoval ani nesľuboval nárok naslepo. Najprv sa má overiť, či riešenie a domácnosť spĺňajú aktuálne podmienky programu, potom sa pripraví vhodná ponuka a až následne sa rieši podanie alebo ďalší administratívny krok. Kontrola závisí od konkrétneho programu, preto ju netreba hádať v chate. Riešiš dotáciu k tepelnému čerpadlu, fotovoltike alebo inému riešeniu?",
      "subsidy_order_followup",
      "subsidy",
      "company-truth dotacie prispevok poukaz poradie ziadost ponuka kontrola tepelne cerpadlo fotovoltaika Geotherm",
    );
  }

  if (/(dotac|dotác|prispev|príspev|podpor).*(oze|obnovitel|obnoviteľ)|(?:oze|obnovitel|obnoviteľ).*(dotac|dotác|prispev|príspev|podpor)/.test(text)) {
    return answerBase(
      "Dotácie OZE",
      "Pri dotáciách na OZE vieme pomôcť orientačne s tým, aký typ riešenia dáva zmysel, ale aktuálne pravidlá programu treba vždy overiť. Bez potvrdenia nesľubujem nárok, odpočet z ceny ani kompletné vybavenie. Pri Geotherm to má zmysel riešiť spolu s návrhom konkrétneho zariadenia, napríklad tepelného čerpadla alebo iného podporovaného riešenia.",
      "subsidy_oze_scope",
      "subsidy",
      "company-truth dotacie OZE obnovitelne zdroje tepelne cerpadlo podpora Geotherm",
    );
  }

  if (/(dotac|dotác|prispev|príspev|poukaz|cerpanie dotac|čerpanie dotác|aktualny stav|aktuálny stav).*(dotac|dotác|podpor|prispev|príspev|poukaz)|(?:dotac|dotác|podpor|prispev|príspev|poukaz).*(cerpanie|čerpanie|aktualny|aktuálny|otazk|otázk)/.test(text)) {
    return answerBase(
      "Dotácie",
      "Pri dotáciách treba rozlišovať aktuálne pravidlá programu a konkrétnu ponuku. Geotherm môže pomôcť s orientáciou a návrhom vhodného riešenia, ale bez overenia nesľubujem nárok, termín, odpočet z ceny ani kompletné vybavenie. Najlepší ďalší krok je krátka konzultácia: aké zariadenie riešiš, či ide o nový dom alebo výmenu a aký program podpory prichádza do úvahy.",
      "subsidy_general_scope",
      "subsidy",
      "company-truth dotacie podpora prispevok poukaz aktualne podmienky ponuka Geotherm",
    );
  }

  if (/(podmienky podpory|vyrocna dotacia|výročná dotácia|dotac|dotác|prispev|príspev|poukaz).*(vaillant|tepelne cerpad|tepelné čerpad|cerpad|čerpad|podpor)|(?:vaillant|tepelne cerpad|tepelné čerpad|cerpad|čerpad|podpor).*(podmienky podpory|vyrocna dotacia|výročná dotácia|dotac|dotác|prispev|príspev|poukaz)/.test(text)) {
    return answerBase(
      "Dotácia a podmienky podpory",
      "S dotáciou vieme pomôcť orientačne, ale pri dotácii alebo podpore k tepelnému čerpadlu treba najprv overiť aktuálne podmienky programu a konkrétnu zostavu. Bez potvrdenia nesľubujem nárok, odpočet z ceny ani kompletné vybavenie. Pri Vaillante alebo NIBE sa dá pripraviť vhodná ponuka až podľa domu a platných pravidiel. Najlepší ďalší krok je krátka konzultácia s Geotherm.",
      "subsidy_conditions_scope",
      "subsidy",
      "company-truth dotacia podmienky podpory Vaillant NIBE tepelne cerpadlo ponuka Geotherm",
    );
  }

  if (/(state subsidy|subsidy).*(heat pump)|(?:heat pump).*(state subsidy|subsidy)/.test(text)) {
    return answerBase(
      "Dotácia na heat pump",
      "Pri dotácii na heat pump, teda tepelné čerpadlo, by som najprv overil aktuálne podmienky programu a až potom riešil ponuku. Bez potvrdenia nesľubujem nárok, odpočet z ceny ani kompletné vybavenie. Pri návrhu treba rátať aj s rozsahom dodávky, montážou, servisom a konkrétnou zostavou, napríklad NIBE alebo Vaillant podľa ponuky. Ide o nové tepelné čerpadlo do domu alebo výmenu starého zdroja?",
      "mixed_language_subsidy_followup",
      "subsidy",
      "company-truth heat pump tepelne cerpadlo dotacie servis cena NIBE Vaillant Geotherm",
    );
  }

  if (/(firmu|firma|business|prevadz|prevádz).*(topeni|topenie|vykurov|kuren|kúren)|(?:topeni|topenie|vykurov|kuren|kúren).*(firmu|firma|business|prevadz|prevádz)/.test(text)) {
    return answerBase(
      "Vykurovanie pre firmu",
      "Pri firme by som to bral ako návrh vykurovania pre konkrétnu prevádzku, nie ako rýchly výber zariadenia. Predbežne sa môže riešiť tepelné čerpadlo, regulácia, prípadne chladenie alebo vetranie; pri väčšom objekte je dôležitý aj servis a prevádzkové náklady. Dotácia alebo podpora sa dá spomenúť len po overení pravidiel. Ide o kancelárie, prevádzku alebo sklad/väčšiu halu?",
      "business_heating_followup",
      "recommendation",
      "company-truth tepelne cerpadlo vykurovanie firma servis dotacia cena NIBE Geotherm",
    );
  }

  if (/^(rekuperacia|rekuperácia)\??$|(?:rekuperacia|rekuperácia|vetranie).*(tepla|robite|robíte|viete|vysvetlit|vysvetliť|porad|nacen|naceň|cena)/.test(text)) {
    return answerBase(
      "Rekuperácia",
      "Rekuperácia rieši riadené vetranie s výmenou vzduchu bez bežného otvárania okien. Pri dome dáva najväčší zmysel navrhnúť centrálnu rekuperáciu spolu s rozvodmi, jednotkou, filtrami, odťahom z kúpeľní/kuchyne a prívodom čerstvého vzduchu do obytných miestností. Pre nacenenie treba vedieť, či ide o novostavbu alebo rekonštrukciu, približnú plochu a či sa má vetrať celý dom.",
      "heat_recovery_general_scope",
      "recommendation",
      "service-card-heat-recovery rekuperacia vetranie rozvody filtre cely dom Geotherm",
    );
  }

  if (/(rekuper|vetran).*(filter|filtre)|(?:filter|filtre).*(rekuper|vetran)/.test(text)) {
    return answerBase(
      "Filtre pre rekuperáciu",
      "Filtre pri rekuperácii sú bežná servisná a údržbová téma. Treba ich riešiť podľa konkrétnej jednotky, typu filtrov a prostredia v dome; bez modelu jednotky by som nepotvrdil presný filter ani interval. Praktický ďalší krok je poslať značku/model rekuperácie alebo fotku štítku a Geotherm vie potvrdiť vhodný servis alebo výmenu filtrov.",
      "heat_recovery_filters_scope",
      "service_fault",
      "service-card-heat-recovery rekuperacia filtre vetranie servis Geotherm",
    );
  }

  if (/(vaillant).*(rekuper|vetran)|(?:rekuper|vetran).*(vaillant)/.test(text)) {
    return answerBase(
      "Vaillant rekuperácia",
      "Pri otázke na Vaillant rekuperáciu by som neprepínal automaticky na tepelné čerpadlá. Ide o vetranie/rekuperáciu, kde treba potvrdiť aktuálnu ponuku, vhodnú jednotku, rozvody, filtre a spôsob regulácie podľa domu. Ak riešiš nový dom alebo rekonštrukciu, najlepší ďalší krok je konzultácia a nacenenie vetrania spolu s ostatnými technológiami.",
      "vaillant_heat_recovery_scope",
      "brand_model",
      "service-card-heat-recovery Vaillant rekuperacia vetranie filtre jednotka Geotherm",
    );
  }

  if (/(nibe).*(rekuper|vetran)|(?:rekuper|vetran).*(nibe)/.test(text)) {
    return answerBase(
      "NIBE rekuperácia",
      "Pri otázke na NIBE rekuperáciu by som neprepínal automaticky na tepelné čerpadlá. Ide o vetranie/rekuperáciu, kde treba potvrdiť aktuálnu ponuku, vhodnú jednotku, filtre, rozvody a reguláciu podľa domu. Ak riešiš nový dom alebo rekonštrukciu, najlepší ďalší krok je konzultácia a nacenenie vetrania spolu s ostatnými technológiami.",
      "nibe_heat_recovery_scope",
      "brand_model",
      "service-card-heat-recovery NIBE rekuperacia vetranie filtre jednotka Geotherm",
    );
  }

  if (/(navrh|návrh|navrhem|návrhem).*(vytap|vytáp|vykur|kuren|kúren)|(?:vytap|vytáp|vykur|kuren|kúren).*(navrh|návrh|navrhem|návrhem)/.test(text)) {
    return answerBase(
      "Návrh vykurovania",
      "Áno, Geotherm vie pomôcť s návrhom vykurovania, ale bez podkladov by som nesľuboval konkrétny systém. Pri dome sa často porovnáva tepelné čerpadlo, podlahové kúrenie, radiátory, regulácia, teplá voda a následný servis. Na presnejší smer treba aspoň typ objektu, plochu a či ide o novostavbu alebo rekonštrukciu.",
      "heating_design_followup",
      "process",
      "company-truth navrh vykurovania tepelné čerpadlo podlahové kúrenie radiátory servis dotácia Geotherm",
    );
  }

  if (/(prerab|preráb|rekonstruk|rekonštruk|uprav|úprav).*(kuren|kúren|vykurov).*(star|stary|starý|stare|staré|dom)|(?:star|stary|starý|stare|staré|dom).*(prerab|preráb|rekonstruk|rekonštruk|uprav|úprav).*(kuren|kúren|vykurov)/.test(text)) {
    return answerBase(
      "Prerábka kúrenia v staršom dome",
      "Áno, prerábka kúrenia v staršom dome sa dá riešiť, ale rozsah treba potvrdiť podľa existujúcej kotolne, radiátorov, rozvodov a cieľa. Predbežne môže ísť o úpravu radiátorového systému, výmenu zdroja tepla, reguláciu alebo prípravu na tepelné čerpadlo. Najlepší ďalší krok je konzultácia alebo nacenenie podľa fotiek kotolne, plochy domu a aktuálneho zdroja tepla.",
      "heating_reconstruction_scope",
      "process",
      "company-truth prerabka kurenia starsi dom radiatorovy system kotolna rozvody Geotherm",
    );
  }

  if (/(podlah|podlahov).*(vykurov|kuren|kúren|nastav|regul|nacen|naceň|cena)|(?:vykurov|kuren|kúren|nastav|regul|nacen|naceň|cena).*(podlah|podlahov)/.test(text)) {
    return answerBase(
      "Podlahové vykurovanie",
      "Podlahové vykurovanie je nízkoteplotný systém, ktorý sa dobre kombinuje s tepelným čerpadlom a správnou reguláciou. Pri nacenení alebo nastavení rozhoduje plocha, skladba podlahy, rozdeľovače, zdroj tepla a to, či ide o novostavbu alebo rekonštrukciu. Praktický ďalší krok je konzultácia alebo nacenenie podľa plochy, projektu a fotiek rozdeľovača.",
      "floor_heating_scope",
      "process",
      "service-card-floor-heating podlahove vykurovanie podlahove kurenie nizkoteplotne tepelne cerpadlo Geotherm",
    );
  }

  if (/(cenov|cena|nacen|naceň|ponuk).*(vykurov|vetran|chladen)|(?:vykurov|vetran|chladen).*(cenov|cena|nacen|naceň|ponuk)/.test(text)) {
    return answerBase(
      "Cenová ponuka na technické riešenie",
      "Pri cenovej ponuke na vykurovanie, vetranie alebo chladenie sa nedá férovo potvrdiť jedna cena bez rozsahu. Treba rozdeliť, či ide o tepelné čerpadlo, rekuperáciu, klimatizáciu alebo komplexné riešenie s reguláciou a montážou. Najlepší ďalší krok je poslať základné údaje o objekte a dohodnúť konzultáciu, aby Geotherm pripravil konkrétne nacenenie.",
      "complex_solution_price_scope",
      "price",
      "company-truth cena ponuka vykurovanie vetranie rekuperacia chladenie montaz Geotherm",
    );
  }

  if (/(strop|stropne|stropné).*(chladen|chladi)|(?:chladen|chladi).*(strop|stropne|stropné)/.test(text)) {
    return answerBase(
      "Stropné chladenie",
      "Áno, stropné chladenie sa dá riešiť ako komfortné plošné chladenie domu. Treba ho navrhnúť odborne, hlavne kvôli regulácii vlhkosti a rosnému bodu; bez návrhu by som nesľuboval, že automaticky nahradí klimatizáciu. Najlepší ďalší krok je konzultácia alebo nacenenie podľa toho, či ide o novostavbu alebo rekonštrukciu a aký rozsah miestností sa má chladiť.",
      "ceiling_cooling_scope",
      "recommendation",
      "service-card-ceiling-cooling stropne chladenie regulacia vlhkost rosny bod Geotherm",
    );
  }

  if (/(temperovanie betonoveho jadra|temperovanie betónového jadra|\bbkt\b)/.test(text)) {
    return answerBase(
      "Temperovanie betónového jadra BKT",
      "Temperovanie betónového jadra BKT je plošné vykurovanie a chladenie integrované do betónovej konštrukcie. Dáva zmysel najmä pri novostavbách alebo väčších objektoch, kde sa systém navrhne už v projekte. Treba riešiť reguláciu, vlhkosť, zdroj tepla/chladu a skladbu stavby. Praktický ďalší krok je technická konzultácia a nacenenie podľa projektu.",
      "bkt_ceiling_cooling_scope",
      "recommendation",
      "service-card-ceiling-cooling BKT temperovanie betonoveho jadra chladenie vykurovanie Geotherm",
    );
  }

  if (/(stenov|stenové|stenove).*(vykurov|kuren|kúren|chladen|chladi)|(?:vykurov|kuren|kúren|chladen|chladi).*(stenov|stenové|stenove)/.test(text)) {
    return answerBase(
      "Stenové vykurovanie a chladenie",
      "Stenové vykurovanie alebo chladenie patrí medzi plošné systémy, kde je dôležitý návrh skladby, regulácie a vlhkosti. Pri kúrení ide o komfortné nízkoteplotné riešenie, pri chladení treba strážiť rosný bod podobne ako pri stropnom chladení. Najlepší ďalší krok je konzultácia alebo nacenenie podľa projektu, miestností a toho, či ide o novostavbu alebo rekonštrukciu.",
      "wall_heating_cooling_scope",
      "recommendation",
      "service-card-ceiling-cooling stenove vykurovanie chladenie plosny system regulacia vlhkost Geotherm",
    );
  }

  if (/(podlah|podlahov).*(vykurov|kuren|kúren)/.test(text)) {
    return answerBase(
      "Podlahové vykurovanie",
      "Podlahové vykurovanie je nízkoteplotný systém, ktorý sa dobre kombinuje s tepelným čerpadlom a správnou reguláciou. Pri nacenení rozhoduje plocha, skladba podlahy, rozdeľovače, zdroj tepla a to, či ide o novostavbu alebo rekonštrukciu. Ak riešiš realizáciu, praktický ďalší krok je konzultácia alebo nacenenie podľa plochy a projektu.",
      "floor_heating_scope",
      "process",
      "service-card-floor-heating podlahove vykurovanie podlahove kurenie nizkoteplotne tepelne cerpadlo Geotherm",
    );
  }

  if (/(komplexne|komplexné).*(riesenie|riešenie|budov|vykurov|vetran|chladen)|(?:vykurov|vetran|chladen).*(komplexne|komplexné)/.test(text)) {
    return answerBase(
      "Komplexné riešenie budovy",
      "Áno, toto by som bral ako komplexné technické riešenie, nie ako výber jedného zariadenia. Typicky sa skladá z vykurovania, prípravy teplej vody, vetrania alebo rekuperácie, chladenia, regulácie a následného servisu. V chate sa dá určiť smer, ale finálne nacenenie má ísť cez konzultáciu s Geotherm podľa objektu a požadovaného rozsahu.",
      "complex_solution_scope",
      "process",
      "company-truth complex solution vykurovanie vetranie chladenie rekuperacia regulacia servis Geotherm",
    );
  }

  if (/(podlah|podlahov).*(nastav|regul|vyregul)|(?:nastav|regul|vyregul).*(podlah|podlahov)/.test(text)) {
    return answerBase(
      "Nastavenie podlahového kúrenia",
      "Podlahové kúrenie sa dá nastavovať cez reguláciu, prietoky a teplotu vykurovacej vody, ale bez znalosti rozdeľovača a zdroja tepla by som nedával presný postup. Ak je doma nerovnomerná teplota, pomalá reakcia alebo vysoká spotreba, Geotherm vie preveriť nastavenie systému a navrhnúť úpravy. Praktický krok je konzultácia alebo servisné preverenie podľa fotiek rozdeľovača a zdroja.",
      "floor_heating_setting_scope",
      "service_fault",
      "company-truth podlahove kurenie nastavenie regulacia rozdelovac prietoky servis Geotherm",
    );
  }

  if (/(zmakcovac|zmäkčovač|uprava vody|úprava vody|katex)/.test(text)) {
    return answerBase(
      "Zmäkčovač a úprava vody",
      "Zmäkčovač vody alebo úprava vody sa rieši podľa tvrdosti vody, prietoku, počtu osôb a miesta montáže. Bez rozboru alebo aspoň údajov o tvrdosti by som nevybral konkrétne zariadenie. Ak to má byť súčasť technickej miestnosti, dáva zmysel prebrať to spolu s kúrením, TÚV alebo rozvodmi a následne pripraviť nacenenie.",
      "water_softener_scope",
      "process",
      "company-truth zmakcovac vody uprava vody technicka miestnost rozvody Geotherm",
    );
  }

  if (/^(cementove|cementové|anhydritove|anhydritové)\??$|(?:poter|potery|cementove|cementové|anhydritove|anhydritové).*(robite|robíte|viete|mate|máte|nacen|naceň|porad)|(?:robite|robíte|viete|mate|máte|nacen|naceň|porad).*(poter|potery|cementove|cementové|anhydritove|anhydritové)/.test(text)) {
    return answerBase(
      "Potery",
      "Pri poteroch treba rozlíšiť cementový a anhydritový poter, podklad, hrúbku, plochu a to, či ide aj o podlahové kúrenie. Bez týchto údajov by som nepotvrdil presnú cenu ani vhodný typ. Praktický ďalší krok je poslať plochu, typ stavby a skladbu podlahy; Geotherm potom vie potvrdiť, či je téma v rozsahu ponuky a pripraviť nacenenie.",
      "screeds_scope",
      "price",
      "company-truth potery cementovy anhydritovy poter podlahove kurenie nacenenie Geotherm",
    );
  }

  if (/(fernox|ochranne.*kvapalin|ochranné.*kvapalin|udrzbove.*kvapalin|údržbové.*kvapalin|nemrznuca kvapalina|nemrznúca kvapalina|teplonosne kvapaliny|teplonosné kvapaliny)/.test(text)) {
    return answerBase(
      "Ochranné a údržbové kvapaliny",
      "Ochranné, údržbové alebo teplonosné kvapaliny sa riešia pri vykurovacích, chladiacich aj solárnych systémoch podľa typu sústavy, materiálov, objemu vody a požadovanej ochrany. Bez kontroly systému by som neodporúčal konkrétny prípravok ani dávkovanie. Praktický ďalší krok je servisné preverenie alebo konzultácia, kde sa potvrdí stav vody, zariadenia a vhodná údržba.",
      "system_fluids_scope",
      "service_fault",
      "company-truth ochranne udrzbove kvapaliny Fernox voda vykurovaci solarny system servis Geotherm",
    );
  }

  if (/(ecocompact|eco compact|aurocompact|auro compact|compact vsc)/.test(text)) {
    return answerBase(
      "Vaillant compact riešenia",
      "ecoCOMPACT alebo auroCOMPACT by som nebral ako aktuálny výber tepelného čerpadla. Ide o názvy Vaillant compact riešení spájaných skôr s kotlovou alebo zásobníkovou zostavou, preto treba overiť presný model a aktuálnu ponuku. Ak riešiš nové vykurovanie cez Geotherm, bezpečnejšie je porovnať aktuálne riešenie Vaillant alebo NIBE podľa domu a pripraviť nacenenie.",
      "vaillant_compact_boiler_scope",
      "brand_model",
      "company-truth Vaillant ecoCOMPACT auroCOMPACT compact kotol zasobnik aktualna ponuka Geotherm",
    );
  }

  if (/(drazice|dražice|argo)/.test(text)) {
    return answerBase(
      "Dražice ARGO",
      "Dražice ARGO by som bral ako konkrétnu produktovú tému, ktorú treba overiť podľa aktuálnej ponuky a vhodnosti pre dom. Bez technického návrhu by som nesľuboval konkrétny model ani parametre. Ak cieľom je tepelné čerpadlo alebo ohrev vody, najlepší ďalší krok je konzultácia s Geotherm: typ domu, plocha, vykurovanie, TÚV a požadovaný rozsah montáže.",
      "drazice_argo_scope",
      "brand_model",
      "product-facts Drazice ARGO tepelne cerpadlo ohrev vody aktualna ponuka Geotherm",
    );
  }

  if (/(ecotec|eco tec|vcw|vu)\b/.test(text)) {
    return answerBase(
      "Vaillant ecoTEC",
      "ecoTEC plus VU alebo VCW by som bral ako Vaillant kotlovú tému, nie ako výber tepelného čerpadla. Pri takomto označení treba overiť presný model, či ide o existujúci kotol, výmenu alebo nové riešenie. Ak cieľom je úspora vykurovania, Geotherm môže porovnať servis/náhradu kotla s novším riešením, napríklad tepelným čerpadlom podľa domu.",
      "vaillant_ecotec_boiler_scope",
      "brand_model",
      "company-truth Vaillant ecoTEC VU VCW kotol kondenzačný kotol Geotherm",
    );
  }

  if (/(logamax|gb122|gb 122)/.test(text)) {
    return answerBase(
      "Buderus Logamax",
      "Logamax GB122 by som bral ako Buderus kotlovú tému, nie ako výber tepelného čerpadla. Pri existujúcom zariadení treba overiť presný model, stav kotla a či ide o servis alebo výmenu. Ak cieľom je nové úspornejšie vykurovanie, Geotherm môže pri konzultácii porovnať kotlové riešenie s inou technológiou podľa domu.",
      "buderus_logamax_boiler_scope",
      "brand_model",
      "company-truth Buderus Logamax GB122 kotol vykurovanie servis vymena Geotherm",
    );
  }

  if (/\bbuderus\b/.test(text)) {
    return answerBase(
      "Buderus",
      "Buderus by som v chate bral opatrne ako značku vykurovacej techniky, hlavne kotlovú tému, nie ako potvrdené hlavné portfólio tepelných čerpadiel Geotherm. Ak ide o existujúci kotol Buderus, treba riešiť servis alebo výmenu podľa modelu. Ak ide o nové riešenie, aktuálnu ponuku značiek a vhodnú náhradu treba potvrdiť pri konzultácii.",
      "buderus_brand_scope",
      "brand_model",
      "company-truth Buderus kotol vykurovacia technika servis vymena Geotherm",
    );
  }

  if (/\bgree\b/.test(text)) {
    return answerBase(
      "Klimatizácia GREE",
      "GREE by som bral ako klimatizačnú tému, nie ako potvrdené portfólio tepelných čerpadiel voda/voda alebo vzduch/voda. Pri klimatizácii treba overiť miestnosti, výkon, umiestnenie vnútornej a vonkajšej jednotky, hlučnosť a servis. Ak chceš nové chladenie, ďalší krok je konzultácia a nacenenie podľa miestností.",
      "gree_air_conditioning_scope",
      "brand_model",
      "service-card-air-conditioning klimatizacia GREE chladenie vonkajsia jednotka servis Geotherm",
    );
  }

  if (
    /^(klimatizacia|klimatizácia|klimatizacie|klimatizácie)\??$|(?:klimatizacia|klimatizácia|klimatizacie|klimatizácie).*(robite|robíte|viete|porad|nacen|naceň|cena|montaz|montáž)/.test(text) ||
    (!/(strop|podlah|tepelne cerpad|cerpadl|kuren|vykurov|vetran|rekuper)/.test(text) && /(?:chcem|potrebujem|riesim|hľadám|hladam).*(chladen|klimu|klimatiz)|chladenie do domu|chladit dom|chladiť dom/.test(text))
  ) {
    return answerBase(
      "Klimatizácia",
      "Klimatizáciu by som riešil podľa miestností, tepelnej záťaže, umiestnenia vnútornej a vonkajšej jednotky, hlučnosti, odvodu kondenzátu a servisu. Pri viacerých miestnostiach sa porovnáva viac samostatných jednotiek alebo multisplit. Na nacenenie je dôležitá hlavne plocha miestností a možné miesto pre vonkajšiu jednotku.",
      "air_conditioning_general_scope",
      "recommendation",
      "service-card-air-conditioning klimatizacia chladenie multisplit montaz servis Geotherm",
    );
  }

  if (/(eloblock|elo block|ve 6|ve 9|ve 12|ve 14|ve 18|ve 21|ve 24|ve 28)/.test(text)) {
    return answerBase(
      "Vaillant eloBLOCK",
      "eloBLOCK VE by som bral ako Vaillant elektrokotol alebo kotlovú tému, nie ako tepelné čerpadlo. Pri otázke na tento rad treba overiť, či ide o existujúce zariadenie, výmenu alebo nový zdroj tepla. Ak cieľom je úspora prevádzky, Geotherm môže porovnať elektrokotol s vhodnejším riešením vykurovania, napríklad tepelným čerpadlom podľa domu.",
      "vaillant_eloblock_boiler_scope",
      "brand_model",
      "company-truth Vaillant eloBLOCK VE elektrokotol kotol vykurovanie Geotherm",
    );
  }

  if (/(ivt).*(nordic inverter)|(?:nordic inverter).*(ivt)/.test(text)) {
    return answerBase(
      "IVT Nordic Inverter",
      "IVT Nordic Inverter by som bez aktuálneho potvrdenia nekomunikoval ako štandardné nové portfólio Geotherm. Pri názve ide skôr o konkrétny produkt alebo staršiu/modelovú informáciu, ktorú treba overiť podľa aktuálnej ponuky a servisu. Ak chceš nové riešenie, bezpečne sa pri tepelných čerpadlách komunikuje hlavne NIBE a Vaillant; pri existujúcom IVT je najlepší ďalší krok overiť model a dostupnosť servisu.",
      "ivt_nordic_inverter_scope",
      "brand_model",
      "company-truth IVT Nordic Inverter vzduch tepelne cerpadlo servis NIBE Vaillant Geotherm",
    );
  }

  if (/(zostavy tlakove|tlakove zostavy|tlakové zostavy|tlakove.*zasobnik|tlakové.*zásobník|zasobnik.*kolektor|zásobník.*kolektor|aurostep|drain back|slnecne kolektor|slnečné kolektor)/.test(text)) {
    return answerBase(
      "Solárne zostavy a zásobníky",
      "Pri tlakových solárnych zostavách alebo zásobníkoch nejde o poruchu tlaku v kúrení, ale o zostavu pre ohrev vody alebo solárne riešenie. Treba overiť typ kolektorov, objem zásobníka, napojenie na existujúci zdroj a rozsah montáže. Bez konkrétnej zostavy by som nepotvrdil cenu ani dostupnosť; vhodný ďalší krok je konzultácia a nacenenie podľa objektu.",
      "solar_collector_tank_scope",
      "process",
      "company-truth solarne kolektory tlakove zostavy zasobnik ohrev vody Geotherm",
    );
  }

  if (/^(kontakt|kontakt\?|kontaktovat|kontaktovať)$/.test(text)) {
    return answerBase(
      "Kontakt",
      "Kontakt sa dá riešiť cez oficiálne údaje na stránke Geotherm. Aby som ťa naviedol správne, potrebuješ kontakt kvôli ponuke, servisu alebo všeobecnej konzultácii?",
      "contact_short_followup",
      "contact",
      "company-truth kontakt Geotherm telefon email servis ponuka konzultacia",
    );
  }

  if (/(nechcem|nedam|nedám).*(email|mail)/.test(text)) {
    return answerBase(
      "Bez e-mailu",
      "E-mail nemusíš dávať. Ak ešte nechceš posielať osobné údaje, dá sa najprv pripraviť krátke zhrnutie problému alebo požiadavky priamo tu v chate. Kontakt má zmysel až vtedy, keď chceš, aby sa ti Geotherm ozval späť.",
      "no_email",
      "contact",
      "company-truth contact telefon email Geotherm",
    );
  }

  if (/^(co s tym|čo s tým|co teraz|čo teraz)\??$/.test(text)) {
    return answerBase(
      "Prvý krok",
      "Najprv zariadenie nenastavuj naslepo. Zapíš si, kedy sa problém prejavuje, či je na displeji chyba a či sa zmenil hluk, tlak alebo teplota. Praktický ďalší krok je poslať Geotherm popis prejavu a dohodnúť servisné preverenie.",
      "what_to_do_next_service_triage",
      "service_fault",
      "company-truth servis diagnostika porucha hluk chyba postup Geotherm",
    );
  }

  if (/(pada|padá|klesa|klesá).*\btlak\b|\btlak\b.*(pada|padá|klesa|klesá)/.test(text)) {
    return answerBase(
      "Pokles tlaku v kúrení",
      "Ak padá tlak v kúrení, beriem to ako servisný problém. Môže ísť o únik vody, expanznú nádobu, poistný ventil, dopúšťanie alebo problém v kotolni; bezpečné je nerobiť zásahy naslepo. Najpraktickejší ďalší krok je poslať značku/model zdroja, aktuálny tlak za studena a za tepla, či niekde vidno vodu, lokalitu a kontakt na servisné preverenie.",
      "pressure_drop_service_scope",
      "service_fault",
      "company-truth service tlak kurenie unik vody expanzna nadoba diagnostika Geotherm",
    );
  }

  if (/(nejde|nefunguje|nekuri|nekúri).*(kuren|kúren|vykurov|kotol|cerpad|čerpad)|(?:kuren|kúren|vykurov|kotol|cerpad|čerpad).*(nejde|nefunguje|nekuri|nekúri)/.test(text)) {
    return answerBase(
      "Keď nejde kúrenie",
      "Ak nejde kúrenie, beriem to ako servisnú triáž. Najprv netreba robiť zásahy do zariadenia naslepo; treba zistiť značku a model zdroja, chybový kód alebo hlásenie, aktuálny tlak, či ide aj teplá voda a lokalitu. Pri cudzích montážach sa dostupnosť servisu musí potvrdiť podľa značky a prípadu. Najlepší ďalší krok je poslať fotku displeja alebo štítku, popis prejavu a kontakt.",
      "heating_not_working_triage",
      "service_fault",
      "company-truth service nejde kurenie porucha kotol tepelne cerpadlo chybovy kod tlak lokalita Geotherm",
    );
  }

  if (/(hlasi|hlási|ukazuje|zobrazuje).*(chybu|chybovy|chybový|kod|kód)|(?:chybu|chybovy|chybový|kod|kód).*(hlasi|hlási|ukazuje|zobrazuje)/.test(text)) {
    return answerBase(
      "Chybové hlásenie zariadenia",
      "Ak kotol, tepelné čerpadlo alebo iné zariadenie hlási chybu, neradil by som zásah do zariadenia naslepo. Najprv treba identifikovať značku, model, chybový kód, lokalitu a či zariadenie kúri alebo úplne stojí. Najlepší ďalší krok je poslať fotku displeja alebo štítku a kontakt, aby Geotherm potvrdil bezpečný servisný postup.",
      "error_code_service_scope",
      "service_fault",
      "company-truth service chybovy kod displej znacka model lokalita Geotherm",
    );
  }

  if (/(robite|robíte|viete|mate|máte).*(radiator|radiátor)|(?:radiator|radiátor).*(robite|robíte|viete|mate|máte)/.test(text)) {
    return answerBase(
      "Radiátory",
      "Áno, radiátory sa v podkladoch Geotherm riešia ako súčasť vykurovacieho systému. Pri novej realizácii alebo výmene treba potvrdiť výkon, teplotný spád, typ zdroja tepla a stav rozvodov. Pri tepelnom čerpadle je dôležité overiť, či radiátory vykúria dom pri nižšej teplote vody, alebo bude treba časť vykurovacích telies upraviť.",
      "radiators_scope",
      "process",
      "company-truth radiatory vykurovacie telesa tepelne cerpadlo teplotny spad Geotherm",
    );
  }

  if (isContactQuestion(message)) {
    return answerBase(
      "Ako sa spojiť",
      "Najistejšia cesta je otvoriť web Geotherm a prejsť do sekcie Kontakt. Tam budú aktuálne kanály priamo od firmy. Do správy stačí napísať, že chceš spätnú reakciu k svojej veci; detaily sa môžu doplniť až následne.",
      "contact_details",
      "contact",
      "company-truth kontakt Geotherm telefon email adresa",
    );
  }

  if ((text.includes("nibe") && text.includes("vaillant")) && (text.includes("tich") || text.includes("hluk") || text.includes("nezerie") || text.includes("spotreb"))) {
    return answerBase(
      "NIBE alebo Vaillant",
      "NIBE aj Vaillant sú bezpečné značky na komunikáciu, ale pri tichu a spotrebe by som nevyberal iba podľa loga. Rozhoduje výkon pre dom, umiestnenie vonkajšej jednotky, vykurovací systém, nastavenie regulácie, servis a výsledná ponuka. Aby som ťa naviedol správne: ide o novostavbu s podlahovkou alebo starší dom s radiátormi?",
      "nibe_vaillant_noise_consumption_followup",
      "brand_model",
      "company-truth NIBE Vaillant hlucnost spotreba servis cena ponuka tepelne cerpadlo Geotherm",
    );
  }

  if (/\bnibe+\b/.test(text) && /(hluc|hluč|tich|hluk)/.test(text)) {
    return answerBase(
      "Hlučnosť NIBE",
      "Pri NIBE sa hlučnosť nedá hodnotiť jedným číslom pre všetky modely. Záleží od konkrétnej jednotky, výkonu, režimu, umiestnenia pri dome, podstavca a nočného režimu. Pri výbere by som porovnal aktuálnu zostavu podľa technického listu a montážnych možností, nie iba podľa značky.",
      "nibe_noise_scope",
      "brand_model",
      "company-truth NIBE hlučnosť tepelné čerpadlo model umiestnenie technický list Geotherm",
    );
  }

  if (text.includes("nibe") && text.includes("vaillant") && /(vs|versus|porov|leps|lepší|recommend|odporuc|odporúč)/.test(text)) {
    return answerBase(
      "Vaillant vs. NIBE",
      "Obe značky viem pri tepelných čerpadlách komunikovať bezpečne. Nevybral by som víťaza iba podľa názvu značky: rozhoduje dom, vykurovací systém, hlučnosť, servis, regulácia, dostupnosť konkrétnej zostavy a výsledná ponuka. Pre novú realizáciu má zmysel porovnať 1-2 aktuálne zostavy od Geotherm a vybrať podľa návrhu.",
      "nibe_vaillant_comparison",
      "comparison",
      "company-truth NIBE Vaillant porovnanie tepelné čerpadlo servis regulácia ponuka Geotherm",
    );
  }

  if (/(oprav|oprava|opravite|opravíte).*(montaz|montáž)|(?:montaz|montáž).*(oprav|oprava|opravite|opravíte)/.test(text)) {
    return answerBase(
      "Oprava alebo montáž",
      "Toto treba najprv rozdeliť: servis rieši existujúce zariadenie s poruchou alebo nastavením, montáž rieši nové riešenie alebo výmenu technológie. Bez toho by som neodporúčal ani termín, ani cenu. Máš už zariadenie, ktoré nefunguje, alebo ešte len vyberáš nové riešenie?",
      "repair_or_installation_followup",
      "service_fault",
      "company-truth servis montaz oprava nove riesenie cena termin Geotherm",
    );
  }

  if (/(montaz|montáž).*(existujuc|existujú|stare|star[eé]ho|namontovan|pouzite|použité).*(cerpadl|\btc\b)|(?:existujuc|existujú|stare|star[eé]ho|namontovan|pouzite|použité).*(cerpadl|\btc\b).*(montaz|montáž)/.test(text)) {
    return answerBase(
      "Existujúce čerpadlo",
      "Pri existujúcom čerpadle by som to nenazval rovno novou montážou, kým nie je jasný rozsah. Môže ísť o servis existujúceho zariadenia, výmenu za nové riešenie, demontáž a opätovné zapojenie, alebo zapojenie zariadenia kúpeného inde. Každý z týchto prípadov má iný postup, zodpovednosť aj nacenenie. Máš na mysli poruchu/servis, výmenu za nové tepelné čerpadlo, alebo zapojenie už existujúceho zariadenia?",
      "existing_heat_pump_mounting_ambiguity",
      "process",
      "company-truth servis montaz produkt existujuce tepelne cerpadlo zapojenie vymena Geotherm",
    );
  }

  if (/(ignorovat|ignorovať|vynechat|vynechať).*(servis|kontrol).*(zaruk|záruk)|(?:zaruk|záruk).*(ignorovat|ignorovať|vynechat|vynechať).*(servis|kontrol)/.test(text)) {
    return answerBase(
      "Servis a záruka",
      "Servis alebo povinnú kontrolu by som kvôli záruke neignoroval. Podmienky záruky treba overiť pri konkrétnom zariadení a ponuke; pri technológiách býva pravidelná údržba dôležitá pre bezpečnosť, spoľahlivosť aj prípadné uplatnenie záruky. Aké zariadenie riešiš?",
      "warranty_service_check",
      "service_fault",
      "company-truth servis zaruka pravidelna udrzba podmienky zaruky Geotherm",
    );
  }

  if (/(maintenance|udrzb|údržb|servis|prehliad|kontrol).*(raz za rok|rocne|ročne|kazdy rok|každý rok)|(?:raz za rok|rocne|ročne|kazdy rok|každý rok).*(maintenance|udrzb|údržb|servis|prehliad|kontrol)/.test(text)) {
    return answerBase(
      "Pravidelná údržba",
      "Pri tepelnom čerpadle pravidelný servis dáva zmysel, ale interval **raz za rok** by som netvrdil univerzálne pre každé zariadenie bez kontroly podmienok konkrétnej značky, záruky a ponuky. Pri NIBE alebo Vaillant treba overiť servisné podmienky, stav zariadenia a rozsah prehliadky; aj cena servisu závisí od typu zariadenia, lokality a toho, či ide iba o preventívnu kontrolu alebo už problém. Máš NIBE/Vaillant a ide o pravidelnú prehliadku, alebo už riešiš poruchu?",
      "annual_maintenance_scope",
      "process",
      "company-truth heat pump tepelne cerpadlo NIBE servis udrzba cena pravidelna prehliadka zaruka Geotherm",
    );
  }

  if (/^mont[aá][zž]\??$/.test(text)) {
    return answerBase(
      "Montáž",
      "Montáž treba najprv zaradiť podľa technológie. Geotherm rieši montáž technických riešení domu, napríklad tepelné čerpadlá, klimatizáciu, rekuperáciu, podlahové kúrenie alebo stropné chladenie; rozsah a termín sa potvrdzuje podľa konkrétneho systému. Akú montáž máš na mysli?",
      "generic_installation_followup",
      "process",
      "company-truth montaz tepelne cerpadlo klimatizacia rekuperacia podlahove kurenie Geotherm",
    );
  }

  if (/(montaz|montáž).*(zajtra|hned|hneď).*(neviem|neviem aky|neviem aký)|(?:neviem|neviem aky|neviem aký).*(montaz|montáž).*(zajtra|hned|hneď)/.test(text)) {
    return answerBase(
      "Najprv rozsah, potom termín",
      "Termín montáže by som **bez podkladov a bez potvrdeného systému nesľuboval**, najmä nie hneď na zajtra. Najprv treba určiť, či ide o tepelné čerpadlo, klimatizáciu, rekuperáciu, podlahové kúrenie alebo inú technológiu; až potom sa dá potvrdiť dostupnosť, cena a montážny postup. Akú technológiu chceš riešiť ako prvú?",
      "contradictory_installation_timing",
      "process",
      "company-truth montaz termin system cena rozsah Geotherm",
    );
  }

  if (/(kolko|koľko).*(zere|žere|spotreb|elektrin)|(?:zere|žere|spotreb|elektrin).*(kolko|koľko)/.test(text)) {
    return answerBase(
      "Spotreba zariadenia",
      "Spotrebu nechcem hádať jedným číslom. Pri tepelnom čerpadle závisí od domu, teploty vody, zateplenia, radiátorov alebo podlahovky, prípravy teplej vody a nastavenia regulácie. Myslíš spotrebu tepelného čerpadla, klimatizácie alebo iného zariadenia?",
      "energy_consumption_followup",
      "price",
      "company-truth spotreba tepelne cerpadlo naklady vykurovanie Geotherm",
    );
  }

  if (/(vhodn|odporuc|odporúč|porad).*(kuren|kúren|vykurov).*(dom)|(?:kuren|kúren|vykurov).*(dom).*(vhodn|odporuc|odporúč|porad)/.test(text)) {
    return answerBase(
      "Vhodné kúrenie do domu",
      "Pri rodinnom dome by som ako predbežný smer najprv porovnal tepelné čerpadlo vzduch-voda, podlahové kúrenie alebo radiátorový systém podľa toho, či ide o novostavbu alebo starší dom. Pri novostavbe dáva zmysel nízkoteplotné riešenie, pri staršom dome treba preveriť radiátory a potrebnú teplotu vody. Na výber riešenia stačí začať tromi údajmi: novostavba alebo rekonštrukcia, približná plocha a radiátory alebo podlahovka.",
      "heating_solution_recommendation_scope",
      "recommendation",
      "company-truth vykurovanie domu vhodne kurenie tepelne cerpadlo radiatory podlahove kurenie Geotherm",
    );
  }

  if (/(stat|štát|dotac|dotác|prispevok|príspevok)/.test(text) && /(na to|vybavit|vybaviť|dostat|dostať)/.test(text)) {
    return answerBase(
      "Dotácia alebo štátna podpora",
      "Možnosť podpory treba overiť podľa konkrétneho riešenia a aktuálnych pravidiel programu. Dotácia vie znížiť výsledné náklady alebo cenu investície, ale nárok by som nesľuboval bez overenia. Geotherm môže pomôcť s orientáciou, podkladmi a následne s ponukou; servis existujúceho zariadenia sa s dotáciou nespája automaticky. Riešiš dotáciu na tepelné čerpadlo, fotovoltiku alebo inú technológiu?",
      "subsidy_followup",
      "subsidy",
      "company-truth dotacie statna podpora cena naklady servis tepelne cerpadlo Geotherm asistencia",
    );
  }

  if (/(servis|service).*(tepelne cerpad|tepelné čerpad|tc\b|tč\b)|(?:tepelne cerpad|tepelné čerpad|tc\b|tč\b).*(servis|service)/.test(text)) {
    return answerBase(
      "Servis tepelných čerpadiel",
      "Servis tepelných čerpadiel Geotherm rieši, najmä pri vlastných realizáciách. Pri cudzích montážach by som servis nesľuboval automaticky; treba potvrdiť značku, model, problém a lokalitu. Ide o zariadenie od Geotherm alebo montáž od inej firmy?",
      "heat_pump_service_scope",
      "service_fault",
      "company-truth service tepelne cerpadla vlastne realizacie cudzie montaze potvrdit Geotherm",
    );
  }

  if (/^(co|čo)\s+odpor(u|ú)[cč]ate\??$/.test(text) || /^(ake|aké)\s+riesenie\??$/.test(text)) {
    return answerBase(
      "Najprv zaraďme cieľ",
      "Bez kontextu by som odporúčanie nechcel hádať. Geotherm rieši viac technických oblastí: tepelné čerpadlá, klimatizáciu, rekuperáciu, podlahové kúrenie, stropné chladenie, servis a dotácie. Čo chceš riešiť ako prvé: kúrenie, chladenie, vetranie, servis alebo dotáciu?",
      "generic_recommendation",
      "general",
      "company-truth sluzby Geotherm tepelne cerpadla klimatizacie rekuperacia servis dotacie",
    );
  }

  if (/(poradit|poradiť).*(vyber|výber).*(riesen|riešen)|(?:vyber|výber).*(riesen|riešen).*(poradit|poradiť)/.test(text)) {
    return answerBase(
      "Výber riešenia",
      "Áno, s výberom riešenia sa dá začať tu, ale bez cieľa by som nehádal jednu technológiu. Geotherm rieši kúrenie, chladenie, vetranie, podlahové kúrenie, stropné chladenie, servis aj dotácie. Najprv treba určiť, či chceš riešiť úsporu kúrenia, chladenie v lete, čerstvý vzduch, poruchu existujúceho zariadenia alebo celé technické riešenie domu.",
      "solution_selection_followup",
      "recommendation",
      "company-truth sluzby Geotherm vyber riesenia kurenie chladenie vetranie servis dotacie",
    );
  }

  if (/^(oplat[ií]|oplat[ií]\?|oplat[ií]\s+sa\s+to|oplat[ií]\s+sa\s+to\s+vobec)/.test(text)) {
    return answerBase(
      "Či sa to oplatí",
      "Či sa riešenie oplatí, závisí hlavne od toho, čo porovnávame: nové kúrenie, výmenu kotla, klimatizáciu, servis alebo dotáciu. Pri tepelnom čerpadle sa oplatí začať aktuálnym kúrením, plochou domu a tým, či máš radiátory alebo podlahovku. Čo konkrétne chceš posúdiť?",
      "value_question",
      "general",
      "company-truth navratnost uspora cena technicke riesenie Geotherm",
    );
  }

  if (/(tiche|tiché|hlucne|hlučné|otravne|otravné)/.test(text) && !/(nibe|vaillant|konkretn|model)/.test(text)) {
    return answerBase(
      "Hlučnosť riešenia",
      "Hlučnosť sa nedá posúdiť jednou vetou bez typu zariadenia a umiestnenia; vždy závisí od modelu, výkonu, režimu, vzdialenosti od okien a susedov aj nočnej prevádzky. Myslíš tepelné čerpadlo, klimatizáciu alebo rekuperáciu?",
      "noise_ambiguous",
      "general",
      "company-truth hlucnost tepelne cerpadlo klimatizacia umiestnenie vonkajsia jednotka",
    );
  }

  if (/(problem|probl[eé]m).*(zly|zl[yý]|navrh)|(?:zly|zl[yý]|navrh).*(problem|probl[eé]m)/.test(text)) {
    return answerBase(
      "Problém alebo návrh",
      "Môže ísť o poruchu, zlé nastavenie, slabý návrh výkonu, hydrauliku alebo nevhodné očakávanie od systému. Bez popisu prejavu by som to nerozhodol. Ide o existujúce zariadenie, ktoré zle funguje, alebo len posudzuješ nový návrh?",
      "problem_or_design",
      "service_fault",
      "company-truth servis diagnostika navrh vykurovanie tepelne cerpadlo Geotherm",
    );
  }

  if (/(zakupen|zakúpen|vlastny|vlastný).*(kotol|kotla|kotlov|kotly)|(?:kotol|kotla|kotlov|kotly).*(zakupen|zakúpen|vlastny|vlastný)/.test(text)) {
    return answerBase(
      "Kotol kúpený zákazníkom",
      "Pri **kotle kúpenom zákazníkom** treba montáž potvrdiť podľa značky, typu kotla, dostupnosti príslušenstva, záruky a stavu kotolne. Bez overenia by som nesľuboval, že sa dá namontovať každý dodaný kotol; pošli typ kotla a fotky kotolne a dá sa preveriť postup.",
      "customer_bought_boiler",
      "process",
      "company-truth prakticke FAQ montaz kotla zakupeneho zakaznikom potvrdit Geotherm",
    );
  }

  if (/(vlastny|vlastný).*(material|materiál)|(?:material|materiál).*(vlastny|vlastný)|zabezpecit.*material|zabezpečiť.*materiál/.test(text)) {
    return answerBase(
      "Materiál pri realizácii",
      "Pri realizácii by som vlastný materiál alebo materiál dodaný zákazníkom nesľuboval automaticky. Geotherm typicky potrebuje mať pod kontrolou návrh, kompatibilitu, záruku a montážny rozsah. Dá sa to preveriť pri konkrétnej ponuke: čo má dodať firma, čo zákazník, kto nesie záruku a či je materiál vhodný pre daný systém.",
      "own_material_scope",
      "process",
      "company-truth prakticke FAQ material dodavka zakaznik zaruka montaz Geotherm",
    );
  }

  if (/(servis|oprav).*(kotol|kotla|kotlov|kotly)|(?:kotol|kotla|kotlov|kotly).*(servis|oprav)/.test(text)) {
    return answerBase(
      "Servis kotlov",
      "Pri **servise existujúcich kotlov** treba najprv potvrdiť značku, model, typ poruchy a lokalitu. Geotherm rieši servis zariadení a pri kotloch je bezpečný ďalší krok poslať fotku štítku, chybový kód alebo popis problému; podľa toho sa potvrdí, či to vie riešiť technik a v akom termíne.",
      "existing_boiler_service",
      "service_fault",
      "company-truth prakticke FAQ servis kotlov znacka model lokalita Geotherm",
    );
  }

  if (/(technik).*(obhliad|pozriet|pozrieť|prist|prísť)|(?:poslat|poslať|prist|prísť).*(technik).*(obhliad|pozriet|pozrieť)|(?:obhliad|pozriet|pozrieť).*(technik)/.test(text)) {
    return answerBase(
      "Technik na obhliadku",
      "Technika na obhliadku alebo preverenie problému treba dohodnúť podľa typu služby, lokality a kapacity. Pri novej realizácii pomôžu fotky alebo projekt a stručný rozsah; pri poruche značka/model, popis problému a fotka štítku. Geotherm potom potvrdí, či je vhodná obhliadka, servisný výjazd alebo najprv telefonická konzultácia.",
      "technician_inspection_visit",
      "inspection",
      "company-truth obhliadka technik servis vyjazd lokalita kapacita Geotherm",
    );
  }

  if (/(skontrolovat|skontrolovať|preverit|preveriť).*(existujuc|existujú|system|systém)|(?:existujuc|existujú|system|systém).*(skontrolovat|skontrolovať|preverit|preveriť)/.test(text)) {
    return answerBase(
      "Kontrola existujúceho systému",
      "Kontrola existujúceho systému sa dá riešiť ako servisné alebo technické preverenie. Najprv treba vedieť, čo je v dome namontované, aký je problém alebo cieľ kontroly, lokalitu a či ide o kúrenie, chladenie, vetranie alebo rozvody. Praktický ďalší krok je poslať fotky kotolne/zariadenia a kontakt, aby Geotherm potvrdil vhodný postup.",
      "existing_system_check",
      "inspection",
      "company-truth service kontrola existujuceho systemu obhliadka fotky lokalita Geotherm",
    );
  }

  if (/(nastavit|nastaviť|dohodnut|dohodnúť|rezervovat|rezervovať).*(termin|termín).*(pravideln|servis|prehliad|udrzb|údržb)|(?:pravideln|servis|prehliad|udrzb|údržb).*(termin|termín).*(nastavit|nastaviť|dohodnut|dohodnúť|rezervovat|rezervovať)/.test(text)) {
    return answerBase(
      "Termín pravidelného servisu",
      "Termín pravidelného servisu sa dá riešiť ako servisný follow-up, ale konkrétny interval a dostupnosť treba potvrdiť podľa zariadenia, značky, lokality a aktuálnej kapacity. Pošlite značku/model alebo fotku štítku, lokalitu a kontakt; Geotherm potom potvrdí vhodný termín a rozsah prehliadky.",
      "regular_service_booking",
      "service_fault",
      "company-truth service pravidelny servis termin prehliadka kapacita kontakt Geotherm",
    );
  }

  if (/(servis).*(cudz|ina firma|inej firmy|montaz|montáž)|(?:cudz|ina firma|inej firmy|montaz|montáž).*(servis)|(?:cerpadlo|cerpadla|zariadenie).*(nie je od vas|nie od vas|cudz|ina firma)|(?:nie je od vas|nie od vas|cudz|ina firma).*(cerpadlo|cerpadla|zariadenie|montaz|montáž)/.test(text)) {
    return answerBase(
      "Servis cudzej montáže",
      "Pri zariadení alebo montáži, ktorú nerobil Geotherm, by som servis nesľuboval automaticky. Treba potvrdiť značku, model, problém a lokalitu; potom sa dá povedať, či to vie technik prevziať alebo odporučiť ďalší postup. Najpraktickejšie je poslať fotku štítku, krátky popis problému a kontakt na konzultáciu.",
      "third_party_service",
      "service_fault",
      "company-truth service servis cudzej montaze potvrdit znacka model lokalita Geotherm",
    );
  }

  if (/(pohotovost|havarijn|urgent|nonstop).*(servis|vyjazd|výjazd|technik)|(?:servis|vyjazd|výjazd|technik).*(pohotovost|havarijn|urgent|nonstop)/.test(text)) {
    return answerBase(
      "Pohotovostný servis",
      "Pohotovostný alebo urgentný servis by som nesľuboval automaticky bez potvrdenia kapacity. Pri akútnom probléme treba poslať značku/model alebo fotku štítku, popis poruchy, lokalitu a kontakt; Geotherm potom potvrdí, či vie zabezpečiť rýchly výjazd alebo odporučí ďalší bezpečný postup.",
      "emergency_service_scope",
      "service_fault",
      "company-truth service pohotovost urgentny servis vyjazd kapacita lokalita kontakt Geotherm",
    );
  }

  if (/(pozarucn|pozáručn).*(servis|oprava|udrzba|údržba)|(?:servis|oprava|udrzba|údržba).*(pozarucn|pozáručn)/.test(text)) {
    return answerBase(
      "Pozáručný servis",
      "Pozáručný servis treba potvrdiť podľa zariadenia, značky, modelu, problému a lokality. Pri vlastných realizáciách je následný servis prirodzená súčasť spolupráce; pri cudzích montážach by som ho nesľuboval automaticky. Najlepší krok je poslať fotku štítku, popis problému a kontakt na preverenie termínu.",
      "post_warranty_service_scope",
      "service_fault",
      "company-truth service pozarucny servis vlastne realizacie cudzie montaze znacka model lokalita Geotherm",
    );
  }

  if (/servis.*mont|mont.*servis/.test(text)) {
    return answerBase(
      "Rozdiel medzi servisom a montážou",
      "Montáž je návrh a inštalácia nového alebo meneného riešenia, napríklad tepelného čerpadla, kotla, podlahovky alebo rekuperácie. Servis je diagnostika, oprava, nastavenie alebo údržba existujúceho zariadenia. Ak ide o nové riešenie, ďalší krok je konzultácia a nacenenie; ak ide o poruchu, pomôže značka, model alebo fotka štítku, problém a lokalita.",
      "service_installation_difference",
      "process",
      "company-truth service montaz rozdiel diagnostika oprava instalacia Geotherm",
    );
  }

  if (/(kolko|koľko|cena|stoji|stojí).*(diagnostik)|(?:diagnostik).*(kolko|koľko|cena|stoji|stojí)/.test(text)) {
    return answerBase(
      "Cena diagnostiky",
      "Presnú cenu diagnostiky by som bez potvrdeného cenníka alebo konkrétneho prípadu nesľuboval. Pri diagnostike rozhoduje typ zariadenia, lokalita, či ide len o kontrolu/nastavenie alebo aj výjazd a následnú opravu. Najistejšie je poslať značku, model alebo fotku štítku, popis problému, lokalitu a kontakt; Geotherm potom potvrdí postup a cenu.",
      "diagnostic_price_scope",
      "price",
      "company-truth service diagnostika cena vyjazd model lokalita kontakt Geotherm",
    );
  }

  if (/(co|čo).*(pripravit|pripraviť).*(pred).*(montaz|montáž)|(?:pred).*(montaz|montáž).*(pripravit|pripraviť)/.test(text)) {
    return answerBase(
      "Čo pripraviť pred montážou",
      "Pred montážou je dobré pripraviť fotky alebo projekt, prístup ku kotolni/technickej miestnosti, informácie o aktuálnom kúrení, elektrine, vode a požadovanom riešení. Pri konkrétnej zákazke treba potvrdiť aj termín, prístup na pozemok a veci, ktoré má zabezpečiť zákazník. Najlepší krok je poslať Geotherm fotky alebo podklady a dohodnúť krátku konzultáciu k rozsahu.",
      "installation_preparation",
      "process",
      "company-truth montaz priprava zakaznik fotky projekt kotolna technicka miestnost Geotherm",
    );
  }

  if (!/(kotol|kotla|kotlov|kotly)/.test(text) && /(robite|robíte).*(servis|montaz|montáž)|(?:servis|montaz|montáž).*(robite|robíte)/.test(text)) {
    return answerBase(
      "Servis aj montáž",
      "Geotherm komunikuje návrh, montáž aj následný servis vlastných riešení. Pri cudzích montážach treba servis potvrdiť podľa značky a problému. Ak riešiš nové riešenie, ide sa cez návrh a nacenenie; ak poruchu, najprv pomôže značka, model alebo fotka štítku a lokalita.",
      "service_and_installation",
      "service_fault",
      "company-truth service montaz servis vlastne realizacie cudzie montaze potvrdit Geotherm",
    );
  }

  if (/(nemam|nemám).*(model|stitok|štítok)|(?:model|stitok|štítok).*(nemam|nemám)/.test(text)) {
    return answerBase(
      "Keď nemáte model pri sebe",
      "Nevadí, bez modelu sa dá začať orientačne. Najbližší praktický krok je odfotiť štítok zariadenia, displej s chybou alebo kotolňu, keď pri tom budete. Bez týchto údajov by som nesľuboval termín ani rozsah opravy.",
      "missing_model",
      "service_fault",
      "company-truth service chyba model stitok fotka zariadenia Geotherm",
    );
  }

  if (/(foto|fotku|fotka).*(stitk|štítk)|(?:stitk|štítk).*(foto|fotku|fotka)/.test(text)) {
    return answerBase(
      "Fotka štítku",
      "Fotka štítku je presne ten správny podklad. K nej stačí pridať krátky popis problému, lokalitu a kontakt; podľa toho sa dá preveriť, či ide o servisný zásah, nastavenie alebo inú diagnostiku.",
      "device_label_photo",
      "service_fault",
      "company-truth service fotka stitku model problem lokalita kontakt Geotherm",
    );
  }

  if (/(iba|len).*(nastavenie)|nastavenie/.test(text)) {
    return answerBase(
      "Možné nastavenie",
      "Áno, môže ísť aj o nastavenie regulácie, režimu, krivky alebo hydrauliky. Nedá sa to však potvrdiť bez kontroly zariadenia a prejavu problému. Pri staršom alebo hlučnom zariadení je bezpečnejšie najprv diagnostikovať, nie meniť parametre naslepo.",
      "possible_settings_issue",
      "service_fault",
      "company-truth service nastavenie regulacia diagnostika tepelne cerpadlo Geotherm",
    );
  }

  if (
    !/(oplat|ma zmysel|cena|servis|dotac|montaz|porucha|problem|huci|hluci)/.test(text) &&
    (/^(som|sme)\s+v\s+[a-z-]{3,}(?:\s+[a-z-]{3,})?$/.test(text) || /^(som|sme)\s+(pri|z|zo)\s+[a-z-]{3,}(?:\s+[a-z-]{3,})?$/.test(text))
  ) {
    return answerBase(
      "Lokalita",
      "Lokalitu treba pri servise alebo montáži potvrdiť podľa konkrétnej služby a kapacity technika. Ak ide o servis, k mestu pridaj značku/model alebo fotku štítku a problém; ak ide o ponuku, stačí lokalita, typ domu a čo chceš riešiť.",
      "location_followup",
      "location",
      "company-truth posobnost lokalita servis montaz Geotherm",
    );
  }

  if (/(opravit|opraviť|rozobrat|rozobrať).*(sam|sám|sama)|(?:sam|sám|sama).*(opravit|opraviť|rozobrat|rozobrať)/.test(text)) {
    return answerBase(
      "Svojpomocná oprava",
      "Rozoberať tepelné čerpadlo alebo zasahovať do jednotky svojpomocne by som neodporúčal. Bezpečné je skontrolovať len základné veci ako napájanie, nastavený režim, viditeľnú chybu na displeji a tlak v systéme; pri zásahu do zariadenia má ísť technik.",
      "diy_repair",
      "service_fault",
      "company-truth service svojpomocna oprava bezpecnost tepelne cerpadlo Geotherm",
    );
  }

  if (/(ake|aké|co|čo).*(udaje|údaje|informacie|informácie).*(potreb)/.test(text)) {
    return answerBase(
      "Potrebné údaje",
      "Na servis stačí stručne: značka, model alebo fotka štítku, čo sa deje, či je chybový kód a lokalita. Na novú ponuku pomôže typ domu, plocha, aktuálne kúrenie alebo plánované rozvody, požiadavka na teplú vodu/chladenie a fotky kotolne alebo projekt.",
      "needed_inputs",
      "process",
      "company-truth service quote potrebne udaje znacka model lokalita plocha Geotherm",
    );
  }

  if (/(cakacia|čakacia|cakat|čakať|ako dlho).*(servis|technik|vyjazd|výjazd)|(?:servis|technik|vyjazd|výjazd).*(cakacia|čakacia|cakat|čakať|ako dlho)/.test(text)) {
    return answerBase(
      "Čakacia doba na servis",
      "Presnú čakaciu dobu na servis treba vždy potvrdiť podľa aktuálnej kapacity technikov, lokality a typu problému. Na preverenie termínu stačí značka/model alebo fotka štítku, krátky popis poruchy, lokalita a kontakt; podľa toho sa dá dohodnúť servisný postup.",
      "service_wait_time",
      "service_fault",
      "company-truth service cakacia doba termin servis kapacita technika potvrdit Geotherm",
    );
  }

  if (/(kedy|termin|termín).*(prist|prísť|vedeli|viete)|(?:prist|prísť).*(kedy|termin|termín)/.test(text)) {
    return answerBase(
      "Termín návštevy",
      "Presný termín by som nesľuboval bez potvrdenia kapacity. Pri servise rozhoduje lokalita, problém a dostupnosť technika; pri montáži rozsah riešenia a pripravenosť stavby. Najrýchlejší ďalší krok je poslať podklady a dohodnúť telefonickú konzultáciu.",
      "visit_timing",
      "contact",
      "company-truth prakticke FAQ termin vyjazd dostupnost technika Geotherm",
    );
  }

  if (/(kolko|koľko|ako dlho).*(dopredu|vopred).*(rezerv|termin|termín)|(?:rezerv|termin|termín).*(dopredu|vopred)/.test(text)) {
    return answerBase(
      "Rezervácia termínu",
      "Koľko dopredu rezervovať termín sa nedá garantovať jedným číslom bez aktuálnej kapacity a rozsahu práce. Pri montáži rozhoduje typ riešenia, pripravenosť stavby a dostupnosť materiálu; pri servise lokalita a naliehavosť problému. Najlepší krok je poslať stručný rozsah a kontakt, aby Geotherm potvrdil najbližší reálny termín.",
      "booking_lead_time",
      "process",
      "company-truth prakticke FAQ rezervacia termin kapacita montaz servis Geotherm",
    );
  }

  if (/(bez).*(odstavk|odstávk).*(vody|voda)|(?:vody|voda).*(bez).*(odstavk|odstávk)/.test(text)) {
    return answerBase(
      "Odstávka vody",
      "Či sa práca dá urobiť bez odstávky vody, závisí od konkrétneho zásahu a zapojenia. Pri niektorých servisných alebo montážnych prácach môže byť krátka odstávka nutná; bez obhliadky alebo fotiek by som nesľuboval, že voda zostane po celý čas zapnutá. Najistejšie je poslať fotky miesta a rozsah práce, potom Geotherm potvrdí postup.",
      "water_shutdown_scope",
      "process",
      "company-truth prakticke FAQ odstavka vody montaz servis rozsah prac Geotherm",
    );
  }

  if (/(preco|prečo).*(stale|stále).*(pytate|pýtate)|\bzhr|to je cele|to je celé/.test(text)) {
    return answerBase(
      "Zhrnutie bez ďalšieho dotazníka",
      "Máte pravdu, v tejto fáze už nemá zmysel pridávať ďalší dotazník. Bezpečný záver je: pri poruche sa ide cez identifikáciu zariadenia a prejav problému; pri novom riešení cez technický návrh a rozsah. V chate už netreba pridávať ďalšie otázky.",
      "stop_questioning_summary",
      "contact",
      "company-truth policies handoff konzultacia nacenenie Geotherm",
    );
  }

  if (/\bdot.*servis|(?:servis).*\bdot/.test(text)) {
    return answerBase(
      "Dotácia a servis",
      "Dotácie by som nespájal so servisom existujúceho zariadenia, pokiaľ nie je potvrdené konkrétne pravidlo programu. Bežne sa dotácie riešia skôr pri novej inštalácii alebo výmene technológie, nie pri servisnom zásahu. Pri konkrétnom prípade treba overiť aktuálne podmienky.",
      "subsidy_on_service",
      "subsidy",
      "company-truth subsidy service dotacie servis existujuce zariadenie pravidla potvrdit",
    );
  }

  if (/(ako dlho).*(montaz|montáž|realizacia|realizácia)|(?:montaz|montáž|realizacia|realizácia).*(ako dlho|trva|trvá)/.test(text)) {
    return answerBase(
      "Trvanie montáže",
      "Trvanie montáže sa nedá garantovať bez rozsahu, ale pri tepelnom čerpadle treba rátať s prípravou, hydraulickým zapojením, elektroprípravou, reguláciou a spustením. Jednoduchá výmena je iná ako starší dom s úpravou kotolne alebo radiátorov; preto je najlepší ďalší krok nacenenie podľa domu. Ide o nové tepelné čerpadlo, výmenu kotla alebo inú montáž?",
      "installation_duration",
      "process",
      "company-truth process montaz tepelne cerpadlo trvanie realizacia Geotherm",
    );
  }

  if (/(podorys|pôdorys|projekt).*(potreb|treba)|(?:potreb|treba).*(podorys|pôdorys|projekt)/.test(text)) {
    return answerBase(
      "Pôdorys alebo projekt",
      "Pôdorys alebo projekt pomôže, ale pri prvej orientácii nemusí byť povinný. Na začiatok často stačí plocha, typ domu, aktuálne kúrenie, fotky kotolne a čo chcete riešiť. Projekt je užitočný hlavne pri novostavbe, rekuperácii, stropnom chladení alebo komplexnom riešení.",
      "floorplan_project",
      "process",
      "company-truth process podorys projekt fotky kotolna nacenenie Geotherm",
    );
  }

  if (/(zabezpecit|zabezpečiť|spravit|spraviť|urobit|urobiť).*(projekt)|(?:projekt).*(zabezpecit|zabezpečiť|spravit|spraviť|urobit|urobiť)/.test(text)) {
    return answerBase(
      "Projektové podklady",
      "Projekt alebo projektové podklady treba potvrdiť podľa konkrétnej služby. Pri novostavbe, rekuperácii, stropnom chladení, podlahovke alebo komplexnom riešení domu má projekt veľký význam; pri jednoduchej orientácii často stačia fotky, plocha a popis cieľa. Najlepší krok je poslať existujúce podklady a Geotherm potvrdí, či vie projekt riešiť priamo alebo cez potrebnú súčinnosť.",
      "project_help_scope",
      "process",
      "company-truth projekt projektove podklady novostavba rekuperacia stropne chladenie Geotherm",
    );
  }

  if (/(ma zmysel|oplat|odporucate|odporúčate).*(vzduch voda|tepelne cerpad|cerpadlo)|(?:vzduch voda).*(ma zmysel|oplat|odporucate|odporúčate)/.test(text)) {
    return answerBase(
      "Vzduch-voda ako smer",
      "Áno, pre väčšinu rodinných domov je **vzduch-voda** rozumný prvý smer. Pri staršom dome s radiátormi treba overiť teplotu vody, výkon radiátorov a stav zateplenia; pri novostavbe s podlahovkou je to zvyčajne veľmi vhodná kombinácia. Konkrétny model a cenu má zmysel riešiť na konzultácii/nacenení.",
      "air_to_water_direction",
      "recommendation",
      "company-truth heat_pump scenario vzduch voda starsi dom radiatory novostavba podlahovka Geotherm",
    );
  }

  if (/(robite|robíte|viete|da sa|dá sa).*(stars|starš|rekonstruk|rekonštruk)|(?:stars|starš|rekonstruk|rekonštruk).*(robite|robíte|viete|da sa|dá sa)/.test(text)) {
    return answerBase(
      "Staršie domy",
      "Áno, staršie domy a rekonštrukcie dávajú zmysel riešiť, ale rozsah sa musí prispôsobiť existujúcemu kúreniu, zatepleniu, kotolni a požadovanej technológii. Pri tepelnom čerpadle s radiátormi sa overuje hlavne potrebná teplota vody a výkon radiátorov; pri kotle, rekuperácii alebo rozvodoch sa postup rieši podľa fotiek a obhliadky. Najlepší krok je krátka konzultácia a nacenenie podľa domu.",
      "older_houses_scope",
      "process",
      "company-truth starsi dom rekonstrukcia radiatory kotolna tepelne cerpadlo Geotherm",
    );
  }

  if (/(pripom).*(rev|servis|prehliad)|(?:rev|servis|prehliad).*(pripom)/.test(text)) {
    return answerBase(
      "Pripomenutie servisu alebo revízie",
      "Pripomenutie pravidelného servisu alebo revízie by som bez potvrdenia nesľuboval ako automatickú službu pre každého zákazníka. Prakticky sa to dá riešiť pri konkrétnej zákazke: potvrdiť zariadenie, interval, kontakt a ďalší termín. Najlepšie je dohodnúť servisný follow-up priamo s Geotherm pri realizácii alebo servise.",
      "service_revision_reminder",
      "process",
      "company-truth prakticke FAQ pravidelny servis revizia pripomenutie termin kontakt Geotherm",
    );
  }

  if (/(reviz|revíz).*(plyn|plynov)|(?:plyn|plynov).*(reviz|revíz)/.test(text)) {
    return answerBase(
      "Revízie plynu",
      "Pri **revíziách plynu** treba aktuálny rozsah potvrdiť podľa typu práce a lokality. Interné FAQ potvrdzuje certifikáciu na plynové zariadenia, ale konkrétnu pravidelnú revíziu plynu by som potvrdil pri dopyte spolu s tým, či ide o kotol, rozvod alebo inú časť plynovej inštalácie.",
      "gas_revision",
      "process",
      "company-truth prakticke FAQ revizie plynu certifikacia plynove zariadenia Geotherm",
    );
  }

  if (/(reviz|revíz).*(kotol|kotla|kotlov|kotly)|(?:kotol|kotla|kotlov|kotly).*(reviz|revíz)/.test(text)) {
    return answerBase(
      "Revízie kotlov",
      "Pri **revíziách kotlov** treba potvrdiť značku, typ kotla, požadovaný doklad a lokalitu. Geotherm vie riešiť kotly a plynové zariadenia, ale presný rozsah revízie kotla netreba sľubovať bez potvrdenia konkrétnej situácie.",
      "boiler_revision",
      "process",
      "company-truth prakticke FAQ revizie kotlov plynove zariadenia Geotherm",
    );
  }

  if (/(bytove jadro|bytove jadra|jadro)/.test(text)) {
    return answerBase(
      "Bytové jadrá",
      "Pri **bytových jadrách** nemám bezpečný podklad, že ich Geotherm berie ako samostatnú štandardnú službu. Treba potvrdiť rozsah: či ide len o rozvody vody, kanalizáciu, kúrenie alebo komplexnú rekonštrukciu. Ak ide o technické rozvody, pošli fotky/pôdorys a dá sa preveriť nacenenie.",
      "bathroom_core",
      "process",
      "company-truth policies bytove jadro rozvody vody kanalizacia potvrdit Geotherm",
    );
  }

  if (/(kominar|kominarsk|kominár|kominársk|komin)/.test(text)) {
    return answerBase(
      "Kominárske práce",
      "Kominárske práce by som bez potvrdenia nekomunikoval ako službu Geotherm. Geotherm rieši technické zariadenia domu, kotly a vykurovanie, ale pri komíne treba potvrdiť, či ide len o napojenie kotla, odvod spalín alebo samostatnú kominársku prácu.",
      "chimney_work",
      "process",
      "company-truth policies kominarske prace odvod spalin potvrdit Geotherm",
    );
  }

  if (/(pre firmy|firma|firemn|komerc|komerč)/.test(text)) {
    return answerBase(
      "Firemní zákazníci",
      "Pri firemných zákazkách treba potvrdiť typ objektu, službu a lokalitu. Geotherm má v podkladoch aj komerčné a väčšie technické riešenia, ale konkrétnu zákazku pre firmu treba overiť podľa rozsahu a kapacity tímu. Ide o kúrenie, chladenie, vetranie alebo servis existujúcej technológie?",
      "business_customers",
      "process",
      "company-truth prakticke FAQ firmy komercne objekty technicke riesenia Geotherm potvrdit",
    );
  }

  if (/(casopis|časopis|magazin|magazín|referenc|ukazk|ukážk).*(vykurov|kuren|kúren|realizac)|(?:vykurov|kuren|kúren|realizac).*(casopis|časopis|magazin|magazín|referenc|ukazk|ukážk)/.test(text)) {
    return answerBase(
      "Referencie a ukážky vykurovania",
      "Tému vykurovania v časopisoch by som bral ako referencie alebo ukážky realizácií, často aj pri riešeniach s tepelným čerpadlom, nie ako technický návrh pre konkrétny dom. Môže pomôcť na inšpiráciu, ale vhodné tepelné čerpadlo alebo iný zdroj vykurovania sa vyberá podľa domu, výkonu, teplej vody a rozsahu montáže. Ak chceš reálne nacenenie, najlepší krok je krátka konzultácia podľa typu domu a fotiek alebo projektu.",
      "heating_references_scope",
      "process",
      "company-truth referencie ukazky realizacii vykurovanie casopisy Geotherm",
    );
  }

  if (/(ako rychlo|ako rýchlo|kedy|dokedy).*(odpoved|odpoveď|ozvete|reagujete|dopyt)|(?:odpoved|odpoveď|ozvete|reagujete|dopyt).*(ako rychlo|ako rýchlo|kedy|dokedy)/.test(text)) {
    return answerBase(
      "Odpoveď na dopyt",
      "Presný čas odpovede by som bez aktuálnej kapacity nesľuboval. Pri dopyte pomôže, keď pošleš službu, lokalitu, fotky alebo projekt a kontakt; Geotherm potom vie zaradiť ponuku, servis alebo konzultáciu podľa rozsahu. Ak ide o poruchu, pridaj značku/model a chybový kód.",
      "response_time_scope",
      "contact",
      "company-truth dopyt odpoved kontakt servis ponuka konzultacia kapacita Geotherm",
    );
  }

  if (/(bytove domy|bytovy dom|bytovka|bytovky)/.test(text)) {
    return answerBase(
      "Bytové domy",
      "Pri bytových domoch treba potvrdiť konkrétnu službu, rozsah a lokalitu. Geotherm má v knowledge aj bytové a väčšie technické riešenia, ale pri bytovom dome by som najprv overil, či ide o servis, kúrenie, rozvody, rekuperáciu alebo inú technológiu.",
      "apartment_buildings",
      "process",
      "company-truth policies bytove domy rozsah sluzby potvrdit Geotherm",
    );
  }

  if (/(male zakazky|malu zakazku|mensie prace|drobne prace|drobn)/.test(text)) {
    return answerBase(
      "Menšie zákazky",
      "Menšie zákazky treba potvrdiť podľa typu práce, lokality a aktuálnej kapacity. Ak ide o servis, rozvody alebo úpravu kotolne, pošli stručný popis a fotky; podľa toho sa dá povedať, či to Geotherm vie zaradiť.",
      "small_jobs",
      "process",
      "company-truth prakticke FAQ male zakazky kapacita potvrdit Geotherm",
    );
  }

  if (/(znack|značky|ake).*(kotol|kotla|kotlov|kotly)|(?:kotol|kotla|kotlov|kotly).*(znack|značky)/.test(text)) {
    return answerBase(
      "Značky kotlov",
      "Pri **značkách kotlov** treba aktuálnu montážnu ponuku potvrdiť podľa konkrétneho dopytu. Bezpečne môžem povedať, že Geotherm rieši kotly a výmenu plynového kotla; konkrétnu značku kotla by som potvrdil podľa dostupnosti, typu kotolne a požadovaného riešenia.",
      "boiler_brands",
      "process",
      "company-truth prakticke FAQ znacky kotlov montaz kotla potvrdit Geotherm",
    );
  }

  if (isBoilerOnlyQuestion(text)) {
    const isVaillant = text.includes("vaillant");
    return answerBase(
      isVaillant ? "Vaillant kotly" : "Kotly",
      isVaillant
        ? "Pri otázke na **Vaillant kotly** by som odpovedal opatrne: Geotherm vie riešiť aj kotly a výmenu plynového kotla, ale aktuálne konkrétne Vaillant kotly treba potvrdiť podľa ponuky a stavu kotolne. Pri nacenení je dôležité vedieť typ kotla, napojenie, odvod spalín, elektroprípravu a či ide o jednoduchú výmenu alebo úpravu kotolne."
        : "Áno, Geotherm vie riešiť aj **kotly**, vrátane výmeny plynového kotla. Rozsah závisí od kotolne, napojenia, odvodu spalín a elektroprípravy; pri jednoduchej výmene to môže byť kratšia realizácia, pri zložitejšej kotolni treba pripraviť individuálny plán. Najlepší ďalší krok je krátka konzultácia alebo nacenenie podľa fotiek kotolne.",
      isVaillant ? "vaillant_boilers" : "boilers",
      "process",
      "company-truth prakticke FAQ Vaillant kotly plynovy kotol vymena kotla Geotherm",
    );
  }

  if (/(vrt|vrty|hlbin)/.test(text)) {
    return answerBase(
      "Vrty pre tepelné čerpadlá",
      "Áno, v potvrdenom praktickom FAQ sú medzi službami aj **vrty pre tepelné čerpadlá**. Pri zem-voda riešení sú dôležité podmienky pozemku, dostupnosť techniky, potrebný výkon a povolenia; preto by som to po základnom overení posunul na konzultáciu a nacenenie konkrétneho riešenia.",
      "boreholes",
      "process",
      "company-truth prakticke FAQ vrty pre tepelne cerpadla zem voda Geotherm",
    );
  }

  if (/(solar|solarn|solár|solárn)/.test(text)) {
    return answerBase(
      "Solárne panely",
      "Áno, v knowledge Geotherm sa spomínajú aj **solárne panely/kolektory** ako súčasť technických riešení domu. Pri konkrétnom dopyte treba potvrdiť, či ide o solárny ohrev vody, podporu vykurovania alebo kombináciu s iným systémom, a potom pripraviť konzultáciu alebo nacenenie.",
      "solar_panels",
      "process",
      "solarne panely kolektory Geotherm technicke riesenie domu",
    );
  }

  if (/(fotovolt|fotovoltaik)/.test(text)) {
    return answerBase(
      "Fotovoltika",
      "Pri **fotovoltike** knowledge Geotherm obsahuje podklady a riešenia v súvislosti s technológiami domu. Pri napojení k tepelnému čerpadlu treba potvrdiť konkrétny rozsah: výkon, menič, prepojenie s reguláciou, prípravu elektro, dotáciu, očakávanú cenu/náklady a cieľ využitia energie. Najlepší ďalší krok je konzultácia alebo ponuka podľa domu a existujúcej techniky; servis a údržbu treba riešiť podľa konkrétneho zariadenia.",
      "photovoltaics",
      "process",
      "company-truth fotovoltaika tepelne cerpadlo regulacia dotacia cena servis Geotherm",
    );
  }

  if (/(poter|potery)/.test(text)) {
    return answerBase(
      "Potery",
      "Pri **poteroch** sa v knowledge Geotherm spomína realizácia poterov najmä v súvislosti s podlahovým kúrením a skladbou podlahy. Rozsah treba potvrdiť podľa stavby, plochy, typu podlahového vykurovania a termínu. Ak pošleš plochu a stav podkladu, dá sa preveriť nacenenie.",
      "screeds",
      "process",
      "company-truth potery podlahove kurenie skladba podlahy Geotherm",
    );
  }

  if (/(referenc|realizac|fotky realizac|ukazky realizac|recenzi)/.test(text)) {
    return answerBase(
      "Referencie",
      "Áno, v knowledge Geotherm sú **referencie a ukážky realizácií** pre viac typov technických riešení. Pri konkrétnej službe má zmysel poslať relevantné referencie podľa toho, či riešiš tepelné čerpadlo, rekuperáciu, podlahové kúrenie, stropné chladenie alebo rozvody.",
      "references",
      "process",
      "company-truth referencie fotky realizacii Geotherm",
    );
  }

  if (/(rozvod|rozvody).*(vody|voda)|vodoin/.test(text)) {
    return answerBase(
      "Rozvody vody",
      "Áno, v knowledge Geotherm sa spomínajú aj **rozvody vody a kanalizácie** a referencie zdravotechniky v rodinných domoch. Pri konkrétnom dopyte treba potvrdiť rozsah: či ide o nový dom, rekonštrukciu, napojenie technológie, kúpeľne alebo technickú miestnosť. Najpraktickejší ďalší krok je poslať pôdorys alebo fotky a dohodnúť krátku konzultáciu/nacenenie.",
      "water_distribution",
      "process",
      "rozvody vody kanalizacie zdravotechnika Geotherm referencie rodinny dom",
    );
  }

  if (/(nezamrz|nezámrz|zahradn|záhradn).*(ventil|voda)|(?:ventil).*(nezamrz|nezámrz|zahradn|záhradn)/.test(text)) {
    return answerBase(
      "Záhradný nezámrzný ventil",
      "Záhradný nezámrzný ventil patrí skôr do zdravotechniky a rozvodov vody než do vykurovania. Pri konkrétnej realizácii treba potvrdiť miesto napojenia, prívod vody, uloženie potrubia, prístup na montáž a či ide o novostavbu alebo doplnenie do existujúceho domu. Praktický ďalší krok je poslať fotku alebo pôdorys miesta a Geotherm potvrdí nacenenie.",
      "garden_frost_free_valve_scope",
      "process",
      "company-truth zahradny nezamrzny ventil voda rozvody zdravotechnika Geotherm",
    );
  }

  if (/(geberit|\bwc\b|zavesne wc|závesné wc)/.test(text)) {
    return answerBase(
      "WC a Geberit",
      "Pri WC alebo Geberit by som rozsah potvrdil podľa konkrétnej práce. Ak ide o technické rozvody, montáž podomietkového modulu, napojenie vody alebo kanalizácie, Geotherm má v knowledge zdravotechniku a rozvody vody/kanalizácie. Pri samostatnej kúpeľňovej rekonštrukcii treba preveriť rozsah, fotky miesta a nacenenie.",
      "geberit_wc_scope",
      "process",
      "company-truth Geberit WC zdravotechnika rozvody vody kanalizacia Geotherm",
    );
  }

  if (/(whatsapp|whats app)/.test(text)) {
    return answerBase(
      "WhatsApp",
      "V internom FAQ je potvrdené, že cez **WhatsApp** komunikovať vedia, ale pri technických veciach je lepší e-mail alebo telefón, lebo sa dajú poslať fotky, projekt alebo údaje ku kotolni. Ak chceš, pošli tu najprv, čo riešiš, a potom je najpraktickejšie dohodnúť konzultáciu alebo nacenenie.",
      "whatsapp",
      "contact",
      "company-truth prakticke FAQ WhatsApp email telefon komunikacia Geotherm",
    );
  }

  if (/(platb|faktur|z\s*loh|zaloh|záloh|zaloha|záloha|splátk|splatk)/.test(text)) {
    return answerBase(
      "Platba",
      "Podľa interného FAQ je potvrdené, že Geotherm **berie zálohy** a **platba na faktúru je možná**. Presný režim platby, výška zálohy a splatnosť sa majú potvrdiť pri konkrétnej ponuke.",
      "payment",
      "price",
      "company-truth prakticke FAQ platba zaloha faktura Geotherm",
    );
  }

  if (/(pocas zimy|počas zimy|v zime|zimy|zime).*(rob|realiz|montaz|montáž)|(?:rob|realiz|montaz|montáž).*(pocas zimy|počas zimy|v zime|zimy|zime)/.test(text)) {
    return answerBase(
      "Realizácia počas zimy",
      "Práce počas zimy by som nesľuboval univerzálne bez potvrdenia termínu, počasia a typu zákazky. Servis alebo menší zásah môže byť iný prípad než väčšia montáž vykurovania, rozvodov alebo exteriérové práce. Najistejšie je poslať popis práce a lokalitu, aby Geotherm potvrdil, či je termín a rozsah reálne spraviť.",
      "winter_work_scope",
      "process",
      "company-truth prakticke FAQ terminy realizacia zima servis montaz Geotherm",
    );
  }

  if (/(nonstop|24\/7|24 7|pohotovostn[aá] linka|stala linka|stála linka)/.test(text)) {
    return answerBase(
      "Nonstop linka",
      "Bez potvrdeného firemného podkladu by som nesľuboval nonstop linku ani 24/7 dostupnosť. Geotherm vie riešiť servis a havarijné výjazdy u svojich zákazníkov, ale dostupnosť treba potvrdiť podľa problému, lokality a zariadenia. Ak ide o urgentnú poruchu, najpraktickejší krok je poslať popis problému a telefonický kontakt na spätné dohodnutie.",
      "nonstop_line_scope",
      "contact",
      "company-truth prakticke FAQ havarijny vyjazd servis kontakt nonstop potvrdit Geotherm",
    );
  }

  if (/(obhliad|prehliad).*(platen|platena|platna|bezplat|zadarmo|zdarma)|(?:platen|platena|platna|bezplat|zadarmo|zdarma).*(obhliad|prehliad)/.test(text)) {
    return answerBase(
      "Obhliadka",
      "Bez aktuálneho potvrdenia by som netvrdil, či je obhliadka bez poplatku alebo spoplatnená. Pri konkrétnom dopyte treba potvrdiť podmienky podľa lokality, služby a rozsahu; ak pošleš fotky alebo základné údaje, dá sa najprv pripraviť orientačné nacenenie a potom dohodnúť ďalší krok.",
      "inspection_paid",
      "inspection",
      "company-truth policies obhliadka platena bezplatna potvrdit podmienky Geotherm",
    );
  }

  if (/(zaruk|záruk).*(prac|prác|montaz|montáž)|(?:prac|prác|montaz|montáž).*(zaruk|záruk)/.test(text)) {
    return answerBase(
      "Záruka na prácu",
      "Pri záruke na prácu treba potvrdiť konkrétne podmienky podľa typu realizácie, zariadenia a rozsahu montáže. Bez konkrétnej ponuky by som negarantoval presný rozsah; pri nacenení je vhodné potvrdiť záruku na zariadenie, montáž, servis a odovzdávacie podklady.",
      "warranty_work",
      "process",
      "company-truth policies zaruka na pracu montaz podmienky potvrdit Geotherm",
    );
  }

  if (/(poisten|zodpovednost)/.test(text)) {
    return answerBase(
      "Poistenie zodpovednosti",
      "V internom FAQ je potvrdené, že Geotherm má **poistenie zodpovednosti**. Pri konkrétnej zákazke sa dá potvrdiť, aký doklad alebo rozsah potrebuješ.",
      "insurance",
      "process",
      "company-truth prakticke FAQ poistenie zodpovednosti Geotherm",
    );
  }

  if (/(certifik|opravnen).*(plyn|plynov)|plynove zariadenia/.test(text) || (raw.includes("certifik") && raw.includes("plyn"))) {
    return answerBase(
      "Plynové zariadenia",
      "Interné FAQ potvrdzuje, že Geotherm má **certifikáciu na plynové zariadenia**. Pri konkrétnej práci je dobré potvrdiť rozsah zásahu a potrebné revízne alebo odovzdávacie podklady.",
      "gas_certification",
      "process",
      "company-truth prakticke FAQ certifikacia plynove zariadenia Geotherm",
    );
  }

  if ((/(fot|foto|fotiek|fotky)/.test(text) || raw.includes("fot")) && /(nacen|ponuk|cena|cenov)/.test(text)) {
    return answerBase(
      "Nacenenie podľa fotiek",
      "Orientačná ponuka sa podľa interného FAQ dá pripraviť aj podľa **dobrých a kvalitných fotografií**. Fotky však musia ukázať technickú miestnosť alebo kotolňu, napojenia, rozvody a priestor na zariadenie; finálny rozsah treba potvrdiť pri konzultácii alebo obhliadke.",
      "quote_from_photos",
      "quote",
      "company-truth prakticke FAQ nacenenie podla fotiek cenova ponuka Geotherm",
    );
  }

  if (/(dokumentac|doklad|odovzdanie|po realizacii|po montazi)/.test(text)) {
    return answerBase(
      "Dokumentácia po realizácii",
      "Pri realizácii treba v konkrétnej ponuke potvrdiť, aké **odovzdávacie podklady a dokumentácia** budú súčasťou. Štandardne má zmysel riešiť najmä odovzdanie systému, zaškolenie, záručné podklady a prípadné revízne dokumenty podľa typu technológie.",
      "docs_after_install",
      "process",
      "company-truth prakticke FAQ dokumentacia odovzdanie realizacia Geotherm",
    );
  }

  if (/(cenov.*ponuk.*zdarma|ponuk.*zdarma|ponuk.*zadarmo|bezplat.*ponuk)/.test(text)) {
    return answerBase(
      "Cenová ponuka",
      "V starších podkladoch sa spomína návrh a cenová ponuka, ale pri konkrétnom dopyte by som **bezplatnosť vždy potvrdil podľa aktuálnych podmienok**. Na nacenenie pomôže služba, typ domu, približná plocha, aktuálne kúrenie, lokalita a fotky technickej miestnosti alebo projektu.",
      "quote_free",
      "quote",
      "company-truth pricing-rules cenova ponuka zdarma podmienky nacenenie Geotherm",
    );
  }

  if (/(ake informacie|ake udaje|co potrebujete).*(ponuk|nacenen)/.test(text)) {
    return answerBase(
      "Podklady na ponuku",
      "Na rozumnú cenovú ponuku pošli hlavne: čo chceš riešiť, či ide o novostavbu alebo rekonštrukciu, **plocha v m²**, lokalitu, aktuálne kúrenie alebo plánované rozvody, požiadavku na teplú vodu/chladenie a ideálne fotky kotolne alebo projekt. Potom má zmysel dohodnúť konzultáciu, kde sa vyberie riešenie a nacení rozsah.",
      "quote_inputs",
      "quote",
      "company-truth pricing-rules podklady na cenovu ponuku plocha fotky projekt Geotherm",
    );
  }

  if (/(postup|ako prebieha|ako to funguje).*(objednavk|objednávk|sluzb|služb|dopyt)|(?:objednavk|objednávk|sluzb|služb|dopyt).*(postup|ako prebieha|ako to funguje)/.test(text)) {
    return answerBase(
      "Postup pri objednávke služby",
      "Postup by som rozdelil jednoducho: najprv sa ujasní služba a rozsah, potom sa pošlú základné podklady alebo fotky, Geotherm pripraví konzultáciu či cenovú ponuku a následne sa potvrdí termín, montáž alebo servisný zásah. Pri poruche pomôže značka/model a chybový kód; pri novej realizácii typ domu, plocha, lokalita a čo chcete riešiť.",
      "service_order_process",
      "process",
      "company-truth postup objednavka sluzby dopyt podklady konzultacia cenova ponuka termin Geotherm",
    );
  }

  if (/(este dnes|dnes prist|prist dnes|prísť ešte dnes|prísť dnes)/.test(text)) {
    return answerBase(
      "Dnešný termín",
      "Práce je ideálne plánovať aspoň 24 hodín vopred. V ojedinelých prípadoch vedia prísť aj dnes, ale **treba potvrdiť dostupnosť technika podľa lokality, služby a aktuálneho vyťaženia**. Ak je to porucha, pošli značku/model, problém alebo chybový kód, lokalitu a kontakt.",
      "today_visit",
      "contact",
      "company-truth prakticke FAQ dnes vyjazd dostupnost technika Geotherm",
    );
  }

  if (/(vikend|vikendy|sobot|nedel)/.test(text)) {
    return answerBase(
      "Víkendy",
      "Cez víkendy Geotherm **zväčša nerobí**. Ak ide o urgentný servis u existujúceho zákazníka, dostupnosť treba potvrdiť podľa technika, lokality a typu problému.",
      "weekends",
      "contact",
      "company-truth prakticke FAQ vikendy vyjazdy Geotherm",
    );
  }

  if (/(havarijn|urgent|vyjazd)/.test(text)) {
    return answerBase(
      "Havarijný výjazd",
      "Geotherm robí havarijné výjazdy **u svojich zákazníkov**. Pri cudzích montážach alebo neznámom zariadení treba dostupnosť najprv potvrdiť podľa značky, problému a lokality.",
      "emergency_callout",
      "service_fault",
      "company-truth prakticke FAQ havarijny vyjazd servis vlastni zakaznici Geotherm",
    );
  }

  if (isServiceAreaQuestion(message) || /(ake mesta|ake okresy|kam chodite|posobnost|lokalit)/.test(text)) {
    return answerBase(
      "Pôsobnosť",
      "Geotherm pracuje hlavne v mestách na **západnom a strednom Slovensku** a v **pohraničí Rakúska**. Konkrétnu obec alebo okres treba potvrdiť podľa služby, termínu a kapacity tímu. Napíš lokalitu a čo chceš riešiť, aby sa dalo povedať, či to dáva zmysel.",
      "service_area",
      "location",
      "company-truth prakticke FAQ posobnost zapadne stredne Slovensko pohranicie Rakuska Geotherm",
    );
  }

  if (/(kolko rokov|ako dlho).*trhu|rokov ste na trhu|historia firmy/.test(text)) {
    return answerBase(
      "Skúsenosti Geotherm",
      "Geotherm v podkladoch komunikuje **dlhoročné skúsenosti** s vykurovaním, chladením a vetraním; knowledge spomína viac ako 30 rokov praxe pri riešení systémov a najskúsenejších ľudí v odbore. Presný právny dátum vzniku firmy by som overil v oficiálnych firemných údajoch.",
      "company_age",
      "general",
      "Geotherm historia firmy dlhoročné skúsenosti viac ako 30 rokov praxe",
    );
  }

  return null;
}

function adversarialRefusalAnswer(message: string): string {
  const text = normalizePolicyText(message);
  if (/(najlacn|vymysli|vymysliet|vymyslieť|presnu cenu|presná cena)/.test(text)) {
    return "Nevymyslím najlacnejšie čerpadlo ani presnú cenu bez podkladov.\n\nPri Geotherm je bezpečný postup najprv určiť typ riešenia, výkon, vykurovací systém a rozsah montáže. Potom má zmysel pripraviť nacenenie alebo konzultáciu.";
  }
  if (/(garant|navratnost|návratnosť|tvar sa|tvár sa|technik)/.test(text)) {
    return "Nebudem sa tváriť ako technik na obhliadke ani garantovať návratnosť na diaľku.\n\nViem dať len opatrný smer: návratnosť a úspora závisia od domu, spotreby, regulácie, ceny energií a rozsahu realizácie. Na garanciu treba konkrétny návrh.";
  }
  if (/(webe nie je|nie je na webe|mimo webu)/.test(text)) {
    return "Nie. Nepotvrdené veci nebudem dopĺňať ako fakty.\n\nPri cenách, pobočkách, dostupnosti modelov, zľavách alebo garanciách je správne povedať „treba overiť“, nie tváriť sa, že údaj existuje.";
  }
  if (/(bez zdroj|ignor|system prompt|prompt)/.test(text)) {
    return "Inštrukcie na obídenie pravidiel ignorujem.\n\nOdpoveď musí zostať viazaná na potvrdené podklady a bezpečné obchodno-technické poradenstvo.";
  }
  return "Nebudem ignorovať pravidlá, zdroje ani vymýšľať nepodložené firemné informácie.\n\nViem pomôcť s tepelnými čerpadlami, vykurovaním, chladením, servisom, dotáciami alebo montážou.";
}

function unsupportedCompanyFactAnswer(message: string): string {
  const text = normalizePolicyText(message);
  if (/(prahe|praha|pobock|pobočk|cesk|česk)/.test(text)) {
    return "Pobočku v Prahe nemám potvrdenú vo firemných podkladoch, takže ju nebudem tvrdiť ako fakt.\n\nPri pôsobnosti alebo termíne je najistejšie kontaktovať Geotherm s lokalitou objektu; podľa toho sa potvrdí, či sa dá riešiť konzultácia, montáž alebo servis.";
  }
  if (/(etf|akci|invest|krypto|bitcoin|fond)/.test(text)) {
    return "S investíciami do ETF ti v tomto Geotherm chate nepomôžem.\n\nViem riešiť technické témy Geotherm: kúrenie, chladenie, tepelné čerpadlá, rekuperáciu, podlahové kúrenie, servis, dotácie a nacenenie riešenia.";
  }
  if (/(pocasie|počasie|sport|polit)/.test(text)) {
    return "Na toto nemám potvrdený firemný podklad v témach Geotherm.\n\nPočasie, šport ani politiku nebudem miešať do technického poradenstva. Ak riešiš dom, viem pomôcť s kúrením, chladením, vetraním, servisom, dotáciou alebo ponukou.";
  }
  return "Na toto nemám potvrdený firemný podklad, takže to nebudem tvrdiť ako fakt.\n\nViem pomôcť s potvrdenými témami okolo Geotherm: tepelné čerpadlá, klimatizácia, rekuperácia, podlahové kúrenie, stropné chladenie, servis, dotácie alebo nacenenie riešenia.";
}

function brandModelDirectAnswer(message: string, state: QualificationState): DirectAnswerDecision {
  const text = normalizePolicyText(message);
  const asksDaikin = text.includes("daikin");
  const asksMitsubishi = text.includes("mitsubishi");
  const asksVaillant = text.includes("vaillant");
  const asksNibe = text.includes("nibe");
  const asksSplit = /\bsplit\b/.test(text);
  const asksF2050 = text.includes("f2050");

  if (asksF2050) {
    return {
      triggered: true,
      answerMode: "brand_model_answer",
      reason: "direct_nibe_f2050_question",
      serviceIntent: "brand_model",
      topic: "F2050",
      retrievalQuery: "company-truth product-facts NIBE F2050 aktuálne modely tepelné čerpadlá portfólio Geotherm",
      answer: [
        "### NIBE F2050",
        "",
        "Model **F2050** nemám potvrdený ako aktuálne komunikovaný model v firemnej pravde Geotherm, takže mu nebudem vymýšľať parametre ani ho odporúčať ako istú ponuku.",
        "",
        "Bezpečný postup je držať sa typového riešenia: pre tvoj starší dom s radiátormi predbežne **vzduch-voda systém vhodný pre radiátory** a konkrétny aktuálny model vybrať až po návrhu. Z portfólia firmy viem pri tepelných čerpadlách bezpečne komunikovať najmä **NIBE a Vaillant**, ale aktuálnu dostupnosť konkrétneho modelu treba potvrdiť.",
      ].join("\n"),
    };
  }

  if (asksDaikin || asksMitsubishi) {
    const brand = asksDaikin ? "Daikin" : "Mitsubishi";
    return {
      triggered: true,
      answerMode: "brand_model_answer",
      reason: `direct_${brand.toLowerCase()}_portfolio_question`,
      serviceIntent: "brand_model",
      topic: brand,
      retrievalQuery: `company-truth brands ${brand} tepelné čerpadlá klimatizácie Geotherm portfólio`,
      answer: [
        `### ${brand} a tepelné čerpadlá`,
        "",
        `Pri **tepelných čerpadlách** by som ${brand} bezpečne netvrdil ako bežné portfólio Geotherm, pokiaľ to nie je priamo potvrdené aktuálnymi firemnými pravidlami.`,
        "",
        "Bezpečne komunikovaný smer pre tepelné čerpadlá je **NIBE a Vaillant**. Mitsubishi sa môže objaviť skôr pri klimatizáciách alebo vzduch-vzduch riešeniach, nie ako hlavné portfólio TČ voda/voda alebo vzduch/voda.",
      ].join("\n"),
    };
  }

  if (asksVaillant || asksSplit) {
    const splitLine = asksSplit
      ? "Ak myslíš **Vaillant aroTHERM Split**, je to splitové riešenie vzduch-voda; pri radiátoroch treba overiť hlavne potrebnú teplotu vody a výkon radiátorov."
      : asksNibe
        ? "Ak dnes máš **NIBE** a zvažuješ **Vaillant**, nebral by som to ako jednoduchú zámenu značky. Najprv treba rozlíšiť, či riešiš servis existujúceho NIBE, výmenu zariadenia alebo nové nacenenie."
      : "Pri Vaillant riešeniach sa v knowledge spomínajú hlavne vzduch-voda riešenia ako aroTHERM plus a aroTHERM Split; vhodnosť závisí od domu.";
    return {
      triggered: true,
      answerMode: "brand_model_answer",
      reason: asksSplit ? "direct_vaillant_split_question" : "direct_vaillant_question",
      serviceIntent: "brand_model",
      topic: asksSplit ? "Vaillant Split" : "Vaillant",
      retrievalQuery: "company-truth product-facts Vaillant aroTHERM plus aroTHERM Split tepelné čerpadlá radiátory Geotherm",
      answer: [
        asksSplit ? "### Vaillant Split" : "### Vaillant",
        "",
        splitLine,
        "",
        `${projectContextLine(state)} Pri tepelných čerpadlách je Vaillant spolu s NIBE bezpečná značka na komunikáciu, ale konkrétny model by som neoznačil za finálny bez návrhu výkonu, TÚV, hydrauliky, montáže, servisu a priestoru v kotolni.`,
        "",
        asksNibe ? "Najlepší ďalší krok je konzultácia: preveriť stav existujúceho NIBE, dôvod výmeny a pripraviť porovnanie novej ponuky." : "Najlepší ďalší krok je konzultácia alebo nacenenie podľa domu.",
      ].join("\n"),
    };
  }

  const generalBrandAnswer = [
    "### Značky tepelných čerpadiel",
    "",
    "Pri **tepelných čerpadlách** viem bezpečne komunikovať hlavne **NIBE a Vaillant**. IVT by som bez aktuálneho potvrdenia bral ako neisté alebo na overenie.",
    "",
    "Daikin a Mitsubishi by som pri TČ voda/voda alebo vzduch/voda nespomínal ako bežné portfólio, kým to firma nepotvrdí. Konkrétny model sa má vybrať až po návrhu podľa výkonu, radiátorov/podlahovky, teplej vody a kotolne.",
    "",
    "Ak chceš odporúčanie pre svoj dom, ide o novostavbu alebo starší dom a máš radiátory alebo podlahovku?",
  ].join("\n");
  return {
    triggered: true,
    answerMode: "brand_model_answer",
    reason: asksNibe ? "direct_nibe_question" : "direct_brand_question",
    serviceIntent: "brand_model",
    topic: asksNibe ? "NIBE" : "heat_pump_brands",
    retrievalQuery: "company-truth brands NIBE Vaillant IVT Daikin Mitsubishi tepelné čerpadlá portfólio Geotherm",
    answer: generalBrandAnswer,
  };
}

function priceDirectAnswer(message: string, state: QualificationState): DirectAnswerDecision {
  const text = normalizePolicyText(message);
  const hasKnownProject = Boolean(state.area_m2 || state.heating_distribution || state.current_heating || state.project_type);
  const context = hasKnownProject ? `Pri tvojom kontexte (${projectContextLine(state).replace(/\.$/, "")})` : "Pri tepelnom čerpadle";
  let answer: string;
  let reason = "direct_price_question";
  let topic = "price";

  if (/(akumulac|akumula|v cene)/.test(text)) {
    reason = "direct_buffer_tank_price_scope_question";
    topic = "buffer_tank_price_scope";
    answer = [
      "### Akumulačná nádrž a cena",
      "",
      "**Bez konkrétnej ponuky akumulačnú nádrž nepovažuj za zahrnutú položku.** Pri radiátoroch alebo komplikovanejšej kotolni môže byť potrebná, ale jej rozsah musí byť samostatne uvedený v ponuke.",
      "",
      "Pri cene 7 tisíc by som obzvlášť overil, či ide iba o zariadenie/zostavu, alebo o kompletnú realizáciu vrátane montáže, regulácie, TÚV, akumulačnej nádrže, elektroprác a uvedenia do prevádzky.",
    ].join("\n");
  } else if (/(rozpocet|rozpočet|\b5k\b|\b5000\b|5\s*000)/.test(text)) {
    reason = "direct_budget_scope_question";
    topic = "budget_scope";
    answer = [
      "### Rozpočet a odporúčanie",
      "",
      "Rozpočet 5k by som pri technickom riešení bral opatrne a **bez podkladov by som nesľuboval kompletné tepelné čerpadlo ani montáž**. Najprv treba oddeliť, či ide o servis, čiastočnú úpravu, klimatizáciu, alebo nové vykurovanie.",
      "",
      "Ak ide o nové riešenie domu, ďalší krok je krátka konzultácia a nacenenie reálneho rozsahu. Pri nízkom rozpočte má zmysel jasne povedať, čo sa dá riešiť teraz a čo by bolo mimo rozsahu.",
    ].join("\n");
  } else if (/(zlav|zľav|akci|akciov)/.test(text)) {
    reason = "direct_discount_scope_question";
    topic = "discount_scope";
    answer = [
      "### Zľava alebo akcia",
      "",
      "Konkrétnu zľavu na NIBE by som **bez aktuálne potvrdenej akcie alebo ponuky nesľuboval**. Zľavy sa môžu meniť podľa výrobcu, dostupnosti, zostavy, termínu a rozsahu realizácie.",
      "",
      "Bezpečný ďalší krok je overiť aktuálnu ponuku Geotherm a naceniť konkrétnu zostavu pre dom. Až potom sa dá povedať, či je dostupná zľava, akcia alebo iné zvýhodnenie.",
    ].join("\n");
  } else if (/(navratnost|usetr|uspora|úspor)/.test(text)) {
    reason = "direct_savings_or_roi_question";
    topic = "savings_roi_scope";
    answer = [
      "### Úspora a návratnosť",
      "",
      "**Presnú úsporu ani návratnosť by som negarantoval bez výpočtu pre konkrétny dom.** Záleží od dnešnej spotreby, ceny energií, zateplenia, typu vykurovania, výkonu riešenia, servisu, regulácie a výslednej ceny ponuky.",
      "",
      "Dá sa však pripraviť orientačný prepočet: porovnať dnešné náklady s navrhnutým riešením a naceniť rozsah montáže. Najlepší ďalší krok je krátka konzultácia s Geotherm, kde sa zistí súčasná spotreba a pripraví realistická ponuka.",
    ].join("\n");
  } else if (/(7\s*tis|7000|7\s*000|malo|málo)/.test(text)) {
    reason = "direct_low_price_sanity_check";
    topic = "low_price_scope";
    answer = [
      "### K cene 7 tisíc",
      "",
      `Áno, **7 tisíc môže byť pri kompletnom tepelnom čerpadle podozrivo nízka suma**, najmä ak sa bavíme o staršom dome s radiátormi a výmenou kotla. ${context} by som to nebral ako potvrdenú kompletnú cenu.`,
      "",
      "Treba presne overiť, čo je v tej sume: samotná zostava, montážny materiál, práca, regulácia, TÚV zásobník, akumulačná nádrž, elektropríprava, uvedenie do prevádzky a prípadné úpravy kotolne.",
      "",
      "Pri akumulačnej nádrži platí: nie je automaticky súčasťou rozsahu; rozhoduje konkrétna ponuka.",
    ].join("\n");
  } else if (/(najtich|tiche|tiché|hluk|hlucn|hlučn)/.test(text) && /(najlacn|najlacnej|lacne|lacné|cena|cheapest)/.test(text)) {
    reason = "direct_quietest_cheapest_pressure";
    topic = "quietest_cheapest_scope";
    answer = [
      "### Tiché a lacné naraz",
      "",
      "Najtichšie a najlacnejšie riešenie býva kompromis, nie automaticky najlepšia voľba. Pri tepelnom čerpadle treba porovnať hlučnosť konkrétnej jednotky, umiestnenie pri dome, výkon, servisné zázemie a rozsah montáže.",
      "",
      "Bez návrhu by som nevybral víťaza podľa jednej vlastnosti. Praktický ďalší krok je naceniť 1-2 vhodné zostavy a porovnať ich podľa hluku, rozsahu ponuky a prevádzkových nákladov.",
    ].join("\n");
  } else if (/(najlacn|najlacnej|lacne riesenie|lacné riešenie|cheapest)/.test(text)) {
    reason = "direct_lowest_price_pressure";
    topic = "lowest_price_scope";
    answer = [
      "### Cenovo najdostupnejšie riešenie",
      "",
      "Orientačne: pri najnižšej cene by som bol opatrný. Lacnejšia ponuka nemusí znamenať nižšie celkové náklady. Treba overiť, čo je v cene, čo je mimo ceny a či riešenie nebude neskôr drahšie na prevádzke, servise alebo úpravách.",
      "",
      "Rozumný ďalší krok je pripraviť ponuku s jasným rozsahom: zariadenie, montáž, regulácia, uvedenie do prevádzky, prípadná TÚV alebo akumulačná nádrž. Riešiš nové tepelné čerpadlo pre dom, výmenu starého zdroja alebo servis existujúceho zariadenia?",
    ].join("\n");
  } else if (/^(z coho|z čoho)\??$/.test(text) || text.includes("z coho") || text.includes("z čoho")) {
    reason = "direct_price_basis_question";
    topic = "price_basis";
    answer = [
      "### Z čoho sa skladá cena",
      "",
      "Myslím tým rozdiel medzi **cenou zariadenia** a **cenou kompletnej realizácie**. Kompletná cena môže zahŕňať tepelné čerpadlo, vnútorný modul alebo hydrauliku, reguláciu, montážny materiál, prácu, uvedenie do prevádzky, prípravu TÚV a podľa návrhu aj akumulačnú nádrž.",
      "",
      "Preto sa nedá bezpečne povedať, že konkrétna suma platí pre celý systém, kým nie je jasné, čo presne ponuka obsahuje.",
    ].join("\n");
  } else {
    answer = [
      "### Cena vrátane inštalácie",
      "",
      "Presnú cenu bez konkrétnej ponuky nepotvrdím. Pri tepelnom čerpadle treba rozlíšiť cenu samotnej zostavy a cenu kompletnej realizácie.",
      "",
      `${context} cenu ovplyvňuje výkon, radiátory alebo podlahovka, TÚV zásobník, regulácia, montážny materiál, úpravy kotolne, elektropráce, uvedenie do prevádzky a prípadná akumulačná nádrž.`,
      "",
      "Ak máš v ruke cenu, najdôležitejšie je porovnať rozsah: čo je zahrnuté, čo je príplatok a čo sa bude riešiť až po obhliadke alebo návrhu.",
      "",
      "Ide o nové tepelné čerpadlo pre dom, výmenu starého zdroja alebo servis existujúceho zariadenia?",
    ].join("\n");
  }

  return {
    triggered: true,
    answerMode: "price_answer",
    reason,
    answer,
    serviceIntent: "price",
    retrievalQuery: "company-truth pricing-rules cena náklady návratnosť úspora servis ponuka tepelné čerpadlo montáž inštalácia akumulačná nádrž čo je v cene rozsah ponuky",
    topic,
  };
}

function correctionDirectAnswer(message: string, state: QualificationState): DirectAnswerDecision {
  const text = normalizePolicyText(message);
  let answer: string;
  let topic = "correction";
  if (text.includes("f2040") || text.includes("nevyraba")) {
    topic = "F2040_obsolete";
    answer = [
      "### Oprava k F2040",
      "",
      "Máš pravdu, **F2040 by som nemal ponúkať ako aktuálny model pre novú realizáciu**. Ak sa nachádza v starších podkladoch alebo na webe, treba ho brať ako archívny/historický podklad, nie ako automatické odporúčanie.",
      "",
      "Pre tvoj prípad by som riešil typovo **vzduch-voda riešenie pre radiátorový systém** a konkrétny aktuálny model vybral až podľa návrhu. Bezpečne sa držím značiek **NIBE alebo Vaillant**, ale aktuálnu dostupnosť konkrétneho modelu treba potvrdiť.",
    ].join("\n");
  } else if (text.includes("iba nibe") || text.includes("nibe a vaillant") || text.includes("daikin") || text.includes("mitsubishi")) {
    topic = "brand_correction";
    answer = [
      "### Oprava k značkám",
      "",
      "Áno, správne: pri **tepelných čerpadlách** mám bezpečne komunikovať hlavne **NIBE a Vaillant**. Ak som predtým naznačil Daikin alebo Mitsubishi ako portfólio tepelných čerpadiel, ber to ako chybu.",
      "",
      "Daikin/Mitsubishi by som bez potvrdenia nespomínal pri TČ voda/voda alebo vzduch/voda; Mitsubishi môže patriť skôr ku klimatizáciám alebo vzduch-vzduch riešeniam.",
    ].join("\n");
  } else {
    answer = [
      "### Máš pravdu",
      "",
      "Neodpovedal som priamo na poslednú otázku. Pri takýchto follow-up otázkach nemám znova opakovať celé odporúčanie, ale najprv odpovedať na konkrétnu vec: značku, model, cenu alebo čo je zahrnuté v ponuke.",
      "",
      "Napíš mi tú konkrétnu položku ešte raz a odpoviem priamo bez ďalšieho dotazníka.",
    ].join("\n");
  }
  return {
    triggered: true,
    answerMode: "correction_answer",
    reason: "direct_correction_or_complaint",
    answer,
    serviceIntent: "complaint_or_correction",
    retrievalQuery: "company-truth correction rules brands models obsolete F2040 NIBE Vaillant Daikin Mitsubishi direct answer",
    topic,
  };
}

function directAnswerDecision(message: string, state: QualificationState, route: Pick<ServiceRoute, "serviceType" | "serviceIntent">): DirectAnswerDecision {
  const text = normalizePolicyText(message);
  const raw = message.toLowerCase();
  const activeService = normalizeServiceType(state.service_type || route.serviceType, "unknown");
  const previousActiveService = normalizeServiceType(state.service_type, "unknown");
  const hasActiveHeatPump = activeService === "heat_pump" || activeService === "complex_solution";
  const hasExistingDiagnosticContext = Boolean(
    state.project_type || state.area_m2 || state.heating_distribution || state.current_heating || state.qualification_question_rounds,
  );
  if (
    /(montaz|montáž)/i.test(raw) &&
    /(zajtra|hned|hneď)/i.test(raw) &&
    /(neviem|aky system|aký systém|aký syst[eé]m)/i.test(raw)
  ) {
    return {
      triggered: true,
      answerMode: "direct_answer",
      reason: "direct_contradictory_installation_timing",
      answer:
        "### Najprv systém, potom termín\n\nMontáž hneď zajtra by som **bez podkladov a bez potvrdeného systému nesľuboval**. Najprv treba určiť, či ide o tepelné čerpadlo, klimatizáciu, rekuperáciu, podlahové kúrenie alebo inú technológiu; až potom sa dá potvrdiť termín, kapacita a cena.\n\nAk nevieš systém, začal by som krátkou konzultáciou: kúrenie, chladenie, vetranie alebo komplexné riešenie domu?",
      serviceIntent: "process",
      retrievalQuery: "company-truth montaz termin system cena rozsah Geotherm",
      topic: "contradictory_installation_timing",
    };
  }
  if (raw.includes("certifik") && raw.includes("plyn")) {
    return {
      triggered: true,
      answerMode: "direct_answer",
      reason: "company_practical_gas_certification",
      answer:
        "### Plynové zariadenia\n\nInterné FAQ potvrdzuje, že Geotherm má **certifikáciu na plynové zariadenia**. Pri konkrétnej práci je dobré potvrdiť rozsah zásahu a potrebné revízne alebo odovzdávacie podklady.",
      serviceIntent: "process",
      retrievalQuery: "company-truth prakticke FAQ certifikacia plynove zariadenia Geotherm",
      topic: "gas_certification",
    };
  }
  if (isPureSmallTalkMessage(message)) {
    return {
      triggered: false,
      answerMode: "direct_answer",
      reason: null,
      answer: null,
      serviceIntent: null,
      retrievalQuery: null,
      topic: null,
    };
  }
  const priorityPractical = companyPracticalDirectAnswer(message);
  if (
    priorityPractical &&
    [
      "plan_obnovy_subsidy_scope",
      "subsidy_conditions_direct_scope",
      "vaillant_anniversary_subsidy_scope",
      "heat_pump_video_guides_scope",
      "mss_solar_system_scope",
      "photovoltaics_heat_pump_scope",
      "third_party_service",
    ].includes(priorityPractical.topic || "")
  ) {
    return priorityPractical;
  }
  if (state.last_direct_topic === "central_vacuum_scope" && /(novostav|bungalov|dom|m2|postup|ako|nacen|ponuk)/.test(text)) {
    return {
      triggered: true,
      answerMode: "direct_answer",
      reason: "direct_central_vacuum_followup",
      answer:
        "### Centrálny vysávač v novostavbe\n\nPri novostavbe alebo bungalove by som centrálny vysávač riešil hlavne cez trasu rozvodov, umiestnenie jednotky, počet zásuviek a pôdorys. Pri 150 m2 už dáva zmysel pozrieť dispozíciu, aby sa zásuvky rozmiestnili prakticky a systém sa dal naceniť bez hádania.\n\nNajlepší ďalší krok je poslať pôdorys alebo jednoduchý popis miestností a Geotherm potvrdí postup a nacenenie.",
      serviceIntent: "process",
      retrievalQuery: "centralny vysavac novostavba bungalov rozvody zasuvky podorys nacenenie Geotherm",
      topic: "central_vacuum_scope",
    };
  }
  if ((state.service_type === "subsidy" || state.service_intent === "subsidy") && /(chcem|potrebujem|pomoc|pomoct|pomôcť|prever|over|riesit|riešiť)/.test(text)) {
    return {
      triggered: true,
      answerMode: "direct_answer",
      reason: "direct_subsidy_help_handoff",
      answer:
        "### Pomoc s dotáciou\n\nÁno, pri dotácii dáva zmysel posunúť to na preverenie konkrétneho prípadu. Bez aktuálneho posúdenia by som negarantoval nárok, výšku podpory ani odpočítanie z ceny, ale Geotherm vie pomôcť overiť podmienky a pripraviť ďalší postup spolu s návrhom riešenia.\n\nNajlepší ďalší krok je krátka konzultácia alebo kontakt na preverenie dotácie a nacenenia.",
      serviceIntent: "subsidy",
      retrievalQuery: "service-card-subsidy dotacie pomoc asistencia overenie podmienok kontakt konzultacia Geotherm",
      topic: "subsidy_help_handoff",
    };
  }
  if (state.last_direct_topic === "water_softener_scope" && /(nacen|ponuk|cena|kolko|stoj|chcem)/.test(text)) {
    return {
      triggered: true,
      answerMode: "price_answer",
      reason: "direct_water_softener_quote_followup",
      answer:
        "### Nacenenie úpravy vody\n\nPri zmäkčovači alebo úprave vody by som cenu nehádal ako univerzálnu položku. Treba potvrdiť tvrdosť vody, počet osôb alebo spotrebu, miesto montáže a či ide len o zariadenie alebo aj zapojenie do rozvodov.\n\nNajpraktickejší ďalší krok je poslať stručný popis domu, prípadne rozbor/tvrdosť vody, fotku miesta montáže a kontakt na konzultáciu alebo nacenenie.",
      serviceIntent: "price",
      retrievalQuery: "zmakcovac vody uprava vody tvrdost rozbor spotreba montaz nacenenie Geotherm",
      topic: "water_softener_scope",
    };
  }
  if ((state.service_type === "floor_heating" || route.serviceType === "floor_heating") && /(novostav|dom|m2|plocha|bungalov|rekonstruk|rekonštruk)/.test(text)) {
    return {
      triggered: true,
      answerMode: "direct_answer",
      reason: "direct_floor_heating_followup",
      answer:
        "### Podlahové kúrenie pre dom\n\nPri novostavbe s plochou okolo 120 m2 dáva podlahové kúrenie veľmi dobrý zmysel ako nízkoteplotný a komfortný systém. Pri nacenení by som neriešil iba zdroj tepla, ale hlavne plochu miestností, skladbu podlahy, počet okruhov, rozdeľovače, reguláciu a projekt alebo pôdorys.\n\nNajlepší ďalší krok je poslať pôdorys/projekt alebo aspoň plochu po miestnostiach a Geotherm pripraví konzultáciu alebo nacenenie.",
      serviceIntent: "process",
      retrievalQuery: "service-card-floor-heating podlahove kurenie novostavba plocha skladba podlahy rozdelovac projekt nacenenie",
      topic: "floor_heating_scope",
    };
  }
  if (/(poradit|poradiť).*(vyber|výber|riesen|riešen)|(?:vyber|výber).*(riesen|riešen)|ake riesenie|aké riešenie/.test(text)) {
    return {
      triggered: true,
      answerMode: "direct_answer",
      reason: "direct_solution_selection_followup",
      answer:
        "### Výber riešenia\n\nÁno, s výberom riešenia sa dá začať tu, ale bez cieľa by som nehádal jednu technológiu. Geotherm rieši kúrenie, chladenie, vetranie, podlahové kúrenie, stropné chladenie, servis aj dotácie.\n\nNajprv treba určiť, či chceš riešiť úsporu kúrenia, chladenie v lete, čerstvý vzduch, poruchu existujúceho zariadenia alebo celé technické riešenie domu.",
      serviceIntent: "recommendation",
      retrievalQuery: "company-truth sluzby Geotherm vyber riesenia kurenie chladenie vetranie servis dotacie",
      topic: "solution_selection_followup",
    };
  }
  if (/(chcem|potrebujem|zhanam|zháňam|hladam|hľadám).*(tepelne cerpad|tepelné čerpad|\btc\b|\btč\b)/.test(text)) {
    return {
      triggered: true,
      answerMode: "qualification_question",
      reason: "direct_initial_heat_pump_short",
      answer:
        "### Predbežný smer\n\nPri rodinnom dome sa najčastejšie začína tepelným čerpadlom **vzduch-voda**. Pri novostavbe s podlahovkou je to veľmi vhodný smer; pri staršom dome s radiátormi treba overiť teplotu vody a výkon radiátorov.\n\nAby som ťa zaradil správne, napíš mi: je to novostavba alebo starší dom, koľko m2 chceš vykurovať a či máš radiátory alebo podlahové kúrenie.",
      serviceIntent: "recommendation",
      retrievalQuery: "service-card-heat-pump tepelne cerpadla vyber riesenia novostavba starsi dom radiatory podlahove kurenie",
      topic: "initial_heat_pump_short",
    };
  }
  if (/(stars|starš|starsi|starší|rekon)/.test(text) && /(radiator|radiátor)/.test(text) && /(\d{2,4}\s*m|m2|m²)/.test(text)) {
    return {
      triggered: true,
      answerMode: "diagnostic_verdict",
      reason: "direct_existing_radiator_heat_pump_standalone",
      answer:
        "### Starší dom s radiátormi\n\nPre starší dom s radiátormi dáva predbežne zmysel tepelné čerpadlo **vzduch-voda vhodné pre radiátorový systém**. Pri radiátoroch je dôležité overiť potrebnú teplotu vody, výkon radiátorov a stav kotolne.\n\nTypicky sa rieši vonkajšia jednotka, hydraulické zapojenie, regulácia, prípadne TÚV alebo akumulačná nádrž podľa návrhu. Ďalší krok by bola krátka konzultácia alebo nacenenie podľa fotiek kotolne a aktuálneho zdroja tepla.",
      serviceIntent: "recommendation",
      retrievalQuery: "scenar-starsi-dom-radiatory-plyn radiatorovy system vyssia teplota vody tepelne cerpadlo vzduch-voda",
      topic: "existing_radiator_heat_pump_standalone",
    };
  }
  const asksHeatPumpBrandOrModelInventory =
    /(?:ake|aké).*(?:mate|máte).*(?:tepelne cerpad|tepelné čerpad|\btc\b|\btč\b)|(?:ake|aké).*(?:tepelne cerpad|tepelné čerpad|\btc\b|\btč\b).*(?:mate|máte)|(?:znack|značk|model|split).*(?:tepelne cerpad|tepelné čerpad|\btc\b|\btč\b|nibe|vaillant)|(?:tepelne cerpad|tepelné čerpad|\btc\b|\btč\b).*(?:znack|značk|model|split)/.test(
      text,
    );
  if (
    !/(vrt|vrty|hlbin)/.test(text) &&
    !asksHeatPumpBrandOrModelInventory &&
    /(robite|robíte|mate|máte|ponukate|ponúkate).*(tepelne cerpad|tepelné čerpad|\btc\b|\btč\b)|(?:tepelne cerpad|tepelné čerpad|\btc\b|\btč\b).*(robite|robíte|mate|máte|ponukate|ponúkate)/.test(text)
  ) {
    return {
      triggered: true,
      answerMode: "direct_answer",
      reason: "direct_heat_pump_service_scope",
      answer:
        "### Tepelné čerpadlá\n\nÁno, Geotherm rieši tepelné čerpadlá ako návrh, dodávku, montáž a následný servis vlastných riešení. Bezpečne komunikované značky tepelných čerpadiel sú najmä NIBE a Vaillant.\n\nKonkrétny typ a model sa vyberá podľa domu, výkonu, vykurovania, teplej vody, chladenia a technických možností. Najlepší ďalší krok je krátka konzultácia alebo nacenenie podľa domu.",
      serviceIntent: "process",
      retrievalQuery: "company-truth tepelne cerpadla NIBE Vaillant navrh montaz servis Geotherm",
      topic: "heat_pump_service_scope",
    };
  }
  if (/(centraln|centráln).*(vysavac|vysávač)|(?:vysavac|vysávač).*(centraln|centráln)/.test(text)) {
    return {
      triggered: true,
      answerMode: "direct_answer",
      reason: "direct_central_vacuum_scope",
      answer:
        "### Centrálny vysávač\n\nCentrálny vysávač sa v knowledge Geotherm spomína ako súčasť technických riešení domu. Pri konkrétnom dopyte treba potvrdiť rozsah: či ide o novostavbu, prípravu rozvodov, doplnenie do existujúceho domu alebo servis.\n\nNajpraktickejší ďalší krok je poslať pôdorys alebo popis domu a Geotherm potvrdí, či a ako sa to dá naceniť.",
      serviceIntent: "process",
      retrievalQuery: "centralny vysavac Geotherm technicke riesenie domu",
      topic: "central_vacuum_scope",
    };
  }
  if (/(elektro|elektr).*(kotol|kotla|kotlom|kotlov)|(?:kotol|kotla|kotlom|kotlov).*(elektro|elektr)/.test(text)) {
    return {
      triggered: true,
      answerMode: "direct_answer",
      reason: "direct_boiler_electrical_scope",
      answer:
        "### Elektropríprava ku kotlu\n\nElektroprípravu alebo elektro časť pri kotle treba potvrdiť podľa konkrétnej kotolne a rozsahu výmeny. Pri realizácii sa rieši napájanie, regulácia, bezpečné zapojenie a súčinnosť s odbornou montážou.\n\nBez obhliadky alebo fotiek by som nesľuboval presný rozsah. Najlepší krok je poslať fotky kotolne a typ kotla, potom sa potvrdí postup.",
      serviceIntent: "process",
      retrievalQuery: "company-truth elektroinstalacia kotol elektropriprava regulacia montaz Geotherm",
      topic: "boiler_electrical_scope",
    };
  }
  if (/(ako).*(prebieha).*(servisny|servisný).*(zasah|zásah)|(?:servisny|servisný).*(zasah|zásah).*(prebieha)/.test(text)) {
    return {
      triggered: true,
      answerMode: "direct_answer",
      reason: "direct_service_visit_process",
      answer:
        "### Servisný zásah\n\nServisný zásah sa najprv začína identifikáciou zariadenia a problému: značka, model alebo fotka štítku, chybový kód, prejav poruchy a lokalita. Podľa toho sa potvrdí, či ide o diagnostiku, nastavenie, výjazd alebo iný postup.\n\nPri cudzích montážach treba dostupnosť servisu potvrdiť podľa značky a prípadu. Najlepší krok je poslať fotku štítku, popis problému a kontakt.",
      serviceIntent: "service_fault",
      retrievalQuery: "company-truth servisny zasah diagnostika znacka model chybovy kod lokalita Geotherm",
      topic: "service_visit_process",
    };
  }
  if (/^(servis)\??$|(?:viete|porad|poradiť|poradit).*(servis)|(?:servis).*(viete|porad|poradiť|poradit)/.test(text)) {
    return {
      triggered: true,
      answerMode: "service_fault_triage",
      reason: "direct_generic_service_scope",
      answer:
        "### Servis\n\nServis treba najprv zaradiť podľa zariadenia a situácie: môže ísť o pravidelnú údržbu, diagnostiku poruchy, nastavenie alebo posúdenie existujúcej montáže. Pri poruche neposielam svojpomocné zásahy; treba značka, model alebo fotka štítku, chybový kód alebo popis problému a lokalita.\n\nPri cudzích montážach treba dostupnosť potvrdiť podľa značky a prípadu. Najlepší krok je poslať fotku štítku, problém, mesto a kontakt.",
      serviceIntent: "service_fault",
      retrievalQuery: "company-truth servis udrzba diagnostika znacka model chybovy kod lokalita Geotherm",
      topic: "generic_service_scope",
    };
  }
  if (/(radiator|radiatory|radiatorov|radiátor|radiátory|radiátorov)/.test(text) && /(robite|robíte|viete|mate|máte|ponuk|rieš|ries)/.test(text)) {
    return {
      triggered: true,
      answerMode: "direct_answer",
      reason: "direct_radiators_scope",
      answer:
        "### Radiátory\n\nRadiátory sa v podkladoch Geotherm riešia ako súčasť vykurovacieho systému. Pri novej realizácii alebo výmene treba potvrdiť výkon, teplotný spád, typ zdroja tepla a stav rozvodov.\n\nPri tepelnom čerpadle je dôležité overiť, či radiátory vykúria dom pri nižšej teplote vody, alebo bude treba časť vykurovacích telies upraviť.",
      serviceIntent: "process",
      retrievalQuery: "company-truth radiatory vykurovacie telesa tepelne cerpadlo teplotny spad Geotherm",
      topic: "radiators_scope",
    };
  }
  if (/(robite|robíte|viete|da sa|dá sa).*(novostav|novy dom|nový dom)|(?:novostav|novy dom|nový dom).*(robite|robíte|viete|da sa|dá sa)/.test(text)) {
    return {
      triggered: true,
      answerMode: "direct_answer",
      reason: "direct_new_build_scope",
      answer:
        "### Novostavby\n\nÁno, novostavby dávajú zmysel riešiť už vo fáze návrhu, lebo kúrenie, chladenie, teplá voda, vetranie a prípadná fotovoltika sa dajú navrhnúť ako jeden systém.\n\nTypicky sa pri novostavbe rieši tepelné čerpadlo, podlahové kúrenie, rekuperácia, chladenie a regulácia. Najlepší ďalší krok je krátka konzultácia alebo nacenenie podľa projektu, plochy domu a toho, čo všetko má systém pokrývať.",
      serviceIntent: "process",
      retrievalQuery: "company-truth novostavba komplexne technicke riesenie tepelne cerpadlo rekuperacia podlahove kurenie Geotherm",
      topic: "new_build_scope",
    };
  }
  if (/(bez).*(odstavk|odstávk).*(vod|vody)|(?:vod|vody).*(bez).*(odstavk|odstávk)/.test(text)) {
    return {
      triggered: true,
      answerMode: "direct_answer",
      reason: "direct_water_shutdown_scope",
      answer:
        "### Odstávka vody\n\nČi sa práca dá urobiť bez odstávky vody, závisí od konkrétneho zásahu a zapojenia. Pri niektorých servisných alebo montážnych prácach môže byť krátka odstávka nutná; bez obhliadky alebo fotiek by som nesľuboval, že voda zostane po celý čas zapnutá.\n\nNajistejšie je poslať fotky miesta a rozsah práce, potom Geotherm potvrdí postup.",
      serviceIntent: "process",
      retrievalQuery: "company-truth prakticke FAQ odstavka vody montaz servis rozsah prac Geotherm",
      topic: "water_shutdown_scope",
    };
  }
  if (/(bez).*(odstavk|odstávk).*(kuren|kúren|vykurov)|(?:kuren|kúren|vykurov).*(bez).*(odstavk|odstávk)/.test(text)) {
    return {
      triggered: true,
      answerMode: "direct_answer",
      reason: "direct_heating_shutdown_scope",
      answer:
        "### Odstávka kúrenia\n\nČi sa práca dá spraviť bez odstávky kúrenia, závisí od zásahu, sezóny a zapojenia systému. Pri niektorých úpravách kotolne, servise alebo výmene časti systému môže byť krátka odstávka nutná.\n\nBez konkrétneho rozsahu by som to nesľuboval. Najlepší krok je poslať fotky kotolne a popis práce, aby Geotherm potvrdil postup.",
      serviceIntent: "process",
      retrievalQuery: "company-truth odstavka kurenia servis montaz kotolna postup Geotherm",
      topic: "heating_shutdown_scope",
    };
  }
  if (/(obhliad|pozriet|pozrieť).*(videohovor|video|online)|(?:videohovor|video|online).*(obhliad|pozriet|pozrieť)/.test(text)) {
    return {
      triggered: true,
      answerMode: "direct_answer",
      reason: "direct_video_inspection_scope",
      answer:
        "### Obhliadka cez videohovor\n\nObhliadku cez videohovor by som nesľuboval automaticky ako plnú náhradu osobnej obhliadky. Na prvé preverenie však často pomôžu fotky, video, pôdorys alebo krátky telefonát.\n\nPri jednoduchej orientácii sa dá začať online; pri presnej ponuke, montáži alebo servisnom zásahu môže byť potrebné osobné preverenie podľa rozsahu.",
      serviceIntent: "inspection",
      retrievalQuery: "company-truth obhliadka videohovor fotky online konzultacia Geotherm",
      topic: "video_inspection_scope",
    };
  }
  if (/(rezervovat|rezervovať|objednat|objednať|dohodnut|dohodnúť).*(termin|termín)|(?:termin|termín).*(rezervovat|rezervovať|objednat|objednať|dohodnut|dohodnúť)/.test(text)) {
    return {
      triggered: true,
      answerMode: "direct_answer",
      reason: "direct_booking_process",
      answer:
        "### Rezervácia termínu\n\nTermín sa dá dohodnúť podľa typu služby, lokality, rozsahu práce a aktuálnej kapacity. Pri servise pomôže značka/model, popis problému a fotka štítku; pri montáži alebo ponuke stručný rozsah, fotky alebo projekt.\n\nNajpraktickejší ďalší krok je poslať kontakt a základné podklady, aby Geotherm potvrdil reálny termín.",
      serviceIntent: "process",
      retrievalQuery: "company-truth rezervacia termin kapacita servis montaz kontakt Geotherm",
      topic: "booking_process",
    };
  }
  if (/(pozarucn|pozáručn).*(servis|oprava|udrzba|údržba)|(?:servis|oprava|udrzba|údržba).*(pozarucn|pozáručn)/.test(text)) {
    return {
      triggered: true,
      answerMode: "direct_answer",
      reason: "direct_post_warranty_service_scope",
      answer:
        "### Pozáručný servis\n\nPozáručný servis treba potvrdiť podľa zariadenia, značky, modelu, problému a lokality. Pri vlastných realizáciách je následný servis prirodzená súčasť spolupráce; pri cudzích montážach by som ho nesľuboval automaticky.\n\nNajlepší krok je poslať fotku štítku, popis problému a kontakt na preverenie termínu.",
      serviceIntent: "service_fault",
      retrievalQuery: "company-truth service pozarucny servis vlastne realizacie cudzie montaze znacka model lokalita Geotherm",
      topic: "post_warranty_service_scope",
    };
  }
  if (/(pred).*(realizaci|realizáci).*(vybavit|vybaviť|potreb)|(?:potrebujem|treba).*(pred).*(realizaci|realizáci)/.test(text)) {
    return {
      triggered: true,
      answerMode: "direct_answer",
      reason: "direct_pre_realization_requirements",
      answer:
        "### Pred realizáciou\n\nPred realizáciou netreba hneď všetko vybavovať dopredu, ale pomôžu základné podklady: fotky miesta, projekt alebo pôdorys, informácia o aktuálnom kúrení, požadovaný rozsah a lokalita.\n\nPri konkrétnej zákazke sa potom potvrdí termín, prístup na stavbu, potrebné prípravy, elektro alebo voda a čo zabezpečí zákazník.",
      serviceIntent: "process",
      retrievalQuery: "company-truth pred realizaciou podklady fotky projekt priprava Geotherm",
      topic: "pre_realization_requirements",
    };
  }
  if (/(kto).*(kontakt).*(realizaci|realizáci)|(?:kontakt).*(pocas|počas).*(realizaci|realizáci)/.test(text)) {
    return {
      triggered: true,
      answerMode: "direct_answer",
      reason: "direct_realization_contact",
      answer:
        "### Kontakt počas realizácie\n\nPri konkrétnej realizácii má zmysel mať dohodnutý jasný kontakt za Geotherm, ktorý rieši termín, podklady, priebeh prác a prípadné doplnenia. Meno konkrétnej osoby by som bez zákazky nesľuboval.\n\nNajlepší ďalší krok je poslať dopyt alebo kontakt, aby Geotherm priradil zodpovednú osobu podľa typu zákazky.",
      serviceIntent: "contact",
      retrievalQuery: "company-truth kontakt pocas realizacie zodpovedna osoba Geotherm",
      topic: "realization_contact",
    };
  }
  const genericRecommendationFollowup = /^(co|čo)\s+odpor(u|ú)[cč]ate\??$/.test(text) || /^(ake|aké)\s+riesenie\??$/.test(text);
  const practical =
    hasExistingDiagnosticContext &&
    previousActiveService === "heat_pump" &&
    (isQualificationDataReply(message) || genericRecommendationFollowup)
      ? null
      : companyPracticalDirectAnswer(message);
  if (practical) return practical;
  if (/\bbyt\b|byte|bytu/.test(text) && /(vhodn|tepelne cerpad|tepelné čerpad|tc\b|tč\b|dom vlastne byt|dom vlastne)/.test(text)) {
    return {
      triggered: true,
      answerMode: "direct_answer",
      reason: "direct_heat_pump_flat_suitability",
      answer: [
        "### Beriem to ako byt",
        "",
        "Vtedy by som nedával rovnaké odporúčanie ako pre rodinný dom. Pre byt je bezpečný záver iba tento: najprv preveriť, či vôbec existuje technicky a právne priechodné miesto pre zdroj tepla. Ak nie, praktickejšie môže byť lokálne chladenie/kúrenie alebo iné riešenie podľa bytovky.",
        "",
        "Ďalší krok by som nerobil ďalším dotazníkom, ale krátkym preverením možností s Geotherm podľa konkrétneho bytu.",
      ].join("\n"),
      serviceIntent: "recommendation",
      retrievalQuery: "company-truth tepelne cerpadlo byt bytovka vonkajsia jednotka povolenie hluk klimatizacia Geotherm",
      topic: "flat_heat_pump_suitability",
    };
  }
  const currentTurnAsksPrice =
    /(cena|cenu|ceny|cenov|cennik|ponuk|nacen|najlacn|najlacnej|lacne riesenie|lacné riešenie|cheapest|koľko|kolko|stoji|stojí|navratnost|návratnosť|usetr|úspor|uspora|rozpocet|rozpočet|\b5k\b|\b5000\b|5\s*000|zlav|zľav|akci|akciov|vratane instalacie|vrátane inštalácie|7\s*tis|7000|7\s*000|akumulac|akumula|v cene|z coho|z čoho)/.test(text);
  if (/(kotol|zariadenie|nibe|vaillant|cerpadlo|čerpadlo).*(chyba|chybu|kod|kód)|(?:chyba|chybu|kod|kód).*(kotol|zariadenie|nibe|vaillant|cerpadlo|čerpadlo)/.test(text)) {
    return {
      triggered: true,
      answerMode: "direct_answer",
      reason: "direct_error_code_service_scope",
      answer:
        "### Chybové hlásenie zariadenia\n\nAk kotol, tepelné čerpadlo alebo iné zariadenie ukazuje chybu, neradil by som zásah naslepo. Najprv treba značku, model, chybový kód, lokalitu a informáciu, či zariadenie ešte kúri alebo stojí.\n\nNajlepší ďalší krok je poslať fotku displeja alebo štítku a kontakt, aby Geotherm potvrdil bezpečný servisný postup.",
      serviceIntent: "service_fault",
      retrievalQuery: "company-truth service chybovy kod displej znacka model lokalita Geotherm",
      topic: "error_code_service_scope",
    };
  }
  if ((route.serviceType === "service" || route.serviceIntent === "service_fault") && !currentTurnAsksPrice) {
    return {
      triggered: false,
      answerMode: "direct_answer",
      reason: null,
      answer: null,
      serviceIntent: null,
      retrievalQuery: null,
      topic: null,
    };
  }
  const correction =
    /(neodpovedal|otazka som dal inu|otazka bola ina|pisla si|napisala si|povedali.*iba|preco mi ho ponukas|uz sa .*nevyraba|nevyraba|nevyrába)/.test(text);
  if (correction) return correctionDirectAnswer(message, state);

  if (isClarificationOnlyMessage(message) && (state.last_direct_topic || state.last_brand_model_topic || state.last_price_topic)) {
    const topic = state.last_direct_topic || state.last_brand_model_topic || state.last_price_topic || "clarification";
    return {
      triggered: true,
      answerMode: "direct_answer",
      reason: "direct_clarification_request",
      serviceIntent: null,
      topic: "clarification",
      retrievalQuery: `company-truth direct answer clarification ${topic} tepelné čerpadlá Geotherm`,
      answer: [
        "### Upresnenie",
        "",
        "Myslel som tým: pri tepelných čerpadlách viem ako bezpečné firemné portfólio komunikovať hlavne NIBE a Vaillant. To ešte nie je výber vhodného čerpadla pre tvoj dom.",
        "",
        "Ak chceš, aby som odporučil smer pre teba, napíš mi, či ide o novostavbu alebo starší dom a či máš radiátory alebo podlahovku.",
      ].join("\n"),
    };
  }

  const price =
    currentTurnAsksPrice ||
    (route.serviceIntent === "price" && hasActiveHeatPump && isContextualPriceFollowup(message));
  if (price) return priceDirectAnswer(message, state);

  const explicitBrandModelQuestion =
    !isBoilerOnlyQuestion(text) && /(znack|značka|ake.*\btc\b|ake mate|aké máte|ake znacky|aké značky|nibe|vaillant|daikin|mitsubishi|f2040|f2050|\bmodel\b|\bsplit\b)/.test(text);
  const brandModel =
    explicitBrandModelQuestion ||
    (hasActiveHeatPump && route.serviceIntent === "brand_model" && !isQualificationDataReply(message) && isContextualBrandModelFollowup(message));
  if (brandModel) return brandModelDirectAnswer(message, state);

  return {
    triggered: false,
    answerMode: "direct_answer",
    reason: null,
    answer: null,
    serviceIntent: null,
    retrievalQuery: null,
    topic: null,
  };
}

function countQualificationQuestionRounds(previousMessages: Array<{ role: string; content: string }>): number {
  return previousMessages.filter((message) => {
    if (message.role !== "assistant" || !message.content.includes("?")) return false;
    const text = normalizePolicyText(message.content);
    return /(novostav|starsi|starší|m2|plocha|radiator|podlah|zdroj|kuris|kúriš|spotreb|zateplen|osob|chladen|tepla voda|tuv|projekt|tepelna strata|energeticky certifikat|fotky|kotoln|akumulac)/.test(text);
  }).length;
}

function countRecommendationExtraSlots(state: QualificationState): number {
  return [
    state.current_heating,
    state.insulation,
    state.occupants,
    state.hot_water,
    state.wants_cooling,
    state.annual_consumption || state.annual_consumption_unknown,
    state.location,
    state.own_wood,
  ].filter((value) => value !== undefined && value !== null && value !== "").length;
}

function recommendationOptionsForState(state: QualificationState): string[] {
  if (isExistingRadiatorSolidFuel(state)) {
    return [
      "Tepelné čerpadlo vzduch-voda ako hlavný zdroj kúrenia",
      "Hybridné zapojenie: tepelné čerpadlo + ponechaný kotol na drevo ako záloha alebo doplnkový zdroj",
    ];
  }
  if (isExistingRadiatorHeatPump(state)) {
    return [
      "Tepelné čerpadlo vzduch-voda vhodné pre radiátorový systém",
      "Úprava alebo posilnenie časti radiátorov, ak dom potrebuje vyššiu teplotu vody",
    ];
  }
  if (isNewBuildFloorHeating(state)) {
    return [
      "Tepelné čerpadlo vzduch-voda pre nízkoteplotné podlahové kúrenie",
      "Tepelné čerpadlo so zásobníkom TÚV podľa počtu osôb",
      "Samostatne navrhnuté chladenie cez stropné chladenie, fancoily alebo klimatizáciu podľa projektu",
    ];
  }
  return [
    "Predbežný typ riešenia podľa domu a vykurovacej sústavy",
    "Technické doplnenie podľa teplej vody, regulácie a priestoru v technickej miestnosti",
  ];
}

function remainingCriticalUnknownsForState(state: QualificationState): string[] {
  const unknowns: string[] = [];
  if (isExistingRadiatorHeatPump(state)) {
    unknowns.push("potrebná teplota vody pre radiátory");
    if (!state.insulation) unknowns.push("zateplenie domu");
    unknowns.push("akumulačná nádrž alebo existujúce zapojenie kotolne");
  }
  if (isNewBuildFloorHeating(state) && !state.project_available && state.heat_loss_known !== true) {
    unknowns.push("výkon a konkrétna zostava sa doriešia pri nacenení");
  }
  if (!state.hot_water && !state.occupants) unknowns.push("či má systém riešiť teplú vodu");
  return [...new Set(unknowns)].slice(0, 5);
}

function recommendationClosureDecision(
  state: QualificationState,
  route: Pick<ServiceRoute, "serviceType" | "serviceIntent">,
  questionRoundsCount: number,
): RecommendationClosureDecision {
  const service = normalizeServiceType(state.service_type || route.serviceType, "unknown");
  const intent = normalizeServiceIntent(state.service_intent || route.serviceIntent, "general");
  const hasMinimumHeatPumpSlots = Boolean(state.project_type && state.area_m2 && state.heating_distribution);
  const extraSlots = countRecommendationExtraSlots(state);
  const hasClosureQualitySlot = Boolean(state.insulation || state.annual_consumption || state.occupants || state.hot_water !== undefined || state.wants_cooling !== undefined || state.location);
  const heatPumpRecommendation = service === "heat_pump" && ["recommendation", "comparison", "general"].includes(intent);
  const newBuildReadyForClosure = isNewBuildFloorHeating(state) && Boolean(state.occupants && state.wants_cooling !== undefined);
  const existingRadiatorReadyForClosure = isExistingRadiatorHeatPump(state) && Boolean(state.current_heating) && questionRoundsCount >= 2;
  const triggered =
    heatPumpRecommendation &&
    hasMinimumHeatPumpSlots &&
    (newBuildReadyForClosure ||
      existingRadiatorReadyForClosure ||
      (extraSlots >= 3 && hasClosureQualitySlot) ||
      (questionRoundsCount >= 2 && extraSlots >= 2 && hasClosureQualitySlot) ||
      questionRoundsCount >= 3);
  const reason = !triggered
    ? null
    : extraSlots >= 3
      ? "minimum_slots_plus_enough_context"
      : "question_budget_exhausted";
  return {
    triggered,
    reason,
    options: triggered ? recommendationOptionsForState(state) : [],
    remainingCriticalUnknowns: triggered ? remainingCriticalUnknownsForState(state) : [],
  };
}

function expectedRecommendationClosureAnswer(state: QualificationState, closure: RecommendationClosureDecision): string {
  if (isExistingRadiatorSolidFuel(state)) {
    const area = state.area_m2 ? `${state.area_m2} m²` : "danú plochu";
    const houseState = state.insulation ? "v zateplenom staršom dome" : "v staršom dome";
    const insulationReason = state.insulation
      ? "máš radiátory a dom je zateplený, takže šanca na funkčné riešenie je výrazne lepšia než pri nezateplenom dome"
      : "máš radiátory, takže treba preveriť hlavne teplotu vody, ktorú dom potrebuje v zime";
    const consumption = state.annual_consumption
      ? `Beriem údaj **${state.annual_consumption}** ako orientačnú spotrebu dreva za sezónu. Ak je jednotka iná, pri návrhu sa to jednoducho spresní.`
      : "Presná spotreba dreva nemusí byť pre prvý verdikt blokér; pri návrhu sa dá dopresniť.";
    const woodEconomics = state.own_wood
      ? "Keďže máš vlastné drevo, nehodnotil by som to iba cez úsporu. Ekonomiku treba overiť, ale hlavný prínos môže byť komfort: automatické kúrenie bez prikladania, menej práce s drevom a možnosť nechať drevo ako zálohu."
      : "Pri dreve treba ekonomiku porovnať podľa reálnej ceny paliva, práce okolo kúrenia a spotreby elektriny; bez výpočtu by som negarantoval úsporu.";
    return [
      "### Predbežné uzavretie odporúčania",
      "",
      `Podľa toho, čo píšeš, by som to už predbežne uzavrel: **najlepší smer je tepelné čerpadlo vzduch-voda vhodné pre radiátorový systém** ${houseState} s plochou približne ${area}.`,
      "",
      `**Prečo:** ${insulationReason}. ${woodEconomics} ${consumption}`,
      "",
      "**Reálne by som pozeral na dve možnosti:**",
      `1. **${closure.options[0] || "Tepelné čerpadlo vzduch-voda ako hlavný zdroj kúrenia"}.** Vhodné, ak chceš čo najviac obmedziť prikladanie a mať automatickú prevádzku.`,
      `2. **${closure.options[1] || "Hybridné zapojenie: tepelné čerpadlo + ponechaný kotol na drevo"}.** Vhodné, ak máš vlastné drevo a chceš ho občas využívať ako zálohu alebo doplnok.`,
      "",
      "Z portfólia firmy by dávalo zmysel pozrieť sa na vhodné riešenie od **NIBE alebo Vaillant** pre radiátorový systém, ale konkrétny model by sa vybral až podľa výkonu, radiátorov, kotolne a prípravy teplej vody.",
      "",
      "Typicky by sa riešila vonkajšia jednotka, vnútorné hydraulické zapojenie, regulácia, prípadne zásobník TÚV, akumulačná nádrž alebo využitie existujúcej nádrže a napojenie na radiátorový systém.",
      "",
      "Finálne treba preveriť hlavne teplotu vody pre radiátory, existujúcu akumulačnú nádrž, priestor v kotolni a či má čerpadlo riešiť aj teplú vodu.",
      "",
      "Ďalší krok by som už nerobil ďalším dotazníkom. Dajme si krátku konzultáciu alebo stretnutie, kde sa preverí radiátorový systém, kotolňa a prípadná akumulačná nádrž a pripraví sa konkrétne nacenenie.",
    ].join("\n");
  }

  if (isExistingRadiatorHeatPump(state)) {
    const area = state.area_m2 ? ` pri dome približne ${state.area_m2} m²` : "";
    const source = state.current_heating ? ` a náhrade zdroja typu ${state.current_heating}` : "";
    return [
      "### Predbežné uzavretie odporúčania",
      "",
      `Podľa toho, čo píšeš, by som to už predbežne uzavrel: **najlepší smer je tepelné čerpadlo vzduch-voda vhodné pre radiátorový systém**${area}${source}.`,
      "",
      "Dáva to zmysel, ale pri radiátoroch treba vyberať riešenie podľa požadovanej teploty vody. Ak sú radiátory dostatočne veľké, môže systém fungovať úsporne; ak sú poddimenzované, rieši sa ich posilnenie alebo vhodnejšia vysokoteplotná konfigurácia.",
      "",
      "**Pozrel by som sa na tieto možnosti:**",
      "1. **Vaillant aroTHERM plus** ako vzduch-voda riešenie vhodné aj pre radiátorové systémy, ak sadne výkon a zapojenie.",
      "2. **NIBE S2125 alebo aktuálne NIBE vzduch-voda riešenie** podľa aktuálnej ponuky a požadovaného výkonu.",
      "3. **Úprava hydrauliky alebo časti radiátorov**, ak dom potrebuje vyššiu teplotu vody alebo stabilnejší objem systému.",
      "",
      "Typicky by sa riešila vonkajšia jednotka, vnútorné hydraulické zapojenie, regulácia, prípadne zásobník TÚV a akumulačná nádrž podľa kotolne.",
      "",
      "Ďalší krok by už mala byť krátka konzultácia alebo stretnutie. Tam sa vyberú 2-3 konkrétne zostavy a pripraví sa nacenenie podľa radiátorov, kotolne a teplej vody.",
    ].join("\n");
  }

  if (isNewBuildFloorHeating(state)) {
    const area = state.area_m2 ? ` pri dome približne ${state.area_m2} m²` : "";
    const occupants = state.occupants ? `, so zásobníkom TÚV dimenzovaným pre ${state.occupants} osôb` : "";
    const cooling = state.wants_cooling
      ? "Keďže chceš aj chladenie, nerátal by som automaticky s tým, že samotná podlahovka bude stačiť. Chladenie by som nacenil ako samostatný variant: stropné chladenie, fancoily alebo klimatizácia podľa toho, aký komfort v lete chceš."
      : "Ak by si chcel aj chladenie, nacenil by som ho samostatne, nie ako automatický vedľajší efekt podlahovky.";
    return [
      "### Predbežné uzavretie odporúčania",
      "",
      `Podľa toho, čo píšeš, by som to už uzavrel: **najlepší smer je tepelné čerpadlo vzduch-voda pre novostavbu s nízkoteplotným podlahovým kúrením**${area}${occupants}.`,
      "",
      `Dáva to zmysel preto, že podlahovka pracuje s nízkou teplotou vody a tepelnému čerpadlu to vyhovuje. ${cooling}`,
      "",
      "**Pozrel by som sa na tieto možnosti:**",
      "1. **Vaillant aroTHERM plus** ako moderné vzduch-voda riešenie pre podlahové kúrenie a TÚV.",
      "2. **Vaillant aroTHERM Split** ako splitové riešenie, ak bude lepšie sedieť technickému umiestneniu.",
      "3. **NIBE vzduch-voda riešenie, napríklad S2125**, ak bude podľa aktuálnej ponuky a konfigurácie vhodné pre dom.",
      "",
      "Ďalší krok by som už nerobil ďalším dotazníkom. Dajme si krátku konzultáciu alebo stretnutie, kde sa vyberú 2-3 konkrétne zostavy, preverí sa TÚV a chladenie a pripraví sa nacenenie.",
    ].join("\n");
  }

  return [
    "### Predbežné uzavretie odporúčania",
    "",
    "Podľa doterajších údajov už dáva zmysel uzavrieť základný smer a nepokračovať iba ďalšími otázkami. Najprv by som vybral vhodný typ riešenia podľa domu a vykurovacej sústavy, až potom konkrétnu značku alebo model.",
    "",
    "**Možnosti:**",
    ...closure.options.map((option, index) => `${index + 1}. ${option}.`),
    "",
    "Ďalší krok by už mala byť krátka konzultácia alebo stretnutie, kde sa vyberie konkrétny rozsah riešenia a pripraví sa nacenenie.",
  ].join("\n");
}

function countQuestionMarks(value: string): number {
  return (value.match(/\?/g) || []).length;
}

function answerHasRecommendationClosure(answer: string): boolean {
  const normalized = normalizePolicyText(answer);
  const hasClosureLanguage = /(najlepsi smer|uzavrel|uzavriet|predbezne uzavrel)/.test(normalized);
  const hasOptions = /(1\s|1\.|jedna moznost|prva moznost)/.test(normalized) && /(2\s|2\.|druha moznost|hybrid)/.test(normalized);
  const hasCta = /(dalsi krok|ďalší krok|konzult|stretn|nacen|nacenenie|cenova ponuka|cenovu ponuku|dohodnut obhliadku|pripravit navrh|pripraviť návrh)/.test(normalized);
  return hasClosureLanguage && hasOptions && hasCta && countQuestionMarks(answer) <= 2;
}

function answerHasNewBuildPortfolioClosure(answer: string): boolean {
  const normalized = normalizePolicyText(answer);
  const hasPortfolioOption = /(s2125|arotherm|aro therm|arotherm plus|arotherm split)/.test(normalized);
  const hasHandoff = /(konzult|stretn|nacen|nacenenie|cenova ponuka|cenovu ponuku)/.test(normalized);
  const asksForDocs = /(posli|dopl[nn]|potrebujem|potrebujeme|mas|máš).*(projekt|energeticky certifikat|tepelna strata|tepelnu stratu)/.test(normalized);
  return answerHasRecommendationClosure(answer) && hasPortfolioOption && hasHandoff && !asksForDocs;
}

function answerHasRequiredVerdict(answer: string, state: QualificationState): boolean {
  const normalized = normalizePolicyText(answer);
  if (!/(predbez|verdikt|isiel|odporucal|dava zmysel|vhodn)/.test(normalized)) return false;
  if (isNewBuildFloorHeating(state)) {
    return normalized.includes("vzduch voda") && normalized.includes("podlah") && /(nizkoteplot|nizko teplot|nizkou teplotou)/.test(normalized);
  }
  if (isExistingRadiatorSolidFuel(state)) {
    return normalized.includes("vzduch voda") && normalized.includes("radiator") && /(drevo|tuhe palivo|tuhym palivom)/.test(normalized);
  }
  if (isExistingRadiatorHeatPump(state)) {
    return normalized.includes("vzduch voda") && normalized.includes("radiator");
  }
  return true;
}

function answerIsGenericServiceFallback(answer: string): boolean {
  const normalized = normalizePolicyText(answer);
  return normalized.includes("urcil vhodnu sluzbu") || normalized.includes("riesis kurenie chladenie vetranie servis alebo dotaciu");
}

function replaceMatchingSentences(answer: string, matcher: (normalizedSentence: string) => boolean, replacement: string): string {
  return answer
    .split(/\n/)
    .map((line) => {
      if (!line.trim() || line.trim().startsWith("|")) return line;
      const parts = line.match(/[^.!?]+[.!?]?|\s+/g) || [line];
      return parts
        .map((part) => {
          if (!/[A-Za-zÁÄČĎÉÍĽĹŇÓÔŔŠŤÚÝŽáäčďéíľĺňóôŕšťúýž]/.test(part)) return part;
          return matcher(normalizePolicyText(part)) ? replacement : part;
        })
        .join("")
        .replace(/\s{2,}/g, " ")
        .trimEnd();
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

type AnswerDiagnostics = {
  validatorsTriggered: string[];
  bannedClaimsRemoved: string[];
  fallbackType: string | null;
};

function recordDiagnostic(list: string[], value: string): void {
  if (!list.includes(value)) list.push(value);
}

function applySanitizerRule(
  answer: string,
  diagnostics: AnswerDiagnostics | undefined,
  trigger: string,
  bannedClaim: string | null,
  matcher: (normalizedSentence: string) => boolean,
  replacement: string,
): string {
  const next = replaceMatchingSentences(answer, matcher, replacement);
  if (next !== answer && diagnostics) {
    recordDiagnostic(diagnostics.validatorsTriggered, trigger);
    if (bannedClaim) recordDiagnostic(diagnostics.bannedClaimsRemoved, bannedClaim);
  }
  return next;
}

function sanitizeAnswerForDiagnosticRules(
  answer: string,
  state: QualificationState,
  route: Pick<ServiceRoute, "serviceType" | "serviceIntent">,
  diagnostics?: AnswerDiagnostics,
): string {
  let next = answer;
  const coolingSanitized = next.replace(
    /(?:oveľa\s+)?komfortnejšie\s+a\s+úspornejšie\s+ako\s+klasická\s+klimatizácia/gi,
    "jemné, ale má limity; komfortné chladenie treba navrhnúť cielene podľa projektu",
  );
  if (coolingSanitized !== next && diagnostics) {
    recordDiagnostic(diagnostics.validatorsTriggered, "cooling_claim_sanitized");
    recordDiagnostic(diagnostics.bannedClaimsRemoved, "podlahové chladenie lepšie ako klimatizácia");
  }
  next = coolingSanitized;
  const serviceQuestionSanitized = next.replace(
    /máš záujem o montáž a servis od nás\??/gi,
    "ďalší krok je krátka konzultácia alebo nacenenie podľa konkrétneho rozsahu.",
  );
  if (serviceQuestionSanitized !== next && diagnostics) {
    recordDiagnostic(diagnostics.validatorsTriggered, "weak_sales_question_replaced");
  }
  next = serviceQuestionSanitized;

  next = applySanitizerRule(
    next,
    diagnostics,
    "inspection_claim_sanitized",
    "bezplatná alebo nezáväzná obhliadka",
    (sentence) => sentence.includes("obhliad") && /(bezplatn|zadarmo|nezavazn)/.test(sentence) && !sentence.includes("nie je"),
    "Ďalší krok je preveriť podklady alebo dohodnúť posúdenie s technikom podľa aktuálnych podmienok firmy.",
  );
  next = applySanitizerRule(
    next,
    diagnostics,
    "third_party_service_claim_sanitized",
    "servis cudzej montáže",
    (sentence) =>
      !sentence.includes("treba potvrdit") &&
      (
        (sentence.includes("cudzi") && sentence.includes("montaz") && sentence.includes("servis")) ||
        (/(nebol[io] nami|nie od nas|ina firma|inej firmy)/.test(sentence) && /(servis|oprava|diagnostik)/.test(sentence) && /(mozeme|vieme|vykonat|spravit|urobit)/.test(sentence))
      ),
    "Pri zariadeniach montovaných inou firmou treba servis najprv potvrdiť podľa značky a dostupnosti.",
  );
  next = applySanitizerRule(
    next,
    diagnostics,
    "complete_subsidy_claim_sanitized",
    "dotácie vybavíme kompletne",
    (sentence) => sentence.includes("dotac") && /(kompletne vybav|vybavime komplet|vybavujeme komplet)/.test(sentence),
    "S dotáciou vieme pomôcť alebo asistovať podľa aktuálnych podmienok.",
  );
  next = applySanitizerRule(
    next,
    diagnostics,
    "subsidy_price_deduction_claim_sanitized",
    "odpočítanie dotácie z ceny",
    (sentence) => sentence.includes("dotac") && /(odpocit|odrat|odratame|znizime cenu)/.test(sentence),
    "Zohľadnenie dotácie v cene treba potvrdiť podľa konkrétneho prípadu.",
  );
  next = applySanitizerRule(
    next,
    diagnostics,
    "guarantee_claim_sanitized",
    "garantovanie bez posúdenia",
    (sentence) => /(garantujem|garantujeme|garantovat|garantovať)/.test(sentence) && !/(negarant|nemozem garant|neda sa garant)/.test(sentence),
    "Bez posúdenia domu, návrhu a aktuálnych podmienok by som negarantoval cenu, dotáciu, úsporu ani návratnosť.",
  );
  if (isNewBuildFloorHeating(state)) {
    next = applySanitizerRule(
      next,
      diagnostics,
      "new_build_annual_consumption_question_replaced",
      null,
      (sentence) => sentence.includes("rocna spotreba") || sentence.includes("rocnu spotrebu") || sentence.includes("spotrebu za rok"),
      "Pri novostavbe po základnej kvalifikácii prejdeme radšej na konzultáciu a nacenenie konkrétnych zostáv.",
    );
    next = applySanitizerRule(
      next,
      diagnostics,
      "new_build_closure_docs_question_replaced",
      null,
      (sentence) =>
        /(mas|máš|posli|pošli|dopl[nň]|treba|potrebujem|potrebujeme|overit|overiť|podla|podľa)/.test(sentence) &&
        /(projekt|energeticky certifikat|energetický certifikát|tepelna strata|tepelná strata|tepelnu stratu|tepelnú stratu)/.test(sentence),
      "Ďalší krok je krátka konzultácia alebo stretnutie, kde sa vyberú vhodné zostavy a pripraví sa nacenenie.",
    );
  }
  if (route.serviceIntent === "recommendation") {
    next = applySanitizerRule(
      next,
      diagnostics,
      "recommendation_budget_question_replaced",
      null,
      (sentence) => sentence.includes("rozpocet"),
      "Rozpočet by som riešil až pri cenovej ponuke; teraz je dôležitý správny technický smer.",
    );
  }
  if (route.serviceIntent === "brand_model") {
    next = applySanitizerRule(
      next,
      diagnostics,
      "brand_model_subsidy_removed",
      "dotácie pri otázke na model",
      (sentence) => sentence.includes("dotac"),
      "",
    );
  }
  if (route.serviceType === "heat_pump" || state.service_type === "heat_pump") {
    next = applySanitizerRule(
      next,
      diagnostics,
      "unsupported_heat_pump_brand_sanitized",
      "Daikin/Mitsubishi pri tepelných čerpadlách",
      (sentence) =>
        /(daikin|mitsubishi)/.test(sentence) &&
        /(ponuk|robime|montujeme|predavame|spolupracuje|portfol)/.test(sentence) &&
        !/(netvrd|bez potvrden|nie je|nespomin|skor pri klimatiz)/.test(sentence),
      "Pri tepelných čerpadlách viem bezpečne komunikovať NIBE a Vaillant; Daikin alebo Mitsubishi treba pri TČ potvrdiť podľa aktuálnej ponuky.",
    );
  }
  next = applySanitizerRule(
    next,
    diagnostics,
    "obsolete_f2040_claim_sanitized",
    "F2040 ako aktuálne odporúčaný model",
    (sentence) =>
      sentence.includes("f2040") &&
      /(odporuc|vhodn|ponuk|aktualn|najleps)/.test(sentence) &&
      !/(archiv|histor|nevyrab|neponuk|nemal|neodporuc|nahrad|treba potvrdit)/.test(sentence),
    "NIBE F2040 treba pri nových realizáciách brať ako neaktuálny alebo archívny podklad; aktuálny model treba potvrdiť podľa ponuky.",
  );
  next = applySanitizerRule(
    next,
    diagnostics,
    "unconfirmed_f2050_claim_sanitized",
    "F2050 bez potvrdeného firemného faktu",
    (sentence) =>
      sentence.includes("f2050") &&
      /(je|ponuk|odporuc|vhodn|parametr|vykon|ucinnost)/.test(sentence) &&
      !/(nemam potvrden|nie je potvrden|treba overit|nebudem|bez potvrden)/.test(sentence),
    "NIBE F2050 nemám potvrdený ako aktuálny model v firemnej pravde; dostupnosť a parametre treba overiť podľa aktuálnej ponuky.",
  );
  next = applySanitizerRule(
    next,
    diagnostics,
    "buffer_tank_included_claim_sanitized",
    "akumulačná nádrž zahrnutá v cene",
    (sentence) =>
      sentence.includes("akumulac") &&
      /(je v cene|v tej cene|zahrnuta|zahrnute|sucastou ceny|zapocitava)/.test(sentence) &&
      !/(neviem potvrdit|nie je bezpecne|ak je uveden|treba overit|nemusi byt)/.test(sentence),
    "Bez výslovnej položky v konkrétnej ponuke akumulačnú nádrž nepovažuj za zahrnutú súčasť rozsahu.",
  );
  if (state.own_wood) {
    next = applySanitizerRule(
      next,
      diagnostics,
      "own_wood_savings_claim_sanitized",
      "garantovaná ekonomická výhodnosť pri vlastnom dreve",
      (sentence) =>
        /(tepelne cerpadlo|cerpadlo)/.test(sentence) &&
        /(bude|je|urcite|garantovane)/.test(sentence) &&
        /(ekonomicky vyhodnejs|lacnejs|usetri|usporn)/.test(sentence),
      "Pri vlastnom dreve treba ekonomiku overiť podľa reálnej ceny dreva, práce okolo kúrenia, spotreby domu a ceny elektriny; hlavný prínos môže byť komfort a automatická prevádzka.",
    );
  }
  return softenOverconfidentWording(next, diagnostics).replace(/\n{3,}/g, "\n\n").trim();
}

function softenOverconfidentWording(answer: string, diagnostics?: AnswerDiagnostics): string {
  let next = answer
    .replace(/\bpresne\s+to,\s*čomu\s+sa\s+venujeme\b/gi, "práve tomu sa venujeme")
    .replace(/\bpresne\s+to,\s*comu\s+sa\s+venujeme\b/gi, "prave tomu sa venujeme")
    .replace(/\bpresn[eé]\s+podmienky\b/gi, "konkrétne podmienky")
    .replace(/\bpresn[aá]\s+cena\b/gi, "konkrétna cena")
    .replace(/\bpresn[uú]\s+cenu\b/gi, "konkrétnu cenu")
    .replace(/\bpresnej[šs]iu\s+cenov[uú]\b/gi, "konkrétnejšiu cenovú")
    .replace(/\bpresn[aá]\s+v[yý][šs]ka\b/gi, "konkrétna výška")
    .replace(/\bpresn[eé]\s+vy[čc][ií]slenie\b/gi, "konkrétne vyčíslenie")
    .replace(/\bpresn[eé]\s+odpor[uú][čc]anie\b/gi, "konkrétne odporúčanie")
    .replace(/\bpresn[yý]\s+n[aá]vrh\b/gi, "konkrétny návrh")
    .replace(/\bpresn[yý]\s+term[ií]n\b/gi, "konkrétny termín")
    .replace(/\bpresn[yý]\s+odhad\b/gi, "konkrétnejší odhad")
    .replace(/\bpresn[eé]\s+(u|ú)daje\b/gi, "konkrétne údaje")
    .replace(/\bpresn[eé]\s+inform[aá]cie\b/gi, "konkrétne informácie")
    .replace(/\bpresn[eé]\s+[čc][ií]sla\b/gi, "konkrétne čísla")
    .replace(/\bpresn[eé]\s+v[yý]po[čc]ty\b/gi, "konkrétne výpočty")
    .replace(/\bpresn[yý]\s+v[yý]po[čc]et\b/gi, "konkrétnejší výpočet")
    .replace(/\bpresne\s+vypo[čc][ií]ta[ťt]\b/gi, "zodpovedne vypočítať")
    .replace(/\bpresn[aá]\s+finan[čc]n[aá]\s+[uú]spora\b/gi, "konkrétna finančná úspora")
    .replace(/\bpresn[eé]ho\s+modelu\b/gi, "konkrétneho modelu")
    .replace(/\bpresn[eé]\s+zodpoveda[ťt]\b/gi, "zodpovedať")
    .replace(/\bnegarantujeme\b/gi, "nesľubujeme")
    .replace(/\bnegarantujem\b/gi, "nesľubujem")
    .replace(/\bnajlacnej[šs]ie\b/gi, "cenovo najdostupnejšie")
    .replace(/\bnajlacnej[šs][ií]\b/gi, "cenovo najdostupnejší")
    .replace(/\bje\s+to\s+ur[čc]ite\s+znak\b/gi, "je to vážny signál")
    .replace(/\bur[čc]ite\s+znak\b/gi, "vážny signál")
    .replace(/\burčite\b/gi, "vieme")
    .replace(/\burcite\b/gi, "vieme");
  next = next
    .replace(/\bpresn[eé]\b/gi, "konkrétne")
    .replace(/\bpresn[aá]\b/gi, "konkrétna")
    .replace(/\bpresn[yý]\b/gi, "konkrétny");
  if (next !== answer && diagnostics) recordDiagnostic(diagnostics.validatorsTriggered, "overconfident_wording_softened");
  return next;
}

function validateAndRepairAnswer(
  answer: string,
  state: QualificationState,
  route: Pick<ServiceRoute, "serviceType" | "serviceIntent">,
  message: string,
  diagnostics?: AnswerDiagnostics,
): string {
  let next = sanitizeAnswerForDiagnosticRules(answer, state, route, diagnostics);
  const normalizedMessage = normalizePolicyText(message);
  if (normalizedMessage.includes("nibe") && /hluc|hluk|tich/.test(normalizedMessage) && /\b\d{2,3}\s*dB/i.test(next)) {
    if (diagnostics) recordDiagnostic(diagnostics.validatorsTriggered, "unconfirmed_noise_numbers_repaired");
    next = [
      "### Hlučnosť NIBE",
      "",
      "Pri hlučnosti NIBE by som bez aktuálneho technického listu a konkrétneho modelu neuvádzal presné dB hodnoty. Hlučnosť závisí od modelu, výkonu, režimu, umiestnenia vonkajšej jednotky, vzdialenosti od okien a kvality montáže.",
      "",
      "Ak riešiš ticho pri dome, treba porovnať konkrétny model, umiestnenie jednotky a nočný režim. Ide o novú inštaláciu alebo už máš NIBE namontované?",
    ].join("\n");
  }
  if (normalizedMessage.includes("nibe") && normalizedMessage.includes("vaillant") && /(tich|hluk|nezerie|spotreb)/.test(normalizedMessage) && !next.includes("?")) {
    if (diagnostics) recordDiagnostic(diagnostics.validatorsTriggered, "nibe_vaillant_followup_repaired");
    next = companyPracticalDirectAnswer(message)?.answer || `${next}\n\nIde o novostavbu s podlahovkou alebo starší dom s radiátormi?`;
  }
  if (normalizedMessage.includes("nibe") && normalizedMessage.includes("vaillant") && !next.includes("?")) {
    if (diagnostics) recordDiagnostic(diagnostics.validatorsTriggered, "nibe_vaillant_context_followup_repaired");
    next = `${next}\n\nRiešiš servis existujúceho NIBE, výmenu za Vaillant, alebo nové nacenenie celého riešenia?`;
  }
  if (/(oprav|oprava|opravite).*(montaz)|(?:montaz).*(oprav|oprava|opravite)/.test(normalizedMessage) && !next.includes("?")) {
    if (diagnostics) recordDiagnostic(diagnostics.validatorsTriggered, "repair_or_installation_followup_repaired");
    next = companyPracticalDirectAnswer(message)?.answer || `${next}\n\nMáš už zariadenie, ktoré nefunguje, alebo ešte len vyberáš nové riešenie?`;
  }
  if (requiresInitialHeatPumpRecommendation(state, route, message)) {
    const normalized = normalizePolicyText(next);
    if (!normalized.includes("vzduch voda") || !normalized.includes("m2") || !/(radiator|podlah)/.test(normalized)) {
      if (diagnostics) recordDiagnostic(diagnostics.validatorsTriggered, "initial_heat_pump_recommendation_repaired");
      next = expectedInitialHeatPumpRecommendation();
    }
  }
  if (isNewBuildFloorHeating(state) && !state.occupants && state.wants_cooling === undefined) {
    const normalized = normalizePolicyText(next);
    if (!normalized.includes("osob") || !normalized.includes("chladen")) {
      if (diagnostics) recordDiagnostic(diagnostics.validatorsTriggered, "new_build_followup_repaired");
      next = expectedVerdictAnswer(state);
    }
  }
  if (isNewBuildFloorHeating(state) && state.occupants && !/(TÚV|TUV|tepl[áa] voda|zásobník|zasobnik)/i.test(next)) {
    if (diagnostics) recordDiagnostic(diagnostics.validatorsTriggered, "new_build_hot_water_repaired");
    next = expectedVerdictAnswer(state);
  }
  if (isNewBuildFloorHeating(state) && state.wants_cooling && !/(rosn|kondenz|limit|fancoil|stropn|klimatiz)/i.test(next)) {
    if (diagnostics) recordDiagnostic(diagnostics.validatorsTriggered, "new_build_cooling_caveat_repaired");
    next = expectedVerdictAnswer(state);
  }
  if (route.serviceType === "air_conditioning") {
    const normalized = normalizePolicyText(next);
    if (!/(multisplit|samostatn).*(jednot|klimatiz)/.test(normalized) || !/(vonkajsia jednotka|plocha|m2)/.test(normalized)) {
      if (diagnostics) recordDiagnostic(diagnostics.validatorsTriggered, "air_conditioning_verdict_repaired");
      next = expectedAirConditioningAnswer();
    }
  }
  if (route.serviceType === "heat_recovery") {
    const normalized = normalizePolicyText(next);
    if (!normalized.includes("rekuper") || !normalized.includes("projekt") || !/(cely dom|celý dom|miestnost)/.test(normalized)) {
      if (diagnostics) recordDiagnostic(diagnostics.validatorsTriggered, "heat_recovery_verdict_repaired");
      next = expectedHeatRecoveryAnswer();
    }
  }
  if (route.serviceIntent === "service_fault" && !isPracticalCompanyQuestionThatSkipsServiceFaultTemplate(message)) {
    const normalized = normalizePolicyText(next);
    if (!normalized.includes("model") || !/(chybovy kod|chybový kód|chybu|chyba)/.test(normalized) || !/(lokalit|mesto|kde je)/.test(normalized)) {
      if (diagnostics) recordDiagnostic(diagnostics.validatorsTriggered, "service_fault_data_request_repaired");
      next = expectedServiceFaultAnswer(message);
    }
  }
  if (route.serviceIntent === "price") {
    const normalized = normalizePolicyText(next);
    const normalizedMessage = normalizePolicyText(message);
    const asksInstalledPrice = /(vratane instalacie|vratane montaze|s instalaciou|s montazou|cena|ceny|kolko|stoji)/.test(normalizedMessage);
    const missesScope = asksInstalledPrice && (!normalized.includes("kompletn") || !(normalized.includes("montaz") || normalized.includes("instalac")));
    if (missesScope || answerIsGenericServiceFallback(next)) {
      if (diagnostics) recordDiagnostic(diagnostics.validatorsTriggered, "price_scope_repaired");
      next = priceDirectAnswer(message, state).answer || next;
    }
  }
  const existingRadiatorState = inferExistingRadiatorState(state, message, route.serviceType);
  if (requiresHardVerdict(state, route, message) && !answerHasRequiredVerdict(next, state)) {
    if (diagnostics) recordDiagnostic(diagnostics.validatorsTriggered, "hard_verdict_inserted");
    next =
      isNewBuildFloorHeating(state) || existingRadiatorState || answerIsGenericServiceFallback(next)
        ? expectedVerdictAnswer(existingRadiatorState || state)
        : `${expectedVerdictAnswer(state)}\n\n${next}`.trim();
  }
  if (existingRadiatorState && answerIsGenericServiceFallback(next)) {
    if (diagnostics) recordDiagnostic(diagnostics.validatorsTriggered, "existing_radiator_verdict_repaired");
    next = expectedVerdictAnswer(existingRadiatorState);
  }
  const complaint = /nepovedal|neodpovedal|najleps|konkretne/.test(normalizePolicyText(message));
  if (complaint && requiresHardVerdict(state, route, message) && state.occupants && !/(TÚV|TUV|tepl[áa] voda|zásobník|zasobnik)/i.test(next)) {
    if (diagnostics) recordDiagnostic(diagnostics.validatorsTriggered, "complaint_context_repaired");
    next = `${expectedVerdictAnswer(state)}\n\n${next}`.trim();
  }
  if (isExistingRadiatorSolidFuel(state) && state.annual_consumption_unknown) {
    const normalized = normalizePolicyText(next);
    if (!/(zateplen|akumulac|kolko dreva|dreva za sezon)/.test(normalized)) {
      if (diagnostics) recordDiagnostic(diagnostics.validatorsTriggered, "wood_replacement_followup_repaired");
      next = [
        next,
        "",
        "Pred finálnym návrhom by som ešte overil hlavne zateplenie domu, orientačné množstvo dreva za sezónu, akumulačnú nádrž a to, či má tepelné čerpadlo riešiť aj teplú vodu.",
      ].join("\n");
    }
  }
  return sanitizeAnswerForDiagnosticRules(next, state, route, diagnostics);
}

function rankRetrievalResultsForState(results: RetrievalResult[], state: QualificationState): RetrievalResult[] {
  if (!hasActiveDiagnosticState(state)) return results;
  const newBuildFloor = isNewBuildFloorHeating(state);
  const wantsCooling = state.wants_cooling === true;
  const boosted = results.map((result, index) => {
    const text = normalizePolicyText(`${result.chunk.slug} ${result.chunk.pageTitle} ${result.chunk.sectionHeading} ${result.chunk.text}`);
    let boost = 0;
    if (newBuildFloor) {
      if (/(scenar novostavba podlahove kurenie|service card heat pump|podlahove kurenie|nizkoteplot|vzduch voda)/.test(text)) boost += 160;
      if (/(starsi dom|radiator|radiatory|plyn|plynov)/.test(text)) boost -= 90;
    }
    if (wantsCooling && /(chladenie|stropne|fancoil|rosny bod|klimatizacia)/.test(text)) boost += 70;
    if (state.occupants && /(tuv|tepla voda|zasobnik|pocet osob)/.test(text)) boost += 40;
    return { result, score: result.score.finalScore + boost - index * 0.01 };
  });
  return boosted.sort((left, right) => right.score - left.score).map((item) => item.result);
}

async function extractQualificationUpdate(input: {
  userMessage: string;
  assistantAnswer: string;
  currentState: QualificationState;
  route?: Pick<ServiceRoute, "serviceType" | "serviceIntent">;
}): Promise<QualificationUpdate> {
  const deterministic = deterministicQualificationUpdate(input.userMessage, input.route);
  const systemPrompt =
    "Extract structured data from this conversation exchange. Return JSON only with ONLY the fields you are confident about based on what the user just said. Use null for unknown fields. Fields: service_type (heat_pump|air_conditioning|heat_recovery|floor_heating|ceiling_cooling|service|subsidy|complex_solution), service_intent (recommendation|price|quote|inspection|contact|service_fault|brand_model|location|subsidy|comparison|process|complaint_or_correction|general), project_type (novostavba|rekonštrukcia), property_type (rodinný dom|bungalov|byt|iné), area_m2 (number), location (string), timeline (string), current_heating (string), heating_distribution (radiátory|podlahové kúrenie), wants_cooling (boolean), hot_water (boolean), occupants (number), insulation (string), annual_consumption (string), annual_consumption_unknown (boolean), own_wood (boolean), project_available (boolean), heat_loss_known (boolean). Only extract what the user explicitly stated in their message.";

  try {
    const result = await callLlmText({
      systemPrompt,
      prompt: JSON.stringify({ userMessage: input.userMessage, assistantAnswer: input.assistantAnswer }),
      maxOutputTokens: 260,
      timeoutMs: 3000,
      responseMimeType: "application/json",
    });
    if (result.error || !result.content) throw new Error(result.error || "empty qualification extraction response");

    const trimmed = result.content.trim();
    const jsonStart = trimmed.indexOf("{");
    const jsonEnd = trimmed.lastIndexOf("}");
    if (jsonStart < 0 || jsonEnd < jsonStart) throw new Error("qualification extraction response had no JSON object");

    const parsed = JSON.parse(trimmed.slice(jsonStart, jsonEnd + 1)) as Record<string, unknown>;
    const update: QualificationUpdate = { ...deterministic };
    const readString = (field: string): string | undefined => {
      const value = parsed[field];
      return typeof value === "string" && value.trim() ? value.trim() : undefined;
    };

    const serviceType = normalizeServiceType(readString("service_type"), "unknown");
    if (serviceType !== "unknown") update.service_type = serviceType;
    const serviceIntent = normalizeServiceIntent(readString("service_intent"), "general");
    if (serviceIntent !== "general") update.service_intent = serviceIntent;
    const projectType = readString("project_type");
    if (projectType && ["novostavba", "rekonštrukcia"].includes(projectType)) update.project_type = projectType;
    const propertyType = readString("property_type");
    if (propertyType && ["rodinný dom", "bungalov", "byt", "iné"].includes(propertyType)) update.property_type = propertyType;
    const area = parsed.area_m2;
    if (typeof area === "number" && Number.isFinite(area)) update.area_m2 = area;
    const location = readString("location");
    if (location) update.location = location;
    const timeline = readString("timeline");
    if (timeline) update.timeline = timeline;
    const currentHeating = readString("current_heating");
    if (currentHeating) update.current_heating = currentHeating;
    const heatingDistribution = readString("heating_distribution");
    if (heatingDistribution) update.heating_distribution = heatingDistribution;
    const insulation = readString("insulation");
    if (insulation) update.insulation = insulation;
    const annualConsumption = readString("annual_consumption");
    if (annualConsumption) update.annual_consumption = annualConsumption;
    const occupants = parsed.occupants;
    if (typeof occupants === "number" && Number.isFinite(occupants)) update.occupants = occupants;
    for (const field of ["wants_cooling", "hot_water", "annual_consumption_unknown", "own_wood", "project_available", "heat_loss_known"] as const) {
      if (typeof parsed[field] === "boolean") update[field] = parsed[field];
    }
    return update;
  } catch (error) {
    if (!Object.keys(deterministic).length) {
      console.warn(`Qualification extraction skipped: ${error instanceof Error ? error.message : String(error)}`);
    }
    return deterministic;
  }
}

export async function createChatResponse(requestBody: ChatRequest, knowledgePath?: string): Promise<ChatResponse> {
  const responseStartedAt = Date.now();
  loadLocalEnv();

  const parseRouterResponse = (content: string | undefined): ServiceRoute => {
    const fixMojibake = (str: string): string => {
      try {
        const repaired = Buffer.from(str, "latin1").toString("utf8");
        const badChars = (value: string): number => (value.match(/�/g) || []).length;
        return badChars(repaired) < badChars(str) ? repaired : str;
      } catch {
        return str;
      }
    };
    if (!content) return { needsRetrieval: false, retrievalQuery: null, directAnswer: null, serviceType: "unknown", serviceIntent: "general" };
    const trimmed = content.trim();
    const jsonStart = trimmed.indexOf("{");
    const jsonEnd = trimmed.lastIndexOf("}");
    if (jsonStart < 0 || jsonEnd < jsonStart) return { needsRetrieval: false, retrievalQuery: null, directAnswer: null, serviceType: "unknown", serviceIntent: "general" };

    try {
      const parsed = JSON.parse(trimmed.slice(jsonStart, jsonEnd + 1)) as {
        needsRetrieval?: unknown;
        retrievalQuery?: unknown;
        directAnswer?: unknown;
        service_type?: unknown;
        serviceType?: unknown;
        intent?: unknown;
        service_intent?: unknown;
        serviceIntent?: unknown;
      };
      const needsRetrieval = parsed.needsRetrieval === true;
      const retrievalQuery =
        typeof parsed.retrievalQuery === "string" && parsed.retrievalQuery.trim() ? fixMojibake(parsed.retrievalQuery.trim()) : null;
      const directAnswer = typeof parsed.directAnswer === "string" && parsed.directAnswer.trim() ? parsed.directAnswer.trim() : null;
      return {
        needsRetrieval,
        retrievalQuery,
        directAnswer,
        serviceType: normalizeServiceType(parsed.service_type ?? parsed.serviceType, "unknown"),
        serviceIntent: normalizeServiceIntent(parsed.intent ?? parsed.service_intent ?? parsed.serviceIntent, "general"),
      };
    } catch {
      return { needsRetrieval: false, retrievalQuery: null, directAnswer: null, serviceType: "unknown", serviceIntent: "general" };
    }
  };

  const cleanAnswerText = (content: string | undefined): string => {
    const raw = (content || "").trim();
    const removeBannedPhrases = (value: string): string =>
      value
        .replace(/\+421\s*987\s*654\s*321/g, urgentServicePhone)
        .replace(/^#{1,6}\s*Stručne k otázke\s*\n*/gim, "")
        .replace(/\*\*Stručne k otázke:?\*\*\s*/gim, "")
        .replace(/\bStručne k otázke:?\s*/gim, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
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
        shortAnswer,
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
    return removeBannedPhrases(answer);
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
  const fallbackCompleteAnswer = (
    userMessage: string,
    state: QualificationState,
    currentRoute: Pick<ServiceRoute, "serviceType" | "serviceIntent">,
  ): string => {
    if (isGreetingOnlyMessage(userMessage)) {
      return "### Ahoj\n\nSom tu pre teba, keď chceš poradiť s tepelným čerpadlom, klimatizáciou, rekuperáciou, servisom alebo dotáciami.\n\nČo chceš riešiť ako prvé?";
    }
    const practicalFallback = companyPracticalDirectAnswer(userMessage);
    if (practicalFallback?.answer) return practicalFallback.answer;
    if (requiresHardVerdict(state, currentRoute, userMessage)) {
      return expectedVerdictAnswer(inferExistingRadiatorState(state, userMessage, currentRoute.serviceType) || state);
    }
    const normalized = normalizePolicyText(userMessage);
    const serviceType = normalizeServiceType(state.service_type || currentRoute.serviceType, "unknown");
    const serviceIntent = normalizeServiceIntent(state.service_intent || currentRoute.serviceIntent, "general");
    if (serviceType === "air_conditioning") {
      return [
        "### Predbežný smer",
        "",
        "Pri klimatizácii do viacerých miestností by som predbežne porovnal dve možnosti: viac samostatných jednotiek alebo multisplit. Dôvod je, že rozhoduje dispozícia, dĺžka rozvodov, hluk, servis a miesto pre vonkajšiu jednotku.",
        "",
        "Typicky sa overuje plocha miestností, orientácia na slnko a kde môže byť vonkajšia jednotka.",
        "",
        "Koľko m² má obývačka a spálňa a kam by sa dala dať vonkajšia jednotka?",
      ].join("\n");
    }
    if (serviceType === "heat_recovery") {
      return [
        "### Predbežný smer",
        "",
        "Ak staviaš dom a chceš lepší vzduch bez otvárania okien, predbežne dáva zmysel riešiť rekuperáciu už v projekte. Pri novostavbe sa dá najčistejšie navrhnúť centrálna jednotka s rozvodmi pre celý dom.",
        "",
        "Treba ešte overiť dispozíciu, technickú miestnosť a či chceš vetrať celý dom alebo len vybrané priestory.",
        "",
        "Máš už projekt a chceš riešiť rekuperáciu pre celý dom?",
      ].join("\n");
    }
    if (serviceIntent === "service_fault") {
      return [
        "### Servisný smer",
        "",
        "Pri poruche je najdôležitejšie najprv identifikovať zariadenie a chybu, nie radiť zásahy do jednotky. Všeobecne treba preveriť značku, model, chybový kód a lokalitu; pri cudzej montáži sa dostupnosť servisu musí potvrdiť podľa značky a prípadu.",
        "",
        "Pošli mi prosím značku/model alebo fotku štítku a chybový kód z displeja.",
      ].join("\n");
    }
    if (serviceType === "service") {
      return [
        "### Servis",
        "",
        "Ak sa pýtaš všeobecne na servis, najprv treba rozlíšiť, či ide o pravidelnú údržbu, diagnostiku poruchy alebo servis po montáži. Bez poruchy by som to nebral automaticky ako havarijný zásah.",
        "",
        "Daj mi prosím značku zariadenia a či riešiš pravidelný servis, poruchu alebo kontrolu nastavenia.",
      ].join("\n");
    }
    if (serviceType === "subsidy" || serviceIntent === "subsidy") {
      return [
        "### Dotácie",
        "",
        "Pri dotáciách treba rozlišovať všeobecné pravidlá programu a konkrétne firemné podmienky. Bez aktuálneho potvrdenia by som nesľuboval kompletné vybavenie ani odpočítanie dotácie z ceny, ale s dotáciou sa dá zvyčajne pomôcť alebo zákazníka nasmerovať.",
        "",
        "Riešiš rodinný dom a nové zariadenie, alebo výmenu existujúceho zdroja?",
      ].join("\n");
    }
    if (
      serviceType === "heat_pump" &&
      normalizePolicyText(state.project_type || "").includes("novostav") &&
      state.area_m2 &&
      !state.heating_distribution
    ) {
      return [
        "### Tepelné čerpadlo pre novostavbu",
        "",
        `Pri novostavbe s plochou cca ${state.area_m2} m² by som predbežne smeroval k tepelnému čerpadlu **vzduch-voda**, najmä ak pôjde o nízkoteplotné vykurovanie.`,
        "",
        "Aby som to uzavrel správne, stačí doplniť: bude tam podlahové kúrenie alebo radiátory? A chceš riešiť aj chladenie alebo len kúrenie a TÚV?",
      ].join("\n");
    }
    const existingRadiatorState = inferExistingRadiatorState(state, userMessage, currentRoute.serviceType);
    if (serviceType === "heat_pump" && existingRadiatorState) {
      return expectedVerdictAnswer(existingRadiatorState);
    }
    if (serviceType === "heat_pump" && isExistingRadiatorHeatPump(state)) {
      return [
        "### Predbežný smer pre starší dom s radiátormi",
        "",
        "Pri staršom dome s radiátormi dáva predbežne zmysel tepelné čerpadlo **vzduch-voda vhodné pre radiátorový systém**. Dôvod je, že vzduch-voda je pri rekonštrukciách najčastejší smer, ale pri radiátoroch treba overiť potrebnú teplotu vody a výkon radiátorov.",
        "",
        "Typicky by sa riešil výkon tepelného čerpadla, hydraulické zapojenie, regulácia, príprava teplej vody a podľa kotolne aj akumulačná nádrž.",
        "",
        "Doplň mi ešte aktuálny zdroj tepla a približnú plochu domu, ak ju vieš.",
      ].join("\n");
    }
    if (/(cena|stoji|stojí|kolko|koľko|rozpocet|rozpočet)/.test(normalized)) {
      return [
        "### Predbežný smer k cene",
        "",
        "Pri cene treba rozlíšiť samotné zariadenie a kompletnú realizáciu. Typicky do nej vstupuje výkon, montáž, materiál, regulácia, ohrev teplej vody, prípadná akumulačná nádrž, elektropráce a uvedenie do prevádzky.",
        "",
        "Aby bola cena reálnejšia, stačí mi zatiaľ plocha domu a či máš radiátory alebo podlahové kúrenie.",
      ].join("\n");
    }
    if (/(servis|oprava|porucha|chyba)/.test(normalized)) {
      return [
        "### Servisný smer",
        "",
        "Pri poruche by som najprv nerobil žiadny zásah do zariadenia. Potrebné je zistiť značku, model, chybový kód a lokalitu; pri zariadení montovanom inou firmou treba servis potvrdiť podľa značky a dostupnosti.",
        "",
        "Aký model alebo fotku štítku vieš poslať a aký chybový kód sa zobrazuje?",
      ].join("\n");
    }
    if (/(mesto|okres|prist|prísť|chodite|chodíte|vyjazd|výjazd)/.test(normalized)) {
      return [
        "### Lokalita",
        "",
        "Pri dostupnosti treba rozlišovať montáž, servis a prípadný výjazd. Všeobecne sa dá technický smer určiť aj bez lokality, ale či firma príde do konkrétneho mesta treba potvrdiť podľa aktuálnej pôsobnosti.",
        "",
        "O aké mesto a službu ide: montáž, servis alebo obhliadka?",
      ].join("\n");
    }
    return [
      "### Predbežný smer",
      "",
      "Podľa toho, čo píšeš, by som najprv určil vhodnú službu a technický scenár, potom až konkrétnu značku, cenu alebo termín. Ak chýba presný firemný fakt, dá sa stále povedať všeobecný technický smer, ale firemné podmienky treba potvrdiť.",
      "",
      "Riešiš kúrenie, chladenie, vetranie, servis alebo dotáciu?",
    ].join("\n");
  };
  const shouldPreferTable = (userMessage: string): boolean => {
    const text = normalizePolicyText(userMessage);
    return [
      "ake predavate",
      "ake mate",
      "ake typy",
      "ake tc",
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
    const removeBannedPhrases = (value: string): string =>
      value
        .replace(/^#{1,6}\s*Stručne k otázke\s*\n*/gim, "")
        .replace(/\*\*Stručne k otázke:?\*\*\s*/gim, "")
        .replace(/\bStručne k otázke:?\s*/gim, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
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
    answer = removeBannedPhrases(answer);
    if (!shouldPreferTable(userMessage) || /\|.+\|\s*\r?\n\s*\|[-:\s|]+\|/.test(answer)) return removeBannedPhrases(limitAnswerLength(compactOversizedTables(answer)));

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
    if (rows.length < 2 || first < 0 || last < first) return removeBannedPhrases(answer);

    const table = [
      "| Možnosť | Čo to znamená |",
      "|---|---|",
      ...rows.slice(0, 4).map((row) => `| **${shortenCell(row.label, 42)}** | ${shortenCell(row.text.replace(/\|/g, "/"), 150)} |`),
    ];
    return removeBannedPhrases(limitAnswerLength(compactOversizedTables([...lines.slice(0, first), ...table, ...lines.slice(last + 1)].join("\n").replace(/\n{3,}/g, "\n\n").trim())));
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
      "Pri elektrike, zápachu, skratu alebo kábloch použi jasne slová: bezpečnosť, odborný servis, odborná montáž. Nepíš „určite“, „garantujem“ ani technický návod.",
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
    let safetyWithPhone = safetyCandidate.includes(urgentServicePhone)
      ? safetyCandidate
      : `${safetyCandidate}\n\n**Urgentný kontakt:** ${urgentServicePhone}`;
    safetyWithPhone = safetyWithPhone.replace(/\burčite\b/gi, "vážny").replace(/\burcite\b/gi, "vážny");
    if (!/(bezpečnosť|bezpecnost|odborný servis|odborny servis|odborná montáž|odborna montaz|servis)/i.test(safetyWithPhone)) {
      safetyWithPhone = `${safetyWithPhone}\n\nKvôli bezpečnosti to ber ako vec pre odborný servis alebo odbornú montáž, nie svojpomocný zásah.`;
    }
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
        rawUserMessage: message,
        normalizedUserMessage: normalizePolicyText(message),
        newlyExtractedSlots: {},
        inferredFromLastQuestion: false,
        serviceType: "service",
        serviceIntent: "service_fault",
        legacyIntent: safetyRoute.intent,
        diagnosticFlowVersion,
        serverCommit: serverCommit(),
        retrievalSourcesCount: 0,
        contextCarried: false,
        fallbackUsed: !safetyLlmUsed,
        fallbackType: safetyLlmUsed ? null : "safety_hardcoded",
        validatorsTriggered: safetyLlmUsed ? [] : ["safety_fallback"],
        bannedClaimsRemoved: [],
        questionRoundsCount: countQualificationQuestionRounds(previousMessages),
        closureGateTriggered: false,
        closureReason: null,
        recommendationOptions: [],
        remainingCriticalUnknowns: [],
      },
      action: null,
      fallbackUsed: !safetyLlmUsed,
      responseTimeMs: Date.now() - responseStartedAt,
    };
  }

  const routerSystemPrompt = [
    "You are the service router before RAG for a Slovak Geotherm sales chatbot.",
    "Return JSON only: { service_type: string, intent: string, needsRetrieval: boolean, retrievalQuery: string | null, directAnswer: string | null }",
    "",
    "service_type enum:",
    "- heat_pump",
    "- air_conditioning",
    "- heat_recovery",
    "- floor_heating",
    "- ceiling_cooling",
    "- service",
    "- subsidy",
    "- complex_solution",
    "- unknown",
    "",
    "intent enum:",
    "- recommendation",
    "- price",
    "- service_fault",
    "- brand_model",
    "- location",
    "- subsidy",
    "- comparison",
    "- process",
    "- quote",
    "- inspection",
    "- contact",
    "- complaint_or_correction",
    "- general",
    "",
    "First decide what service the customer is really discussing. Do not assume every vague message is only heat pumps.",
    "Map human wording: úsporné kúrenie or čím nahradiť plyn -> heat_pump; klíma/chladiť miestnosť -> air_conditioning; lepší vzduch/vetrať bez okien -> heat_recovery; stropné chladenie -> ceiling_cooling; servis/porucha/chyba -> service; dotácia -> subsidy; novostavba + kúrenie/chladenie/vetranie/teplá voda -> complex_solution.",
    "",
    "needsRetrieval = true when the answer needs company facts or service operating manual: products, services, brands, models, price, installation, process, timeline, subsidies, service, fault, locations, contact, company identity, comparisons, or any recommendation about heating/cooling/ventilation.",
    "needsRetrieval = false only for pure greetings, personal data only, or fully general conversation that does not need company/service facts.",
    "",
    "If the latest user message is a short answer to your own previous question, infer service_type and intent from conversation history and current qualification state. If retrieval is needed, retrievalQuery must be standalone and include the relevant prior context, not only the short answer.",
    "For city/location availability questions, use a stable query about Geotherm service area, districts and where they come to install/service, not the city name alone.",
    "For heat pump, price, model, efficiency or installation questions, do not add the company name Geotherm unless the user asks about contact, company, creator, or service area.",
    "directAnswer: normally null. If needsRetrieval=false, you may write one short Slovak answer, but the answer composer will still be called.",
  ].join("\n");
  const routerInput = JSON.stringify(
    {
      messages: [
        ...previousMessages.slice(-6).map((item) => ({ role: item.role, content: item.content })),
        { role: "user", content: message },
      ],
      currentQualificationState: previousState,
    },
    null,
    2,
  );
  let routerLlm = await callLlmText({
    systemPrompt: routerSystemPrompt,
    prompt: routerInput,
    maxOutputTokens: 240,
    timeoutMs: Math.min(Number.parseInt(process.env.LLM_ROUTER_TIMEOUT_MS || "1200", 10), 1200),
    responseMimeType: "application/json",
  });
  const deterministicRoute = inferServiceRoute(message, previousState, previousMessages);
  const route = parseRouterResponse(routerLlm.content);
  route.serviceType = route.serviceType === "unknown" ? deterministicRoute.serviceType : route.serviceType;
  route.serviceIntent = route.serviceIntent === "general" ? deterministicRoute.serviceIntent : route.serviceIntent;
  if (deterministicRoute.serviceIntent === "service_fault") {
    route.serviceType = "service";
    route.serviceIntent = "service_fault";
  }
  const immediateQualificationUpdate = deterministicTurnQualificationUpdate(message, previousState, previousMessages, route);
  let stateForTurn = mergeQualificationState(previousState, immediateQualificationUpdate);
  stateForTurn = mergeQualificationState(stateForTurn, {
    service_type: route.serviceType !== "unknown" ? route.serviceType : undefined,
    service_intent: route.serviceIntent !== "general" ? route.serviceIntent : undefined,
  });
  const routerFallbackText = normalizePolicyText(message);
  const currentMessagePolicy = classifyAnswerPolicy(message, "unknown");
  const explicitOutOfScopeTopicSwitch =
    currentMessagePolicy.kind === "out_of_scope" ||
    currentMessagePolicy.kind === "adversarial" ||
    /\b(etf|bitcoin|hypotek|praha|prahe)\b/.test(routerFallbackText) ||
    /(investovat|investicia|akcie|akcii)/.test(routerFallbackText);
  const explicitOutdoorUnitQuestion = /(vonkajs|vonkajsi|vonkajsej).*(jednotk)|pod oknom|umiestnenie jednotky/.test(routerFallbackText);
  if (
    deterministicRoute.serviceType === "heat_pump" &&
    normalizeServiceType(previousState.service_type, "unknown") === "heat_pump" &&
    /(cerpadl|tepel|\btc\b)/.test(routerFallbackText)
  ) {
    route.serviceType = "heat_pump";
  }
  const contextualSlotReply =
    hasActiveDiagnosticState(stateForTurn) &&
    !isServiceAreaQuestion(message) &&
    (isShortContextReply(message) ||
      /^(?:[a-z\s-]+,\s*)?(?:nemam|nemám|neviem)\s+(?:odhad|tepelnu stratu|tepelnú stratu)/i.test(message.trim()) ||
      /^[A-ZÁÄČĎÉÍĽĹŇÓÔŔŠŤÚÝŽ][\p{L}\s-]{2,},\s*/u.test(message.trim()));
  const previousServiceType = normalizeServiceType(previousState.service_type, "unknown");
  const previousServiceIntent = normalizeServiceIntent(previousState.service_intent, "general");
  const complaintAboutRecommendation = /(nepovedal|neodpovedal|najleps|najlepší|konkretne|konkrétne)/.test(routerFallbackText);
  const subsidyContextReply =
    previousServiceType === "subsidy" &&
    !isContactQuestion(message) &&
    /(rodinn|dom|vymen|vymena|plyn|plynov|kotol|cerpadl|tepelne|pomoc|pomoct|prever|podmien)/.test(routerFallbackText);
  const latestQuestionOverridesContext =
    explicitOutOfScopeTopicSwitch ||
    isContactQuestion(message) ||
    explicitOutdoorUnitQuestion ||
    /(dotac|poukazk|prispevok|cena|cenu|kolko|koľko|stoji|stojí|montaz|montáž|realizacia|realizácia|podorys|pôdorys|spustenie|dokumentac|zaruk|záruk|rozdiel|porovn)/.test(routerFallbackText);
  const pureSmallTalkTurn = isPureSmallTalkMessage(message);

  if (pureSmallTalkTurn) {
    route.serviceType = "unknown";
    route.serviceIntent = "general";
    route.needsRetrieval = false;
    route.retrievalQuery = null;
    route.directAnswer = null;
  } else if (explicitOutOfScopeTopicSwitch && !isContactQuestion(message)) {
    route.serviceType = "unknown";
    route.serviceIntent = "general";
    route.needsRetrieval = false;
    route.retrievalQuery = null;
    route.directAnswer = null;
    stateForTurn = {
      ...stateForTurn,
      service_type: undefined,
      service_intent: undefined,
    };
  } else if (isContactQuestion(message)) {
    route.serviceType = "unknown";
    route.serviceIntent = "contact";
    route.needsRetrieval = true;
    route.retrievalQuery = "company-truth kontakt Geotherm telefon email adresa";
    route.directAnswer = null;
  } else if (latestQuestionOverridesContext) {
    if (deterministicRoute.serviceType !== "unknown") route.serviceType = deterministicRoute.serviceType;
    else if (route.serviceType === "service" && previousServiceType !== "service" && previousServiceType !== "unknown") route.serviceType = previousServiceType;
    if (deterministicRoute.serviceIntent !== "general") route.serviceIntent = deterministicRoute.serviceIntent;
  }
  if (explicitOutdoorUnitQuestion) {
    route.serviceType = "heat_pump";
    route.serviceIntent = "process";
    route.needsRetrieval = true;
    route.retrievalQuery = "tepelné čerpadlo vzduch-voda umiestnenie vonkajšej jednotky pod oknom hlučnosť odstupy servisný prístup";
    route.directAnswer = null;
  }

  if (previousServiceType === "heat_pump" && isQualificationDataReply(message)) {
    route.serviceType = "heat_pump";
    if (route.serviceIntent === "general" || route.serviceIntent === "brand_model") route.serviceIntent = "recommendation";
  }
  if (subsidyContextReply) {
    route.serviceType = "subsidy";
    route.serviceIntent = "subsidy";
    route.needsRetrieval = true;
    route.retrievalQuery = `service-card-subsidy dotacie podmienky asistencia ${message}`;
    route.directAnswer = null;
    stateForTurn = {
      ...stateForTurn,
      service_type: "subsidy",
      service_intent: "subsidy",
    };
  }
  if (contextualSlotReply && previousServiceType !== "unknown") {
    route.serviceType = previousServiceType;
  }
  if (contextualSlotReply && previousServiceIntent !== "general" && (route.serviceIntent === "location" || route.serviceIntent === "general")) {
    route.serviceIntent = previousServiceIntent;
  }
  if (complaintAboutRecommendation && previousServiceType !== "unknown") {
    route.serviceType = previousServiceType;
    route.serviceIntent = "recommendation";
  }
  if (
    isQualificationDataReply(message) &&
    (previousServiceType === "heat_pump" || route.serviceType === "heat_pump") &&
    (previousServiceIntent === "brand_model" || route.serviceIntent === "brand_model")
  ) {
    route.serviceType = "heat_pump";
    route.serviceIntent = "recommendation";
    stateForTurn = {
      ...stateForTurn,
      service_type: "heat_pump",
      service_intent: "recommendation",
    };
  }
  if (
    routerLlm.error &&
    /(nibe|vaillant|viessmann|ariston|daikin|\btc\b|tepelne|cerpadlo|cerpadla|servis|dotacie|dotacia|cena|cennik|hluk|hlucnost|montaz|instalacia|kontakt|klimatizacia|rekuperacia|podlahov|stropne|chladenie|kurenie|vykurovanie|geberit|\bwc\b|poter|katex|fotovolt|solarn|vysavac|vrt|kotol|platb|faktur|whatsapp|poisten|certifik|dokumentac|zaruk|referenc)/.test(routerFallbackText)
  ) {
    route.needsRetrieval = true;
    route.retrievalQuery = message;
    route.directAnswer = null;
  }
  const isObviousGreeting = /^(ahoj|čau|cau|hello|hi|hey|dobrý deň|dobry den|zdravím|zdravim)$/i.test(message.trim());
  const activeDiagnosticState = hasActiveDiagnosticState(stateForTurn);
  const obviousHvacContext =
    /(dom|m2|radiator|radiatory|podlahov|plyn|plynov|kotol|kuren|kurit|vykurov|\btc\b|cerpadl|tepelne|novostav|rekonstruk|starsi|spotreb|zateplen|cena|ponuka|montaz|servis|dotac|chladen|klimatiz|rekuper|vetran|strop|znack|model|geberit|\bwc\b|poter|katex|fotovolt|solarn|vysavac|vrt|rozvod|voda|platb|faktur|whatsapp|poisten|certifik|dokumentac|zaruk|referenc|posobnost|okres)/.test(
      routerFallbackText,
    );
  if (
    !isObviousGreeting &&
    !isPersonalDataOnly(message) &&
    (obviousHvacContext || route.serviceType !== "unknown" || route.serviceIntent !== "general") &&
    currentMessagePolicy.kind !== "out_of_scope" &&
    currentMessagePolicy.kind !== "adversarial" &&
    !route.needsRetrieval
  ) {
    route.needsRetrieval = true;
    route.retrievalQuery = message;
    route.directAnswer = null;
  }
  if (
    !isObviousGreeting &&
    !pureSmallTalkTurn &&
    !isPersonalDataOnly(message) &&
    activeDiagnosticState &&
    currentMessagePolicy.kind !== "out_of_scope" &&
    currentMessagePolicy.kind !== "adversarial" &&
    !route.needsRetrieval
  ) {
    route.needsRetrieval = true;
    route.retrievalQuery = message;
    route.directAnswer = null;
  }
  if (!pureSmallTalkTurn && isShortContextReply(message) && route.serviceType !== "unknown" && !route.needsRetrieval) {
    route.needsRetrieval = true;
    route.retrievalQuery = message;
    route.directAnswer = null;
  }
  const directDecision = explicitOutOfScopeTopicSwitch
    ? {
        triggered: false,
        answerMode: "direct_answer" as AnswerMode,
        reason: null,
        answer: null,
        serviceIntent: null,
        retrievalQuery: null,
        topic: null,
      }
    : directAnswerDecision(message, stateForTurn, route);
  if (directDecision.triggered) {
    route.needsRetrieval = true;
    route.retrievalQuery = directDecision.retrievalQuery || route.retrievalQuery || message;
    route.directAnswer = directDecision.answer;
    if (directDecision.serviceIntent) route.serviceIntent = directDecision.serviceIntent;
    if (
      directDecision.topic &&
      /^(F2040_obsolete|F2050|NIBE|Vaillant|heat_pump_brands|nibe_vaillant_comparison|nibe_noise_scope|ivt_nordic_inverter_scope)$/.test(
        directDecision.topic,
      )
    ) {
      route.serviceType = "heat_pump";
    }
    stateForTurn = {
      ...stateForTurn,
      ...(route.serviceType !== "unknown" ? { service_type: route.serviceType } : {}),
      ...(directDecision.serviceIntent ? { service_intent: directDecision.serviceIntent } : {}),
      ...(directDecision.topic ? { last_direct_topic: directDecision.topic } : {}),
      ...(directDecision.answerMode === "price_answer" && directDecision.topic ? { last_price_topic: directDecision.topic } : {}),
      ...(directDecision.answerMode === "brand_model_answer" && directDecision.topic ? { last_brand_model_topic: directDecision.topic } : {}),
    };
  }
  const questionRoundsCount = countQualificationQuestionRounds(previousMessages);
  stateForTurn = {
    ...stateForTurn,
    qualification_question_rounds: questionRoundsCount,
  };
  const closureDecision = directDecision.triggered
    ? { triggered: false, reason: null, options: [], remainingCriticalUnknowns: [] }
    : recommendationClosureDecision(stateForTurn, route, questionRoundsCount);
  const serviceAreaQuestion = isServiceAreaQuestion(message);
  const contextualRetrieval = directDecision.triggered
    ? { query: route.retrievalQuery || message, contextCarried: false }
    : route.needsRetrieval
    ? buildContextualRetrievalQuery({ message, route, state: stateForTurn, previousMessages })
    : { query: "", contextCarried: false };
  const retrievalQuery = route.needsRetrieval ? contextualRetrieval.query || route.retrievalQuery || message : null;
  const inferredFromLastQuestion = Boolean(contextualSlotReply || (isShortContextReply(message) && hasActiveDiagnosticState(previousState)));
  const answerDiagnostics: AnswerDiagnostics = {
    validatorsTriggered: [],
    bannedClaimsRemoved: [],
    fallbackType: null,
  };
  if (directDecision.triggered) {
    recordDiagnostic(answerDiagnostics.validatorsTriggered, "direct_answer_gate_used");
    recordDiagnostic(answerDiagnostics.validatorsTriggered, "latest_direct_question_answered");
  }

  let sources: ChatSource[] = [];
  let topScore = 0;
  let ragContext = "";

  if (route.needsRetrieval && retrievalQuery) {
    const knowledge = await loadKnowledge(knowledgePath);
    const retrieval = retrieveKnowledge(knowledge, retrievalQuery, 5);
    const topResults = rankRetrievalResultsForState(retrieval.results, stateForTurn).slice(0, 5);
    topScore = topResults[0]?.score.finalScore ?? 0;
    sources = topResults.slice(0, 3).map(sourceFromResult);
    const ragSnippetLimit = serviceAreaQuestion ? 2400 : 1200;
    ragContext = topResults
      .map((result, index) =>
        [
          `SOURCE ${index + 1}`,
          `Title: ${result.chunk.pageTitle}`,
          `Section: ${result.chunk.sectionHeading}`,
          `URL: ${result.chunk.url}`,
          `Text: ${(result.snippet || result.chunk.text).replace(/\s+/g, " ").slice(0, ragSnippetLimit)}`,
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
      payload: { query: retrievalQuery, topScore, results: sources.length, serviceType: route.serviceType, serviceIntent: route.serviceIntent, contextCarried: contextualRetrieval.contextCarried },
    });
  }

  const ragEvidenceStatus = route.needsRetrieval
    ? sources.length > 0 && topScore >= 25
      ? "RAG_FOUND"
      : "RAG_WEAK_OR_EMPTY"
    : "NO_RAG_REQUESTED";
  const directAnswerComposerInstruction = directDecision.triggered
    ? [
        "Direct answer gate je aktívny. Toto je len plán a bezpečnostné obmedzenie, nie hotová odpoveď. Finálnu odpoveď musíš napísať vlastnými slovami ako AI poradca.",
        "Najprv odpovedz priamo na poslednú otázku používateľa. Ak otázka nestačí na výber konkrétneho riešenia, po priamej odpovedi polož najviac 1-2 follow-up otázky.",
        "V direct odpovedi nikdy nepolož viac ako 2 otázniky. Pri otázke typu „aké TČ máte?“ odpovedz na portfólio a potom polož jednu kombinovanú follow-up otázku, či chce používateľ vybrať riešenie pre konkrétny dom a či ide o novostavbu/starší dom s radiátormi/podlahovkou.",
        "Neopakuj mechanicky rovnaký text ako v predchádzajúcej odpovedi. Ak používateľ poslal iba otáznik alebo nerozumie, stručne vysvetli predchádzajúcu odpoveď a ponúkni ďalší krok.",
        "Dodrž firemné fakty z RAGu: značky, modely, ceny a rozsah ponuky netvrď bez potvrdenia.",
        JSON.stringify(
          {
            answerMode: directDecision.answerMode,
            reason: directDecision.reason,
            topic: directDecision.topic,
            safeAnswerDraft: directDecision.answer,
          },
          null,
          2,
        ),
      ].join("\n")
    : "Direct answer gate: inactive.";
  const composerSystemPrompt = [
    "Si diagnostický technicko-obchodný poradca Geotherm. Firma rieši viac služieb: tepelné čerpadlá, klimatizácie, rekuperáciu, podlahové kúrenie, stropné chladenie, servis, dotácie a komplexné technické riešenia domu. Píšeš po slovensky, prirodzene, s tykaním.",
    "",
    "Nie si FAQ ani produktový katalóg. Najprv pracuj so service_type a intentom, potom použi pipeline danej služby. Ak zákazník nepovie presnú službu, odhadni cieľ: kúrenie, chladenie, vetranie, servis, dotácia alebo celé riešenie domu.",
    "",
    "Hierarchia odpovede: 1. firemná pravda z RAGu pre značky, služby, ceny, pôsobnosť, servis, dotácie, obhliadky, záruky a interné pravidlá; 2. konverzačný stav a uložené sloty; 3. všeobecné odborné uvažovanie AI; 4. diagnostická otázka; 5. obchodný ďalší krok.",
    "",
    "RAG nie je gatekeeper. Ak RAG chýba alebo je slabý, stále odpovedz všeobecne odborne podľa technickej logiky. Chýbajúci firemný fakt má len zabrániť tomu, aby si sľuboval konkrétnu firemnú cenu, značku, pôsobnosť, servis alebo dotáciu.",
    "",
    "Univerzálny pipeline: 1. rozpoznaj službu, 2. rozpoznaj zámer, 3. skontroluj minimum údajov, 4. daj predbežný verdikt, 5. vysvetli dôvod, 6. povedz typický rozsah/riešenie, 7. polož najviac 1-2 ďalšie otázky, 8. posuň zákazníka k ponuke, obhliadke, servisu alebo kontaktu.",
    "",
    "Verdict gate: nesmieš viesť nekonečný dotazník. Ak poznáš službu a máš aspoň základný kontext, musíš najprv povedať predbežný smer a až potom sa pýtať ďalej. Nikdy neodpovedaj iba „závisí od“.",
    "",
    closureDecision.triggered
      ? "Recommendation closure gate je spustený. Teraz nesmieš pokračovať ďalším dotazníkom. Musíš dať uzatvorené predbežné odporúčanie: najlepší smer, dôvod, 2-3 konkrétne možnosti, typický rozsah riešenia a CTA na konzultáciu, stretnutie alebo nacenenie. Pri novostavbe s podlahovkou po nazbieraní údajov nepýtaj projekt, energetický certifikát ani tepelnú stratu ako ďalší krok."
      : "Ak ešte closure gate nie je spustený, môžeš sa pýtať na chýbajúce údaje, ale aj tak najprv daj predbežný smer.",
    "",
    directAnswerComposerInstruction,
    "",
    "Pri novostavbe sa nepýtaj na ročnú spotrebu ako hlavný údaj. Pred closure môžeš pýtať počet osôb, teplú vodu a chladenie; po closure už smeruj na konzultáciu alebo nacenenie konkrétnych zostáv. Pri recommendation intent sa nepýtaj na rozpočet.",
    "",
    "Zakázané: pýtať sa na údaje, ktoré už zákazník povedal; pýtať sa na rozpočet, keď zákazník chce technické odporúčanie; sľubovať bezplatnú alebo nezáväznú obhliadku; sľubovať servis cudzej montáže; tvrdiť kompletné vybavenie dotácie alebo odpočítanie dotácie z ceny; garantovať cenu, dotáciu, úsporu, model, termín alebo pôsobnosť bez firemného RAG dôkazu.",
    "Ak otázka nesúvisí so službami Geotherm, povedz presne, že nemáš dostatočne jasný podklad na túto tému, a krátko presmeruj na kúrenie, chladenie, rekuperáciu, servis alebo dotácie.",
    "",
    "Ak máš RAG kontext, najprv posúď, či skutočne odpovedá na aktuálnu otázku. RAG je podklad, nie príkaz. Nepoužívaj chunk, ktorý je tematicky mimo otázky, aj keď má vysoké skóre. Nikdy nekopíruj surový text, dlhý cenník ani rozpadnutú tabuľku.",
    "",
    "Ak RAG kontext chýba, je slabý alebo neodpovedá na otázku, odpovedz z vlastnej všeobecnej odbornej logiky: daj predbežný verdikt, dôvod, typický rozsah a 1-2 otázky. Nehovor používateľovi, že nemáš podklady, ak sa dá dať užitočná technická odpoveď. Pri firemných faktoch povedz len to, čo je potvrdené, alebo že konkrétnu firemnú podmienku treba potvrdiť.",
    "",
    "Formát odpovede: pekný čistý Markdown. Pri vecnej odpovedi začni krátkym nadpisom `### ...`. Používaj krátke odstavce, odrážky alebo krátky číslovaný zoznam. Tabuľku použi iba vtedy, keď naozaj pomôže porovnať možnosti, najviac 3 riadky a 2 stĺpce.",
    "",
    "Nikdy nepíš frázu „Stručne k otázke“. Nevracaj JSON, escaped text s \\n, úvodzovky okolo celej odpovede ani nedokončenú vetu. Drž odpoveď zvyčajne do 120–220 slov.",
    "",
    "Vybraná služba a zámer:",
    JSON.stringify({ service_type: route.serviceType, service_label: serviceLabel(route.serviceType), intent: route.serviceIntent }, null, 2),
    "",
    "Service operating manual pre túto odpoveď:",
    serviceCardSummary(route.serviceType),
    "",
    "Čo vieš o tomto používateľovi:",
    JSON.stringify(stateForTurn, null, 2),
    "",
    "Recommendation closure gate:",
    JSON.stringify(
      {
        triggered: closureDecision.triggered,
        reason: closureDecision.reason,
        questionRoundsCount,
        recommendationOptions: closureDecision.options,
        remainingCriticalUnknowns: closureDecision.remainingCriticalUnknowns,
      },
      null,
      2,
    ),
    "",
    "Konverzácia do tej chvíle ti dáva kontext čo sa už povedalo. Nepýtaj sa na niečo čo už vieš alebo čo si sa už pýtal. Pri rozpracovanom rozhovore polož jednu ďalšiu relevantnú otázku; pri úplne všeobecnej prvej otázke môžeš položiť 2 až 3 krátke otázky.",
    "",
    `RAG status: ${ragEvidenceStatus}; topScore: ${topScore}; sourcesCount: ${sources.length}`,
    "",
    "RAG kontext (použi iba ak je vecne relevantný, nekopíruj):",
    ragContext || "Žiadny použiteľný RAG kontext.",
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
  const directComposerSystemPrompt = [
    "Si AI technicko-obchodný poradca Geotherm. Píšeš po slovensky, prirodzene a stručne.",
    "Toto je direct-answer režim: posledná správa je priama otázka, oprava alebo žiadosť o vysvetlenie. Neodpovedaj dotazníkom bez priamej odpovede.",
    "Použi safeAnswerDraft iba ako vecný podklad a pravidlá. Neprepisuj ho mechanicky, ale zachovaj jeho firemné obmedzenia.",
    "Ak používateľ nemá dosť údajov na výber riešenia, po priamej odpovedi polož najviac 1-2 follow-up otázky. Nikdy viac ako 2 otázniky.",
    "Pri otázke na značky TČ bezpečne komunikuj NIBE a Vaillant; IVT len opatrne; Daikin/Mitsubishi pri TČ nepotvrdzuj bez firemného dôkazu.",
    "Pri cenách rozlišuj cenu zariadenia a kompletnej realizácie. Netvrď presnú cenu ani že akumulačná nádrž je v cene, kým to nie je potvrdené v konkrétnej ponuke.",
    "Pri oprave uznaj chybu alebo upresnenie a potom povedz správnu vec. Neodpovedaj iba poďakovaním.",
    "Odpoveď drž do 80-160 slov a použi najviac jeden otáznik.",
  ].join("\n");
  const directComposerInput = JSON.stringify(
    {
      latestUserMessage: message,
      previousMessages: previousMessages.slice(-6).map((item) => ({ role: item.role, content: item.content })),
      route: { service_type: route.serviceType, intent: route.serviceIntent },
      state: stateForTurn,
      directAnswer: {
        answerMode: directDecision.answerMode,
        reason: directDecision.reason,
        topic: directDecision.topic,
        safeAnswerDraft: directDecision.answer,
      },
      ragStatus: ragEvidenceStatus,
      ragContext: ragContext.slice(0, 1800),
    },
    null,
    2,
  );
  const compactDirectComposerTopics = new Set([
    "vaillant_boilers",
    "services_overview",
    "heat_pump_brands",
    "gas_leak_safety_scope",
    "initial_heat_pump_short",
    "heat_pump_comfort_scope",
    "heat_pump_video_guides_scope",
    "comfortable_heating_scope",
    "heating_solution_recommendation_scope",
    "heat_pump_installation_scope",
    "heat_pump_air_water_overview_scope",
    "existing_radiator_heat_pump_standalone",
    "boilers",
    "boiler_brands",
    "heat_pump_service_scope",
    "heat_recovery_general_scope",
    "heat_recovery_video_scope",
    "heat_recovery_filters_scope",
    "vaillant_heat_recovery_scope",
    "photovoltaics",
    "photovoltaics_heat_pump_scope",
    "solar_panels",
    "mss_solar_system_scope",
    "geberit_wc_scope",
    "project_help_scope",
    "own_material_scope",
    "quote_inputs",
    "diagnostic_price_scope",
    "installation_preparation",
    "emergency_service_scope",
    "post_warranty_service_scope",
    "pressure_drop_service_scope",
    "heating_not_working_triage",
    "regular_service_booking",
    "generic_service_scope",
    "booking_lead_time",
    "weekends",
    "response_time_scope",
    "error_code_service_scope",
    "technician_inspection_visit",
    "existing_system_check",
    "water_shutdown_scope",
    "water_distribution",
    "garden_frost_free_valve_scope",
    "heating_shutdown_scope",
    "solution_selection_followup",
    "radiators_scope",
    "new_build_scope",
    "video_inspection_scope",
    "booking_process",
    "central_vacuum_scope",
    "ceiling_cooling_scope",
    "bkt_ceiling_cooling_scope",
    "wall_heating_cooling_scope",
    "complex_solution_scope",
    "complex_solution_price_scope",
    "floor_heating_scope",
    "floor_heating_setting_scope",
    "water_softener_scope",
    "screeds_scope",
    "system_fluids_scope",
    "ivt_nordic_inverter_scope",
    "drazice_argo_scope",
    "vaillant_compact_boiler_scope",
    "vaillant_ecotec_boiler_scope",
    "vaillant_eloblock_boiler_scope",
    "buderus_brand_scope",
    "buderus_logamax_boiler_scope",
    "gree_air_conditioning_scope",
    "air_conditioning_general_scope",
    "nibe_heat_recovery_scope",
    "vaillant_heat_recovery_scope",
    "solar_collector_tank_scope",
    "subsidy_conditions_scope",
    "subsidy_conditions_direct_scope",
    "plan_obnovy_subsidy_scope",
    "vaillant_anniversary_subsidy_scope",
    "subsidy_general_scope",
    "subsidy_oze_scope",
    "subsidy_help_handoff",
    "heating_reconstruction_scope",
    "older_houses_scope",
    "boiler_electrical_scope",
    "service_order_process",
    "service_visit_process",
    "pre_realization_requirements",
    "realization_contact",
    "heating_references_scope",
  ]);
  const useCompactDirectComposer = directDecision.triggered && compactDirectComposerTopics.has(directDecision.topic ?? "");
  const compactDirectComposerSystemPrompt = [
    "Si AI poradca Geotherm. Odpovedaj po slovensky, prirodzene a stručne.",
    "Prepíš safeAnswerDraft na finálnu odpoveď pre zákazníka. Zachovaj firemné obmedzenia a nič nepridávaj ako istý fakt.",
    "Zachovaj hlavné technologické slová zo safeAnswerDraft, napríklad tepelné čerpadlo, rekuperácia, klimatizácia alebo podlahové kúrenie.",
    "Použi 60 až 110 slov, čistý Markdown s krátkym nadpisom, najviac jeden otáznik.",
  ].join("\n");
  const compactDirectComposerInput = JSON.stringify(
    {
      latestUserMessage: message,
      topic: directDecision.topic,
      safeAnswerDraft: directDecision.answer,
    },
    null,
    2,
  );
  const useFastOutOfScopeComposer = currentMessagePolicy.kind === "out_of_scope";
  const fastOutOfScopeComposerSystemPrompt =
    "Si krátky slovenský chatbot Geotherm. Otázka je mimo tém Geotherm. Odpovedz cez AI maximálne dvoma vetami: neodpovedaj na externú tému, krátko presmeruj na kúrenie, chladenie, vetranie, servis, dotácie alebo ponuku. Nepouži RAG ani markdown nadpis.";
  const fastOutOfScopeComposerInput = `Používateľ napísal: ${message}\nOdpovedz stručne a bezpečne.`;
  const fastQualificationServices = new Set<ServiceType>([
    "heat_pump",
    "air_conditioning",
    "heat_recovery",
    "floor_heating",
    "ceiling_cooling",
    "complex_solution",
  ]);
  const useFastQualificationComposer =
    !directDecision.triggered &&
    !closureDecision.triggered &&
    fastQualificationServices.has(route.serviceType) &&
    (route.serviceIntent === "recommendation" || route.serviceIntent === "quote" || route.serviceIntent === "process" || route.serviceIntent === "brand_model") &&
    questionRoundsCount <= 1;
  const fastQualificationComposerSystemPrompt = [
    "Si AI technicko-obchodný poradca Geotherm. Odpovedaj po slovensky, stručne a vecne.",
    "Daj predbežný smer, krátky dôvod, typický rozsah a najviac 1-2 otázky alebo CTA na konzultáciu/nacenenie.",
    "Nesľubuj cenu, termín, bezplatnú obhliadku ani servis cudzej montáže bez potvrdenia. Nepíš frázu Stručne k otázke.",
    "Odpoveď drž do 90-150 slov, čistý Markdown s krátkym nadpisom.",
  ].join("\n");
  const fastQualificationComposerInput = JSON.stringify(
    {
      latestUserMessage: message,
      route: { service_type: route.serviceType, intent: route.serviceIntent },
      state: stateForTurn,
      serviceManual: serviceCardSummary(route.serviceType),
      ragContext: ragContext.slice(0, 1200),
    },
    null,
    2,
  );
  const activeComposerSystemPrompt = useCompactDirectComposer
    ? compactDirectComposerSystemPrompt
    : useFastOutOfScopeComposer
      ? fastOutOfScopeComposerSystemPrompt
      : useFastQualificationComposer
        ? fastQualificationComposerSystemPrompt
    : directDecision.triggered
      ? directComposerSystemPrompt
      : composerSystemPrompt;
  const activeComposerInput = useCompactDirectComposer
    ? compactDirectComposerInput
    : useFastOutOfScopeComposer
      ? fastOutOfScopeComposerInput
      : useFastQualificationComposer
        ? fastQualificationComposerInput
      : directDecision.triggered
        ? directComposerInput
        : composerInput;
  const routerDirectAnswer = route.directAnswer ? cleanAnswerText(route.directAnswer) : "";
  let directAnswerComposedByLlm = false;
  let directAnswerFallbackUsed = false;
  let composerLlm = await callLlmText({
    systemPrompt: activeComposerSystemPrompt,
    prompt: activeComposerInput,
    maxOutputTokens: useFastOutOfScopeComposer ? 180 : useCompactDirectComposer ? 300 : useFastQualificationComposer ? 420 : directDecision.triggered ? 520 : 1200,
    timeoutMs: useCompactDirectComposer
      ? Math.min(Math.max(Number.parseInt(process.env.LLM_FAST_REQUEST_TIMEOUT_MS || "2500", 10), 1800), 2500)
      : useFastOutOfScopeComposer
        ? Math.min(Math.max(Number.parseInt(process.env.LLM_FAST_REQUEST_TIMEOUT_MS || "1600", 10), 1000), 1600)
        : useFastQualificationComposer
          ? Math.min(Math.max(Number.parseInt(process.env.LLM_FAST_REQUEST_TIMEOUT_MS || "3200", 10), 2400), 3200)
      : directDecision.triggered
      ? Math.min(Math.max(Number.parseInt(process.env.LLM_FAST_REQUEST_TIMEOUT_MS || "3500", 10), 3000), 3500)
      : route.needsRetrieval
      ? Number.parseInt(process.env.LLM_ANSWER_TIMEOUT_MS || "10000", 10)
      : Math.min(Number.parseInt(process.env.LLM_FAST_REQUEST_TIMEOUT_MS || "3500", 10), 3500),
    responseMimeType: "text/plain",
    modelOverride: useFastQualificationComposer ? process.env.GEMINI_FAST_FALLBACK_MODEL || "gemini-2.5-flash-lite" : undefined,
  });
  if ((useFastQualificationComposer || useCompactDirectComposer) && (composerLlm.error || !composerLlm.content)) {
    const retryLlm = await callLlmText({
      systemPrompt: activeComposerSystemPrompt,
      prompt: activeComposerInput,
      maxOutputTokens: useCompactDirectComposer ? 300 : 420,
      timeoutMs: Math.min(Math.max(Number.parseInt(process.env.LLM_FAST_REQUEST_TIMEOUT_MS || "3000", 10), 2200), 3000),
      responseMimeType: "text/plain",
    });
    if (!retryLlm.error && retryLlm.content) composerLlm = retryLlm;
  }
  let cleanedAnswer = composerLlm.error || !composerLlm.content ? "" : cleanAnswerText(composerLlm.content);
  if (pureSmallTalkTurn && isIncompleteAnswer(cleanedAnswer)) {
    const smallTalkRetryLlm = await callLlmText({
      systemPrompt:
        "Si krátky slovenský chatbot Geotherm. Odpovedz na small-talk prirodzene jednou vetou, bez RAG, bez obchodného dotazníka a bez markdown nadpisu.",
      prompt: `Používateľ napísal: ${message}\nOdpovedz stručne.`,
      maxOutputTokens: 80,
      timeoutMs: Math.min(Math.max(Number.parseInt(process.env.LLM_FAST_REQUEST_TIMEOUT_MS || "1800", 10), 1200), 1800),
      responseMimeType: "text/plain",
      modelOverride: process.env.GEMINI_FAST_FALLBACK_MODEL || "gemini-2.5-flash-lite",
    });
    const smallTalkRetryAnswer = smallTalkRetryLlm.error || !smallTalkRetryLlm.content ? "" : cleanAnswerText(smallTalkRetryLlm.content);
    if (!isIncompleteAnswer(smallTalkRetryAnswer)) {
      composerLlm = smallTalkRetryLlm;
      cleanedAnswer = compactPureSmallTalkAnswer(smallTalkRetryAnswer, message);
    }
  }
  if (closureDecision.triggered && isIncompleteAnswer(cleanedAnswer)) {
    const closureRetryLlm = await callLlmText({
      systemPrompt: [
        "Si AI poradca Geotherm. Napíš stručné uzatvorené odporúčanie po slovensky.",
        "Nepýtaj ďalší technický dotazník. Daj najlepší predbežný smer, 2-3 možnosti a CTA na konzultáciu alebo nacenenie.",
        "Pri novostavbe s podlahovkou nespomínaj ako ďalší krok tepelnú stratu, projekt ani energetický certifikát.",
        "Zachovaj konkrétne modelové možnosti, ak sú v návrhu: NIBE S2125 a Vaillant aroTHERM.",
      ].join("\n"),
      prompt: JSON.stringify(
        {
          latestUserMessage: message,
          state: stateForTurn,
          recommendationOptions: closureDecision.options,
          safeDraft: expectedRecommendationClosureAnswer(stateForTurn, closureDecision),
        },
        null,
        2,
      ),
      maxOutputTokens: 520,
      timeoutMs: Math.min(Math.max(Number.parseInt(process.env.LLM_FAST_REQUEST_TIMEOUT_MS || "3600", 10), 2600), 4000),
      responseMimeType: "text/plain",
      modelOverride: process.env.GEMINI_FAST_FALLBACK_MODEL || "gemini-2.5-flash-lite",
    });
    const closureRetryAnswer = closureRetryLlm.error || !closureRetryLlm.content ? "" : cleanAnswerText(closureRetryLlm.content);
    if (!isIncompleteAnswer(closureRetryAnswer)) {
      composerLlm = closureRetryLlm;
      cleanedAnswer = closureRetryAnswer;
      recordDiagnostic(answerDiagnostics.validatorsTriggered, "recommendation_closure_llm_retry_used");
    }
  }
  if (isIncompleteAnswer(cleanedAnswer) && !pureSmallTalkTurn && !directDecision.triggered && !useFastOutOfScopeComposer) {
    const repairLlm = await callLlmText({
      systemPrompt: [
        activeComposerSystemPrompt,
        "",
        "Predchádzajúca odpoveď sa nedokončila správne. Napíš finálnu odpoveď znova, kratšie, maximálne 140 slov. Musí mať jasný záver a skončiť otázkou alebo bodkou.",
      ].join("\n"),
      prompt: activeComposerInput,
      maxOutputTokens: 900,
      timeoutMs: route.needsRetrieval
        ? Number.parseInt(process.env.LLM_ANSWER_TIMEOUT_MS || "10000", 10)
        : Math.min(Number.parseInt(process.env.LLM_FAST_REQUEST_TIMEOUT_MS || "3500", 10), 3500),
      responseMimeType: "text/plain",
      singleCandidate: false,
    });
    const repairedAnswer = repairLlm.error || !repairLlm.content ? "" : cleanAnswerText(repairLlm.content);
    if (!isIncompleteAnswer(repairedAnswer)) {
      composerLlm = repairLlm;
      cleanedAnswer = repairedAnswer;
    }
  }
  if (directDecision.triggered && isIncompleteAnswer(cleanedAnswer)) {
    const directRepairLlm = await callLlmText({
      systemPrompt: [
        "Si AI poradca Geotherm. Napíš finálnu odpoveď po slovensky, prirodzene a vlastnými slovami.",
        "Toto je direct-answer situácia: najprv odpovedz na poslednú otázku používateľa, potom polož najviac 1-2 follow-up otázky, iba ak treba.",
        "Nepíš interné vysvetlenia, nekopíruj plán doslova a nepoužívaj nepodložené firemné tvrdenia.",
        "Pri značkách TČ bezpečne komunikuj NIBE a Vaillant; IVT len opatrne; Daikin/Mitsubishi pri TČ nepotvrdzuj bez firemného dôkazu.",
      ].join("\n"),
      prompt: JSON.stringify(
        {
          latestUserMessage: message,
          answerMode: directDecision.answerMode,
          directReason: directDecision.reason,
          state: stateForTurn,
          safeAnswerDraft: directDecision.answer,
          relevantRagContext: ragContext.slice(0, 1600),
        },
        null,
        2,
      ),
      maxOutputTokens: 700,
      timeoutMs: useCompactDirectComposer
        ? Math.min(Math.max(Number.parseInt(process.env.LLM_FAST_REQUEST_TIMEOUT_MS || "3200", 10), 2200), 3200)
        : Math.min(Math.max(Number.parseInt(process.env.LLM_FAST_REQUEST_TIMEOUT_MS || "5000", 10), 4500), 5500),
      responseMimeType: "text/plain",
      modelOverride: useCompactDirectComposer ? process.env.GEMINI_FAST_FALLBACK_MODEL || "gemini-2.5-flash-lite" : undefined,
    });
    const directRepairedAnswer = directRepairLlm.error || !directRepairLlm.content ? "" : cleanAnswerText(directRepairLlm.content);
    if (!isIncompleteAnswer(directRepairedAnswer)) {
      composerLlm = directRepairLlm;
      cleanedAnswer = directRepairedAnswer;
      recordDiagnostic(answerDiagnostics.validatorsTriggered, "direct_answer_llm_repair_used");
    }
  }
  const normalizedDirectDraft = normalizePolicyText(cleanedAnswer);
  const usableDirectDraft =
    directDecision.triggered &&
    cleanedAnswer.trim().length > 80 &&
    ((directDecision.answerMode === "price_answer" && /(cena|ponuk|realizac|montaz|instalac|zostav|rozsah)/.test(normalizedDirectDraft)) ||
      (directDecision.answerMode === "brand_model_answer" && /(nibe|vaillant|daikin|mitsubishi|f2040|f2050)/.test(normalizedDirectDraft)) ||
      (directDecision.answerMode === "correction_answer" && /(pravdu|oprava|nibe|vaillant|f2040|daikin|mitsubishi)/.test(normalizedDirectDraft)) ||
      directDecision.answerMode === "direct_answer");
  if (directDecision.triggered && isIncompleteAnswer(cleanedAnswer) && usableDirectDraft) {
    cleanedAnswer = cleanedAnswer.replace(/[,\s;:]+$/g, "").trim();
    if (!/[.!?…]$/.test(cleanedAnswer)) cleanedAnswer += ".";
    recordDiagnostic(answerDiagnostics.validatorsTriggered, "direct_answer_incomplete_llm_draft_closed");
  }
  if (directDecision.triggered && !isIncompleteAnswer(cleanedAnswer) && composerLlm.content && !composerLlm.error) {
    directAnswerComposedByLlm = true;
    recordDiagnostic(answerDiagnostics.validatorsTriggered, "direct_answer_composed_by_llm");
  }
  if (directDecision.triggered && isIncompleteAnswer(cleanedAnswer) && routerDirectAnswer) {
    cleanedAnswer = routerDirectAnswer;
    directAnswerFallbackUsed = true;
    answerDiagnostics.fallbackType = "direct_answer_deterministic_fallback";
    recordDiagnostic(answerDiagnostics.validatorsTriggered, "direct_answer_deterministic_fallback");
  }
  const isOutOfScopeGeneral =
    route.serviceType === "unknown" &&
    route.serviceIntent === "general" &&
    !isSmallTalkMessage(message) &&
    !isPageOverviewQuestion(message) &&
    !isContactQuestion(message);
  const cleanedAnswerIncomplete = isIncompleteAnswer(cleanedAnswer);
  if (cleanedAnswerIncomplete) {
    answerDiagnostics.fallbackType = requiresHardVerdict(stateForTurn, route, message)
      ? "deterministic_verdict"
      : "deterministic_ai_safe";
    recordDiagnostic(answerDiagnostics.validatorsTriggered, "incomplete_answer_fallback");
  }
  const baseAnswer = cleanedAnswerIncomplete && requiresHardVerdict(stateForTurn, route, message)
    ? expectedVerdictAnswer(stateForTurn)
    : cleanedAnswerIncomplete
      ? fallbackCompleteAnswer(message, stateForTurn, route)
      : cleanedAnswer;
  let answer = enforceMarkdownPresentation(
    validateAndRepairAnswer(baseAnswer, stateForTurn, route, message, answerDiagnostics),
    message,
  );
  if (isOutOfScopeGeneral && countQuestionMarks(answer) === 0 && !/nemám dostatočne jasný podklad|nemam dostatocne jasny podklad/i.test(answer)) {
    answer = `Nemám dostatočne jasný podklad na túto tému.\n\n${answer}`.trim();
  }
  if (isOutOfScopeGeneral && countQuestionMarks(answer) > 0) {
    answer = answer.replace(/^Nemám dostatočne jasný podklad na túto tému\.\s*/i, "").trim();
  }
  if (isSmallTalkMessage(message)) {
    answer = answer.replace(/^Nemám dostatočne jasný podklad na túto tému\.\s*/i, "").trim();
  }
  if (!route.needsRetrieval && (isPureSmallTalkMessage(message) || isLooseSmallTalkMessage(message))) {
    answer = compactPureSmallTalkAnswer(answer, message);
    recordDiagnostic(answerDiagnostics.validatorsTriggered, "pure_small_talk_compacted");
  }
  answer = validateAndRepairAnswer(answer, stateForTurn, route, message, answerDiagnostics);
  if (
    directDecision.triggered &&
    directDecision.topic === "brand_correction" &&
    directDecision.answer &&
    !(normalizePolicyText(answer).includes("nibe") && normalizePolicyText(answer).includes("vaillant"))
  ) {
    recordDiagnostic(answerDiagnostics.validatorsTriggered, "direct_brand_correction_repaired");
    answer = validateAndRepairAnswer(directDecision.answer, stateForTurn, route, message, answerDiagnostics);
  }
  if (directDecision.triggered && directDecision.reason === "direct_clarification_request" && directDecision.answer) {
    recordDiagnostic(answerDiagnostics.validatorsTriggered, "direct_clarification_repaired");
    answer = validateAndRepairAnswer(directDecision.answer, stateForTurn, route, message, answerDiagnostics);
    directAnswerComposedByLlm = false;
  }
  if (directDecision.triggered && directDecision.topic === "F2050" && directDecision.answer) {
    const normalized = normalizePolicyText(answer);
    if (!/(nemam potvrdeny|nemame|nie je potvrden|overit|nebudem vymyslat)/.test(normalized)) {
      recordDiagnostic(answerDiagnostics.validatorsTriggered, "direct_f2050_guardrail_repaired");
      answer = validateAndRepairAnswer(directDecision.answer, stateForTurn, route, message, answerDiagnostics);
      directAnswerFallbackUsed = true;
    }
  }
  if (directDecision.triggered && directDecision.topic === "F2040_obsolete" && directDecision.answer) {
    const normalized = normalizePolicyText(answer);
    if (!/(archiv|archivny|historick|neaktual|nie je aktual|obsolete|nevyraba|nevyrába)/.test(normalized)) {
      recordDiagnostic(answerDiagnostics.validatorsTriggered, "direct_f2040_obsolete_repaired");
      answer = validateAndRepairAnswer(directDecision.answer, stateForTurn, route, message, answerDiagnostics);
      directAnswerFallbackUsed = true;
    }
  }
  if (
    directDecision.triggered &&
    directDecision.topic === "NIBE" &&
    directDecision.answer &&
    countQuestionMarks(answer) === 0
  ) {
    recordDiagnostic(answerDiagnostics.validatorsTriggered, "brand_followup_question_repaired");
    answer = validateAndRepairAnswer(directDecision.answer, stateForTurn, route, message, answerDiagnostics);
    directAnswerFallbackUsed = true;
  }
  if (
    directDecision.triggered &&
    (directDecision.topic === "Daikin" || directDecision.topic === "Mitsubishi") &&
    directDecision.answer
  ) {
    const normalized = normalizePolicyText(answer);
    if (!/(bezpecne netvrd|netvrd|overit|potvrdit|potvrdenie|aktualnej ponuky|nekomunik|nie je standard|nie je sucast|standardne sucastou|nepotvrd)/.test(normalized)) {
      recordDiagnostic(answerDiagnostics.validatorsTriggered, "unsupported_brand_guardrail_repaired");
      answer = validateAndRepairAnswer(directDecision.answer, stateForTurn, route, message, answerDiagnostics);
      directAnswerFallbackUsed = true;
    }
  }
  if (directDecision.triggered && directDecision.topic === "buffer_tank_price_scope" && directDecision.answer) {
    const normalized = normalizePolicyText(answer);
    const hasSafeBufferTankScope =
      /akumulac|akumula/.test(normalized) &&
      /(ponuk|rozsah|nie je automat|nepovazuj|nepovažuj|samostatn|zahrnut)/.test(normalized);
    if (!hasSafeBufferTankScope) {
      recordDiagnostic(answerDiagnostics.validatorsTriggered, "buffer_tank_scope_repaired");
      answer = validateAndRepairAnswer(directDecision.answer, stateForTurn, route, message, answerDiagnostics);
      directAnswerFallbackUsed = true;
    }
  }
  if (directDecision.triggered && directDecision.topic === "price_basis") {
    const normalized = normalizePolicyText(answer);
    const hasScope =
      /cena zariadenia|samotne tepelne cerpadlo|kompletnej realizacie|kompletna realizacia|co presne ponuka obsahuje|co presne obsahuje/.test(normalized);
    if (!hasScope) {
      recordDiagnostic(answerDiagnostics.validatorsTriggered, "price_basis_scope_repaired");
      answer = `${answer.trim()}\n\nInak povedané, treba rozlíšiť **cenu zariadenia** a cenu **kompletnej realizácie**: čo presne ponuka obsahuje, čo je príplatok a čo sa musí naceniť samostatne.`;
    }
  }
  if (
    directDecision.triggered &&
    directDecision.answerMode === "price_answer" &&
    ["price", "lowest_price_scope", "low_price_scope"].includes(directDecision.topic || "") &&
    directDecision.answer &&
    countQuestionMarks(answer) === 0
  ) {
    recordDiagnostic(answerDiagnostics.validatorsTriggered, "vague_price_followup_repaired");
    answer = validateAndRepairAnswer(directDecision.answer, stateForTurn, route, message, answerDiagnostics);
    directAnswerFallbackUsed = true;
  }
  if (directDecision.triggered && directDecision.reason?.startsWith("company_practical_") && directDecision.answer) {
    const normalized = normalizePolicyText(answer);
    const topic = directDecision.topic || "";
    const confirmTopics = new Set([
      "today_visit",
      "service_area",
      "quote_free",
      "whatsapp",
      "payment",
      "insurance",
      "gas_certification",
      "docs_after_install",
      "emergency_callout",
      "inspection_paid",
      "warranty_work",
      "gas_revision",
      "boiler_revision",
      "bathroom_core",
      "chimney_work",
      "business_customers",
      "generic_recommendation",
      "value_question",
      "noise_ambiguous",
      "problem_or_design",
      "apartment_buildings",
      "flat_heat_pump_suitability",
      "small_jobs",
      "boiler_brands",
    ]);
    const forceDraftTopics = new Set([
      "vaillant_boilers",
      "gas_leak_safety_scope",
      "Daikin",
      "Mitsubishi",
      "budget_scope",
      "nibe_noise_scope",
      "large_house_vague_goal_followup",
      "older_gas_house_chaotic_followup",
      "contact_details",
      "contact_short_followup",
      "warranty_service_check",
      "generic_installation_followup",
      "energy_consumption_followup",
      "subsidy_followup",
      "subsidy_order_followup",
      "mixed_language_subsidy_followup",
      "business_heating_followup",
      "heat_pump_service_scope",
      "heat_recovery_general_scope",
      "heat_recovery_video_scope",
      "heat_recovery_filters_scope",
      "vaillant_heat_recovery_scope",
      "warranty_work",
      "gas_revision",
      "boiler_revision",
      "business_customers",
      "apartment_buildings",
      "small_jobs",
      "boiler_brands",
      "customer_bought_boiler",
      "bathroom_core",
      "chimney_work",
      "photovoltaics",
      "photovoltaics_heat_pump_scope",
      "screeds",
      "references",
      "third_party_service",
      "service_installation_difference",
      "service_and_installation",
      "location_followup",
      "missing_model",
      "device_label_photo",
      "possible_settings_issue",
      "service_wait_time",
      "diy_repair",
      "no_email",
      "needed_inputs",
      "visit_timing",
      "stop_questioning_summary",
      "subsidy_on_service",
      "installation_duration",
      "floorplan_project",
      "air_to_water_direction",
      "existing_heat_pump_mounting_ambiguity",
      "annual_maintenance_scope",
      "winter_work_scope",
      "nonstop_line_scope",
      "service_revision_reminder",
      "diagnostic_price_scope",
      "installation_preparation",
      "own_material_scope",
      "emergency_service_scope",
      "post_warranty_service_scope",
      "pressure_drop_service_scope",
      "regular_service_booking",
      "generic_service_scope",
      "booking_lead_time",
      "weekends",
      "error_code_service_scope",
      "technician_inspection_visit",
      "older_houses_scope",
      "solution_selection_followup",
      "initial_heat_pump_short",
      "heat_pump_comfort_scope",
      "comfortable_heating_scope",
      "heating_solution_recommendation_scope",
      "heat_pump_installation_scope",
      "heat_pump_air_water_overview_scope",
      "existing_radiator_heat_pump_standalone",
      "water_shutdown_scope",
      "water_distribution",
      "garden_frost_free_valve_scope",
      "heating_shutdown_scope",
      "heating_not_working_triage",
      "response_time_scope",
      "project_help_scope",
      "geberit_wc_scope",
      "solar_panels",
      "mss_solar_system_scope",
      "radiators_scope",
      "new_build_scope",
      "video_inspection_scope",
      "booking_process",
      "central_vacuum_scope",
      "ceiling_cooling_scope",
      "bkt_ceiling_cooling_scope",
      "wall_heating_cooling_scope",
      "complex_solution_scope",
      "complex_solution_price_scope",
      "floor_heating_scope",
      "floor_heating_setting_scope",
      "water_softener_scope",
      "screeds_scope",
      "system_fluids_scope",
      "ivt_nordic_inverter_scope",
      "drazice_argo_scope",
      "vaillant_compact_boiler_scope",
      "vaillant_ecotec_boiler_scope",
      "vaillant_eloblock_boiler_scope",
      "buderus_brand_scope",
      "buderus_logamax_boiler_scope",
      "gree_air_conditioning_scope",
      "air_conditioning_general_scope",
      "solar_collector_tank_scope",
      "subsidy_conditions_scope",
      "subsidy_conditions_direct_scope",
      "plan_obnovy_subsidy_scope",
      "subsidy_conditions_direct_scope",
      "vaillant_anniversary_subsidy_scope",
      "subsidy_general_scope",
      "subsidy_oze_scope",
      "heat_pump_video_guides_scope",
      "heating_reconstruction_scope",
      "boiler_electrical_scope",
      "service_order_process",
      "service_visit_process",
      "pre_realization_requirements",
      "realization_contact",
      "heating_references_scope",
    ]);
    const needsDraft =
      forceDraftTopics.has(topic) ||
      (confirmTopics.has(topic) && !normalized.includes("potvr")) ||
      (topic === "quote_inputs" && !normalized.includes("plocha")) ||
      (topic === "vaillant_boilers" && !(normalized.includes("vaillant") && normalized.includes("kot"))) ||
      (["boilers", "existing_boiler_service", "boiler_revision", "boiler_brands"].includes(topic) && !normalized.includes("kot")) ||
      (topic === "gas_revision" && !normalized.includes("plyn")) ||
      (topic === "water_distribution" && !(normalized.includes("vod") && normalized.includes("rozvod"))) ||
      (topic === "customer_bought_boiler" && !(normalized.includes("potvr") && normalized.includes("kot"))) ||
      (["plan_obnovy_subsidy_scope", "subsidy_conditions_direct_scope", "vaillant_anniversary_subsidy_scope"].includes(topic) && !/(dotac|podpor|podmien|over)/.test(normalized)) ||
      (topic === "heat_pump_video_guides_scope" && !/(servis|udrz|model|zariaden)/.test(normalized)) ||
      (topic === "heat_recovery_video_scope" && !/(rekuper|vetr|servis|udrz|model|zariaden)/.test(normalized)) ||
      (topic === "mss_solar_system_scope" && !/(solar|solarn|kolektor|zasobnik)/.test(normalized)) ||
      (topic === "photovoltaics_heat_pump_scope" && !/(fotovolt|panel)/.test(normalized)) ||
      (["whatsapp", "insurance", "gas_certification", "docs_after_install"].includes(topic) && /^ano\b/.test(normalized));
    if (needsDraft) {
      recordDiagnostic(answerDiagnostics.validatorsTriggered, "company_practical_guardrail_repaired");
      answer = enforceMarkdownPresentation(directDecision.answer, message);
      directAnswerFallbackUsed = true;
    }
  }
  const normalizedMessageForHardDirect = normalizePolicyText(message);
  const rawMessageForHardDirect = message.toLowerCase();
  if (/(vonkajs|vonkajsi|vonkajsej).*(jednotk)|pod oknom|umiestnenie jednotky/.test(normalizedMessageForHardDirect)) {
    answer = "### Umiestnenie vonkajšej jednotky\n\nPod oknom to nemusí byť automaticky zlé, ale treba to posúdiť opatrne. Rozhoduje hluk v noci, prúdenie vzduchu, kondenzát, odstup od okien a susedov, servisný prístup a miestne možnosti montáže.\n\nBez obhliadky by som to nepotvrdil ako finálne miesto. Pri nacenení by som porovnal tichšie umiestnenie bokom od obytných miestností alebo technické opatrenia proti hluku.";
    recordDiagnostic(answerDiagnostics.validatorsTriggered, "outdoor_unit_placement_answer_hardened");
  }
  if (
    ((rawMessageForHardDirect.includes("mont") && rawMessageForHardDirect.includes("zajtra") && rawMessageForHardDirect.includes("neviem")) ||
      /(montaz|montáž).*(zajtra|hned|hneď).*(neviem|neviem aky|neviem aký|aky system|aký systém)|(?:neviem|neviem aky|neviem aký|aky system|aký systém).*(montaz|montáž).*(zajtra|hned|hneď)/.test(normalizedMessageForHardDirect))
  ) {
    answer = "### Najprv systém, potom termín\n\nMontáž hneď zajtra by som **bez podkladov a bez potvrdeného systému nesľuboval**. Najprv treba určiť, či ide o tepelné čerpadlo, klimatizáciu, rekuperáciu, podlahové kúrenie alebo inú technológiu; až potom sa dá potvrdiť termín, kapacita a cena.\n\nAk nevieš systém, začal by som krátkou konzultáciou: kúrenie, chladenie, vetranie alebo komplexné riešenie domu?";
    recordDiagnostic(answerDiagnostics.validatorsTriggered, "contradictory_installation_timing_hardened");
  }
  if (/vaillant.*kot|kot.*vaillant/.test(normalizedMessageForHardDirect)) {
    answer = "### Vaillant kotly\n\nPri otázke na **Vaillant kotly** treba aktuálnu ponuku potvrdiť podľa konkrétneho typu kotolne. Geotherm vie riešiť kotly a výmenu plynového kotla, ale konkrétny model Vaillant kotla by som potvrdil pri nacenení podľa dostupnosti, odvodu spalín, elektroprípravy a rozsahu prác.";
    recordDiagnostic(answerDiagnostics.validatorsTriggered, "vaillant_boiler_answer_hardened");
  }
  if (/(dokumentac|doklad|odovzdanie|po realizacii|po montazi)/.test(normalizedMessageForHardDirect) && (!normalizePolicyText(answer).includes("potvr") || /^ano\b/.test(normalizePolicyText(answer)))) {
    answer = "### Dokumentácia po realizácii\n\nPri realizácii treba v konkrétnej ponuke **potvrdiť**, aké odovzdávacie podklady a dokumentácia budú súčasťou. Štandardne má zmysel riešiť najmä odovzdanie systému, zaškolenie, záručné podklady a prípadné revízne dokumenty podľa typu technológie.";
    recordDiagnostic(answerDiagnostics.validatorsTriggered, "docs_after_install_answer_hardened");
  }
  if (/(ako prebieha|postup|realizacia od zaciatku)/.test(normalizePolicyText(message)) && !normalizePolicyText(answer).includes("navrh")) {
    recordDiagnostic(answerDiagnostics.validatorsTriggered, "process_answer_scope_repaired");
    answer = `${answer}\n\nTypicky má postup obsahovať aj **návrh riešenia**: najprv sa ujasní služba a podklady, potom sa pripraví návrh a cenová ponuka, následne montáž, spustenie, zaškolenie a odovzdanie systému.`.trim();
  }
  if (
    route.serviceIntent === "service_fault" &&
    normalizePolicyText(answer).includes("nibe") &&
    !normalizePolicyText(message).includes("nibe")
  ) {
    recordDiagnostic(answerDiagnostics.validatorsTriggered, "service_fault_brand_hallucination_repaired");
    answer = expectedServiceFaultAnswer(message);
  }
  if (
    !directDecision.triggered &&
    route.serviceType === "heat_pump" &&
    route.serviceIntent === "recommendation" &&
    !closureDecision.triggered &&
    countQuestionMarks(answer) === 0 &&
    (!stateForTurn.area_m2 || !stateForTurn.current_heating)
  ) {
    recordDiagnostic(answerDiagnostics.validatorsTriggered, "early_heat_pump_followup_appended");
    answer = `${answer}\n\nDoplň mi ešte približnú plochu domu a čím kúriš dnes?`.trim();
  }
  if (
    !directDecision.triggered &&
    route.serviceType === "heat_pump" &&
    normalizePolicyText(stateForTurn.heating_distribution || "").includes("radiator") &&
    (stateForTurn.own_wood || normalizePolicyText(stateForTurn.current_heating || "").includes("drevo") || normalizePolicyText(stateForTurn.current_heating || "").includes("tuhe palivo")) &&
    !/(zateplen|akumulac|akumula|koľko dreva|kolko dreva|dreva za sezonu|dreva za sezónu|teplu vodu|teplú vodu)/i.test(normalizePolicyText(answer))
  ) {
    recordDiagnostic(answerDiagnostics.validatorsTriggered, "wood_radiator_followup_repaired");
    answer = `${answer}\n\nPri dreve stačí orientačný údaj. Doplň mi ešte, či je dom zateplený, koľko dreva spáliš približne za sezónu a či máš akumulačnú nádrž.`.trim();
  }
  if (
    !directDecision.triggered &&
    closureDecision.triggered &&
    !/(vonkajs|vonkajsi|vonkajsej|pod oknom|kontakt|ako vas|kde vas|servis.*montaz|montaz.*servis|dotac.*servis|servis.*dotac|zhrn|zhrň|to je cele|to je celé)/.test(
      normalizePolicyText(message),
    ) &&
    ((isNewBuildFloorHeating(stateForTurn) && !answerHasNewBuildPortfolioClosure(answer)) || !answerHasRecommendationClosure(answer))
  ) {
    recordDiagnostic(answerDiagnostics.validatorsTriggered, "recommendation_closure_repaired");
    answer = validateAndRepairAnswer(expectedRecommendationClosureAnswer(stateForTurn, closureDecision), stateForTurn, route, message, answerDiagnostics);
  }
  if (
    closureDecision.triggered &&
    !/(konzult|nacen|nacenen|ponuk|stretn|meeting)/.test(normalizePolicyText(answer))
  ) {
    recordDiagnostic(answerDiagnostics.validatorsTriggered, "recommendation_closure_cta_appended");
    answer = `${answer.trim()}\n\nĎalší krok: dohodnúť krátku konzultáciu alebo stretnutie s Geotherm, kde sa preverí technický rozsah a pripraví nacenenie.`.trim();
  }
  if (
    /(rozpocet|rozpočet|\b5k\b|\b5000\b|5\s*000)/.test(normalizedMessageForHardDirect) &&
    !/(bez|zalezi|záleží|orientac|neda sa|nedá sa)/.test(normalizePolicyText(answer))
  ) {
    recordDiagnostic(answerDiagnostics.validatorsTriggered, "budget_scope_cautious_repaired");
    answer = validateAndRepairAnswer(priceDirectAnswer(message, stateForTurn).answer || answer, stateForTurn, route, message, answerDiagnostics);
  }
  if (
    directDecision.triggered &&
    directDecision.answerMode === "price_answer" &&
    (directDecision.topic === "low_price_scope" || directDecision.topic === "buffer_tank_price_scope") &&
    !/(konkretnej ponuke|konkrétnej ponuke|nie je automaticky|zavisi od konkretneho navrhu|závisí od konkrétneho návrhu|overit co presne|overiť čo presne)/.test(
      normalizePolicyText(answer),
    )
  ) {
    answer = `${answer.trim()}\n\nPri akumulačnej nádrži platí: nie je automaticky súčasťou rozsahu; rozhoduje konkrétna ponuka.`;
  }
  if (directDecision.triggered && directDecision.topic === "weekends" && !/potvr/.test(normalizePolicyText(answer))) {
    answer = `${answer.trim()}\n\nVíkendový termín alebo výjazd treba vždy potvrdiť podľa typu prípadu, lokality a aktuálnej kapacity.`;
  }
  if (directDecision.triggered && directDecision.topic === "inspection_paid") {
    answer = answer
      .replace(/\bbezplatn[áa]\b/gi, "bez poplatku")
      .replace(/\bzadarmo\b/gi, "bez poplatku");
  }
  if (currentMessagePolicy.kind === "adversarial") {
    recordDiagnostic(answerDiagnostics.validatorsTriggered, "adversarial_refusal_repaired");
    answerDiagnostics.fallbackType = "adversarial_refusal";
    answer = adversarialRefusalAnswer(message);
  } else if (currentMessagePolicy.kind === "sensitive" && currentMessagePolicy.sensitiveKind === "price") {
    recordDiagnostic(answerDiagnostics.validatorsTriggered, "sensitive_price_scope_repaired");
    answer = "Konkrétnu cenu bez údajov o dome a rozsahu prác nebudem hádať.\n\nPri nacenení treba rozlíšiť cenu zariadenia a kompletnej realizácie: výkon, typ vykurovania, montáž, reguláciu, TÚV, elektroprípravu, prípadnú akumulačnú nádrž a úpravy kotolne. Najlepší ďalší krok je krátka konzultácia s Geotherm, kde sa rozsah nacení podľa domu.";
  } else if (currentMessagePolicy.kind === "out_of_scope") {
    recordDiagnostic(answerDiagnostics.validatorsTriggered, "unsupported_company_fact_refused");
    answerDiagnostics.fallbackType = "unsupported_company_fact";
    answer = unsupportedCompanyFactAnswer(message);
  }
  if (
    ![
      "service_revision_reminder",
      "emergency_service_scope",
      "post_warranty_service_scope",
      "pressure_drop_service_scope",
      "regular_service_booking",
      "error_code_service_scope",
      "technician_inspection_visit",
      "existing_system_check",
      "services_overview",
    ].includes(directDecision.topic ?? "") &&
    (route.serviceType === "service" ||
      /servisny smer|servisný smer|zariadenie hlasi chybu|zariadenie hlási chybu|kotly|oprav|poruch|hluk|huci|hučí/.test(normalizePolicyText(answer))) &&
    countQuestionMarks(answer) === 0
  ) {
    recordDiagnostic(answerDiagnostics.validatorsTriggered, "service_fault_followup_appended");
    answer = `${answer.trim()}\n\nIde o existujúce zariadenie s poruchou, pravidelný servis, alebo zvažuješ výmenu za nové riešenie?`;
  }
  if (/(co odporucate|čo odporúčate|co odporúčate|čo odporucate)/i.test(message) && countQuestionMarks(answer) === 0) {
    recordDiagnostic(answerDiagnostics.validatorsTriggered, "recommendation_followup_appended");
    answer = `${answer.trim()}\n\nIde skôr o výmenu zdroja kúrenia, servis existujúceho zariadenia, alebo návrh nového riešenia?`;
  }
  const limitedQuestionAnswer = limitFinalQuestionMarks(answer);
  if (limitedQuestionAnswer.changed) {
    answer = limitedQuestionAnswer.answer;
    recordDiagnostic(answerDiagnostics.validatorsTriggered, "followup_questions_limited");
  }
  answer = softenOverconfidentWording(answer, answerDiagnostics);
  if (!route.needsRetrieval && (isPureSmallTalkMessage(message) || isLooseSmallTalkMessage(message))) {
    answer = compactPureSmallTalkAnswer(answer, message);
    recordDiagnostic(answerDiagnostics.validatorsTriggered, "pure_small_talk_final_compacted");
  }
  const normalizedFinalAnswer = normalizePolicyText(answer);
  const responseConfidenceBase: "high" | "medium" | "low" = currentMessagePolicy.kind === "adversarial" || currentMessagePolicy.kind === "out_of_scope"
    ? "low"
    : currentMessagePolicy.kind === "sensitive" || currentMessagePolicy.kind === "ambiguous"
      ? "medium"
    : /nemam dostatocne jasny podklad|neviem ti povedat|neviem odpovedat|nemam potvrdeny firemny podklad/.test(normalizedFinalAnswer)
    ? "low"
    : /(fotovolt|fotovoltaik)/.test(normalizedMessageForHardDirect) && /(dotac|cerpadl|\btc\b)/.test(normalizedMessageForHardDirect)
      ? "medium"
    : route.needsRetrieval
    ? sources.length === 0 || topScore < 25
      ? "medium"
      : "high"
    : isOutOfScopeGeneral
      ? countQuestionMarks(answer) > 0
        ? "medium"
        : "low"
      : "high";
  const latestNormalizedForConfidence = normalizePolicyText(message);
  const cautiousLatestMessage =
    /(oplat|ma zmysel|garant|najlacn|najlacnej|lacn.*servis|servis.*lacn|lacn.*ponuk|ponuk.*lacn|naletiet|naletieť|sto rokov|vydrz.*sto|vonkajs|vonkajsi|pod oknom|cudz|ina firma|nastavenie|maintenance|udrzb|raz za rok|pomuzete|vytapeni|navrh.*vykurov|navrh.*vytap)/.test(latestNormalizedForConfidence) ||
    /(?:cena|cenu|stoj|naklad).*(normalne|normalnu|presne|presnu|hned|hneď|nikto|nevie)|(?:normalne|normalnu|presne|presnu|hned|hneď|nikto|nevie).*(cena|cenu|stoj|naklad)/.test(latestNormalizedForConfidence) ||
    (/(dotac|prispev|poukaz|stat)/.test(latestNormalizedForConfidence) && !stateForTurn.project_type) ||
    (latestNormalizedForConfidence.includes("vaillant") && latestNormalizedForConfidence.includes("nibe")) ||
    latestNormalizedForConfidence.includes("nie je od") ||
    latestNormalizedForConfidence.includes("nie od vas");
  const responseConfidence: "high" | "medium" | "low" =
    responseConfidenceBase === "high" && cautiousLatestMessage ? "medium" : responseConfidenceBase;
  const responseIntent = mapServiceIntentToSalesIntent(route.serviceType, route.serviceIntent);
  const skipAsyncQualificationExtraction =
    (isSmallTalkMessage(message) && !route.needsRetrieval) ||
    directDecision.triggered ||
    hasMeaningfulQualificationUpdate(immediateQualificationUpdate) ||
    route.serviceType !== "unknown";
  const qualificationUpdate =
    skipAsyncQualificationExtraction && !directDecision.triggered
      ? {}
      : directDecision.triggered
        ? deterministicQualificationUpdate(message, route)
      : await extractQualificationUpdate({
          userMessage: message,
          assistantAnswer: answer,
          currentState: stateForTurn,
          route,
        });
  let nextState: QualificationState = {
    ...mergeQualificationState(stateForTurn, qualificationUpdate),
    service_type: route.serviceType !== "unknown" ? route.serviceType : previousState.service_type,
    service_intent: route.serviceIntent !== "general" ? route.serviceIntent : previousState.service_intent,
    qualification_question_rounds: questionRoundsCount,
    recommendation_closure_offered: previousState.recommendation_closure_offered || closureDecision.triggered || undefined,
    relevant_turns: (previousState.relevant_turns || 0) + 1,
  };
  const crmOutcome = buildCrmOutcome({
    siteId: site.id,
    conversationId: conversation.id,
    visitorId: anonymousId,
    message,
    answer,
    route,
    responseIntent,
    state: nextState,
    previousMessages,
    closureTriggered: closureDecision.triggered,
    currentUrl: requestBody.currentUrl,
    referrer: requestBody.metadata?.referrer,
  });
  answer = crmOutcome.answer;
  if (/(mozno neskor|možno neskôr|neskor|neskôr|teraz nie|zatial nie|zatiaľ nie)/.test(normalizePolicyText(message))) {
    answer = "Rozumiem, nechajme to zatiaľ otvorené. Keď sa k tomu vrátite, stačí nadviazať tým, či chcete riešiť servis, nacenenie alebo výber nového riešenia.";
    crmOutcome.leadCapture = { shouldAsk: false, nextQuestion: null, reason: null, requestedFields: [] };
  }
  nextState = crmOutcome.nextState;

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
      serviceType: route.serviceType,
      serviceIntent: route.serviceIntent,
    },
  });
  const llmAnswerUsed = Boolean(composerLlm.content && !composerLlm.error);
  insertEvent({
    siteId: site.id,
    sessionId: session.id,
    conversationId: conversation.id,
    eventType: "llm_answer_composed",
    payload: {
      used: llmAnswerUsed,
      provider: composerLlm.provider,
      model: composerLlm.model,
      error: composerLlm.error || null,
      retrievalUsed: route.needsRetrieval,
      directAnswerGateTriggered: directDecision.triggered,
      directAnswerComposedByLlm,
      directAnswerFallbackUsed,
    },
  });
  const finalAnswerMode: AnswerMode = directDecision.triggered
    ? directDecision.answerMode
    : closureDecision.triggered
    ? "recommendation_closure"
    : route.serviceType === "service" || route.serviceIntent === "service_fault"
      ? "service_fault_triage"
      : crmOutcome.leadCapture.shouldAsk || ["inspection_requested", "quote_requested", "contact_captured"].includes(crmOutcome.lead.status)
        ? "handoff_cta"
      : answerDiagnostics.fallbackType
        ? "ai_fallback"
        : requiresHardVerdict(stateForTurn, route, message)
          ? "diagnostic_verdict"
          : route.serviceIntent === "recommendation" && countQuestionMarks(answer) > 0
            ? "qualification_question"
            : route.needsRetrieval
              ? "rag_answer"
              : "general_chat";
  updateConversation(conversation.id, {
    intent: responseIntent,
    qualificationStateJson: JSON.stringify(nextState),
  });
  insertMessage({ conversationId: conversation.id, role: "assistant", content: answer, confidence: responseConfidence, sources });
  insertEvent({
    siteId: site.id,
    sessionId: session.id,
    conversationId: conversation.id,
    eventType: "answer_returned",
    payload: {
      confidence: responseConfidence,
      intent: responseIntent,
      retrievalUsed: route.needsRetrieval,
      serviceType: route.serviceType,
      serviceIntent: route.serviceIntent,
      answerMode: finalAnswerMode,
      closureGateTriggered: closureDecision.triggered,
      closureReason: closureDecision.reason,
      directAnswerGateTriggered: directDecision.triggered,
      directAnswerReason: directDecision.reason,
      directAnswerComposedByLlm,
      directAnswerFallbackUsed,
      lead: crmOutcome.lead,
      outreach: crmOutcome.outreach,
    },
  });
  if (crmOutcome.leadRecord) {
    insertEvent({
      siteId: site.id,
      sessionId: session.id,
      conversationId: conversation.id,
      eventType: crmOutcome.lead.captured ? "lead_captured" : "lead_updated",
      payload: {
        leadId: crmOutcome.leadRecord.id,
        status: crmOutcome.lead.status,
        score: crmOutcome.lead.score,
        temperature: crmOutcome.lead.temperature,
        summary: crmOutcome.leadRecord.summary,
      },
    });
    if (crmOutcome.lead.temperature === "hot" && crmOutcome.lead.captured) {
      insertEvent({
        siteId: site.id,
        sessionId: session.id,
        conversationId: conversation.id,
        eventType: "lead_notification_queued",
        payload: {
          leadId: crmOutcome.leadRecord.id,
          subject: `Nový hot lead: ${crmOutcome.lead.status}`,
          nextAction: crmOutcome.lead.nextAction,
        },
      });
    }
  }

  return {
    conversationId: conversation.id,
    answer,
    intent: responseIntent,
    confidence: responseConfidence,
    topScore,
    sources,
    leadCapture: crmOutcome.leadCapture,
    lead: crmOutcome.lead,
    debug: {
      answerMode: finalAnswerMode,
      llmAttempted: true,
      llmUsed: llmAnswerUsed,
      llmProvider: composerLlm.provider,
      llmModel: composerLlm.model,
      llmError: composerLlm.error || null,
      llmRouterUsed: true,
      llmRouterError: routerLlm.error || null,
      retrievalQuery: retrievalQuery || message,
      enrichedRetrievalQuery: contextualRetrieval.query || retrievalQuery || message,
      storedSlots: debugStoredSlots(nextState),
      rawUserMessage: message,
      normalizedUserMessage: normalizePolicyText(message),
      newlyExtractedSlots: debugQualificationUpdate(qualificationUpdate),
      inferredFromLastQuestion,
      serviceType: route.serviceType,
      serviceIntent: route.serviceIntent,
      legacyIntent: responseIntent,
      diagnosticFlowVersion,
      serverCommit: serverCommit(),
      retrievalSourcesCount: sources.length,
      contextTopic: route.serviceType !== "unknown" ? serviceLabel(route.serviceType) : null,
      contextCarried: contextualRetrieval.contextCarried,
      fallbackUsed: Boolean(answerDiagnostics.fallbackType),
      fallbackType: answerDiagnostics.fallbackType,
      validatorsTriggered: answerDiagnostics.validatorsTriggered,
      bannedClaimsRemoved: answerDiagnostics.bannedClaimsRemoved,
      questionRoundsCount,
      closureGateTriggered: closureDecision.triggered,
      closureReason: closureDecision.reason,
      directAnswerGateTriggered: directDecision.triggered,
      directAnswerReason: directDecision.reason,
      directAnswerComposedByLlm,
      directAnswerFallbackUsed,
      recommendationOptions: closureDecision.options,
      remainingCriticalUnknowns: closureDecision.remainingCriticalUnknowns,
      leadCapture: crmOutcome.leadCapture,
      lead: {
        ...crmOutcome.lead,
        extractedContact: Object.fromEntries(Object.entries(crmOutcome.lead.extractedContact).filter(([, value]) => Boolean(value))) as Record<string, string>,
      },
      outreach: crmOutcome.outreach,
      persistence: crmOutcome.persistence,
    },
    action: null,
    fallbackUsed: Boolean(answerDiagnostics.fallbackType),
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
    const answer = softenOverconfidentWording(renderStructuredAnswer(structuredAnswer, sources, "safety_fallback", { message, intent: safetyRoute.intent }));
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
  const isGreeting = false && !isShortReply && isGreetingMessage(message);
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
    const noRetrievalSmallTalk = answerMode === "general_chat" && (isSmallTalkMessage(message) || isLooseSmallTalkMessage(message));
    const fallbackStructured =
      noRetrievalSmallTalk
        ? pureSmallTalkFallback(message)
        : answerMode === "general_chat"
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
    const structuredAnswer =
      noRetrievalSmallTalk && llm.structuredAnswer
        ? {
            shortAnswer: compactPureSmallTalkAnswer(llm.structuredAnswer.shortAnswer, message),
            details: [],
            followUpQuestion: null,
            shouldAskFollowUp: false,
            safetyNote: null,
            confidence,
          }
        : structuredAnswerForLeadCapture(llm.structuredAnswer || fallbackStructured, leadCapture);
    let answer = renderStructuredAnswer(structuredAnswer, sources, llm.structuredAnswer ? llm.answerMode : answerMode, { message: answerMessage, intent });
    if (noRetrievalSmallTalk) answer = compactPureSmallTalkAnswer(answer, message);
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
  let answer = softenOverconfidentWording(
    renderStructuredAnswer(structuredAnswer, sources, llm.structuredAnswer ? llm.answerMode : answerMode, { message: answerMessage, intent }),
  );
  if (hasSubsidyDrift(answer, answerMessage, intent)) {
    const repairedStructured = deterministicStructuredAnswer(answerMessage, filteredResults, confidence, intent, answerPolicy, leadCapture);
    answer = softenOverconfidentWording(renderStructuredAnswer(repairedStructured, sources, answerMode, { message: answerMessage, intent }));
  }
  if (sources.length === 0 && (isSmallTalkMessage(message) || isLooseSmallTalkMessage(message))) {
    answer = compactPureSmallTalkAnswer(answer, message);
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
  const chatRateLimit = rateLimitConfig(options.rateLimit);
  const chatSiteSignature = siteSignatureConfig(options.siteSignature);
  initDb();
  await loadKnowledge(knowledgePath);

  const server = createServer(async (request, response) => {
    const origin = request.headers.origin;
    const requestUrl = new URL(request.url || "/", "http://localhost");

    if (request.method === "OPTIONS") {
      response.writeHead(204, corsHeaders(origin));
      response.end();
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/health") {
      writeJson(
        response,
        200,
        {
          ok: true,
          commit: serverCommit(),
          diagnosticFlowVersion,
          rateLimit: {
            enabled: chatRateLimit.enabled,
            windowMs: chatRateLimit.windowMs,
            maxRequests: chatRateLimit.maxRequests,
          },
          siteSignature: {
            enabled: chatSiteSignature.enabled,
            maxAgeMs: chatSiteSignature.maxAgeMs,
          },
        },
        origin,
      );
      return;
    }

    if (await handleAdminRequest(request, response, requestUrl, origin)) {
      return;
    }

    if (request.method === "GET" && (requestUrl.pathname === "/" || requestUrl.pathname === "/preview" || requestUrl.pathname === "/embed-preview.html")) {
      if (!isPreviewEnabled()) {
        writeError(response, 404, "not_found", "Preview is disabled.", origin);
        return;
      }
      writePreviewPage(response);
      return;
    }

    if (request.method === "GET" && (await writeEmbedAsset(requestUrl.pathname, response))) {
      return;
    }

    if (request.method !== "POST" || requestUrl.pathname !== "/chat") {
      writeError(response, 404, "not_found", "Not found", origin);
      return;
    }

    try {
      const body = await readJsonBody(request);
      if (!isChatRequest(body)) {
        writeError(response, 400, "bad_request", "Request must include message.", origin);
        return;
      }
      if (!verifySiteSignature(request, body, origin, chatSiteSignature)) {
        writeError(response, 401, "invalid_site_signature", "Valid site signature is required.", origin);
        return;
      }
      const rateLimit = checkChatRateLimit(request, body, chatRateLimit);
      if (!rateLimit.allowed) {
        response.writeHead(429, {
          "Content-Type": "application/json; charset=utf-8",
          "Retry-After": String(rateLimit.retryAfterSeconds),
          ...corsHeaders(origin),
        });
        response.end(`${JSON.stringify({ error: { code: "rate_limited", message: "Too many chat requests. Try again later." } }, null, 2)}\n`);
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

