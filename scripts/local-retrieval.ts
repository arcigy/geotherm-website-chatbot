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
  ["stropne", "strop", "stropny", "stropneho", "strpne", "strpnom", "stropnom"],
  ["chladenie", "chladit", "chladi", "chlad", "chladene", "klimatizacia"],
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
  ["huci", "hucia", "hucnost", "otravne", "hluk", "hlucnost"],
  ["vyjde", "cenovka", "cena", "kolko", "stoji"],
  ["serivs", "servisak", "oprava", "servis", "udrzba"],
  ["cerpadllo", "tepelko", "cerpadlo", "tepelne"],
  ["spotreba", "spotreb", "zere", "elektrina", "ucty", "naklady"],
  ["radiator", "radiatory", "podlahovka", "podlahove"],
  ["rekuperacia", "vetranie", "vzduch"],
  ["barak", "dom", "rodinny"],
  ["namontovat", "montaz", "instalacia"],
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
    .replace(/\bserivs\b/g, "servis")
    .replace(/\bservisak\b/g, "servis")
    .replace(/\b(cenou|ceny|cene|cenu)\b/g, "cena")
    .replace(/\bcerpadllo\b/g, "cerpadlo")
    .replace(/\btepelko\b/g, "tepelne cerpadlo")
    .replace(/\bcontact\b/g, "kontakt")
    .replace(/\bstrpne\b/g, "stropne")
    .replace(/\bstrpnom\b/g, "stropnom")
    .replace(/\bstrpny\b/g, "stropny")
    .replace(/\bhuci\b/g, "hluk")
    .replace(/\bhucia\b/g, "hluk")
    .replace(/\bhucnost\b/g, "hlucnost")
    .replace(/\bcenovka\b/g, "cena")
    .replace(/\bvyjde\b/g, "cena")
    .replace(/\bbarak\b/g, "dom")
    .replace(/\bchlsdenie\b/g, "chladenie")
    .replace(/\bchladnie\b/g, "chladenie")
    .replace(/\bklima\b/g, "klimatizacia")
    .replace(/\bvykurovnie\b/g, "vykurovanie")
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

function boilerplatePenalty(chunk: KnowledgeChunk, contactIntent: boolean): number {
  const haystack = normalize(`${chunk.pageTitle} ${chunk.sectionHeading} ${chunk.url} ${chunk.slug} ${chunk.text.slice(0, 900)}`);
  const isNoisePage =
    haystack.includes("sutaz") ||
    haystack.includes("lego") ||
    haystack.includes("centralne vysavac") ||
    haystack.includes("/author/") ||
    haystack.includes("geotherm sk author") ||
    haystack.includes("dakujeme") ||
    haystack.includes("vyberove konanie") ||
    haystack.includes("obchodny zastupca") ||
    haystack.includes("novy zavod") ||
    haystack.includes("postavi pri senici") ||
    haystack.includes("vyroba tepelnych cerpadiel") ||
    haystack.includes("vyroba tepelných cerpadiel") ||
    haystack.includes("simon") ||
    haystack.includes("sportovcovi") ||
    haystack.includes("inovato") ||
    haystack.includes("podcast");
  const isBoilerplate =
    haystack.includes("ochrana osobnych udajov") ||
    haystack.includes("zasady ochrany") ||
    haystack.includes("cookie") ||
    haystack.includes("gdpr") ||
    haystack.includes("obchodne podmienky") ||
    haystack.includes("formular") ||
    haystack.includes("footer") ||
    haystack.includes("menu");
  if (isNoisePage) return 95;
  if (!isBoilerplate) return 0;
  if (contactIntent && !haystack.includes("kontakt")) return 85;
  return contactIntent ? 18 : 85;
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
  const normalizedQuery = normalize(query);
  if (/^(oplati sa|co s tym)$/.test(normalizedQuery) || /\b(praha|prahe|bitcoin|etf|hypotek|akcie|akcii)\b/.test(normalizedQuery)) {
    return {
      query,
      normalizedQuery,
      expandedTokens,
      results: [],
    };
  }
  const priceIntent = ["cena", "cennik", "cenov", "ponuk", "naklad", "stoji", "rozpocet", "orientac"].some((token) => querySet.has(token));
  const noiseIntent = ["hluk", "hlucnost", "hlucn", "tich"].some((token) => querySet.has(token));
  const serviceIntent = ["servis", "porucha", "oprava", "udrzba", "diagnostik"].some((token) => querySet.has(token));
  const contactIntent = ["kontakt", "telefon", "email", "mail", "adresa"].some((token) => querySet.has(token));
  const referenceIntent = ["realizac", "referenc", "praxi"].some((term) => normalizedQuery.includes(term));
  const earthVsAirIntent = normalizedQuery.includes("zem voda") || normalizedQuery.includes("vzduch voda") || normalizedQuery.includes("pozemok");
  const consumptionIntent = ["spotreb", "zere", "elektrin", "uct", "naklad"].some((term) => normalizedQuery.includes(term));
  const radiatorIntent = normalizedQuery.includes("radiator");
  const floorHeatingIntent = ["podlahov", "podlahu", "podlahovka"].some((term) => normalizedQuery.includes(term));
  const rekuperationIntent = ["rekuper", "vetranie", "vydychany"].some((term) => normalizedQuery.includes(term));
  const ceilingCoolingIntent =
    (normalizedQuery.includes("strop") && (normalizedQuery.includes("chladen") || normalizedQuery.includes("chladi") || normalizedQuery.includes("klimatiz"))) ||
    (normalizedQuery.includes("temperovanie betonoveho jadra") && normalizedQuery.includes("chladen"));
  const ceilingBenefitsIntent = ceilingCoolingIntent && ["vyhod", "tich", "skryt", "prach", "prievan", "komfort", "prijem", "zdrav"].some((term) => normalizedQuery.includes(term));
  const ceilingComparisonIntent = ceilingCoolingIntent && ["klimatiz", "klim", "fuk", "pruden", "studen"].some((term) => normalizedQuery.includes(term));
  const ceilingDisadvantageIntent = ceilingCoolingIntent && ["nevyhod", "minus", "rizik", "problem", "pomal", "pozor", "drahs"].some((term) => normalizedQuery.includes(term));
  const ceilingPriceIntent = ceilingCoolingIntent && ["cena", "cen", "kolko", "stoji", "m2", "zahrn"].some((term) => normalizedQuery.includes(term));
  const ceilingCondensationIntent = ceilingCoolingIntent && ["kondenz", "vlhk", "rosn", "kvapka", "odborn", "navrhn"].some((term) => normalizedQuery.includes(term));
  const ceilingTypesIntent = ceilingCoolingIntent && ["typ", "druh", "system", "sadrokarton", "omiet", "beton", "temper"].some((term) => normalizedQuery.includes(term));
  const ceilingGenericTypesIntent = ceilingCoolingIntent && ["typ", "druh", "system"].some((term) => normalizedQuery.includes(term));
  const ceilingSadrokartonIntent = ceilingCoolingIntent && ["sadrokarton", "podhlad"].some((term) => normalizedQuery.includes(term));
  const ceilingOmietkaIntent = ceilingCoolingIntent && normalizedQuery.includes("omiet");
  const ceilingBetonIntent = ceilingCoolingIntent && ["beton", "temper"].some((term) => normalizedQuery.includes(term));
  const ceilingSuitabilityIntent = ceilingCoolingIntent && ["novostav", "rekonstruk", "vhod", "objekt", "strop"].some((term) => normalizedQuery.includes(term));
  const ceilingHeatPumpIntent = ceilingCoolingIntent && ["tepelne cerpadlo", "cerpadlo", "pasiv", "usporn"].some((term) => normalizedQuery.includes(term));
  const outOfDomainIntent = ["auto", "automobil", "hypotek", "pocasi", "pocas", "gulas", "futbal", "akci", "akcii", "akcie", "etf", "bitcoin", "praha"].some((token) =>
    querySet.has(token),
  );
  const scored: RetrievalResult[] = [];

  for (const chunk of chunks) {
    const normalizedTitle = normalize(chunk.pageTitle);
    const normalizedHeading = normalize(chunk.sectionHeading);
    const normalizedText = normalize(chunk.text);
    const normalizedUrl = normalize(`${chunk.url} ${chunk.slug}`);
    const isManualChunk = chunk.sourceType === "manual" || normalizedUrl.includes("manual geotherm");
    const isCeilingCoolingPage =
      normalizedUrl.includes("stropne vykurovanie a chladenie") ||
      normalizedUrl.includes("stropne vykurovanie chladenie") ||
      normalizedTitle.includes("stropne chladenie");
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
      (serviceIntent && (normalizedTitle.includes("servis") || normalizedHeading.includes("servis") || normalizedUrl.includes("servis")) ? 95 : 0) +
      (serviceIntent && normalizedText.includes("servis") ? 25 : 0) +
      (contactIntent && (normalizedTitle.includes("kontakt") || normalizedHeading.includes("kontakt") || normalizedUrl.includes("kontakt")) ? 135 : 0) +
      (contactIntent && normalizedText.includes("kontakt") ? 35 : 0) +
      (querySet.has("nibe") && (normalizedTitle.includes("nibe") || normalizedHeading.includes("nibe") || normalizedText.includes("nibe")) ? 70 : 0) +
      (noiseIntent && normalizedUrl.includes("vzduch voda") ? 28 : 0) +
      (noiseIntent && (normalizedTitle.includes("hlucnost") || normalizedHeading.includes("vonkajsej jednotky")) ? 75 : 0) +
      (querySet.has("navrh") && (normalizedTitle.includes("navrh") || normalizedHeading.includes("navrh")) ? 35 : 0) +
      (querySet.has("projekt") && normalizedText.includes("podorys") ? 28 : 0) +
      (querySet.has("znack") && (normalizedText.includes("nibe") || normalizedText.includes("vaillant")) ? 20 : 0) +
      (referenceIntent && (normalizedUrl.includes("referencie") || normalizedTitle.includes("realizac") || normalizedHeading.includes("realizac")) ? 85 : 0) +
      (earthVsAirIntent && (normalizedTitle.includes("zem") || normalizedHeading.includes("zem") || normalizedUrl.includes("zem-vs-vzduch")) ? 90 : 0) +
      (consumptionIntent && (normalizedTitle.includes("spotreba") || normalizedHeading.includes("spotreba") || normalizedText.includes("spotreba elektrickej")) ? 70 : 0) +
      (radiatorIntent && (normalizedTitle.includes("radiator") || normalizedHeading.includes("radiator") || normalizedText.includes("radiator")) ? 80 : 0) +
      (floorHeatingIntent && (normalizedTitle.includes("podlahov") || normalizedHeading.includes("podlahov") || normalizedText.includes("podlahov")) ? 105 : 0) +
      (rekuperationIntent && (normalizedTitle.includes("rekuper") || normalizedHeading.includes("rekuper") || normalizedUrl.includes("rekuper")) ? 95 : 0);
    const manualIntentScore = isManualChunk
      ? (priceIntent && (normalizedTitle.includes("cena") || normalizedHeading.includes("cena")) ? 145 : 0) +
        (priceIntent && (normalizedTitle.includes("ponuka") || normalizedHeading.includes("ponuka")) ? 90 : 0) +
        (radiatorIntent && (normalizedTitle.includes("radiator") || normalizedHeading.includes("radiator")) ? 125 : 0) +
        (floorHeatingIntent && (normalizedTitle.includes("podlahov") || normalizedHeading.includes("podlahov")) ? 150 : 0) +
        (consumptionIntent && (normalizedTitle.includes("spotreba") || normalizedTitle.includes("uspora") || normalizedTitle.includes("navratnost")) ? 120 : 0) +
        (querySet.has("znack") && (normalizedTitle.includes("znack") || normalizedHeading.includes("znack")) ? 135 : 0) +
        (querySet.has("model") && (normalizedTitle.includes("model") || normalizedHeading.includes("model")) ? 125 : 0) +
        (rekuperationIntent && (normalizedTitle.includes("rekuper") || normalizedHeading.includes("rekuper")) ? 100 : 0) +
        (titleMatches + headingMatches >= 2 ? 40 : 0)
      : 0;
    const serviceCardScore = isManualChunk
      ? [
          "service card heat pump",
          "service card air conditioning",
          "service card heat recovery",
          "service card floor heating",
          "service card ceiling cooling",
          "service card service",
          "service card subsidy",
          "service card complex house solution",
          "service router rozpoznanie sluzby",
          "verdict gate vsetky sluzby",
        ].some((term) => normalizedQuery.includes(term) && (normalizedUrl.includes(term) || normalizedTitle.includes(term) || normalizedHeading.includes(term)))
        ? 150
        : 0
      : 0;
    const ceilingCoolingScore =
      (ceilingCoolingIntent && isCeilingCoolingPage ? 55 : 0) +
      (ceilingBenefitsIntent && normalizedHeading.includes("vyhody stropneho chladenia") ? 130 : 0) +
      (ceilingComparisonIntent && normalizedHeading.includes("verzus klimatizacia") ? 260 : 0) +
      (ceilingDisadvantageIntent && normalizedHeading.includes("nevyhody stropneho chladenia") ? 180 : 0) +
      (ceilingPriceIntent && normalizedHeading.includes("cena a poradenstvo") ? 520 : 0) +
      (ceilingCondensationIntent && normalizedHeading.includes("nevyhody stropneho chladenia") ? 125 : 0) +
      (ceilingCondensationIntent && normalizedHeading.includes("vysoky komfort") ? 260 : 0) +
      (ceilingCondensationIntent && normalizedHeading.includes("novostavbu aj rekonstrukciu") ? 115 : 0) +
      ((ceilingGenericTypesIntent || ceilingOmietkaIntent) && normalizedHeading.includes("pod omietku") ? 300 : 0) +
      ((ceilingGenericTypesIntent || ceilingSadrokartonIntent) && normalizedHeading.includes("sadrokarton") ? 240 : 0) +
      ((ceilingGenericTypesIntent || ceilingBetonIntent) && normalizedHeading.includes("betonovej platni") ? 280 : 0) +
      (ceilingSuitabilityIntent && normalizedHeading.includes("novostavbu aj rekonstrukciu") ? 75 : 0) +
      (ceilingSuitabilityIntent && normalizedHeading.includes("betonovej platni") ? 42 : 0) +
      (ceilingHeatPumpIntent && isCeilingCoolingPage && normalizedText.includes("tepelne cerpadl") ? 150 : 0) +
      (ceilingHeatPumpIntent && normalizedHeading.includes("vyhody stropneho chladenia") ? 120 : 0) +
      (ceilingHeatPumpIntent && normalizedHeading.includes("stropne vykurovanie") ? 55 : 0);
    const outOfDomainPenalty = outOfDomainIntent ? 140 : 0;
    const densityBoost = queryTokens.length
      ? ((titleMatches + headingMatches + textMatches + urlMatches) / queryTokens.length) * 7
      : 0;
    const finalScore = Number(
      (
        titleScore +
        headingScore +
        textScore +
        urlScore +
        synonymScore +
        phraseScore +
        densityBoost +
        intentScore +
        manualIntentScore +
        serviceCardScore +
        ceilingCoolingScore -
        outOfDomainPenalty -
        boilerplatePenalty(chunk, contactIntent)
      ).toFixed(2),
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
  const maxChunksPerPage = ceilingCoolingIntent ? 5 : 2;
  for (const result of scored) {
    if (result.confidence === "no_answer") continue;
    const pageKey = `${result.chunk.sourceType}:${result.chunk.sourceId}`;
    const currentPageCount = pageCounts.get(pageKey) || 0;
    const fingerprint = chunkFingerprint(result.chunk);
    if (currentPageCount >= maxChunksPerPage) continue;
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
