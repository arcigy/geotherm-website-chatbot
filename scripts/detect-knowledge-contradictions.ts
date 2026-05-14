import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { type KnowledgeChunk } from "./local-retrieval";
import { mdTable } from "./rag-eval-utils";

type SuspiciousConflict = {
  type: string;
  severity: "low" | "medium" | "high";
  evidence: string;
  pages: string[];
  reason: string;
};

export type ContradictionSummary = {
  chunksCount: number;
  suspectedConflicts: SuspiciousConflict[];
  contactVariants: string[];
  priceMentions: number;
  timeSensitiveMentions: number;
};

const knowledgePath = path.join(process.cwd(), "knowledge", "chatbot-knowledge.json");
const reportPath = path.join(process.cwd(), "knowledge", "knowledge-contradictions-report.md");

async function loadKnowledge(): Promise<KnowledgeChunk[]> {
  return JSON.parse(await readFile(knowledgePath, "utf8")) as KnowledgeChunk[];
}

function normalizePhone(value: string): string {
  return value.replace(/[^\d+]/g, "");
}

function uniquePages(chunks: KnowledgeChunk[]): string[] {
  return Array.from(new Set(chunks.map((chunk) => `${chunk.pageTitle} (${chunk.url})`))).slice(0, 8);
}

function collectByPattern(chunks: KnowledgeChunk[], pattern: RegExp): Map<string, KnowledgeChunk[]> {
  const groups = new Map<string, KnowledgeChunk[]>();
  for (const chunk of chunks) {
    const matches = chunk.text.match(pattern) || [];
    for (const match of matches) {
      const key = match.trim();
      const list = groups.get(key) || [];
      list.push(chunk);
      groups.set(key, list);
    }
  }
  return groups;
}

function detectServiceConflicts(chunks: KnowledgeChunk[]): SuspiciousConflict[] {
  const conflicts: SuspiciousConflict[] = [];
  const fullText = chunks.map((chunk) => chunk.text).join("\n");
  const hasServiceYes = /servis|udrzba|revizia|kontrola/i.test(fullText);
  const hasThirdPartyAmbiguity = /nie\s+je\s+od\s+nas|inej\s+znacky|ak\s+nie\s+je\s+od\s+vas/i.test(fullText);
  const hasServiceRestriction = /len\s+vlastne|iba\s+nase|servisujeme\s+len/i.test(fullText);
  if (hasServiceYes && hasServiceRestriction) {
    conflicts.push({
      type: "service scope",
      severity: "medium",
      evidence: "Knowledge contains service claims and restrictive wording such as only/iba/len.",
      pages: uniquePages(chunks.filter((chunk) => /servis|iba|len|vlastne/i.test(chunk.text))),
      reason: "Could confuse users asking whether third-party heat pumps are serviced.",
    });
  }
  if (hasServiceYes && !hasThirdPartyAmbiguity) {
    conflicts.push({
      type: "service scope gap",
      severity: "low",
      evidence: "Service is present, but third-party service scope is not clearly covered.",
      pages: uniquePages(chunks.filter((chunk) => /servis|udrzba|revizia/i.test(chunk.text))),
      reason: "This is not a contradiction, but a risky missing distinction for real users.",
    });
  }
  return conflicts;
}

function detectSubsidyConflicts(chunks: KnowledgeChunk[]): SuspiciousConflict[] {
  const subsidyChunks = chunks.filter((chunk) => /dotaci|prispevok|poukazk|oze/i.test(chunk.text));
  const text = subsidyChunks.map((chunk) => chunk.text).join("\n");
  const conflicts: SuspiciousConflict[] = [];
  if (/garant/i.test(text)) {
    conflicts.push({
      type: "subsidy guarantee",
      severity: "high",
      evidence: "Subsidy content contains guarantee-like wording.",
      pages: uniquePages(subsidyChunks.filter((chunk) => /garant/i.test(chunk.text))),
      reason: "A chatbot must not imply guaranteed subsidy approval without a verified source.",
    });
  }
  if (/ukoncene|minuli|nie\s+su\s+dostupne/i.test(text) && /vybavujeme|pomahame|dotacie/i.test(text)) {
    conflicts.push({
      type: "subsidy availability",
      severity: "medium",
      evidence: "Subsidy content contains both availability and unavailable/ended wording.",
      pages: uniquePages(subsidyChunks),
      reason: "This may be legitimate historic content, but needs source freshness control.",
    });
  }
  return conflicts;
}

export async function runKnowledgeContradictions(writeReportFile = true): Promise<ContradictionSummary> {
  const chunks = await loadKnowledge();
  const emailGroups = collectByPattern(chunks, /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi);
  const phoneGroupsRaw = collectByPattern(chunks, /(?:\+421\s*)?(?:0\s*)?\d{3}[\s.-]?\d{3}[\s.-]?\d{3}/g);
  const phones = new Map<string, KnowledgeChunk[]>();
  for (const [phone, phoneChunks] of phoneGroupsRaw) {
    const key = normalizePhone(phone);
    phones.set(key, [...(phones.get(key) || []), ...phoneChunks]);
  }
  const prices = collectByPattern(chunks, /\b\d{2,6}\s?(?:€|eur|euro)\b/gi);
  const years = collectByPattern(chunks, /\b20(?:1\d|2\d|3\d)\b/g);
  const serviceIntervals = collectByPattern(chunks, /raz\s+za\s+(?:rok|dva\s+roky)|kazdy\s+rok|rocne|2\s*roky/gi);

  const conflicts: SuspiciousConflict[] = [];
  const contactVariants = [...emailGroups.keys(), ...phones.keys()];
  if (emailGroups.size > 1 || phones.size > 1) {
    conflicts.push({
      type: "contact variants",
      severity: "medium",
      evidence: `emails=${emailGroups.size}, phones=${phones.size}`,
      pages: uniquePages([...emailGroups.values(), ...phones.values()].flat()),
      reason: "Multiple public contacts may be valid, but chatbot answers can become inconsistent without contact precedence rules.",
    });
  }
  if (prices.size > 8) {
    conflicts.push({
      type: "price claims",
      severity: "medium",
      evidence: `${prices.size} distinct price-like mentions detected.`,
      pages: uniquePages([...prices.values()].flat()),
      reason: "Price fragments can cause over-specific answers if retrieval returns outdated or contextless numbers.",
    });
  }
  if (years.size > 6) {
    conflicts.push({
      type: "time-sensitive content",
      severity: "medium",
      evidence: `${years.size} distinct year mentions detected.`,
      pages: uniquePages([...years.values()].flat()),
      reason: "Old and new year-specific content needs freshness metadata before production answering.",
    });
  }
  if (serviceIntervals.size > 1) {
    conflicts.push({
      type: "service interval variants",
      severity: "low",
      evidence: Array.from(serviceIntervals.keys()).join(", "),
      pages: uniquePages([...serviceIntervals.values()].flat()),
      reason: "Different maintenance interval wording may be valid by product, but should be qualified in answers.",
    });
  }
  conflicts.push(...detectServiceConflicts(chunks), ...detectSubsidyConflicts(chunks));

  const summary: ContradictionSummary = {
    chunksCount: chunks.length,
    suspectedConflicts: conflicts,
    contactVariants,
    priceMentions: prices.size,
    timeSensitiveMentions: years.size,
  };

  if (writeReportFile) {
    const report = [
      "# Knowledge Contradictions Report",
      "",
      "This is heuristic flagging only. It does not claim that a contradiction is real; it highlights content that should be manually checked before production use.",
      "",
      "## Summary",
      `- chunks scanned: ${summary.chunksCount}`,
      `- suspected conflicts: ${summary.suspectedConflicts.length}`,
      `- contact variants: ${summary.contactVariants.length}`,
      `- distinct price-like mentions: ${summary.priceMentions}`,
      `- distinct year mentions: ${summary.timeSensitiveMentions}`,
      "",
      "## Suspected Conflicts",
      summary.suspectedConflicts.length
        ? mdTable(
            ["severity", "type", "evidence", "reason", "pages"],
            summary.suspectedConflicts.map((item) => [
              item.severity,
              item.type,
              item.evidence,
              item.reason,
              item.pages.join("; "),
            ]),
          )
        : "No suspicious conflicts found by configured heuristics.",
      "",
      "## Production Risk",
      "- Price, subsidy and contact answers should be source-cited and conservative.",
      "- Time-sensitive chunks need active freshness/version checks before client deployment.",
      "- Third-party service scope is a likely human question and should be explicit in source content.",
    ].join("\n");
    await writeFile(reportPath, `${report}\n`, "utf8");
  }

  return summary;
}

if (require.main === module) {
  runKnowledgeContradictions()
    .then((summary) => {
      console.log(`Contradiction report written: ${reportPath}`);
      console.log(`Suspected conflicts: ${summary.suspectedConflicts.length}`);
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
