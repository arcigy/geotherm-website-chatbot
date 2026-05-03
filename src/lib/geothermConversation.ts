export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type LeadStatus = "not_lead" | "soft_lead" | "qualified_lead" | "contact_requested";

export type ConversationState = {
  conversationId: string;
  language: "sk";
  createdAt: string;
  updatedAt: string;
  userProfile: {
    name: string | null;
    email: string | null;
    phone: string | null;
    location: string | null;
  };
  project: {
    type: "new_build" | "reconstruction" | null;
    houseSizeM2: number | null;
    currentHeating: string | null;
    interestedIn: string[];
    priority: "low_upfront_cost" | "long_term_savings" | "comfort" | "health_air" | "quiet_operation" | null;
    budgetSensitivity: "low" | "medium" | "high" | null;
    stage: "orientation" | "planning" | "quote_requested" | "contact_requested" | null;
  };
  lead: {
    status: LeadStatus;
    intent: "price_estimate" | "quote" | "callback" | "consultation" | "send_project" | "interested" | null;
    consentToContact: boolean;
    preferredContactMethod: "email" | "phone" | null;
  };
  conversationSummary: string;
  knownFacts: string[];
  openQuestions: string[];
  lastTopic: string | null;
  previousTopics: string[];
  lastUserIntent: string | null;
  contactRefused: boolean;
  messages: ChatMessage[];
};

const topicLabels: Record<string, string> = {
  heat_pump: "tepelné čerpadlo",
  recuperation: "rekuperácia",
  floor_heating: "podlahové kúrenie",
  ceiling_cooling: "stropné chladenie",
  cooling: "chladenie",
  subsidies: "dotácie",
  price: "cena",
  installation: "montáž",
  gas_vs_heat_pump: "plyn vs tepelné čerpadlo",
  noise: "hlučnosť",
  winter: "fungovanie v zime",
  service: "servis",
  radiators: "radiátory",
  hot_water: "teplá voda",
  photovoltaics: "fotovoltika",
};

export function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9@\s.+-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function createConversationState(): ConversationState {
  const now = new Date().toISOString();

  return {
    conversationId: crypto.randomUUID(),
    language: "sk",
    createdAt: now,
    updatedAt: now,
    userProfile: {
      name: null,
      email: null,
      phone: null,
      location: null,
    },
    project: {
      type: null,
      houseSizeM2: null,
      currentHeating: null,
      interestedIn: [],
      priority: null,
      budgetSensitivity: null,
      stage: "orientation",
    },
    lead: {
      status: "not_lead",
      intent: null,
      consentToContact: false,
      preferredContactMethod: null,
    },
    conversationSummary: "",
    knownFacts: [],
    openQuestions: [],
    lastTopic: null,
    previousTopics: [],
    lastUserIntent: null,
    contactRefused: false,
    messages: [],
  };
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function detectTopic(text: string) {
  if (/(z tych dvoch|lepsie z tych)/.test(text)) return "gas_vs_heat_pump";
  if (/(plyn|plynov).*cerpadl|cerpadl.*plyn|plyn vs/.test(text)) return "gas_vs_heat_pump";
  if (/(zim|mraz|minus|chladno)/.test(text)) return "winter";
  if (/(hluk|hluc|pocut|sused)/.test(text)) return "noise";
  if (/(rekuper|vetran|vzduch)/.test(text)) return "recuperation";
  if (/(podlahov|podlahy)/.test(text)) return "floor_heating";
  if (/(strop|chladen|klimatiz)/.test(text)) return text.includes("strop") ? "ceiling_cooling" : "cooling";
  if (/(dotac|poukaz|oze|zelena)/.test(text)) return "subsidies";
  if (/(cena|stoji|stat|nacenit|ponuk|rozpocet|najlacn)/.test(text)) return "price";
  if (/(montaz|instalac|trva|projekt)/.test(text)) return "installation";
  if (/(servis|poruch|spolahliv)/.test(text)) return "service";
  if (/(radiator)/.test(text)) return "radiators";
  if (/(tepla voda|tuv|ohrev vody)/.test(text)) return "hot_water";
  if (/(fotovolt|solar|panel)/.test(text)) return "photovoltaics";
  if (/(cerpadl|vykurov|kuren)/.test(text)) return "heat_pump";

  return null;
}

function detectLeadIntent(text: string): ConversationState["lead"]["intent"] {
  if (/(zavolat|zavolajte|ozvat|ozvite|kontaktujte|telefon)/.test(text)) return "callback";
  if (/(cenov|ponuk|ponuku|nacenit|nacenenie|kalkulac)/.test(text)) return "quote";
  if (/(kolko by to stalo|kolko to stoji|cena pre moj dom)/.test(text)) return "price_estimate";
  if (/(poslem.*projekt|projekt poslem|mam projekt)/.test(text)) return "send_project";
  if (/(mam zaujem|mame zaujem|chcem riesit|chcem cerpadlo|chcem to riesit)/.test(text)) return "interested";
  if (/(konzultac|poradit|odborny navrh)/.test(text)) return "consultation";

  return null;
}

function extractName(raw: string) {
  const match = raw.match(/(?:vol[aá]m sa|som)\s+([A-ZÁÄČĎÉÍĹĽŇÓÔŔŠŤÚÝŽ][a-záäčďéíĺľňóôŕšťúýž]{2,})/i);
  if (!match?.[1]) return null;

  return `${match[1][0].toUpperCase()}${match[1].slice(1).toLowerCase()}`;
}

function extractEmail(raw: string) {
  return raw.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? null;
}

function extractPhone(raw: string) {
  const match = raw.match(/(?:\+421\s*)?(?:0)?9\d{2}[\s.-]?\d{3}[\s.-]?\d{3}/);
  if (!match) return null;

  return match[0].replace(/\s+/g, " ").trim();
}

function detectLocation(raw: string) {
  const known = raw.match(/\b(Bratislava|Trnava|Nitra|Žilina|Zilina|Košice|Kosice|Prešov|Presov|Trenčín|Trencin|Banská Bystrica|Banska Bystrica)\b/i);
  if (known) return known[0];

  const generic = raw.match(/\b(?:v|pri|okolie|z)\s+([A-ZÁÄČĎÉÍĹĽŇÓÔŔŠŤÚÝŽ][a-záäčďéíĺľňóôŕšťúýž]{3,})\b/);
  return generic?.[1] ?? null;
}

function updateFactsFromUser(raw: string, state: ConversationState) {
  const text = normalizeText(raw);

  state.userProfile.email = extractEmail(raw) ?? state.userProfile.email;
  state.userProfile.phone = extractPhone(raw) ?? state.userProfile.phone;
  state.userProfile.name = extractName(raw) ?? state.userProfile.name;
  state.userProfile.location = detectLocation(raw) ?? state.userProfile.location;

  if (/(nechcem.*(cislo|telefon|email|kontakt)|nedam.*(cislo|telefon|email|kontakt)|bez kontaktu)/.test(text)) {
    state.contactRefused = true;
  }

  if (/(novostav|novy dom|staviam|staviame)/.test(text)) state.project.type = "new_build";
  if (/(rekonstruk|rekonstru|stary dom|stars[iy] dom)/.test(text)) state.project.type = "reconstruction";

  const size = text.match(/\b(\d{2,4})\s*(m2|m 2|m|metrov|metrovy|metrovym)\b/);
  if (size) state.project.houseSizeM2 = Number(size[1]);

  if (/(od nuly|nemame nic|este nemame|system od nuly)/.test(text)) state.project.currentHeating = "od nuly";
  else if (/^(plyn|plynom)\.?$/.test(text) || /(teraz.*plyn|mam[e]?\s+plyn|kurime\s+plyn|kurime\s+plynom|plynovy kotol|plynovym kotlom|plynom)/.test(text)) {
    state.project.currentHeating = "plyn";
  } else if (/^(radiatory|radiatormi)\.?$/.test(text) || /(mam[e]?\s+radiator|radiatory|radiatormi)/.test(text)) state.project.currentHeating = state.project.currentHeating ? `${state.project.currentHeating}, radiátory` : "radiátory";
  else if (/(elektr|elektrokot)/.test(text)) state.project.currentHeating = "elektrina";
  else if (/(drevo|uhlie|tuh[eé] palivo|krb)/.test(text)) state.project.currentHeating = "tuhé palivo";

  const interests: string[] = [];
  if (/(cerpadl)/.test(text)) interests.push("tepelné čerpadlo");
  if (/(podlahov)/.test(text)) interests.push("podlahové kúrenie");
  if (/(rekuper|vetran)/.test(text)) interests.push("rekuperácia");
  if (/(chladen|strop|klimatiz)/.test(text)) interests.push("chladenie");
  if (/(fotovolt|solar)/.test(text)) interests.push("fotovoltika");
  state.project.interestedIn = unique([...state.project.interestedIn, ...interests]);

  if (/(dlhodob|mesacn|mesacne naklady|prevadzk|nizke naklady|uspora energie)/.test(text)) state.project.priority = "long_term_savings";
  if (/(nechcem vela investovat|usetrit na zaciatku|chcem.*zaciatku|najlacn|rozumna cena|nizky rozpocet|low budget|lacn)/.test(text)) {
    state.project.priority = "low_upfront_cost";
    state.project.budgetSensitivity = "high";
  }
  if (/(komfort|pohodl)/.test(text)) state.project.priority = "comfort";
  if (/(zdravy vzduch|cerstvy vzduch|alerg)/.test(text)) state.project.priority = "health_air";
  if (/(tich|hluk|hluc)/.test(text)) state.project.priority = "quiet_operation";

  const leadIntent = detectLeadIntent(text);
  if (leadIntent) state.lead.intent = leadIntent;
  if (state.userProfile.email) state.lead.preferredContactMethod = "email";
  if (state.userProfile.phone || leadIntent === "callback") state.lead.preferredContactMethod = "phone";
  if (leadIntent === "callback" || /ozvite|zavolajte|kontaktujte/.test(text)) state.lead.consentToContact = true;
  if (state.userProfile.email || state.userProfile.phone) state.lead.consentToContact = true;

  const topic = detectTopic(text);
  if (topic) {
    if (state.lastTopic && state.lastTopic !== topic) {
      state.previousTopics = unique([...state.previousTopics, state.lastTopic]).slice(-8);
    }
    state.lastTopic = topic;
  }
  state.lastUserIntent = leadIntent ?? topic;
}

function leadStatus(state: ConversationState): LeadStatus {
  const hasLeadIntent = Boolean(state.lead.intent);
  const hasProjectBasics = Boolean(state.project.type && state.project.houseSizeM2 && state.project.currentHeating);

  if (state.lead.intent === "callback" || ((state.userProfile.email || state.userProfile.phone) && hasLeadIntent)) {
    return "contact_requested";
  }
  if (hasLeadIntent && hasProjectBasics) return "qualified_lead";
  if (hasLeadIntent || state.project.interestedIn.length > 0) return "soft_lead";
  return "not_lead";
}

function buildKnownFacts(state: ConversationState) {
  const facts: string[] = [];

  if (state.project.type === "new_build") facts.push("Používateľ rieši novostavbu.");
  if (state.project.type === "reconstruction") facts.push("Používateľ rieši rekonštrukciu.");
  if (state.project.houseSizeM2) facts.push(`Dom má približne ${state.project.houseSizeM2} m².`);
  if (state.project.currentHeating) facts.push(`Aktuálne kúrenie: ${state.project.currentHeating}.`);
  if (state.project.interestedIn.length) facts.push(`Záujem: ${state.project.interestedIn.join(", ")}.`);
  if (state.project.priority) facts.push(`Priorita: ${state.project.priority}.`);
  if (state.project.budgetSensitivity === "high") facts.push("Používateľ je citlivý na výšku vstupnej investície.");
  if (state.userProfile.location) facts.push(`Lokalita: ${state.userProfile.location}.`);
  if (state.userProfile.name) facts.push("Používateľ poskytol meno.");
  if (state.userProfile.email) facts.push("Používateľ poskytol email.");
  if (state.userProfile.phone) facts.push("Používateľ poskytol telefón.");
  if (state.lead.intent) facts.push(`Lead intent: ${state.lead.intent}.`);
  if (state.contactRefused) facts.push("Používateľ nechce poskytovať kontaktné údaje.");

  return facts;
}

function buildOpenQuestions(state: ConversationState) {
  const questions: string[] = [];

  if (!state.project.type) questions.push("novostavba alebo rekonštrukcia");
  if (!state.project.houseSizeM2) questions.push("veľkosť domu v m²");
  if (!state.project.currentHeating) questions.push("aktuálny zdroj kúrenia");
  if (!state.project.priority) questions.push("priorita: vstupná cena alebo dlhodobé náklady");
  if (state.lead.intent === "callback" && !state.userProfile.phone && !state.contactRefused) questions.push("telefón pre spätný kontakt");
  if (state.lead.status === "qualified_lead" && !state.userProfile.email && !state.userProfile.phone && !state.contactRefused) {
    questions.push("dobrovoľný email alebo telefón pre posunutie dopytu");
  }

  return questions;
}

function buildSummary(state: ConversationState) {
  const parts = [
    state.project.type === "new_build" ? "novostavba" : state.project.type === "reconstruction" ? "rekonštrukcia" : null,
    state.project.houseSizeM2 ? `${state.project.houseSizeM2} m²` : null,
    state.project.currentHeating ? `kúrenie: ${state.project.currentHeating}` : null,
    state.project.interestedIn.length ? `záujem: ${state.project.interestedIn.join(", ")}` : null,
    state.project.priority ? `priorita: ${state.project.priority}` : null,
  ].filter(Boolean);

  return parts.length ? `Používateľ rieši ${parts.join("; ")}.` : "Používateľ sa zatiaľ orientuje v možnostiach riešenia domu.";
}

export function nextFollowUpQuestion(state: ConversationState) {
  if (state.lead.intent === "callback" && !state.userProfile.phone && !state.contactRefused) {
    return "Môžete mi napísať telefónne číslo, na ktoré sa vám môžu ozvať?";
  }

  if (!state.project.type) return "Staviate nový dom alebo rekonštruujete?";
  if (!state.project.houseSizeM2) return "Aká je približne veľkosť domu v m²?";
  if (!state.project.currentHeating) return "Máte už nejaké kúrenie alebo riešite systém od nuly?";
  if (!state.project.priority) return "Chcete skôr ušetriť na začiatku alebo mať čo najnižšie náklady dlhodobo?";

  if (
    state.lead.status === "qualified_lead" &&
    !state.userProfile.email &&
    !state.userProfile.phone &&
    !state.contactRefused
  ) {
    return "Ak chcete, môžem si poznačiť email alebo telefón, aby sa dopyt vedel posunúť ďalej?";
  }

  if (state.contactRefused) {
    return "Chcete pokračovať bez kontaktu a prejsť si orientačné odporúčanie?";
  }

  return "Chcete, aby som vám z toho pripravil stručné odporúčanie ďalšieho kroku?";
}

export function updateConversationState(messages: ChatMessage[], previous?: ConversationState | null): ConversationState {
  const state = previous ? structuredClone(previous) : createConversationState();

  state.messages = messages.slice(-30);
  state.updatedAt = new Date().toISOString();

  for (const message of messages.filter((item) => item.role === "user")) {
    updateFactsFromUser(message.content, state);
  }

  state.project.stage = state.lead.intent
    ? state.lead.intent === "quote" || state.lead.intent === "price_estimate"
      ? "quote_requested"
      : state.lead.intent === "callback"
        ? "contact_requested"
        : "planning"
    : state.project.stage;
  state.lead.status = leadStatus(state);
  state.knownFacts = buildKnownFacts(state);
  state.openQuestions = buildOpenQuestions(state);
  state.conversationSummary = buildSummary(state);

  return state;
}

export function stateForPrompt(state: ConversationState) {
  return JSON.stringify(
    {
      userProfile: {
        hasName: Boolean(state.userProfile.name),
        hasEmail: Boolean(state.userProfile.email),
        hasPhone: Boolean(state.userProfile.phone),
        location: state.userProfile.location,
      },
      project: state.project,
      lead: state.lead,
      knownFacts: state.knownFacts,
      openQuestions: state.openQuestions,
      lastTopic: state.lastTopic,
      previousTopics: state.previousTopics,
      conversationSummary: state.conversationSummary,
      contactRefused: state.contactRefused,
    },
    null,
    2,
  );
}

export function topicLabel(topic: string | null) {
  return topic ? (topicLabels[topic] ?? topic) : null;
}
