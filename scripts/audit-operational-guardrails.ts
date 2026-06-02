import { writeFile } from "node:fs/promises";
import path from "node:path";
import { createChatResponse } from "./chat-server";

type Case = {
  id: string;
  message: string;
  anyOf: string[];
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

const reportPath = path.join(process.cwd(), "knowledge", "operational-guardrails-audit.md");
const maxMs = 8000;

const globalForbidden = [
  "urcite prideme",
  "urcite ano",
  "garantujeme",
  "garantujem",
  "bezplatna obhliadka",
  "nezavazna obhliadka",
  "zadarmo",
  "zdarma",
  "24 7",
  "nonstop",
  "kompletne vybavime",
  "servisujeme cudzie montaze",
  "ano servisujeme vsetky",
  "splátky poskytujeme",
  "splatky poskytujeme",
  "mame poistenie",
  "mame certifikaciu",
];

const cases: Case[] = [
  { id: "emergency_callouts", message: "Robíte havarijné výjazdy?", anyOf: ["potvr", "kontakt", "servis", "prever"], mustNotContain: ["nonstop", "24/7"], expectedService: "service", minSources: 1 },
  { id: "service_area", message: "Do akých miest a okresov chodíte?", anyOf: ["potvr", "lokalit", "posob", "kontakt"], expectedIntent: "location", minSources: 1 },
  { id: "today_visit", message: "Viete prísť ešte dnes?", anyOf: ["potvr", "term", "kontakt", "prever"], expectedIntent: "contact", minSources: 1 },
  { id: "weekend_work", message: "Robíte aj cez víkendy?", anyOf: ["potvr", "term", "kontakt", "prever"], expectedIntent: "contact", minSources: 1 },
  { id: "inspection_paid", message: "Je obhliadka platená?", anyOf: ["potvr", "konzult", "kontakt", "nacen"], expectedIntent: "inspection", minSources: 1 },
  { id: "quote_free", message: "Robíte cenové ponuky zdarma?", anyOf: ["potvr", "ponuk", "nacen", "kontakt"], expectedIntent: "quote", minSources: 1 },
  { id: "photo_quote", message: "Viete naceniť podľa fotiek?", anyOf: ["fot", "orientac", "nacen", "kontakt"], expectedIntent: "quote", minSources: 1 },
  { id: "email_contact", message: "Viete komunikovať emailom?", anyOf: ["email", "kontakt", "potvr"], expectedIntent: "contact", minSources: 1 },
  { id: "whatsapp_contact", message: "Viete komunikovať cez WhatsApp?", anyOf: ["whatsapp", "kontakt", "potvr"], expectedIntent: "contact", minSources: 1 },
  { id: "deposits", message: "Beriete zálohy?", anyOf: ["potvr", "platb", "ponuk", "dohod"], expectedIntent: "price", minSources: 1 },
  { id: "invoice_payment", message: "Dá sa platiť na faktúru?", anyOf: ["potvr", "faktur", "platb", "ponuk"], expectedIntent: "price", minSources: 1 },
  { id: "installments", message: "Poskytujete splátky?", anyOf: ["potvr", "platb", "splat", "ponuk"], expectedIntent: "price", minSources: 1 },
  { id: "warranty_work", message: "Poskytujete záruku na prácu?", anyOf: ["potvr", "zaruk", "ponuk", "zmluv"], minSources: 1 },
  { id: "insurance", message: "Máte poistenie zodpovednosti?", anyOf: ["potvr", "poisten", "doklad", "kontakt"], minSources: 1 },
  { id: "gas_certification", message: "Máte certifikáciu na plynové zariadenia?", anyOf: ["potvr", "certifik", "plyn", "opravnen"], minSources: 1 },
  { id: "docs_after_install", message: "Dostanem po realizácii dokumentáciu?", anyOf: ["potvr", "dokument", "revíz", "odovzd"], minSources: 1 },
  { id: "company_age", message: "Koľko rokov ste na trhu?", anyOf: ["geotherm", "rok", "trh", "skusen"], minSources: 1 },
  { id: "references", message: "Máte referencie a fotky realizácií?", anyOf: ["refer", "realiz", "fot", "ukaz"], minSources: 1 },
  { id: "diagnostics_visit", message: "Viete prísť na diagnostiku?", anyOf: ["servis", "diagnost", "kontakt", "lokalit"], expectedService: "service", minSources: 1 },
  { id: "personal_visit", message: "Viete prísť pozrieť problém osobne?", anyOf: ["servis", "problem", "kontakt", "lokalit"], expectedService: "service", minSources: 1 },
  { id: "video_inspection", message: "Viete spraviť obhliadku cez videohovor?", anyOf: ["video", "fot", "konzult", "prever"], minSources: 1 },
  { id: "order_process", message: "Aký je postup pri objednávke služby?", anyOf: ["kontakt", "konzult", "nacen", "termin"], minSources: 1 },
  {
    id: "booking",
    message: "Ako si môžem rezervovať termín?",
    anyOf: ["kontakt", "termin", "dopyt", "servis"],
    mustNotContain: ["ide o existujuce zariadenie", "pravidelny servis alebo zvazujes vymenu", "potrebujem vediet par veci"],
    expectedIntent: "contact",
    minSources: 1,
  },
  { id: "response_time", message: "Ako rýchlo odpovedáte na dopyty?", anyOf: ["potvr", "kontakt", "dopyt", "prever"], minSources: 1 },
  { id: "realization_contact", message: "Kto bude môj kontakt počas realizácie?", anyOf: ["kontakt", "realiz", "osob", "dopyt"], expectedIntent: "contact", minSources: 1 },
  { id: "warranty_service", message: "Robíte aj servis počas záruky?", anyOf: ["servis", "zaruk", "potvr", "vyrob"], expectedService: "service", minSources: 1 },
  { id: "post_warranty_service", message: "Robíte pozáručný servis?", anyOf: ["servis", "zaruk", "potvr", "model"], expectedService: "service", minSources: 1 },
  { id: "service_order_process", message: "Ako prebieha servisný zásah?", anyOf: ["servis", "model", "kontakt", "chy"], expectedService: "service", minSources: 1 },
  { id: "own_material", message: "Používate vlastný materiál alebo môj?", anyOf: ["material", "potvr", "ponuk", "rozsah"], minSources: 1 },
  { id: "small_jobs", message: "Robíte aj malé zákazky?", anyOf: ["potvr", "rozsah", "kontakt", "prever"], minSources: 1 },
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

function hasAny(answer: string, terms: string[]): boolean {
  const text = normalize(answer);
  return terms.some((term) => text.includes(normalize(term)));
}

function forbiddenHits(answer: string, terms: string[] = []): string[] {
  const text = normalize(answer);
  return [...globalForbidden, ...terms].filter((term) => text.includes(normalize(term)));
}

async function runCase(testCase: Case): Promise<Row> {
  const response = await createChatResponse({
    siteId: "geotherm",
    anonymousId: `operational_${testCase.id}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    currentUrl: "http://localhost/operational-guardrails",
    message: testCase.message,
  });
  const debug = response.debug || {};
  const sources = debug.retrievalSourcesCount ?? response.sources.length;
  const failures: string[] = [];

  if (!debug.llmUsed) failures.push(`llmUsed=false (${debug.fallbackType || "no fallbackType"})`);
  if ((response.responseTimeMs || 0) > maxMs) failures.push(`responseTimeMs>${maxMs}: ${response.responseTimeMs}`);
  if (testCase.expectedService && debug.serviceType !== testCase.expectedService) failures.push(`serviceType expected ${testCase.expectedService}, got ${debug.serviceType || "n/a"}`);
  if (testCase.expectedIntent && debug.serviceIntent !== testCase.expectedIntent) failures.push(`serviceIntent expected ${testCase.expectedIntent}, got ${debug.serviceIntent || "n/a"}`);
  if (sources < (testCase.minSources ?? 1)) failures.push(`sources<${testCase.minSources ?? 1}: ${sources}`);
  if (testCase.maxSources !== undefined && sources > testCase.maxSources) failures.push(`sources>${testCase.maxSources}: ${sources}`);
  if (!hasAny(response.answer, testCase.anyOf)) failures.push(`missing any terms: ${testCase.anyOf.join("/")}`);
  const forbidden = forbiddenHits(response.answer, testCase.mustNotContain);
  if (forbidden.length) failures.push(`forbidden terms: ${[...new Set(forbidden)].join("/")}`);
  if (/strucne k otazke|co z toho chces upresnit|prepac teraz neviem|manual:\/\/|sectionheading|pagetitle/i.test(normalize(response.answer))) failures.push("legacy fallback or raw source leaked");

  return {
    testCase,
    answer: response.answer,
    ms: response.responseTimeMs || 0,
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
    "# Operational Guardrails Audit",
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
      `Message: ${row.testCase.message}`,
      `Failures: ${row.failures.join("; ")}`,
      "",
      row.answer.slice(0, 1400),
      "",
    ]),
  ].join("\n");

  await writeFile(reportPath, `${report}\n`, "utf8");
  console.log(`Operational guardrails audit: ${passed}/${rows.length} passed`);
  console.log(`Saved ${reportPath}`);
  if (passed !== rows.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
