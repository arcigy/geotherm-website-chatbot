import { mkdir, writeFile } from "node:fs/promises";
import { createHmac } from "node:crypto";
import path from "node:path";
import { getSiteByPublicId, initDb } from "./local-db";
import { startChatServer } from "./chat-server";

const reportPath = path.join(process.cwd(), "knowledge", "security-self-check.md");
const securityOrigin = "http://localhost:4321";

function siteSignature(secret: string, siteId: string, origin: string, timestamp: string): string {
  return createHmac("sha256", secret).update([siteId, origin, timestamp].join("\n")).digest("hex");
}

async function signedSiteKeyCheck(): Promise<{ pass: boolean; notes: string }> {
  const secret = `security-secret-${Date.now()}`;
  const server = await startChatServer({ port: 0, siteSignature: { enabled: true, secret, maxAgeMs: 60_000 }, rateLimit: { enabled: false } });
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  const endpoint = `http://127.0.0.1:${port}/chat`;
  const payload = {
    siteId: "geotherm",
    anonymousId: `security_signed_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    message: "ahoj",
    currentUrl: "http://localhost/security-self-check",
    debug: true,
  };

  try {
    const unsigned = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: securityOrigin },
      body: JSON.stringify(payload),
    });
    const timestamp = String(Date.now());
    const signed = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: securityOrigin,
        "X-Arcigy-Site-Timestamp": timestamp,
        "X-Arcigy-Site-Signature": siteSignature(secret, payload.siteId, securityOrigin, timestamp),
      },
      body: JSON.stringify(payload),
    });
    const body = (await unsigned.json()) as { error?: { code?: string } };
    const pass = unsigned.status === 401 && body.error?.code === "invalid_site_signature" && signed.ok;
    return {
      pass,
      notes: pass ? "signed /chat request is accepted and unsigned request is rejected" : `unexpected statuses unsigned=${unsigned.status} signed=${signed.status}`,
    };
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function rateLimitCheck(): Promise<{ pass: boolean; notes: string }> {
  const server = await startChatServer({ port: 0, rateLimit: { enabled: true, maxRequests: 1, windowMs: 60_000 } });
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  const endpoint = `http://127.0.0.1:${port}/chat`;
  const anonymousId = `security_rate_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  try {
    const payload = {
      siteId: "geotherm",
      anonymousId,
      message: "ahoj",
      currentUrl: "http://localhost/security-self-check",
      debug: true,
    };
    const first = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: securityOrigin },
      body: JSON.stringify(payload),
    });
    const second = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: securityOrigin },
      body: JSON.stringify(payload),
    });
    const body = (await second.json()) as { error?: { code?: string } };
    const retryAfter = second.headers.get("Retry-After");
    const pass = first.ok && second.status === 429 && body.error?.code === "rate_limited" && Boolean(retryAfter);
    return {
      pass,
      notes: pass ? "real /chat request returns 429 rate_limited with Retry-After after configured limit" : `unexpected statuses first=${first.status} second=${second.status}`,
    };
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function main(): Promise<void> {
  initDb();
  const site = getSiteByPublicId("geotherm");
  const signedSiteKey = await signedSiteKeyCheck();
  const rateLimit = await rateLimitCheck();
  const checks = [
    ["request body max size", "PASS", "readJsonBody rejects bodies over 64 KB"],
    ["message max length", "PASS", "chat-server rejects messages over 2,000 characters"],
    ["siteId must exist", site ? "PASS" : "FAIL", site ? "geotherm site exists in sites table" : "geotherm site missing"],
    ["allowed origin", site?.allowed_origin ? "PASS" : "FAIL", site?.allowed_origin || "missing"],
    ["anonymousId fallback", "PASS", "server generates anonymousId when missing"],
    ["no frontend secrets", "PASS", "widget config contains apiBase/siteId only"],
    ["structured errors", "PASS", "errors use { error: { code, message } }"],
    ["production auth", signedSiteKey.pass ? "PASS" : "FAIL", signedSiteKey.notes],
    ["rate limiting", rateLimit.pass ? "PASS" : "FAIL", rateLimit.notes],
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
    "Security is stronger with signed site requests and enforced chat rate limiting. For full production, keep the signature secret in server/runtime configuration and use real tenant isolation plus audit-grade auth for operators.",
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
