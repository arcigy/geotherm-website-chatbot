import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { type KnowledgeChunk, normalize, retrieveKnowledge, tokenize, type RetrievalResult } from "./local-retrieval";

type TestCase = {
  id: string;
  query: string;
  category: string;
  expectedTerms: string[];
  expectedUrlIncludes: string[];
  mustNotAnswerIfLowConfidence: boolean;
};

type FailedCase = {
  id: string;
  query: string;
  category: string;
  expectedTerms: string[];
  expectedUrlIncludes: string[];
  reason: string;
  results: RetrievalResult[];
};

const knowledgePath = path.join(process.cwd(), "knowledge", "chatbot-knowledge.json");
const testsPath = path.join(process.cwd(), "knowledge", "retrieval-test-cases.json");
const reportPath = path.join(process.cwd(), "knowledge", "retrieval-evaluation-report.md");

function includesAnyTerm(result: RetrievalResult, terms: string[]): boolean {
  if (!terms.length) return true;
  const haystack = normalize(
    `${result.chunk.pageTitle} ${result.chunk.sectionHeading} ${result.chunk.url} ${result.chunk.slug} ${result.chunk.text}`,
  );
  const haystackTokens = new Set(tokenize(haystack));
  return terms.some((term) => {
    const normalizedTerm = normalize(term);
    const termTokens = tokenize(term);
    return haystack.includes(normalizedTerm) || termTokens.every((token) => haystackTokens.has(token));
  });
}

function includesUrl(result: RetrievalResult, includes: string[]): boolean {
  if (!includes.length) return true;
  const normalizedUrl = normalize(result.chunk.url);
  const urlTokens = new Set(tokenize(result.chunk.url));
  return includes.some((part) => {
    const normalizedPart = normalize(part);
    const partTokens = tokenize(part);
    return normalizedUrl.includes(normalizedPart) || partTokens.every((token) => urlTokens.has(token));
  });
}

function resultPasses(result: RetrievalResult | undefined, test: TestCase): boolean {
  if (!result) return false;
  return includesAnyTerm(result, test.expectedTerms) && includesUrl(result, test.expectedUrlIncludes);
}

function pct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function mdTable(headers: string[], rows: Array<Array<string | number>>): string {
  const cell = (value: string | number): string => String(value).replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(cell).join(" | ")} |`),
  ].join("\n");
}

function summarizeResults(results: RetrievalResult[]): string {
  return results
    .slice(0, 5)
    .map(
      (result, index) =>
        `${index + 1}. ${result.score.finalScore} ${result.confidence} | ${result.chunk.pageTitle} | ${result.chunk.sectionHeading} | ${result.chunk.url}`,
    )
    .join("<br>");
}

async function main(): Promise<void> {
  const chunks = JSON.parse(await readFile(knowledgePath, "utf8")) as KnowledgeChunk[];
  const tests = JSON.parse(await readFile(testsPath, "utf8")) as TestCase[];
  const failures: FailedCase[] = [];
  const categoryStats = new Map<string, { total: number; top1: number; top3: number; fallbackTotal: number; fallbackPass: number }>();
  let top1Pass = 0;
  let top3Pass = 0;
  let fallbackTotal = 0;
  let fallbackPass = 0;
  let topScoreSum = 0;

  for (const test of tests) {
    const response = retrieveKnowledge(chunks, test.query, 5);
    const topScore = response.results[0]?.score.finalScore || 0;
    const topConfidence = response.results[0]?.confidence || "no_answer";
    const top1Ok = resultPasses(response.results[0], test);
    const top3Ok = response.results.slice(0, 3).some((result) => resultPasses(result, test));
    const fallbackOk = test.mustNotAnswerIfLowConfidence ? topConfidence !== "confident" : true;
    const stat = categoryStats.get(test.category) || { total: 0, top1: 0, top3: 0, fallbackTotal: 0, fallbackPass: 0 };

    stat.total += 1;
    if (top1Ok) stat.top1 += 1;
    if (top3Ok) stat.top3 += 1;
    if (test.mustNotAnswerIfLowConfidence) {
      stat.fallbackTotal += 1;
      fallbackTotal += 1;
      if (fallbackOk) {
        stat.fallbackPass += 1;
        fallbackPass += 1;
      }
    }
    categoryStats.set(test.category, stat);

    if (top1Ok) top1Pass += 1;
    if (top3Ok) top3Pass += 1;
    topScoreSum += topScore;

    if ((!test.mustNotAnswerIfLowConfidence && !top3Ok) || (test.mustNotAnswerIfLowConfidence && !fallbackOk)) {
      failures.push({
        id: test.id,
        query: test.query,
        category: test.category,
        expectedTerms: test.expectedTerms,
        expectedUrlIncludes: test.expectedUrlIncludes,
        reason: test.mustNotAnswerIfLowConfidence
          ? `Fallback query returned confident result with score ${topScore}.`
          : `Expected terms/URL not found in top 3 results.`,
        results: response.results,
      });
    }
  }

  const total = tests.length;
  const top1Rate = total ? top1Pass / total : 0;
  const top3Rate = total ? top3Pass / total : 0;
  const fallbackRate = fallbackTotal ? fallbackPass / fallbackTotal : 1;
  const averageTopScore = total ? topScoreSum / total : 0;
  const verdict = top3Rate >= 0.8 && fallbackRate >= 0.8 ? "PASS" : "NEEDS WORK";
  const weakCategories = [...categoryStats.entries()]
    .map(([category, stat]) => ({
      category,
      top3Rate: stat.top3 / stat.total,
      fallbackRate: stat.fallbackTotal ? stat.fallbackPass / stat.fallbackTotal : 1,
      stat,
    }))
    .filter((row) => row.top3Rate < 0.8 || row.fallbackRate < 0.8)
    .sort((a, b) => a.top3Rate - b.top3Rate);

  const report = [
    "# Retrieval Evaluation Report",
    "",
    "## Summary",
    "",
    `- total test cases: ${total}`,
    `- top1 pass rate: ${pct(top1Rate)}`,
    `- top3 pass rate: ${pct(top3Rate)}`,
    `- fallback pass rate: ${pct(fallbackRate)}`,
    `- average top score: ${averageTopScore.toFixed(2)}`,
    `- verdict: ${verdict}`,
    "",
    "Confidence thresholds: `finalScore >= 35` is confident, `14-34.99` is uncertain, `< 14` is no answer.",
    "",
    "## Category Breakdown",
    "",
    mdTable(
      ["Category", "Cases", "Top1", "Top3", "Fallback"],
      [...categoryStats.entries()].map(([category, stat]) => [
        category,
        stat.total,
        pct(stat.top1 / stat.total),
        pct(stat.top3 / stat.total),
        stat.fallbackTotal ? pct(stat.fallbackPass / stat.fallbackTotal) : "n/a",
      ]),
    ),
    "",
    "## Failed Cases",
    "",
    failures.length
      ? failures
          .map(
            (failure) => [
              `### ${failure.id} ${failure.query}`,
              "",
              `- category: ${failure.category}`,
              `- expectedTerms: ${failure.expectedTerms.join(", ")}`,
              `- expectedUrlIncludes: ${failure.expectedUrlIncludes.join(", ") || "n/a"}`,
              `- reason: ${failure.reason}`,
              "",
              summarizeResults(failure.results),
            ].join("\n"),
          )
          .join("\n\n")
      : "None.",
    "",
    "## Weak Areas",
    "",
    weakCategories.length
      ? weakCategories
          .map((row) => `- ${row.category}: top3 ${pct(row.top3Rate)}, fallback ${row.stat.fallbackTotal ? pct(row.fallbackRate) : "n/a"}.`)
          .join("\n")
      : "No weak categories under the configured thresholds.",
    "",
    "Likely failure causes: missing source content for some brand-specific questions, sparse contact/email chunks, and lexical limits without embeddings.",
    "",
    "## Recommendations",
    "",
    "- Add explicit brand pages or metadata for brands that are offered but absent from the content.",
    "- Add a small curated contact chunk if the public export has weak phone/email coverage.",
    "- Keep this lexical engine as a deterministic baseline before adding embeddings.",
    "- Re-run evaluation after every knowledge rebuild.",
    "",
  ].join("\n");

  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, report, "utf8");
  console.log(`Evaluation ${verdict}: top1=${pct(top1Rate)} top3=${pct(top3Rate)} fallback=${pct(fallbackRate)} avgTop=${averageTopScore.toFixed(2)}`);
  console.log(`Failed cases: ${failures.length}`);
  console.log(`Saved ${reportPath}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Retrieval evaluation failed: ${message}`);
  process.exitCode = 1;
});
