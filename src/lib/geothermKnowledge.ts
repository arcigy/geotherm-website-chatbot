import knowledge from "@/data/geotherm-knowledge.json";
import type { RetrievedKnowledgeChunk } from "./geothermTypes";

type KnowledgeImage = {
  url: string;
  alt: string;
  width?: number;
  height?: number;
};

export type RetrievedImage = KnowledgeImage & {
  description: string;
  useWhen: string;
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
  images: RetrievedImage[];
  sources: Array<Pick<KnowledgePage, "url" | "title">>;
  chunks: RetrievedKnowledgeChunk[];
};

export type KnowledgeInspectionImage = RetrievedImage & {
  sourceTitle: string;
  sourceUrl: string;
  tags: string[];
};

const pages = knowledge.pages as KnowledgePage[];

const genericImagePattern =
  /logo|avatar|gravatar|sport|armwrestling|sutaz|lego|malovanka|nadej|svetielko|autor|author|coneco|racioenergia|aurel|stodola|simon-podpora|pf-|diplom|skolenie|vyroba/i;

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
    match: ["aplikac", "ovladat", "smart", "showpoint"],
    allow: ["aplikac", "app", "multimatic", "showpoint"],
    requireImageText: true,
  },
  {
    match: ["dotaci", "dotacie", "dotacia", "poukaz", "oze", "zelena"],
    allow: ["dotac", "oze", "zelena", "poukaz"],
    requireImageText: true,
  },
  {
    match: ["montaz", "montazi", "instalacia", "instalacii", "servis"],
    allow: ["montaz", "instal", "servis", "tepelne", "cerpadlo", "vykurovanie"],
    requireImageText: true,
  },
  {
    match: ["e-shop", "e-shopu", "eshop", "shop"],
    allow: ["e-shop", "eshop", "kvapalina", "kvapaliny", "filter", "rekuperacie", "produkt"],
    requireImageText: false,
  },
  {
    match: ["rekuperacia", "vetranie", "zehnder", "recovair", "comfoair", "comfotube", "comfowell"],
    allow: ["rekuper", "vetranie", "zehnder", "recovair", "comfoair", "comfotube", "comfowell", "ventil"],
    requireImageText: true,
  },
  {
    match: ["stropne", "stropné", "chladenie", "railfix", "rehau"],
    allow: ["strop", "chladen", "railfix", "rehau"],
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
  {
    match: ["hoval", "thermalia", "ultrasource"],
    allow: ["hoval", "thermalia", "ultrasource"],
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
  ["stropne", "stropné", "chladenie", "strop"],
  ["stenove", "stenové", "stena"],
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

    if (token.startsWith("aplikac") || token === "ovladat") {
      ["aplikacia", "app", "multimatic", "showpoint"].forEach((synonym) => expanded.add(synonym));
    }

    if (["naklady", "prevadzkove", "uspora", "uspory", "setrit", "energia", "energie"].includes(token)) {
      ["tepelne", "cerpadlo", "rekuperacia", "vykurovanie"].forEach((synonym) => expanded.add(synonym));
    }

    if (token.startsWith("montaz") || token.startsWith("instal")) {
      ["montaz", "instalacia", "servis", "tepelne", "cerpadlo", "vykurovanie"].forEach((synonym) =>
        expanded.add(synonym),
      );
    }

    if (["odporucanie", "odporucit", "rychle", "riesenie", "riesenia"].includes(token)) {
      ["tepelne", "cerpadlo", "rekuperacia", "podlahove", "vykurovanie"].forEach((synonym) => expanded.add(synonym));
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
  const haystack = normalize(`${page.url} ${page.title} ${page.headings.join(" ")} ${chunk.content}`);
  const exactProductBoost =
    (tokens.includes("comfoair") && haystack.includes("comfoair q") ? 70 : 0) +
    (tokens.includes("railfix") && haystack.includes("railfix") ? 60 : 0) +
    (tokens.includes("s2125") && haystack.includes("s2125") ? 60 : 0) +
    (tokens.includes("f2120") && haystack.includes("f2120") ? 60 : 0) +
    (tokens.includes("arotherm") && haystack.includes("arotherm plus") ? 45 : 0) +
    (tokens.includes("recovair") && haystack.includes("recovair") ? 45 : 0) +
    (tokens.includes("ivt") && haystack.includes("ivt air x") ? 55 : 0) +
    (tokens.includes("wpl") && haystack.includes("wpl") ? 45 : 0);

  return (
    tokenScore(page.title, tokens, 10) +
    tokenScore(page.tags.join(" "), tokens, 8) +
    tokenScore(page.headings.join(" "), tokens, 5) +
    tokenScore(page.description, tokens, 4) +
    tokenScore(chunk.content, tokens, 1) +
    exactProductBoost -
    archivePenalty
  );
}

function scoreImage(image: KnowledgeImage, page: KnowledgePage, tokens: string[]) {
  const imageHaystack = `${image.alt} ${safeDecodeUrl(image.url)}`;
  const genericPenalty = genericImagePattern.test(imageHaystack) ? 18 : 0;
  const dotationPenalty =
    /dotac|oze|zelena|poukaz/i.test(imageHaystack) && !tokens.some((token) => /dotac|oze|zelena|poukaz/.test(token))
      ? 12
      : 0;
  const dimensionBonus = image.width && image.width >= 400 ? 3 : 0;

  return (
    tokenScore(image.alt, tokens, 16) +
    tokenScore(image.url, tokens, 7) +
    tokenScore(page.title, tokens, 2) +
    tokenScore(page.tags.join(" "), tokens, 3) +
    dimensionBonus -
    genericPenalty -
    dotationPenalty
  );
}

function imageMatchesIntent(image: KnowledgeImage, page: KnowledgePage, intent?: ImageIntent) {
  if (genericImagePattern.test(`${image.alt} ${safeDecodeUrl(image.url)}`)) return false;
  if (image.width && image.height && image.width / image.height > 2.35) return false;
  if (!intent) return true;

  const allow = intent.allow.map(normalize);
  const imageText = normalize(`${image.alt} ${safeDecodeUrl(image.url)}`);
  const pageText = normalize(`${page.title} ${page.slug} ${page.tags.join(" ")} ${page.headings.join(" ")}`);

  if (intent.requireImageText) {
    return allow.some((token) => imageText.includes(token));
  }

  return allow.some((token) => imageText.includes(token) || pageText.includes(token));
}

function describeImage(image: KnowledgeImage, page?: KnowledgePage): Pick<RetrievedImage, "description" | "useWhen"> {
  const imageText = normalize(`${image.alt} ${safeDecodeUrl(image.url)}`);
  const pageText = normalize(`${page?.title ?? ""} ${page?.tags.join(" ") ?? ""}`);
  const haystack = `${imageText} ${pageText}`;

  if (haystack.includes("multimatic") || haystack.includes("red dot")) {
    return {
      description: "obrazovka/aplikácia Vaillant multiMATIC na inteligentné ovládanie systému",
      useWhen: "použi pri otázkach na multiMATIC, aplikáciu, reguláciu alebo smart ovládanie Vaillant",
    };
  }

  if (imageText.includes("stiebel")) {
    return {
      description: "produktový obrázok tepelného čerpadla Stiebel Eltron",
      useWhen: "použi pri otázkach na značku Stiebel Eltron alebo typy tepelných čerpadiel",
    };
  }

  if (imageText.includes("comfoair") || imageText.includes("q350")) {
    return {
      description: "rekuperačná jednotka Zehnder ComfoAir Q350",
      useWhen: "použi pri otázkach na Zehnder ComfoAir Q, centrálnu rekuperáciu alebo riadené vetranie",
    };
  }

  if (imageText.includes("hlucnost") && imageText.includes("nibe")) {
    return {
      description: "vizuál k tichej prevádzke tepelného čerpadla NIBE",
      useWhen: "použi pri otázkach na NIBE, hlučnosť alebo tiché tepelné čerpadlá",
    };
  }

  if (imageText.includes("nibe")) {
    return {
      description: "tepelné čerpadlo alebo produktová vizualizácia značky NIBE",
      useWhen: "použi pri otázkach na NIBE, švédske tepelné čerpadlá alebo porovnanie značiek",
    };
  }

  if (imageText.includes("hoval") || imageText.includes("thermalia") || imageText.includes("ultrasource")) {
    return {
      description: "produktový alebo výrobný obrázok tepelných čerpadiel Hoval",
      useWhen: "použi pri otázkach na značku Hoval, Thermalia, UltraSource alebo rozšírenie výroby tepelných čerpadiel",
    };
  }

  if (imageText.includes("rekuper") || imageText.includes("zehnder") || imageText.includes("recovair")) {
    return {
      description: "rekuperačná jednotka, vetranie alebo filter pre riadené vetranie",
      useWhen: "použi pri otázkach na rekuperáciu, vetranie, Zehnder, recoVAIR alebo filtre",
    };
  }

  if (imageText.includes("vaillant") || imageText.includes("arotherm") || imageText.includes("flexotherm")) {
    return {
      description: "tepelné čerpadlo alebo riešenie značky Vaillant",
      useWhen: "použi pri otázkach na Vaillant, aroTHERM, flexoTHERM alebo porovnanie značiek",
    };
  }

  if (imageText.includes("tepelne") || imageText.includes("cerpadlo")) {
    return {
      description: "tepelné čerpadlo alebo riešenie pre vykurovanie domu",
      useWhen: "použi pri otázkach na tepelné čerpadlá, vykurovanie, teplú vodu alebo typy riešení",
    };
  }

  if (imageText.includes("podlah")) {
    return {
      description: "podlahové kúrenie alebo rozvody nízkoteplotného vykurovania",
      useWhen: "použi pri otázkach na podlahové vykurovanie, komfort a nízkoteplotné systémy",
    };
  }

  if (imageText.includes("railfix") || (imageText.includes("rehau") && imageText.includes("strop"))) {
    return {
      description: "stropné chladenie REHAU RAILFIX pri montáži v interiéri",
      useWhen: "použi pri otázkach na stropné chladenie, REHAU RAILFIX, suchú montáž alebo chladenie bez klimatizácie",
    };
  }

  if (imageText.includes("strop") || imageText.includes("stenov") || imageText.includes("chladen")) {
    return {
      description: "stropné alebo stenové vykurovanie/chladenie",
      useWhen: "použi pri otázkach na chladenie, stenové vykurovanie alebo kombináciu vykurovania a chladenia",
    };
  }

  if (imageText.includes("dotac") || imageText.includes("oze") || imageText.includes("zelena")) {
    return {
      description: "vizuál k dotáciám OZE alebo programu Zelená domácnostiam",
      useWhen: "použi pri otázkach na dotácie, poukážky a zníženie investičných nákladov",
    };
  }

  if (imageText.includes("solar") || imageText.includes("solarn") || imageText.includes("fotovolt")) {
    return {
      description: "solárne panely, fotovoltika alebo solárna technológia",
      useWhen: "použi pri otázkach na fotovoltiku, solárne panely a výrobu energie zo slnka",
    };
  }

  if (imageText.includes("kvapalin") || imageText.includes("filter") || imageText.includes("e-shop")) {
    return {
      description: "produkt z e-shopu, napríklad teplonosná kvapalina alebo filter",
      useWhen: "použi pri otázkach na e-shop, filtre, kvapaliny a servisné produkty",
    };
  }

  if (imageText.includes("servis") || imageText.includes("instal") || imageText.includes("montaz")) {
    return {
      description: "servis, montáž alebo inštalačná situácia technológie",
      useWhen: "použi pri otázkach na montáž, servis alebo realizáciu riešenia",
    };
  }

  return {
    description: page ? `obrázok k téme: ${page.title}` : "obrázok z knižnice GEOTHERM",
    useWhen: "použi iba vtedy, keď otázka priamo súvisí s touto témou",
  };
}

export function getGeothermImagesByUrl(urls: string[]): RetrievedImage[] {
  const wanted = new Set(urls);
  const found = pages.flatMap((page) =>
    page.images
      .filter((image) => wanted.has(image.url))
      .map((image) => ({
        ...image,
        ...describeImage(image, page),
      })),
  );

  const seen = new Set<string>();
  return found.filter((image) => {
    if (seen.has(image.url)) return false;
    seen.add(image.url);
    return true;
  });
}

export function getAllGeothermKnowledgeImages(): KnowledgeInspectionImage[] {
  const seen = new Set<string>();

  return pages
    .flatMap((page) =>
      page.images.map((image) => ({
        ...image,
        ...describeImage(image, page),
        sourceTitle: page.title,
        sourceUrl: page.url,
        tags: page.tags,
      })),
    )
    .filter((image) => {
      if (seen.has(image.url)) return false;
      seen.add(image.url);
      return true;
    })
    .sort((a, b) => `${a.sourceTitle} ${a.alt}`.localeCompare(`${b.sourceTitle} ${b.alt}`));
}

function compactChunk(value: string) {
  const cleaned = value
    .replace(/[A-ZÁÄČĎÉÍĹĽŇÓÔŔŠŤÚÝŽ][A-Za-zÁÄČĎÉÍĹĽŇÓÔŔŠŤÚÝŽáäčďéíĺľňóôŕšťúýž]+\s+[A-ZÁÄČĎÉÍĹĽŇÓÔŔŠŤÚÝŽ][A-Za-zÁÄČĎÉÍĹĽŇÓÔŔŠŤÚÝŽáäčďéíĺľňóôŕšťúýž]+20\d{2}-\d{2}-\d{2}T\S+/g, ". ")
    .replace(/GEOTHERM Slovakia s\.r\.o\.20\d{2}-\d{2}-\d{2}T\S+/g, ". ")
    .replace(/Zobraziť väčší obrázok/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned.length > 1050 ? `${cleaned.slice(0, 1050).trim()}...` : cleaned;
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
  const wantsDotation = tokens.some((token) => /dotac|oze|zelena|poukaz/.test(token));
  const candidates = matches.flatMap(({ page, score: pageScore }, matchIndex) =>
    page.images.map((image, imageIndex) => ({
      image,
      page,
      score: scoreImage(image, page, tokens) + Math.max(0, 9 - matchIndex) + pageScore * 0.08 - imageIndex * 0.35,
    })),
  );

  function filterCandidates(items: Array<{ image: KnowledgeImage; page: KnowledgePage; score: number }>, minimumScore: number) {
    return items
      .filter(({ image, page, score }) => {
        const imageText = `${image.alt} ${safeDecodeUrl(image.url)}`;
        const isDotationImage = /dotac|oze|zelena|poukaz/i.test(imageText);

        return (
          imageMatchesIntent(image, page, intent) &&
          (intent || !isDotationImage || wantsDotation) &&
          score >= minimumScore
        );
      })
      .sort((a, b) => b.score - a.score);
  }

  let selected = filterCandidates(candidates, intent ? 4 : 8);

  if (!selected.length && intent) {
    selected = filterCandidates(
      pages.flatMap((page) =>
        page.images.map((image, imageIndex) => ({
          image,
          page,
          score: scoreImage(image, page, tokens) + tokenScore(page.title, tokens, 2) - imageIndex * 0.25,
        })),
      ),
      3,
    );
  }

  return uniqueImages(selected.map(({ image }) => image))
    .slice(0, 5)
    .map((image) => {
      const page =
        selected.find((match) => match.image.url === image.url)?.page ??
        matches.find((match) => match.page.images.some((candidate) => candidate.url === image.url))?.page;
      return {
        ...image,
        ...describeImage(image, page ?? matches[0]?.page),
      };
    });
}

export function getRelevantGeothermKnowledge(query: string): RetrievedKnowledge {
  if (!pages.length) {
    return {
      context: "Knowledge base zo stránky GEOTHERM ešte nebola naplnená.",
      images: [],
      sources: [],
      chunks: [],
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
  const chunks = selectedMatches.map(({ page, chunk, score }) => ({
    id: chunk.id,
    pageUrl: page.url,
    pageTitle: page.title,
    score,
    content: compactChunk(chunk.content),
  }));
  const context = selectedMatches
    .map(({ page, chunk }, index) => {
      return [
        `ZDROJ ${index + 1}`,
        `URL: ${page.url}`,
        `Názov: ${page.title}`,
        page.description ? `Popis: ${page.description}` : "",
        page.tags?.length ? `Témy: ${page.tags.join(", ")}` : "",
        page.headings?.length ? `Sekcie: ${page.headings.slice(0, 8).join(" | ")}` : "",
        `Relevantná pasáž: ${compactChunk(chunk.content)}`,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n---\n\n")
    .slice(0, 11000);

  return { context, images, sources, chunks };
}

export function getRelevantGeothermContext(query: string) {
  return getRelevantGeothermKnowledge(query).context;
}
