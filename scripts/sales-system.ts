import { type RetrievalResult } from "./local-retrieval";

export type SalesIntent =
  | "quote"
  | "service"
  | "subsidy"
  | "product"
  | "installation"
  | "noise"
  | "contact"
  | "irrelevant"
  | "unknown";

export type QualificationState = {
  project_type?: string;
  property_type?: string;
  area_m2?: number;
  location?: string;
  timeline?: string;
  current_heating?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  declined_contact?: boolean;
};

export type ContactInfo = {
  name?: string;
  email?: string;
  phone?: string;
};

export type LeadDecision = {
  shouldAsk: boolean;
  nextQuestion: string | null;
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

export function detectIntent(message: string, results: RetrievalResult[]): SalesIntent {
  const text = normalize(message);
  const sourceText = normalize(
    results
      .slice(0, 3)
      .map((result) => `${result.chunk.pageTitle} ${result.chunk.sectionHeading} ${result.chunk.url}`)
      .join(" "),
  );
  const combined = `${text} ${sourceText}`;

  if (includesAny(text, ["pocasie", "auto", "hypotek", "gulas", "futbal", "akcie", "bitcoin"])) return "irrelevant";
  if (includesAny(text, ["cenova ponuka", "cenovu ponuku", "ponuku", "cenu", "cena", "cennik", "kolko stoji", "naklady", "rozpocet"])) return "quote";
  if (includesAny(text, ["kontakt", "kontaktujem", "telefon", "email", "adresa", "zavolat", "kontaktovat"])) return "contact";
  if (includesAny(text, ["servis", "udrzba", "revizia", "kontrola", "prehliadka"])) return "service";
  if (includesAny(text, ["dotacia", "dotacie", "prispevok", "poukazka", "zelena domacnostiam", "oze"])) return "subsidy";
  if (includesAny(text, ["montaz", "instalacia", "realizacia", "osadenie", "zapojenie"])) return "installation";
  if (includesAny(text, ["hluk", "hlucnost", "tichy", "tiche", "akusticky"])) return "noise";
  if (includesAny(combined, ["kontakt", "telefon", "email", "adresa", "zavolat", "kontaktovat"])) return "contact";
  if (includesAny(combined, ["servis", "udrzba", "revizia", "kontrola", "prehliadka"])) return "service";
  if (includesAny(combined, ["dotacia", "dotacie", "prispevok", "poukazka", "zelena domacnostiam", "oze"])) return "subsidy";
  if (includesAny(combined, ["cenova ponuka", "cena", "cennik", "kolko stoji", "naklady", "rozpocet"])) return "quote";
  if (includesAny(combined, ["montaz", "instalacia", "realizacia", "osadenie", "zapojenie"])) return "installation";
  if (includesAny(combined, ["hluk", "hlucnost", "tichy", "tiche", "akusticky"])) return "noise";
  if (includesAny(combined, ["nibe", "vaillant", "tepelne cerpadlo", "rekuperacia", "fotovoltaika", "podlahove"])) return "product";
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

export function updateQualificationState(previous: QualificationState, message: string, intent: SalesIntent): QualificationState {
  const state: QualificationState = { ...previous };
  const normalized = normalize(message);
  const contact = extractContact(message);
  if (contact.email) state.contact_email = contact.email;
  if (contact.phone) state.contact_phone = contact.phone;
  if (contact.name) state.contact_name = contact.name;
  if (includesAny(normalized, ["nechcem dat kontakt", "bez kontaktu", "nechcem kontakt", "zatial nie"])) state.declined_contact = true;

  if (!state.project_type && intent !== "unknown" && intent !== "irrelevant") {
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
    const locationMatch = message.match(/\b(?:v|vo|okolie|z)\s+([A-ZÁÄČĎÉÍĽĹŇÓÔŔŠŤÚÝŽ][a-záäčďéíľĺňóôŕšťúýž]+)\b/);
    if (locationMatch) state.location = locationMatch[1];
  }

  if (!state.timeline) {
    if (includesAny(normalized, ["urgent", "hneď", "hned", "co najskor", "čo najskôr"])) state.timeline = "urgent";
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

export function nextLeadQuestion(state: QualificationState, intent: SalesIntent, confidence: "high" | "medium" | "low"): LeadDecision {
  if (intent === "irrelevant" || intent === "unknown") return { shouldAsk: false, nextQuestion: null };
  if (state.declined_contact) return { shouldAsk: false, nextQuestion: null };
  if (state.contact_email || state.contact_phone) return { shouldAsk: false, nextQuestion: null };
  if (confidence === "low") {
    return {
      shouldAsk: true,
      nextQuestion: "Ak chcete, nechajte mi kontakt a technik sa vám ozve s presnejšou odpoveďou.",
    };
  }
  if (!state.project_type) return { shouldAsk: true, nextQuestion: "Riešite skôr montáž, servis, dotácie alebo cenovú ponuku?" };
  if (!state.property_type) return { shouldAsk: true, nextQuestion: "Ide o rodinný dom, firmu alebo byt?" };
  if (!state.area_m2 && (intent === "quote" || intent === "installation" || intent === "product")) {
    return { shouldAsk: true, nextQuestion: "Aká je približná plocha domu v m²?" };
  }
  if (!state.location) return { shouldAsk: true, nextQuestion: "V akej lokalite sa projekt nachádza?" };
  if (!state.timeline) return { shouldAsk: true, nextQuestion: "Kedy to chcete riešiť: urgentne, do 1-3 mesiacov, do 3-6 mesiacov alebo neskôr?" };
  if (!state.current_heating && intent !== "subsidy") return { shouldAsk: true, nextQuestion: "Čím aktuálne kúrite?" };
  return {
    shouldAsk: true,
    nextQuestion: "Môžete mi nechať telefón alebo email, aby sa vám ozval technik/obchodník?",
  };
}

export function summarizeTranscript(messages: Array<{ role: string; content: string }>): string {
  return messages
    .filter((message) => message.role !== "system")
    .slice(-6)
    .map((message) => `${message.role}: ${message.content.replace(/\s+/g, " ").slice(0, 180)}`)
    .join(" | ");
}
