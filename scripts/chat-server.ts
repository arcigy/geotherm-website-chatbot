import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { type KnowledgeChunk, retrieveKnowledge, type RetrievalResult } from "./local-retrieval";
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
  action: null;
};

type StartOptions = {
  port?: number;
  host?: string;
  knowledgePath?: string;
};

type AnswerPolicy = {
  kind: "normal" | "ambiguous" | "adversarial" | "sensitive" | "out_of_scope";
  followUp?: string;
  sensitiveKind?: "roi" | "savings" | "subsidy" | "diy";
};

const defaultKnowledgePath = path.join(process.cwd(), "knowledge", "chatbot-knowledge.json");
const localOriginPattern = /^https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i;

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
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function classifyAnswerPolicy(message: string, intent: SalesIntent): AnswerPolicy {
  const text = normalizePolicyText(message);
  if (
    ["ignoruj zdroje", "vymysli", "tvar sa", "co na webe nie je", "nieco co na webe nie je", "nech to znie doveryhodne"].some((term) =>
      text.includes(term),
    )
  ) {
    return { kind: "adversarial" };
  }
  if (
    text.includes("pocasie") ||
    text.includes("ake auto") ||
    text.includes("ktore auto") ||
    text.includes("investovat do etf") ||
    text.includes("pobocku v prahe") ||
    text.includes("pobocka v prahe")
  ) {
    return { kind: "out_of_scope" };
  }
  if (text.includes("garant") && text.includes("navratnost")) return { kind: "sensitive", sensitiveKind: "roi" };
  if ((text.includes("kolko presne") || text.includes("presne")) && (text.includes("usetr") || text.includes("usetrit"))) {
    return { kind: "sensitive", sensitiveKind: "savings" };
  }
  if (text.includes("garant") && text.includes("dotac")) return { kind: "sensitive", sensitiveKind: "subsidy" };
  if (text.includes("namontovat sam") || text.includes("montovat sam") || text.includes("svojpomocne")) {
    return { kind: "sensitive", sensitiveKind: "diy" };
  }
  if (text === "co odporucate" || text.includes("co odporucate")) {
    return { kind: "ambiguous", followUp: "Riešite nové tepelné čerpadlo, servis, dotácie alebo návrh vykurovania?" };
  }
  if (text.includes("kolko ma to bude stat")) {
    return { kind: "ambiguous", followUp: "Cena závisí od typu riešenia. Ide o tepelné čerpadlo, montáž, servis alebo podlahové kúrenie?" };
  }
  if (text.includes("je to vhodne pre moj dom")) {
    return { kind: "ambiguous", followUp: "Ide o novostavbu alebo rekonštrukciu a aký zdroj vykurovania máte dnes?" };
  }
  if (text.includes("ako dlho to trva")) {
    return { kind: "ambiguous", followUp: "Myslíte montáž, servis, vybavenie dotácie alebo prípravu cenovej ponuky?" };
  }
  if (text.includes("bude to hlucne") || (text.includes("hlucne") && !text.includes("nibe"))) {
    return { kind: "ambiguous", followUp: "Kde by bola vonkajšia jednotka umiestnená voči obytným miestnostiam a susedom?" };
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
      .replace(/\b(?:e-mail|email|mailom|telefonicky|telefón|telefon|tel\.?)\b/gi, "kontakt")
      .replace(/neváhajte nás kontaktovať[^.]*\./gi, "")
      .replace(/môžete nás kontaktovať[^.]*\./gi, "");
  }
  return text.replace(/\?/g, ".").slice(0, 340).trim();
}

function sourceBullets(results: RetrievalResult[], confidence: "high" | "medium" | "low", allowContactDetails: boolean): string[] {
  if (confidence === "low") return [];
  return results
    .slice(0, confidence === "high" ? 2 : 1)
    .map((result) => cleanSnippet(result.snippet || result.chunk.text, allowContactDetails))
    .filter(Boolean)
    .map((snippet) => `- ${snippet}`);
}

function topicLeadIn(message: string): string | null {
  const text = normalizePolicyText(message);
  const mentionsSubsidy = text.includes("dotac") || text.includes("prispev") || text.includes("stat");
  const mentionsService = text.includes("servis") || text.includes("udrzb") || text.includes("prehliad");
  const mentionsInstallation = text.includes("montaz") || text.includes("instalac") || text.includes("nov") || text.includes("namont");
  const mentionsCosts = text.includes("naklad") || text.includes("kureni") || text.includes("vykurov") || text.includes("usetr");

  if (mentionsSubsidy && mentionsService) {
    return "Pri dotácii ide najmä o podporu a podmienky programu; pri servise ide o kontrolu, údržbu a spoľahlivú prevádzku existujúceho systému.";
  }
  if (mentionsInstallation && mentionsService) {
    return "Montáž nového tepelného čerpadla rieši návrh, výber a inštaláciu systému; servis existujúceho čerpadla rieši kontrolu, nastavenie, údržbu a prevádzkovú spoľahlivosť.";
  }
  if (mentionsSubsidy) {
    return "Dotácia aj príspevok závisia od dostupnej podpory, podmienok programu a oprávnenosti konkrétneho žiadateľa.";
  }
  if (mentionsCosts) {
    return "Pri nákladoch na vykurovanie záleží na type domu, tepelných stratách, zdroji tepla, nastavení systému a prevádzke.";
  }
  return null;
}

function composeSensitiveAnswer(policy: AnswerPolicy, results: RetrievalResult[], confidence: "high" | "medium" | "low"): string {
  const bullets = sourceBullets(results, confidence, false);
  const evidence = bullets.length ? ["", "Relevantné zdroje hovoria:", "", ...bullets] : [];
  if (policy.sensitiveKind === "savings") {
    return ["Neviem presne povedať, koľko ušetríte za rok. Závisí to od domu, tepelnej straty, spotreby, nastavenia systému, nákladov a cien energií.", ...evidence].join("\n");
  }
  if (policy.sensitiveKind === "subsidy") {
    return ["Neviem garantovať dotáciu. Podľa dostupných zdrojov dotácie závisia od pravidiel programu, oprávnenosti žiadateľa, dostupného rozpočtu a správnosti žiadosti.", ...evidence].join("\n");
  }
  if (policy.sensitiveKind === "diy") {
    return ["Podľa dostupných zdrojov je pri tepelnom čerpadle dôležitý odborný návrh, odborná montáž a servis. Svojpomocnú montáž by som neodporúčal prezentovať ako bezpečnú alebo vhodnú bez odbornej kontroly.", ...evidence].join("\n");
  }
  return ["Neviem garantovať návratnosť tepelného čerpadla. Dá sa o nej hovoriť len orientačne podľa konkrétneho domu, spotreby, cien energií, technického riešenia a kvality návrhu.", ...evidence].join("\n");
}

function composeAnswer(message: string, results: RetrievalResult[], confidence: "high" | "medium" | "low", intent: SalesIntent, policy: AnswerPolicy): string {
  const top = results[0];

  if (policy.kind === "adversarial") {
    return "Nemôžem ignorovať zdroje ani vymýšľať informácie, ktoré nie sú vo webových podkladoch. Neviem povedať presnú cenu alebo tvrdenie bez opory v zdrojoch.";
  }

  if (policy.kind === "out_of_scope") {
    return [
      "Na webe som nenašiel dostatočne jasnú odpoveď na túto otázku.",
      "",
      "Skúste sa opýtať konkrétnejšie na tepelné čerpadlá, servis, dotácie, montáž, hlučnosť alebo kontakt.",
    ].join("\n");
  }

  if (policy.kind === "sensitive") return composeSensitiveAnswer(policy, results, confidence);

  if (policy.kind === "ambiguous") {
    const bullets = sourceBullets(results, confidence, intent === "contact");
    const intro = bullets.length ? "Podľa dostupných zdrojov viem zatiaľ odpovedať len všeobecne:" : "Na toto potrebujem trochu viac kontextu.";
    const leadIn = topicLeadIn(message);
    return [intro, "", leadIn, ...bullets, "", policy.followUp].filter(Boolean).join("\n");
  }

  if (!top || confidence === "low") {
    return [
      "Na webe som nenašiel dostatočne jasnú odpoveď na túto otázku.",
      "",
      "Skúste sa opýtať konkrétnejšie na tepelné čerpadlá, servis, dotácie, montáž, hlučnosť alebo kontakt.",
    ].join("\n");
  }

  const bullets = sourceBullets(results, confidence, intent === "contact");
  const leadIn = topicLeadIn(message);
  const intro =
    confidence === "high"
      ? "Podľa nájdených informácií na webe:"
      : "Podľa dostupných informácií web uvádza, ale výsledok berte ako menej istý:";

  return [
    intro,
    "",
    leadIn,
    ...bullets,
    "",
    `Najrelevantnejší zdroj: ${top.chunk.pageTitle} (${top.chunk.url})`,
  ].filter(Boolean).join("\n");
}

export async function createChatResponse(requestBody: ChatRequest, knowledgePath?: string): Promise<ChatResponse> {
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
  const knowledge = await loadKnowledge(knowledgePath);
  const retrieval = retrieveKnowledge(knowledge, message, 5);
  const topResult = retrieval.results[0];
  const topScore = topResult?.score.finalScore || 0;
  const confidence = confidenceFromResult(topResult);
  const sourceResults = confidence === "low" ? retrieval.results.slice(0, 2) : retrieval.results.slice(0, 3);
  const sources = sourceResults.map(sourceFromResult);
  const intent = detectIntent(message, retrieval.results);
  let answerPolicy = classifyAnswerPolicy(message, intent);
  const previousState = parseState(conversation.qualification_state_json);
  if (answerPolicy.kind === "ambiguous" && (previousState.relevant_turns || 0) >= 3) {
    answerPolicy = { kind: "normal" };
  }
  const nextState = updateQualificationState(previousState, message, intent);
  const contact = extractContact(message);
  const leadCaptured = Boolean(contact.email || contact.phone);
  let leadCapture = nextLeadQuestion(nextState, intent, confidence);
  if (answerPolicy.kind === "out_of_scope" || answerPolicy.kind === "adversarial" || answerPolicy.kind === "sensitive") {
    leadCapture = { shouldAsk: false, nextQuestion: null, mode: nextState.assistant_mode || "informative", isContactRequest: false };
  } else if (answerPolicy.kind === "ambiguous" && answerPolicy.followUp) {
    leadCapture = { shouldAsk: true, nextQuestion: answerPolicy.followUp, mode: "informative", isContactRequest: false };
  }
  const finalState = leadCaptured ? nextState : applyLeadDecision(nextState, leadCapture);
  const score = leadScore(finalState, intent);
  const previousMessages = getConversationMessages(conversation.id);

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
  insertRetrievalEvent({ conversationId: conversation.id, query: message, topScore, confidence, topSources: sources });
  insertEvent({
    siteId: site.id,
    sessionId: session.id,
    conversationId: conversation.id,
    eventType: "retrieval_performed",
    payload: { topScore, confidence, results: sources.length },
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

  let answer = composeAnswer(message, retrieval.results, confidence, intent, answerPolicy);
  if (leadCaptured) {
    const transcript = getConversationMessages(conversation.id);
    upsertLead({
      conversationId: conversation.id,
      siteId: site.id,
      name: finalState.contact_name,
      email: finalState.contact_email,
      phone: finalState.contact_phone,
      projectType: finalState.project_type,
      location: finalState.location,
      timeline: finalState.timeline,
      budget: undefined,
      intent,
      score,
      transcript,
    });
    updateConversation(conversation.id, {
      status: "lead_captured",
      intent,
      qualificationStateJson: JSON.stringify(finalState),
    });
    insertEvent({
      siteId: site.id,
      sessionId: session.id,
      conversationId: conversation.id,
      eventType: "lead_captured",
      payload: { score, email: Boolean(finalState.contact_email), phone: Boolean(finalState.contact_phone) },
    });
    answer = "Ďakujem, mám to. Odovzdám dopyt technikovi/obchodníkovi. Ak treba, doplním k nemu aj kontext z tejto konverzácie.";
  } else {
    updateConversation(conversation.id, {
      intent,
      qualificationStateJson: JSON.stringify(finalState),
    });
    if (leadCapture.shouldAsk && leadCapture.nextQuestion && answerPolicy.kind !== "ambiguous") {
      insertEvent({
        siteId: site.id,
        sessionId: session.id,
        conversationId: conversation.id,
        eventType: "lead_question_asked",
        payload: { nextQuestion: leadCapture.nextQuestion, intent },
      });
      answer = `${answer}\n\n${leadCapture.nextQuestion}`;
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
