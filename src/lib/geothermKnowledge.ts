import knowledge from "@/data/geotherm-knowledge.json";

type KnowledgeImage = {
  url: string;
  alt: string;
  width?: number;
  height?: number;
};

type KnowledgeChunk = {
  id: string;
  content: string;
};

type KnowledgePage = {
  url: string;
  slug: string;
  title: string;
  description: string;
  headings: string[];
  tags: string[];
  text: string;
  chunks: KnowledgeChunk[];
  images: KnowledgeImage[];
};

export type RetrievedKnowledge = {
  context: string;
  images: KnowledgeImage[];
  sources: Array<Pick<KnowledgePage, "url" | "title">>;
};

const pages = knowledge.pages as KnowledgePage[];

const stopWords = new Set([
  "ako",
  "ale",
  "bez",
  "bol",
  "bola",
  "boli",
  "bude",
  "chcem",
  "dajte",
  "dom",
  "este",
  "jeho",
  "ked",
  "ktore",
  "lebo",
  "mam",
  "mat",
  "mozno",
  "nam",
  "pre",
  "pri",
  "som",
  "tak",
  "tam",
  "ten",
  "toto",
  "treba",
  "vas",
  "viem",
  "viac",
]);

const synonymGroups = [
  ["tc", "tepelne", "cerpadlo", "čerpadlo", "vzduch", "voda", "nibe", "vaillant", "vitocal", "altherma"],
  ["rekuperacia", "rekuperácia", "vetranie", "vzduch", "zehnder", "recovair"],
  ["fotovoltaika", "fve", "panely", "solarne", "solárne", "elektrina"],
  ["dotacie", "dotácie", "zelena", "zelená", "domacnostiam", "poukaz"],
  ["podlahove", "podlahové", "vykurovanie", "kurenie", "podlahovka"],
  ["stropne", "stropné", "chladenie", "stenove", "stenové"],
  ["servis", "montaz", "montáž", "instalacia", "inštalácia"],
];

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s/-]/g, " ");
}

function tokensFrom(value: string) {
  const baseTokens = normalize(value)
    .split(/\s+/)
    .filter((token) => token.length > 2)
    .filter((token) => !stopWords.has(token));
  const expanded = new Set(baseTokens);

  for (const token of baseTokens) {
    for (const group of synonymGroups) {
      if (group.map(normalize).includes(token)) {
        group.map(normalize).forEach((synonym) => expanded.add(synonym));
      }
    }
  }

  return [...expanded];
}

function tokenScore(value: string, tokens: string[], weight: number) {
  const normalized = normalize(value);
  return tokens.reduce((score, token) => (normalized.includes(token) ? score + weight : score), 0);
}

function scoreChunk(page: KnowledgePage, chunk: KnowledgeChunk, tokens: string[]) {
  return (
    tokenScore(page.title, tokens, 10) +
    tokenScore(page.tags.join(" "), tokens, 8) +
    tokenScore(page.headings.join(" "), tokens, 5) +
    tokenScore(page.description, tokens, 4) +
    tokenScore(chunk.content, tokens, 1)
  );
}

function scoreImage(image: KnowledgeImage, page: KnowledgePage, tokens: string[]) {
  return (
    tokenScore(image.alt, tokens, 10) +
    tokenScore(image.url, tokens, 4) +
    tokenScore(page.title, tokens, 3) +
    tokenScore(page.tags.join(" "), tokens, 3)
  );
}

function compactChunk(value: string) {
  return value.length > 1050 ? `${value.slice(0, 1050).trim()}...` : value;
}

function uniqueImages(images: KnowledgeImage[]) {
  const seen = new Set<string>();
  return images.filter((image) => {
    if (seen.has(image.url)) return false;
    seen.add(image.url);
    return true;
  });
}

export function getRelevantGeothermKnowledge(query: string): RetrievedKnowledge {
  if (!pages.length) {
    return {
      context: "Knowledge base zo stránky GEOTHERM ešte nebola naplnená.",
      images: [],
      sources: [],
    };
  }

  const tokens = tokensFrom(query);
  const chunkMatches = pages
    .flatMap((page) =>
      page.chunks.map((chunk) => ({
        page,
        chunk,
        score: tokens.length ? scoreChunk(page, chunk, tokens) : 1,
      })),
    )
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
  const selectedMatches = chunkMatches.length
    ? chunkMatches
    : pages.slice(0, 5).flatMap((page) => page.chunks.slice(0, 1).map((chunk) => ({ page, chunk, score: 1 })));
  const selectedPages = selectedMatches.map(({ page }) => page);
  const images = uniqueImages(
    selectedPages
      .flatMap((page) =>
        page.images.map((image) => ({
          image,
          score: tokens.length ? scoreImage(image, page, tokens) : 1,
        })),
      )
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ image }) => image),
  ).slice(0, 4);
  const sources = selectedPages
    .filter((page, index, values) => values.findIndex((candidate) => candidate.url === page.url) === index)
    .slice(0, 5)
    .map(({ url, title }) => ({ url, title }));
  const context = selectedMatches
    .map(({ page, chunk }, index) => {
      const imageList = page.images
        .slice(0, 3)
        .map((image) => `- ${image.alt}: ${image.url}`)
        .join("\n");

      return [
        `ZDROJ ${index + 1}`,
        `URL: ${page.url}`,
        `Názov: ${page.title}`,
        page.description ? `Popis: ${page.description}` : "",
        page.tags?.length ? `Témy: ${page.tags.join(", ")}` : "",
        page.headings?.length ? `Sekcie: ${page.headings.slice(0, 8).join(" | ")}` : "",
        `Relevantná pasáž: ${compactChunk(chunk.content)}`,
        imageList ? `Obrázky zo zdroja:\n${imageList}` : "",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n---\n\n")
    .slice(0, 11000);

  return { context, images, sources };
}

export function getRelevantGeothermContext(query: string) {
  return getRelevantGeothermKnowledge(query).context;
}
