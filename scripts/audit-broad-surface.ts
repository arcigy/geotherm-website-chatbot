import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { startChatServer } from "./chat-server";

type ChatDebug = {
  llmAttempted?: boolean;
  llmUsed?: boolean;
  serviceType?: string;
  serviceIntent?: string;
  answerMode?: string;
  retrievalSourcesCount?: number;
  fallbackType?: string | null;
};

type ChatBody = {
  answer: string;
  responseTimeMs?: number;
  confidence?: string;
  debug?: ChatDebug;
};

type Case = {
  id: string;
  message: string;
  mustContain?: string[];
  mustNotContain?: string[];
  maxSources?: number;
  minSources?: number;
  maxMs?: number;
};

const reportPath = path.join(process.cwd(), "knowledge", "broad-surface-audit.md");
const defaultMaxMs = 8000;

const cases: Case[] = [
  { id: "services_overview", message: "Aké služby poskytujete?", mustContain: ["tepel", "rekuper", "podlah"], minSources: 1 },
  { id: "heat_pumps", message: "Robíte aj tepelné čerpadlá?", mustContain: ["tepel", "čerpad"], minSources: 1 },
  { id: "air_conditioning", message: "Robíte aj klimatizácie?", mustContain: ["klimatiz"], minSources: 1 },
  { id: "heat_recovery", message: "Robíte rekuperáciu?", mustContain: ["rekuper"], minSources: 1 },
  { id: "floor_heating", message: "Robíte aj podlahové kúrenie?", mustContain: ["podlah"], minSources: 1 },
  { id: "ceiling_cooling", message: "Viete spraviť stropné chladenie?", mustContain: ["strop", "chladen"], minSources: 1 },
  { id: "radiators", message: "Robíte aj radiátory?", mustContain: ["radiátor"], minSources: 1 },
  { id: "boilers", message: "Robíte aj montáž nových kotlov?", mustContain: ["kotl"], minSources: 1 },
  { id: "vaillant_boilers", message: "Aké Vaillant kotly máte?", mustContain: ["Vaillant", "kot"], minSources: 1 },
  { id: "water_distribution", message: "Robíte aj rozvody vody?", mustContain: ["vod"], minSources: 1 },
  { id: "water_treatment", message: "Čo je Katexová úprava vody?", mustContain: ["vody"], minSources: 1 },
  { id: "wc_geberit", message: "Robíte WC Geberit?", mustContain: ["Geberit"], minSources: 1 },
  { id: "screeds", message: "Robíte aj potery?", mustContain: ["poter"], minSources: 1 },
  { id: "solar_panels", message: "Robíte solárne panely?", mustContain: ["solár"], minSources: 1 },
  { id: "photovoltaics", message: "Robíte fotovoltaiku k tepelnému čerpadlu?", mustContain: ["fotovolt"], minSources: 1 },
  { id: "central_vacuum", message: "Máte centrálne vysávače?", mustContain: ["vysáva"], minSources: 1 },
  { id: "boreholes", message: "Robíte hlbinné vrty pre tepelné čerpadlá?", mustContain: ["vrt"], minSources: 1 },
  { id: "service_fault", message: "Čo robiť keď kotol ukazuje chybu?", mustContain: ["model", "chyb"], minSources: 1 },
  { id: "gas_leak_safety", message: "Čo robiť pri úniku plynu?", mustContain: ["plyn"], mustNotContain: ["skús opraviť", "otvor kotol"] },
  { id: "pressure_drop", message: "Čo robiť keď padá tlak v kúrení?", mustContain: ["tlak"], minSources: 1 },
  { id: "third_party_service", message: "Viete spraviť servis aj cudzej montáže?", mustContain: ["potvr"], mustNotContain: ["servisujeme cudzie", "určite áno"] },
  { id: "emergency_callout", message: "Robíte havarijné výjazdy?", mustContain: ["potvr"], mustNotContain: ["nonstop", "24/7"] },
  { id: "weekends", message: "Robíte aj cez víkendy?", mustContain: ["potvr"], mustNotContain: ["áno", "robíme cez víkendy"] },
  { id: "today_visit", message: "Viete prísť ešte dnes?", mustContain: ["potvr"], mustNotContain: ["garantujeme", "určite"] },
  { id: "service_area", message: "Do akých miest a okresov chodíte?", mustContain: ["potvr"], minSources: 1 },
  { id: "inspection_paid", message: "Je obhliadka platená?", mustContain: ["potvr"], mustNotContain: ["bezplatná", "zadarmo"] },
  { id: "quote_free", message: "Robíte cenové ponuky zdarma?", mustContain: ["potvr"], mustNotContain: ["zdarma", "zadarmo"] },
  { id: "quote_inputs", message: "Aké informácie potrebujete na cenovú ponuku?", mustContain: ["plocha"], minSources: 1 },
  { id: "quote_from_photos", message: "Viete naceniť podľa fotiek?", mustContain: ["fot"], minSources: 1 },
  { id: "whatsapp", message: "Viete komunikovať cez WhatsApp?", mustContain: ["potvr"], mustNotContain: ["áno"] },
  { id: "payment_options", message: "Aké sú možnosti platby?", mustContain: ["potvr"], mustNotContain: ["splátky poskytujeme"] },
  { id: "warranty_work", message: "Poskytujete záruku na prácu?", mustContain: ["potvr"], mustNotContain: ["áno"] },
  { id: "insurance", message: "Máte poistenie zodpovednosti?", mustContain: ["potvr"], mustNotContain: ["áno"] },
  { id: "certification_gas", message: "Máte certifikáciu na plynové zariadenia?", mustContain: ["potvr"], mustNotContain: ["áno"] },
  { id: "references", message: "Máte referencie a fotky realizácií?", mustContain: ["refer"], minSources: 1 },
  { id: "process_installation", message: "Ako prebieha realizácia od začiatku do konca?", mustContain: ["návrh"], minSources: 1 },
  { id: "docs_after_install", message: "Dostanem po realizácii dokumentáciu?", mustContain: ["potvr"], mustNotContain: ["áno"] },
  { id: "subsidy_help", message: "Viete zabezpečiť aj dotácie?", mustContain: ["dot"], mustNotContain: ["garantujeme", "kompletne vybavíme"] },
  { id: "company_age", message: "Koľko rokov ste na trhu?", mustContain: ["Geotherm"], minSources: 1 },
  { id: "small_talk", message: "ahoj", mustContain: ["pom"], maxSources: 0 },
  { id: "weather_out_of_scope", message: "aké je dnes počasie?", mustContain: ["podklad"], maxSources: 0, maxMs: 8000 },
];

function normalize(value: string | undefined | null): string {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasAll(answer: string, terms: string[] | undefined): boolean {
  if (!terms?.length) return true;
  const text = normalize(answer);
  return terms.every((term) => text.includes(normalize(term)));
}

function forbiddenTerms(answer: string, terms: string[] | undefined): string[] {
  if (!terms?.length) return [];
  const text = normalize(answer);
  return terms.filter((term) => text.includes(normalize(term)));
}

function genericFailures(body: ChatBody, testCase: Case): string[] {
  const failures: string[] = [];
  const debug = body.debug || {};
  const maxMs = testCase.maxMs || defaultMaxMs;
  const sources = debug.retrievalSourcesCount || 0;
  if ((body.responseTimeMs || 0) > maxMs) failures.push(`responseTimeMs>${maxMs}: ${body.responseTimeMs}`);
  if (!debug.llmAttempted) failures.push("llmAttempted is not true");
  if (!debug.llmUsed) failures.push(`llmUsed is not true (${debug.fallbackType || "no fallbackType"})`);
  if (!hasAll(body.answer || "", testCase.mustContain)) failures.push(`missing: ${(testCase.mustContain || []).join(", ")}`);
  const forbidden = forbiddenTerms(body.answer || "", testCase.mustNotContain);
  if (forbidden.length) failures.push(`forbidden: ${forbidden.join(", ")}`);
  if (testCase.minSources !== undefined && sources < testCase.minSources) failures.push(`sources<${testCase.minSources}: ${sources}`);
  if (testCase.maxSources !== undefined && sources > testCase.maxSources) failures.push(`sources>${testCase.maxSources}: ${sources}`);
  if (/strucne k otazke|co z toho chces upresnit ako prve|prepacte, teraz neviem pripravit/i.test(normalize(body.answer))) {
    failures.push("legacy weak fallback leaked");
  }
  return failures;
}

async function main(): Promise<void> {
  const server = await startChatServer({ port: 0 });
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  const endpoint = `http://127.0.0.1:${port}/chat`;
  const rows: Array<{ testCase: Case; body: ChatBody; failures: string[] }> = [];
  try {
    for (const testCase of cases) {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: "http://localhost:4321" },
        body: JSON.stringify({
          siteId: "geotherm",
          anonymousId: `broad_${testCase.id}_${Date.now()}`,
          currentUrl: "http://localhost/broad-surface",
          message: testCase.message,
          debug: true,
        }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status} for ${testCase.id}`);
      const body = (await response.json()) as ChatBody;
      rows.push({ testCase, body, failures: genericFailures(body, testCase) });
    }
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }

  const passed = rows.filter((row) => row.failures.length === 0).length;
  const report = [
    "# Broad Surface Audit",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Max response time: ${defaultMaxMs} ms`,
    "",
    "## Summary",
    "",
    `- cases: ${rows.length}`,
    `- passed: ${passed}`,
    `- failed: ${rows.length - passed}`,
    `- verdict: ${passed === rows.length ? "PASS" : "NEEDS WORK"}`,
    "",
    "## Cases",
    "",
    "| Case | Pass | ms | LLM | Mode | Service | Intent | Sources | Failures |",
    "| --- | --- | ---: | --- | --- | --- | --- | ---: | --- |",
    ...rows.map((row) => {
      const debug = row.body.debug || {};
      return `| ${row.testCase.id} | ${row.failures.length ? "no" : "yes"} | ${row.body.responseTimeMs || 0} | ${debug.llmUsed ? "yes" : "no"} | ${debug.answerMode || "n/a"} | ${debug.serviceType || "n/a"} | ${debug.serviceIntent || "n/a"} | ${debug.retrievalSourcesCount ?? 0} | ${row.failures.join("; ").replace(/\|/g, "/") || ""} |`;
    }),
    "",
    "## Failed Answer Samples",
    "",
    ...rows
      .filter((row) => row.failures.length)
      .slice(0, 12)
      .flatMap((row) => [`### ${row.testCase.id}`, "", `Question: ${row.testCase.message}`, "", `Failures: ${row.failures.join("; ")}`, "", row.body.answer, ""]),
  ].join("\n");

  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, report, "utf8");
  console.log(`Broad surface audit: ${passed}/${rows.length} passed`);
  console.log(`Saved ${reportPath}`);
  if (process.env.BROAD_SURFACE_STRICT === "1" && passed !== rows.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
