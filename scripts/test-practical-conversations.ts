import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createChatResponse } from "./chat-server";

type PracticalCase = {
  id: string;
  title: string;
  messages: string[];
};

type CleanTurn = {
  user: string;
  assistant: string;
};

type CleanConversation = {
  id: string;
  title: string;
  turns: CleanTurn[];
};

type DiagnosticTurn = CleanTurn & {
  intent: string;
  confidence: string;
  answerMode: string | null;
  sources: number;
  responseTimeMs: number;
  issues: string[];
};

const inputPath = path.join(process.cwd(), "knowledge", "practical-chat-test-cases.json");
const cleanOutputPath = path.join(process.cwd(), "knowledge", "practical-chat-conversations-clean.json");
const reportPath = path.join(process.cwd(), "knowledge", "practical-chat-test-report.md");

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function userConversationMentions(conversation: string[], terms: string[]): boolean {
  const text = normalize(conversation.join(" "));
  return terms.some((term) => text.includes(normalize(term)));
}

function detectIssues(input: {
  scenarioMessages: string[];
  user: string;
  assistant: string;
  intent: string;
  sources: number;
  responseTimeMs: number;
}): string[] {
  const issues: string[] = [];
  const userText = normalize(input.user);
  const assistantText = normalize(input.assistant);
  const scenarioMentionsSubsidy = userConversationMentions(input.scenarioMessages, ["dotacia", "dotacie", "prispevok", "poukazka"]);
  const userMentionsSafety = userConversationMentions([input.user], ["chybu", "porucha", "zapojim", "elektrika", "chladivo", "tlak", "rosi", "servis"]);

  const subsidyAnswerLooksPrimary =
    input.intent === "subsidy" ||
    assistantText.includes("dotacie a prispevky sa riesia") ||
    assistantText.includes("dotaciu k novemu") ||
    assistantText.includes("zelena domacnostiam") ||
    assistantText.includes("/dotacie");
  if (!scenarioMentionsSubsidy && subsidyAnswerLooksPrimary) {
    issues.push("possible subsidy drift");
  }
  if (input.intent !== "irrelevant" && input.intent !== "unknown" && input.sources === 0 && !userMentionsSafety) {
    issues.push("missing sources for domain answer");
  }
  const unsupportedExactness =
    assistantText.includes("garantujem") ||
    assistantText.includes("urcite") ||
    (assistantText.includes("presne") &&
      !assistantText.includes("zavisi") &&
      !assistantText.includes("presne nastavenie") &&
      !assistantText.includes("presne stanovena") &&
      !assistantText.includes("presnej cenovej ponuky") &&
      !assistantText.includes("presna cenova ponuka") &&
      !assistantText.includes("presnej ponuky") &&
      !userText.includes("presne"));
  if (unsupportedExactness) {
    issues.push("overconfident wording");
  }
  if (assistantText.includes("email") && assistantText.includes("telefon") && !userText.includes("kontakt") && !userText.includes("ponuku")) {
    issues.push("possible early contact push");
  }
  if (input.responseTimeMs > 9000) {
    issues.push("slow response >9s");
  }
  return issues;
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
  const cases = JSON.parse(await readFile(inputPath, "utf8")) as PracticalCase[];
  const cleanConversations: CleanConversation[] = [];
  const diagnosticConversations: Array<{ id: string; title: string; turns: DiagnosticTurn[] }> = [];

  for (const testCase of cases) {
    const anonymousId = `practical_${testCase.id}_${Date.now()}`;
    const cleanTurns: CleanTurn[] = [];
    const diagnosticTurns: DiagnosticTurn[] = [];

    for (const message of testCase.messages) {
      const started = Date.now();
      const response = await createChatResponse({
        message,
        siteId: "geotherm",
        anonymousId,
        currentUrl: "http://127.0.0.1:4321/embed-preview.html",
        metadata: {
          userAgent: "practical-conversation-test",
          referrer: "local-practical-test",
        },
      });
      const responseTimeMs = Date.now() - started;
      cleanTurns.push({ user: message, assistant: response.answer });
      diagnosticTurns.push({
        user: message,
        assistant: response.answer,
        intent: response.intent,
        confidence: response.confidence,
        answerMode: response.debug?.answerMode || null,
        sources: response.sources.length,
        responseTimeMs,
        issues: detectIssues({
          scenarioMessages: testCase.messages,
          user: message,
          assistant: response.answer,
          intent: response.intent,
          sources: response.sources.length,
          responseTimeMs,
        }),
      });
    }

    cleanConversations.push({ id: testCase.id, title: testCase.title, turns: cleanTurns });
    diagnosticConversations.push({ id: testCase.id, title: testCase.title, turns: diagnosticTurns });
    console.log(`${testCase.id} ${testCase.title}: ${cleanTurns.length} turns`);
  }

  const issueRows = diagnosticConversations.flatMap((conversation) =>
    conversation.turns
      .filter((turn) => turn.issues.length)
      .map((turn) => [
        conversation.id,
        conversation.title,
        turn.user,
        turn.intent,
        turn.confidence,
        String(turn.responseTimeMs),
        turn.issues.join("; "),
      ]),
  );
  const totalTurns = diagnosticConversations.reduce((sum, conversation) => sum + conversation.turns.length, 0);
  const issueCount = issueRows.length;
  const slowCount = diagnosticConversations.flatMap((conversation) => conversation.turns).filter((turn) => turn.responseTimeMs > 9000).length;
  const subsidyDriftCount = diagnosticConversations
    .flatMap((conversation) => conversation.turns)
    .filter((turn) => turn.issues.includes("possible subsidy drift")).length;

  const cleanExport = {
    generatedAt: new Date().toISOString(),
    totalConversations: cleanConversations.length,
    totalTurns,
    conversations: cleanConversations,
  };

  const report = [
    "# Practical Chat Test Report",
    "",
    `Generated: ${cleanExport.generatedAt}`,
    "",
    "## Summary",
    "",
    `- conversations: ${cleanConversations.length}`,
    `- turns: ${totalTurns}`,
    `- turns with flagged issues: ${issueCount}`,
    `- possible subsidy drift: ${subsidyDriftCount}`,
    `- slow responses >9s: ${slowCount}`,
    "",
    "## Flagged Turns",
    "",
    issueRows.length ? mdTable(["ID", "Title", "User", "Intent", "Confidence", "ms", "Issues"], issueRows) : "No flagged turns.",
    "",
    "## Output",
    "",
    `Clean JSON: \`${cleanOutputPath}\``,
    "",
  ].join("\n");

  await mkdir(path.dirname(cleanOutputPath), { recursive: true });
  await writeFile(cleanOutputPath, `${JSON.stringify(cleanExport, null, 2)}\n`, "utf8");
  await writeFile(reportPath, report, "utf8");
  console.log(`Saved ${cleanOutputPath}`);
  console.log(`Saved ${reportPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
