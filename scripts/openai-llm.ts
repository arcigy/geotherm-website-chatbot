import { loadLocalEnv } from "./env";

type ChatSource = {
  pageTitle: string;
  url: string;
  sectionHeading: string;
  snippet: string;
};

type Message = {
  role: string;
  content: string;
};

type LeadProfile = {
  description: string;
  interestLevel: "low" | "medium" | "high";
  stage: string;
  customerSignals: string[];
  riskNotes: string[];
};

type LlmProvider = "gemini" | "openai";

export type AnswerMode =
  | "rag_answer"
  | "safety_ai"
  | "safety_fallback"
  | "out_of_scope"
  | "lead_capture"
  | "contact_intent"
  | "low_confidence"
  | "general_chat"
  | "short_followup"
  | "qualification_question"
  | "diagnostic_verdict"
  | "recommendation_closure"
  | "direct_answer"
  | "brand_model_answer"
  | "price_answer"
  | "correction_answer"
  | "handoff_cta"
  | "service_fault_triage"
  | "ai_fallback";

export type StructuredAnswer = {
  shortAnswer: string;
  details: string[];
  followUpQuestion: string | null;
  shouldAskFollowUp: boolean;
  safetyNote: string | null;
  confidence: "high" | "medium" | "low";
};

export type RetrievalRouteDecision = {
  needsRetrieval: boolean;
  retrievalQuery: string | null;
  contextTopic: string | null;
  intentHint: string | null;
  answerMode: AnswerMode;
  confidence: "high" | "medium" | "low";
  reason: string;
};

export type LlmComposeInput = {
  message: string;
  intent: string;
  confidence: "high" | "medium" | "low";
  answerMode?: AnswerMode;
  sources: ChatSource[];
  previousMessages: Message[];
  qualificationState: unknown;
  leadCapture: {
    shouldAsk: boolean;
    nextQuestion: string | null;
  };
  retrievalUsed: boolean;
  policyKind: string;
  fallbackAnswer: string;
  lastAskedQuestion?: string;
};

export type LlmComposeResult = {
  used: boolean;
  provider: LlmProvider;
  model: string;
  answer: string;
  answerMode: AnswerMode;
  structuredAnswer?: StructuredAnswer;
  leadProfile?: LeadProfile;
  validationErrors?: string[];
  rawResponse?: string;
  repaired?: boolean;
  error?: string;
};

export type LlmRouteResult = {
  used: boolean;
  provider: LlmProvider;
  model: string;
  decision?: RetrievalRouteDecision;
  rawResponse?: string;
  error?: string;
};

type RawLlmResult = {
  provider: LlmProvider;
  model: string;
  content?: string;
  error?: string;
};

type ParsedStructured = {
  answerMode: AnswerMode;
  structuredAnswer: StructuredAnswer;
  leadProfile?: LeadProfile;
};

const answerModes: AnswerMode[] = [
  "rag_answer",
  "safety_ai",
  "safety_fallback",
  "out_of_scope",
  "lead_capture",
  "contact_intent",
  "low_confidence",
  "general_chat",
  "short_followup",
  "qualification_question",
  "diagnostic_verdict",
  "recommendation_closure",
  "direct_answer",
  "brand_model_answer",
  "price_answer",
  "correction_answer",
  "handoff_cta",
  "service_fault_triage",
  "ai_fallback",
];
const confidenceValues = ["high", "medium", "low"] as const;

export function llmProvider(): LlmProvider {
  loadLocalEnv();
  const configured = (process.env.LLM_PROVIDER || "").toLowerCase();
  if (configured === "openai") return "openai";
  if (configured === "gemini") return "gemini";
  return process.env.GEMINI_API_KEY ? "gemini" : "openai";
}

export function llmModel(provider = llmProvider()): string {
  loadLocalEnv();
  if (provider === "gemini") return process.env.GEMINI_MODEL || "gemini-flash-lite-latest";
  return process.env.OPENAI_MODEL || "gpt-4o-mini";
}

export function openAiModel(): string {
  return llmModel("openai");
}

export function isLlmAvailable(): boolean {
  loadLocalEnv();
  if (process.env.ARCIGY_LLM_ENABLED === "false") return false;
  const provider = llmProvider();
  return provider === "gemini" ? Boolean(process.env.GEMINI_API_KEY) : Boolean(process.env.OPENAI_API_KEY);
}

function compactHistory(messages: Message[]): Message[] {
  return messages
    .filter((message) => message.role === "user" || message.role === "assistant")
    .slice(-10)
    .map((message) => ({
      role: message.role,
      content: message.content.replace(/\s+/g, " ").slice(0, 900),
    }));
}

function compactRouteHistory(messages: Message[]): Message[] {
  return messages
    .filter((message) => message.role === "user" || message.role === "assistant")
    .slice(-6)
    .map((message) => ({
      role: message.role,
      content: message.content.replace(/\s+/g, " ").slice(0, 320),
    }));
}

function defaultAnswerMode(input: LlmComposeInput): AnswerMode {
  if (input.answerMode) return input.answerMode;
  if (input.policyKind === "out_of_scope" || input.intent === "irrelevant") return "out_of_scope";
  if (input.policyKind === "sensitive") return "safety_fallback";
  if (input.intent === "contact") return "contact_intent";
  if (input.confidence === "low") return "low_confidence";
  return "rag_answer";
}

function schemaContract(): object {
  return {
    answerMode: "rag_answer | safety_fallback | out_of_scope | lead_capture | contact_intent | low_confidence | general_chat | short_followup",
    structuredAnswer: {
      shortAnswer: "1-2 short Slovak sentences, no Markdown, no links",
      details: ["0-4 short Slovak supporting points, no Markdown"],
      followUpQuestion: "one Slovak question or null",
      shouldAskFollowUp: "boolean",
      safetyNote: "short safety note or null",
      confidence: "high | medium | low",
    },
    leadProfile: {
      description: "optional internal lead description, observed facts only",
      interestLevel: "low | medium | high",
      stage: "short stage label",
      customerSignals: ["observed facts only"],
      riskNotes: ["uncertainties or safety notes"],
    },
  };
}

function structuredResponseSchema(): object {
  return {
    type: "OBJECT",
    properties: {
      answerMode: { type: "STRING", enum: answerModes },
      structuredAnswer: {
        type: "OBJECT",
        properties: {
          shortAnswer: { type: "STRING" },
          details: { type: "ARRAY", items: { type: "STRING" } },
          followUpQuestion: { type: "STRING", nullable: true },
          shouldAskFollowUp: { type: "BOOLEAN" },
          safetyNote: { type: "STRING", nullable: true },
          confidence: { type: "STRING", enum: ["high", "medium", "low"] },
        },
        required: ["shortAnswer", "details", "shouldAskFollowUp", "confidence"],
      },
      leadProfile: {
        type: "OBJECT",
        nullable: true,
        properties: {
          description: { type: "STRING" },
          interestLevel: { type: "STRING", enum: ["low", "medium", "high"] },
          stage: { type: "STRING" },
          customerSignals: { type: "ARRAY", items: { type: "STRING" } },
          riskNotes: { type: "ARRAY", items: { type: "STRING" } },
        },
      },
    },
    required: ["answerMode", "structuredAnswer"],
  };
}

function routeSchemaContract(): object {
  return {
    needsRetrieval: "boolean",
    retrievalQuery: "string or null. If using prior context, rewrite as a standalone Slovak search query.",
    contextTopic: "string or null",
    intentHint: "quote | service | subsidy | product | installation | noise | contact | irrelevant | unknown",
    answerMode: "rag_answer | safety_fallback | out_of_scope | lead_capture | contact_intent | low_confidence | general_chat | short_followup",
    confidence: "high | medium | low",
    reason: "short internal reason",
  };
}

function routeResponseSchema(): object {
  return {
    type: "OBJECT",
    properties: {
      needsRetrieval: { type: "BOOLEAN" },
      retrievalQuery: { type: "STRING", nullable: true },
      contextTopic: { type: "STRING", nullable: true },
      intentHint: { type: "STRING" },
      answerMode: { type: "STRING", enum: answerModes },
      confidence: { type: "STRING", enum: ["high", "medium", "low"] },
      reason: { type: "STRING" },
    },
    required: ["needsRetrieval", "answerMode", "confidence", "reason"],
  };
}

function systemPrompt(): string {
  return [
    "You are a structured answer planner for a Slovak HVAC sales advisor.",
    "Return JSON only. No Markdown. No prose outside JSON. No code fences.",
    "Do not write the final chatbot formatting. The server renders Markdown deterministically.",
    "Use Slovak language.",
    "Tone: friendly, professional, clear for a layperson.",
    "Always use informal Slovak tykanie: ty, tebe, ti, tvoj. Never use formal vykanie: Vy, Vám, Váš.",
    "Answer briefly and concretely.",
    "Use only provided sources for company facts, services, prices, contacts, guarantees, availability, brands, and exact conditions.",
    "General HVAC explanation is allowed only as high-level context and must not create unsupported company claims.",
    "Never invent exact prices, subsidies, savings, installation dates, availability, warranties, certifications, or guarantees.",
    "Never provide technical repair steps, electrical wiring steps, pressure settings, refrigerant handling, disassembly, or DIY instructions.",
    "Ask at most one follow-up question.",
    "Do not request phone, email, or name unless the input explicitly says the user wants to be contacted or the mode is lead_capture.",
    "When uncertain, say it depends on the concrete case and ask one clarifying question.",
    "For general_chat mode: answer naturally, do not use sources, do not claim exact website facts, and keep it short.",
  ].join("\n");
}

function dialogContextBlock(lastAskedQuestion: string | undefined): string | null {
  const question = normalizeText(lastAskedQuestion, 220);
  if (!question) return null;
  return [
    "DIALOG CONTEXT: The last question you asked the user was:",
    `"${question}"`,
    "The user's current message is their direct answer to that question.",
    "Before doing anything else, interpret their answer in context of that question and update your understanding of their situation accordingly.",
  ].join("\n");
}

function userPayload(input: LlmComposeInput): string {
  const dialogContext = dialogContextBlock(input.lastAskedQuestion);
  if (defaultAnswerMode(input) === "general_chat") {
    return JSON.stringify(
      {
        task: "Return compact JSON only for a general conversational message that does not need retrieval.",
        schema: schemaContract(),
        mode: "general_chat",
        rules: {
          noRagNeeded: true,
          noSourcesNeeded: true,
          useTykanie: true,
          noHVACAbbreviation: true,
          maxDetails: 2,
          maxQuestions: 1,
          fallbackIfUnsure: input.fallbackAnswer,
        },
        ...(dialogContext ? { dialogContext } : {}),
        currentUserMessage: input.message,
        recentConversation: compactHistory(input.previousMessages).slice(-6),
      },
      null,
      2,
    );
  }

  return JSON.stringify(
    {
      task: "Create a strict structured answer object. Do not create Markdown.",
      schema: schemaContract(),
      mode: defaultAnswerMode(input),
      rules: {
        retrievalUsed: input.retrievalUsed,
        intent: input.intent,
        confidence: input.confidence,
        policyKind: input.policyKind,
        noRagNeeded: defaultAnswerMode(input) === "general_chat",
        preferredFollowUpQuestion: input.leadCapture.nextQuestion,
        shouldAskFollowUp: input.leadCapture.shouldAsk,
        maxDetails: 4,
        maxQuestions: 1,
        forbiddenGenericFallbackPhrases: defaultAnswerMode(input) === "general_chat" ? ["nemám podklad", "nenašiel som", "neviem odpovedať zo zdrojov"] : [],
        fallbackIfUnsure: input.fallbackAnswer,
      },
      ...(dialogContext ? { dialogContext } : {}),
      currentUserMessage: input.message,
      conversationHistory: compactHistory(input.previousMessages),
      qualificationState: input.qualificationState,
      sources: input.sources.map((source, index) => ({
        id: index + 1,
        pageTitle: source.pageTitle,
        sectionHeading: source.sectionHeading,
        url: source.url,
        snippet: source.snippet.slice(0, 900),
      })),
    },
    null,
    2,
  );
}

function repairPayload(input: LlmComposeInput, rawResponse: string, validationErrors: string[]): string {
  return JSON.stringify(
    {
      task: "Repair the previous model response so it strictly matches the schema. Return JSON only.",
      schema: schemaContract(),
      validationErrors,
      invalidRawResponse: rawResponse.slice(0, 4000),
      originalRequest: JSON.parse(userPayload(input)) as unknown,
    },
    null,
    2,
  );
}

function routePayload(input: { message: string; previousMessages: Message[] }): string {
  return JSON.stringify(
    {
      task: "Decide whether the assistant needs to use local website knowledge retrieval before answering.",
      schema: routeSchemaContract(),
      rules: [
        "CRITICAL: act as the AI decision layer before retrieval. Decide if the website search tool is needed and how to query it.",
        "If the user gives a short follow-up like novy, novy projekt, ano, nie, rekonstrukcia, inherit the prior HVAC topic and rewrite the retrieval query with that context.",
        "For novy/novy projekt after heat-pump advice, use a query about tepelne cerpadlo novostavba navrh domu podlahove kurenie chladenie tepla voda projekt, not news or factory pages.",
        "If the user asks whether Geotherm can come to, service, install, inspect, or do work in any city/town/district/location, needsRetrieval must be true and retrievalQuery must be about Geotherm posobnost okresy prideme nainstalovat, not the city alone.",
        "Never search one generic word alone.",
        "Return JSON only.",
        "Use the whole recent conversation, not only the latest user message.",
        "If the latest message is a short answer to the previous assistant follow-up, inherit the previous topic.",
        "Do not switch topic just because the short answer contains generic words like rekonštrukcia, dom, cena, áno, nie.",
        "For HVAC/company/product/service/contact/price/subsidy questions, needsRetrieval should usually be true.",
        "For greetings, thanks, simple social chat, or purely conversational acknowledgements, needsRetrieval should be false.",
        "For out-of-scope topics, needsRetrieval should be false and answerMode should be out_of_scope.",
        "If retrieval is needed, retrievalQuery must be a standalone Slovak query with inherited topic included.",
      ],
      currentUserMessage: input.message,
      recentConversation: compactRouteHistory(input.previousMessages),
    },
    null,
    2,
  );
}

function extractJson(value: string): unknown {
  const trimmed = value.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) throw new Error("No JSON object found in model response.");
    return JSON.parse(trimmed.slice(start, end + 1));
  }
}

function normalizeText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  const cleaned = value
    .replace(/```[\s\S]*?```/g, "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/\|/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (cleaned.length <= maxLength) return cleaned;
  const sliced = cleaned.slice(0, maxLength).replace(/\s+\S*$/, "").trim();
  return sliced || cleaned.slice(0, maxLength).trim();
}

function firstQuestion(value: unknown): string | null {
  const cleaned = normalizeText(value, 180);
  if (!cleaned) return null;
  const match = cleaned.match(/[^?]+\?/);
  const question = (match?.[0] || cleaned.replace(/\?/g, "").trim()).trim();
  if (!question) return null;
  return question.endsWith("?") ? question : `${question}?`;
}

function normalizeDetails(value: unknown): string[] {
  const raw = Array.isArray(value) ? value : typeof value === "string" ? [value] : [];
  const seen = new Set<string>();
  const details: string[] = [];
  for (const item of raw) {
    const detail = normalizeText(item, 220);
    const key = detail.toLowerCase();
    if (!detail || seen.has(key)) continue;
    seen.add(key);
    details.push(detail);
    if (details.length >= 4) break;
  }
  return details;
}

function normalizeConfidence(value: unknown, fallback: "high" | "medium" | "low"): "high" | "medium" | "low" {
  return confidenceValues.includes(value as "high" | "medium" | "low") ? (value as "high" | "medium" | "low") : fallback;
}

function normalizeMode(value: unknown, fallback: AnswerMode): AnswerMode {
  return answerModes.includes(value as AnswerMode) ? (value as AnswerMode) : fallback;
}

function validateRouteDecision(raw: string): { ok: true; value: RetrievalRouteDecision } | { ok: false; error: string } {
  let parsed: unknown;
  try {
    parsed = extractJson(raw);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
  if (!parsed || typeof parsed !== "object") return { ok: false, error: "JSON root must be an object." };
  const root = parsed as Record<string, unknown>;
  const needsRetrieval = Boolean(root.needsRetrieval);
  const retrievalQuery = normalizeText(root.retrievalQuery, 220) || null;
  const contextTopic = normalizeText(root.contextTopic, 120) || null;
  const intentHint = normalizeText(root.intentHint, 40) || null;
  const answerMode = normalizeMode(root.answerMode, needsRetrieval ? "rag_answer" : "general_chat");
  const confidence = normalizeConfidence(root.confidence, "medium");
  const reason = normalizeText(root.reason, 220) || "llm_router";
  if (needsRetrieval && !retrievalQuery) return { ok: false, error: "retrievalQuery is required when needsRetrieval is true." };
  return {
    ok: true,
    value: {
      needsRetrieval,
      retrievalQuery,
      contextTopic,
      intentHint,
      answerMode,
      confidence,
      reason,
    },
  };
}

function normalizeLeadProfile(value: unknown): LeadProfile | undefined {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  const description = normalizeText(record.description, 600);
  if (!description) return undefined;
  const interestLevel = ["low", "medium", "high"].includes(String(record.interestLevel))
    ? (record.interestLevel as "low" | "medium" | "high")
    : "medium";
  return {
    description,
    interestLevel,
    stage: normalizeText(record.stage, 120) || "nezistené",
    customerSignals: normalizeDetails(record.customerSignals),
    riskNotes: normalizeDetails(record.riskNotes),
  };
}

function validateStructuredResponse(raw: string, input: LlmComposeInput): { ok: true; value: ParsedStructured; warnings: string[] } | { ok: false; errors: string[] } {
  let parsed: unknown;
  try {
    parsed = extractJson(raw);
  } catch (error) {
    return { ok: false, errors: [error instanceof Error ? error.message : String(error)] };
  }

  if (!parsed || typeof parsed !== "object") return { ok: false, errors: ["JSON root must be an object."] };
  const root = parsed as Record<string, unknown>;
  const candidate =
    root.structuredAnswer && typeof root.structuredAnswer === "object"
      ? (root.structuredAnswer as Record<string, unknown>)
      : root;
  const errors: string[] = [];
  const warnings: string[] = [];
  const mode = normalizeMode(root.answerMode, defaultAnswerMode(input));
  const shortAnswer = normalizeText(candidate.shortAnswer ?? root.shortAnswer ?? root.answer, 340);
  if (!shortAnswer) errors.push("structuredAnswer.shortAnswer is required.");

  const details = normalizeDetails(candidate.details);
  const shouldAskFollowUp = Boolean(candidate.shouldAskFollowUp ?? input.leadCapture.shouldAsk);
  let followUpQuestion = firstQuestion(candidate.followUpQuestion);
  if (shouldAskFollowUp && !followUpQuestion && input.leadCapture.nextQuestion) {
    followUpQuestion = firstQuestion(input.leadCapture.nextQuestion);
    warnings.push("followUpQuestion repaired from server hint.");
  }
  const safetyNote = normalizeText(candidate.safetyNote, 220) || null;
  const confidence = normalizeConfidence(candidate.confidence, input.confidence);

  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      answerMode: mode,
      structuredAnswer: {
        shortAnswer,
        details,
        followUpQuestion,
        shouldAskFollowUp: Boolean(followUpQuestion && shouldAskFollowUp),
        safetyNote,
        confidence,
      },
      leadProfile: normalizeLeadProfile(root.leadProfile),
    },
    warnings,
  };
}

function normalizeGeminiModel(model: string): string {
  return model.replace(/^models\//, "");
}

function geminiCandidateModels(): string[] {
  const primary = llmModel("gemini");
  const stable = process.env.GEMINI_STABLE_MODEL || "gemini-2.5-flash";
  const fallback = (process.env.GEMINI_FALLBACK_MODELS || "gemini-2.5-flash-lite")
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean);
  return [...new Set([stable, primary, ...fallback])];
}

function requestTimeoutSignal(timeoutMs?: number): AbortSignal {
  const configured = Number.parseInt(process.env.LLM_REQUEST_TIMEOUT_MS || "12000", 10);
  const effective = timeoutMs || (Number.isFinite(configured) && configured > 0 ? configured : 12000);
  return AbortSignal.timeout(effective);
}

function isTransientGeminiError(error: string): boolean {
  const text = error.toLowerCase();
  return text.includes("high demand") || text.includes("temporar") || text.includes("timeout") || text.includes("429") || text.includes("503");
}

type RawCallOptions = {
  maxOutputTokens?: number;
  timeoutMs?: number;
  singleCandidate?: boolean;
  systemPrompt?: string;
  responseMimeType?: "application/json" | "text/plain";
  responseSchema?: object;
};

async function callGeminiRaw(prompt: string, options: RawCallOptions = {}): Promise<RawLlmResult> {
  const provider: LlmProvider = "gemini";
  const model = llmModel(provider);
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || process.env.ARCIGY_LLM_ENABLED === "false") {
    return { provider, model, error: "GEMINI_API_KEY is not configured." };
  }

  let lastError = "";
  const retryAttempts = Math.max(1, Number.parseInt(process.env.GEMINI_RETRY_ATTEMPTS || "2", 10));
  const candidateModels = options.singleCandidate ? [model] : geminiCandidateModels();
  for (const candidateModel of candidateModels) {
    for (let attempt = 1; attempt <= retryAttempts; attempt += 1) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${normalizeGeminiModel(candidateModel)}:generateContent`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": apiKey,
            },
            body: JSON.stringify({
              system_instruction: {
                parts: [{ text: options.systemPrompt || systemPrompt() }],
              },
              contents: [
                {
                  role: "user",
                  parts: [{ text: prompt }],
                },
              ],
              generationConfig: {
                temperature: 0.25,
                maxOutputTokens: options.maxOutputTokens || 900,
                ...(options.responseMimeType === "text/plain" ? {} : { responseMimeType: "application/json" }),
                ...(options.responseSchema ? { responseSchema: options.responseSchema } : {}),
              },
            }),
            signal: requestTimeoutSignal(options.timeoutMs),
          },
        );
        const body = (await response.json()) as {
          error?: { message?: string };
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        };
        if (!response.ok) throw new Error(body.error?.message || `Gemini HTTP ${response.status}`);
        const content = body.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim();
        if (!content) throw new Error("Gemini response had no content.");
        return { provider, model: candidateModel, content };
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        if (!isTransientGeminiError(lastError)) return { provider, model: candidateModel, error: lastError };
        await new Promise((resolve) => setTimeout(resolve, attempt * 350));
      }
    }
  }
  return { provider, model, error: lastError || "Gemini call failed." };
}

async function callOpenAiRaw(prompt: string, options: RawCallOptions = {}): Promise<RawLlmResult> {
  const provider: LlmProvider = "openai";
  const model = llmModel(provider);
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || process.env.ARCIGY_LLM_ENABLED === "false") {
    return { provider, model, error: "OPENAI_API_KEY is not configured." };
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.25,
        max_tokens: options.maxOutputTokens || 900,
        ...(options.responseMimeType === "text/plain" ? {} : { response_format: { type: "json_object" } }),
        messages: [
          { role: "system", content: options.systemPrompt || systemPrompt() },
          { role: "user", content: prompt },
        ],
      }),
      signal: requestTimeoutSignal(options.timeoutMs),
    });
    const body = (await response.json()) as {
      error?: { message?: string };
      choices?: Array<{ message?: { content?: string } }>;
    };
    if (!response.ok) throw new Error(body.error?.message || `OpenAI HTTP ${response.status}`);
    const content = body.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error("OpenAI response had no content.");
    return { provider, model, content };
  } catch (error) {
    return { provider, model, error: error instanceof Error ? error.message : String(error) };
  }
}

async function callRaw(prompt: string, options: RawCallOptions = {}, provider = llmProvider()): Promise<RawLlmResult> {
  return provider === "gemini" ? callGeminiRaw(prompt, options) : callOpenAiRaw(prompt, options);
}

export async function callLlmText(input: {
  systemPrompt: string;
  prompt: string;
  maxOutputTokens?: number;
  timeoutMs?: number;
  responseMimeType?: "application/json" | "text/plain";
  provider?: LlmProvider;
  singleCandidate?: boolean;
}): Promise<RawLlmResult> {
  loadLocalEnv();
  return callRaw(
    input.prompt,
    {
      systemPrompt: input.systemPrompt,
      maxOutputTokens: input.maxOutputTokens,
      timeoutMs: input.timeoutMs,
      singleCandidate: input.singleCandidate ?? false,
      responseMimeType: input.responseMimeType || "text/plain",
    },
    input.provider,
  );
}

export async function composeWithLlm(input: LlmComposeInput): Promise<LlmComposeResult> {
  loadLocalEnv();
  const provider = llmProvider();
  const mode = defaultAnswerMode(input);
  const callOptions =
    mode === "general_chat"
      ? {
          maxOutputTokens: 900,
          timeoutMs: Number.parseInt(process.env.LLM_FAST_REQUEST_TIMEOUT_MS || "12000", 10),
          singleCandidate: false,
          systemPrompt: "Return valid JSON only. Slovak friendly advisor. No Markdown. Always use informal Slovak tykanie: ty, tebe, ti, tvoj. Never use formal vykanie. This message does not need retrieval. Answer the actual user message naturally, briefly, and with at most one follow-up question.",
          responseSchema: structuredResponseSchema(),
        }
      : {
          maxOutputTokens: 900,
          timeoutMs: Number.parseInt(process.env.LLM_ANSWER_TIMEOUT_MS || "8000", 10),
          singleCandidate: false,
          responseSchema: structuredResponseSchema(),
        };
  if (process.env.ARCIGY_LLM_ENABLED === "false") {
    return { used: false, provider, model: llmModel(provider), answerMode: mode, answer: input.fallbackAnswer, error: "LLM is disabled." };
  }

  const first = await callRaw(userPayload(input), callOptions);
  if (!first.content) {
    return {
      used: false,
      provider: first.provider,
      model: first.model,
      answerMode: mode,
      answer: input.fallbackAnswer,
      error: first.error || "LLM returned no content.",
    };
  }

  const parsed = validateStructuredResponse(first.content, input);
  if (parsed.ok) {
    return {
      used: true,
      provider: first.provider,
      model: first.model,
      answerMode: parsed.value.answerMode,
      answer: parsed.value.structuredAnswer.shortAnswer,
      structuredAnswer: parsed.value.structuredAnswer,
      leadProfile: parsed.value.leadProfile,
      validationErrors: parsed.warnings,
      rawResponse: first.content,
    };
  }

  const repair = await callRaw(repairPayload(input, first.content, parsed.errors), {
    ...callOptions,
    timeoutMs: Number.parseInt(process.env.LLM_REPAIR_TIMEOUT_MS || "3000", 10),
  });
  if (repair.content) {
    const repaired = validateStructuredResponse(repair.content, input);
    if (repaired.ok) {
      return {
        used: true,
        provider: repair.provider,
        model: repair.model,
        answerMode: repaired.value.answerMode,
        answer: repaired.value.structuredAnswer.shortAnswer,
        structuredAnswer: repaired.value.structuredAnswer,
        leadProfile: repaired.value.leadProfile,
        validationErrors: repaired.warnings,
        rawResponse: repair.content,
        repaired: true,
      };
    }
    parsed.errors.push(...repaired.errors.map((error) => `repair: ${error}`));
  } else if (repair.error) {
    parsed.errors.push(`repair call failed: ${repair.error}`);
  }

  return {
    used: false,
    provider: first.provider,
    model: first.model,
    answerMode: mode,
    answer: input.fallbackAnswer,
    validationErrors: parsed.errors,
    rawResponse: first.content,
    error: parsed.errors.join("; "),
  };
}

export async function composeWithOpenAi(input: LlmComposeInput): Promise<LlmComposeResult> {
  return composeWithLlm(input);
}

export async function planRetrievalWithLlm(input: { message: string; previousMessages: Message[] }): Promise<LlmRouteResult> {
  loadLocalEnv();
  const provider = llmProvider();
  if (process.env.ARCIGY_LLM_ENABLED === "false") {
    return { used: false, provider, model: llmModel(provider), error: "LLM is disabled." };
  }

  const result = await callRaw(routePayload(input), {
    maxOutputTokens: 420,
    timeoutMs: Number.parseInt(process.env.LLM_ROUTER_TIMEOUT_MS || "3000", 10),
    singleCandidate: false,
    responseSchema: routeResponseSchema(),
    systemPrompt: [
      "You are a JSON-only router for a Slovak HVAC assistant.",
      "Do not answer the user.",
      "Only decide whether retrieval is needed and write a contextual standalone retrieval query.",
      "Return valid JSON only. No Markdown. No prose outside JSON.",
    ].join("\n"),
  });
  if (!result.content) {
    return {
      used: false,
      provider: result.provider,
      model: result.model,
      error: result.error || "Router returned no content.",
    };
  }
  const parsed = validateRouteDecision(result.content);
  if (!parsed.ok) {
    return {
      used: false,
      provider: result.provider,
      model: result.model,
      rawResponse: result.content,
      error: parsed.error,
    };
  }
  return {
    used: true,
    provider: result.provider,
    model: result.model,
    decision: parsed.value,
    rawResponse: result.content,
  };
}

export async function describeLeadWithLlm(input: {
  messages: Message[];
  qualificationState: unknown;
  intent: string;
  score: number;
}): Promise<LeadProfile | null> {
  const result = await composeWithLlm({
    message: "Vytvor interný opis leadu podľa transcriptu.",
    intent: input.intent,
    confidence: "medium",
    answerMode: "lead_capture",
    sources: [],
    previousMessages: input.messages,
    qualificationState: input.qualificationState,
    leadCapture: { shouldAsk: false, nextQuestion: null },
    retrievalUsed: false,
    policyKind: "lead_profile",
    fallbackAnswer: "Lead bol zachytený.",
  });
  return result.leadProfile || null;
}

export async function describeLeadWithOpenAi(input: {
  messages: Message[];
  qualificationState: unknown;
  intent: string;
  score: number;
}): Promise<LeadProfile | null> {
  return describeLeadWithLlm(input);
}
