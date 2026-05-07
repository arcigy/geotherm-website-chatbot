export type KnowledgeChunk = {
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

export type ScoreBreakdown = {
  titleScore: number;
  headingScore: number;
  textScore: number;
  phraseScore: number;
  synonymScore: number;
  urlScore: number;
  finalScore: number;
};

export type RetrievalResult = {
  chunk: KnowledgeChunk;
  score: ScoreBreakdown;
  confidence: "confident" | "uncertain" | "no_answer";
  snippet: string;
};

export type RetrievalResponse = {
  query: string;
  normalizedQuery: string;
  expandedTokens: string[];
  results: RetrievalResult[];
};

const stopwords = new Set([
  "a",
  "aby",
  "aj",
  "ako",
  "ake",
  "aka",
  "aky",
  "ak",
  "ale",
  "alebo",
  "ani",
  "asi",
  "az",
  "bez",
  "by",
  "bol",
  "bola",
  "boli",
  "bolo",
  "bude",
  "cez",
  "ci",
  "co",
  "do",
  "ho",
  "ich",
  "je",
  "ju",
  "k",
  "kam",
  "kde",
  "ked",
  "kedy",
  "kolko",
  "ma",
  "ktore",
  "ktory",
  "mate",
  "mi",
  "moj",
  "na",
  "nad",
  "nam",
  "napr",
  "nas",
  "ne",
  "o",
  "od",
  "pre",
  "pri",
  "ponukate",
  "prosim",
  "sa",
  "si",
  "som",
  "so",
  "su",
  "s",
  "tak",
  "to",
  "u",
  "uz",
  "v",
  "vam",
  "vas",
  "vo",
  "za",
  "ze",
]);

const synonymGroups = [
  ["hluk", "hlucnost", "hlucne", "hlučne", "tiche", "tichy", "ticha", "ticho"],
  ["cena", "cennik", "kolko", "stoji", "stat", "naklady", "rozpocet", "ponuka", "cenova", "cenovu"],
  ["dotacie", "dotacia", "prispevok", "poukazka", "podpora", "stat", "oze"],
  ["servis", "udrzba", "revizia", "kontrola", "prehliadka"],
  ["montaz", "instalacia", "realizacia", "osadenie", "zapojenie"],
  ["tepelne", "cerpadlo", "cerpadla", "heat", "pump"],
  ["podlahove", "kurenie", "vykurovanie", "podlahovka"],
  ["voda", "vzduch", "zem", "vrt", "vrty", "studna"],
  ["nibe"],
  ["viessmann"],
  ["vaillant"],
  ["ariston"],
  ["daikin"],
  ["fotovoltaika", "fotovoltika", "solarne", "panely"],
  ["kontakt", "kontaktovat", "kontaktujem", "kontaktuj", "najdem", "najst", "telefon", "tel", "email", "mail", "adresa", "showroom"],
  ["znacka", "znacky", "vyrobca", "vyrobcovia", "nibe", "vaillant"],
  ["navrh", "poradit", "projekt", "podorys", "informacie", "udaje"],
];

const synonymMap = new Map<string, Set<string>>();
for (const group of synonymGroups) {
  const normalized = group.flatMap((term) => tokenize(term));
  for (const term of normalized) synonymMap.set(term, new Set(normalized));
}

export function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ľ/g, "l")
    .replace(/ť/g, "t")
    .replace(/ď/g, "d")
    .replace(/ň/g, "n")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stemToken(token: string): string {
  if (token.length <= 5) return token;

  for (const suffix of ["ami", "och", "eho", "emu", "ymi", "ami", "ovou", "oveho", "iu", "ia", "ie", "ou", "om", "em", "mi", "ho", "mu", "ov", "ev", "a", "u", "e", "y", "i", "o"]) {
    if (token.endsWith(suffix) && token.length - suffix.length >= 5) {
      return token.slice(0, -suffix.length);
    }
  }

  return token;
}

export function tokenize(value: string): string[] {
  const tokens = normalize(value)
    .split(" ")
    .filter((token) => token.length >= 2 && !stopwords.has(token))
    .map(stemToken)
    .filter((token) => token.length >= 2 && !stopwords.has(token));
  return [...new Set(tokens)];
}

function expandTokens(tokens: string[]): string[] {
  const expanded = new Set(tokens);
  for (const token of tokens) {
    const synonyms = synonymMap.get(token);
    if (!synonyms) continue;
    for (const synonym of synonyms) expanded.add(synonym);
  }
  return [...expanded];
}

function countMatches(tokens: string[], fieldTokens: Set<string>): number {
  return tokens.reduce((sum, token) => sum + (fieldTokens.has(token) ? 1 : 0), 0);
}

function phraseVariants(query: string): string[] {
  const normalized = normalize(query);
  const tokens = tokenize(query);
  const phrases = new Set<string>();
  if (normalized.length >= 4) phrases.add(normalized);
  for (let size = Math.min(4, tokens.length); size >= 2; size -= 1) {
    for (let index = 0; index <= tokens.length - size; index += 1) {
      phrases.add(tokens.slice(index, index + size).join(" "));
    }
  }
  return [...phrases].filter((phrase) => phrase.length >= 5);
}

function scorePhrases(phrases: string[], title: string, heading: string, text: string): number {
  let score = 0;
  for (const phrase of phrases) {
    if (title.includes(phrase)) score += 28;
    if (heading.includes(phrase)) score += 22;
    if (text.includes(phrase)) score += phrase.split(" ").length >= 3 ? 14 : 7;
  }
  return score;
}

function confidence(finalScore: number): "confident" | "uncertain" | "no_answer" {
  if (finalScore >= 35) return "confident";
  if (finalScore >= 14) return "uncertain";
  return "no_answer";
}

function snippet(text: string, queryTokens: string[]): string {
  const normalizedText = normalize(text);
  let bestIndex = 0;
  for (const token of queryTokens) {
    const index = normalizedText.indexOf(token);
    if (index >= 0) {
      bestIndex = Math.max(0, index - 120);
      break;
    }
  }
  return text.slice(bestIndex, bestIndex + 700).replace(/\s+/g, " ").trim();
}

function chunkFingerprint(chunk: KnowledgeChunk): string {
  return normalize(chunk.text).split(" ").slice(0, 80).join(" ");
}

export function retrieveKnowledge(chunks: KnowledgeChunk[], query: string, limit = 5): RetrievalResponse {
  const queryTokens = tokenize(query);
  const expandedTokens = expandTokens(queryTokens);
  const phrases = phraseVariants(query);
  const querySet = new Set(expandedTokens);
  const priceIntent = ["cena", "cennik", "cenov", "ponuk", "naklad", "stoji"].some((token) => querySet.has(token));
  const noiseIntent = ["hluk", "hlucnost", "hlucn", "tich"].some((token) => querySet.has(token));
  const outOfDomainIntent = ["auto", "automobil", "hypotek", "pocasi", "pocas", "gulas", "futbal", "akci", "etf", "investovat", "praha"].some((token) =>
    querySet.has(token),
  );
  const scored: RetrievalResult[] = [];

  for (const chunk of chunks) {
    const normalizedTitle = normalize(chunk.pageTitle);
    const normalizedHeading = normalize(chunk.sectionHeading);
    const normalizedText = normalize(chunk.text);
    const normalizedUrl = normalize(`${chunk.url} ${chunk.slug}`);
    const titleTokens = new Set(tokenize(chunk.pageTitle));
    const headingTokens = new Set(tokenize(chunk.sectionHeading));
    const textTokens = new Set(tokenize(chunk.text));
    const urlTokens = new Set(tokenize(`${chunk.url} ${chunk.slug}`));

    const titleMatches = countMatches(queryTokens, titleTokens);
    const headingMatches = countMatches(queryTokens, headingTokens);
    const textMatches = countMatches(queryTokens, textTokens);
    const urlMatches = countMatches(queryTokens, urlTokens);
    const expandedMatches = Math.max(0, countMatches(expandedTokens, textTokens) - textMatches);
    const expandedTitleMatches = Math.max(0, countMatches(expandedTokens, titleTokens) - titleMatches);
    const expandedHeadingMatches = Math.max(0, countMatches(expandedTokens, headingTokens) - headingMatches);
    const expandedUrlMatches = Math.max(0, countMatches(expandedTokens, urlTokens) - urlMatches);
    const phraseScore = scorePhrases(phrases, normalizedTitle, normalizedHeading, normalizedText);
    const titleScore = titleMatches * 16;
    const headingScore = headingMatches * 12;
    const textScore = textMatches * 4;
    const urlScore = urlMatches * 3;
    const synonymScore = expandedTitleMatches * 9 + expandedHeadingMatches * 7 + expandedUrlMatches * 3 + expandedMatches * 2.5;
    const intentScore =
      (priceIntent && (normalizedUrl.includes("cenova ponuka") || normalizedTitle.includes("cenova ponuka") || normalizedHeading.includes("cenova ponuka")) ? 55 : 0) +
      (priceIntent && normalizedText.includes("cenovu ponuku") ? 22 : 0) +
      (noiseIntent && normalizedUrl.includes("vzduch voda") ? 28 : 0) +
      (querySet.has("navrh") && (normalizedTitle.includes("navrh") || normalizedHeading.includes("navrh")) ? 35 : 0) +
      (querySet.has("projekt") && normalizedText.includes("podorys") ? 28 : 0) +
      (querySet.has("znack") && (normalizedText.includes("nibe") || normalizedText.includes("vaillant")) ? 20 : 0);
    const outOfDomainPenalty = outOfDomainIntent ? 45 : 0;
    const densityBoost = queryTokens.length
      ? ((titleMatches + headingMatches + textMatches + urlMatches) / queryTokens.length) * 7
      : 0;
    const finalScore = Number(
      (titleScore + headingScore + textScore + urlScore + synonymScore + phraseScore + densityBoost + intentScore - outOfDomainPenalty).toFixed(2),
    );

    if (finalScore <= 0) continue;

    scored.push({
      chunk,
      score: {
        titleScore,
        headingScore,
        textScore,
        phraseScore,
        synonymScore,
        urlScore,
        finalScore,
      },
      confidence: confidence(finalScore),
      snippet: snippet(chunk.text, expandedTokens),
    });
  }

  scored.sort((a, b) => b.score.finalScore - a.score.finalScore || b.chunk.textLength - a.chunk.textLength);

  const diversified: RetrievalResult[] = [];
  const pageCounts = new Map<string, number>();
  const seenFingerprints = new Set<string>();
  for (const result of scored) {
    const pageKey = `${result.chunk.sourceType}:${result.chunk.sourceId}`;
    const currentPageCount = pageCounts.get(pageKey) || 0;
    const fingerprint = chunkFingerprint(result.chunk);
    if (currentPageCount >= 2) continue;
    if (seenFingerprints.has(fingerprint)) continue;
    pageCounts.set(pageKey, currentPageCount + 1);
    seenFingerprints.add(fingerprint);
    diversified.push(result);
    if (diversified.length >= limit) break;
  }

  return {
    query,
    normalizedQuery: normalize(query),
    expandedTokens,
    results: diversified,
  };
}
