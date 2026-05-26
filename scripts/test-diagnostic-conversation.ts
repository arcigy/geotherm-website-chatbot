import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { startChatServer } from "./chat-server";

type ChatBody = {
  answer: string;
  intent: string;
  confidence: string;
  sources: unknown[];
  responseTimeMs?: number;
  debug?: {
    answerMode?: string;
    retrievalQuery?: string;
    enrichedRetrievalQuery?: string;
    storedSlots?: Record<string, unknown>;
    serviceType?: string;
    serviceIntent?: string;
    diagnosticFlowVersion?: string;
    serverCommit?: string;
    contextCarried?: boolean;
    llmError?: string | null;
    llmRouterError?: string | null;
  };
};

type Turn = {
  message: string;
  response: ChatBody;
  failures: string[];
};

const reportPath = path.join(process.cwd(), "knowledge", "diagnostic-conversation-test-report.md");

function normalize(value: string | undefined | null): string {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasAll(value: string, terms: string[]): boolean {
  const normalized = normalize(value);
  return terms.every((term) => normalized.includes(normalize(term)));
}

function hasAny(value: string, terms: string[]): boolean {
  const normalized = normalize(value);
  return terms.some((term) => normalized.includes(normalize(term)));
}

function wordCount(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function checkTurn(index: number, body: ChatBody): string[] {
  const failures: string[] = [];
  const answer = body.answer || "";
  const query = body.debug?.enrichedRetrievalQuery || body.debug?.retrievalQuery || "";

  if (wordCount(answer) > 260) failures.push(`answer too long: ${wordCount(answer)} words`);

  if (index === 0) {
    if (body.debug?.serviceType !== "heat_pump") failures.push(`expected serviceType heat_pump, got ${body.debug?.serviceType || "missing"}`);
    if (body.debug?.serviceIntent !== "recommendation") failures.push(`expected serviceIntent recommendation, got ${body.debug?.serviceIntent || "missing"}`);
    if (!hasAny(answer, ["vzduch-voda", "tepelné čerpadlo", "rodinných domoch"])) failures.push("first answer lacks general heat-pump direction");
    if (!hasAll(answer, ["novostavba", "m2"]) || !hasAny(answer, ["podlahovka", "podlahové", "radiátory"])) failures.push("first answer lacks expected qualification questions");
  }

  if (index === 1) {
    if (!hasAll(answer, ["vzduch-voda", "podlah", "nízk"])) failures.push("new-build floor-heating verdict missing");
    if (hasAny(answer, ["rozpočet", "ročná spotreba", "ročnú spotrebu"])) failures.push("asked forbidden budget or annual-consumption question");
  }

  if (index === 2) {
    if (body.debug?.answerMode === "general_chat") failures.push("short follow-up fell into general_chat");
    if (!body.sources?.length) failures.push("short follow-up has no sources");
    if (!hasAll(query, ["novostavba", "120", "podlah", "5", "chladen"])) failures.push(`retrieval query was not enriched enough: ${query}`);
    if (!hasAny(answer, ["zásobník", "TÚV", "teplá voda"])) failures.push("answer lacks hot-water/storage direction");
    if (!hasAny(answer, ["rosný", "limity", "fancoil", "stropné", "klimatizácia"])) failures.push("answer lacks careful cooling caveat");
    if (hasAny(answer, ["ročná spotreba", "ročnú spotrebu"])) failures.push("asked annual consumption for new build");
  }

  if (index === 3) {
    if (!hasAll(answer, ["vzduch-voda", "podlah"])) failures.push("location/no-estimate answer lost the main verdict");
    if (!hasAny(answer, ["projekt", "tepelná strata", "energetický certifikát"])) failures.push("answer should ask for project/heat loss/certificate");
    if (hasAny(answer, ["rozpočet", "montáž a servis od nás", "nezáväzná obhliadka", "bezplatná obhliadka"])) failures.push("answer contains forbidden commercial claim/question");
  }

  if (index === 4) {
    if (!hasAll(answer, ["vzduch-voda", "podlah"])) failures.push("complaint answer did not give direct best-type verdict");
    if (!hasAny(answer, ["5 osôb", "TÚV", "teplá voda", "zásobník"])) failures.push("complaint answer lost household/hot-water context");
    if (hasAny(answer, ["nezáväzná obhliadka", "bezplatná obhliadka", "rozpočet"])) failures.push("complaint answer contains forbidden claim/question");
  }

  return failures;
}

async function main(): Promise<void> {
  const configuredEndpoint = process.env.CHAT_TEST_ENDPOINT || "";
  const server = configuredEndpoint ? null : await startChatServer({ port: 0 });
  const address = server?.address();
  const port = typeof address === "object" && address ? address.port : 0;
  const endpoint = configuredEndpoint || `http://127.0.0.1:${port}/chat`;
  const anonymousId = `diagnostic_${Date.now()}`;
  const messages = [
    "ahoj, aké tep. čerpadlo je najlepšie?",
    "1. novostavbu, 2. 120, 3. podlahovka",
    "1. 5, 2. áno",
    "Bratislava, nemám odhad",
    "si mi nepovedal najlepšie čerpadlo pre mňa",
  ];
  const turns: Turn[] = [];

  try {
    for (let index = 0; index < messages.length; index += 1) {
      const message = messages[index];
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: "http://localhost:5173" },
        body: JSON.stringify({
          siteId: "geotherm",
          anonymousId,
          currentUrl: "http://localhost/diagnostic-test",
          message,
        }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status} on turn ${index + 1}`);
      const body = (await response.json()) as ChatBody;
      turns.push({ message, response: body, failures: checkTurn(index, body) });
    }
  } finally {
    if (server) await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }

  const failed = turns.filter((turn) => turn.failures.length).length;
  const lines = [
    "# Diagnostic Conversation Test Report",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    `Verdict: ${failed === 0 ? "PASS" : "FAIL"}`,
    `Failed turns: ${failed}/${turns.length}`,
    "",
  ];
  for (let index = 0; index < turns.length; index += 1) {
    const turn = turns[index];
    lines.push(`## Turn ${index + 1}`);
    lines.push("");
    lines.push(`User: ${turn.message}`);
    lines.push(`Pass: ${turn.failures.length ? "no" : "yes"}`);
    if (turn.failures.length) lines.push(`Failures: ${turn.failures.join("; ")}`);
    lines.push(`responseTimeMs: ${turn.response.responseTimeMs ?? "n/a"}`);
    lines.push(`answerMode: ${turn.response.debug?.answerMode || "n/a"}`);
    lines.push(`serviceType: ${turn.response.debug?.serviceType || "n/a"}`);
    lines.push(`serviceIntent: ${turn.response.debug?.serviceIntent || "n/a"}`);
    lines.push(`retrievalQuery: ${turn.response.debug?.retrievalQuery || "n/a"}`);
    lines.push(`enrichedRetrievalQuery: ${turn.response.debug?.enrichedRetrievalQuery || "n/a"}`);
    lines.push(`storedSlots: ${JSON.stringify(turn.response.debug?.storedSlots || {})}`);
    lines.push(`flow: ${turn.response.debug?.diagnosticFlowVersion || "n/a"} @ ${turn.response.debug?.serverCommit || "n/a"}`);
    lines.push(`sources: ${turn.response.sources?.length || 0}`);
    lines.push("");
    lines.push(turn.response.answer);
    lines.push("");
  }

  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, lines.join("\n"), "utf8");
  console.log(`Diagnostic conversation tests: ${turns.length - failed}/${turns.length} passed`);
  console.log(`Saved ${reportPath}`);
  if (failed) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
