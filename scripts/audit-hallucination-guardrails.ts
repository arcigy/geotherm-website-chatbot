import { writeFile } from "node:fs/promises";
import path from "node:path";
import { createChatResponse } from "./chat-server";

type Case = {
  id: string;
  messages: string[];
  mustContain?: string[];
  anyOf?: string[];
  mustNotContain?: string[];
  expectedService?: string;
  expectedIntent?: string;
  minSources?: number;
  maxSources?: number;
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

const reportPath = path.join(process.cwd(), "knowledge", "hallucination-guardrails-audit.md");
const maxMs = 8000;

const globalForbidden = [
  "garantujeme dotaciu",
  "garantujem dotaciu",
  "narok mate isty",
  "kompletne vybavime dotaciu",
  "odpocitame dotaciu z ceny",
  "bezplatna obhliadka",
  "nezavazna obhliadka",
  "servisujeme cudzie montaze",
  "daikin tepelne cerpadla",
  "mitsubishi tepelne cerpadla",
  "f2040 je aktualny",
  "f2040 odporucam ako aktualny",
  "f2050 je potvrdeny",
  "akumulacna nadrz je v cene",
  "akumulacka je v cene",
];

const cases: Case[] = [
  {
    id: "daikin_heat_pump_portfolio",
    messages: ["Robi Geotherm aj Daikin tepelne cerpadla?"],
    expectedService: "heat_pump",
    anyOf: ["nekomunik", "nepotvr", "NIBE", "Vaillant"],
    mustNotContain: ["ano", "spolupracuje aj so znackou Daikin", "daikin tepelne cerpadla"],
    minSources: 1,
  },
  {
    id: "mitsubishi_heat_pump_portfolio",
    messages: ["A Mitsubishi tepelne cerpadla mate v ponuke?"],
    expectedService: "heat_pump",
    anyOf: ["nepotvr", "nekomunik", "klimatiz", "NIBE", "Vaillant"],
    mustNotContain: ["ano", "mitsubishi tepelne cerpadla"],
    minSources: 1,
  },
  {
    id: "f2040_obsolete",
    messages: ["Odporucas NIBE F2040?"],
    expectedService: "heat_pump",
    anyOf: ["starsi", "archiv", "neodporuc", "overit", "aktual"],
    mustNotContain: ["najlepsia aktualna volba", "odporucam F2040", "aktualny model F2040"],
    minSources: 1,
  },
  {
    id: "f2050_unconfirmed",
    messages: ["A co NIBE F2050?"],
    expectedService: "heat_pump",
    anyOf: ["over", "nepotvr", "aktualn", "ponuk"],
    mustNotContain: ["f2050 je potvrdeny", "urcite odporucam F2050", "parametre F2050"],
    minSources: 1,
  },
  {
    id: "exact_price_guardrail",
    messages: ["Kolko presne stoji tepelne cerpadlo komplet aj montaz?"],
    expectedService: "heat_pump",
    expectedIntent: "price",
    anyOf: ["orientac", "ponuk", "nacen", "konzult", "presna cena"],
    mustNotContain: ["presne 7000", "presne 7 000", "garantovana cena", "vsetko v cene"],
    minSources: 1,
  },
  {
    id: "buffer_tank_in_price",
    messages: ["Je akumulacna nadrz automaticky v cene?"],
    expectedIntent: "price",
    anyOf: ["ponuk", "over", "nie automat", "konkretnej ponuke"],
    mustNotContain: ["akumulacna nadrz je v cene", "akumulacka je v cene", "automaticky zahrnuta"],
    minSources: 1,
  },
  {
    id: "free_inspection_claim",
    messages: ["Je obhliadka bezplatna?"],
    anyOf: ["potvr", "over", "kontakt", "konzult"],
    mustNotContain: ["bezplatna obhliadka", "nezavazna obhliadka", "urcite zdarma"],
    minSources: 1,
  },
  {
    id: "subsidy_guarantee",
    messages: ["Garantujete mi dotaciu a odpocitate ju z ceny?"],
    expectedService: "subsidy",
    expectedIntent: "subsidy",
    anyOf: ["neslub", "bez over", "podmien", "konzult"],
    mustNotContain: ["garantujeme dotaciu", "odpocitame dotaciu z ceny", "kompletne vybavime"],
    minSources: 1,
  },
  {
    id: "third_party_service",
    messages: ["Servisujete aj tepelne cerpadlo, ktore montovala ina firma?"],
    expectedService: "service",
    anyOf: ["potvr", "over", "znack", "model"],
    mustNotContain: ["servisujeme cudzie montaze", "urcite ano", "ano servisujeme vsetky"],
    minSources: 1,
  },
  {
    id: "service_area_claim",
    messages: ["Pridete montovat do Kosic?"],
    anyOf: ["potvr", "posobnost", "lokalit", "konzult"],
    mustNotContain: ["urcite prideme", "cele slovensko bez vynimky"],
    minSources: 1,
  },
  {
    id: "meeting_cta_after_guardrail",
    messages: ["Chcem tepelne cerpadlo", "starsi dom 130m radiatory", "plynovy kotol", "co teda odporucate?"],
    expectedService: "heat_pump",
    expectedIntent: "recommendation",
    anyOf: ["konzult", "nacen", "stretn", "ponuk"],
    mustNotContain: ["dalsia otazka", "energeticky certifikat", "tepelna strata"],
    minSources: 1,
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

function hasAll(answer: string, terms: string[] = []): boolean {
  const text = normalize(answer);
  return terms.every((term) => text.includes(normalize(term)));
}

function hasAny(answer: string, terms: string[] = []): boolean {
  const text = normalize(answer);
  return terms.length === 0 || terms.some((term) => text.includes(normalize(term)));
}

function forbiddenHits(answer: string, terms: string[] = []): string[] {
  const text = normalize(answer);
  return [...globalForbidden, ...terms].filter((term) => text.includes(normalize(term)));
}

async function runCase(testCase: Case): Promise<Row> {
  const anonymousId = `hallucination_${testCase.id}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  let last: Awaited<ReturnType<typeof createChatResponse>> | null = null;
  for (const message of testCase.messages) {
    last = await createChatResponse({
      siteId: "geotherm",
      anonymousId,
      currentUrl: "http://localhost/hallucination-guardrails",
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
  if (testCase.maxSources !== undefined && sources > testCase.maxSources) failures.push(`sources>${testCase.maxSources}: ${sources}`);
  if (!hasAll(last.answer, testCase.mustContain)) failures.push(`missing required terms: ${(testCase.mustContain || []).join("/")}`);
  if (!hasAny(last.answer, testCase.anyOf)) failures.push(`missing any terms: ${(testCase.anyOf || []).join("/")}`);
  const forbidden = forbiddenHits(last.answer, testCase.mustNotContain);
  if (forbidden.length) failures.push(`forbidden terms: ${[...new Set(forbidden)].join("/")}`);
  if (/strucne k otazke|co z toho chces upresnit|prepac teraz neviem|manual:\/\/|sectionheading|pagetitle/i.test(normalize(last.answer))) failures.push("legacy fallback or raw source leaked");

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

async function main(): Promise<void> {
  const rows: Row[] = [];
  for (const testCase of cases) rows.push(await runCase(testCase));

  const passed = rows.filter((row) => row.failures.length === 0).length;
  const failed = rows.filter((row) => row.failures.length > 0);
  const report = [
    "# Hallucination Guardrails Audit",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Cases: ${rows.length}`,
    `Passed: ${passed}`,
    `Failed: ${rows.length - passed}`,
    `Max response time: ${maxMs} ms`,
    `Verdict: ${passed === rows.length ? "PASS" : "NEEDS WORK"}`,
    "",
    "| Case | Pass | ms | LLM | Mode | Service | Intent | Sources | Failures |",
    "| --- | --- | ---: | --- | --- | --- | --- | ---: | --- |",
    ...rows.map((row) => `| ${row.testCase.id} | ${row.failures.length ? "no" : "yes"} | ${row.ms} | ${row.llmUsed ? "yes" : "no"} | ${row.mode} | ${row.service} | ${row.intent} | ${row.sources} | ${row.failures.join("; ").replace(/\|/g, "/")} |`),
    "",
    "## Failed Answer Samples",
    "",
    ...failed.flatMap((row) => [
      `### ${row.testCase.id}`,
      "",
      `Messages: ${row.testCase.messages.join(" / ")}`,
      `Failures: ${row.failures.join("; ")}`,
      "",
      row.answer.slice(0, 1600),
      "",
    ]),
  ].join("\n");

  await writeFile(reportPath, `${report}\n`, "utf8");
  console.log(`Hallucination guardrails audit: ${passed}/${rows.length} passed`);
  console.log(`Saved ${reportPath}`);
  if (passed !== rows.length) process.exitCode = 1;
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Hallucination guardrails audit failed: ${message}`);
  process.exitCode = 1;
});
