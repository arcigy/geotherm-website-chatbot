import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createChatResponse, type ChatResponse } from "./chat-server";
import { normalize } from "./local-retrieval";

type Confidence = "low" | "medium" | "high";

type CeilingCoolingCase = {
  id: string;
  category: string;
  query: string;
  expectedAnswerTerms: string[];
  expectedSourceTerms: string[];
  forbiddenAnswerTerms: string[];
  minConfidence: Confidence;
};

type CaseResult = {
  test: CeilingCoolingCase;
  response: ChatResponse;
  passed: boolean;
  reasons: string[];
};

const casesPath = path.join(process.cwd(), "knowledge", "rag-ceiling-cooling-test-cases.json");
const reportPath = path.join(process.cwd(), "knowledge", "ceiling-cooling-rag-report.md");
const confidenceRank: Record<Confidence, number> = { low: 1, medium: 2, high: 3 };

function norm(value: string): string {
  return normalize(value);
}

function includesTerm(haystack: string, needle: string): boolean {
  const normalizedHaystack = norm(haystack);
  const normalizedNeedle = norm(needle);
  if (normalizedHaystack.includes(normalizedNeedle)) return true;

  const haystackTokens = new Set(normalizedHaystack.split(" ").filter(Boolean));
  return normalizedNeedle
    .split(" ")
    .filter(Boolean)
    .every((token) => haystackTokens.has(token));
}

function sourceText(response: ChatResponse): string {
  return response.sources.map((source) => `${source.pageTitle} ${source.sectionHeading} ${source.url} ${source.snippet}`).join(" ");
}

function evaluateCase(test: CeilingCoolingCase, response: ChatResponse): CaseResult {
  const reasons: string[] = [];
  const answer = response.answer;
  const sources = sourceText(response);

  const answerMisses = test.expectedAnswerTerms.filter((term) => !includesTerm(answer, term));
  const sourceMisses = test.expectedSourceTerms.filter((term) => !includesTerm(sources, term));
  const forbiddenHits = test.forbiddenAnswerTerms.filter((term) => includesTerm(answer, term));
  const genericStyleHits = ["Krátka odpoveď", "Podľa webu", "Podľa dostupných"].filter((term) => includesTerm(answer, term));
  const confidence = response.confidence || "low";

  if (confidenceRank[confidence] < confidenceRank[test.minConfidence]) reasons.push(`confidence too low: ${confidence}`);
  if (!response.sources.length) reasons.push("missing sources");
  if (answerMisses.length) reasons.push(`answer missing: ${answerMisses.join(", ")}`);
  if (sourceMisses.length) reasons.push(`source missing: ${sourceMisses.join(", ")}`);
  if (forbiddenHits.length) reasons.push(`forbidden answer terms: ${forbiddenHits.join(", ")}`);
  if (genericStyleHits.length) reasons.push(`generic RAG wording: ${genericStyleHits.join(", ")}`);
  if ((answer.match(/\?/g) || []).length > 1) reasons.push("more than one follow-up question");

  return {
    test,
    response,
    passed: reasons.length === 0,
    reasons,
  };
}

function pct(value: number, total: number): string {
  return total ? `${Math.round((value / total) * 100)}%` : "0%";
}

function table(headers: string[], rows: Array<Array<string | number>>): string {
  const clean = (value: string | number): string => String(value).replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
  return [`| ${headers.join(" | ")} |`, `| ${headers.map(() => "---").join(" | ")} |`, ...rows.map((row) => `| ${row.map(clean).join(" | ")} |`)].join("\n");
}

async function main(): Promise<void> {
  const tests = JSON.parse(await readFile(casesPath, "utf8")) as CeilingCoolingCase[];
  const stamp = Date.now();
  const results: CaseResult[] = [];

  for (const test of tests) {
    const response = await createChatResponse({
      message: test.query,
      siteId: "geotherm",
      anonymousId: `ceiling_cooling_${stamp}_${test.id}`,
      currentUrl: "local-ceiling-cooling-evaluation",
      metadata: {
        userAgent: "ceiling-cooling-rag-evaluator",
        referrer: "local",
      },
    });
    results.push(evaluateCase(test, response));
  }

  const passed = results.filter((result) => result.passed).length;
  const failed = results.filter((result) => !result.passed);
  const categories = [...new Set(results.map((result) => result.test.category))];

  const report = [
    "# Ceiling Cooling RAG Report",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Summary",
    "",
    `- total tests: ${results.length}`,
    `- passed: ${passed}`,
    `- failed: ${failed.length}`,
    `- pass rate: ${pct(passed, results.length)}`,
    `- verdict: ${failed.length === 0 ? "PASS" : "NEEDS WORK"}`,
    "",
    "## Category Breakdown",
    "",
    table(
      ["Category", "Total", "Passed", "Failed"],
      categories.map((category) => {
        const subset = results.filter((result) => result.test.category === category);
        return [category, subset.length, subset.filter((result) => result.passed).length, subset.filter((result) => !result.passed).length];
      }),
    ),
    "",
    "## Failed Cases",
    "",
    failed.length
      ? failed
          .map((result) =>
            [
              `### ${result.test.id} ${result.test.query}`,
              "",
              `- category: ${result.test.category}`,
              `- confidence: ${result.response.confidence}`,
              `- reasons: ${result.reasons.join("; ")}`,
              `- sources: ${result.response.sources.map((source) => `${source.pageTitle} / ${source.sectionHeading}`).join("; ") || "-"}`,
              "",
              "Answer:",
              "",
              result.response.answer.replace(/\s+/g, " ").slice(0, 900),
            ].join("\n"),
          )
          .join("\n\n")
      : "None.",
    "",
    "## Sample Passing Answers",
    "",
    ...results.slice(0, 5).map((result) => `### ${result.test.id}\n\n${result.response.answer}`),
  ].join("\n");

  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${report}\n`, "utf8");

  console.log(`Ceiling cooling RAG: ${passed}/${results.length} passed (${pct(passed, results.length)})`);
  console.log(`Saved ${reportPath}`);
  if (failed.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
