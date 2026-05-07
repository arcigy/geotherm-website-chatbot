import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type ExportSection = {
  heading?: string;
  level?: string;
  text?: string;
};

type ExportItem = {
  type?: string;
  id?: number;
  title?: string;
  slug?: string;
  url?: string;
  modified?: string;
  cleanText?: string;
  sections?: ExportSection[];
};

type KnowledgeChunk = {
  sourceType: string;
  sourceId: number;
  pageTitle: string;
  url: string;
  slug: string;
  modified: string;
  sectionHeading: string;
  chunkIndex: number;
  text: string;
  textLength: number;
};

const inputPath = path.join(process.cwd(), "knowledge", "wordpress-export.json");
const outputPath = path.join(process.cwd(), "knowledge", "chatbot-knowledge.json");
const reportPath = path.join(process.cwd(), "knowledge", "chatbot-knowledge-report.md");

const importantTitlePattern =
  /tepel|cerpad|čerpad|rekuper|vykurov|kuren|kúren|fotovol|dotac|dotác|servis|nibe|vaillant|drazice|dražice|rehau|zehnder|vrty|studne/i;
const boilerplateTitlePattern =
  /cookie|cookies|opt-out|privacy|sukrom|súkrom|gdpr|zásady používania súborov cookie|zasady pouzivania suborov cookie/i;

function normalizeWhitespace(value = ""): string {
  return value.replace(/\s+/g, " ").trim();
}

function stripShortcodes(value: string): string {
  return value
    .replace(/\[(\/)?(?:vc_|et_|fusion_|av_|wp_|elementor_|contact-form-7|rev_slider|slider|gallery)[^\]]*\]/gi, " ")
    .replace(/\[[a-z][a-z0-9_-]*(?:\s+[^\]]*)?\]\s*\[\/[a-z][a-z0-9_-]*\]/gi, " ")
    .replace(/\[\/?[a-z][a-z0-9_-]*(?:\s+[^\]]*)?\]/gi, " ");
}

function cleanText(value = ""): string {
  return normalizeWhitespace(
    stripShortcodes(value)
      .replace(/Prejsť na obsah|Prejsť na obsah stránky|Go to Top|Back to top/gi, " ")
      .replace(/Zdieľať tento článok|Share this post|Share on Facebook|Share on Twitter/gi, " ")
      .replace(/Navigácia|Menu|Hlavné menu|Footer|Sidebar/gi, " "),
  );
}

function splitSentences(value: string): string[] {
  return cleanText(value)
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => cleanText(sentence))
    .filter((sentence) => sentence.length >= 45 && sentence.length <= 260);
}

function repeatedBoilerplate(items: ExportItem[]): Set<string> {
  const counts = new Map<string, number>();
  const threshold = Math.max(6, Math.ceil(items.length * 0.04));

  for (const item of items) {
    const seen = new Set(splitSentences(item.cleanText || "").map((sentence) => sentence.toLowerCase()));
    for (const sentence of seen) counts.set(sentence, (counts.get(sentence) || 0) + 1);
  }

  return new Set(
    [...counts.entries()]
      .filter(([, count]) => count >= threshold)
      .map(([sentence]) => sentence),
  );
}

function removeRepeatedBoilerplate(value: string, repeated: Set<string>): string {
  if (!repeated.size) return cleanText(value);

  const sentences = cleanText(value).split(/(?<=[.!?])\s+/);
  return cleanText(sentences.filter((sentence) => !repeated.has(cleanText(sentence).toLowerCase())).join(" "));
}

function usefulLength(value: string): number {
  return cleanText(value).length;
}

function chunkSectionText(text: string): string[] {
  const pieces = text
    .split(/(?<=[.!?])\s+(?=[A-ZÁÄČĎÉÍĽĹŇÓÔŔŠŤÚÝŽ0-9])/)
    .map(cleanText)
    .filter(Boolean);
  const paragraphs: string[] = [];

  for (const piece of pieces) {
    if (piece.length <= 1450) {
      paragraphs.push(piece);
      continue;
    }

    const words = piece.split(/\s+/);
    let current = "";
    for (const word of words) {
      const next = cleanText(`${current} ${word}`);
      if (next.length > 1450 && current) {
        paragraphs.push(current);
        current = word;
      } else {
        current = next;
      }
    }
    if (current) paragraphs.push(current);
  }

  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    if (!current) {
      current = paragraph;
      continue;
    }

    const next = cleanText(`${current} ${paragraph}`);
    if (next.length > 1500 && current.length >= 800) {
      chunks.push(current);
      current = paragraph;
    } else if (next.length > 1500) {
      chunks.push(next.slice(0, 1500).trim());
      current = next.slice(1500).trim();
    } else {
      current = next;
    }
  }

  if (current) chunks.push(current);

  const merged: string[] = [];
  for (const chunk of chunks) {
    const previous = merged[merged.length - 1];
    if (previous && previous.length < 800 && previous.length + chunk.length + 1 <= 1500) {
      merged[merged.length - 1] = cleanText(`${previous} ${chunk}`);
    } else {
      merged.push(chunk);
    }
  }

  return merged.filter((chunk) => chunk.length >= 120);
}

function fingerprint(value: string): string {
  return cleanText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(a|an|the|v|vo|na|sa|je|su|sú|až|pre|pri|do|od|za|so|bez|ako)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isNearDuplicate(value: string, seen: Set<string>): boolean {
  const exact = fingerprint(value);
  const compact = exact.split(" ").slice(0, 120).join(" ");
  const prefix = exact.slice(0, 500);

  if (seen.has(exact) || seen.has(compact) || seen.has(prefix)) return true;

  seen.add(exact);
  seen.add(compact);
  seen.add(prefix);
  return false;
}

function sectionsForItem(item: ExportItem, repeated: Set<string>): Array<{ heading: string; text: string }> {
  const sections = Array.isArray(item.sections) ? item.sections : [];
  const cleanedSections = sections
    .map((section) => ({
      heading: cleanText(section.heading || item.title || "Content"),
      text: removeRepeatedBoilerplate(section.text || "", repeated),
    }))
    .filter((section) => usefulLength(section.text) >= 120);

  if (cleanedSections.length) return cleanedSections;

  return [
    {
      heading: cleanText(item.title || "Content"),
      text: removeRepeatedBoilerplate(item.cleanText || "", repeated),
    },
  ].filter((section) => usefulLength(section.text) >= 120);
}

function markdownTable(headers: string[], rows: Array<Array<string | number>>): string {
  const escapeCell = (value: string | number): string => String(value).replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(escapeCell).join(" | ")} |`),
  ].join("\n");
}

async function main(): Promise<void> {
  const items = JSON.parse(await readFile(inputPath, "utf8")) as ExportItem[];
  const repeated = repeatedBoilerplate(items);
  const seenFingerprints = new Set<string>();
  const chunks: KnowledgeChunk[] = [];
  const warnings: string[] = [];
  let excludedEmpty = 0;
  let excludedThin = 0;
  let excludedBoilerplate = 0;
  let deduplicatedChunks = 0;

  for (const item of items) {
    const title = cleanText(item.title || "");
    const cleanItemText = cleanText(item.cleanText || "");
    const titleLooksImportant = importantTitlePattern.test(`${title} ${item.slug || ""} ${item.url || ""}`);
    const looksBoilerplate = boilerplateTitlePattern.test(`${title} ${item.slug || ""} ${item.url || ""}`);

    if (!cleanItemText) {
      excludedEmpty += 1;
      continue;
    }

    if (looksBoilerplate && !titleLooksImportant) {
      excludedBoilerplate += 1;
      continue;
    }

    if (usefulLength(cleanItemText) < 300 && !titleLooksImportant) {
      excludedThin += 1;
      continue;
    }

    let chunkIndex = 0;
    for (const section of sectionsForItem(item, repeated)) {
      for (const text of chunkSectionText(section.text)) {
        if (usefulLength(text) < 300 && !(titleLooksImportant && usefulLength(cleanItemText) < 300)) continue;
        if (isNearDuplicate(text, seenFingerprints)) {
          deduplicatedChunks += 1;
          continue;
        }

        chunkIndex += 1;
        chunks.push({
          sourceType: item.type || "unknown",
          sourceId: item.id || 0,
          pageTitle: title,
          url: item.url || "",
          slug: item.slug || "",
          modified: item.modified || "",
          sectionHeading: section.heading,
          chunkIndex,
          text,
          textLength: text.length,
        });
      }
    }
  }

  if (!chunks.length) warnings.push("No chunks were created.");
  if (excludedBoilerplate > 0) warnings.push(`${excludedBoilerplate} cookie/privacy/boilerplate-like items were excluded.`);
  if (repeated.size > 0) warnings.push(`${repeated.size} repeated sentence-level boilerplate candidates were removed before chunking.`);
  if (chunks.some((chunk) => chunk.textLength > 1500)) warnings.push("Some chunks are over 1,500 characters because long source sentences could not be split cleanly.");

  const chunkCounts = new Map<string, { title: string; url: string; count: number }>();
  for (const chunk of chunks) {
    const key = `${chunk.sourceType}:${chunk.sourceId}`;
    const existing = chunkCounts.get(key) || { title: chunk.pageTitle, url: chunk.url, count: 0 };
    existing.count += 1;
    chunkCounts.set(key, existing);
  }
  const topPages = [...chunkCounts.values()].sort((a, b) => b.count - a.count || a.title.localeCompare(b.title)).slice(0, 20);
  const avgChunkLength = chunks.length
    ? Math.round(chunks.reduce((sum, chunk) => sum + chunk.textLength, 0) / chunks.length)
    : 0;
  const verdict = chunks.length > 0 && excludedEmpty < items.length && avgChunkLength >= 500
    ? "Ready for local retrieval testing. Review exclusions and spot-check chunks before production use."
    : "Not ready for retrieval testing. The generated chunk set is too small or too thin.";

  const report = [
    "# Chatbot Knowledge Build Report",
    "",
    `Input: \`knowledge/wordpress-export.json\``,
    `Output: \`knowledge/chatbot-knowledge.json\``,
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Summary",
    "",
    markdownTable(["Metric", "Value"], [
      ["Input items count", items.length],
      ["Output chunks count", chunks.length],
      ["Excluded empty items", excludedEmpty],
      ["Excluded thin items", excludedThin],
      ["Excluded boilerplate/cookie-like items", excludedBoilerplate],
      ["Deduplicated chunks", deduplicatedChunks],
      ["Average chunk length", `${avgChunkLength} characters`],
      ["Repeated boilerplate sentences removed", repeated.size],
    ]),
    "",
    "## Top Pages by Chunk Count",
    "",
    topPages.length
      ? markdownTable(["Page title", "Chunks", "URL"], topPages.map((page) => [page.title, page.count, page.url]))
      : "No chunks generated.",
    "",
    "## Warnings",
    "",
    warnings.length ? warnings.map((warning) => `- ${warning}`).join("\n") : "None.",
    "",
    "## Verdict",
    "",
    verdict,
    "",
  ].join("\n");

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(chunks, null, 2)}\n`, "utf8");
  await writeFile(reportPath, report, "utf8");

  console.log(`Built ${chunks.length} chunks from ${items.length} items.`);
  console.log(`Saved ${outputPath}`);
  console.log(`Saved ${reportPath}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Knowledge build failed: ${message}`);
  process.exitCode = 1;
});
