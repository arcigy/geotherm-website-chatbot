import knowledge from "@/data/geotherm-knowledge.json";

type KnowledgePage = {
  url: string;
  title: string;
  description: string;
  headings: string[];
  text: string;
};

const pages = knowledge.pages as KnowledgePage[];

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s]/g, " ");
}

function tokensFrom(value: string) {
  return [...new Set(normalize(value).split(/\s+/).filter((token) => token.length > 2))];
}

function scorePage(page: KnowledgePage, tokens: string[]) {
  const title = normalize(page.title);
  const description = normalize(page.description);
  const headings = normalize(page.headings.join(" "));
  const text = normalize(page.text);

  return tokens.reduce((score, token) => {
    if (title.includes(token)) score += 8;
    if (headings.includes(token)) score += 5;
    if (description.includes(token)) score += 4;
    if (text.includes(token)) score += 1;
    return score;
  }, 0);
}

function pageSnippet(page: KnowledgePage, tokens: string[]) {
  const normalizedText = normalize(page.text);
  const hitIndex = tokens
    .map((token) => normalizedText.indexOf(token))
    .filter((index) => index >= 0)
    .sort((a, b) => a - b)[0];

  const start = Math.max(0, (hitIndex ?? 0) - 450);
  return page.text.slice(start, start + 1450).trim();
}

export function getRelevantGeothermContext(query: string) {
  if (!pages.length) {
    return "Knowledge base zo stránky GEOTHERM ešte nebola naplnená.";
  }

  const tokens = tokensFrom(query);
  const rankedPages = pages
    .map((page) => ({ page, score: tokens.length ? scorePage(page, tokens) : 1 }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  const selectedPages = rankedPages.length ? rankedPages : pages.slice(0, 4).map((page) => ({ page, score: 1 }));

  return selectedPages
    .map(({ page }) => {
      const headings = page.headings.slice(0, 8).join(" | ");
      const snippet = pageSnippet(page, tokens);

      return [
        `URL: ${page.url}`,
        `Názov: ${page.title}`,
        page.description ? `Popis: ${page.description}` : "",
        headings ? `Sekcie: ${headings}` : "",
        `Obsah: ${snippet}`,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n---\n\n")
    .slice(0, 9000);
}
