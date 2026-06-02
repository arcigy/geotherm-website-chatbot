import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { startChatServer } from "./chat-server";

type ChatDebug = {
  answerMode?: string;
  llmAttempted?: boolean;
  llmUsed?: boolean;
  serviceType?: string;
  serviceIntent?: string;
  retrievalSourcesCount?: number;
  fallbackUsed?: boolean;
  fallbackType?: string | null;
};

type ChatBody = {
  answer: string;
  responseTimeMs?: number;
  sources?: unknown[];
  debug?: ChatDebug;
};

type Expectation = {
  serviceType?: string;
  serviceIntent?: string;
  answerMode?: string[];
  mustContain?: string[];
  mustNotContain?: string[];
  maxSources?: number;
  requireQuestion?: boolean;
  requireMeetingCta?: boolean;
};

type Scenario = {
  id: string;
  title: string;
  messages: string[];
  expectLast: Expectation;
};

type Gate = {
  id: string;
  title: string;
  pass: boolean;
  evidence: string;
};

const reportPath = path.join(process.cwd(), "knowledge", "production-readiness-audit.md");
const maxResponseTimeMs = 8000;
const repoRoot = process.cwd();

const scenarios: Scenario[] = [
  {
    id: "small_talk_greeting",
    title: "Small talk pozdrav bez RAG",
    messages: ["ahoj"],
    expectLast: { maxSources: 0, mustContain: ["som tu"], mustNotContain: ["?"] },
  },
  {
    id: "small_talk_how_are_you",
    title: "Small talk ako sa mas bez zbytocneho RAG",
    messages: ["ako sa máš?"],
    expectLast: { maxSources: 0, mustContain: ["dobre"], mustNotContain: ["?"] },
  },
  {
    id: "small_talk_greeting_how_are_you",
    title: "Small talk pozdrav plus ako sa mas bez RAG a bez produktoveho menu",
    messages: ["ahoj, ako sa mas?"],
    expectLast: { maxSources: 0, mustContain: ["dobre"], mustNotContain: ["?", "tepel", "klimatiz", "rekuper", "sluzb"] },
  },
  {
    id: "vague_heat_pump_followup",
    title: "Vágne TČ -> smer + follow-up",
    messages: ["chcem tepelné čerpadlo"],
    expectLast: { serviceType: "heat_pump", serviceIntent: "recommendation", mustContain: ["vzduch-voda"], requireQuestion: true },
  },
  {
    id: "old_house_radiators_verdict",
    title: "Starší dom radiátory -> verdikt",
    messages: ["chcem tč", "starší dom 140m radiátory"],
    expectLast: { serviceType: "heat_pump", serviceIntent: "recommendation", mustContain: ["vzduch-voda", "radiátor"] },
  },
  {
    id: "new_build_closure_cta",
    title: "Novostavba po kvalifikácii -> closure a meeting",
    messages: ["aké tč máte?", "novostavba 120m", "podlahovka", "5 osôb a chcem chladenie"],
    expectLast: { serviceType: "heat_pump", serviceIntent: "recommendation", mustContain: ["S2125", "aroTHERM"], requireMeetingCta: true, mustNotContain: ["tepelná strata", "energetický certifikát"] },
  },
  {
    id: "brands_safe",
    title: "Značky TČ bez Daikin/Mitsubishi halucinácie",
    messages: ["aké značky tepelných čerpadiel robíte?"],
    expectLast: { serviceType: "heat_pump", serviceIntent: "brand_model", mustContain: ["NIBE", "Vaillant"], mustNotContain: ["Daikin ponúkame", "Mitsubishi ponúkame"] },
  },
  {
    id: "daikin_correction",
    title: "Daikin pri TČ opatrne",
    messages: ["robí Geotherm aj Daikin tepelné čerpadlá?"],
    expectLast: { serviceType: "heat_pump", serviceIntent: "brand_model", mustContain: ["NIBE", "Vaillant"], mustNotContain: ["áno", "ponúkame Daikin"] },
  },
  {
    id: "price_scope",
    title: "Cena komplet realizácie",
    messages: ["aké sú ceny tepelných čerpadiel vrátane inštalácie?"],
    expectLast: { serviceType: "heat_pump", serviceIntent: "price", mustContain: ["kompletn", "montáž"], mustNotContain: ["garantovan"] },
  },
  {
    id: "buffer_tank_scope",
    title: "Akumulačka v cene",
    messages: ["je akumulačná nádrž v tej cene?"],
    expectLast: { serviceIntent: "price", mustContain: ["ponuk"], mustNotContain: ["automaticky zahrnut"] },
  },
  {
    id: "obsolete_f2040",
    title: "F2040 oprava",
    messages: ["F2040 sa už nevyrába"],
    expectLast: { serviceType: "heat_pump", serviceIntent: "complaint_or_correction", mustContain: ["F2040", "aktuáln"], mustNotContain: ["odporúčam F2040"] },
  },
  {
    id: "unconfirmed_f2050",
    title: "F2050 bez vymýšľania parametrov",
    messages: ["A F2050?"],
    expectLast: { serviceType: "heat_pump", mustContain: ["potvr"], mustNotContain: ["COP", "výkon 5", "výkon 7"] },
  },
  {
    id: "air_conditioning",
    title: "Klimatizácia",
    messages: ["chcem klimatizáciu do obývačky a spálne"],
    expectLast: { serviceType: "air_conditioning", mustContain: ["multisplit", "vonkajš"] },
  },
  {
    id: "heat_recovery",
    title: "Rekuperácia",
    messages: ["staviam dom a chcem lepší vzduch bez otvárania okien"],
    expectLast: { serviceType: "heat_recovery", mustContain: ["rekuper", "projekt"] },
  },
  {
    id: "floor_heating",
    title: "Podlahové kúrenie",
    messages: ["robíte podlahové kúrenie do novostavby?"],
    expectLast: { serviceType: "floor_heating", mustContain: ["podlah"] },
  },
  {
    id: "ceiling_cooling",
    title: "Stropné chladenie",
    messages: ["chcem stropné chladenie v dome"],
    expectLast: { serviceType: "ceiling_cooling", mustContain: ["stropné", "chladen"] },
  },
  {
    id: "service_fault",
    title: "Servis porucha",
    messages: ["NIBE mi hlási chybu"],
    expectLast: { serviceType: "service", serviceIntent: "service_fault", mustContain: ["model", "chybový kód"] },
  },
  {
    id: "subsidy",
    title: "Dotácie bez garancií",
    messages: ["vybavíte mi dotáciu na tepelné čerpadlo?"],
    expectLast: { serviceIntent: "subsidy", mustContain: ["pomôcť"], mustNotContain: ["garantujeme", "kompletne vybavíme"] },
  },
];

function normalize(value: string | undefined | null): string {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesAll(answer: string, terms: string[] | undefined): boolean {
  if (!terms?.length) return true;
  const normalized = normalize(answer);
  return terms.every((term) => normalized.includes(normalize(term)));
}

function includesAnyForbidden(answer: string, terms: string[] | undefined): string[] {
  if (!terms?.length) return [];
  const normalized = normalize(answer);
  return terms.filter((term) => {
    const normalizedTerm = normalize(term);
    if (!normalizedTerm) return answer.includes(term);
    if (
      normalizedTerm.includes("automaticky zahrnut") &&
      /(nie je|nie je bezpecne|nemozno|nemozem|nesmie|netreba|bezpecne tvrdit).{0,80}automaticky zahrnut/.test(normalized)
    ) {
      return false;
    }
    return normalized.includes(normalizedTerm);
  });
}

function evaluate(body: ChatBody, expectation: Expectation): string[] {
  const failures: string[] = [];
  const debug = body.debug || {};
  const answer = body.answer || "";
  if ((body.responseTimeMs || 0) > maxResponseTimeMs) failures.push(`responseTimeMs>${maxResponseTimeMs}: ${body.responseTimeMs}`);
  if (!debug.llmAttempted) failures.push("llmAttempted is not true");
  if (!debug.llmUsed) failures.push(`llmUsed is not true (${debug.fallbackType || "no fallbackType"})`);
  if (expectation.serviceType && debug.serviceType !== expectation.serviceType) failures.push(`serviceType expected ${expectation.serviceType}, got ${debug.serviceType || "missing"}`);
  if (expectation.serviceIntent && debug.serviceIntent !== expectation.serviceIntent) failures.push(`serviceIntent expected ${expectation.serviceIntent}, got ${debug.serviceIntent || "missing"}`);
  if (expectation.answerMode?.length && !expectation.answerMode.includes(debug.answerMode || "")) failures.push(`answerMode ${debug.answerMode || "missing"} not in ${expectation.answerMode.join(",")}`);
  if (!includesAll(answer, expectation.mustContain)) failures.push(`answer missing required terms: ${(expectation.mustContain || []).join(", ")}`);
  const forbidden = includesAnyForbidden(answer, expectation.mustNotContain);
  if (forbidden.length) failures.push(`answer contains forbidden terms: ${forbidden.join(", ")}`);
  if (expectation.maxSources !== undefined && (debug.retrievalSourcesCount || 0) > expectation.maxSources) failures.push(`retrievalSourcesCount expected <=${expectation.maxSources}, got ${debug.retrievalSourcesCount}`);
  if (expectation.requireQuestion && !answer.includes("?")) failures.push("answer should ask a follow-up question");
  if (expectation.requireMeetingCta && !/(konzult|stretn|meeting|nacen|ponuk)/i.test(normalize(answer))) failures.push("answer lacks meeting/consultation/pricing CTA");
  return failures;
}

async function fileText(relativePath: string): Promise<string> {
  return readFile(path.join(repoRoot, relativePath), "utf8");
}

async function runStaticProductionGates(): Promise<Gate[]> {
  const [chatServer, localDb, crmTest, securitySelfCheck, contradictions, semanticCoverage] = await Promise.all([
    fileText("scripts/chat-server.ts"),
    fileText("scripts/local-db.ts"),
    fileText("scripts/test-crm-leads.ts"),
    fileText("scripts/security-self-check.ts"),
    fileText("scripts/detect-knowledge-contradictions.ts"),
    fileText("knowledge/semantic-coverage-report.md").catch(() => ""),
  ]);

  const hasRuntimeMonitoring =
    chatServer.includes("/health") &&
    chatServer.includes("serverCommit()") &&
    chatServer.includes("diagnosticFlowVersion") &&
    chatServer.includes("responseTimeMs") &&
    chatServer.includes("llmUsed") &&
    chatServer.includes("validatorsTriggered") &&
    chatServer.includes("persistence");
  const hasHumanEscalation =
    chatServer.includes("/admin/outreach") &&
    chatServer.includes("createOrUpdateOutreachItem") &&
    localDb.includes("CREATE TABLE IF NOT EXISTS outreach_items") &&
    crmTest.includes("outreach item should be created") &&
    crmTest.includes("/admin/outreach");
  const hasSourceFreshnessControl =
    contradictions.includes("time-sensitive") &&
    contradictions.includes("freshness") &&
    contradictions.includes("price") &&
    contradictions.includes("subsidy") &&
    semanticCoverage.includes("- weak topics: 0");
  const hasResponseQualityDebug =
    chatServer.includes("directAnswerGateTriggered") &&
    chatServer.includes("closureGateTriggered") &&
    chatServer.includes("retrievalSourcesCount") &&
    chatServer.includes("enrichedRetrievalQuery") &&
    chatServer.includes("storedSlots");
  const hasAbuseControls =
    chatServer.includes("checkChatRateLimit") &&
    chatServer.includes("rate_limited") &&
    chatServer.includes("Retry-After") &&
    chatServer.includes("rateLimit:") &&
    securitySelfCheck.includes("rateLimitCheck");
  const hasSignedSiteAuth =
    chatServer.includes("verifySiteSignature") &&
    chatServer.includes("invalid_site_signature") &&
    chatServer.includes("X-Arcigy-Site-Signature") &&
    chatServer.includes("ARCIGY_SITE_SIGNATURE_SECRET") &&
    securitySelfCheck.includes("signedSiteKeyCheck");

  return [
    {
      id: "runtime_monitoring",
      title: "Runtime monitoring and health evidence",
      pass: hasRuntimeMonitoring,
      evidence: "Requires /health, commit, diagnostic flow, response time, LLM usage, validators and persistence debug fields.",
    },
    {
      id: "human_escalation",
      title: "Human escalation / outreach path",
      pass: hasHumanEscalation,
      evidence: "Requires outreach table, outreach creation, admin outreach endpoint and CRM test coverage.",
    },
    {
      id: "source_freshness",
      title: "Source freshness and contradiction controls",
      pass: hasSourceFreshnessControl,
      evidence: "Requires contradiction audit for time-sensitive/price/subsidy risks and semantic coverage with no weak topics.",
    },
    {
      id: "answer_quality_debug",
      title: "Answer quality debug traceability",
      pass: hasResponseQualityDebug,
      evidence: "Requires direct/closure gates, enriched retrieval query, stored slots and source count in debug output.",
    },
    {
      id: "abuse_controls",
      title: "Chat abuse controls",
      pass: hasAbuseControls,
      evidence: "Requires enforced /chat rate limiting, 429 rate_limited errors, Retry-After and security self-check coverage.",
    },
    {
      id: "signed_site_auth",
      title: "Signed site request authentication",
      pass: hasSignedSiteAuth,
      evidence: "Requires optional HMAC signed /chat requests, invalid signature rejection and security self-check coverage.",
    },
  ];
}

async function main(): Promise<void> {
  const server = await startChatServer({ port: 0 });
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  const endpoint = `http://127.0.0.1:${port}/chat`;
  const rows: Array<{ scenario: Scenario; last: ChatBody; failures: string[] }> = [];
  const gates = await runStaticProductionGates();
  let healthFailure: string | null = null;

  try {
    const healthResponse = await fetch(`http://127.0.0.1:${port}/health`, { headers: { Origin: "http://localhost:4321" } });
    const health = (await healthResponse.json()) as { ok?: boolean; commit?: string; diagnosticFlowVersion?: string };
    if (!healthResponse.ok || !health.ok || !health.commit || !health.diagnosticFlowVersion) {
      healthFailure = `invalid health payload: ${JSON.stringify(health)}`;
    }

    for (const scenario of scenarios) {
      const anonymousId = `readiness_${scenario.id}_${Date.now()}`;
      let last: ChatBody | null = null;
      for (const message of scenario.messages) {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Origin: "http://localhost:4321" },
          body: JSON.stringify({ siteId: "geotherm", anonymousId, currentUrl: "http://localhost/readiness", message, debug: true }),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status} for ${scenario.id}: ${message}`);
        last = (await response.json()) as ChatBody;
      }
      if (!last) throw new Error(`No response for ${scenario.id}`);
      rows.push({ scenario, last, failures: evaluate(last, scenario.expectLast) });
    }
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }

  const passed = rows.filter((row) => row.failures.length === 0).length;
  const passedGates = gates.filter((gate) => gate.pass).length;
  const healthPassed = !healthFailure;
  const totalChecks = rows.length + gates.length + 1;
  const passedChecks = passed + passedGates + (healthPassed ? 1 : 0);
  const finalVerdict = passedChecks === totalChecks ? "PASS" : "NEEDS WORK";
  const report = [
    "# Production Readiness Audit",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Max response time: ${maxResponseTimeMs} ms`,
    "",
    "## Summary",
    "",
    `- scenarios: ${rows.length}`,
    `- passed: ${passed}`,
    `- failed: ${rows.length - passed}`,
    `- production gates: ${passedGates}/${gates.length}`,
    `- health endpoint: ${healthPassed ? "PASS" : "FAIL"}`,
    `- total checks: ${passedChecks}/${totalChecks}`,
    `- verdict: ${finalVerdict}`,
    "",
    "## Production Gates",
    "",
    "| Gate | Pass | Evidence |",
    "| --- | --- | --- |",
    ...gates.map((gate) => `| ${gate.id} | ${gate.pass ? "yes" : "no"} | ${gate.evidence.replace(/\|/g, "/")} |`),
    `| health_endpoint | ${healthPassed ? "yes" : "no"} | ${healthFailure || "Local /health returned ok with commit and diagnosticFlowVersion."} |`,
    "",
    "## Cases",
    "",
    "| Scenario | Pass | ms | LLM used | Mode | Service | Intent | Sources | Failures |",
    "| --- | --- | ---: | --- | --- | --- | --- | ---: | --- |",
    ...rows.map((row) => {
      const debug = row.last.debug || {};
      return `| ${row.scenario.id} | ${row.failures.length ? "no" : "yes"} | ${row.last.responseTimeMs || 0} | ${debug.llmUsed ? "yes" : "no"} | ${debug.answerMode || "n/a"} | ${debug.serviceType || "n/a"} | ${debug.serviceIntent || "n/a"} | ${debug.retrievalSourcesCount ?? 0} | ${row.failures.join("; ").replace(/\|/g, "/") || ""} |`;
    }),
    "",
    "## Sample Failed Answers",
    "",
    ...rows
      .filter((row) => row.failures.length)
      .slice(0, 8)
      .flatMap((row) => [
        `### ${row.scenario.id}`,
        "",
        `Failures: ${row.failures.join("; ")}`,
        "",
        row.last.answer,
        "",
      ]),
  ].join("\n");

  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, report, "utf8");
  console.log(`Production readiness audit: ${passed}/${rows.length} passed`);
  console.log(`Saved ${reportPath}`);
  if (process.env.PRODUCTION_READINESS_STRICT === "1" && passed !== rows.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
