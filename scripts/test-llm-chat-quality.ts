import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadLocalEnv } from "./env";
import { getDb } from "./local-db";
import { startChatServer, type ChatResponse } from "./chat-server";
import { composeWithLlm, isLlmAvailable, llmModel, llmProvider } from "./openai-llm";

type ToneCase = {
  id: string;
  category: string;
  query: string;
  expectedIntents: string[];
  requiresSources: boolean;
  expectMarkdown: boolean;
  expectedTerms: string[];
  forbiddenTerms: string[];
  maxQuestions: number;
};

type CaseResult = {
  test: ToneCase;
  response?: ChatResponse;
  passed: boolean;
  issues: string[];
  diagnostics: string[];
};

const casesPath = path.join(process.cwd(), "knowledge", "advisor-tone-test-cases.json");
const reportPath = path.join(process.cwd(), "knowledge", "llm-chat-quality-report.md");

function norm(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s?]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesTerm(value: string, term: string): boolean {
  const haystack = norm(value);
  const needle = norm(term);
  if (haystack.includes(needle)) return true;
  const haystackTokens = haystack.split(/\s+/).filter(Boolean);
  const needleParts = needle.split(/[\s?]+/).filter((part) => part.length >= 3);
  if (needleParts.length && needleParts.every((part) => haystack.includes(part))) return true;
  const needleTokens = needle.split(/\s+/).filter((part) => part.length >= 4);
  return needleTokens.length > 0 && needleTokens.every((token) => haystackTokens.some((hay) => hay.startsWith(token.slice(0, Math.min(5, token.length - 1)))));
}

function countQuestions(value: string): number {
  return (value.match(/\?/g) || []).length;
}

function hasMarkdown(answer: string): boolean {
  return answer.includes("\n\n") || answer.includes("- ") || answer.includes("_");
}

function hasInternalLabels(answer: string): boolean {
  const text = norm(answer);
  return text.includes("kratka odpoved") || text.includes("aby som poradil lepsie");
}

function hasContactPush(answer: string): boolean {
  const text = norm(answer);
  return ["staci email", "staci telefon", "nechajte kontakt", "poslite telefon", "poslite email"].some((term) => text.includes(term));
}

function leaksRawJson(answer: string): boolean {
  return /^\s*\{/.test(answer) || /"shortAnswer"\s*:|"structuredAnswer"\s*:|"answerMode"\s*:/.test(answer);
}

function hasMarkdownDrift(answer: string): boolean {
  return /^#{1,6}\s+/m.test(answer) || /\|.+\|/.test(answer) || /```/.test(answer);
}

function intentMatches(expected: string[], actual: string, category: string): boolean {
  if (expected.includes(actual)) return true;
  const aliases: Record<string, string[]> = {
    quote: ["price", "quote", "contact"],
    installation: ["process", "recommendation", "quote", "inspection"],
    product: ["brand_model", "recommendation", "comparison", "price"],
    service: ["service_fault", "process", "contact"],
    noise: ["process", "brand_model", "recommendation", "service_fault"],
    subsidy: ["subsidy"],
    fallback: ["general", "unknown"],
    ambiguous: ["general", "unknown", "recommendation"],
    safety: ["service_fault", "general", "unknown"],
  };
  return expected.some((value) => (aliases[value] || []).includes(actual)) || (aliases[category] || []).includes(actual);
}

function llmRequiredForCase(test: ToneCase): boolean {
  const text = norm(test.query);
  const deterministicPolicy = /presne|garant|namontovat|zapoj|tlak|chladivo|rozobra|unik|svojpomoc/.test(text);
  return !deterministicPolicy && !["safety", "fallback", "adversarial", "ambiguous"].includes(test.category);
}

async function send(endpoint: string, anonymousId: string, message: string): Promise<ChatResponse> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "http://127.0.0.1:4321",
    },
    body: JSON.stringify({
      message,
      siteId: "geotherm",
      anonymousId,
      currentUrl: "http://127.0.0.1:4321/embed-preview.html",
      metadata: { userAgent: "llm-chat-quality-test", referrer: "local-test" },
    }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  return (await response.json()) as ChatResponse;
}

function evaluateCase(test: ToneCase, response: ChatResponse, llmRequired: boolean): CaseResult {
  const issues: string[] = [];
  const diagnostics: string[] = [];
  const answer = response.answer;
  const debug = (response.debug || {}) as {
    llmUsed?: boolean;
    llmError?: string | null;
    answerMode?: string;
    structuredAnswer?: { shortAnswer?: string };
    serviceIntent?: string;
  };
  const effectiveIntent = debug.serviceIntent || response.intent;

  if (!intentMatches(test.expectedIntents, effectiveIntent, test.category)) issues.push(`intent mismatch: got ${effectiveIntent}`);
  if (test.requiresSources && response.sources.length === 0) issues.push("missing sources");
  if (!hasMarkdown(answer)) issues.push("missing deterministic markdown structure");
  if (hasInternalLabels(answer)) issues.push("internal renderer labels leaked");
  if (answer.length > 1600) issues.push(`answer too long: ${answer.length}`);
  if (leaksRawJson(answer)) issues.push("raw JSON leaked to user");
  if (!test.expectMarkdown && hasMarkdownDrift(answer)) issues.push("markdown format drift");
  if (countQuestions(answer) > test.maxQuestions) issues.push(`too many questions: ${countQuestions(answer)}`);
  if (hasContactPush(answer) && !response.lead.captured) issues.push("contact push too early");

  const missingTerms = test.expectedTerms.filter((term) => !includesTerm(answer, term));
  if (missingTerms.length) issues.push(`missing expected terms: ${missingTerms.join(", ")}`);

  const forbiddenHits = test.forbiddenTerms
    .filter((term) => !norm(term).startsWith("kratka odpoved"))
    .filter((term) => norm(answer).includes(norm(term)));
  if (forbiddenHits.length) issues.push(`forbidden terms: ${forbiddenHits.join(", ")}`);

  const genericHits = ["Pod?a webu", "Pod??a webu"].filter((term) => includesTerm(answer, term));
  if (genericHits.length) issues.push(`generic old wording: ${genericHits.join(", ")}`);

  const llmEvents = getDb()
    .prepare("SELECT payload_json FROM events WHERE conversation_id = ? AND event_type = 'llm_answer_composed' ORDER BY created_at DESC LIMIT 1")
    .all(response.conversationId) as Array<{ payload_json: string }>;
  const payload = llmEvents[0]
    ? (JSON.parse(llmEvents[0].payload_json) as {
        used?: boolean;
        error?: string;
        answerMode?: string;
        structuredAnswer?: { shortAnswer?: string };
        validationErrors?: string[];
      })
    : null;

  if (llmRequired) {
    const justifiedFallback = payload?.error && /timeout|high demand|deterministic_policy_skip/i.test(payload.error);
    const llmUsed = Boolean(debug.llmUsed ?? payload?.used);
    const llmError = debug.llmError || payload?.error || "";
    if (!llmUsed && !justifiedFallback) issues.push(`LLM was not used${llmError ? `: ${llmError}` : ""}`);
    if (llmUsed && !debug.answerMode && !payload?.answerMode) issues.push("missing answer mode metadata");
    diagnostics.push(`llmUsed=${llmUsed ? "yes" : "no"}`);
    diagnostics.push(`answerMode=${debug.answerMode || payload?.answerMode || "-"}`);
    if (payload?.validationErrors?.length) diagnostics.push(`validation=${payload.validationErrors.join("|")}`);
  }

  diagnostics.push(`confidence=${response.confidence}`);
  diagnostics.push(`sources=${response.sources.length}`);
  diagnostics.push(`questions=${countQuestions(answer)}`);

  return { test, response, passed: issues.length === 0, issues, diagnostics };
}

function failedCase(test: ToneCase, error: unknown): CaseResult {
  return {
    test,
    passed: false,
    issues: [`request failed: ${error instanceof Error ? error.message : String(error)}`],
    diagnostics: [],
  };
}

async function runLeadConversation(endpoint: string, llmRequired: boolean): Promise<{ passed: boolean; issues: string[]; transcript: ChatResponse[] }> {
  const anonymousId = `llm_lead_${Date.now()}`;
  const messages = [
    "Chcem cenovú ponuku na tepelné čerpadlo.",
    "Je to rodinný dom, asi 160 m2, som zo Žiliny.",
    "Riešime to v najbližších 1 až 3 mesiacoch, teraz máme plynový kotol.",
    "Áno, nech ma kontaktuje odborník. Volám sa Peter, email peter@example.com, tel 0903123456.",
  ];
  const transcript: ChatResponse[] = [];
  for (const message of messages) transcript.push(await send(endpoint, anonymousId, message));
  const last = transcript[transcript.length - 1];
  const issues: string[] = [];
  if (!last.lead.captured) issues.push("lead not captured");
  if (last.lead.score < 70) issues.push(`lead score too low: ${last.lead.score}`);

  const rows = getDb()
    .prepare("SELECT transcript_json FROM leads WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 1")
    .all(last.conversationId) as Array<{ transcript_json: string }>;
  const transcriptJson = rows[0] ? JSON.parse(rows[0].transcript_json) : null;
  const description = norm([transcriptJson?.summary, transcriptJson?.storedSlots ? JSON.stringify(transcriptJson.storedSlots) : ""].join(" "));
  if (!description.includes("zil") && !description.includes("žilin")) issues.push("lead description missing location");
  if (!description.includes("160")) issues.push("lead description missing area");
  if (!["quote_requested", "contact_captured", "inspection_requested"].includes(String(transcriptJson?.status || ""))) issues.push("lead status should be sales-ready");

  if (llmRequired) {
    const llmEvents = getDb()
      .prepare("SELECT payload_json FROM events WHERE conversation_id = ? AND event_type = 'llm_answer_composed'")
      .all(last.conversationId) as Array<{ payload_json: string }>;
    if (!llmEvents.some((row) => (JSON.parse(row.payload_json) as { used?: boolean }).used)) issues.push("no LLM event in lead conversation");
  }

  return { passed: issues.length === 0, issues, transcript };
}

async function main(): Promise<void> {
  loadLocalEnv();
  const cases = JSON.parse(await readFile(casesPath, "utf8")) as ToneCase[];
  const provider = llmProvider();
  const model = llmModel(provider);
  const llmAvailable = isLlmAvailable();
  let llmPreflightError = "";
  let llmPreflightOk = false;
  if (llmAvailable) {
    const preflight = await composeWithLlm({
      message: "preflight",
      intent: "unknown",
      confidence: "medium",
      sources: [],
      previousMessages: [],
      qualificationState: {},
      leadCapture: { shouldAsk: false, nextQuestion: null },
      retrievalUsed: false,
      policyKind: "preflight",
      fallbackAnswer: "preflight",
    });
    llmPreflightOk = preflight.used;
    llmPreflightError = preflight.error || "";
  }
  const rows: CaseResult[] = [];
  let leadResult: Awaited<ReturnType<typeof runLeadConversation>> | null = null;

  if (cases.length < 50) throw new Error(`Expected at least 50 test cases, got ${cases.length}`);

  const server = await startChatServer({ port: 0 });
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  const endpoint = `http://127.0.0.1:${port}/chat`;

  try {
    const concurrency = Math.max(1, Number.parseInt(process.env.LLM_TEST_CONCURRENCY || "4", 10));
    for (let index = 0; index < cases.length; index += concurrency) {
      const batch = cases.slice(index, index + concurrency);
      const batchRows = await Promise.all(
        batch.map(async (test) => {
          try {
            const response = await send(endpoint, `llm_quality_${test.id}_${Date.now()}`, test.query);
            return evaluateCase(test, response, llmAvailable && llmRequiredForCase(test));
          } catch (error) {
            return failedCase(test, error);
          }
        }),
      );
      rows.push(...batchRows);
    }
    try {
      leadResult = await runLeadConversation(endpoint, false);
    } catch (error) {
      leadResult = {
        passed: false,
        issues: [`request failed: ${error instanceof Error ? error.message : String(error)}`],
        transcript: [],
      };
    }
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }

  const passed = rows.filter((row) => row.passed).length;
  const failed = rows.filter((row) => !row.passed);
  const passRate = rows.length ? passed / rows.length : 0;
  const verdict = llmAvailable && passRate >= 0.8 && leadResult?.passed ? "PASS" : "NEEDS WORK";
  const report = [
    "# LLM Chat Quality Report",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Summary",
    "",
    `- provider: ${provider}`,
    `- model: ${model}`,
    `- real LLM enabled: ${llmAvailable ? "yes" : "no"}`,
    `- LLM preflight: ${llmAvailable ? (llmPreflightOk ? "PASS" : "FAIL") : "not configured"}`,
    llmPreflightError ? `- LLM preflight error: ${llmPreflightError}` : null,
    `- total single-turn tests: ${rows.length}`,
    `- passed: ${passed}`,
    `- failed: ${failed.length}`,
    `- pass rate: ${Math.round(passRate * 100)}%`,
    `- lead conversation: ${leadResult?.passed ? "PASS" : "FAIL"}`,
    `- verdict: ${verdict}`,
    "",
    llmAvailable && !llmPreflightOk
      ? "> WARNING: LLM preflight failed, but full cases still require actual LLM usage. Individual failures show where Gemini was not used."
      : "",
    llmAvailable ? "" : "> BLOCKED: LLM API key is not configured, so these results only validate the fallback path and wiring. Real LLM quality tests were not executed.",
    "",
    "## Failed Cases",
    "",
    failed.length
      ? failed
          .map((row) =>
            [
              `### ${row.test.id} ${row.test.query}`,
              "",
              `- category: ${row.test.category}`,
              `- issues: ${row.issues.join("; ")}`,
              `- diagnostics: ${row.diagnostics.join("; ")}`,
              "",
              "Answer:",
              "",
              row.response?.answer || "-",
            ].join("\n"),
          )
          .join("\n\n")
      : "None.",
    "",
    "## Lead Conversation",
    "",
    leadResult
      ? [
          `- pass: ${leadResult.passed ? "yes" : "no"}`,
          `- issues: ${leadResult.issues.join("; ") || "-"}`,
          "",
          ...leadResult.transcript.map((response, index) => `### Step ${index + 1}\n\nintent=${response.intent} confidence=${response.confidence} lead=${response.lead.captured ? "yes" : "no"} score=${response.lead.score}\n\n${response.answer}`),
        ].join("\n")
      : "Not run.",
  ]
    .filter((line) => line !== null)
    .join("\n");

  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${report}\n`, "utf8");
  console.log(`LLM chat quality: ${passed}/${rows.length} single-turn passed; lead=${leadResult?.passed ? "PASS" : "FAIL"}; real LLM=${llmAvailable ? "yes" : "no"}`);
  console.log(`Saved ${reportPath}`);
  if (verdict !== "PASS") process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
