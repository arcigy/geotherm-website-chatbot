import { writeFile } from "node:fs/promises";
import path from "node:path";
import { createChatResponse } from "./chat-server";

type Case = {
  id: string;
  messages: string[];
  expectedService?: string;
  expectedIntent?: string;
  ctaTerms?: string[];
  forbidden?: string[];
  minSources?: number;
};

type Row = {
  testCase: Case;
  answer: string;
  ms: number;
  llmUsed: boolean;
  mode: string;
  service: string;
  intent: string;
  sources: number;
  failures: string[];
};

const reportPath = path.join(process.cwd(), "knowledge", "cta-coverage-audit.md");
const maxMs = 8000;
const defaultCtaTerms = ["konzult", "nacen", "ponuk", "kontakt", "servis", "technik", "stretn", "ozva"];

const cases: Case[] = [
  {
    id: "heat_pump_initial",
    messages: ["Ahoj, chcem tepelne cerpadlo"],
    expectedService: "heat_pump",
    expectedIntent: "recommendation",
    ctaTerms: ["novostav", "starsi", "plocha", "radiator", "podlah"],
    minSources: 1,
  },
  {
    id: "heat_pump_closure",
    messages: ["ake TC mate?", "novostavba 120m", "podlahovka", "5 osob, chcem aj chladenie"],
    expectedService: "heat_pump",
    expectedIntent: "recommendation",
    ctaTerms: ["konzult", "nacen", "ponuk", "stretn"],
    forbidden: ["energeticky certifikat", "tepelnu stratu", "projekt ako dalsi krok"],
    minSources: 1,
  },
  {
    id: "air_conditioning_quote",
    messages: ["Chcem klimatizaciu do obyvacky a spalne"],
    expectedService: "air_conditioning",
    ctaTerms: ["konzult", "nacen", "jednotk", "miestnost"],
    minSources: 1,
  },
  {
    id: "heat_recovery_quote",
    messages: ["Riesim rekuperaciu do novostavby"],
    expectedService: "heat_recovery",
    ctaTerms: ["konzult", "nacen", "vetr", "rozvod"],
    minSources: 1,
  },
  {
    id: "floor_heating_quote",
    messages: ["Robite podlahove kurenie do domu?"],
    expectedService: "floor_heating",
    ctaTerms: ["konzult", "nacen", "plocha", "projekt"],
    minSources: 1,
  },
  {
    id: "ceiling_cooling_quote",
    messages: ["Viete spravit stropne chladenie?"],
    expectedService: "ceiling_cooling",
    ctaTerms: ["konzult", "nacen", "novostav", "rekonstruk"],
    minSources: 1,
  },
  {
    id: "complex_solution_quote",
    messages: ["Potrebujem kurenie, vetranie aj chladenie do domu"],
    expectedService: "complex_solution",
    ctaTerms: ["konzult", "nacen", "vykurov", "vetr", "chladen"],
    minSources: 1,
  },
  {
    id: "service_fault_handoff",
    messages: ["Kotol ukazuje chybu, co robit?"],
    expectedService: "service",
    expectedIntent: "service_fault",
    ctaTerms: ["servis", "technik", "model", "chyb"],
    minSources: 1,
  },
  {
    id: "subsidy_handoff",
    messages: ["Vybavite mi dotaciu na tepelne cerpadlo?"],
    expectedIntent: "subsidy",
    ctaTerms: ["pomoc", "konzult", "overi", "podmien"],
    forbidden: ["garantujeme", "kompletne vybavime", "odpocitame"],
    minSources: 1,
  },
  {
    id: "price_handoff",
    messages: ["Ake su ceny tepelnych cerpadiel vratane instalacie?"],
    expectedService: "heat_pump",
    expectedIntent: "price",
    ctaTerms: ["ponuk", "nacen", "realiz", "montaz"],
    minSources: 1,
  },
  {
    id: "water_distribution_handoff",
    messages: ["Robite aj rozvody vody?"],
    ctaTerms: ["konzult", "nacen", "fot", "podorys"],
    minSources: 1,
  },
  {
    id: "small_talk_no_cta",
    messages: ["ahoj"],
    expectedService: "unknown",
    expectedIntent: "general",
    ctaTerms: [],
    forbidden: ["konzult", "ponuk", "nacen", "tepelne cerpadlo"],
    minSources: 0,
  },
];

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function containsAny(answer: string, terms: string[]): boolean {
  const text = normalize(answer);
  return terms.some((term) => text.includes(normalize(term)));
}

function forbiddenHits(answer: string, terms: string[] = []): string[] {
  const text = normalize(answer);
  return terms.filter((term) => text.includes(normalize(term)));
}

async function runCase(testCase: Case): Promise<Row> {
  const anonymousId = `cta_${testCase.id}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  let last: Awaited<ReturnType<typeof createChatResponse>> | null = null;

  for (const message of testCase.messages) {
    last = await createChatResponse({
      siteId: "geotherm",
      anonymousId,
      currentUrl: "http://localhost/cta-coverage",
      message,
    });
  }

  if (!last) throw new Error(`No response for ${testCase.id}`);

  const debug = last.debug || {};
  const sources = debug.retrievalSourcesCount ?? last.sources.length;
  const failures: string[] = [];

  if (!debug.llmUsed) failures.push(`llmUsed=false (${debug.fallbackType || "no fallbackType"})`);
  if ((last.responseTimeMs || 0) > maxMs) failures.push(`responseTimeMs>${maxMs}: ${last.responseTimeMs}`);
  if (testCase.expectedService && debug.serviceType !== testCase.expectedService) failures.push(`serviceType expected ${testCase.expectedService}, got ${debug.serviceType || "n/a"}`);
  if (testCase.expectedIntent && debug.serviceIntent !== testCase.expectedIntent) failures.push(`serviceIntent expected ${testCase.expectedIntent}, got ${debug.serviceIntent || "n/a"}`);
  if (sources < (testCase.minSources ?? 1)) failures.push(`sources<${testCase.minSources ?? 1}: ${sources}`);

  const ctaTerms = testCase.ctaTerms ?? defaultCtaTerms;
  if (ctaTerms.length > 0 && !containsAny(last.answer, ctaTerms)) failures.push(`missing CTA/follow-up terms: ${ctaTerms.join("/")}`);

  const forbidden = forbiddenHits(last.answer, testCase.forbidden);
  if (forbidden.length) failures.push(`forbidden terms: ${forbidden.join("/")}`);
  if (/strucne k otazke|co z toho chces upresnit|prepac teraz neviem/i.test(normalize(last.answer))) failures.push("legacy fallback leaked");

  return {
    testCase,
    answer: last.answer,
    ms: last.responseTimeMs || 0,
    llmUsed: Boolean(debug.llmUsed),
    mode: debug.answerMode || "n/a",
    service: debug.serviceType || "n/a",
    intent: debug.serviceIntent || "n/a",
    sources,
    failures,
  };
}

function mdTable(rows: Row[]): string {
  return [
    "| Case | Pass | ms | LLM | Mode | Service | Intent | Sources | Failures |",
    "| --- | --- | ---: | --- | --- | --- | --- | ---: | --- |",
    ...rows.map((row) => `| ${row.testCase.id} | ${row.failures.length ? "no" : "yes"} | ${row.ms} | ${row.llmUsed ? "yes" : "no"} | ${row.mode} | ${row.service} | ${row.intent} | ${row.sources} | ${row.failures.join("; ").replace(/\|/g, "/")} |`),
  ].join("\n");
}

async function main(): Promise<void> {
  const rows: Row[] = [];
  for (const testCase of cases) rows.push(await runCase(testCase));

  const passed = rows.filter((row) => row.failures.length === 0).length;
  const report = [
    "# CTA Coverage Audit",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Cases: ${rows.length}`,
    `Passed: ${passed}`,
    `Failed: ${rows.length - passed}`,
    `Max response time: ${maxMs} ms`,
    `Verdict: ${passed === rows.length ? "PASS" : "NEEDS WORK"}`,
    "",
    "## Cases",
    "",
    mdTable(rows),
    "",
    "## Failed Answer Samples",
    "",
    ...rows
      .filter((row) => row.failures.length)
      .slice(0, 12)
      .flatMap((row) => [`### ${row.testCase.id}`, "", `Messages: ${row.testCase.messages.join(" / ")}`, `Failures: ${row.failures.join("; ")}`, "", row.answer.slice(0, 1400), ""]),
  ].join("\n");

  await writeFile(reportPath, `${report}\n`, "utf8");
  console.log(`CTA coverage audit: ${passed}/${rows.length} passed`);
  console.log(`Saved ${reportPath}`);
  if (passed !== rows.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
