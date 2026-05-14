import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { startChatServer, type ChatResponse } from "./chat-server";

const salesReportPath = path.join(process.cwd(), "knowledge", "sales-flow-test-report.md");
const behaviorReportPath = path.join(process.cwd(), "knowledge", "conversation-behavior-report.md");
const contactOffer =
  "Ak chcete, môžeme to posunúť technikovi/odborníkovi, aby sa pozrel na váš konkrétny prípad. Chcete, aby vás niekto kontaktoval?";

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

function includesContactRequest(response: ChatResponse | undefined): boolean {
  const answer = response?.answer.toLowerCase() || "";
  const question = response?.leadCapture.nextQuestion?.toLowerCase() || "";
  return (
    answer.includes("stačí email") ||
    answer.includes("telefon") ||
    answer.includes("telefón") ||
    question.includes("stačí email") ||
    question.includes("telefon") ||
    question.includes("telefón")
  );
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesSoftHandoffOffer(response: ChatResponse | undefined): boolean {
  const text = normalizeText(`${response?.answer || ""} ${response?.leadCapture.nextQuestion || ""}`);
  return text.includes("posun") && (text.includes("technik") || text.includes("odborn")) && text.includes("kontakt");
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
  const longConversationId = `behavior_long_${stamp}`;
  const scenarios: Scenario[] = [
    {
      id: "A",
      name: "Noise advice without contact push",
      anonymousId: `behavior_noise_${stamp}`,
      steps: [{ message: "Aké hlučné je NIBE?" }],
      passed: false,
      notes: [],
    },
    {
      id: "B",
      name: "Price advice without first-turn contact request",
      anonymousId: `behavior_price_${stamp}`,
      steps: [{ message: "Koľko stojí tepelné čerpadlo?" }],
      passed: false,
      notes: [],
    },
    {
      id: "C",
      name: "Long advisory conversation reaches soft handoff",
      anonymousId: longConversationId,
      steps: [
        { message: "Koľko stojí tepelné čerpadlo?" },
        { message: "Dom má 160 m2" },
        { message: "Som zo Žiliny" },
        { message: "Chcel by som vedieť čo odporúčate" },
      ],
      passed: false,
      notes: [],
    },
    {
      id: "D",
      name: "Lead captured only after explicit contact",
      anonymousId: longConversationId,
      steps: [{ message: "Áno, nech ma kontaktujú. Môj email je peter@example.com" }],
      passed: false,
      notes: [],
    },
    {
      id: "E",
      name: "Irrelevant fallback without qualification",
      anonymousId: `behavior_irrelevant_${stamp}`,
      steps: [{ message: "Aké bude počasie?" }],
      passed: false,
      notes: [],
    },
  ];

  try {
    for (const scenario of scenarios) {
      for (const step of scenario.steps) {
        step.response = await send(endpoint, scenario.anonymousId, step.message);
      }

      const first = scenario.steps[0].response;
      const last = scenario.steps[scenario.steps.length - 1].response;
      const notes = scenario.notes;

      if (scenario.id === "A") {
        scenario.passed = [
          requireCondition(notes, first?.intent === "noise", "noise intent expected"),
          requireCondition(notes, (first?.sources.length ?? 0) > 0, "answer should use knowledge sources"),
          requireCondition(notes, Boolean(first?.leadCapture.shouldAsk), "should ask one natural follow-up"),
          requireCondition(notes, !includesContactRequest(first), "must not ask for contact on first message"),
          requireCondition(notes, !first?.lead.captured, "must not capture lead"),
        ].every(Boolean);
      } else if (scenario.id === "B") {
        scenario.passed = [
          requireCondition(notes, first?.intent === "quote", "quote intent expected"),
          requireCondition(notes, (first?.sources.length ?? 0) > 0, "answer should use knowledge sources"),
          requireCondition(notes, Boolean(first?.leadCapture.shouldAsk), "should ask one advisory follow-up"),
          requireCondition(notes, !includesContactRequest(first), "must not ask for contact after first price question"),
          requireCondition(notes, !first?.lead.captured, "must not capture lead"),
        ].every(Boolean);
      } else if (scenario.id === "C") {
        scenario.passed = [
          requireCondition(notes, scenario.steps.some((step) => includesSoftHandoffOffer(step.response)), "should make soft handoff offer"),
          requireCondition(notes, !includesContactRequest(last), "soft offer must not request email/phone yet"),
          requireCondition(notes, !last?.lead.captured, "must not capture lead before contact"),
        ].every(Boolean);
      } else if (scenario.id === "D") {
        scenario.passed = [
          requireCondition(notes, Boolean(last?.lead.captured), "lead should be captured after explicit contact"),
          requireCondition(notes, (last?.lead.score ?? 0) >= 50, "lead score should be >= 50"),
        ].every(Boolean);
      } else if (scenario.id === "E") {
        scenario.passed = [
          requireCondition(notes, first?.intent === "irrelevant" || first?.intent === "unknown", "irrelevant/unknown expected"),
          requireCondition(notes, first?.confidence === "low", "irrelevant should be low confidence"),
          requireCondition(notes, !first?.leadCapture.shouldAsk, "irrelevant should not ask qualification"),
          requireCondition(notes, !first?.lead.captured, "irrelevant should not capture lead"),
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
    "# Conversation Behavior Report",
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
    "## Behavior Checks",
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
        lines.push((step.response?.answer || "").replace(/\s+/g, " ").slice(0, 520));
        lines.push("");
      }
      return lines.join("\n");
    }),
  ].join("\n");

  await mkdir(path.dirname(behaviorReportPath), { recursive: true });
  await writeFile(behaviorReportPath, report, "utf8");
  await writeFile(salesReportPath, report.replace("# Conversation Behavior Report", "# Sales Flow Test Report"), "utf8");
  console.log(`Conversation behavior tests: ${passed}/${scenarios.length} passed`);
  console.log(`Saved ${behaviorReportPath}`);
  console.log(`Saved ${salesReportPath}`);
  if (passed !== scenarios.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
