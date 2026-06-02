import { writeFile } from "node:fs/promises";
import path from "node:path";
import { createChatResponse } from "./chat-server";

type ChatResult = Awaited<ReturnType<typeof createChatResponse>>;

type TurnExpectation = {
  service?: string;
  intent?: string;
  mustInclude?: string[];
  anyOf?: string[];
  forbidden?: string[];
  maxQuestions?: number;
  minSources?: number;
};

type Scenario = {
  id: string;
  title: string;
  messages: string[];
  expectations: TurnExpectation[];
};

type Row = {
  scenario: Scenario;
  turn: number;
  message: string;
  answer: string;
  ms: number;
  llmUsed: boolean;
  mode: string;
  service: string;
  intent: string;
  sources: number;
  failures: string[];
};

const reportPath = path.join(process.cwd(), "knowledge", "non-heat-pump-flow-audit.md");
const maxMs = 8000;

const scenarios: Scenario[] = [
  {
    id: "air_conditioning_multisplit",
    title: "Klimatizacia do dvoch miestnosti",
    messages: ["Chcem chladenie do domu", "Obyvacka a spalna, spolu asi 45m2", "chcem to nacenit"],
    expectations: [
      { service: "air_conditioning", intent: "recommendation", anyOf: ["klimatiz", "multisplit", "vonkajsia jednotka"], maxQuestions: 2 },
      { service: "air_conditioning", anyOf: ["multisplit", "samostat", "vonkajsia jednotka"], maxQuestions: 2 },
      { service: "air_conditioning", anyOf: ["nacen", "ponuk", "konzult", "kontakt"], forbidden: ["tepelne cerpadlo vzduch voda"] },
    ],
  },
  {
    id: "heat_recovery_new_build",
    title: "Rekuperacia do novostavby",
    messages: ["Chcem lepsi vzduch v dome bez otvarania okien", "novostavba 140m2, cely dom", "chcem ponuku"],
    expectations: [
      { service: "heat_recovery", anyOf: ["rekuper", "vetran"], maxQuestions: 2 },
      { service: "heat_recovery", mustInclude: ["rekuper"], anyOf: ["rozvod", "cely dom", "technicka miestnost"], maxQuestions: 2 },
      { service: "heat_recovery", anyOf: ["ponuk", "nacen", "konzult", "kontakt"], forbidden: ["bezplatna obhliadka"] },
    ],
  },
  {
    id: "floor_heating_quote",
    title: "Podlahove kurenie nacenenie",
    messages: ["Robite podlahovku do domu?", "novostavba 120m2", "chcem nacenit"],
    expectations: [
      { service: "floor_heating", anyOf: ["podlah", "kuren"], maxQuestions: 2 },
      { service: "floor_heating", mustInclude: ["podlah"], anyOf: ["plocha", "projekt", "skladba", "rozdelovac"], maxQuestions: 2 },
      { service: "floor_heating", anyOf: ["nacen", "ponuk", "konzult", "kontakt"], forbidden: ["tepelne cerpadlo ako jedina moznost"] },
    ],
  },
  {
    id: "ceiling_cooling_new_build",
    title: "Stropne chladenie",
    messages: ["Viete spravit stropne chladenie?", "novostavba 130m2, cely dom", "chcem vediet najlepsie riesenie"],
    expectations: [
      { service: "ceiling_cooling", anyOf: ["strop", "chladen"], maxQuestions: 2 },
      { service: "ceiling_cooling", mustInclude: ["strop"], anyOf: ["rosn", "vlhk", "regul", "projekt"], maxQuestions: 2 },
      { service: "ceiling_cooling", anyOf: ["konzult", "nacen", "ponuk", "riesenie"], forbidden: ["automaticky nahradi klimatizaciu"] },
    ],
  },
  {
    id: "service_fault_triage",
    title: "Servis poruchy",
    messages: ["Kotol ukazuje chybu, co robit?", "Vaillant, kod F.75, Trnava", "chcem servis"],
    expectations: [
      { service: "service", intent: "service_fault", anyOf: ["model", "chyb", "kod", "lokalit"], forbidden: ["otvor", "rozober"], maxQuestions: 2 },
      { service: "service", intent: "service_fault", anyOf: ["servis", "technik", "kontakt", "fotku"], forbidden: ["cudzie montaze automaticky"] },
      { service: "service", anyOf: ["servis", "technik", "kontakt", "termin"], forbidden: ["garantujem termin"] },
    ],
  },
  {
    id: "subsidy_assistance",
    title: "Dotacia bez halucinacie",
    messages: ["Vybavite mi dotaciu na tepelne cerpadlo?", "rodinny dom, vymena plynoveho kotla", "chcem s tym pomoct"],
    expectations: [
      { service: "subsidy", intent: "subsidy", anyOf: ["dotac", "podmien", "over"], forbidden: ["garantujeme", "kompletne vybavime", "odpocitame"] },
      { service: "subsidy", anyOf: ["over", "podmien", "pomoc", "konzult"], forbidden: ["narok mate isty"] },
      { service: "subsidy", anyOf: ["kontakt", "konzult", "ponuk", "prever"], forbidden: ["garantujem dotaciu"] },
    ],
  },
  {
    id: "complex_house_solution",
    title: "Kurenie, vetranie aj chladenie",
    messages: ["Novostavba, chcem kurenie, vetranie aj chladenie", "120m2, podlahovka, 4 osoby", "co by ste navrhli?"],
    expectations: [
      { service: "complex_solution", anyOf: ["kuren", "vetr", "chladen"], maxQuestions: 2 },
      { service: "complex_solution", anyOf: ["cerpadl", "rekuper", "strop", "klimatiz"], maxQuestions: 2 },
      { service: "complex_solution", anyOf: ["konzult", "nacen", "ponuk", "riesenie"], forbidden: ["dalsi dotaznik"] },
    ],
  },
  {
    id: "water_softener_scope",
    title: "Zmakcovac vody",
    messages: ["Mate aj zmakcovac vody?", "do rodinneho domu, tvrda voda", "chcem nacenit"],
    expectations: [
      { anyOf: ["voda", "zmakcovac", "uprava vody"], maxQuestions: 2 },
      { anyOf: ["tvrda voda", "rozbor", "spotreba", "dom"], maxQuestions: 2 },
      { anyOf: ["nacen", "ponuk", "konzult", "fot", "kontakt"], forbidden: ["tepelne cerpadlo"] },
    ],
  },
  {
    id: "central_vacuum_scope",
    title: "Centralny vysavac",
    messages: ["Robite centralne vysavace?", "novostavba bungalov 150m2", "chcem vediet postup"],
    expectations: [
      { anyOf: ["central", "vysav"], maxQuestions: 2 },
      { anyOf: ["rozvod", "projekt", "zasuv", "nacen"], maxQuestions: 2 },
      { anyOf: ["postup", "konzult", "nacen", "podorys"], forbidden: ["tepelne cerpadlo"] },
    ],
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

function hasAll(answer: string, terms: string[]): boolean {
  const normalized = normalize(answer);
  return terms.every((term) => normalized.includes(normalize(term)));
}

function hasAny(answer: string, terms: string[]): boolean {
  const normalized = normalize(answer);
  return terms.some((term) => normalized.includes(normalize(term)));
}

function questionCount(answer: string): number {
  return (answer.match(/\?/g) || []).length;
}

function checkAnswer(response: ChatResult, expectation: TurnExpectation): string[] {
  const debug = response.debug || {};
  const answer = response.answer || "";
  const sources = debug.retrievalSourcesCount ?? response.sources.length;
  const failures: string[] = [];

  if (!debug.llmUsed) failures.push(`llmUsed=false (${debug.fallbackType || "no fallbackType"})`);
  if ((response.responseTimeMs || 0) > maxMs) failures.push(`responseTimeMs>${maxMs}: ${response.responseTimeMs}`);
  if (expectation.service && debug.serviceType !== expectation.service) failures.push(`serviceType expected ${expectation.service}, got ${debug.serviceType || "n/a"}`);
  if (expectation.intent && debug.serviceIntent !== expectation.intent) failures.push(`serviceIntent expected ${expectation.intent}, got ${debug.serviceIntent || "n/a"}`);
  if (sources < (expectation.minSources ?? 1)) failures.push(`sources<${expectation.minSources ?? 1}: ${sources}`);
  if (expectation.mustInclude && !hasAll(answer, expectation.mustInclude)) failures.push(`missing required terms: ${expectation.mustInclude.join("/")}`);
  if (expectation.anyOf && !hasAny(answer, expectation.anyOf)) failures.push(`missing any terms: ${expectation.anyOf.join("/")}`);
  if (expectation.forbidden) {
    const hits = expectation.forbidden.filter((term) => normalize(answer).includes(normalize(term)));
    if (hits.length) failures.push(`forbidden terms: ${hits.join("/")}`);
  }
  if (expectation.maxQuestions !== undefined && questionCount(answer) > expectation.maxQuestions) failures.push(`too many questions: ${questionCount(answer)}`);
  if (hasAny(answer, ["strucne k otazke", "co z toho chces upresnit", "prepac teraz neviem", "urcil vhodnu sluzbu"])) failures.push("legacy/generic fallback leaked");
  return failures;
}

async function runScenario(scenario: Scenario): Promise<Row[]> {
  const anonymousId = `non_hp_${scenario.id}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const rows: Row[] = [];

  for (let index = 0; index < scenario.messages.length; index += 1) {
    const message = scenario.messages[index] || "";
    const response = await createChatResponse({
      siteId: "geotherm",
      anonymousId,
      currentUrl: "http://localhost/non-heat-pump-flow",
      message,
    });
    const debug = response.debug || {};
    const sources = debug.retrievalSourcesCount ?? response.sources.length;
    rows.push({
      scenario,
      turn: index + 1,
      message,
      answer: response.answer,
      ms: response.responseTimeMs || 0,
      llmUsed: Boolean(debug.llmUsed),
      mode: debug.answerMode || "n/a",
      service: debug.serviceType || "n/a",
      intent: debug.serviceIntent || "n/a",
      sources,
      failures: checkAnswer(response, scenario.expectations[index] || {}),
    });
  }

  return rows;
}

function table(rows: Row[]): string {
  return [
    "| Scenario | Turn | Pass | ms | LLM | Mode | Service | Intent | Sources | Message | Failures |",
    "| --- | ---: | --- | ---: | --- | --- | --- | --- | ---: | --- | --- |",
    ...rows.map((row) => `| ${row.scenario.id} | ${row.turn} | ${row.failures.length ? "no" : "yes"} | ${row.ms} | ${row.llmUsed ? "yes" : "no"} | ${row.mode} | ${row.service} | ${row.intent} | ${row.sources} | ${row.message.replace(/\|/g, "/")} | ${row.failures.join("; ").replace(/\|/g, "/")} |`),
  ].join("\n");
}

async function main(): Promise<void> {
  const rows: Row[] = [];
  for (const scenario of scenarios) rows.push(...(await runScenario(scenario)));

  const passed = rows.filter((row) => row.failures.length === 0).length;
  const failed = rows.length - passed;
  const scenarioSummary = scenarios
    .map((scenario) => {
      const scenarioRows = rows.filter((row) => row.scenario.id === scenario.id);
      const ok = scenarioRows.every((row) => row.failures.length === 0);
      return `- ${scenario.id}: ${ok ? "PASS" : "NEEDS WORK"} (${scenarioRows.filter((row) => !row.failures.length).length}/${scenarioRows.length})`;
    })
    .join("\n");

  const report = [
    "# Non-Heat-Pump Flow Audit",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Scenarios: ${scenarios.length}`,
    `Turns: ${rows.length}`,
    `Passed turns: ${passed}`,
    `Failed turns: ${failed}`,
    `Max response time: ${maxMs} ms`,
    `Verdict: ${failed === 0 ? "PASS" : "NEEDS WORK"}`,
    "",
    "## Scenario Summary",
    "",
    scenarioSummary,
    "",
    "## Turns",
    "",
    table(rows),
    "",
    "## Failed Answer Samples",
    "",
    ...rows
      .filter((row) => row.failures.length)
      .flatMap((row) => [`### ${row.scenario.id} turn ${row.turn}`, "", `Message: ${row.message}`, `Failures: ${row.failures.join("; ")}`, "", row.answer.slice(0, 1400), ""]),
  ].join("\n");

  await writeFile(reportPath, `${report}\n`, "utf8");
  console.log(`Non-heat-pump flow audit: ${passed}/${rows.length} turns passed`);
  console.log(`Saved ${reportPath}`);
  if (failed > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
