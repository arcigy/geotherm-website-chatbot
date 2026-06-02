import { writeFile } from "node:fs/promises";
import path from "node:path";
import { createChatResponse } from "./chat-server";

type Case = {
  id: string;
  message: string;
  anyOf?: string[];
  forbidden?: string[];
};

type Row = {
  testCase: Case;
  answer: string;
  ms: number;
  mode: string;
  service: string;
  intent: string;
  llmUsed: boolean;
  sources: number;
  failures: string[];
};

const reportPath = path.join(process.cwd(), "knowledge", "small-talk-surface-audit.md");
const maxMs = 8000;

const cases: Case[] = [
  { id: "greeting_ahoj", message: "ahoj", anyOf: ["som tu", "ahoj"] },
  { id: "greeting_cau", message: "čau", anyOf: ["som tu", "ahoj", "cau"] },
  { id: "greeting_dobry_den", message: "dobrý deň", anyOf: ["som tu", "dobry", "den"] },
  { id: "greeting_zdravim", message: "zdravím", anyOf: ["som tu", "ahoj", "zdravim"] },
  { id: "how_are_you", message: "ako sa máš?", anyOf: ["dobre"] },
  { id: "greeting_how_are_you", message: "ahoj, ako sa mas?", anyOf: ["dobre"] },
  { id: "thanks", message: "ďakujem", anyOf: ["rado", "stalo"] },
  { id: "thanks_short", message: "diky", anyOf: ["rado", "stalo", "jasne"] },
  { id: "ok", message: "ok", anyOf: ["jasne", "ok"] },
  { id: "super", message: "super", anyOf: ["jasne", "super"] },
  { id: "identity", message: "kto si?", anyOf: ["chatbot", "geotherm"] },
  { id: "identity_alt", message: "čo si zač?", anyOf: ["chatbot", "geotherm"] },
  { id: "laugh", message: "haha", anyOf: ["jasne", "som tu", "haha"] },
  { id: "test", message: "test", anyOf: ["som tu", "test", "jasne"] },
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

function questionCount(value: string): number {
  return (value.match(/\?/g) || []).length;
}

function validate(testCase: Case, body: Awaited<ReturnType<typeof createChatResponse>>): string[] {
  const failures: string[] = [];
  const debug = body.debug || {};
  const answer = normalize(body.answer || "");
  const sources = debug.retrievalSourcesCount ?? body.sources.length;

  if (!debug.llmUsed) failures.push(`llmUsed=false (${debug.fallbackType || "no fallbackType"})`);
  if ((body.responseTimeMs || 0) > maxMs) failures.push(`responseTimeMs>${maxMs}: ${body.responseTimeMs}`);
  if (debug.answerMode !== "general_chat") failures.push(`answerMode expected general_chat, got ${debug.answerMode || "n/a"}`);
  if (debug.serviceType !== "unknown") failures.push(`serviceType expected unknown, got ${debug.serviceType}`);
  if (debug.serviceIntent !== "general") failures.push(`serviceIntent expected general, got ${debug.serviceIntent}`);
  if (sources !== 0 || body.sources.length !== 0) failures.push(`sources expected 0, got ${sources}/${body.sources.length}`);
  if (questionCount(body.answer || "") > 0) failures.push("small-talk should not ask follow-up questions");
  if (testCase.anyOf && !testCase.anyOf.some((term) => answer.includes(normalize(term)))) failures.push(`missing any terms: ${testCase.anyOf.join("/")}`);
  if (/(tepel|cerpad|klimatiz|rekuper|podlah|dotac|nacen|ponuk|novostav|radiator)/.test(answer)) failures.push("product/service menu leaked into small-talk");
  if (/manual:\/\/|http:\/\/www\.geotherm\.sk|sectionheading|pagetitle/.test(answer)) failures.push("raw source leaked");
  return failures;
}

async function main(): Promise<void> {
  const rows: Row[] = [];
  for (const testCase of cases) {
    const body = await createChatResponse({
      siteId: "geotherm",
      anonymousId: `small_talk_${testCase.id}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      currentUrl: "http://localhost/small-talk-surface",
      message: testCase.message,
    });
    const debug = body.debug || {};
    rows.push({
      testCase,
      answer: body.answer || "",
      ms: body.responseTimeMs || 0,
      mode: debug.answerMode || "n/a",
      service: debug.serviceType || "n/a",
      intent: debug.serviceIntent || "n/a",
      llmUsed: Boolean(debug.llmUsed),
      sources: debug.retrievalSourcesCount ?? body.sources.length,
      failures: validate(testCase, body),
    });
  }

  const passed = rows.filter((row) => row.failures.length === 0).length;
  const failed = rows.filter((row) => row.failures.length > 0);
  const report = [
    "# Small Talk Surface Audit",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Cases: ${rows.length}`,
    `Passed: ${passed}`,
    `Verdict: ${passed === rows.length ? "PASS" : "NEEDS WORK"}`,
    `Max response time: ${maxMs} ms`,
    "",
    "| Case | Pass | ms | LLM | Mode | Service | Intent | Sources | Message | Failures |",
    "| --- | --- | ---: | --- | --- | --- | --- | ---: | --- | --- |",
    ...rows.map((row) =>
      `| ${row.testCase.id} | ${row.failures.length ? "no" : "yes"} | ${row.ms} | ${row.llmUsed ? "yes" : "no"} | ${row.mode} | ${row.service} | ${row.intent} | ${row.sources} | ${row.testCase.message.replace(/\|/g, "/")} | ${row.failures.join("; ").replace(/\|/g, "/")} |`,
    ),
    failed.length ? "\n## Failed Answer Samples\n" : "",
    ...failed.flatMap((row) => [
      `### ${row.testCase.id}`,
      "",
      `Message: ${row.testCase.message}`,
      `Failures: ${row.failures.join("; ")}`,
      "",
      row.answer,
      "",
    ]),
  ].join("\n");

  await writeFile(reportPath, report, "utf8");
  console.log(`Small talk surface audit: ${passed}/${rows.length} passed`);
  console.log(`Saved ${reportPath}`);
  if (passed !== rows.length) process.exitCode = 1;
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Small talk surface audit failed: ${message}`);
  process.exitCode = 1;
});
