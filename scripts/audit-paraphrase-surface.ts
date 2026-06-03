import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createChatResponse } from "./chat-server";

type WordpressItem = {
  title?: string;
  url?: string;
  slug?: string;
  cleanText?: string;
};

type BaseCase = {
  id: string;
  title: string;
  topic: string;
  expected: string[];
  url: string;
};

type ParaphraseCase = BaseCase & {
  variant: number;
  question: string;
};

type Row = {
  testCase: ParaphraseCase;
  answer: string;
  ms: number;
  llmUsed: boolean;
  mode: string;
  service: string;
  intent: string;
  sources: number;
  failures: string[];
};

const exportPath = path.join(process.cwd(), "knowledge", "wordpress-export.json");
const reportPath = path.join(process.cwd(), "knowledge", "paraphrase-surface-audit.md");
const jsonReportPath = path.join(process.cwd(), "knowledge", "paraphrase-surface-audit.json");
const maxMs = Number.parseInt(process.env.PARAPHRASE_SURFACE_MAX_MS || "8000", 10);
const maxBaseCases = Number.parseInt(process.env.PARAPHRASE_SURFACE_BASE_LIMIT || "94", 10);
const variantsPerCase = Number.parseInt(process.env.PARAPHRASE_SURFACE_VARIANTS || "3", 10);
const maxPerTopic = Number.parseInt(process.env.PARAPHRASE_SURFACE_PER_TOPIC || "12", 10);
const concurrency = Math.max(1, Number.parseInt(process.env.PARAPHRASE_SURFACE_CONCURRENCY || "4", 10));

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function repairMojibake(value: string): string {
  if (!/[Ă„Ä‚ÄąĂ…]/.test(value)) return value;
  try {
    return Buffer.from(value, "latin1").toString("utf8");
  } catch {
    return value;
  }
}

function classify(item: WordpressItem): { topic: string; expected: string[] } | null {
  const title = repairMojibake(item.title || "");
  const url = item.url || "";
  const primary = normalize(`${title} ${item.slug || ""} ${url}`);
  const body = normalize((item.cleanText || "").slice(0, 700));
  const text = `${primary} ${body}`;
  if (!title || /(cookie|cookies|opt out|ochrana osobnych udajov|zasady|prava dotknutej|tiraz|dakujeme|formular|test\b|author|volne pracovne|pracovne miesto|referent|technik|koordinator|obchodny zastupca|e shop|aktuality|sutaz|korona|odborne clanky|podcast|architektur|precitajte si clanok|casopis|coneco|veltrh|vystavy a prezentacie|odborne skolenie|skolenie nasich kolegov|mysli na buducnost|our culture|vymena odbornych poznatkov|spolupracujeme v programe|hladame noveho kolegu)/.test(primary)) return null;
  if (/ponuka zdarma/.test(primary)) return { topic: "quote", expected: ["ponuk", "cen"] };
  if (/pitnej vody|rautitan|rehau rautitan/.test(primary)) return { topic: "water", expected: ["vod", "rozvod"] };
  if (/velke stavby|polyfunkcne budovy|referencia vykurovania a vetrania|vykurovania a vetrania|vykurovania vetrania a chladenia/.test(primary)) return { topic: "company_reference", expected: ["vykurov", "vetr", "chladen", "refer"] };
  if (/navrh vykurov|cenova ponuka vykurov|vykurovanie odborny navrh|odborny navrh vykurovania/.test(primary)) return { topic: "heating", expected: ["kuren", "vykurov", "navrh"] };
  if (/era lacneho plynu|lacny plyn|lacneho plynu/.test(primary)) return { topic: "heating", expected: ["plyn", "tepel", "vykurov"] };
  if (/energeticka trieda|nizkoenergeticky|vykurovacia krivka|ekviterm/.test(primary)) return { topic: "heating", expected: ["vykurov", "energet", "regul"] };
  if (/plosne kolektory|plošne kolektory|plošné kolektory/.test(primary)) return { topic: "heat_pump", expected: ["kolektor", "tepel", "zem"] };
  if (/nordic inverter/.test(primary)) return { topic: "heat_pump", expected: ["ivt", "vzduch", "inverter", "tepel"] };
  if (/aurocompact|ecocompact|ecotec|eloblock|buderus|logamax|kotol|kotly|kondenzac|plynov/.test(primary)) return { topic: "boilers", expected: ["kot", "vaillant", "buderus", "vykurov"] };
  if (/klimatiz|mitsubishi|toshiba|\bgree\b/.test(primary)) return { topic: "air_conditioning", expected: ["klimatiz", "chladen", "vzduch"] };
  if (/fotovolt|solarn|solar|slnecne kolektor|aurostep|drain back|zostavy tlakove/.test(primary)) return { topic: "solar_photovoltaic", expected: ["solar", "fotovolt", "panel", "kolektor", "zasobnik"] };
  if (/dotac|poukaz|plan obnovy|zelena|podmienky podpory|podpora/.test(primary)) return { topic: "subsidy", expected: ["dot", "podpor", "over", "podmien"] };
  if (/stropne chladen|stenove vykurovanie|temperovanie betonoveho jadra|bkt|chladenie a vykurovanie/.test(primary)) return { topic: "ceiling_cooling", expected: ["chladen", "strop", "sten", "regul"] };
  if (/podlahov|podlahove kurenie|elektricke podlahove/.test(primary)) return { topic: "floor_heating", expected: ["podlah", "kuren", "vykurov"] };
  if (/rekuper|vetran|co2|entalpick/.test(primary)) return { topic: "heat_recovery", expected: ["rekuper", "vetr", "vzduch"] };
  if (/radiator|radiatory/.test(primary)) return { topic: "radiators", expected: ["radi", "vykurov", "teplot"] };
  if (/geberit|wc|sanit/.test(primary)) return { topic: "sanitary", expected: ["geberit", "wc", "sanit", "rozvod"] };
  if (/centralne vysavace|vysavac/.test(primary)) return { topic: "central_vacuum", expected: ["vysav", "rozvod", "dom"] };
  if (/potery|anhydrit|cementove|cementovy/.test(primary)) return { topic: "screeds", expected: ["poter", "anhydrit", "cement", "podlah"] };
  if (/zmakcovac|uprava vody|katex|rozvody vody|kanalizac|zahradny nezamrzny ventil|teplonosne kvapaliny|nemrznuca kvapalina|ochranne a udrzbove kvapaliny|fernox|agrimex/.test(primary)) return { topic: "water", expected: ["vod", "kvapalin", "ventil", "kanal", "rozvod"] };
  if (/servis|udrzb|pravidelny servis|video navod/.test(primary)) return { topic: "service", expected: ["servis", "udrz", "model", "zariaden"] };
  if (/tepelne cerpad|nibe|vaillant|arotherm|f2120|s2125|f2040|drazice|argo|vzduch voda|zem voda|voda voda|cerpadl|ivt|stiebel eltron|ohrev tuv/.test(primary)) return { topic: "heat_pump", expected: ["tepel", "cerpad", "vykurov"] };
  if (/vykurov|kuren|kotoln|tzb|navrh|rekonstrukcia vykurovania|uspiet na kureni/.test(primary)) return { topic: "heating", expected: ["kuren", "vykurov", "riesenie"] };
  if (/referenc|realizac|showroom|vystav|geotherm slovakia|casopis|velke stavby|komplexne|ocenenia|certifikat/.test(primary)) return { topic: "company_reference", expected: ["geotherm", "realiz", "refer", "certifik"] };
  if (/tepelne|vykurov|kuren|servis|dotac|rekuper|vetran|klimatiz|chladen|cerpadl/.test(text)) return { topic: "company_reference", expected: ["geotherm", "ries", "sluz"] };
  return null;
}

function buildBaseCases(items: WordpressItem[]): BaseCase[] {
  const topicCounts = new Map<string, number>();
  const seen = new Set<string>();
  const cases: BaseCase[] = [];
  for (const item of items) {
    const classification = classify(item);
    if (!classification) continue;
    const title = repairMojibake(item.title || "").replace(/\s+/g, " ").trim();
    const key = normalize(`${classification.topic} ${title}`);
    if (seen.has(key)) continue;
    const count = topicCounts.get(classification.topic) || 0;
    if (count >= maxPerTopic) continue;
    seen.add(key);
    topicCounts.set(classification.topic, count + 1);
    cases.push({
      id: `para_${String(cases.length + 1).padStart(3, "0")}`,
      title,
      topic: classification.topic,
      expected: classification.expected,
      url: item.url || "",
    });
    if (cases.length >= maxBaseCases) break;
  }
  return cases;
}

function paraphrases(base: BaseCase): string[] {
  const title = base.title.replace(/\?+$/g, "").trim();
  const variants = [
    `Prosím, čo mi viete povedať k téme ${title}?`,
    `Riešim ${title}. Robíte to a ako by som mal postupovať?`,
    `Potrebujem poradiť alebo naceniť ${title}, čo by ste odporučili?`,
    `Mám otázku k ${title}; čo je pri tom dôležité a čo odo mňa potrebujete?`,
    `Viete mi stručne vysvetliť ${title} a posunúť ma na správny ďalší krok?`,
  ];
  return variants.slice(0, Math.max(1, variantsPerCase));
}

function buildParaphraseCases(baseCases: BaseCase[]): ParaphraseCase[] {
  return baseCases.flatMap((base) =>
    paraphrases(base).map((question, index) => ({
      ...base,
      variant: index + 1,
      question,
    })),
  );
}

function validate(testCase: ParaphraseCase, body: Awaited<ReturnType<typeof createChatResponse>>): string[] {
  const failures: string[] = [];
  const answer = normalize(body.answer);
  const debug = body.debug || {};
  const sources = debug.retrievalSourcesCount ?? body.sources.length;
  if (!debug.llmAttempted) failures.push("llmAttempted=false");
  if (!debug.llmUsed) failures.push(`llmUsed=false (${debug.fallbackType || "no fallbackType"})`);
  if ((body.responseTimeMs || 0) > maxMs) failures.push(`responseTimeMs>${maxMs}: ${body.responseTimeMs}`);
  if (sources < 1) failures.push("sources<1");
  if (!testCase.expected.some((term) => answer.includes(normalize(term)))) failures.push(`missing expected topic term: ${testCase.expected.join("/")}`);
  if (/strucne k otazke|co z toho chces upresnit|prepac teraz neviem|pagetitle|sectionheading|manual:\/\/|http:\/\/www\.geotherm\.sk/.test(answer)) failures.push("weak fallback or raw source leaked");
  if (/bezplatna obhliadka|nezavazna obhliadka|garantujeme dotaciu|kompletne vybavime dotaciu|servisujeme cudzie montaze/.test(answer)) failures.push("unconfirmed company claim");
  if (/(cudzi|ina firma|inej firmy|nie od nas|neboli nami)/.test(normalize(testCase.question)) && /(servis|oprava|diagnostik)/.test(answer) && /(ano mozeme|ano vieme|vykoname|spravime)/.test(answer) && !/treba potvrdit|potvrdit podla|najprv potvrdit/.test(answer)) failures.push("overconfident third-party service claim");
  return failures;
}

function mdTable(rows: Row[]): string {
  return [
    "| Case | Variant | Pass | ms | LLM | Mode | Service | Intent | Sources | Topic | Question | Failures |",
    "| --- | ---: | --- | ---: | --- | --- | --- | --- | ---: | --- | --- | --- |",
    ...rows.map((row) =>
      [
        row.testCase.id,
        row.testCase.variant,
        row.failures.length ? "no" : "yes",
        row.ms,
        row.llmUsed ? "yes" : "no",
        row.mode,
        row.service,
        row.intent,
        row.sources,
        row.testCase.topic,
        row.testCase.question,
        row.failures.join("; "),
      ]
        .map((cell) => String(cell).replace(/\|/g, "/"))
        .join(" | "),
    ).map((line) => `| ${line} |`),
  ].join("\n");
}

async function main(): Promise<void> {
  const raw = JSON.parse(await readFile(exportPath, "utf8")) as WordpressItem[];
  const items = Array.isArray(raw) ? raw : [];
  const baseCases = buildBaseCases(items);
  const cases = buildParaphraseCases(baseCases);
  const rows: Row[] = new Array(cases.length);
  let cursor = 0;
  async function runNext(): Promise<void> {
    const index = cursor;
    cursor += 1;
    if (index >= cases.length) return;
    const testCase = cases[index];
    const body = await createChatResponse({
      siteId: "geotherm",
      anonymousId: `paraphrase_${testCase.id}_${testCase.variant}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      currentUrl: testCase.url || "http://localhost/paraphrase-surface",
      message: testCase.question,
    });
    rows[index] = {
      testCase,
      answer: body.answer,
      ms: body.responseTimeMs || 0,
      llmUsed: Boolean(body.debug?.llmUsed),
      mode: body.debug?.answerMode || "n/a",
      service: body.debug?.serviceType || "n/a",
      intent: body.debug?.serviceIntent || "n/a",
      sources: body.debug?.retrievalSourcesCount ?? body.sources.length,
      failures: validate(testCase, body),
    };
    await runNext();
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, cases.length) }, () => runNext()));

  const passed = rows.filter((row) => row.failures.length === 0).length;
  const topicSummary = [...new Set(rows.map((row) => row.testCase.topic))]
    .sort()
    .map((topic) => {
      const topicRows = rows.filter((row) => row.testCase.topic === topic);
      return `- ${topic}: ${topicRows.filter((row) => row.failures.length === 0).length}/${topicRows.length}`;
    });
  const report = [
    "# Paraphrase Surface Audit",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Source: ${exportPath}`,
    `Items in export: ${items.length}`,
    `Base cases: ${baseCases.length}`,
    `Variants per case: ${variantsPerCase}`,
    `Paraphrase cases: ${rows.length}`,
    `Max response time: ${maxMs} ms`,
    "",
    "## Summary",
    "",
    `- passed: ${passed}`,
    `- failed: ${rows.length - passed}`,
    `- verdict: ${passed === rows.length ? "PASS" : "NEEDS WORK"}`,
    "",
    "## Topic Summary",
    "",
    ...topicSummary,
    "",
    "## Cases",
    "",
    mdTable(rows),
    "",
    "## Failed Answer Samples",
    "",
    ...rows
      .filter((row) => row.failures.length)
      .slice(0, 25)
      .flatMap((row) => [`### ${row.testCase.id} v${row.testCase.variant} ${row.testCase.title}`, "", `Question: ${row.testCase.question}`, `URL: ${row.testCase.url}`, `Failures: ${row.failures.join("; ")}`, "", row.answer.slice(0, 1400), ""]),
  ].join("\n");
  await writeFile(reportPath, `${report}\n`, "utf8");
  await writeFile(jsonReportPath, `${JSON.stringify(rows, null, 2)}\n`, "utf8");
  console.log(`Paraphrase surface audit: ${passed}/${rows.length} passed`);
  console.log(`Saved ${reportPath}`);
  if (passed !== rows.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
