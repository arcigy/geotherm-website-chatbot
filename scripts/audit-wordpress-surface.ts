import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createChatResponse } from "./chat-server";

type WordpressItem = {
  type?: string;
  title?: string;
  url?: string;
  slug?: string;
  cleanText?: string;
};

type Case = {
  id: string;
  title: string;
  question: string;
  topic: string;
  expected: string[];
  url: string;
};

type Row = {
  testCase: Case;
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
const reportPath = path.join(process.cwd(), "knowledge", "wordpress-surface-audit.md");
const jsonReportPath = path.join(process.cwd(), "knowledge", "wordpress-surface-audit.json");
const maxMs = Number.parseInt(process.env.WORDPRESS_SURFACE_MAX_MS || "8000", 10);
const maxCases = Number.parseInt(process.env.WORDPRESS_SURFACE_LIMIT || "220", 10);
const maxPerTopic = Number.parseInt(process.env.WORDPRESS_SURFACE_PER_TOPIC || "30", 10);
const concurrency = Math.max(1, Number.parseInt(process.env.WORDPRESS_SURFACE_CONCURRENCY || "4", 10));

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
  if (!/[ÄĂĹ]/.test(value)) return value;
  try {
    return Buffer.from(value, "latin1").toString("utf8");
  } catch {
    return value;
  }
}

function classify(item: WordpressItem): { topic: string; expected: string[]; question: string } | null {
  const title = repairMojibake(item.title || "");
  const url = item.url || "";
  const primary = normalize(`${title} ${item.slug || ""} ${url}`);
  const body = normalize((item.cleanText || "").slice(0, 600));
  const text = `${primary} ${body}`;
  const ask = (prefix: string) => `${prefix}: ${title}?`;
  if (!title || /(cookie|cookies|opt out|ochrana osobnych udajov|zasady|prava dotknutej|tiraz|dakujeme|formular|test\b|author|volne pracovne|pracovne miesto|referent|technik|koordinator|obchodny zastupca|e shop|aktuality|sutaz|korona|odborne clanky|podcast|architektur|precitajte si clanok|casopis|coneco|veltrh|vystavy a prezentacie|odborne skolenie|skolenie nasich kolegov|mysli na buducnost|our culture|vymena odbornych poznatkov|spolupracujeme v programe|hladame noveho kolegu)/.test(primary)) {
    return null;
  }
  if (/ponuka zdarma/.test(primary)) {
    return { topic: "quote", expected: ["ponuk", "cen"], question: ask("Mate informacie k teme") };
  }
  if (/pitnej vody|rautitan|rehau rautitan/.test(primary)) {
    return { topic: "water", expected: ["vod", "rozvod"], question: ask("Robite alebo viete vysvetlit temu") };
  }
  if (/velke stavby|polyfunkcne budovy|referencia vykurovania a vetrania|vykurovania a vetrania|vykurovania vetrania a chladenia/.test(primary)) {
    return { topic: "company_reference", expected: ["vykurov", "vetr", "chladen", "refer"], question: ask("Mate informacie k teme") };
  }
  if (/navrh vykurov|cenova ponuka vykurov|vykurovanie odborny navrh|odborny navrh vykurovania/.test(primary)) {
    return { topic: "heating", expected: ["kuren", "vykurov", "navrh"], question: ask("Viete poradit k teme") };
  }
  if (/era lacneho plynu|lacny plyn|lacneho plynu/.test(primary)) {
    return { topic: "heating", expected: ["plyn", "tepel", "vykurov"], question: ask("Viete poradit k teme") };
  }
  if (/energeticka trieda|energeticke tried|tepelnotechnicke vlastnosti|nizkoenergeticky|vykurovacia krivka|ekviterm/.test(primary)) {
    return { topic: "heating", expected: ["vykurov", "energet", "regul"], question: ask("Viete poradit k teme") };
  }
  if (/nordic inverter/.test(primary)) return { topic: "heat_pump", expected: ["ivt", "vzduch", "inverter"], question: `Viete poradiť k téme: ${title}?` };
  if (/aurocompact/.test(primary)) return { topic: "boilers", expected: ["kot", "vaillant", "compact"], question: `Robíte alebo viete poradiť k téme: ${title}?` };
  if (/klimatiz|mitsubishi|toshiba|\bgree\b/.test(primary)) return { topic: "air_conditioning", expected: ["klimatiz", "vzduch"], question: `Robíte alebo viete poradiť k téme: ${title}?` };
  if (/nemrznuca kvapalina|teplonosne kvapaliny|ochranne a udrzbove kvapaliny|fernox/.test(primary)) return { topic: "water", expected: ["kvapalin", "system", "udrz"], question: `Robíte alebo viete vysvetliť tému: ${title}?` };
  if (/fotovolt|solarn|solar|slnecne kolektor|aurostep|drain back|zostavy tlakove/.test(primary)) return { topic: "solar_photovoltaic", expected: ["solar", "fotovolt", "panel", "kolektor", "zasobnik"], question: `Robíte alebo viete vysvetliť tému: ${title}?` };
  if (/dotac|poukaz|plan obnovy|zelena|podmienky podpory|podpora/.test(primary)) return { topic: "subsidy", expected: ["dot", "podpor", "over"], question: `Viete pomôcť k téme: ${title}?` };
  if (/stropne chladen|stenove vykurovanie|temperovanie betonoveho jadra|bkt|chladenie a vykurovanie/.test(primary)) return { topic: "ceiling_cooling", expected: ["chladen", "strop", "sten"], question: `Viete poradiť k téme: ${title}?` };
  if (/podlahov|podlahove kurenie|elektricke podlahove/.test(primary)) return { topic: "floor_heating", expected: ["podlah"], question: `Robíte alebo viete naceniť tému: ${title}?` };
  if (/rekuper|vetran|co2|entalpick/.test(primary)) return { topic: "heat_recovery", expected: ["rekuper", "vetr"], question: `Robíte alebo viete vysvetliť tému: ${title}?` };
  if (/buderus|logamax/.test(primary)) return { topic: "boilers", expected: ["kot", "buderus", "vaillant"], question: `Robíte alebo viete poradiť k téme: ${title}?` };
  if (/radiator|radiatory/.test(primary)) return { topic: "radiators", expected: ["radi"], question: `Robíte alebo viete poradiť k téme: ${title}?` };
  if (/geberit|wc|sanit/.test(primary)) return { topic: "sanitary", expected: ["geberit", "wc", "sanit"], question: `Robíte alebo viete poradiť k téme: ${title}?` };
  if (/centralne vysavace|vysavac/.test(primary)) return { topic: "central_vacuum", expected: ["vysav"], question: `Robíte alebo viete poradiť k téme: ${title}?` };
  if (/potery|anhydrit|cementove|cementovy/.test(primary)) return { topic: "screeds", expected: ["poter", "anhydrit", "cement"], question: `Robíte alebo viete poradiť k téme: ${title}?` };
  if (/zmakcovac|uprava vody|katex|rozvody vody|kanalizac|zahradny nezamrzny ventil|teplonosne kvapaliny|nemrznuca kvapalina|ochranne a udrzbove kvapaliny|fernox|agrimex/.test(primary)) return { topic: "water", expected: ["vod", "kvapalin", "ventil", "kanal"], question: `Robíte alebo viete vysvetliť tému: ${title}?` };
  if (/servis|udrzb|pravidelny servis|video navod/.test(primary)) return { topic: "service", expected: ["servis", "navod", "udrz", "video", "tepel"], question: `Viete poradiť k téme: ${title}?` };
  if (/kotol|kotly|kondenzac|buderus|logamax|plynov|ecotec|eloblock/.test(primary)) return { topic: "boilers", expected: ["kot", "buderus", "vaillant"], question: `Robíte alebo viete poradiť k téme: ${title}?` };
  if (/tepelne cerpad|nibe|vaillant|arotherm|f2120|s2125|f2040|drazice|argo|vzduch voda|zem voda|voda voda|cerpadl|ivt|stiebel eltron|ohrev tuv/.test(primary)) {
    return { topic: "heat_pump", expected: ["tepel", "cerpad"], question: `Viete poradiť k téme: ${title}?` };
  }
  if (/vykurov|kuren|kotoln|tzb|navrh|rekonstrukcia vykurovania|uspiet na kureni/.test(primary)) return { topic: "heating", expected: ["kuren", "vykurov"], question: `Viete poradiť k téme: ${title}?` };
  if (/referenc|realizac|showroom|vystav|geotherm slovakia|casopis|velke stavby|komplexne|ocenenia|certifikat/.test(primary)) return { topic: "company_reference", expected: ["geotherm", "realiz", "refer", "certifik"], question: `Máte informácie k téme: ${title}?` };
  if (/tepelne|vykurov|kuren|servis|dotac|rekuper|vetran|klimatiz|chladen|cerpadl/.test(text)) return { topic: "company_reference", expected: ["geotherm", "ries", "sluz"], question: `Máte informácie k téme: ${title}?` };
  return null;
}

type BuildResult = {
  cases: Case[];
  classified: number;
  skippedUnclassified: number;
  skippedDuplicate: number;
  skippedTopicCap: number;
  skippedCaseLimit: number;
  topicCounts: Map<string, number>;
};

function buildCases(items: WordpressItem[]): BuildResult {
  const topicCounts = new Map<string, number>();
  const seen = new Set<string>();
  const cases: Case[] = [];
  let classified = 0;
  let skippedUnclassified = 0;
  let skippedDuplicate = 0;
  let skippedTopicCap = 0;
  let skippedCaseLimit = 0;
  for (const item of items) {
    const classification = classify(item);
    if (!classification) {
      skippedUnclassified += 1;
      continue;
    }
    classified += 1;
    const title = repairMojibake(item.title || "").replace(/\s+/g, " ").trim();
    const key = normalize(`${classification.topic} ${title}`);
    if (seen.has(key)) {
      skippedDuplicate += 1;
      continue;
    }
    const count = topicCounts.get(classification.topic) || 0;
    if (count >= maxPerTopic) {
      skippedTopicCap += 1;
      continue;
    }
    seen.add(key);
    topicCounts.set(classification.topic, count + 1);
    cases.push({
      id: `wp_${String(cases.length + 1).padStart(3, "0")}`,
      title,
      question: classification.question,
      topic: classification.topic,
      expected: classification.expected,
      url: item.url || "",
    });
    if (cases.length >= maxCases) {
      skippedCaseLimit = Math.max(0, items.length - cases.length - skippedUnclassified - skippedDuplicate - skippedTopicCap);
      break;
    }
  }
  return { cases, classified, skippedUnclassified, skippedDuplicate, skippedTopicCap, skippedCaseLimit, topicCounts };
}

function validate(testCase: Case, body: Awaited<ReturnType<typeof createChatResponse>>): string[] {
  const failures: string[] = [];
  const answer = normalize(body.answer);
  const debug = body.debug || {};
  const sources = debug.retrievalSourcesCount ?? body.sources.length;
  if (!debug.llmAttempted) failures.push("llmAttempted=false");
  if (!debug.llmUsed) failures.push(`llmUsed=false (${debug.fallbackType || "no fallbackType"})`);
  if ((body.responseTimeMs || 0) > maxMs) failures.push(`responseTimeMs>${maxMs}: ${body.responseTimeMs}`);
  if (sources < 1) failures.push("sources<1");
  if (!testCase.expected.some((term) => answer.includes(normalize(term)))) failures.push(`missing expected topic term: ${testCase.expected.join("/")}`);
  const service = String(debug.serviceType || "");
  const normalizedQuestion = normalize(testCase.question);
  if (
    testCase.topic === "solar_photovoltaic" &&
    !/(dotac|poukaz|prispev|podpor)/.test(normalizedQuestion) &&
    (service === "heat_pump" || service === "service")
  ) {
    failures.push(`solar_photovoltaic misrouted as ${service}`);
  }
  if (testCase.topic === "ceiling_cooling" && /sten/.test(normalizedQuestion) && service === "heat_pump") {
    failures.push("wall heating/cooling misrouted as heat_pump");
  }
  if (
    testCase.topic === "service" &&
    /(pravideln|preventiv|udrzb|prehliad|neodklad|oplat)/.test(normalize(testCase.question)) &&
    /(hlasi chybu|chybovy kod|pri poruche|zariadenie hlasi|konkretnu poruchu)/.test(answer)
  ) {
    failures.push("preventive service was treated as a fault triage");
  }
  if (/strucne k otazke|co z toho chces upresnit|prepac teraz neviem|pagetitle|sectionheading|manual:\/\//.test(answer)) failures.push("weak fallback or raw source leaked");
  if (/bezplatna obhliadka|nezavazna obhliadka|garantujeme dotaciu|kompletne vybavime dotaciu|servisujeme cudzie montaze/.test(answer)) failures.push("unconfirmed company claim");
  return failures;
}

function mdTable(rows: Row[]): string {
  return [
    "| Case | Pass | ms | LLM | Mode | Service | Intent | Sources | Topic | Question | Failures |",
    "| --- | --- | ---: | --- | --- | --- | --- | ---: | --- | --- | --- |",
    ...rows.map((row) =>
      [
        row.testCase.id,
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
  const build = buildCases(items);
  const cases = build.cases;
  const rows: Row[] = new Array(cases.length);
  let cursor = 0;
  async function runNext(): Promise<void> {
    const index = cursor;
    cursor += 1;
    if (index >= cases.length) return;
    const testCase = cases[index];
    const body = await createChatResponse({
      siteId: "geotherm",
      anonymousId: `wp_surface_${testCase.id}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      currentUrl: testCase.url || "http://localhost/wordpress-surface",
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
    "# WordPress Surface Audit",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Source: ${exportPath}`,
    `Items in export: ${items.length}`,
    `Cases generated: ${rows.length}`,
    `Max response time: ${maxMs} ms`,
    "",
    "## Summary",
    "",
    `- passed: ${passed}`,
    `- failed: ${rows.length - passed}`,
    `- verdict: ${passed === rows.length ? "PASS" : "NEEDS WORK"}`,
    "",
    "## Coverage Summary",
    "",
    `- export items: ${items.length}`,
    `- classified items: ${build.classified}`,
    `- generated cases: ${rows.length}`,
    `- skipped unclassified/admin/editorial: ${build.skippedUnclassified}`,
    `- skipped duplicates: ${build.skippedDuplicate}`,
    `- skipped by per-topic cap: ${build.skippedTopicCap}`,
    `- skipped by case limit: ${build.skippedCaseLimit}`,
    `- max cases: ${maxCases}`,
    `- max per topic: ${maxPerTopic}`,
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
      .slice(0, 20)
      .flatMap((row) => [`### ${row.testCase.id} ${row.testCase.title}`, "", `Question: ${row.testCase.question}`, `URL: ${row.testCase.url}`, `Failures: ${row.failures.join("; ")}`, "", row.answer.slice(0, 1400), ""]),
  ].join("\n");
  await writeFile(reportPath, `${report}\n`, "utf8");
  await writeFile(jsonReportPath, `${JSON.stringify(rows, null, 2)}\n`, "utf8");
  console.log(`WordPress surface audit: ${passed}/${rows.length} passed`);
  console.log(`Saved ${reportPath}`);
  if (passed !== rows.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
