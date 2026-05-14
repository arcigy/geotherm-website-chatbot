import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { startChatServer } from "./chat-server";

type ApiResponse = {
  answer: string;
  confidence: "high" | "medium" | "low";
  topScore: number;
  sources: Array<{
    pageTitle: string;
    url: string;
    sectionHeading: string;
    snippet: string;
  }>;
  action: null;
};

const reportPath = path.join(process.cwd(), "knowledge", "chat-api-test-report.md");
const testCases = [
  "kolko stoji tepelne cerpadlo",
  "ake mate tepelne cerpadla chcem si vybrat presny model",
  "ake hlucne je NIBE",
  "dotacie na tepelne cerpadla",
  "robite servis",
  "ako vas kontaktovat",
  "ake je pocasie",
];

function passFor(query: string, response: ApiResponse): boolean {
  if (query.includes("pocasie")) {
    const normalizedAnswer = response.answer
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    return (
      response.confidence === "low" &&
      (normalizedAnswer.includes("nenasiel dostatocne jasnu odpoved") ||
        normalizedAnswer.includes("nemam dostatocne jasny podklad") ||
        normalizedAnswer.includes("nemam dost jasny podklad"))
    );
  }
  if (query.includes("presny model")) {
    const normalizedAnswer = response.answer
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    return response.confidence !== "low" && response.sources.length > 0 && response.topScore > 0 && !normalizedAnswer.includes("dotac");
  }

  return response.confidence !== "low" && response.sources.length > 0 && response.topScore > 0;
}

async function main(): Promise<void> {
  const server = await startChatServer({ port: 0 });
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  const endpoint = `http://127.0.0.1:${port}/chat`;
  const rows: Array<{ query: string; response: ApiResponse; passed: boolean }> = [];

  try {
    for (const query of testCases) {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:5173",
        },
        body: JSON.stringify({
          message: query,
          currentUrl: "http://localhost/test",
          siteId: "geotherm",
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status} for query: ${query}`);
      const body = (await response.json()) as ApiResponse;
      rows.push({ query, response: body, passed: passFor(query, body) });
    }
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }

  const passed = rows.filter((row) => row.passed).length;
  const report = [
    "# Chat API Test Report",
    "",
    `Endpoint: \`POST /chat\``,
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Summary",
    "",
    `- total cases: ${rows.length}`,
    `- passed: ${passed}`,
    `- failed: ${rows.length - passed}`,
    `- verdict: ${passed === rows.length ? "PASS" : "NEEDS WORK"}`,
    "",
    "## Cases",
    "",
    "| Query | Pass | Confidence | Top score | Sources | Top source |",
    "| --- | --- | --- | --- | --- | --- |",
    ...rows.map((row) => {
      const topSource = row.response.sources[0];
      return `| ${row.query} | ${row.passed ? "yes" : "no"} | ${row.response.confidence} | ${row.response.topScore} | ${row.response.sources.length} | ${topSource ? `${topSource.pageTitle} - ${topSource.sectionHeading}` : "n/a"} |`;
    }),
    "",
    "## Fallback Check",
    "",
    rows.find((row) => row.query.includes("pocasie"))?.response.answer || "Fallback case missing.",
    "",
  ].join("\n");

  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, report, "utf8");
  console.log(`Chat API tests: ${passed}/${rows.length} passed`);
  console.log(`Saved ${reportPath}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Chat API test failed: ${message}`);
  process.exitCode = 1;
});
