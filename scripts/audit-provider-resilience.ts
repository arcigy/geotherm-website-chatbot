import { writeFile } from "node:fs/promises";
import path from "node:path";
import { createChatResponse } from "./chat-server";

type Expectation = {
  serviceType?: string;
  serviceIntent?: string;
  answerMode?: string[];
  mustContain?: string[];
  mustNotContain?: string[];
  minSources?: number;
  maxSources?: number;
  requireQuestion?: boolean;
  requireMeetingCta?: boolean;
};

type Scenario = {
  id: string;
  messages: string[];
  expectLast: Expectation;
};

type Attempt = {
  scenario: Scenario;
  run: number;
  ms: number;
  llmUsed: boolean;
  mode: string;
  service: string;
  intent: string;
  sources: number;
  answer: string;
  failures: string[];
};

const reportPath = path.join(process.cwd(), "knowledge", "provider-resilience-audit.md");
const jsonReportPath = path.join(process.cwd(), "knowledge", "provider-resilience-audit.json");
const repeats = Number.parseInt(process.env.PROVIDER_RESILIENCE_REPEATS || "3", 10);
const maxMs = Number.parseInt(process.env.PROVIDER_RESILIENCE_MAX_MS || "8000", 10);

const scenarios: Scenario[] = [
  {
    id: "small_talk_no_rag",
    messages: ["ahoj, ako sa máš?"],
    expectLast: { maxSources: 0, mustContain: ["dobre"], mustNotContain: ["tepelné čerpadlá", "novostavba"] },
  },
  {
    id: "services_overview",
    messages: ["Aké služby poskytujete?"],
    expectLast: { minSources: 1, mustContain: ["tepel", "klimatiz", "rekuper", "servis"] },
  },
  {
    id: "vague_heat_pump_followup",
    messages: ["Ahoj, chcem tč"],
    expectLast: { serviceType: "heat_pump", serviceIntent: "recommendation", minSources: 1, mustContain: ["vzduch-voda"], requireQuestion: true },
  },
  {
    id: "old_house_radiators_verdict",
    messages: ["Ahoj, chcem tč", "Starší 140m radiátory"],
    expectLast: { serviceType: "heat_pump", serviceIntent: "recommendation", minSources: 1, mustContain: ["radi", "vzduch-voda"] },
  },
  {
    id: "new_build_closure_models_cta",
    messages: ["aké tč máte?", "novostavba 120m", "podlahovku", "5 osôb, áno plánujem chladenie"],
    expectLast: {
      serviceType: "heat_pump",
      serviceIntent: "recommendation",
      minSources: 1,
      mustContain: ["S2125", "aroTHERM"],
      mustNotContain: ["tepelná strata", "energetický certifikát"],
      requireMeetingCta: true,
    },
  },
  {
    id: "third_party_service_cautious",
    messages: ["Viete spraviť servis aj cudzej montáže?"],
    expectLast: { serviceType: "service", serviceIntent: "service_fault", minSources: 1, mustContain: ["potvr"], mustNotContain: ["určite áno", "servisujeme cudzie"] },
  },
  {
    id: "buffer_tank_price_scope",
    messages: ["je akumulačná nádrž v tej cene?"],
    expectLast: { serviceIntent: "price", minSources: 1, mustContain: ["ponuk"], mustNotContain: ["automaticky zahrnut"] },
  },
  {
    id: "plan_obnovy_subsidy",
    messages: ["Potrebujem poradiť alebo naceniť Plán obnovy, čo by ste odporučili?"],
    expectLast: { serviceType: "subsidy", serviceIntent: "subsidy", minSources: 1, mustContain: ["dot", "podpor", "over"] },
  },
  {
    id: "photovoltaics_heat_pump",
    messages: ["Potrebujem poradiť alebo naceniť Fotovoltaika a tepelné čerpadlo, čo by ste odporučili?"],
    expectLast: { minSources: 1, mustContain: ["fotovolt", "panel", "tepel"] },
  },
  {
    id: "mss_solar",
    messages: ["Riešim MSS systém. Robíte to a ako by som mal postupovať?"],
    expectLast: { minSources: 1, mustContain: ["solár", "kolektor", "zásob"] },
  },
  {
    id: "garden_frost_free_valve",
    messages: ["Robíte alebo viete vysvetliť tému: Záhradný nezámrzný ventil?"],
    expectLast: { minSources: 1, mustContain: ["ventil", "vod", "rozvod"] },
  },
  {
    id: "air_conditioning_plural",
    messages: ["Klimatizácie?"],
    expectLast: { serviceType: "air_conditioning", minSources: 1, mustContain: ["klimatiz"] },
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

function hasAll(answer: string, terms: string[] | undefined): boolean {
  if (!terms?.length) return true;
  const normalized = normalize(answer);
  return terms.every((term) => normalized.includes(normalize(term)));
}

function forbiddenTerms(answer: string, terms: string[] | undefined): string[] {
  if (!terms?.length) return [];
  const normalized = normalize(answer);
  return terms.filter((term) => {
    const normalizedTerm = normalize(term);
    if (!normalizedTerm) return false;
    if (
      normalizedTerm.includes("automaticky zahrnut") &&
      /(nie je|nie je bezpecne|nesmie|nemozno|nemozem|netvrd|bez potvrdenia).{0,80}automaticky zahrnut/.test(normalized)
    ) {
      return false;
    }
    return normalized.includes(normalizedTerm);
  });
}

function percentile(values: number[], p: number): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[index];
}

function validate(attempt: Omit<Attempt, "failures">, expectation: Expectation): string[] {
  const failures: string[] = [];
  const answer = attempt.answer || "";
  if (attempt.ms > maxMs) failures.push(`responseTimeMs>${maxMs}: ${attempt.ms}`);
  if (!attempt.llmUsed) failures.push("llmUsed=false");
  if (expectation.serviceType && attempt.service !== expectation.serviceType) failures.push(`serviceType expected ${expectation.serviceType}, got ${attempt.service}`);
  if (expectation.serviceIntent && attempt.intent !== expectation.serviceIntent) failures.push(`serviceIntent expected ${expectation.serviceIntent}, got ${attempt.intent}`);
  if (expectation.answerMode?.length && !expectation.answerMode.includes(attempt.mode)) failures.push(`answerMode ${attempt.mode} not in ${expectation.answerMode.join(",")}`);
  if (expectation.minSources !== undefined && attempt.sources < expectation.minSources) failures.push(`sources<${expectation.minSources}: ${attempt.sources}`);
  if (expectation.maxSources !== undefined && attempt.sources > expectation.maxSources) failures.push(`sources>${expectation.maxSources}: ${attempt.sources}`);
  if (!hasAll(answer, expectation.mustContain)) failures.push(`missing terms: ${(expectation.mustContain || []).join(", ")}`);
  const forbidden = forbiddenTerms(answer, expectation.mustNotContain);
  if (forbidden.length) failures.push(`forbidden terms: ${forbidden.join(", ")}`);
  if (expectation.requireQuestion && !answer.includes("?")) failures.push("missing follow-up question");
  if (expectation.requireMeetingCta && !/(konzult|stretn|meeting|nacen|ponuk)/.test(normalize(answer))) failures.push("missing meeting/consultation/pricing CTA");
  if (/strucne k otazke|co z toho chces upresnit|prepacte teraz neviem|manual:\/\/|pagetitle|sectionheading/.test(normalize(answer))) {
    failures.push("legacy fallback or raw source leaked");
  }
  return failures;
}

async function runScenario(scenario: Scenario, run: number): Promise<Attempt> {
  const anonymousId = `provider_resilience_${scenario.id}_${run}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  let last: Awaited<ReturnType<typeof createChatResponse>> | null = null;
  for (const message of scenario.messages) {
    last = await createChatResponse({
      siteId: "geotherm",
      anonymousId,
      currentUrl: "http://localhost/provider-resilience",
      message,
    });
  }
  if (!last) throw new Error(`No response for ${scenario.id}`);
  const debug = last.debug || {};
  const attemptBase = {
    scenario,
    run,
    ms: last.responseTimeMs || 0,
    llmUsed: Boolean(debug.llmUsed),
    mode: debug.answerMode || "n/a",
    service: debug.serviceType || "n/a",
    intent: debug.serviceIntent || "n/a",
    sources: debug.retrievalSourcesCount ?? last.sources.length,
    answer: last.answer || "",
  };
  return {
    ...attemptBase,
    failures: validate(attemptBase, scenario.expectLast),
  };
}

function mdTable(attempts: Attempt[]): string {
  return [
    "| Scenario | Run | Pass | ms | LLM | Mode | Service | Intent | Sources | Failures |",
    "| --- | ---: | --- | ---: | --- | --- | --- | --- | ---: | --- |",
    ...attempts.map((attempt) =>
      [
        attempt.scenario.id,
        attempt.run,
        attempt.failures.length ? "no" : "yes",
        attempt.ms,
        attempt.llmUsed ? "yes" : "no",
        attempt.mode,
        attempt.service,
        attempt.intent,
        attempt.sources,
        attempt.failures.join("; "),
      ]
        .map((cell) => String(cell).replace(/\|/g, "/"))
        .join(" | "),
    ).map((line) => `| ${line} |`),
  ].join("\n");
}

async function main(): Promise<void> {
  const attempts: Attempt[] = [];
  for (let run = 1; run <= repeats; run += 1) {
    for (const scenario of scenarios) {
      attempts.push(await runScenario(scenario, run));
    }
  }

  const passed = attempts.filter((attempt) => attempt.failures.length === 0).length;
  const failed = attempts.length - passed;
  const llmFailures = attempts.filter((attempt) => !attempt.llmUsed).length;
  const slow = attempts.filter((attempt) => attempt.ms > maxMs).length;
  const times = attempts.map((attempt) => attempt.ms);
  const scenarioSummary = scenarios
    .map((scenario) => {
      const rows = attempts.filter((attempt) => attempt.scenario.id === scenario.id);
      return `- ${scenario.id}: ${rows.filter((attempt) => attempt.failures.length === 0).length}/${rows.length}, max ${Math.max(...rows.map((attempt) => attempt.ms))} ms`;
    })
    .join("\n");
  const failedSamples = attempts
    .filter((attempt) => attempt.failures.length)
    .slice(0, 12)
    .map((attempt) => [`### ${attempt.scenario.id} run ${attempt.run}`, "", `Failures: ${attempt.failures.join("; ")}`, "", attempt.answer].join("\n"))
    .join("\n\n");

  const report = [
    "# Provider Resilience Audit",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Scenarios: ${scenarios.length}`,
    `Repeats per scenario: ${repeats}`,
    `Attempts: ${attempts.length}`,
    `Max response time: ${maxMs} ms`,
    "",
    "## Summary",
    "",
    `- passed: ${passed}`,
    `- failed: ${failed}`,
    `- llmUsed=false: ${llmFailures}`,
    `- over ${maxMs} ms: ${slow}`,
    `- p95 response time: ${percentile(times, 95)} ms`,
    `- max response time: ${Math.max(...times)} ms`,
    `- verdict: ${failed === 0 ? "PASS" : "NEEDS WORK"}`,
    "",
    "## Scenario Summary",
    "",
    scenarioSummary,
    "",
    "## Attempts",
    "",
    mdTable(attempts),
    "",
    "## Failed Answer Samples",
    "",
    failedSamples || "None",
    "",
  ].join("\n");

  await writeFile(reportPath, report, "utf8");
  await writeFile(jsonReportPath, JSON.stringify({ generatedAt: new Date().toISOString(), repeats, maxMs, attempts }, null, 2), "utf8");
  console.log(`Provider resilience audit: ${passed}/${attempts.length} passed`);
  console.log(`Saved ${reportPath}`);
  if (failed > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
