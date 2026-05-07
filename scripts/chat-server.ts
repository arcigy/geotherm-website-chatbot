import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { type KnowledgeChunk, retrieveKnowledge, type RetrievalResult } from "./local-retrieval";

type ChatRequest = {
  message?: string;
  currentUrl?: string;
  siteId?: string;
};

type ChatSource = {
  pageTitle: string;
  url: string;
  sectionHeading: string;
  snippet: string;
};

type ChatResponse = {
  answer: string;
  confidence: "high" | "medium" | "low";
  topScore: number;
  sources: ChatSource[];
  action: null;
};

type StartOptions = {
  port?: number;
  host?: string;
  knowledgePath?: string;
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

function composeAnswer(message: string, results: RetrievalResult[]): string {
  const top = results[0];
  const confidence = confidenceFromResult(top);

  if (!top || confidence === "low") {
    return [
      "Na webe som nenašiel dostatočne jasnú odpoveď na túto otázku.",
      "",
      "Skúste sa opýtať konkrétnejšie na tepelné čerpadlá, servis, dotácie, montáž, hlučnosť alebo kontakt.",
    ].join("\n");
  }

  const usefulResults = results.slice(0, confidence === "high" ? 3 : 2);
  const intro =
    confidence === "high"
      ? "Podľa nájdených informácií na webe:"
      : "Podľa dostupných informácií web uvádza, ale výsledok berte ako menej istý:";
  const bullets = usefulResults.map((result) => {
    const text = result.snippet || result.chunk.text;
    return `- ${text}`;
  });

  return [
    intro,
    "",
    ...bullets,
    "",
    `Najrelevantnejší zdroj: ${top.chunk.pageTitle} (${top.chunk.url})`,
    "",
    `Otázka: ${message}`,
  ].join("\n");
}

export async function createChatResponse(requestBody: ChatRequest, knowledgePath?: string): Promise<ChatResponse> {
  const message = typeof requestBody.message === "string" ? requestBody.message.trim() : "";
  if (!message) {
    return {
      answer: "Chýba text otázky.",
      confidence: "low",
      topScore: 0,
      sources: [],
      action: null,
    };
  }

  const knowledge = await loadKnowledge(knowledgePath);
  const retrieval = retrieveKnowledge(knowledge, message, 5);
  const topResult = retrieval.results[0];
  const topScore = topResult?.score.finalScore || 0;
  const confidence = confidenceFromResult(topResult);
  const sourceResults = confidence === "low" ? retrieval.results.slice(0, 2) : retrieval.results.slice(0, 3);

  return {
    answer: composeAnswer(message, retrieval.results),
    confidence,
    topScore,
    sources: sourceResults.map(sourceFromResult),
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
      writeJson(response, 404, { error: "Not found" }, origin);
      return;
    }

    try {
      const body = await readJsonBody(request);
      if (!isChatRequest(body)) {
        writeJson(response, 400, { error: "Request must include message." }, origin);
        return;
      }

      const chatResponse = await createChatResponse(body, knowledgePath);
      writeJson(response, 200, chatResponse, origin);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      writeJson(response, 500, { error: message }, origin);
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
