import { writeFile } from "node:fs/promises";
import path from "node:path";
import { createChatResponse } from "./chat-server";

type Expectation = {
  mustContain?: string[];
  anyOf?: string[];
  forbidden?: string[];
  service?: string;
  intent?: string;
  maxSources?: number;
};

type Scenario = {
  id: string;
  messages: string[];
  expectations: Expectation[];
};

type Row = {
  scenario: string;
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

const reportPath = path.join(process.cwd(), "knowledge", "sales-feedback-audit.md");
const maxMs = 8000;

const scenarios: Scenario[] = [
  {
    id: "neutral_microphone_test",
    messages: ["Ahoj raz dva tri"],
    expectations: [
      {
        anyOf: ["test vstupu", "mikrofon", "mikrofón"],
        forbidden: ["servis tepel", "servisn", "dotac", "kolo", "porucha"],
        maxSources: 0,
      },
    ],
  },
  {
    id: "large_house_no_price_or_model_guess",
    messages: [
      "Este raz prosim orientacnu cenu TC s montazou - preferujem vzduch voda ale dajte aj zemne",
      "mam 580m2 dom - zda sa mi to lacne",
      "ano ktore modely by boli vhodne?",
      "chcem vediet cenu s montazou",
    ],
    expectations: [
      { anyOf: ["cena", "montaz", "montáž"], forbidden: ["580"] },
      {
        mustContain: ["nad 300"],
        anyOf: ["kontakt", "konzult", "individual"],
        forbidden: ["10 000", "15 000", "18 000", "F2120", "S2125", "aroTHERM"],
      },
      {
        anyOf: ["nevyberal", "nevybral", "konzult", "kontakt"],
        forbidden: ["F2120", "S2125", "aroTHERM", "najvykonnejsi", "najvýkonnejší"],
      },
      {
        mustContain: ["nad 300"],
        anyOf: ["kontakt", "konzult", "nacenen"],
        forbidden: ["10 000", "15 000", "18 000"],
      },
    ],
  },
  {
    id: "appointment_time_not_confirmed",
    messages: ["chcem cenovu ponuku a obhliadku", "dnes medzi 15-16:00", "Ruzindolska 16 trnava, ale 8:00 uz bolo", "10:00"],
    expectations: [
      { anyOf: ["kontakt", "telefon", "e-mail", "email"], intent: "quote" },
      {
        anyOf: ["nepotvrdzujem", "treba potvrdit", "treba potvrdiť", "kontakt"],
        forbidden: ["kolo 6", "2017", "zelena domacnostiam", "potvrdzujem", "mozeme sa stretnut"],
      },
      {
        anyOf: ["nepotvrdzujem", "treba potvrdit", "treba potvrdiť", "kontakt"],
        forbidden: ["potvrdzujem adresu", "mozeme sa dohodnut", "kedy by sa"],
      },
      {
        anyOf: ["nepotvrdzujem", "treba potvrdit", "treba potvrdiť", "kontakt"],
        forbidden: ["potvrdzujem", "dnes o 10", "tesim sa na stretnutie"],
      },
    ],
  },
  {
    id: "past_or_impossible_appointment_not_confirmed",
    messages: [
      "chcem cenovu ponuku a obhliadku",
      "pockaj a mozeme sa stretnut dnes o 8:00 rano?",
      "a co vcera mozeme aj vcera?",
      "Ruzindolska 16 trnava, ale 8:00 uz bolo",
      "10:00",
    ],
    expectations: [
      { anyOf: ["kontakt", "telefon", "e-mail", "email"], intent: "quote" },
      {
        anyOf: ["nepotvrdzujem", "treba potvrdit", "treba potvrdiť", "kontakt"],
        forbidden: ["mozeme sa stretnut", "potvrdzujem", "dnes o 8", "tesim sa na stretnutie"],
      },
      {
        anyOf: ["nepotvrdzujem", "treba potvrdit", "treba potvrdiť", "kontakt"],
        forbidden: ["stale plati", "dnesna obhliadka o 8", "potvrdzujem", "mozeme aj vcera"],
      },
      {
        anyOf: ["nepotvrdzujem", "treba potvrdit", "treba potvrdiť", "kontakt"],
        forbidden: ["potvrdzujem adresu", "mozeme sa dohodnut", "kedy by sa"],
      },
      {
        anyOf: ["nepotvrdzujem", "treba potvrdit", "treba potvrdiť", "kontakt"],
        forbidden: ["potvrdzujem", "dnes o 10", "tesim sa na stretnutie"],
      },
    ],
  },
];

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s€]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesAll(answer: string, terms?: string[]): boolean {
  if (!terms?.length) return true;
  const normalized = normalize(answer);
  return terms.every((term) => normalized.includes(normalize(term)));
}

function includesAny(answer: string, terms?: string[]): boolean {
  if (!terms?.length) return true;
  const normalized = normalize(answer);
  return terms.some((term) => normalized.includes(normalize(term)));
}

function forbiddenHits(answer: string, terms?: string[]): string[] {
  if (!terms?.length) return [];
  const normalized = normalize(answer);
  return terms.filter((term) => normalized.includes(normalize(term)));
}

function tykanieHits(answer: string): string[] {
  const normalized = normalize(answer);
  const terms = ["mas", "tvoj", "tvoja", "tvoje", "teba", "tebou", "chces", "vies", "posli", "napis", "dopln mi", "kuris"];
  return terms.filter((term) => new RegExp(`(^|\\s)${term.replace(/\s+/g, "\\s+")}(\\s|$)`).test(normalized));
}

function validate(row: Omit<Row, "failures">, expectation: Expectation): string[] {
  const failures: string[] = [];
  if (!row.llmUsed) failures.push("llmUsed=false");
  if (row.ms > maxMs) failures.push(`responseTimeMs>${maxMs}: ${row.ms}`);
  if (expectation.service && row.service !== expectation.service) failures.push(`service expected ${expectation.service}, got ${row.service}`);
  if (expectation.intent && row.intent !== expectation.intent) failures.push(`intent expected ${expectation.intent}, got ${row.intent}`);
  if (!includesAll(row.answer, expectation.mustContain)) failures.push(`missing: ${(expectation.mustContain || []).join("/")}`);
  if (!includesAny(row.answer, expectation.anyOf)) failures.push(`missing any: ${(expectation.anyOf || []).join("/")}`);
  const forbidden = forbiddenHits(row.answer, expectation.forbidden);
  if (forbidden.length) failures.push(`forbidden: ${forbidden.join("/")}`);
  const tykanie = tykanieHits(row.answer);
  if (tykanie.length) failures.push(`tykanie: ${tykanie.join("/")}`);
  if (expectation.maxSources !== undefined && row.sources > expectation.maxSources) failures.push(`sources>${expectation.maxSources}: ${row.sources}`);
  if (/strucne k otazke|co z toho chces upresnit|pagetitle|sectionheading|manual:\/\//.test(normalize(row.answer))) failures.push("weak fallback or raw source leaked");
  return failures;
}

async function main(): Promise<void> {
  const rows: Row[] = [];
  for (const scenario of scenarios) {
    const anonymousId = `sales_feedback_${scenario.id}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    for (let index = 0; index < scenario.messages.length; index += 1) {
      const message = scenario.messages[index];
      const response = await createChatResponse({
        siteId: "geotherm",
        anonymousId,
        currentUrl: "http://localhost/sales-feedback",
        message,
      });
      const partial = {
        scenario: scenario.id,
        turn: index + 1,
        message,
        answer: response.answer,
        ms: response.responseTimeMs || 0,
        llmUsed: Boolean(response.debug?.llmUsed),
        mode: response.debug?.answerMode || "n/a",
        service: response.debug?.serviceType || "n/a",
        intent: response.debug?.serviceIntent || "n/a",
        sources: response.debug?.retrievalSourcesCount ?? response.sources.length,
      };
      rows.push({ ...partial, failures: validate(partial, scenario.expectations[index] || {}) });
    }
  }

  const passed = rows.filter((row) => row.failures.length === 0).length;
  const report = [
    "# Sales Feedback Audit",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Turns: ${rows.length}`,
    `Passed: ${passed}`,
    `Failed: ${rows.length - passed}`,
    `Max response time: ${maxMs} ms`,
    `Verdict: ${passed === rows.length ? "PASS" : "NEEDS WORK"}`,
    "",
    "## Turns",
    "",
    "| Scenario | Turn | Pass | ms | LLM | Mode | Service | Intent | Sources | Message | Failures |",
    "| --- | ---: | --- | ---: | --- | --- | --- | --- | ---: | --- | --- |",
    ...rows.map((row) => `| ${row.scenario} | ${row.turn} | ${row.failures.length ? "no" : "yes"} | ${row.ms} | ${row.llmUsed ? "yes" : "no"} | ${row.mode} | ${row.service} | ${row.intent} | ${row.sources} | ${row.message.replace(/\|/g, "/")} | ${row.failures.join("; ").replace(/\|/g, "/")} |`),
    "",
    "## Failed Answer Samples",
    "",
    ...rows
      .filter((row) => row.failures.length)
      .flatMap((row) => [`### ${row.scenario} turn ${row.turn}`, "", `Message: ${row.message}`, `Failures: ${row.failures.join("; ")}`, "", row.answer.slice(0, 1400), ""]),
  ].join("\n");
  await writeFile(reportPath, `${report}\n`, "utf8");
  console.log(`Sales feedback audit: ${passed}/${rows.length} passed`);
  console.log(`Saved ${reportPath}`);
  if (passed !== rows.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
