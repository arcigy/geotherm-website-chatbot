import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { planRouterForTest } from "./chat-server";

type TestMessage = {
  role: string;
  content: string;
};

type RouterTestCase = {
  id: string;
  category: string;
  history: TestMessage[];
  message: string;
  expected: {
    needsRetrieval?: boolean;
    answerMode?: string;
    contextCarried?: boolean;
    contextTopicIncludes?: string;
    intentHint?: string;
    retrievalQueryIncludes?: string[];
    retrievalQueryNotIncludes?: string[];
  };
};

type RouterResult = ReturnType<typeof planRouterForTest>;

const testCasesPath = path.join(process.cwd(), "knowledge", "router-test-cases.json");
const reportPath = path.join(process.cwd(), "knowledge", "router-test-report.md");

function normalize(value: string | null | undefined): string {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesNormalized(haystack: string, needle: string): boolean {
  return normalize(haystack).includes(normalize(needle));
}

function checkCase(testCase: RouterTestCase, result: RouterResult): string[] {
  const failures: string[] = [];
  const expected = testCase.expected;

  if (expected.needsRetrieval !== undefined && result.needsRetrieval !== expected.needsRetrieval) {
    failures.push(`needsRetrieval expected ${expected.needsRetrieval}, got ${result.needsRetrieval}`);
  }
  if (expected.answerMode && result.answerMode !== expected.answerMode) {
    failures.push(`answerMode expected ${expected.answerMode}, got ${result.answerMode}`);
  }
  if (expected.contextCarried !== undefined && result.contextCarried !== expected.contextCarried) {
    failures.push(`contextCarried expected ${expected.contextCarried}, got ${result.contextCarried}`);
  }
  if (expected.intentHint && result.intentHint !== expected.intentHint) {
    failures.push(`intentHint expected ${expected.intentHint}, got ${result.intentHint || "null"}`);
  }
  if (expected.contextTopicIncludes && !includesNormalized(result.contextTopic || "", expected.contextTopicIncludes)) {
    failures.push(`contextTopic should include "${expected.contextTopicIncludes}", got "${result.contextTopic || ""}"`);
  }
  for (const term of expected.retrievalQueryIncludes || []) {
    if (!includesNormalized(result.retrievalQuery, term)) {
      failures.push(`retrievalQuery should include "${term}", got "${result.retrievalQuery}"`);
    }
  }
  for (const term of expected.retrievalQueryNotIncludes || []) {
    if (includesNormalized(result.retrievalQuery, term)) {
      failures.push(`retrievalQuery should not include "${term}", got "${result.retrievalQuery}"`);
    }
  }

  return failures;
}

function mdTable(headers: string[], rows: string[][]): string {
  const cell = (value: string): string => value.replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(cell).join(" | ")} |`),
  ].join("\n");
}

async function main(): Promise<void> {
  const testCases = JSON.parse(await readFile(testCasesPath, "utf8")) as RouterTestCase[];
  const results = testCases.map((testCase) => {
    const route = planRouterForTest(testCase.message, testCase.history);
    const failures = checkCase(testCase, route);
    return { testCase, route, failures, passed: failures.length === 0 };
  });

  const passed = results.filter((result) => result.passed).length;
  const failed = results.length - passed;
  const byCategory = new Map<string, { total: number; failed: number }>();
  for (const result of results) {
    const item = byCategory.get(result.testCase.category) || { total: 0, failed: 0 };
    item.total += 1;
    if (!result.passed) item.failed += 1;
    byCategory.set(result.testCase.category, item);
  }

  const failedRows = results
    .filter((result) => !result.passed)
    .map((result) => [
      result.testCase.id,
      result.testCase.category,
      result.testCase.message,
      result.route.retrievalQuery || "-",
      result.route.contextTopic || "-",
      result.failures.join("; "),
    ]);

  const categoryRows = [...byCategory.entries()].map(([category, value]) => [
    category,
    String(value.total),
    String(value.total - value.failed),
    String(value.failed),
  ]);

  const report = [
    "# Router Test Report",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Summary",
    "",
    `- total tests: ${results.length}`,
    `- passed: ${passed}`,
    `- failed: ${failed}`,
    `- pass rate: ${Math.round((passed / results.length) * 100)}%`,
    `- verdict: ${failed === 0 ? "PASS" : "NEEDS WORK"}`,
    "",
    "## Category Breakdown",
    "",
    mdTable(["Category", "Total", "Passed", "Failed"], categoryRows),
    "",
    "## Failed Cases",
    "",
    failedRows.length ? mdTable(["ID", "Category", "Message", "Query", "Context", "Reason"], failedRows) : "No failed cases.",
    "",
    "## Sample Routes",
    "",
    mdTable(
      ["ID", "Category", "Needs RAG", "Mode", "Context", "Query"],
      results.slice(0, 20).map((result) => [
        result.testCase.id,
        result.testCase.category,
        String(result.route.needsRetrieval),
        result.route.answerMode,
        result.route.contextTopic || "-",
        result.route.retrievalQuery || "-",
      ]),
    ),
    "",
  ].join("\n");

  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, report, "utf8");

  console.log(`Router tests: ${passed}/${results.length} passed`);
  console.log(`Saved ${reportPath}`);
  if (failed > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
