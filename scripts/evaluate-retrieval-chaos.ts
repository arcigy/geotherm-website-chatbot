import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { type KnowledgeChunk, normalize, retrieveKnowledge, tokenize } from "./local-retrieval";
import { mdTable, pct } from "./rag-eval-utils";

export type ChaosCase = {
  id: string;
  category: string;
  query: string;
  expectedThemes: string[];
  shouldFallback: boolean;
};

export type ChaosSummary = {
  total: number;
  pass: number;
  warn: number;
  fail: number;
  top1Relevance: number;
  top3Diversity: number;
  falsePositiveRate: number;
  irrelevantSourceContamination: number;
  overconfidentWrongRetrievals: number;
  driftIncidents: number;
  weakestCategories: string[];
};

const knowledgePath = path.join(process.cwd(), "knowledge", "chatbot-knowledge.json");
const reportPath = path.join(process.cwd(), "knowledge", "retrieval-chaos-report.md");

const chaosCases: ChaosCase[] = [
  { id: "C001", category: "typo_tolerance", query: "tepelne cerpadllo cenov ponukaa", expectedThemes: ["cena", "ponuka"], shouldFallback: false },
  { id: "C002", category: "typo_tolerance", query: "serivs cerpadla hluci", expectedThemes: ["servis", "hluk"], shouldFallback: false },
  { id: "C003", category: "typo_tolerance", query: "dotacii prispevokk stat", expectedThemes: ["dotácia", "príspevok"], shouldFallback: false },
  { id: "C004", category: "synonym_robustness", query: "udrzba zariadenia pred zimou", expectedThemes: ["servis", "údržba"], shouldFallback: false },
  { id: "C005", category: "synonym_robustness", query: "podpora od statu na oze", expectedThemes: ["dotácia", "podpora"], shouldFallback: false },
  { id: "C006", category: "multi_intent_confusion", query: "dotacia servis cena cerpadlo", expectedThemes: ["dotácia", "servis", "cena"], shouldFallback: false },
  { id: "C007", category: "multi_intent_confusion", query: "nibe hluk cena servis", expectedThemes: ["NIBE", "hluk", "servis"], shouldFallback: false },
  { id: "C008", category: "vague_queries", query: "co s tym", expectedThemes: [], shouldFallback: true },
  { id: "C009", category: "vague_queries", query: "oplati sa", expectedThemes: [], shouldFallback: true },
  { id: "C010", category: "conflicting_keywords", query: "najlacnejsie najtichsie najvykonnejsie", expectedThemes: ["hluk", "cena"], shouldFallback: false },
  { id: "C011", category: "source_collisions", query: "kontakt cena navrh vykurovania", expectedThemes: ["kontakt", "cena", "návrh"], shouldFallback: false },
  { id: "C012", category: "boilerplate_dominance", query: "kontakt ochrana osobnych udajov formular", expectedThemes: ["kontakt"], shouldFallback: false },
  { id: "C013", category: "generic_retrieval", query: "poradte mi investovanie do akcii", expectedThemes: [], shouldFallback: true },
  { id: "C014", category: "generic_retrieval", query: "ake auto mam kupit", expectedThemes: [], shouldFallback: true },
  { id: "C015", category: "retrieval_drift", query: "servis tepelneho cerpadla zaruka vaillant", expectedThemes: ["servis", "záruka", "Vaillant"], shouldFallback: false },
  { id: "C016", category: "retrieval_drift", query: "podlahove kurenie cena skladba", expectedThemes: ["podlahové", "cena"], shouldFallback: false },
  { id: "C017", category: "mixed_language", query: "heat pump subsidy Slovakia", expectedThemes: ["tepelné čerpadlo", "dotácia"], shouldFallback: false },
  { id: "C018", category: "mixed_language", query: "NIBE noise tichy rezim", expectedThemes: ["NIBE", "hluk"], shouldFallback: false },
  { id: "C019", category: "unsupported_place", query: "pobocka praha servis", expectedThemes: [], shouldFallback: true },
  { id: "C020", category: "unsupported_finance", query: "bitcoin etf hypoteky", expectedThemes: [], shouldFallback: true },
];

function hasTheme(text: string, terms: string[]): boolean {
  if (!terms.length) return true;
  const normalized = normalize(text);
  const tokens = new Set(tokenize(text));
  return terms.some((term) => {
    const normalizedTerm = normalize(term);
    const termTokens = tokenize(term);
    return normalized.includes(normalizedTerm) || termTokens.every((token) => tokens.has(token));
  });
}

export async function runRetrievalChaos(writeReport = true): Promise<ChaosSummary> {
  const chunks = JSON.parse(await readFile(knowledgePath, "utf8")) as KnowledgeChunk[];
  const rows = chaosCases.map((test) => {
    const response = retrieveKnowledge(chunks, test.query, 5);
    const top = response.results[0];
    const topText = top ? `${top.chunk.pageTitle} ${top.chunk.sectionHeading} ${top.chunk.url} ${top.chunk.text}` : "";
    const top1Relevant = test.shouldFallback ? top?.confidence !== "confident" : Boolean(top && hasTheme(topText, test.expectedThemes));
    const top3Pages = new Set(response.results.slice(0, 3).map((result) => `${result.chunk.sourceType}:${result.chunk.sourceId}`));
    const top3Diverse = top3Pages.size >= Math.min(2, response.results.slice(0, 3).length);
    const falsePositive = test.shouldFallback && top?.confidence === "confident";
    const contamination = !test.shouldFallback && response.results.slice(0, 3).some((result) => !hasTheme(`${result.chunk.pageTitle} ${result.chunk.sectionHeading} ${result.chunk.text}`, test.expectedThemes));
    const overconfidentWrong = Boolean(top && top.confidence === "confident" && !top1Relevant);
    const drift = Boolean(top && !test.shouldFallback && top.confidence === "confident" && !hasTheme(topText, test.expectedThemes));
    const score = [top1Relevant, top3Diverse, !falsePositive, !overconfidentWrong].filter(Boolean).length;
    const verdict = overconfidentWrong || falsePositive ? "FAIL" : contamination || !top1Relevant ? "WARN" : "PASS";
    return { test, response, top1Relevant, top3Diverse, falsePositive, contamination, overconfidentWrong, drift, score, verdict };
  });

  const total = rows.length;
  const pass = rows.filter((row) => row.verdict === "PASS").length;
  const warn = rows.filter((row) => row.verdict === "WARN").length;
  const fail = rows.filter((row) => row.verdict === "FAIL").length;
  const categoryStats = new Map<string, { total: number; pass: number; fail: number }>();
  for (const row of rows) {
    const stat = categoryStats.get(row.test.category) || { total: 0, pass: 0, fail: 0 };
    stat.total += 1;
    if (row.verdict === "PASS") stat.pass += 1;
    if (row.verdict === "FAIL") stat.fail += 1;
    categoryStats.set(row.test.category, stat);
  }
  const weakestCategories = [...categoryStats.entries()]
    .filter(([, stat]) => stat.pass / stat.total < 0.8)
    .map(([category]) => category);

  const summary: ChaosSummary = {
    total,
    pass,
    warn,
    fail,
    top1Relevance: rows.filter((row) => row.top1Relevant).length / total,
    top3Diversity: rows.filter((row) => row.top3Diverse).length / total,
    falsePositiveRate: rows.filter((row) => row.falsePositive).length / total,
    irrelevantSourceContamination: rows.filter((row) => row.contamination).length / total,
    overconfidentWrongRetrievals: rows.filter((row) => row.overconfidentWrong).length,
    driftIncidents: rows.filter((row) => row.drift).length,
    weakestCategories,
  };

  if (writeReport) {
    const report = [
      "# Retrieval Chaos Report",
      "",
      `Generated: ${new Date().toISOString()}`,
      "",
      "## Summary",
      "",
      `- total: ${total}`,
      `- pass/warn/fail: ${pass}/${warn}/${fail}`,
      `- top1 relevance: ${pct(rows.filter((row) => row.top1Relevant).length, total)}`,
      `- top3 diversity: ${pct(rows.filter((row) => row.top3Diverse).length, total)}`,
      `- false positive rate: ${pct(rows.filter((row) => row.falsePositive).length, total)}`,
      `- irrelevant source contamination: ${pct(rows.filter((row) => row.contamination).length, total)}`,
      `- overconfident wrong retrievals: ${summary.overconfidentWrongRetrievals}`,
      `- retrieval drift incidents: ${summary.driftIncidents}`,
      "",
      "## Cases",
      "",
      mdTable(
        ["ID", "Category", "Verdict", "Top confidence", "Top source", "Query"],
        rows.map((row) => [
          row.test.id,
          row.test.category,
          row.verdict,
          row.response.results[0]?.confidence || "none",
          row.response.results[0]?.chunk.pageTitle || "-",
          row.test.query,
        ]),
      ),
    ].join("\n");
    await mkdir(path.dirname(reportPath), { recursive: true });
    await writeFile(reportPath, report, "utf8");
  }

  return summary;
}

if (require.main === module) {
  runRetrievalChaos()
    .then((summary) => {
      console.log(`Retrieval chaos: ${summary.pass}/${summary.warn}/${summary.fail}`);
      console.log(`Saved ${reportPath}`);
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    });
}
