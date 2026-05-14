import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { type KnowledgeChunk, retrieveKnowledge } from "./local-retrieval";
import { includesTerm, mdTable, pct } from "./rag-eval-utils";

type Topic = {
  name: string;
  terms: string[];
  minimumChunks: number;
};

export type CoverageSummary = {
  chunksCount: number;
  pagesCount: number;
  dominantTopics: Array<{ topic: string; chunks: number; percent: string }>;
  weakTopics: Array<{ topic: string; chunks: number; minimum: number }>;
  missingConcepts: string[];
  duplicateClusters: Array<{ key: string; count: number; pages: string[] }>;
  riskyPages: Array<{ pageTitle: string; url: string; reason: string; chunks: number }>;
  lowConfidenceHotspots: Array<{ query: string; confidence: string; topScore: number }>;
};

const knowledgePath = path.join(process.cwd(), "knowledge", "chatbot-knowledge.json");
const reportPath = path.join(process.cwd(), "knowledge", "semantic-coverage-report.md");

const topics: Topic[] = [
  { name: "tepelne cerpadla", terms: ["tepelne cerpadlo", "cerpadla", "vzduch voda", "zem voda"], minimumChunks: 80 },
  { name: "servis a udrzba", terms: ["servis", "udrzba", "revizia", "kontrola"], minimumChunks: 25 },
  { name: "dotacie", terms: ["dotacie", "dotacia", "prispevok", "poukazka"], minimumChunks: 20 },
  { name: "cena a ponuka", terms: ["cena", "cennik", "cenova ponuka", "naklady"], minimumChunks: 25 },
  { name: "montaz a instalacia", terms: ["montaz", "instalacia", "realizacia", "zapojenie"], minimumChunks: 25 },
  { name: "hlucnost", terms: ["hluk", "hlucnost", "tiche", "tichy"], minimumChunks: 8 },
  { name: "kontakt", terms: ["kontakt", "telefon", "email", "adresa"], minimumChunks: 6 },
  { name: "znacky", terms: ["NIBE", "Viessmann", "Vaillant", "Ariston", "Daikin"], minimumChunks: 25 },
  { name: "podlahove kurenie", terms: ["podlahove kurenie", "podlahovka", "vykurovanie"], minimumChunks: 20 },
  { name: "fotovoltaika", terms: ["fotovoltaika", "fotovoltika", "solarne panely"], minimumChunks: 10 },
  { name: "bezpecnost a zodpovednost", terms: ["zaruka", "odborny", "technik", "revizia"], minimumChunks: 10 },
];

const probeQueries = [
  "kolko stoji tepelne cerpadlo",
  "servis tepelneho cerpadla",
  "dotacie na tepelne cerpadla",
  "hlucnost NIBE",
  "kontakt telefon email",
  "montaz tepelneho cerpadla",
  "podlahove kurenie",
  "Daikin tepelne cerpadlo",
  "Ariston tepelne cerpadlo",
  "garancia navratnosti",
];

async function loadKnowledge(): Promise<KnowledgeChunk[]> {
  return JSON.parse(await readFile(knowledgePath, "utf8")) as KnowledgeChunk[];
}

function chunkText(chunk: KnowledgeChunk): string {
  return `${chunk.pageTitle} ${chunk.sectionHeading} ${chunk.slug} ${chunk.url} ${chunk.text}`;
}

function duplicateKey(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .slice(0, 55)
    .join(" ");
}

function analyzeDuplicates(chunks: KnowledgeChunk[]): CoverageSummary["duplicateClusters"] {
  const groups = new Map<string, KnowledgeChunk[]>();
  for (const chunk of chunks) {
    const key = duplicateKey(chunk.text);
    if (key.length < 120) continue;
    const list = groups.get(key) || [];
    list.push(chunk);
    groups.set(key, list);
  }

  return Array.from(groups.entries())
    .filter(([, group]) => group.length >= 3)
    .map(([key, group]) => ({
      key: `${key.slice(0, 140)}...`,
      count: group.length,
      pages: Array.from(new Set(group.map((chunk) => chunk.pageTitle))).slice(0, 6),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);
}

function analyzeRiskyPages(chunks: KnowledgeChunk[]): CoverageSummary["riskyPages"] {
  const byPage = new Map<string, KnowledgeChunk[]>();
  for (const chunk of chunks) {
    const key = `${chunk.pageTitle}||${chunk.url}`;
    const list = byPage.get(key) || [];
    list.push(chunk);
    byPage.set(key, list);
  }

  return Array.from(byPage.entries())
    .map(([key, pageChunks]) => {
      const [pageTitle, url] = key.split("||");
      const text = pageChunks.map((chunk) => chunk.text).join(" ");
      const avgLength = pageChunks.reduce((sum, chunk) => sum + chunk.textLength, 0) / pageChunks.length;
      const reasons: string[] = [];
      if (avgLength < 350) reasons.push("thin chunks");
      if (pageChunks.length > 40) reasons.push("dominant page may crowd retrieval");
      if (/(cookie|gdpr|formular|menu|footer|copyright)/i.test(text)) reasons.push("boilerplate-like terms");
      return { pageTitle, url, reason: reasons.join(", "), chunks: pageChunks.length };
    })
    .filter((page) => page.reason)
    .sort((a, b) => b.chunks - a.chunks)
    .slice(0, 15);
}

export async function runKnowledgeCoverage(writeReportFile = true): Promise<CoverageSummary> {
  const chunks = await loadKnowledge();
  const pagesCount = new Set(chunks.map((chunk) => chunk.url)).size;
  const topicCounts = topics.map((topic) => {
    const count = chunks.filter((chunk) => topic.terms.some((term) => includesTerm(chunkText(chunk), term))).length;
    return { topic, count };
  });

  const dominantTopics = topicCounts
    .map(({ topic, count }) => ({ topic: topic.name, chunks: count, percent: pct(count, chunks.length) }))
    .sort((a, b) => b.chunks - a.chunks);
  const weakTopics = topicCounts
    .filter(({ topic, count }) => count < topic.minimumChunks)
    .map(({ topic, count }) => ({ topic: topic.name, chunks: count, minimum: topic.minimumChunks }));
  const missingConcepts = topics
    .flatMap((topic) => topic.terms)
    .filter((term) => !chunks.some((chunk) => includesTerm(chunkText(chunk), term)));
  const duplicateClusters = analyzeDuplicates(chunks);
  const riskyPages = analyzeRiskyPages(chunks);
  const lowConfidenceHotspots = probeQueries
    .map((query) => {
      const retrieval = retrieveKnowledge(chunks, query, 3);
      const top = retrieval.results[0];
      return {
        query,
        confidence: top?.confidence || "no_answer",
        topScore: Number((top?.score.finalScore || 0).toFixed(2)),
      };
    })
    .filter((item) => item.confidence !== "confident" || item.topScore < 18);

  const summary: CoverageSummary = {
    chunksCount: chunks.length,
    pagesCount,
    dominantTopics,
    weakTopics,
    missingConcepts,
    duplicateClusters,
    riskyPages,
    lowConfidenceHotspots,
  };

  if (writeReportFile) {
    const report = [
      "# Semantic Coverage Report",
      "",
      "## Summary",
      `- chunks: ${summary.chunksCount}`,
      `- pages: ${summary.pagesCount}`,
      `- weak topics: ${summary.weakTopics.length}`,
      `- duplicate clusters: ${summary.duplicateClusters.length}`,
      `- low-confidence hotspots: ${summary.lowConfidenceHotspots.length}`,
      "",
      "## Dominant Topics",
      mdTable(["topic", "chunks", "coverage"], summary.dominantTopics.map((item) => [item.topic, item.chunks, item.percent])),
      "",
      "## Weak Topics",
      summary.weakTopics.length
        ? mdTable(["topic", "chunks", "minimum"], summary.weakTopics.map((item) => [item.topic, item.chunks, item.minimum]))
        : "No weak topics detected by the configured thresholds.",
      "",
      "## Missing Concepts",
      summary.missingConcepts.length ? summary.missingConcepts.map((term) => `- ${term}`).join("\n") : "No configured concept is fully missing.",
      "",
      "## Duplicate Chunk Clusters",
      summary.duplicateClusters.length
        ? mdTable(["count", "pages", "sample"], summary.duplicateClusters.map((item) => [item.count, item.pages.join(", "), item.key]))
        : "No large duplicate clusters detected.",
      "",
      "## Risky Pages",
      summary.riskyPages.length
        ? mdTable(["page", "chunks", "reason", "url"], summary.riskyPages.map((item) => [item.pageTitle, item.chunks, item.reason, item.url]))
        : "No risky pages detected by the configured heuristics.",
      "",
      "## Low-Confidence Hotspots",
      summary.lowConfidenceHotspots.length
        ? mdTable(
            ["query", "confidence", "topScore"],
            summary.lowConfidenceHotspots.map((item) => [item.query, item.confidence, item.topScore]),
          )
        : "Probe queries retrieved confidently.",
    ].join("\n");
    await writeFile(reportPath, `${report}\n`, "utf8");
  }

  return summary;
}

if (require.main === module) {
  runKnowledgeCoverage()
    .then((summary) => {
      console.log(`Semantic coverage report written: ${reportPath}`);
      console.log(`Weak topics: ${summary.weakTopics.length}`);
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
