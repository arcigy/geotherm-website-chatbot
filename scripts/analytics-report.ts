import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getDb, initDb } from "./local-db";

const reportPath = path.join(process.cwd(), "knowledge", "sales-mvp-report.md");

function scalar<T>(sql: string): T {
  return getDb().prepare(sql).get() as T;
}

function table(headers: string[], rows: Array<Array<string | number>>): string {
  const cell = (value: string | number): string => String(value).replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(cell).join(" | ")} |`),
  ].join("\n");
}

async function main(): Promise<void> {
  initDb();
  const totalConversations = (scalar<{ count: number }>("SELECT COUNT(*) AS count FROM conversations")).count;
  const totalMessages = (scalar<{ count: number }>("SELECT COUNT(*) AS count FROM messages")).count;
  const totalLeads = (scalar<{ count: number }>("SELECT COUNT(*) AS count FROM leads")).count;
  const totalRetrieval = (scalar<{ count: number }>("SELECT COUNT(*) AS count FROM retrieval_events")).count;
  const fallbackCount = (scalar<{ count: number }>("SELECT COUNT(*) AS count FROM events WHERE event_type = 'fallback_triggered'")).count;
  const avgConfidence = getDb()
    .prepare(
      `SELECT AVG(CASE confidence WHEN 'high' THEN 3 WHEN 'medium' THEN 2 WHEN 'low' THEN 1 ELSE 0 END) AS avg_confidence
       FROM messages WHERE role = 'assistant'`,
    )
    .get() as { avg_confidence: number | null };
  const topIntents = getDb()
    .prepare("SELECT COALESCE(intent, 'unknown') AS intent, COUNT(*) AS count FROM conversations GROUP BY intent ORDER BY count DESC")
    .all() as Array<{ intent: string; count: number }>;
  const lowQueries = getDb()
    .prepare(
      "SELECT query, top_score, confidence, created_at FROM retrieval_events WHERE confidence = 'low' ORDER BY created_at DESC LIMIT 10",
    )
    .all() as Array<{ query: string; top_score: number; confidence: string; created_at: string }>;
  const conversionRate = totalConversations ? Math.round((totalLeads / totalConversations) * 100) : 0;
  const fallbackRate = totalRetrieval ? Math.round((fallbackCount / totalRetrieval) * 100) : 0;

  const report = [
    "# Sales MVP Analytics Report",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Summary",
    "",
    table(["Metric", "Value"], [
      ["total conversations", totalConversations],
      ["total messages", totalMessages],
      ["total leads", totalLeads],
      ["lead conversion rate", `${conversionRate}%`],
      ["fallback rate", `${fallbackRate}%`],
      ["average confidence score", avgConfidence.avg_confidence?.toFixed(2) ?? "n/a"],
    ]),
    "",
    "## Top Intents",
    "",
    topIntents.length ? table(["Intent", "Count"], topIntents.map((row) => [row.intent, row.count])) : "No intents yet.",
    "",
    "## Top Low-Confidence Queries",
    "",
    lowQueries.length
      ? table(["Query", "Top score", "Confidence", "Created at"], lowQueries.map((row) => [row.query, row.top_score, row.confidence, row.created_at]))
      : "No low-confidence queries yet.",
    "",
  ].join("\n");

  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, report, "utf8");
  console.log(`Saved ${reportPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
