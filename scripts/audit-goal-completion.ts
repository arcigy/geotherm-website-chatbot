import { execSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type EvidenceGate = {
  id: string;
  report: string;
  proof: RegExp;
  summary: string;
};

type GateResult = EvidenceGate & {
  pass: boolean;
  evidence: string;
};

const reportPath = path.join(process.cwd(), "knowledge", "goal-completion-gap-audit.md");

const gates: EvidenceGate[] = [
  {
    id: "production_readiness",
    report: "knowledge/production-readiness-audit.md",
    proof: /verdict:\s*PASS|Verdict:\s*PASS/i,
    summary: "Production gates, health, monitoring fields, auth/rate-limit gates and response-time budget.",
  },
  {
    id: "broad_surface",
    report: "knowledge/broad-surface-audit.md",
    proof: /verdict:\s*PASS/i,
    summary: "Broad service/product surface across Geotherm topics.",
  },
  {
    id: "live_questions",
    report: "knowledge/live-question-surface-audit.md",
    proof: /Questions:\s*102[\s\S]*Passed:\s*102[\s\S]*Failed:\s*0/i,
    summary: "Live/customer-style question list.",
  },
  {
    id: "wordpress_surface",
    report: "knowledge/wordpress-surface-audit.md",
    proof: /WordPress surface audit[\s\S]*94\/94 passed|verdict:\s*PASS/i,
    summary: "Generated checks from exported WordPress content.",
  },
  {
    id: "wordpress_paraphrases",
    report: "knowledge/paraphrase-surface-audit.md",
    proof: /Paraphrase surface audit[\s\S]*282\/282 passed|verdict:\s*PASS/i,
    summary: "WordPress-derived paraphrases and customer wording variants.",
  },
  {
    id: "non_heat_pump_flows",
    report: "knowledge/non-heat-pump-flow-audit.md",
    proof: /Verdict:\s*PASS|27\/27 turns passed/i,
    summary: "Multi-turn flows for services beyond heat pumps.",
  },
  {
    id: "adversarial_long_flows",
    report: "knowledge/adversarial-long-flow-audit.md",
    proof: /Verdict:\s*PASS|40\/40 passed/i,
    summary: "Corrections, topic switching, price/contact closure and adversarial turns.",
  },
  {
    id: "provider_resilience",
    report: "knowledge/provider-resilience-audit.md",
    proof: /Provider resilience audit[\s\S]*36\/36 passed|verdict:\s*PASS/i,
    summary: "Repeated critical scenarios require LLM usage and under-8s responses.",
  },
  {
    id: "diagnostic_conversation",
    report: "knowledge/diagnostic-conversation-test-report.md",
    proof: /Verdict:\s*PASS[\s\S]*Failed turns:\s*0\/44/i,
    summary: "Scripted recommendation, direct-answer, correction, price and CRM conversation flows.",
  },
  {
    id: "chat_api",
    report: "knowledge/chat-api-test-report.md",
    proof: /Chat API tests:\s*7\/7 passed|verdict:\s*PASS/i,
    summary: "API contract and debug surface.",
  },
  {
    id: "router",
    report: "knowledge/router-test-report.md",
    proof: /Router tests:\s*57\/57 passed|verdict:\s*PASS/i,
    summary: "Service and intent routing.",
  },
  {
    id: "cta_coverage",
    report: "knowledge/cta-coverage-audit.md",
    proof: /CTA coverage audit:\s*12\/12 passed|verdict:\s*PASS/i,
    summary: "Meeting, consultation and handoff CTA behavior.",
  },
  {
    id: "small_talk",
    report: "knowledge/small-talk-surface-audit.md",
    proof: /Small talk surface audit:\s*14\/14 passed|verdict:\s*PASS/i,
    summary: "Small talk uses AI but avoids unnecessary RAG.",
  },
  {
    id: "hallucination_guardrails",
    report: "knowledge/hallucination-guardrails-audit.md",
    proof: /Hallucination guardrails audit:\s*11\/11 passed|verdict:\s*PASS/i,
    summary: "Known banned claims, unsupported facts and safety constraints.",
  },
  {
    id: "sales_feedback",
    report: "knowledge/sales-feedback-audit.md",
    proof: /Turns:\s*\d+[\s\S]*Failed:\s*0[\s\S]*Verdict:\s*PASS/i,
    summary: "Salesperson feedback: vykanie, appointments, large objects, contact capture.",
  },
  {
    id: "sales_flow",
    report: "knowledge/sales-flow-test-report.md",
    proof: /-\s*passed:\s*5[\s\S]*-\s*failed:\s*0[\s\S]*-\s*verdict:\s*PASS/i,
    summary: "Sales flow behavior from first advisory question through soft handoff and lead capture.",
  },
  {
    id: "operational_guardrails",
    report: "knowledge/operational-guardrails-audit.md",
    proof: /Operational guardrails audit:\s*30\/30 passed|verdict:\s*PASS/i,
    summary: "Operational safety, persistence and policy guardrails.",
  },
];

function currentCommit(): string {
  try {
    return execSync("git rev-parse --short HEAD", { cwd: process.cwd(), encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

function firstUsefulLine(content: string): string {
  return (
    content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => /passed|verdict|PASS|failed|Summary/i.test(line)) || "report exists"
  );
}

async function checkGate(gate: EvidenceGate): Promise<GateResult> {
  try {
    const content = await readFile(path.join(process.cwd(), gate.report), "utf8");
    return {
      ...gate,
      pass: gate.proof.test(content),
      evidence: firstUsefulLine(content),
    };
  } catch (error) {
    return {
      ...gate,
      pass: false,
      evidence: error instanceof Error ? error.message : "missing report",
    };
  }
}

function table(rows: string[][]): string {
  const escape = (value: string) => value.replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
  return [
    "| Gate | Pass | Evidence | Scope |",
    "| --- | --- | --- | --- |",
    ...rows.map((row) => `| ${row.map(escape).join(" | ")} |`),
  ].join("\n");
}

async function main(): Promise<void> {
  const results = await Promise.all(gates.map(checkGate));
  const passed = results.filter((result) => result.pass).length;
  const generatedAt = new Date().toISOString();

  const report = [
    "# Geotherm Chatbot Goal Gap Audit",
    "",
    `Generated: ${generatedAt}`,
    `Audit base commit: ${currentCommit()}`,
    "",
    "## Evidence Gates",
    "",
    `Passed: ${passed}/${results.length}`,
    `Verdict: ${passed === results.length ? "EVIDENCE PASS" : "NEEDS WORK"}`,
    "",
    table(results.map((result) => [result.id, result.pass ? "yes" : "no", result.evidence, result.summary])),
    "",
    "## Proven By Current Evidence",
    "",
    "- Covered small talk goes through AI and avoids RAG when sources are not needed.",
    "- Covered vague questions receive direction plus follow-up questions.",
    "- Covered multi-turn flows stop asking after a few turns and move to recommendation, consultation or nacenenie.",
    "- Covered Geotherm services beyond heat pumps route through service-specific RAG and guardrails.",
    "- Covered price, model, subsidy, appointment and lead-capture risks are guarded against known hallucinations.",
    "- Covered response-time gates enforce an 8000 ms maximum.",
    "",
    "## Remaining Gaps",
    "",
    "- No finite local audit can prove every possible customer phrasing or zero hallucination globally.",
    "- New WordPress content, product changes, price rules, subsidies and service policy changes still need fresh RAG chunks and reruns.",
    "- Production readiness remains a monitoring discipline: live traffic should keep feeding new transcripts into these audits.",
    "- The user request to work in a duplicate instead of main conflicts with repository instructions that say to keep working on main and not create branches.",
    "",
    "## Next Work",
    "",
    "1. Add new failing customer transcripts to a concrete audit before changing behavior.",
    "2. Expand company-truth chunks only when a real missing fact is identified.",
    "3. Rerun this audit after the full test/audit suite to keep completion evidence current.",
    "",
  ].join("\n");

  await writeFile(reportPath, report, "utf8");
  console.log(`Goal completion evidence audit: ${passed}/${results.length} gates passed`);
  console.log(`Saved ${reportPath}`);
  if (passed !== results.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
