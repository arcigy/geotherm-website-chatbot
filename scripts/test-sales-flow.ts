import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { startChatServer, type ChatResponse } from "./chat-server";

const reportPath = path.join(process.cwd(), "knowledge", "sales-flow-test-report.md");

type Step = {
  message: string;
  response?: ChatResponse;
};

type Scenario = {
  id: string;
  name: string;
  anonymousId: string;
  steps: Step[];
  passed: boolean;
  notes: string[];
};

async function send(endpoint: string, anonymousId: string, message: string): Promise<ChatResponse> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "http://127.0.0.1:4321",
    },
    body: JSON.stringify({
      message,
      siteId: "geotherm",
      anonymousId,
      currentUrl: "http://127.0.0.1:4321/embed-preview.html",
      metadata: {
        userAgent: "sales-flow-test",
        referrer: "local-test",
      },
    }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  return (await response.json()) as ChatResponse;
}

function requireCondition(notes: string[], condition: boolean, message: string): boolean {
  if (!condition) notes.push(message);
  return condition;
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
  const server = await startChatServer({ port: 0 });
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  const endpoint = `http://127.0.0.1:${port}/chat`;
  const stamp = Date.now();
  const scenarios: Scenario[] = [
    {
      id: "A",
      name: "Quote lead",
      anonymousId: `sales_quote_${stamp}`,
      steps: [
        { message: "Chcem cenovú ponuku na tepelné čerpadlo" },
        { message: "Dom má 160 m2 v Žiline" },
        { message: "Volám sa Peter, email peter@example.com, tel 0903123456" },
      ],
      passed: false,
      notes: [],
    },
    {
      id: "B",
      name: "Service lead",
      anonymousId: `sales_service_${stamp}`,
      steps: [{ message: "Potrebujem servis tepelného čerpadla" }, { message: "Som Jana, email jana@example.com, tel 0903555666" }],
      passed: false,
      notes: [],
    },
    {
      id: "C",
      name: "Subsidy inquiry",
      anonymousId: `sales_subsidy_${stamp}`,
      steps: [{ message: "Vybavujete dotácie?" }],
      passed: false,
      notes: [],
    },
    {
      id: "D",
      name: "Irrelevant",
      anonymousId: `sales_irrelevant_${stamp}`,
      steps: [{ message: "Aké bude zajtra počasie?" }],
      passed: false,
      notes: [],
    },
    {
      id: "E",
      name: "Contact",
      anonymousId: `sales_contact_${stamp}`,
      steps: [{ message: "Ako vás kontaktujem?" }],
      passed: false,
      notes: [],
    },
  ];

  try {
    for (const scenario of scenarios) {
      for (const step of scenario.steps) {
        step.response = await send(endpoint, scenario.anonymousId, step.message);
      }

      const last = scenario.steps[scenario.steps.length - 1].response;
      const first = scenario.steps[0].response;
      const notes = scenario.notes;

      if (scenario.id === "A") {
        const second = scenario.steps[1].response;
        scenario.passed = [
          requireCondition(notes, first?.intent === "quote", "first turn should detect quote intent"),
          requireCondition(notes, Boolean(first?.leadCapture.shouldAsk), "first turn should ask one qualification question"),
          requireCondition(notes, Boolean(second?.leadCapture.shouldAsk), "second turn should continue qualification"),
          requireCondition(notes, Boolean(last?.lead.captured), "lead should be captured after contact"),
          requireCondition(notes, (last?.lead.score ?? 0) >= 50, "lead score should be >= 50"),
        ].every(Boolean);
      } else if (scenario.id === "B") {
        scenario.passed = [
          requireCondition(notes, first?.intent === "service", "service intent expected"),
          requireCondition(notes, Boolean(first?.leadCapture.shouldAsk), "service flow should ask qualification/contact question"),
          requireCondition(notes, Boolean(last?.lead.captured), "service lead should be captured"),
        ].every(Boolean);
      } else if (scenario.id === "C") {
        scenario.passed = [
          requireCondition(notes, first?.intent === "subsidy", "subsidy intent expected"),
          requireCondition(notes, (first?.sources.length ?? 0) > 0, "subsidy answer should include sources"),
          requireCondition(notes, Boolean(first?.leadCapture.shouldAsk), "subsidy should ask CTA/qualification"),
        ].every(Boolean);
      } else if (scenario.id === "D") {
        scenario.passed = [
          requireCondition(notes, first?.intent === "irrelevant" || first?.intent === "unknown", "irrelevant/unknown expected"),
          requireCondition(notes, first?.confidence === "low", "irrelevant should be low confidence"),
          requireCondition(notes, !first?.leadCapture.shouldAsk, "irrelevant should not push lead capture"),
        ].every(Boolean);
      } else if (scenario.id === "E") {
        scenario.passed = [
          requireCondition(notes, first?.intent === "contact", "contact intent expected"),
          requireCondition(notes, (first?.sources.length ?? 0) > 0, "contact should return source-backed answer"),
          requireCondition(notes, !first?.lead.captured, "contact info question alone should not create lead"),
        ].every(Boolean);
      }
    }
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }

  const passed = scenarios.filter((scenario) => scenario.passed).length;
  const report = [
    "# Sales Flow Test Report",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Summary",
    "",
    `- total scenarios: ${scenarios.length}`,
    `- passed: ${passed}`,
    `- failed: ${scenarios.length - passed}`,
    `- verdict: ${passed === scenarios.length ? "PASS" : "NEEDS WORK"}`,
    "",
    "## Scenarios",
    "",
    mdTable(
      ["ID", "Scenario", "Pass", "Final intent", "Lead captured", "Lead score", "Notes"],
      scenarios.map((scenario) => {
        const last = scenario.steps[scenario.steps.length - 1].response;
        return [
          scenario.id,
          scenario.name,
          scenario.passed ? "yes" : "no",
          last?.intent ?? "-",
          last?.lead.captured ? "yes" : "no",
          last?.lead.score ?? 0,
          scenario.notes.join("; ") || "-",
        ];
      }),
    ),
    "",
    "## Conversation Samples",
    "",
    ...scenarios.map((scenario) => {
      const lines = [`### ${scenario.id} ${scenario.name}`, ""];
      for (const step of scenario.steps) {
        lines.push(`User: ${step.message}`);
        lines.push(`Assistant intent=${step.response?.intent} confidence=${step.response?.confidence} lead=${step.response?.lead.captured ? "yes" : "no"}`);
        lines.push((step.response?.answer || "").replace(/\s+/g, " ").slice(0, 420));
        lines.push("");
      }
      return lines.join("\n");
    }),
  ].join("\n");

  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, report, "utf8");
  console.log(`Sales flow tests: ${passed}/${scenarios.length} passed`);
  console.log(`Saved ${reportPath}`);
  if (passed !== scenarios.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
