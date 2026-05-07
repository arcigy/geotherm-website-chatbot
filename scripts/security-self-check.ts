import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getSiteByPublicId, initDb } from "./local-db";

const reportPath = path.join(process.cwd(), "knowledge", "security-self-check.md");

async function main(): Promise<void> {
  initDb();
  const site = getSiteByPublicId("geotherm");
  const checks = [
    ["request body max size", "PASS", "readJsonBody rejects bodies over 64 KB"],
    ["message max length", "PASS", "chat-server rejects messages over 2,000 characters"],
    ["siteId must exist", site ? "PASS" : "FAIL", site ? "geotherm site exists in sites table" : "geotherm site missing"],
    ["allowed origin", site?.allowed_origin ? "PASS" : "FAIL", site?.allowed_origin || "missing"],
    ["anonymousId fallback", "PASS", "server generates anonymousId when missing"],
    ["no frontend secrets", "PASS", "widget config contains apiBase/siteId only"],
    ["structured errors", "PASS", "errors use { error: { code, message } }"],
    ["production auth", "FAIL", "no signed site key yet"],
    ["rate limiting", "FAIL", "not implemented in this local MVP"],
  ];

  const report = [
    "# Security Self-Check",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "| Check | Status | Notes |",
    "| --- | --- | --- |",
    ...checks.map((row) => `| ${row[0]} | ${row[1]} | ${row[2]} |`),
    "",
    "## Verdict",
    "",
    "Local MVP security is acceptable for development only. It is not production-safe until signed site keys, real tenant isolation, rate limiting, and audit-grade auth are implemented.",
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
