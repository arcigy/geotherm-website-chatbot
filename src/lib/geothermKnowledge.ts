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

type ChunkMatch = {
  page: KnowledgePage;
  chunk: KnowledgeChunk;
  score: number;
};

type ImageIntent = {
  match: string[];
  allow: string[];
  requireImageText: boolean;
};

export type RetrievedKnowledge = {
  context: string;
  images: KnowledgeImage[];
  sources: Array<Pick<KnowledgePage, "url" | "title">>;
};

const pages = knowledge.pages as KnowledgePage[];

const genericImagePattern =
  /logo|avatar|gravatar|sport|armwrestling|sutaz|lego|malovanka|nadej|svetielko|autor|author|coneco|racioenergia|aurel|stodola|simon-podpora/i;

const imageIntents: ImageIntent[] = [
  {
    match: ["fotovolt", "fve", "solar", "solarne", "solarny", "panely", "panel"],
    allow: ["fotovolt", "fve", "solar", "solarne", "solarny", "panel", "panely", "kolektor"],
    requireImageText: true,
  },
  {
    match: ["multimatic", "red dot", "red-dot"],
    allow: ["multimatic", "red dot", "red-dot"],
    requireImageText: true,
  },
  {
    match: ["e-shop", "e-shopu", "eshop", "shop"],
    allow: ["e-shop", "eshop", "kvapalina", "kvapaliny", "filter", "rekuperacie", "produkt"],
    requireImageText: false,
  },
  {
    match: ["rekuperacia", "vetranie", "zehnder", "recovair"],
    allow: ["rekuper", "vetranie", "zehnder", "recovair", "ventil"],
    requireImageText: true,
  },
  {
    match: ["nibe"],
    allow: ["nibe"],
    requireImageText: true,
  },
  {
    match: ["daikin", "altherma"],
    allow: ["daikin", "altherma"],
    requireImageText: true,
  },
  {
    match: ["viessmann", "vitocal"],
    allow: ["viessmann", "vitocal"],
    requireImageText: true,
  },
  {
    match: ["vaillant"],
    allow: ["vaillant", "aro", "flexotherm", "flexocompact", "recovair", "multimatic"],
    requireImageText: true,
  },
];

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
  "geotherm",
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
  "obrazok",
  "som",
  "tak",
  "tam",
  "ten",
  "toto",
  "treba",
  "ukaz",
  "vas",
  "viem",
  "viac",
]);

const synonymGroups = [
  ["tc", "tepelne", "cerpadlo", "čerpadlo", "vzduch", "voda"],
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

function safeDecodeUrl(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function imageIntentFor(query: string) {
  const normalized = normalize(query);

  return imageIntents.find((intent) => intent.match.map(normalize).some((token) => normalized.includes(token)));
}

function tokensFrom(value: string) {
  const baseTokens = normalize(value)
    .split(/\s+/)
    .filter((token) => token.length > 2)
    .filter((token) => !stopWords.has(token));
  const expanded = new Set(baseTokens);

  for (const token of baseTokens) {
    if (token.includes("shop")) {
      expanded.add("e-shop");
      expanded.add("eshop");
    }

    if (token === "aplikacie") {
      expanded.add("aplikacia");
    }

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
  const archivePenalty = /(^|\/)(blog|category|tag)\//i.test(page.slug) || /arch/i.test(normalize(page.title)) ? 4 : 0;

  return (
    tokenScore(page.title, tokens, 10) +
    tokenScore(page.tags.join(" "), tokens, 8) +
    tokenScore(page.headings.join(" "), tokens, 5) +
    tokenScore(page.description, tokens, 4) +
    tokenScore(chunk.content, tokens, 1) -
    archivePenalty
  );
}

function scoreImage(image: KnowledgeImage, page: KnowledgePage, tokens: string[]) {
  const imageHaystack = `${image.alt} ${safeDecodeUrl(image.url)}`;
  const genericPenalty = genericImagePattern.test(imageHaystack) ? 18 : 0;
  const dimensionBonus = image.width && image.width >= 400 ? 3 : 0;

  return (
    tokenScore(image.alt, tokens, 16) +
    tokenScore(image.url, tokens, 7) +
    tokenScore(page.title, tokens, 2) +
    tokenScore(page.tags.join(" "), tokens, 3) +
    dimensionBonus -
    genericPenalty
  );
}

function imageMatchesIntent(image: KnowledgeImage, page: KnowledgePage, intent?: ImageIntent) {
  if (!intent) return true;

  const allow = intent.allow.map(normalize);
  const imageText = normalize(`${image.alt} ${safeDecodeUrl(image.url)}`);
  const pageText = normalize(`${page.title} ${page.slug} ${page.tags.join(" ")} ${page.headings.join(" ")}`);

  if (intent.requireImageText) {
    return allow.some((token) => imageText.includes(token));
  }

  return allow.some((token) => imageText.includes(token) || pageText.includes(token));
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

function selectImages(matches: ChunkMatch[], tokens: string[], query: string) {
  const intent = imageIntentFor(query);
  const candidates = matches.flatMap(({ page, score: pageScore }, matchIndex) =>
    page.images.map((image, imageIndex) => ({
      image,
      page,
      score: scoreImage(image, page, tokens) + Math.max(0, 9 - matchIndex) + pageScore * 0.08 - imageIndex * 0.35,
    })),
  );

  return uniqueImages(
    candidates
      .filter(({ image, page, score }) => imageMatchesIntent(image, page, intent) && score >= (intent ? 4 : 8))
      .sort((a, b) => b.score - a.score)
      .map(({ image }) => image),
  ).slice(0, 5);
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
  const images = selectImages(selectedMatches, tokens, query);
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
