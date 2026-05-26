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
    rawUserMessage?: string;
    normalizedUserMessage?: string;
    storedSlots?: Record<string, unknown>;
    newlyExtractedSlots?: Record<string, unknown>;
    inferredFromLastQuestion?: boolean;
    serviceType?: string;
    serviceIntent?: string;
    legacyIntent?: string;
    diagnosticFlowVersion?: string;
    serverCommit?: string;
    retrievalSourcesCount?: number;
    contextCarried?: boolean;
    fallbackUsed?: boolean;
    fallbackType?: string | null;
    validatorsTriggered?: string[];
    bannedClaimsRemoved?: string[];
    questionRoundsCount?: number;
    closureGateTriggered?: boolean;
    closureReason?: string | null;
    recommendationOptions?: string[];
    remainingCriticalUnknowns?: string[];
    llmError?: string | null;
    llmRouterError?: string | null;
  };
  fallbackUsed?: boolean;
};

type Turn = {
  scenario: string;
  message: string;
  response: ChatBody;
  failures: string[];
};

type Scenario = {
  id: string;
  title: string;
  messages: string[];
  check: (turnIndex: number, body: ChatBody, turns: Turn[]) => string[];
};

const reportPath = path.join(process.cwd(), "knowledge", "diagnostic-conversation-test-report.md");
const jsonPath = path.join(process.cwd(), "knowledge", "diagnostic-conversation-test-export.json");

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

function slotText(body: ChatBody): string {
  return normalize(JSON.stringify(body.debug?.storedSlots || {}));
}

function queryText(body: ChatBody): string {
  return body.debug?.enrichedRetrievalQuery || body.debug?.retrievalQuery || "";
}

function wordCount(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function questionCount(value: string): number {
  return (value.match(/\?/g) || []).length;
}

function commonChecks(body: ChatBody): string[] {
  const failures: string[] = [];
  if (wordCount(body.answer || "") > 280) failures.push(`answer too long: ${wordCount(body.answer || "")} words`);
  for (const field of ["serverCommit", "diagnosticFlowVersion", "rawUserMessage", "normalizedUserMessage", "storedSlots", "serviceType", "serviceIntent", "enrichedRetrievalQuery", "retrievalSourcesCount", "fallbackType", "questionRoundsCount", "closureGateTriggered", "recommendationOptions", "remainingCriticalUnknowns"] as const) {
    if (body.debug?.[field] === undefined) failures.push(`debug.${field} missing`);
  }
  if (hasAny(body.answer, ["odpoveď sa teraz nedokončila", "odpoved sa teraz nedokoncila", "mám podklady, ale", "mam podklady ale", "nemám dosť informácií"])) {
    failures.push("answer contains forbidden weak fallback");
  }
  if (hasAny(body.answer, ["bezplatná obhliadka", "bezplatna obhliadka", "nezáväzná obhliadka", "nezavazna obhliadka"])) {
    failures.push("answer contains unconfirmed inspection claim");
  }
  if (hasAny(body.answer, ["oveľa komfortnejšie a úspornejšie ako klasická klimatizácia", "ovela komfortnejsie a uspornejsie ako klasicka klimatizacia"])) {
    failures.push("answer contains forbidden cooling superiority claim");
  }
  return failures;
}

const scenarios: Scenario[] = [
  {
    id: "new_build_floor_cooling",
    title: "Novostavba + podlahovka + chladenie",
    messages: ["ahoj, ake cerpadlo je najlepsie?", "1. novostavbu, 2. 120, 3. podlahovka", "1. 5, 2. ano"],
    check(turnIndex, body) {
      const failures = commonChecks(body);
      const answer = body.answer || "";
      const slots = slotText(body);
      const query = queryText(body);
      if (turnIndex === 0) {
        if (body.debug?.serviceType !== "heat_pump") failures.push(`expected serviceType heat_pump, got ${body.debug?.serviceType || "missing"}`);
        if (body.debug?.serviceIntent !== "recommendation") failures.push(`expected serviceIntent recommendation, got ${body.debug?.serviceIntent || "missing"}`);
        if (!hasAny(answer, ["vzduch-voda", "tepelné čerpadlo", "tepelne cerpadlo"])) failures.push("first answer lacks general heat-pump direction");
        if (questionCount(answer) > 3) failures.push(`asked too many questions: ${questionCount(answer)}`);
        if (hasAny(answer, ["iba závisí", "iba zavisi"])) failures.push("answered only with depends");
      }
      if (turnIndex === 1) {
        if (!hasAll(slots, ["novostavba", "120", "podlah"])) failures.push(`storedSlots missing new-build basics: ${JSON.stringify(body.debug?.storedSlots || {})}`);
        if (!hasAll(answer, ["vzduch-voda", "podlah"])) failures.push("new-build floor-heating verdict missing");
        if (!hasAny(answer, ["nízk", "nizk", "nízkoteplot", "nizkoteplot"])) failures.push("low-temperature reason missing");
        if (hasAny(answer, ["rozpočet", "rozpocet", "ročná spotreba", "rocna spotreba"])) failures.push("asked forbidden budget or annual-consumption question");
      }
      if (turnIndex === 2) {
        if (!hasAll(slots, ["5"]) || !hasAny(slots, ["wants_cooling true", "chladen"])) failures.push(`storedSlots missing occupants/cooling: ${JSON.stringify(body.debug?.storedSlots || {})}`);
        if (!hasAll(query, ["novostavba", "120", "podlah", "5", "chladen"])) failures.push(`retrieval query not enriched enough: ${query}`);
        if (!hasAny(answer, ["zásobník", "zasobnik", "TÚV", "TUV", "teplá voda", "tepla voda"])) failures.push("answer lacks hot-water/storage direction");
        if (!hasAny(answer, ["rosný", "rosny", "limity", "fancoil", "stropné", "stropne", "klimatizácia", "klimatizacia"])) failures.push("answer lacks careful cooling caveat");
        if (body.debug?.answerMode === "general_chat") failures.push("short stateful answer fell into general_chat");
      }
      return failures;
    },
  },
  {
    id: "old_house_radiators_wood",
    title: "Starší dom + radiátory + drevo",
    messages: ["ahoj, ake cerpadlo je najlepsie?", "starsi dom, 150m, mame radiatory", "kotol mame drevom a netusim, mam vlastne drevo", "4m, zateplene vsetko"],
    check(turnIndex, body) {
      const failures = commonChecks(body);
      const answer = body.answer || "";
      const slots = slotText(body);
      const query = queryText(body);
      if (turnIndex === 1) {
        if (!hasAll(slots, ["rekon", "150", "radi"])) failures.push(`storedSlots missing older house/radiators: ${JSON.stringify(body.debug?.storedSlots || {})}`);
        if (!hasAll(answer, ["vzduch-voda", "radi"])) failures.push("radiator-system verdict missing");
      }
      if (turnIndex === 2) {
        if (!hasAny(slots, ["tuhé palivo", "tuhe palivo", "drevo"])) failures.push(`current heating wood/solid fuel missing: ${JSON.stringify(body.debug?.storedSlots || {})}`);
        if (!hasAny(slots, ["annual_consumption_unknown true", "rocna spotreba nie je znama"])) failures.push("annual consumption unknown missing");
        if (!hasAll(query, ["radi", "drevo"]) && !hasAll(query, ["radi", "tuhe palivo"])) failures.push(`retrieval query lost radiator/wood context: ${query}`);
        if (!hasAll(answer, ["vzduch-voda", "radi"]) || !hasAny(answer, ["drevo", "tuhé palivo", "tuhe palivo"])) failures.push("wood replacement verdict missing");
        if (!hasAny(answer, ["zateplen", "akumula", "teplá voda", "tepla voda", "koľko dreva", "kolko dreva"])) failures.push("answer lacks useful replacement follow-up");
      }
      if (turnIndex === 3) {
        if (body.debug?.answerMode !== "recommendation_closure") failures.push(`expected recommendation_closure, got ${body.debug?.answerMode || "missing"}`);
        if (body.debug?.closureGateTriggered !== true) failures.push("closureGateTriggered should be true");
        if (!body.debug?.closureReason) failures.push("closureReason missing");
        if ((body.debug?.recommendationOptions || []).length < 2) failures.push("recommendationOptions should contain at least 2 options");
        if (!hasAny(answer, ["najlepší smer", "najlepsi smer", "uzavrel"])) failures.push("closure answer lacks best-direction wording");
        if (!hasAll(answer, ["vzduch-voda", "radi"])) failures.push("closure answer lacks heat pump/radiator direction");
        if (!hasAny(answer, ["hlavný zdroj", "hlavny zdroj"]) || !hasAny(answer, ["hybrid", "ponechaný kotol", "ponechany kotol"])) failures.push("closure answer lacks two expected options");
        if (hasAny(answer, ["bude ekonomicky výhodnejšie", "bude ekonomicky vyhodnejsie", "garantovanú úsporu", "garantovanu usporu"])) failures.push("closure answer guarantees savings");
        if (!hasAny(answer, ["fotky kotolne", "fotky", "radiátorov", "radiatorov", "dohodnúť obhliadku", "dohodnut obhliadku", "pripraviť návrh", "pripravit navrh"])) failures.push("closure answer lacks CTA");
        if (questionCount(answer) > 2) failures.push(`closure asks too many questions: ${questionCount(answer)}`);
      }
      return failures;
    },
  },
  {
    id: "air_conditioning_two_rooms",
    title: "Klimatizácia do dvoch miestností",
    messages: ["chcem klimatizaciu do obyvacky a spalne"],
    check(_turnIndex, body) {
      const failures = commonChecks(body);
      if (body.debug?.serviceType !== "air_conditioning") failures.push(`expected air_conditioning, got ${body.debug?.serviceType || "missing"}`);
      if (!hasAny(body.answer, ["samostatné jednotky", "samostatne jednotky", "multisplit"])) failures.push("AC direction missing");
      if (!hasAny(body.answer, ["plocha", "m2", "vonkajšia jednotka", "vonkajsia jednotka"])) failures.push("AC follow-up missing");
      return failures;
    },
  },
  {
    id: "heat_recovery_new_build",
    title: "Rekuperácia v novostavbe",
    messages: ["staviam dom a chcem lepsi vzduch bez otvarania okien"],
    check(_turnIndex, body) {
      const failures = commonChecks(body);
      if (!["heat_recovery", "complex_solution"].includes(body.debug?.serviceType || "")) failures.push(`expected heat_recovery or complex_solution, got ${body.debug?.serviceType || "missing"}`);
      if (!hasAny(body.answer, ["rekuper", "vetran"])) failures.push("recovery direction missing");
      if (!hasAny(body.answer, ["projekt", "celý dom", "cely dom"])) failures.push("recovery project/whole-house follow-up missing");
      return failures;
    },
  },
  {
    id: "nibe_service_fault",
    title: "NIBE servisná chyba",
    messages: ["tepelne cerpadlo NIBE mi hlasi chybu"],
    check(_turnIndex, body) {
      const failures = commonChecks(body);
      if (body.debug?.serviceType !== "service") failures.push(`expected service, got ${body.debug?.serviceType || "missing"}`);
      if (body.debug?.serviceIntent !== "service_fault") failures.push(`expected service_fault, got ${body.debug?.serviceIntent || "missing"}`);
      if (!hasAny(body.answer, ["model", "štítok", "stitok"]) || !hasAny(body.answer, ["chybový kód", "chybovy kod", "chybu"])) failures.push("service data request missing");
      if (hasAny(body.answer, ["servisujeme aj cudzie montáže", "servisujeme aj cudzie montaze"])) failures.push("unconfirmed third-party service claim");
      return failures;
    },
  },
  {
    id: "subsidy",
    title: "Dotácie",
    messages: ["pomozete mi s dotaciou?"],
    check(_turnIndex, body) {
      const failures = commonChecks(body);
      if (body.debug?.serviceType !== "subsidy") failures.push(`expected subsidy, got ${body.debug?.serviceType || "missing"}`);
      if (!hasAny(body.answer, ["pomôcť", "pomoct", "asist", "nasmer"])) failures.push("subsidy assistance wording missing");
      if (hasAny(body.answer, ["kompletne vybavíme", "kompletne vybavime", "odpočítame", "odpocitame"])) failures.push("unconfirmed subsidy claim");
      return failures;
    },
  },
];

async function runScenario(endpoint: string, scenario: Scenario): Promise<Turn[]> {
  const anonymousId = `diagnostic_${scenario.id}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const turns: Turn[] = [];
  for (let index = 0; index < scenario.messages.length; index += 1) {
    const message = scenario.messages[index];
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
    if (!response.ok) throw new Error(`HTTP ${response.status} in ${scenario.id} turn ${index + 1}`);
    const body = (await response.json()) as ChatBody;
    const failures = scenario.check(index, body, turns);
    turns.push({ scenario: scenario.id, message, response: body, failures });
  }
  return turns;
}

async function main(): Promise<void> {
  const configuredEndpoint = process.env.CHAT_TEST_ENDPOINT || "";
  const server = configuredEndpoint ? null : await startChatServer({ port: 0 });
  const address = server?.address();
  const port = typeof address === "object" && address ? address.port : 0;
  const endpoint = configuredEndpoint || `http://127.0.0.1:${port}/chat`;
  const allTurns: Turn[] = [];

  try {
    for (const scenario of scenarios) {
      allTurns.push(...(await runScenario(endpoint, scenario)));
    }
  } finally {
    if (server) await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }

  const failedTurns = allTurns.filter((turn) => turn.failures.length);
  const lines = [
    "# Diagnostic Conversation Test Report",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Endpoint: ${endpoint}`,
    "",
    `Verdict: ${failedTurns.length === 0 ? "PASS" : "FAIL"}`,
    `Failed turns: ${failedTurns.length}/${allTurns.length}`,
    "",
  ];

  for (const scenario of scenarios) {
    lines.push(`## ${scenario.title}`);
    lines.push("");
    for (const [index, turn] of allTurns.filter((item) => item.scenario === scenario.id).entries()) {
      lines.push(`### Turn ${index + 1}`);
      lines.push("");
      lines.push(`User: ${turn.message}`);
      lines.push(`Pass: ${turn.failures.length ? "no" : "yes"}`);
      if (turn.failures.length) lines.push(`Failures: ${turn.failures.join("; ")}`);
      lines.push(`responseTimeMs: ${turn.response.responseTimeMs ?? "n/a"}`);
      lines.push(`answerMode: ${turn.response.debug?.answerMode || "n/a"}`);
      lines.push(`serviceType: ${turn.response.debug?.serviceType || "n/a"}`);
      lines.push(`serviceIntent: ${turn.response.debug?.serviceIntent || "n/a"}`);
      lines.push(`sourcesCount: ${turn.response.debug?.retrievalSourcesCount ?? turn.response.sources?.length ?? 0}`);
      lines.push(`fallbackType: ${turn.response.debug?.fallbackType ?? "n/a"}`);
      lines.push(`questionRoundsCount: ${turn.response.debug?.questionRoundsCount ?? "n/a"}`);
      lines.push(`closureGateTriggered: ${turn.response.debug?.closureGateTriggered ?? "n/a"}`);
      lines.push(`closureReason: ${turn.response.debug?.closureReason ?? "n/a"}`);
      lines.push(`recommendationOptions: ${JSON.stringify(turn.response.debug?.recommendationOptions || [])}`);
      lines.push(`remainingCriticalUnknowns: ${JSON.stringify(turn.response.debug?.remainingCriticalUnknowns || [])}`);
      lines.push(`validatorsTriggered: ${(turn.response.debug?.validatorsTriggered || []).join(", ") || "none"}`);
      lines.push(`retrievalQuery: ${turn.response.debug?.retrievalQuery || "n/a"}`);
      lines.push(`enrichedRetrievalQuery: ${turn.response.debug?.enrichedRetrievalQuery || "n/a"}`);
      lines.push(`storedSlots: ${JSON.stringify(turn.response.debug?.storedSlots || {})}`);
      lines.push(`newlyExtractedSlots: ${JSON.stringify(turn.response.debug?.newlyExtractedSlots || {})}`);
      lines.push(`flow: ${turn.response.debug?.diagnosticFlowVersion || "n/a"} @ ${turn.response.debug?.serverCommit || "n/a"}`);
      lines.push("");
      lines.push(turn.response.answer);
      lines.push("");
    }
  }

  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, lines.join("\n"), "utf8");
  await writeFile(
    jsonPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        endpoint,
        verdict: failedTurns.length === 0 ? "PASS" : "FAIL",
        failedTurns: failedTurns.length,
        totalTurns: allTurns.length,
        turns: allTurns,
      },
      null,
      2,
    ),
    "utf8",
  );
  console.log(`Diagnostic conversation tests: ${allTurns.length - failedTurns.length}/${allTurns.length} passed`);
  console.log(`Saved ${reportPath}`);
  console.log(`Saved ${jsonPath}`);
  if (failedTurns.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
