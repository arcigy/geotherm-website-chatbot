import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { startChatServer } from "./chat-server";

type ChatBody = {
  answer: string;
  intent: string;
  confidence: string;
  sources: unknown[];
  responseTimeMs?: number;
  debug?: {
    answerMode?: string;
    retrievalQuery?: string;
    enrichedRetrievalQuery?: string;
    rawUserMessage?: string;
    normalizedUserMessage?: string;
    storedSlots?: Record<string, unknown>;
    newlyExtractedSlots?: Record<string, unknown>;
    inferredFromLastQuestion?: boolean;
    serviceType?: string;
    serviceIntent?: string;
    legacyIntent?: string;
    diagnosticFlowVersion?: string;
    serverCommit?: string;
    retrievalSourcesCount?: number;
    contextCarried?: boolean;
    fallbackUsed?: boolean;
    fallbackType?: string | null;
    validatorsTriggered?: string[];
    bannedClaimsRemoved?: string[];
    questionRoundsCount?: number;
    closureGateTriggered?: boolean;
    closureReason?: string | null;
    directAnswerGateTriggered?: boolean;
    directAnswerReason?: string | null;
    directAnswerComposedByLlm?: boolean;
    directAnswerFallbackUsed?: boolean;
    recommendationOptions?: string[];
    remainingCriticalUnknowns?: string[];
    llmError?: string | null;
    llmRouterError?: string | null;
    llmUsed?: boolean;
  };
  fallbackUsed?: boolean;
};

type Turn = {
  scenario: string;
  message: string;
  response: ChatBody;
  failures: string[];
};

type Scenario = {
  id: string;
  title: string;
  messages: string[];
  check: (turnIndex: number, body: ChatBody, turns: Turn[]) => string[];
};

const reportPath = path.join(process.cwd(), "knowledge", "diagnostic-conversation-test-report.md");
const jsonPath = path.join(process.cwd(), "knowledge", "diagnostic-conversation-test-export.json");

function normalize(value: string | undefined | null): string {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasAll(value: string, terms: string[]): boolean {
  const normalized = normalize(value);
  return terms.every((term) => normalized.includes(normalize(term)));
}

function hasAny(value: string, terms: string[]): boolean {
  const normalized = normalize(value);
  return terms.some((term) => normalized.includes(normalize(term)));
}

function slotText(body: ChatBody): string {
  return normalize(JSON.stringify(body.debug?.storedSlots || {}));
}

function queryText(body: ChatBody): string {
  return body.debug?.enrichedRetrievalQuery || body.debug?.retrievalQuery || "";
}

function wordCount(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function questionCount(value: string): number {
  return (value.match(/\?/g) || []).length;
}

function commonChecks(body: ChatBody): string[] {
  const failures: string[] = [];
  if (wordCount(body.answer || "") > 280) failures.push(`answer too long: ${wordCount(body.answer || "")} words`);
  for (const field of ["serverCommit", "diagnosticFlowVersion", "rawUserMessage", "normalizedUserMessage", "storedSlots", "serviceType", "serviceIntent", "enrichedRetrievalQuery", "retrievalSourcesCount", "fallbackType", "questionRoundsCount", "closureGateTriggered", "recommendationOptions", "remainingCriticalUnknowns"] as const) {
    if (body.debug?.[field] === undefined) failures.push(`debug.${field} missing`);
  }
  if (hasAny(body.answer, ["odpoveď sa teraz nedokončila", "odpoved sa teraz nedokoncila", "mám podklady, ale", "mam podklady ale", "nemám dosť informácií"])) {
    failures.push("answer contains forbidden weak fallback");
  }
  if (hasAny(body.answer, ["bezplatná obhliadka", "bezplatna obhliadka", "nezáväzná obhliadka", "nezavazna obhliadka"])) {
    failures.push("answer contains unconfirmed inspection claim");
  }
  if (hasAny(body.answer, ["oveľa komfortnejšie a úspornejšie ako klasická klimatizácia", "ovela komfortnejsie a uspornejsie ako klasicka klimatizacia"])) {
    failures.push("answer contains forbidden cooling superiority claim");
  }
  return failures;
}

const scenarios: Scenario[] = [
  {
    id: "new_build_floor_cooling",
    title: "Novostavba + podlahovka + chladenie",
    messages: ["ahoj, ake cerpadlo je najlepsie?", "1. novostavbu, 2. 120, 3. podlahovka", "1. 5, 2. ano"],
    check(turnIndex, body) {
      const failures = commonChecks(body);
      const answer = body.answer || "";
      const slots = slotText(body);
      const query = queryText(body);
      if (turnIndex === 0) {
        if (body.debug?.serviceType !== "heat_pump") failures.push(`expected serviceType heat_pump, got ${body.debug?.serviceType || "missing"}`);
        if (body.debug?.serviceIntent !== "recommendation") failures.push(`expected serviceIntent recommendation, got ${body.debug?.serviceIntent || "missing"}`);
        if (!hasAny(answer, ["vzduch-voda", "tepelné čerpadlo", "tepelne cerpadlo"])) failures.push("first answer lacks general heat-pump direction");
        if (questionCount(answer) > 3) failures.push(`asked too many questions: ${questionCount(answer)}`);
        if (hasAny(answer, ["iba závisí", "iba zavisi"])) failures.push("answered only with depends");
      }
      if (turnIndex === 1) {
        if (!hasAll(slots, ["novostavba", "120", "podlah"])) failures.push(`storedSlots missing new-build basics: ${JSON.stringify(body.debug?.storedSlots || {})}`);
        if (!hasAll(answer, ["vzduch-voda", "podlah"])) failures.push("new-build floor-heating verdict missing");
        if (!hasAny(answer, ["nízk", "nizk", "nízkoteplot", "nizkoteplot"])) failures.push("low-temperature reason missing");
        if (hasAny(answer, ["rozpočet", "rozpocet", "ročná spotreba", "rocna spotreba"])) failures.push("asked forbidden budget or annual-consumption question");
      }
      if (turnIndex === 2) {
        if (!hasAll(slots, ["5"]) || !hasAny(slots, ["wants_cooling true", "chladen"])) failures.push(`storedSlots missing occupants/cooling: ${JSON.stringify(body.debug?.storedSlots || {})}`);
        if (!hasAll(query, ["novostavba", "120", "podlah", "5", "chladen"])) failures.push(`retrieval query not enriched enough: ${query}`);
        if (!hasAny(answer, ["zásobník", "zasobnik", "TÚV", "TUV", "teplá voda", "tepla voda"])) failures.push("answer lacks hot-water/storage direction");
        if (!hasAny(answer, ["rosný", "rosny", "limity", "fancoil", "stropné", "stropne", "klimatizácia", "klimatizacia"])) failures.push("answer lacks careful cooling caveat");
        if (!hasAny(answer, ["S2125", "aroTHERM"])) failures.push("closure should mention concrete portfolio options");
        if (!hasAny(answer, ["konzult", "stretn", "nacen", "nacenenie"])) failures.push("closure should move to consultation/pricing CTA");
        if (hasAny(answer, ["posli projekt", "poĹˇli projekt", "energeticky certifikat", "energetickĂ˝ certifikĂˇt", "tepelnu stratu", "tepelnĂş stratu"])) failures.push("closure should not ask for project/certificate/heat loss");
        if (body.debug?.answerMode === "general_chat") failures.push("short stateful answer fell into general_chat");
      }
      return failures;
    },
  },
  {
    id: "greeting_tc_then_old_radiators",
    title: "Pozdrav + TČ + starší dom radiátory",
    messages: ["Ahoj, chcem tč", "Starší 140m radiatory"],
    check(turnIndex, body) {
      const failures = commonChecks(body);
      const answer = body.answer || "";
      const slots = slotText(body);
      if (turnIndex === 0) {
        if (body.debug?.serviceType !== "heat_pump") failures.push(`expected heat_pump from TČ, got ${body.debug?.serviceType || "missing"}`);
        if (hasAny(slots, ["location ahoj"])) failures.push(`greeting stored as location: ${JSON.stringify(body.debug?.storedSlots || {})}`);
        if (!hasAny(answer, ["vzduch-voda", "radiatory", "podlahove kurenie"])) failures.push("initial TČ answer lacks useful qualification direction");
      }
      if (turnIndex === 1) {
        if (body.debug?.serviceType !== "heat_pump") failures.push(`expected heat_pump, got ${body.debug?.serviceType || "missing"}`);
        if (body.debug?.serviceIntent !== "recommendation") failures.push(`expected recommendation, got ${body.debug?.serviceIntent || "missing"}`);
        if (!hasAll(slots, ["rekon", "140", "radi"])) failures.push(`storedSlots missing older house/radiators: ${JSON.stringify(body.debug?.storedSlots || {})}`);
        if (hasAny(slots, ["location ahoj"])) failures.push(`greeting leaked into slots: ${JSON.stringify(body.debug?.storedSlots || {})}`);
        if (!hasAll(answer, ["vzduch-voda", "radiator"])) failures.push("older radiator verdict missing");
        if (hasAny(answer, ["urcil vhodnu sluzbu", "riesis kurenie chladenie vetranie servis alebo dotaciu"])) failures.push("generic service fallback leaked");
      }
      return failures;
    },
  },
  {
    id: "old_house_radiators_gas_closure",
    title: "Starsi dom + radiatory + plyn + closure",
    messages: ["Ahoj, chcem tc", "Starsi 140m radiatory", "plynovy kotol", "co odporucate?"],
    check(turnIndex, body) {
      const failures = commonChecks(body);
      const answer = body.answer || "";
      const slots = slotText(body);
      if (turnIndex === 1) {
        if (!hasAll(slots, ["rekon", "140", "radi"])) failures.push(`storedSlots missing older house/radiators: ${JSON.stringify(body.debug?.storedSlots || {})}`);
        if (!hasAll(answer, ["vzduch-voda", "radiator"])) failures.push("older radiator verdict missing");
        if (hasAny(answer, ["urcil vhodnu sluzbu", "riesis kurenie chladenie vetranie servis alebo dotaciu"])) failures.push("generic service fallback leaked");
      }
      if (turnIndex === 2) {
        if (!hasAny(slots, ["plyn"])) failures.push(`storedSlots missing gas boiler: ${JSON.stringify(body.debug?.storedSlots || {})}`);
        if (!hasAll(answer, ["vzduch-voda", "radiator"])) failures.push("gas boiler replacement verdict missing");
      }
      if (turnIndex === 3) {
        if (body.debug?.answerMode !== "recommendation_closure") failures.push(`expected recommendation_closure, got ${body.debug?.answerMode || "missing"}`);
        if (!hasAny(answer, ["aroTHERM", "S2125", "NIBE", "Vaillant"])) failures.push("radiator closure should mention concrete portfolio options");
        if (!hasAny(answer, ["konzult", "stretn", "nacen", "nacenenie"])) failures.push("radiator closure should move to consultation/pricing");
        if (hasAny(answer, ["riesis kurenie chladenie vetranie servis alebo dotaciu", "posli projekt", "tepelnu stratu", "energeticky certifikat"])) failures.push("radiator closure leaked generic fallback or extra document request");
      }
      return failures;
    },
  },
  {
    id: "old_house_radiators_wood",
    title: "Starší dom + radiátory + drevo",
    messages: ["ahoj, ake cerpadlo je najlepsie?", "starsi dom, 150m, mame radiatory", "kotol mame drevom a netusim, mam vlastne drevo", "4m, zateplene vsetko"],
    check(turnIndex, body) {
      const failures = commonChecks(body);
      const answer = body.answer || "";
      const slots = slotText(body);
      const query = queryText(body);
      if (turnIndex === 1) {
        if (!hasAll(slots, ["rekon", "150", "radi"])) failures.push(`storedSlots missing older house/radiators: ${JSON.stringify(body.debug?.storedSlots || {})}`);
        if (!hasAll(answer, ["vzduch-voda", "radi"])) failures.push("radiator-system verdict missing");
      }
      if (turnIndex === 2) {
        if (!hasAny(slots, ["tuhé palivo", "tuhe palivo", "drevo"])) failures.push(`current heating wood/solid fuel missing: ${JSON.stringify(body.debug?.storedSlots || {})}`);
        if (!hasAny(slots, ["annual_consumption_unknown true", "rocna spotreba nie je znama"])) failures.push("annual consumption unknown missing");
        if (!hasAll(query, ["radi", "drevo"]) && !hasAll(query, ["radi", "tuhe palivo"])) failures.push(`retrieval query lost radiator/wood context: ${query}`);
        if (!hasAll(answer, ["vzduch-voda", "radi"]) || !hasAny(answer, ["drevo", "tuhé palivo", "tuhe palivo"])) failures.push("wood replacement verdict missing");
        if (!hasAny(answer, ["zateplen", "akumula", "teplá voda", "tepla voda", "koľko dreva", "kolko dreva"])) failures.push("answer lacks useful replacement follow-up");
      }
      if (turnIndex === 3) {
        if (body.debug?.answerMode !== "recommendation_closure") failures.push(`expected recommendation_closure, got ${body.debug?.answerMode || "missing"}`);
        if (body.debug?.closureGateTriggered !== true) failures.push("closureGateTriggered should be true");
        if (!body.debug?.closureReason) failures.push("closureReason missing");
        if ((body.debug?.recommendationOptions || []).length < 2) failures.push("recommendationOptions should contain at least 2 options");
        if (!hasAny(answer, ["najlepší smer", "najlepsi smer", "uzavrel"])) failures.push("closure answer lacks best-direction wording");
        if (!hasAll(answer, ["vzduch-voda", "radi"])) failures.push("closure answer lacks heat pump/radiator direction");
        if (!hasAny(answer, ["hlavný zdroj", "hlavny zdroj"]) || !hasAny(answer, ["hybrid", "ponechaný kotol", "ponechany kotol"])) failures.push("closure answer lacks two expected options");
        if (hasAny(answer, ["bude ekonomicky výhodnejšie", "bude ekonomicky vyhodnejsie", "garantovanú úsporu", "garantovanu usporu"])) failures.push("closure answer guarantees savings");
        if (!hasAny(answer, ["konzult", "stretn", "nacen", "nacenenie", "cenovú ponuku", "cenovu ponuku", "dohodnúť obhliadku", "dohodnut obhliadku"])) failures.push("closure answer lacks consultation/pricing CTA");
        if (questionCount(answer) > 2) failures.push(`closure asks too many questions: ${questionCount(answer)}`);
      }
      return failures;
    },
  },
  {
    id: "tc_brand_then_new_build_closure",
    title: "TČ skratka + kvalifikacia uzavrie odporucanie",
    messages: ["aké máte tč?", "novostavbu 120m", "podlahovku", "5 osob, áno plánujem"],
    check(turnIndex, body) {
      const failures = commonChecks(body);
      const answer = body.answer || "";
      const slots = slotText(body);
      if (turnIndex === 0) {
        if (body.debug?.serviceType !== "heat_pump") failures.push(`expected heat_pump from tč, got ${body.debug?.serviceType || "missing"}`);
        if (body.debug?.answerMode !== "brand_model_answer") failures.push(`expected brand_model_answer, got ${body.debug?.answerMode || "missing"}`);
        if (!hasAll(answer, ["NIBE", "Vaillant"])) failures.push("TČ brand answer should mention safe portfolio");
      }
      if (turnIndex === 1) {
        if (body.debug?.serviceType !== "heat_pump") failures.push(`expected heat_pump after new-build reply, got ${body.debug?.serviceType || "missing"}`);
        if (body.debug?.serviceIntent !== "recommendation") failures.push(`expected recommendation after qualification reply, got ${body.debug?.serviceIntent || "missing"}`);
        if (!hasAll(slots, ["novostavba", "120"])) failures.push(`storedSlots missing new-build/area: ${JSON.stringify(body.debug?.storedSlots || {})}`);
        if (body.debug?.answerMode === "brand_model_answer") failures.push("qualification reply should not stay in brand_model_answer");
      }
      if (turnIndex === 2) {
        if (!hasAny(slots, ["podlah"])) failures.push(`storedSlots missing floor heating: ${JSON.stringify(body.debug?.storedSlots || {})}`);
        if (body.debug?.answerMode === "brand_model_answer" || body.debug?.answerMode === "general_chat") failures.push(`bad answerMode during qualification: ${body.debug?.answerMode || "missing"}`);
      }
      if (turnIndex === 3) {
        if (body.debug?.answerMode !== "recommendation_closure") failures.push(`expected recommendation_closure, got ${body.debug?.answerMode || "missing"}`);
        if (body.debug?.closureGateTriggered !== true) failures.push("closureGateTriggered should be true");
        if (!hasAny(answer, ["S2125", "aroTHERM"])) failures.push("closure should include concrete portfolio options");
        if (!hasAny(answer, ["konzult", "stretn", "nacen", "nacenenie"])) failures.push("closure should move to consultation/pricing");
        if (hasAny(answer, ["kolko osob", "koľko osôb", "projekt", "energeticky certifikat", "tepelnu stratu", "tepelnú stratu"])) failures.push("closure asked another qualification question");
      }
      return failures;
    },
  },
  {
    id: "air_conditioning_two_rooms",
    title: "Klimatizácia do dvoch miestností",
    messages: ["chcem klimatizaciu do obyvacky a spalne"],
    check(_turnIndex, body) {
      const failures = commonChecks(body);
      if (body.debug?.serviceType !== "air_conditioning") failures.push(`expected air_conditioning, got ${body.debug?.serviceType || "missing"}`);
      if (!hasAny(body.answer, ["samostatné jednotky", "samostatne jednotky", "multisplit", "multi-split", "single-split"])) failures.push("AC direction missing");
      if (!hasAny(body.answer, ["plocha", "m2", "vonkajšia jednotka", "vonkajsia jednotka"])) failures.push("AC follow-up missing");
      return failures;
    },
  },
  {
    id: "fast_topic_switch_heat_pump_to_cooling",
    title: "Rychly prechod z TC na chladenie a klimy",
    messages: ["ake tc predavate?", "ake chladenia mate?", "ake mate klimy?"],
    check(turnIndex, body) {
      const failures = commonChecks(body);
      const answer = normalize(body.answer || "");
      if (turnIndex === 0) {
        if (body.debug?.serviceType !== "heat_pump") failures.push(`expected heat_pump, got ${body.debug?.serviceType || "missing"}`);
        if (body.debug?.answerMode !== "brand_model_answer") failures.push(`expected brand_model_answer, got ${body.debug?.answerMode || "missing"}`);
      }
      if (turnIndex === 1) {
        if (body.debug?.serviceType !== "air_conditioning") failures.push(`expected air_conditioning after cooling switch, got ${body.debug?.serviceType || "missing"}`);
        if (!hasAny(answer, ["klimatiz", "multisplit", "stropne chladen"])) failures.push("cooling switch answer lacks cooling options");
        if (hasAll(answer, ["nibe", "vaillant"]) && hasAny(answer, ["tepelne cerpadl"])) failures.push("cooling switch leaked heat-pump brand answer");
      }
      if (turnIndex === 2) {
        if (body.debug?.serviceType !== "air_conditioning") failures.push(`expected air_conditioning for klimy, got ${body.debug?.serviceType || "missing"}`);
        if (!hasAny(answer, ["klimatiz", "miestnost", "multisplit", "vonkajsia jednotka"])) failures.push("klimy answer lacks air-conditioning direction");
        if (hasAll(answer, ["nibe", "vaillant"]) && hasAny(answer, ["tepelne cerpadl"])) failures.push("klimy answer leaked heat-pump brand answer");
      }
      return failures;
    },
  },
  {
    id: "heat_recovery_new_build",
    title: "Rekuperácia v novostavbe",
    messages: ["staviam dom a chcem lepsi vzduch bez otvarania okien"],
    check(_turnIndex, body) {
      const failures = commonChecks(body);
      if (!["heat_recovery", "complex_solution"].includes(body.debug?.serviceType || "")) failures.push(`expected heat_recovery or complex_solution, got ${body.debug?.serviceType || "missing"}`);
      if (!hasAny(body.answer, ["rekuper", "vetran"])) failures.push("recovery direction missing");
      if (!hasAny(body.answer, ["projekt", "celý dom", "cely dom"])) failures.push("recovery project/whole-house follow-up missing");
      return failures;
    },
  },
  {
    id: "nibe_service_fault",
    title: "NIBE servisná chyba",
    messages: ["tepelne cerpadlo NIBE mi hlasi chybu"],
    check(_turnIndex, body) {
      const failures = commonChecks(body);
      if (body.debug?.serviceType !== "service") failures.push(`expected service, got ${body.debug?.serviceType || "missing"}`);
      if (body.debug?.serviceIntent !== "service_fault") failures.push(`expected service_fault, got ${body.debug?.serviceIntent || "missing"}`);
      if (!hasAny(body.answer, ["model", "štítok", "stitok"]) || !hasAny(body.answer, ["chybový kód", "chybovy kod", "chybu"])) failures.push("service data request missing");
      if (hasAny(body.answer, ["servisujeme aj cudzie montáže", "servisujeme aj cudzie montaze"])) failures.push("unconfirmed third-party service claim");
      return failures;
    },
  },
  {
    id: "subsidy",
    title: "Dotácie",
    messages: ["pomozete mi s dotaciou?"],
    check(_turnIndex, body) {
      const failures = commonChecks(body);
      if (body.debug?.serviceType !== "subsidy") failures.push(`expected subsidy, got ${body.debug?.serviceType || "missing"}`);
      if (!hasAny(body.answer, ["pomôcť", "pomoct", "asist", "nasmer"])) failures.push("subsidy assistance wording missing");
      if (hasAny(body.answer, ["kompletne vybavíme", "kompletne vybavime", "odpočítame", "odpocitame"])) failures.push("unconfirmed subsidy claim");
      return failures;
    },
  },
  {
    id: "direct_brand_price_regression",
    title: "Priame otazky na znacky, modely a ceny",
    messages: [
      "potreboval by som vybrat tepelne cerpadlo",
      "mam starsi dom, radiatory a chcem usetrit",
      "dom ma asi 120m",
      "a znacka?",
      "cize geotherm robi aj Daikin?",
      "mne povedali ze robia iba NIBE a vaillant",
      "ake mate Vaillant?",
      "a split?",
      "F2040 uz sa nevyraba",
      "A F2050?",
      "ake su ceny vratane instalacie",
      "7tis je asi malo nie?",
      "potrebujem akumulacku, ci aj ta je v cene?",
      "z coho?",
    ],
    check(turnIndex, body) {
      const failures = commonChecks(body);
      const answer = body.answer || "";
      if (turnIndex <= 2) {
        if (body.debug?.serviceType !== "heat_pump") failures.push(`expected heat_pump, got ${body.debug?.serviceType || "missing"}`);
        if (hasAny(answer, ["Strucne k otazke", "Co z toho chces upresnit ako prve"])) failures.push("old weak fallback leaked into qualification");
      }
      if (turnIndex === 3) {
        if (body.debug?.answerMode !== "brand_model_answer") failures.push(`expected brand_model_answer, got ${body.debug?.answerMode || "missing"}`);
        if (body.debug?.directAnswerGateTriggered !== true) failures.push("directAnswerGateTriggered should be true for brand question");
        if (body.debug?.directAnswerComposedByLlm !== true) failures.push("brand answer should be composed by LLM, not router direct text");
        if (body.debug?.directAnswerFallbackUsed === true) failures.push("brand answer used deterministic direct fallback");
        if (!hasAll(answer, ["NIBE", "Vaillant"])) failures.push("brand answer should safely mention NIBE and Vaillant");
        if (body.debug?.closureGateTriggered === true) failures.push("closure gate should not override brand question");
      }
      if (turnIndex === 4) {
        if (body.debug?.answerMode !== "brand_model_answer") failures.push(`expected brand_model_answer for Daikin, got ${body.debug?.answerMode || "missing"}`);
        if (!hasAny(answer, ["bezpecne netvrdil", "netvrdil", "overit", "potvrdit", "potvrdenie", "aktualnej ponuky", "nekomunikoval", "nekomunikujeme", "nie je sucastou", "standardne sucastou", "nie je standardne", "nie je znacka", "bezne ponukame", "nepotvrd"])) failures.push("Daikin answer should be cautious");
        if (hasAny(answer, ["spolupracuje aj so znackou Daikin", "ponukame aj Daikin"])) failures.push("Daikin falsely confirmed as heat-pump portfolio");
      }
      if (turnIndex === 5) {
        if (body.debug?.answerMode !== "correction_answer") failures.push(`expected correction_answer for portfolio correction, got ${body.debug?.answerMode || "missing"}`);
        if (!hasAll(answer, ["NIBE", "Vaillant"])) failures.push("correction should restate safe portfolio");
      }
      if (turnIndex === 6 || turnIndex === 7) {
        if (body.debug?.answerMode !== "brand_model_answer") failures.push(`expected brand_model_answer, got ${body.debug?.answerMode || "missing"}`);
        if (!hasAny(answer, ["Vaillant", "aroTHERM", "Split"])) failures.push("Vaillant/split direct answer missing");
        if (hasAny(answer, ["najlepsi model je", "najlepsi je"])) failures.push("model presented as final best choice");
      }
      if (turnIndex === 8) {
        if (body.debug?.answerMode !== "correction_answer") failures.push(`expected correction_answer for F2040, got ${body.debug?.answerMode || "missing"}`);
        if (!hasAny(answer, ["nemal ponukat", "nemal by som", "archiv", "historick", "uz pre nove instalacie nevyraba", "nevyraba"])) failures.push("F2040 correction missing obsolete/archive wording");
      }
      if (turnIndex === 9) {
        if (body.debug?.answerMode !== "brand_model_answer") failures.push(`expected brand_model_answer for F2050, got ${body.debug?.answerMode || "missing"}`);
        if (!hasAny(answer, ["nemam potvrdeny", "nemame", "nie je potvrden", "overit", "nebudem vymyslat"])) failures.push("F2050 answer should avoid unconfirmed facts");
        if (hasAny(answer, ["vysokovykonne", "vysoko vykonne", "vybornu ucinnost", "pokrocila regulacia"])) failures.push("F2050 unconfirmed parameters leaked");
      }
      if (turnIndex === 10 || turnIndex === 11 || turnIndex === 12 || turnIndex === 13) {
        if (body.debug?.answerMode !== "price_answer") failures.push(`expected price_answer, got ${body.debug?.answerMode || "missing"}`);
        if (body.debug?.directAnswerGateTriggered !== true) failures.push("directAnswerGateTriggered should be true for price question");
        if (body.debug?.directAnswerComposedByLlm !== true) failures.push("price answer should be composed by LLM, not router direct text");
        if (hasAny(answer, ["7 000 eur do 12 000 eur", "7000 eur do 12000 eur", "ano akumulacna nadrz je v cene", "je automaticky zahrnuta"])) failures.push("unconfirmed price/scope claim leaked");
      }
      if (turnIndex === 12) {
        if (!hasAny(answer, ["neviem potvrdit", "nie je bezpecne tvrdit", "konkretnej ponuke", "nie je automaticky", "zavisi od konkretneho navrhu", "overit co presne"])) failures.push("buffer tank price scope should be cautious");
      }
      if (turnIndex === 13) {
        if (!hasAny(answer, ["cena zariadenia", "samotne tepelne cerpadlo", "kompletnej realizacie", "kompletna realizacia", "co presne ponuka obsahuje", "co presne obsahuje"])) failures.push("price basis answer missing scope explanation");
      }
      return failures;
    },
  },
  {
    id: "direct_answer_clarification",
    title: "Priama odpoved ostava AI a otaznik sa nerecykluje",
    messages: ["ahoj, ake TC mate?", "?"],
    check(turnIndex, body, turns) {
      const failures = commonChecks(body);
      const answer = body.answer || "";
      if (body.debug?.directAnswerGateTriggered !== true) failures.push("direct answer gate should trigger");
      if (turnIndex === 0) {
        if (body.debug?.directAnswerComposedByLlm !== true) failures.push("direct answer should be composed by LLM");
        if (body.debug?.directAnswerFallbackUsed === true) failures.push("direct answer used deterministic fallback");
        if (body.debug?.answerMode !== "brand_model_answer") failures.push(`expected brand_model_answer, got ${body.debug?.answerMode || "missing"}`);
        if (!hasAll(answer, ["NIBE", "Vaillant"])) failures.push("brand answer should mention NIBE and Vaillant");
        if (!hasAny(answer, ["novostav", "starsi dom", "starší dom", "radiator", "radiátor", "podlahov", "vybrat", "výber"])) failures.push("brand answer should offer follow-up for selecting a suitable heat pump");
      }
      if (turnIndex === 1) {
        if (body.debug?.answerMode !== "direct_answer") failures.push(`expected direct_answer for clarification, got ${body.debug?.answerMode || "missing"}`);
        if (!hasAny(answer, ["myslel", "upresn", "NIBE", "Vaillant"])) failures.push("clarification should explain previous answer");
        if (turns[0]?.response.answer && normalize(turns[0].response.answer) === normalize(answer)) failures.push("clarification repeated the same answer verbatim");
      }
      return failures;
    },
  },
  {
    id: "live_carryover_regression",
    title: "Cena a znacky sa neprenasaju do dalsich otazok",
    messages: ["Ahoj, chcem tc", "Starsi 140m radiatory", "chcem Vaillant ale mam NIBE", "daj mi presnu cenu", "opravite to alebo treba montaz?", "ahoj", "cena?"],
    check(turnIndex, body) {
      const failures = commonChecks(body);
      const answer = body.answer || "";
      if (body.debug?.llmUsed !== true) failures.push("turn should use LLM");
      if (turnIndex === 0) {
        if (body.debug?.serviceType !== "heat_pump") failures.push(`expected heat_pump, got ${body.debug?.serviceType || "missing"}`);
        if (body.debug?.fallbackUsed === true) failures.push("initial TC turn should not use fallback");
      }
      if (turnIndex === 1) {
        if (body.debug?.serviceIntent !== "recommendation") failures.push(`expected recommendation, got ${body.debug?.serviceIntent || "missing"}`);
        if (!hasAll(slotText(body), ["140", "radi"])) failures.push(`radiator slots missing: ${JSON.stringify(body.debug?.storedSlots || {})}`);
        if (!hasAll(answer, ["vzduch-voda", "radiator"])) failures.push("older radiator verdict missing");
      }
      if (turnIndex === 2) {
        if (body.debug?.answerMode !== "brand_model_answer") failures.push(`expected brand_model_answer, got ${body.debug?.answerMode || "missing"}`);
        if (!hasAll(answer, ["NIBE", "Vaillant"])) failures.push("NIBE/Vaillant answer missing");
      }
      if (turnIndex === 3) {
        if (body.debug?.answerMode !== "price_answer") failures.push(`expected price_answer, got ${body.debug?.answerMode || "missing"}`);
        if (body.debug?.serviceIntent !== "price") failures.push(`expected price intent, got ${body.debug?.serviceIntent || "missing"}`);
        if (!hasAny(answer, ["ponuk", "realizac", "montaz", "instalac"])) failures.push("price scope answer missing");
      }
      if (turnIndex === 4) {
        if (body.debug?.answerMode === "price_answer") failures.push("repair/install question stayed in price_answer");
        if (body.debug?.serviceIntent === "price") failures.push("repair/install question stayed in price intent");
        if (!hasAny(answer, ["oprava", "servis", "montaz", "existujuce", "nove riesenie"])) failures.push("repair/install distinction missing");
        if (hasAny(answer, ["predchadzajucej odpovedi", "cenu zariadenia", "kompletnej realizacie"])) failures.push("old price answer leaked into repair/install turn");
      }
      if (turnIndex === 5) {
        if (body.debug?.answerMode !== "general_chat") failures.push(`expected general_chat for greeting, got ${body.debug?.answerMode || "missing"}`);
        if ((body.sources || []).length !== 0 || (body.debug?.retrievalSourcesCount || 0) !== 0) failures.push("greeting should not use RAG sources");
        if (body.debug?.serviceIntent === "price" || body.debug?.answerMode === "price_answer") failures.push("greeting inherited price context");
      }
      if (turnIndex === 6) {
        if (body.debug?.answerMode !== "price_answer") failures.push(`expected price_answer after service/small-talk context, got ${body.debug?.answerMode || "missing"}`);
        if (body.debug?.serviceIntent !== "price") failures.push(`expected price intent after service/small-talk context, got ${body.debug?.serviceIntent || "missing"}`);
        if (body.debug?.answerMode === "service_fault_triage") failures.push("price question inherited service_fault context");
      }
      return failures;
    },
  },
];

async function runScenario(endpoint: string, scenario: Scenario): Promise<Turn[]> {
  const anonymousId = `diagnostic_${scenario.id}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const turns: Turn[] = [];
  for (let index = 0; index < scenario.messages.length; index += 1) {
    const message = scenario.messages[index];
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "http://localhost:5173" },
      body: JSON.stringify({
        siteId: "geotherm",
        anonymousId,
        currentUrl: "http://localhost/diagnostic-test",
        message,
      }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status} in ${scenario.id} turn ${index + 1}`);
    const body = (await response.json()) as ChatBody;
    const failures = scenario.check(index, body, turns);
    turns.push({ scenario: scenario.id, message, response: body, failures });
  }
  return turns;
}

async function main(): Promise<void> {
  const configuredEndpoint = process.env.CHAT_TEST_ENDPOINT || "";
  const server = configuredEndpoint ? null : await startChatServer({ port: 0 });
  const address = server?.address();
  const port = typeof address === "object" && address ? address.port : 0;
  const endpoint = configuredEndpoint || `http://127.0.0.1:${port}/chat`;
  const allTurns: Turn[] = [];

  try {
    for (const scenario of scenarios) {
      allTurns.push(...(await runScenario(endpoint, scenario)));
    }
  } finally {
    if (server) await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }

  const failedTurns = allTurns.filter((turn) => turn.failures.length);
  const lines = [
    "# Diagnostic Conversation Test Report",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Endpoint: ${endpoint}`,
    "",
    `Verdict: ${failedTurns.length === 0 ? "PASS" : "FAIL"}`,
    `Failed turns: ${failedTurns.length}/${allTurns.length}`,
    "",
  ];

  for (const scenario of scenarios) {
    lines.push(`## ${scenario.title}`);
    lines.push("");
    for (const [index, turn] of allTurns.filter((item) => item.scenario === scenario.id).entries()) {
      lines.push(`### Turn ${index + 1}`);
      lines.push("");
      lines.push(`User: ${turn.message}`);
      lines.push(`Pass: ${turn.failures.length ? "no" : "yes"}`);
      if (turn.failures.length) lines.push(`Failures: ${turn.failures.join("; ")}`);
      lines.push(`responseTimeMs: ${turn.response.responseTimeMs ?? "n/a"}`);
      lines.push(`answerMode: ${turn.response.debug?.answerMode || "n/a"}`);
      lines.push(`serviceType: ${turn.response.debug?.serviceType || "n/a"}`);
      lines.push(`serviceIntent: ${turn.response.debug?.serviceIntent || "n/a"}`);
      lines.push(`sourcesCount: ${turn.response.debug?.retrievalSourcesCount ?? turn.response.sources?.length ?? 0}`);
      lines.push(`fallbackType: ${turn.response.debug?.fallbackType ?? "n/a"}`);
      lines.push(`questionRoundsCount: ${turn.response.debug?.questionRoundsCount ?? "n/a"}`);
      lines.push(`closureGateTriggered: ${turn.response.debug?.closureGateTriggered ?? "n/a"}`);
      lines.push(`closureReason: ${turn.response.debug?.closureReason ?? "n/a"}`);
      lines.push(`recommendationOptions: ${JSON.stringify(turn.response.debug?.recommendationOptions || [])}`);
      lines.push(`remainingCriticalUnknowns: ${JSON.stringify(turn.response.debug?.remainingCriticalUnknowns || [])}`);
      lines.push(`validatorsTriggered: ${(turn.response.debug?.validatorsTriggered || []).join(", ") || "none"}`);
      lines.push(`retrievalQuery: ${turn.response.debug?.retrievalQuery || "n/a"}`);
      lines.push(`enrichedRetrievalQuery: ${turn.response.debug?.enrichedRetrievalQuery || "n/a"}`);
      lines.push(`storedSlots: ${JSON.stringify(turn.response.debug?.storedSlots || {})}`);
      lines.push(`newlyExtractedSlots: ${JSON.stringify(turn.response.debug?.newlyExtractedSlots || {})}`);
      lines.push(`flow: ${turn.response.debug?.diagnosticFlowVersion || "n/a"} @ ${turn.response.debug?.serverCommit || "n/a"}`);
      lines.push("");
      lines.push(turn.response.answer);
      lines.push("");
    }
  }

  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, lines.join("\n"), "utf8");
  await writeFile(
    jsonPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        endpoint,
        verdict: failedTurns.length === 0 ? "PASS" : "FAIL",
        failedTurns: failedTurns.length,
        totalTurns: allTurns.length,
        turns: allTurns,
      },
      null,
      2,
    ),
    "utf8",
  );
  console.log(`Diagnostic conversation tests: ${allTurns.length - failedTurns.length}/${allTurns.length} passed`);
  console.log(`Saved ${reportPath}`);
  console.log(`Saved ${jsonPath}`);
  if (failedTurns.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
