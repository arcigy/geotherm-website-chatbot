import { writeFile } from "node:fs/promises";
import path from "node:path";
import { createChatResponse } from "./chat-server";

type ChatBody = Awaited<ReturnType<typeof createChatResponse>>;

type TurnCheck = {
  service?: string;
  intent?: string;
  mode?: string | RegExp;
  any?: string[];
  all?: string[];
  none?: string[];
};

type Scenario = {
  id: string;
  messages: string[];
  checks: TurnCheck[];
};

type Row = {
  scenario: string;
  turn: number;
  message: string;
  service: string;
  intent: string;
  mode: string;
  answer: string;
  failures: string[];
};

const reportPath = path.join(process.cwd(), "knowledge", "topic-switching-audit.md");

function normalize(value: string | undefined | null): string {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesAny(value: string, terms: string[] = []): boolean {
  const text = normalize(value);
  return terms.some((term) => text.includes(normalize(term)));
}

function includesAll(value: string, terms: string[] = []): boolean {
  const text = normalize(value);
  return terms.every((term) => text.includes(normalize(term)));
}

function modeMatches(mode: string, expected?: string | RegExp): boolean {
  if (!expected) return true;
  return typeof expected === "string" ? mode === expected : expected.test(mode);
}

const globalForbidden = [
  "co z toho chces upresnit",
  "stručne k otázke",
  "strucne k otazke",
  "urcil vhodnu sluzbu",
  "riesis kurenie chladenie vetranie servis alebo dotaciu",
  "manual://",
  "sectionHeading",
  "pageTitle",
  "posli projekt",
  "energeticky certifikat",
  "tepelnu stratu",
];

const scenarios: Scenario[] = [
  {
    id: "heat_pump_to_cooling_to_recovery_to_filters_to_price",
    messages: ["ake tc predavate?", "ake mate klimy?", "a rekuperaciu robite?", "a filtre?", "kolko stoji rekuperacia?", "dobre, dohodnime konzultaciu"],
    checks: [
      { service: "heat_pump", intent: "brand_model", mode: "brand_model_answer", all: ["NIBE", "Vaillant"], none: ["Daikin", "Mitsubishi"] },
      { service: "air_conditioning", any: ["klimatizacia", "klima", "multisplit"], none: ["NIBE a Vaillant", "tepelne cerpadla"] },
      { service: "heat_recovery", any: ["rekuperacia", "vetranie"], none: ["klimatizacia", "NIBE a Vaillant"] },
      { service: "heat_recovery", any: ["filter", "filtre", "rekuperacia"], none: ["tepelne cerpadlo", "klimatizacia", "novostavba", "lepsi vzduch"] },
      { service: "heat_recovery", intent: "price", mode: /price_answer|direct_answer/, any: ["cena", "nacenenie", "ponuka", "rozsah"], none: ["presne", "garantujem"] },
      { service: "heat_recovery", intent: "contact", mode: /direct_answer|handoff_cta/, any: ["konzultacia", "meno", "telefon", "email"], none: ["projekt", "tepelnu stratu", "energeticky certifikat"] },
    ],
  },
  {
    id: "heating_recommendation_to_ac_price_to_heat_pump_price",
    messages: ["Ahoj, chcem tc", "Starsi 140m radiatory", "ake mate klimy?", "a cena?", "a cena tepelneho cerpadla?"],
    checks: [
      { service: "heat_pump", intent: "recommendation", any: ["vzduch-voda", "radiatory", "podlahove"] },
      { service: "heat_pump", intent: "recommendation", all: ["vzduch-voda", "radiator"], none: ["najprv urcil", "riesis kurenie"] },
      { service: "air_conditioning", any: ["klimatizacia", "multisplit", "chladenie"], none: ["NIBE a Vaillant"] },
      { service: "air_conditioning", intent: "price", any: ["cena", "nacenenie", "miestnost", "klimatizacia"], none: ["tepelne cerpadlo vzduch-voda"] },
      { service: "heat_pump", intent: "price", mode: "price_answer", any: ["tepelne cerpadlo", "montaz", "cena", "nacenenie"], none: ["klimatizacia"] },
    ],
  },
  {
    id: "recovery_to_heat_pump_to_subsidy_to_service_fault",
    messages: ["robite rekuperaciu?", "a ake tc mate?", "su na to dotacie?", "NIBE hlasi chybu F134"],
    checks: [
      { service: "heat_recovery", any: ["rekuperacia", "vetranie"] },
      { service: "heat_pump", intent: "brand_model", all: ["NIBE", "Vaillant"], none: ["rekuperacia"] },
      { service: "subsidy", intent: "subsidy", mode: /subsidy_answer|direct_answer/, any: ["dotacia", "podmienky", "overit"], none: ["vybavime kompletne", "odratame"] },
      { service: "service", intent: "service_fault", any: ["chyba", "servis", "model", "kontakt"], none: ["dotacia", "NIBE a Vaillant su znacky"] },
    ],
  },
  {
    id: "company_services_to_water_to_sanitary_to_vacuum_to_screeds",
    messages: ["ake sluzby poskytujete?", "robite zmakcovac vody?", "a geberit wc?", "a centralny vysavac?", "a potery?"],
    checks: [
      { service: "company", any: ["tepelne cerpadla", "klimatizacie", "rekuperacia"] },
      { service: "water", any: ["zmakcovac", "voda"], none: ["tepelne cerpadlo"] },
      { service: "sanitary", any: ["geberit", "wc", "zdravotechnika", "sanita"], none: ["zmakcovac"] },
      { service: "central_vacuum", any: ["centralny vysavac", "vysavac"], none: ["wc"] },
      { service: "screeds", any: ["poter", "potery", "anhydrit", "cement"], none: ["vysavac"] },
    ],
  },
  {
    id: "solar_to_boiler_to_radiators_to_heat_pump",
    messages: ["robite fotovoltaiku?", "a kondenzačny kotol?", "a radiatory?", "chcem tč k tym radiatorom"],
    checks: [
      { service: "solar_photovoltaic", any: ["fotovoltika", "solar", "panely"], none: ["kondenzacny kotol"] },
      { service: "boilers", any: ["kotol", "kondenzacny"], none: ["fotovoltika"] },
      { service: "radiators", any: ["radiatory", "vykurovacie"], none: ["kotol"] },
      { service: "heat_pump", intent: "recommendation", all: ["tepelne cerpadlo", "radiator"], none: ["fotovoltika", "kondenzacny kotol"] },
    ],
  },
  {
    id: "small_talk_noise_then_service_switch",
    messages: ["ako sa maaaaaaaas?", "haha ok", "chcem klimatizaciu do spalne", "a rekuperacia?", "a servis kotla?"],
    checks: [
      { service: "unknown", intent: "general", mode: "general_chat", any: ["som tu", "dobre", "geotherm"], none: ["tepelne cerpadlo", "nacenenie"] },
      { service: "unknown", intent: "general", mode: "general_chat", any: ["jasne", "som tu", "ok"], none: ["tepelne cerpadlo"] },
      { service: "air_conditioning", any: ["klimatizacia", "miestnost", "spalna"], none: ["rekuperacia"] },
      { service: "heat_recovery", any: ["rekuperacia", "vetranie"], none: ["klimatizacia do spalne"] },
      { service: "service", intent: "service_fault", any: ["servis", "kotol", "znacka", "model"], none: ["rekuperacia"] },
    ],
  },
  {
    id: "complex_solution_jump_to_direct_topics",
    messages: ["riesim novostavbu, kurenie chladenie aj vetranie", "najprv klimy", "nie, radsej stropne chladenie", "a podlahovku tiez robite?", "dobre, dohodnime konzultaciu"],
    checks: [
      { service: "complex_solution", any: ["komplex", "kurenie", "chladenie", "vetranie"], none: ["iba tepelne cerpadlo"] },
      { service: "air_conditioning", any: ["klimatizacia", "klimy", "multisplit"], none: ["komplexne riesenie"] },
      { service: "ceiling_cooling", any: ["stropne chladenie", "rosny bod", "vlhkost"], none: ["klimatizacia"] },
      { service: "floor_heating", any: ["podlahove", "kurenie", "vykurovanie"], none: ["stropne chladenie"] },
      { intent: "contact", any: ["konzultacia", "meno", "telefon", "email"], none: ["projekt", "tepelnu stratu"] },
    ],
  },
];

function validate(body: ChatBody, check: TurnCheck): string[] {
  const failures: string[] = [];
  const debug = body.debug || {};
  const answer = body.answer || "";
  const service = debug.serviceType || "n/a";
  const intent = debug.serviceIntent || "n/a";
  const mode = debug.answerMode || "n/a";

  if (check.service && service !== check.service) failures.push(`service expected ${check.service}, got ${service}`);
  if (check.intent && intent !== check.intent) failures.push(`intent expected ${check.intent}, got ${intent}`);
  if (!modeMatches(mode, check.mode)) failures.push(`mode expected ${String(check.mode)}, got ${mode}`);
  if (check.any && !includesAny(answer, check.any)) failures.push(`answer missing any of: ${check.any.join(" / ")}`);
  if (check.all && !includesAll(answer, check.all)) failures.push(`answer missing all of: ${check.all.join(" / ")}`);
  const forbidden = [...globalForbidden, ...(check.none || [])];
  const forbiddenHit = forbidden.find((term) => includesAny(answer, [term]));
  if (forbiddenHit) failures.push(`forbidden answer term: ${forbiddenHit}`);
  if (!debug.serverCommit) failures.push("debug.serverCommit missing");
  if (!debug.enrichedRetrievalQuery && service !== "unknown") failures.push("debug.enrichedRetrievalQuery missing");
  if (debug.fallbackUsed && debug.fallbackType === "deterministic_ai_safe") failures.push("deterministic_ai_safe fallback used");
  return failures;
}

async function main(): Promise<void> {
  const rows: Row[] = [];
  for (const scenario of scenarios) {
    const anonymousId = `topic_switch_${scenario.id}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    for (let index = 0; index < scenario.messages.length; index += 1) {
      const message = scenario.messages[index];
      const body = await createChatResponse({
        siteId: "geotherm",
        anonymousId,
        currentUrl: "http://localhost/topic-switching-audit",
        message,
      });
      rows.push({
        scenario: scenario.id,
        turn: index + 1,
        message,
        service: body.debug?.serviceType || "n/a",
        intent: body.debug?.serviceIntent || "n/a",
        mode: body.debug?.answerMode || "n/a",
        answer: body.answer || "",
        failures: validate(body, scenario.checks[index]),
      });
    }
  }

  const passed = rows.filter((row) => row.failures.length === 0).length;
  const failed = rows.filter((row) => row.failures.length > 0);
  const report = [
    "# Topic Switching Audit",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Scenarios: ${scenarios.length}`,
    `Turns: ${rows.length}`,
    `Passed: ${passed}`,
    `Verdict: ${passed === rows.length ? "PASS" : "NEEDS WORK"}`,
    "",
    "| Scenario | Turn | Pass | Service | Intent | Mode | Message | Failures |",
    "| --- | ---: | --- | --- | --- | --- | --- | --- |",
    ...rows.map((row) =>
      `| ${row.scenario} | ${row.turn} | ${row.failures.length ? "no" : "yes"} | ${row.service} | ${row.intent} | ${row.mode} | ${row.message.replace(/\|/g, "/")} | ${row.failures.join("; ").replace(/\|/g, "/")} |`,
    ),
    failed.length ? "\n## Failed Answer Samples\n" : "",
    ...failed.flatMap((row) => [
      `### ${row.scenario} turn ${row.turn}`,
      "",
      `Message: ${row.message}`,
      `Debug: service=${row.service}, intent=${row.intent}, mode=${row.mode}`,
      `Failures: ${row.failures.join("; ")}`,
      "",
      row.answer,
      "",
    ]),
  ].join("\n");

  await writeFile(reportPath, report, "utf8");
  console.log(`Topic switching audit: ${passed}/${rows.length} passed`);
  console.log(`Saved ${reportPath}`);
  if (passed !== rows.length) process.exitCode = 1;
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Topic switching audit failed: ${message}`);
  process.exitCode = 1;
});
