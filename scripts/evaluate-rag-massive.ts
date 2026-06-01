import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createChatResponse } from "./chat-server";
import { runKnowledgeCoverage } from "./analyze-knowledge-coverage";
import { runKnowledgeContradictions } from "./detect-knowledge-contradictions";
import { runRetrievalChaos } from "./evaluate-retrieval-chaos";
import { runLongConversationStress } from "./test-long-conversations";
import { evaluateMassiveCase, mdTable, pct, type EvaluatedCase, type MassiveTestCase } from "./rag-eval-utils";

type MassiveSummary = {
  total: number;
  pass: number;
  warn: number;
  fail: number;
  hallucinationIncidents: number;
  overconfidenceIncidents: number;
  retrievalDriftIncidents: number;
  contactAggressionViolations: number;
  weakestCategories: Array<{ category: string; total: number; fail: number; warn: number; passRate: string }>;
  strongestCategories: Array<{ category: string; total: number; fail: number; warn: number; passRate: string }>;
  estimatedReliability: string;
};

const casesPath = path.join(process.cwd(), "knowledge", "rag-massive-test-cases.json");
const reportPath = path.join(process.cwd(), "knowledge", "rag-massive-evaluation-report.md");

async function loadCases(): Promise<MassiveTestCase[]> {
  return JSON.parse(await readFile(casesPath, "utf8")) as MassiveTestCase[];
}

function summarizeByCategory(results: EvaluatedCase[]): MassiveSummary["weakestCategories"] {
  const groups = new Map<string, EvaluatedCase[]>();
  for (const result of results) {
    const list = groups.get(result.test.category) || [];
    list.push(result);
    groups.set(result.test.category, list);
  }
  return Array.from(groups.entries())
    .map(([category, items]) => {
      const fail = items.filter((item) => item.verdict === "FAIL").length;
      const warn = items.filter((item) => item.verdict === "WARN").length;
      const pass = items.filter((item) => item.verdict === "PASS").length;
      return { category, total: items.length, fail, warn, passRate: pct(pass, items.length) };
    })
    .sort((a, b) => b.fail - a.fail || b.warn - a.warn || Number.parseInt(a.passRate) - Number.parseInt(b.passRate));
}

function estimateReliability(summary: MassiveSummary): string {
  const passRate = summary.total ? summary.pass / summary.total : 0;
  if (summary.hallucinationIncidents || summary.overconfidenceIncidents > 8) return "low";
  if (passRate >= 0.9 && summary.fail <= 5) return "moderate-high for local demo, not production";
  if (passRate >= 0.75) return "moderate for assisted testing only";
  return "low; production risk is high";
}

async function evaluateCases(cases: MassiveTestCase[]): Promise<EvaluatedCase[]> {
  const concurrency = Math.max(1, Math.min(8, Number.parseInt(process.env.RAG_MASSIVE_CONCURRENCY || "5", 10) || 5));
  const results: EvaluatedCase[] = new Array(cases.length);
  let cursor = 0;
  async function worker(): Promise<void> {
    while (cursor < cases.length) {
      const index = cursor++;
      const test = cases[index];
      if (!test) continue;
      const response = await createChatResponse({
        message: test.query,
        siteId: "geotherm",
        anonymousId: `massive_${test.id}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        currentUrl: "http://localhost/rag-massive",
        metadata: { userAgent: "rag-massive-evaluator" },
      });
      results[index] = evaluateMassiveCase(test, response);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, cases.length) }, () => worker()));
  return results.filter(Boolean);
}

export async function runMassiveEvaluation(): Promise<MassiveSummary> {
  const cases = await loadCases();
  const results = await evaluateCases(cases);
  const pass = results.filter((result) => result.verdict === "PASS").length;
  const warn = results.filter((result) => result.verdict === "WARN").length;
  const fail = results.filter((result) => result.verdict === "FAIL").length;
  const byCategory = summarizeByCategory(results);
  const summary: MassiveSummary = {
    total: cases.length,
    pass,
    warn,
    fail,
    hallucinationIncidents: results.filter((result) => result.hallucinationIncident).length,
    overconfidenceIncidents: results.filter((result) => result.overconfidenceIncident).length,
    retrievalDriftIncidents: results.filter((result) => result.retrievalDriftIncident).length,
    contactAggressionViolations: results.filter((result) => result.contactAggressive).length,
    weakestCategories: byCategory.slice(0, 8),
    strongestCategories: [...byCategory].reverse().slice(0, 8),
    estimatedReliability: "unknown",
  };
  summary.estimatedReliability = estimateReliability(summary);

  const chaos = await runRetrievalChaos(true);
  const coverage = await runKnowledgeCoverage(true);
  const contradictions = await runKnowledgeContradictions(true);
  const longConversation = await runLongConversationStress(true);

  const failed = results.filter((result) => result.verdict === "FAIL").slice(0, 40);
  const warned = results.filter((result) => result.verdict === "WARN").slice(0, 40);
  const report = [
    "# RAG Massive Evaluation Report",
    "",
    "## Summary",
    `- total tests: ${summary.total}`,
    `- pass: ${summary.pass}`,
    `- warn: ${summary.warn}`,
    `- fail: ${summary.fail}`,
    `- pass rate: ${pct(summary.pass, summary.total)}`,
    `- hallucination incidents: ${summary.hallucinationIncidents}`,
    `- overconfidence incidents: ${summary.overconfidenceIncidents}`,
    `- retrieval drift incidents: ${summary.retrievalDriftIncidents}`,
    `- contact aggression violations: ${summary.contactAggressionViolations}`,
    `- estimated real-world reliability: ${summary.estimatedReliability}`,
    "",
    "## Category Breakdown",
    mdTable(
      ["category", "total", "passRate", "warn", "fail"],
      byCategory.map((item) => [item.category, item.total, item.passRate, item.warn, item.fail]),
    ),
    "",
    "## Weakest Categories",
    mdTable(
      ["category", "total", "passRate", "warn", "fail"],
      summary.weakestCategories.map((item) => [item.category, item.total, item.passRate, item.warn, item.fail]),
    ),
    "",
    "## Strongest Categories",
    mdTable(
      ["category", "total", "passRate", "warn", "fail"],
      summary.strongestCategories.map((item) => [item.category, item.total, item.passRate, item.warn, item.fail]),
    ),
    "",
    "## Failed Cases",
    failed.length
      ? mdTable(
          ["id", "category", "query", "confidence", "intent", "reasons", "answer"],
          failed.map((result) => [
            result.test.id,
            result.test.category,
            result.test.query,
            result.response.confidence,
            result.response.intent,
            result.reasons.join("; "),
            result.response.answer.slice(0, 260),
          ]),
        )
      : "No failed massive cases.",
    "",
    "## Warn Cases",
    warned.length
      ? mdTable(
          ["id", "category", "query", "confidence", "intent", "reasons"],
          warned.map((result) => [
            result.test.id,
            result.test.category,
            result.test.query,
            result.response.confidence,
            result.response.intent,
            result.reasons.join("; "),
          ]),
        )
      : "No warned massive cases.",
    "",
    "## Retrieval Chaos Summary",
    `- tests: ${chaos.total}`,
    `- pass/warn/fail: ${chaos.pass}/${chaos.warn}/${chaos.fail}`,
    `- top1 relevance: ${chaos.top1Relevance}`,
    `- top3 diversity: ${chaos.top3Diversity}`,
    `- false positive rate: ${chaos.falsePositiveRate}`,
    `- irrelevant source contamination: ${chaos.irrelevantSourceContamination}`,
    `- overconfident wrong retrievals: ${chaos.overconfidentWrongRetrievals}`,
    `- drift incidents: ${chaos.driftIncidents}`,
    "",
    "## Semantic Coverage Summary",
    `- chunks: ${coverage.chunksCount}`,
    `- pages: ${coverage.pagesCount}`,
    `- weak topics: ${coverage.weakTopics.map((item) => item.topic).join(", ") || "none"}`,
    `- duplicate clusters: ${coverage.duplicateClusters.length}`,
    `- low-confidence hotspots: ${coverage.lowConfidenceHotspots.length}`,
    "",
    "## Contradiction Check Summary",
    `- suspected conflicts: ${contradictions.suspectedConflicts.length}`,
    `- price-like mentions: ${contradictions.priceMentions}`,
    `- time-sensitive mentions: ${contradictions.timeSensitiveMentions}`,
    "",
    "## Long Conversation Summary",
    `- scenarios: ${longConversation.scenarios}`,
    `- turns: ${longConversation.turns}`,
    `- pass/warn/fail: ${longConversation.pass}/${longConversation.warn}/${longConversation.fail}`,
    `- hallucinations: ${longConversation.hallucinations}`,
    `- contact aggression: ${longConversation.contactAggression}`,
    `- source degradation: ${longConversation.sourceDegradation}`,
    "",
    "## Production Risk Assessment",
    summary.fail || chaos.fail || longConversation.fail
      ? "NEEDS WORK. The known hard tests may pass, but massive/noisy traffic still exposes retrieval, confidence or behavior risk."
      : summary.warn || chaos.warn || longConversation.warn
        ? "USABLE FOR INTERNAL TESTING ONLY. No critical incidents detected, but warnings need manual review before client deployment."
        : "Strong local evaluation result, but still not production-grade without live monitoring, source freshness, human escalation and abuse controls.",
  ].join("\n");
  await writeFile(reportPath, `${report}\n`, "utf8");
  return summary;
}

if (require.main === module) {
  runMassiveEvaluation()
    .then((summary) => {
      console.log(`Massive RAG evaluation report written: ${reportPath}`);
      console.log(`PASS=${summary.pass} WARN=${summary.warn} FAIL=${summary.fail}`);
      console.log(`Estimated reliability: ${summary.estimatedReliability}`);
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
