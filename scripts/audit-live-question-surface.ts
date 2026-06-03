import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createChatResponse } from "./chat-server";

type Row = {
  id: string;
  question: string;
  pass: boolean;
  ms: number;
  llmUsed: boolean;
  mode: string;
  service: string;
  intent: string;
  sources: number;
  failures: string[];
  answer: string;
};

const questionsPath = path.join(process.cwd(), "knowledge", "live-question-list.json");
const reportPath = path.join(process.cwd(), "knowledge", "live-question-surface-audit.md");
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
  "nonstop servis",
  "kompletne vybavime dotaciu",
  "odpocitame dotaciu z ceny",
  "servisujeme vsetky cudzie montaze",
  "servisujeme cudzie montaze",
  "mame poistenie zodpovednosti",
  "mame certifikaciu",
];

function repairMojibake(value: string): string {
  if (!/[ĂÄĹÅ]/.test(value)) return value;
  try {
    return Buffer.from(value, "latin1").toString("utf8");
  } catch {
    return value;
  }
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function mdTable(headers: string[], rows: Array<Array<string | number>>): string {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map((cell) => String(cell).replace(/\|/g, "/")).join(" | ")} |`),
  ].join("\n");
}

function isCompanyQuestion(question: string): boolean {
  return !/^(ahoj|cau|ako sa mas|dakujem|ok)$/i.test(normalize(question));
}

function countQuestionMarks(value: string): number {
  return (value.match(/\?/g) || []).length;
}

function tykanieHits(value: string): string[] {
  const text = normalize(value);
  const terms = ["mas", "tvoj", "tvoja", "tvoje", "teba", "tebou", "chces", "vies", "riesis", "posli", "napis"];
  return terms.filter((term) => new RegExp(`(^|\\s)${term}(\\s|$)`).test(text));
}

function forbiddenHits(value: string): string[] {
  const text = normalize(value);
  return globalForbidden.filter((term) => {
    const normalizedTerm = normalize(term);
    if (!text.includes(normalizedTerm)) return false;
    if (
      (normalizedTerm === "24 7" || normalizedTerm.includes("nonstop")) &&
      /(nesluboval|nepotvrdzujem|nemam potvrdeny|nemame potvrdeny|bez potvrdeneho|treba potvrdit|dostupnost treba potvrdit).{0,100}(24 7|nonstop)/.test(text)
    ) {
      return false;
    }
    return true;
  });
}

function validate(question: string, body: Awaited<ReturnType<typeof createChatResponse>>): string[] {
  const failures: string[] = [];
  const debug = body.debug || {};
  const answer = normalize(body.answer);
  const sources = debug.retrievalSourcesCount ?? body.sources.length;
  if (!debug.llmUsed) failures.push(`llmUsed=false (${debug.fallbackType || "no fallbackType"})`);
  if ((body.responseTimeMs || 0) > maxMs) failures.push(`responseTimeMs>${maxMs}: ${body.responseTimeMs}`);
  if (/strucne k otazke|co z toho chces upresnit|prepac teraz neviem pripravit dobru odpoved/.test(answer)) failures.push("old fallback phrase");
  if (/pageTitle|sectionHeading|snippet|manual:\/\/|http:\/\/www\.geotherm\.sk/.test(body.answer)) failures.push("raw source leakage");
  if (isCompanyQuestion(question) && sources < 1) failures.push("company/service answer without sources");
  if (isCompanyQuestion(question) && debug.answerMode === "general_chat") failures.push("company question routed as general_chat");
  const tykanie = tykanieHits(body.answer);
  if (tykanie.length) failures.push(`tykanie: ${tykanie.join("/")}`);
  const forbidden = forbiddenHits(body.answer);
  if (forbidden.length) failures.push(`forbidden claim: ${[...new Set(forbidden)].join("/")}`);
  if (countQuestionMarks(body.answer) > 2) failures.push(`too many follow-up questions: ${countQuestionMarks(body.answer)}`);
  return failures;
}

async function loadQuestions(): Promise<string[]> {
  const raw = JSON.parse(await readFile(questionsPath, "utf8")) as string[];
  return raw.map(repairMojibake);
}

export async function runLiveQuestionSurfaceAudit(): Promise<{ passed: number; total: number }> {
  const questions = await loadQuestions();
  const rows: Row[] = [];
  for (let index = 0; index < questions.length; index += 1) {
    const question = questions[index];
    const body = await createChatResponse({
      siteId: "geotherm",
      anonymousId: `live_surface_${index}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      currentUrl: "http://localhost/live-question-surface",
      message: question,
    });
    const failures = validate(question, body);
    rows.push({
      id: `Q${String(index + 1).padStart(3, "0")}`,
      question,
      pass: failures.length === 0,
      ms: body.responseTimeMs || 0,
      llmUsed: Boolean(body.debug?.llmUsed),
      mode: body.debug?.answerMode || "n/a",
      service: body.debug?.serviceType || "n/a",
      intent: body.debug?.serviceIntent || "n/a",
      sources: body.debug?.retrievalSourcesCount ?? body.sources.length,
      failures,
      answer: body.answer,
    });
  }

  const passed = rows.filter((row) => row.pass).length;
  const failed = rows.filter((row) => !row.pass);
  const report = [
    "# Live Question Surface Audit",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Questions: ${rows.length}`,
    `Passed: ${passed}`,
    `Failed: ${failed.length}`,
    `Max response time: ${maxMs} ms`,
    "",
    "## Failures",
    failed.length
      ? mdTable(
          ["id", "ms", "llm", "mode", "service", "intent", "sources", "failures", "question"],
          failed.map((row) => [row.id, row.ms, row.llmUsed ? "yes" : "no", row.mode, row.service, row.intent, row.sources, row.failures.join("; "), row.question]),
        )
      : "No failed live questions.",
    "",
    "## All Questions",
    mdTable(
      ["id", "pass", "ms", "llm", "mode", "service", "intent", "sources", "question"],
      rows.map((row) => [row.id, row.pass ? "yes" : "no", row.ms, row.llmUsed ? "yes" : "no", row.mode, row.service, row.intent, row.sources, row.question]),
    ),
    "",
    "## Failed Answer Samples",
    ...failed.slice(0, 20).flatMap((row) => [`### ${row.id} ${row.question}`, "", `Failures: ${row.failures.join("; ")}`, "", row.answer.slice(0, 1200), ""]),
  ].join("\n");
  await writeFile(reportPath, `${report}\n`, "utf8");
  return { passed, total: rows.length };
}

if (require.main === module) {
  runLiveQuestionSurfaceAudit()
    .then(({ passed, total }) => {
      console.log(`Live question surface audit: ${passed}/${total} passed`);
      console.log(`Saved ${reportPath}`);
      if (passed !== total) process.exitCode = 1;
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
