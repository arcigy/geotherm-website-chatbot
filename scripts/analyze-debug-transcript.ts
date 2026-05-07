import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type Source = {
  pageTitle?: string;
  url?: string;
  sectionHeading?: string;
  heading?: string;
  snippet?: string;
};

type Turn = {
  timestamp?: string;
  userMessage?: string;
  assistantAnswer?: string;
  confidence?: "high" | "medium" | "low" | null;
  intent?: string | null;
  sources?: Source[];
  leadCapture?: {
    shouldAsk?: boolean;
    nextQuestion?: string | null;
  } | null;
  fallbackUsed?: boolean;
};

type Transcript = {
  exportedAt?: string;
  version?: string;
  config?: Record<string, unknown>;
  turns?: Turn[];
};

const inputPath = path.join(process.cwd(), "knowledge", "manual-transcript-sample.json");
const reportPath = path.join(process.cwd(), "knowledge", "manual-transcript-analysis.md");

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function countQuestions(value: string): number {
  return (value.match(/\?/g) || []).length;
}

function hasEarlyContactPush(turn: Turn, index: number): boolean {
  const text = normalize(`${turn.assistantAnswer || ""} ${turn.leadCapture?.nextQuestion || ""}`);
  if (index > 1) return false;
  return ["staci email", "staci telefon", "nechajte kontakt", "kontaktne udaje", "ozve odbornik", "ozval odbornik"].some((term) => text.includes(term));
}

function hasGrounding(turn: Turn): boolean {
  if (turn.fallbackUsed || turn.confidence === "low") return true;
  return Boolean(turn.sources?.length);
}

function isTooLong(turn: Turn): boolean {
  return (turn.assistantAnswer || "").length > 1200;
}

function fallbackLooksValid(turn: Turn): boolean {
  if (!turn.fallbackUsed && turn.confidence !== "low") return true;
  const text = normalize(turn.assistantAnswer || "");
  return text.includes("nenasiel") || text.includes("nemozem") || text.includes("neviem");
}

function sourceSummary(turn: Turn): string {
  if (!turn.sources?.length) return "-";
  return turn.sources.map((source) => `${source.pageTitle || "-"} / ${source.sectionHeading || source.heading || "-"} / ${source.url || "-"}`).join("; ");
}

function mdTable(headers: string[], rows: Array<Array<string | number>>): string {
  const cell = (value: string | number): string => String(value).replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(cell).join(" | ")} |`),
  ].join("\n");
}

async function main(): Promise<void> {
  const transcript = JSON.parse(await readFile(inputPath, "utf8")) as Transcript;
  const turns = transcript.turns || [];
  const rows = turns.map((turn, index) => {
    const answer = turn.assistantAnswer || "";
    const sourcesOk = hasGrounding(turn);
    const lengthOk = !isTooLong(turn);
    const contactOk = !hasEarlyContactPush(turn, index);
    const followupOk = countQuestions(answer) <= 1;
    const fallbackOk = fallbackLooksValid(turn);
    const groundedOk = sourcesOk || Boolean(turn.fallbackUsed);
    const issues = [
      sourcesOk ? "" : "missing sources",
      lengthOk ? "" : "answer too long",
      contactOk ? "" : "early contact push",
      followupOk ? "" : "too many follow-up questions",
      fallbackOk ? "" : "weak fallback wording",
      groundedOk ? "" : "ungrounded answer",
    ].filter(Boolean);

    return {
      index: index + 1,
      turn,
      answerLength: answer.length,
      sourcesOk,
      lengthOk,
      contactOk,
      followupOk,
      fallbackOk,
      groundedOk,
      issues,
      score: [sourcesOk, lengthOk, contactOk, followupOk, fallbackOk, groundedOk].filter(Boolean).length,
    };
  });

  const total = rows.length;
  const withSources = rows.filter((row) => row.sourcesOk).length;
  const tooLong = rows.filter((row) => !row.lengthOk).length;
  const contactViolations = rows.filter((row) => !row.contactOk).length;
  const followupViolations = rows.filter((row) => !row.followupOk).length;
  const fallbackFailures = rows.filter((row) => !row.fallbackOk).length;
  const groundedFailures = rows.filter((row) => !row.groundedOk).length;
  const worst = [...rows].sort((a, b) => a.score - b.score || b.answerLength - a.answerLength).slice(0, 5);
  const verdict = contactViolations === 0 && followupViolations === 0 && fallbackFailures === 0 && groundedFailures === 0 ? "PASS" : "NEEDS WORK";

  const report = [
    "# Manual Transcript Analysis",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Input: \`${inputPath}\``,
    "",
    "## Summary",
    "",
    `- turns: ${total}`,
    `- grounded/source-backed or valid fallback: ${withSources}/${total}`,
    `- too long answers: ${tooLong}`,
    `- early contact pushes: ${contactViolations}`,
    `- follow-up violations: ${followupViolations}`,
    `- fallback failures: ${fallbackFailures}`,
    `- ungrounded answers: ${groundedFailures}`,
    `- verdict: ${verdict}`,
    "",
    "## Turn Checks",
    "",
    mdTable(
      ["#", "Confidence", "Intent", "Sources", "Length", "Fallback", "Issues", "User message"],
      rows.map((row) => [
        row.index,
        row.turn.confidence || "-",
        row.turn.intent || "-",
        row.turn.sources?.length || 0,
        row.answerLength,
        row.turn.fallbackUsed ? "yes" : "no",
        row.issues.join("; ") || "-",
        row.turn.userMessage || "-",
      ]),
    ),
    "",
    "## Worst Answers",
    "",
    ...worst.map((row) =>
      [
        `### Turn ${row.index}`,
        "",
        `- user: ${row.turn.userMessage || "-"}`,
        `- issues: ${row.issues.join("; ") || "-"}`,
        `- sources: ${sourceSummary(row.turn)}`,
        "",
        (row.turn.assistantAnswer || "").replace(/\s+/g, " ").slice(0, 900),
      ].join("\n"),
    ),
  ].join("\n");

  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, report, "utf8");
  console.log(`Manual transcript analysis saved ${reportPath}`);
  console.log(`Verdict: ${verdict}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
