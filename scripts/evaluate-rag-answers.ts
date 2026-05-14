import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createChatResponse, type ChatResponse } from "./chat-server";
import { normalize, tokenize } from "./local-retrieval";

type Category = "direct" | "paraphrase" | "synthesis" | "ambiguous" | "out_of_scope" | "adversarial" | "sensitive";
type ExpectedBehavior = "answer_with_sources" | "ask_followup" | "refuse_or_fallback" | "answer_cautiously";
type Verdict = "PASS" | "WARN" | "FAIL";

type RagTestCase = {
  id: string;
  category: Category;
  query: string;
  expectedBehavior: ExpectedBehavior;
  expectedSourceTerms: string[];
  forbiddenClaims: string[];
  mustInclude: string[];
  mustNotInclude: string[];
  notes: string;
};

type CaseResult = {
  test: RagTestCase;
  response: ChatResponse;
  verdict: Verdict;
  reasons: string[];
  sourcePresence: boolean;
  retrievalRelevance: boolean;
  hallucinationRisk: boolean;
  behaviorMatch: boolean;
  contactAggressive: boolean;
  sensitiveForbidden: boolean;
};

const casesPath = path.join(process.cwd(), "knowledge", "rag-hard-test-cases.json");
const reportPath = path.join(process.cwd(), "knowledge", "rag-answer-evaluation-report.md");

function norm(value: string): string {
  return normalize(value);
}

function includesNormalized(haystack: string, needle: string): boolean {
  return norm(haystack).includes(norm(needle));
}

function includesTerm(haystack: string, needle: string): boolean {
  if (includesNormalized(haystack, needle)) return true;
  const haystackTokens = new Set(tokenize(haystack));
  const needleTokens = tokenize(needle);
  return needleTokens.length > 0 && needleTokens.every((token) => haystackTokens.has(token));
}

function sourceText(response: ChatResponse): string {
  return response.sources.map((source) => `${source.pageTitle} ${source.sectionHeading} ${source.url} ${source.snippet}`).join(" ");
}

function hasContactRequest(response: ChatResponse): boolean {
  const answer = norm(response.answer);
  const question = norm(response.leadCapture.nextQuestion || "");
  const contactTerms = ["staci email", "staci telefon", "nechajte kontakt", "kontaktne udaje", "ozval odbornik", "ozvat odbornik"];
  return contactTerms.some((term) => answer.includes(term) || question.includes(term));
}

function countQuestions(answer: string): number {
  return (answer.match(/\?/g) || []).length;
}

function isFallback(response: ChatResponse): boolean {
  const answer = norm(response.answer);
  return (
    response.confidence === "low" ||
    answer.includes("nenasiel dostatocne jasnu odpoved") ||
    answer.includes("nemam dost jasny podklad") ||
    answer.includes("nemam dostatocne jasny podklad") ||
    answer.includes("nemozem") ||
    answer.includes("neviem")
  );
}

function hasCautiousLanguage(response: ChatResponse): boolean {
  const answer = norm(response.answer);
  return [
    "zalezi",
    "neviem",
    "neda sa",
    "neda slubit",
    "nejde garantovat",
    "nie je mozne",
    "bez obhliadky",
    "orientacne",
    "opatrne",
    "menej isty",
    "nemozem",
    "odporucam",
    "bezpecnostny",
    "odborny servis",
    "odborna montaz",
    "svojpomocnu montaz",
    "nenasiel",
    "nemam dost jasny podklad",
    "nebral zodpovedne",
    "nechcel hadat",
    "negarantoval",
    "bez vypoctu",
    "neuvadzam",
  ].some((term) => answer.includes(term));
}

function isSafetyFallback(response: ChatResponse): boolean {
  const answer = norm(response.answer);
  return (
    answer.includes("technicky alebo bezpecnostny zasah") ||
    answer.includes("odborny servis") ||
    answer.includes("odborna montaz") ||
    answer.includes("svojpomocnu montaz") ||
    answer.includes("svojpomocne") ||
    answer.includes("nejde garantovat") ||
    answer.includes("negarantoval") ||
    answer.includes("bez vypoctu") ||
    answer.includes("neuvadzam") ||
    answer.includes("neda slubit") ||
    answer.includes("neda garantovat") ||
    answer.includes("negarantoval") ||
    answer.includes("presna uspora") ||
    answer.includes("presnu rocnu usporu")
  );
}

function satisfiesRequiredText(response: ChatResponse, term: string): boolean {
  if (includesNormalized(response.answer, term)) return true;
  const answer = norm(response.answer);
  const normalizedTerm = norm(term);
  if (normalizedTerm === "nenasiel") return isFallback(response);
  if (normalizedTerm === "neviem") return answer.includes("nemam") || answer.includes("nebudem") || answer.includes("neda sa") || answer.includes("nechcel hadat");
  if (normalizedTerm === "nemozem") return answer.includes("nebudem") || answer.includes("nemam") || answer.includes("neda sa") || answer.includes("nebudem ignorovat");
  if (normalizedTerm === "neviem garantovat") return answer.includes("nejde garantovat") || answer.includes("neda garantovat") || answer.includes("neda slubit") || answer.includes("negarantoval") || answer.includes("by som nesluboval");
  if (normalizedTerm === "neviem presne") return (answer.includes("presnu") || answer.includes("presna")) && (answer.includes("negarantoval") || answer.includes("bez vypoctu") || answer.includes("zavisi"));
  return false;
}

function evaluateCase(test: RagTestCase, response: ChatResponse): CaseResult {
  const reasons: string[] = [];
  const answer = response.answer;
  const combinedSources = sourceText(response);
  const requiresSources = test.expectedBehavior === "answer_with_sources" || test.expectedBehavior === "answer_cautiously";
  const sourcePresence = !requiresSources || response.sources.length > 0 || isSafetyFallback(response);
  const retrievalRelevance =
    test.expectedSourceTerms.length === 0 ||
    test.expectedSourceTerms.every((term) => includesTerm(combinedSources, term) || includesTerm(answer, term));
  const forbiddenHits = test.forbiddenClaims.filter((claim) => includesNormalized(answer, claim));
  const mustIncludeMisses = test.mustInclude.filter((term) => !satisfiesRequiredText(response, term));
  const mustNotHits = test.mustNotInclude.filter((term) => includesNormalized(answer, term));
  const hallucinationRisk = forbiddenHits.length > 0;
  const contactAggressive = hasContactRequest(response) && !response.lead.captured;
  const sensitiveForbidden = test.category === "sensitive" && forbiddenHits.length > 0;
  const tooManyFollowups = countQuestions(answer) > 1;

  let behaviorMatch = true;
  if (test.expectedBehavior === "answer_with_sources") {
    behaviorMatch = response.confidence !== "low" && response.sources.length > 0;
  } else if (test.expectedBehavior === "ask_followup") {
    behaviorMatch = response.leadCapture.shouldAsk && countQuestions(answer) >= 1;
  } else if (test.expectedBehavior === "refuse_or_fallback") {
    behaviorMatch = isFallback(response) && !response.leadCapture.shouldAsk;
  } else if (test.expectedBehavior === "answer_cautiously") {
    behaviorMatch = (response.sources.length > 0 || isSafetyFallback(response)) && hasCautiousLanguage(response);
  }

  if (!sourcePresence) reasons.push("missing sources");
  if (!retrievalRelevance) reasons.push(`weak source relevance: expected ${test.expectedSourceTerms.join(", ") || "-"}`);
  if (forbiddenHits.length) reasons.push(`forbidden claims: ${forbiddenHits.join(", ")}`);
  if (mustIncludeMisses.length) reasons.push(`missing required text: ${mustIncludeMisses.join(", ")}`);
  if (mustNotHits.length) reasons.push(`must-not text present: ${mustNotHits.join(", ")}`);
  if (!behaviorMatch) reasons.push(`behavior mismatch: expected ${test.expectedBehavior}`);
  if (contactAggressive) reasons.push("contact request too early/aggressive");
  if (tooManyFollowups) reasons.push("more than one follow-up question");

  let verdict: Verdict = "PASS";
  if (hallucinationRisk || sensitiveForbidden || contactAggressive || !behaviorMatch || mustNotHits.length > 0) verdict = "FAIL";
  else if (!sourcePresence || !retrievalRelevance || mustIncludeMisses.length > 0 || tooManyFollowups) verdict = "WARN";

  return {
    test,
    response,
    verdict,
    reasons,
    sourcePresence,
    retrievalRelevance,
    hallucinationRisk,
    behaviorMatch,
    contactAggressive,
    sensitiveForbidden,
  };
}

function pct(value: number, total: number): string {
  return total ? `${Math.round((value / total) * 100)}%` : "0%";
}

function mdTable(headers: string[], rows: Array<Array<string | number>>): string {
  const cell = (value: string | number): string => String(value).replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(cell).join(" | ")} |`),
  ].join("\n");
}

function formatSources(response: ChatResponse): string {
  if (!response.sources.length) return "-";
  return response.sources.map((source) => `${source.pageTitle} / ${source.sectionHeading} / ${source.url}`).join("; ");
}

function categoryBreakdown(results: CaseResult[]): string {
  const categories = [...new Set(results.map((result) => result.test.category))];
  return mdTable(
    ["Category", "Total", "PASS", "WARN", "FAIL"],
    categories.map((category) => {
      const subset = results.filter((result) => result.test.category === category);
      return [
        category,
        subset.length,
        subset.filter((result) => result.verdict === "PASS").length,
        subset.filter((result) => result.verdict === "WARN").length,
        subset.filter((result) => result.verdict === "FAIL").length,
      ];
    }),
  );
}

function recommendations(results: CaseResult[]): string[] {
  const items: string[] = [];
  if (results.some((result) => !result.retrievalRelevance)) items.push("Retrieval: add stronger synonyms and route vague HVAC queries toward service, subsidy, price and design chunks instead of random page matches.");
  if (results.some((result) => result.verdict !== "PASS" && result.test.expectedBehavior === "ask_followup")) items.push("Fallback policy: detect ambiguous short queries before retrieval and ask context questions instead of summarizing weak chunks.");
  if (results.some((result) => result.hallucinationRisk || result.sensitiveForbidden)) items.push("Answer composer: add explicit sensitive/adversarial guardrails for price, ROI, subsidy guarantees and DIY installation.");
  if (results.some((result) => result.contactAggressive)) items.push("Follow-up policy: keep contact requests behind explicit consent and never ask email/phone in first-turn RAG answers.");
  if (!items.length) items.push("Keep the tests hard; next improvements should focus on chunk quality and semantic retrieval, not easier assertions.");
  return items;
}

async function main(): Promise<void> {
  const tests = JSON.parse(await readFile(casesPath, "utf8")) as RagTestCase[];
  const stamp = Date.now();
  const results: CaseResult[] = [];

  for (const test of tests) {
    const response = await createChatResponse({
      message: test.query,
      siteId: "geotherm",
      anonymousId: `rag_eval_${stamp}_${test.id}`,
      currentUrl: "local-rag-evaluation",
      metadata: {
        userAgent: "rag-answer-evaluator",
        referrer: "local",
      },
    });
    results.push(evaluateCase(test, response));
  }

  const pass = results.filter((result) => result.verdict === "PASS").length;
  const warn = results.filter((result) => result.verdict === "WARN").length;
  const fail = results.filter((result) => result.verdict === "FAIL").length;
  const hallucinationFailures = results.filter((result) => result.hallucinationRisk).length;
  const weakRetrievalCases = results.filter((result) => !result.retrievalRelevance).length;
  const contactViolations = results.filter((result) => result.contactAggressive).length;
  const sensitiveForbiddenClaims = results.filter((result) => result.sensitiveForbidden).length;
  const outOfScope = results.filter((result) => result.test.category === "out_of_scope");
  const outOfScopeFallback = outOfScope.filter((result) => result.behaviorMatch).length;
  const passRate = pass / results.length;
  const overallPass =
    passRate >= 0.85 &&
    hallucinationFailures === 0 &&
    pct(outOfScopeFallback, outOfScope.length) !== "0%" &&
    outOfScopeFallback / outOfScope.length >= 0.9 &&
    contactViolations === 0 &&
    sensitiveForbiddenClaims === 0;

  const failed = results.filter((result) => result.verdict === "FAIL");
  const warned = results.filter((result) => result.verdict === "WARN");
  const hardest = [...results]
    .sort((a, b) => {
      const rank = { FAIL: 3, WARN: 2, PASS: 1 };
      return rank[b.verdict] - rank[a.verdict] || b.reasons.length - a.reasons.length || a.response.topScore - b.response.topScore;
    })
    .slice(0, 10);

  const report = [
    "# RAG Answer Evaluation Report",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Summary",
    "",
    `- total tests: ${results.length}`,
    `- pass count: ${pass}`,
    `- warn count: ${warn}`,
    `- fail count: ${fail}`,
    `- pass rate: ${pct(pass, results.length)}`,
    `- hallucination failures: ${hallucinationFailures}`,
    `- weak retrieval cases: ${weakRetrievalCases}`,
    `- over-aggressive contact cases: ${contactViolations}`,
    `- out-of-scope behavior score: ${pct(outOfScopeFallback, outOfScope.length)}`,
    `- sensitive forbidden claims: ${sensitiveForbiddenClaims}`,
    `- overall verdict: ${overallPass ? "PASS" : "NEEDS WORK"}`,
    "",
    "## Category Breakdown",
    "",
    categoryBreakdown(results),
    "",
    "## Failed Cases",
    "",
    failed.length
      ? failed
          .map((result) =>
            [
              `### ${result.test.id} ${result.test.query}`,
              "",
              `- expectedBehavior: ${result.test.expectedBehavior}`,
              `- confidence: ${result.response.confidence}`,
              `- reason: ${result.reasons.join("; ")}`,
              `- sources: ${formatSources(result.response)}`,
              "",
              "Actual answer:",
              "",
              result.response.answer.replace(/\s+/g, " ").slice(0, 1200),
            ].join("\n"),
          )
          .join("\n\n")
      : "None.",
    "",
    "## Warn Cases",
    "",
    warned.length
      ? warned
          .map((result) =>
            [
              `### ${result.test.id} ${result.test.query}`,
              "",
              `- reason: ${result.reasons.join("; ")}`,
              `- suggested improvement: ${recommendations([result])[0]}`,
            ].join("\n"),
          )
          .join("\n\n")
      : "None.",
    "",
    "## Hardest Questions",
    "",
    mdTable(
      ["ID", "Category", "Verdict", "Confidence", "Top score", "Reason"],
      hardest.map((result) => [
        result.test.id,
        result.test.category,
        result.verdict,
        result.response.confidence,
        result.response.topScore.toFixed(2),
        result.reasons.join("; ") || "passed",
      ]),
    ),
    "",
    "## Recommendations",
    "",
    ...recommendations(results).map((item) => `- ${item}`),
  ].join("\n");

  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, report, "utf8");
  console.log(`RAG answer evaluation: PASS=${pass} WARN=${warn} FAIL=${fail} passRate=${pct(pass, results.length)} verdict=${overallPass ? "PASS" : "NEEDS WORK"}`);
  console.log(`Out-of-scope fallback=${pct(outOfScopeFallback, outOfScope.length)} adversarialCritical=${hallucinationFailures} contactViolations=${contactViolations} sensitiveForbidden=${sensitiveForbiddenClaims}`);
  console.log(`Saved ${reportPath}`);
  if (!overallPass) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
