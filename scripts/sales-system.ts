import { type RetrievalResult } from "./local-retrieval";

export type SalesIntent =
  | "quote"
  | "service"
  | "subsidy"
  | "product"
  | "installation"
  | "noise"
  | "contact"
  | "greeting"
  | "irrelevant"
  | "unknown";

export type AssistantMode = "informative" | "advisory" | "soft_handoff_offer" | "contact_requested" | "lead_captured";

export type QualificationState = {
  assistant_mode?: AssistantMode;
  relevant_turns?: number;
  service_type?: string;
  service_intent?: string;
  project_type?: string;
  property_type?: string;
  area_m2?: number;
  location?: string;
  timeline?: string;
  current_heating?: string;
  heating_distribution?: string;
  wants_cooling?: boolean;
  hot_water?: boolean;
  occupants?: number;
  insulation?: string;
  annual_consumption?: string;
  annual_consumption_unknown?: boolean;
  own_wood?: boolean;
  qualification_question_rounds?: number;
  recommendation_closure_offered?: boolean;
  project_available?: boolean;
  heat_loss_known?: boolean;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  declined_contact?: boolean;
  contact_consent?: boolean;
  soft_handoff_offered?: boolean;
  last_asked_question?: string;
};

export type ContactInfo = {
  name?: string;
  email?: string;
  phone?: string;
};

export type LeadDecision = {
  shouldAsk: boolean;
  nextQuestion: string | null;
  mode: AssistantMode;
  isContactRequest: boolean;
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9@+.\s-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesAny(haystack: string, terms: string[]): boolean {
  return terms.some((term) => haystack.includes(term));
}

function hasToken(haystack: string, token: string): boolean {
  return haystack.split(/\s+/).includes(token);
}

function isRelevantIntent(intent: SalesIntent): boolean {
  return intent !== "irrelevant" && intent !== "unknown";
}

export function detectIntent(message: string, results: RetrievalResult[]): SalesIntent {
  const text = normalize(message);
  const sourceText = normalize(
    results
      .slice(0, 3)
      .map((result) => `${result.chunk.pageTitle} ${result.chunk.sectionHeading} ${result.chunk.url}`)
      .join(" "),
  );
  const combined = `${text} ${sourceText}`;
  const asksProductOrModel =
    includesAny(text, [
      "tepelne cerpadlo",
      "tepelne cerpadla",
      "cerpadlo",
      "cerpadla",
      "vybrat",
      "vyber",
      "model",
      "presny model",
      "ake mate",
      "ake ponukate",
      "typy",
      "znack",
      "nibe",
      "vaillant",
      "daikin",
      "ariston",
      "viessmann",
      "monoblok",
      "split",
    ]) || hasToken(text, "tc");
  const asksSubsidy =
    includesAny(text, ["dotacia", "dotacie", "prispevok", "poukazka", "zelena domacnostiam"]) || hasToken(text, "oze");
  const combinedHintsSubsidy =
    includesAny(combined, ["dotacia", "dotacie", "prispevok", "poukazka", "zelena domacnostiam"]) || hasToken(combined, "oze");

  if (includesAny(text, ["pocasie", "auto", "hypotek", "gulas", "futbal", "akcie", "bitcoin"])) return "irrelevant";
  if (
    includesAny(text, [
      "cenova ponuka",
      "cenovu ponuku",
      "ponuku",
      "cenu",
      "cena",
      "cennik",
      "kolko stoji",
      "naklady",
      "rozpocet",
      "navratnost",
      "usetr",
      "ucty",
      "spotreb",
      "zere",
      "elektrin",
    ])
  )
    return "quote";
  if (includesAny(text, ["hluk", "hlucnost", "hlucne", "hlucny", "hucat", "huci", "tichy", "tiche", "akusticky", "pod oknom"])) return "noise";
  if (includesAny(text, ["montaz", "instalacia", "realizacia", "osadenie", "zapojenie"])) return "installation";
  if (asksProductOrModel) return "product";
  if (includesAny(text, ["nibe", "vaillant", "daikin", "ariston", "viessmann", "znack", "monoblok", "split"])) return "product";
  if (
    includesAny(text, [
      "podorys",
      "projekt",
      "navrh",
      "poradit",
      "od zaciatku",
      "nevyznam",
      "neviem co potrebujem",
      "vediet aby",
      "vedeli poradit",
      "vhodne pre moj dom",
      "moj dom",
      "bez plynu",
      "kurenie",
      "vykurovanie",
    ])
  )
    return "product";
  if (includesAny(text, ["kontakt", "kontaktujem", "telefon", "email", "adresa", "zavolat", "kontaktovat"])) return "contact";
  if (includesAny(text, ["servis", "udrzba", "revizia", "kontrola", "prehliadka", "porucha", "chyba", "oprava", "kazit"])) return "service";
  if (asksSubsidy) return "subsidy";
  if (includesAny(combined, ["kontakt", "telefon", "email", "adresa", "zavolat", "kontaktovat"])) return "contact";
  if (includesAny(combined, ["servis", "udrzba", "revizia", "kontrola", "prehliadka"])) return "service";
  if (includesAny(combined, ["cenova ponuka", "cena", "cennik", "kolko stoji", "naklady", "rozpocet"])) return "quote";
  if (includesAny(combined, ["montaz", "instalacia", "realizacia", "osadenie", "zapojenie"])) return "installation";
  if (includesAny(combined, ["hluk", "hlucnost", "hlucne", "hlucny", "tichy", "tiche", "akusticky"])) return "noise";
  if (includesAny(combined, ["nibe", "vaillant", "tepelne cerpadlo", "rekuperacia", "fotovoltaika", "podlahove", "stropne", "chladenie", "radiator", "cop", "zem voda", "vzduch voda"])) return "product";
  if (combinedHintsSubsidy) return "subsidy";
  return "unknown";
}

export function extractContact(message: string): ContactInfo {
  const email = message.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
  const phone = message.match(/(?:\+421\s*)?(?:0\s*)?\d{3}[\s.-]?\d{3}[\s.-]?\d{3}/)?.[0]?.replace(/\s+/g, " ");
  const nameMatch = message.match(
    /(?:volam sa|volám sa|meno je|som)\s+([A-ZÁÄČĎÉÍĽĹŇÓÔŔŠŤÚÝŽ][a-záäčďéíľĺňóôŕšťúýž]+(?:\s+[A-ZÁÄČĎÉÍĽĹŇÓÔŔŠŤÚÝŽ][a-záäčďéíľĺňóôŕšťúýž]+)?)/iu,
  );
  return {
    email,
    phone,
    name: nameMatch?.[1],
  };
}

function hasStrongInterestSignal(normalized: string, intent: SalesIntent): boolean {
  return (
    intent === "quote" ||
    intent === "service" ||
    intent === "subsidy" ||
    intent === "installation" ||
    includesAny(normalized, [
      "chcem ponuku",
      "mam zaujem",
      "riesime to",
      "potrebujem",
      "chcel by som",
      "chcela by som",
      "odporucate",
      "dom",
      "byt",
      "firma",
      "zilina",
      "m2",
    ])
  );
}

function hasContactConsent(normalized: string): boolean {
  return includesAny(normalized, [
    "ano",
    "nech ma kontaktuju",
    "kontaktujte ma",
    "mozu ma kontaktovat",
    "chcem aby ma kontaktovali",
    "posunte to technikovi",
    "posunut technikovi",
  ]);
}

export function updateQualificationState(previous: QualificationState, message: string, intent: SalesIntent): QualificationState {
  const state: QualificationState = { ...previous };
  const normalized = normalize(message);
  const contact = extractContact(message);
  const relevantTurn = isRelevantIntent(intent) || hasStrongInterestSignal(normalized, intent);

  if (relevantTurn) state.relevant_turns = (state.relevant_turns || 0) + 1;
  if (contact.email) state.contact_email = contact.email;
  if (contact.phone) state.contact_phone = contact.phone;
  if (contact.name) state.contact_name = contact.name;
  if (includesAny(normalized, ["nechcem dat kontakt", "bez kontaktu", "nechcem kontakt", "zatial nie", "nie dakujem"])) {
    state.declined_contact = true;
  }
  if (hasContactConsent(normalized)) {
    state.contact_consent = true;
    state.assistant_mode = "contact_requested";
  }

  if (!state.project_type && isRelevantIntent(intent) && intent !== "contact" && intent !== "noise" && intent !== "product") {
    state.project_type =
      intent === "service"
        ? "servis"
        : intent === "subsidy"
          ? "dotácie"
          : intent === "installation"
            ? "montáž"
            : intent === "quote"
              ? "cenová ponuka"
              : intent;
  }

  if (!state.property_type) {
    if (includesAny(normalized, ["rodinny dom", "dom", "novostavba", "rekonstrukcia"])) state.property_type = "dom";
    else if (includesAny(normalized, ["firma", "podnik", "prevadzka"])) state.property_type = "firma";
    else if (includesAny(normalized, ["byt", "byte"])) state.property_type = "byt";
  }

  const area = normalized.match(/(\d{2,4})\s*(m2|m 2|metrov|m²)/)?.[1];
  if (area) state.area_m2 = Number.parseInt(area, 10);

  if (!state.location) {
    const locationMatch = message.match(/\b(?:v|vo|okolie|z|zo)\s+([A-ZÁÄČĎÉÍĽĹŇÓÔŔŠŤÚÝŽ][a-záäčďéíľĺňóôŕšťúýž]+)\b/);
    if (locationMatch) state.location = locationMatch[1];
  }

  if (!state.timeline) {
    if (includesAny(normalized, ["urgent", "hned", "co najskor", "čo najskôr"])) state.timeline = "urgent";
    else if (includesAny(normalized, ["1-3", "do 3 mes", "mesiac"])) state.timeline = "1-3 mesiace";
    else if (includesAny(normalized, ["3-6", "pol roka"])) state.timeline = "3-6 mesiacov";
    else if (includesAny(normalized, ["neskor", "neskôr", "buduci rok"])) state.timeline = "neskôr";
  }

  if (!state.current_heating) {
    if (includesAny(normalized, ["plyn", "plynovy"])) state.current_heating = "plyn";
    else if (includesAny(normalized, ["elektr", "elektrokotol"])) state.current_heating = "elektrina";
    else if (includesAny(normalized, ["drevo", "uhlie", "tuhe palivo"])) state.current_heating = "tuhé palivo";
    else if (includesAny(normalized, ["tepelne cerpadlo", "cerpadlo"])) state.current_heating = "tepelné čerpadlo";
  }

  if (state.contact_email || state.contact_phone) state.assistant_mode = "lead_captured";
  else if (!state.assistant_mode) state.assistant_mode = (state.relevant_turns || 0) <= 1 ? "informative" : "advisory";

  return state;
}

export function leadScore(state: QualificationState, intent: SalesIntent): number {
  let score = 0;
  if (state.contact_email || state.contact_phone) score += 20;
  if (state.project_type) score += 20;
  if (state.location) score += 15;
  if (state.timeline === "urgent" || state.timeline === "1-3 mesiace") score += 15;
  if (state.area_m2) score += 10;
  if (state.current_heating) score += 10;
  if (intent === "quote" || intent === "service" || intent === "subsidy") score += 10;
  return score;
}

function softHandoffQuestion(): string {
  return "Ak chcete, môžeme to posunúť technikovi/odborníkovi, aby sa pozrel na váš konkrétny prípad. Chcete, aby vás niekto kontaktoval?";
}

export function nextLeadQuestion(state: QualificationState, intent: SalesIntent, confidence: "high" | "medium" | "low"): LeadDecision {
  if (intent === "irrelevant" || intent === "unknown") {
    return { shouldAsk: false, nextQuestion: null, mode: "informative", isContactRequest: false };
  }
  if (state.declined_contact || state.contact_email || state.contact_phone) {
    return { shouldAsk: false, nextQuestion: null, mode: state.assistant_mode || "informative", isContactRequest: false };
  }

  if (state.contact_consent || state.assistant_mode === "contact_requested") {
    return {
      shouldAsk: true,
      nextQuestion: "Stačí email alebo telefón, kam sa vám môže ozvať odborník.",
      mode: "contact_requested",
      isContactRequest: true,
    };
  }

  const relevantTurns = state.relevant_turns || 0;
  const enoughContext = relevantTurns >= 4;
  if (enoughContext && !state.soft_handoff_offered) {
    return { shouldAsk: true, nextQuestion: softHandoffQuestion(), mode: "soft_handoff_offer", isContactRequest: false };
  }

  if (confidence === "low") {
    return { shouldAsk: false, nextQuestion: null, mode: "informative", isContactRequest: false };
  }

  if (intent === "noise") {
    return {
      shouldAsk: true,
      nextQuestion: "Bude čerpadlo umiestnené bližšie k obytným miestnostiam alebo skôr ďalej od domu?",
      mode: relevantTurns <= 1 ? "informative" : "advisory",
      isContactRequest: false,
    };
  }
  if ((intent === "quote" || intent === "installation" || intent === "product") && !state.property_type) {
    return {
      shouldAsk: true,
      nextQuestion: "Ide o rodinný dom, byt alebo firemný objekt?",
      mode: relevantTurns <= 1 ? "informative" : "advisory",
      isContactRequest: false,
    };
  }
  if ((intent === "quote" || intent === "installation" || intent === "product") && !state.area_m2) {
    return {
      shouldAsk: true,
      nextQuestion: "Aká je približná plocha, ktorú chcete vykurovať?",
      mode: "advisory",
      isContactRequest: false,
    };
  }
  if ((intent === "service" || intent === "subsidy") && !state.location) {
    return {
      shouldAsk: true,
      nextQuestion: "V akej lokalite to riešite?",
      mode: relevantTurns <= 1 ? "informative" : "advisory",
      isContactRequest: false,
    };
  }
  if (!state.current_heating && intent !== "subsidy" && intent !== "contact") {
    return {
      shouldAsk: true,
      nextQuestion: "Čím aktuálne kúrite?",
      mode: "advisory",
      isContactRequest: false,
    };
  }
  if (!state.timeline && (intent === "quote" || intent === "installation" || intent === "service")) {
    return {
      shouldAsk: true,
      nextQuestion: "Riešite to skôr urgentne, v najbližších mesiacoch alebo len orientačne?",
      mode: "advisory",
      isContactRequest: false,
    };
  }

  return { shouldAsk: false, nextQuestion: null, mode: "advisory", isContactRequest: false };
}

export function applyLeadDecision(state: QualificationState, decision: LeadDecision): QualificationState {
  const next: QualificationState = { ...state, assistant_mode: decision.mode };
  if (decision.mode === "soft_handoff_offer") next.soft_handoff_offered = true;
  return next;
}

export function summarizeTranscript(messages: Array<{ role: string; content: string }>): string {
  return messages
    .filter((message) => message.role !== "system")
    .slice(-6)
    .map((message) => `${message.role}: ${message.content.replace(/\s+/g, " ").slice(0, 180)}`)
    .join(" | ");
}
