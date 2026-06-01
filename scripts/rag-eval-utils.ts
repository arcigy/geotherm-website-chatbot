import { type ChatResponse } from "./chat-server";
import { normalize, tokenize } from "./local-retrieval";

export type EvalVerdict = "PASS" | "WARN" | "FAIL";
export type ExpectedBehavior = "answer_with_sources" | "ask_followup" | "refuse_or_fallback" | "answer_cautiously";
export type ConfidenceLevel = "low" | "medium" | "high";

export type MassiveTestCase = {
  id: string;
  category: string;
  query: string;
  expectedBehavior: ExpectedBehavior;
  forbiddenBehavior: string[];
  expectedRetrievalThemes: string[];
  expectedConfidenceRange: {
    min: ConfidenceLevel;
    max: ConfidenceLevel;
  };
  notes: string;
};

export type EvaluatedCase = {
  test: MassiveTestCase;
  response: ChatResponse;
  verdict: EvalVerdict;
  reasons: string[];
  hallucinationIncident: boolean;
  overconfidenceIncident: boolean;
  retrievalDriftIncident: boolean;
  contactAggressive: boolean;
};

const confidenceRank: Record<ConfidenceLevel, number> = { low: 1, medium: 2, high: 3 };

export function norm(value: string): string {
  return normalize(value);
}

export function includesTerm(haystack: string, needle: string): boolean {
  const normalizedHaystack = norm(haystack);
  const normalizedNeedle = norm(needle);
  if (normalizedHaystack.includes(normalizedNeedle)) return true;
  const haystackTokens = new Set(tokenize(haystack));
  const needleTokens = tokenize(needle);
  return needleTokens.length > 0 && needleTokens.every((token) => haystackTokens.has(token));
}

export function sourceText(response: ChatResponse): string {
  return response.sources.map((source) => `${source.pageTitle} ${source.sectionHeading} ${source.url} ${source.snippet}`).join(" ");
}

export function isFallback(response: ChatResponse): boolean {
  const answer = norm(response.answer);
  return (
    response.confidence === "low" ||
    answer.includes("nenasiel dostatocne jasnu odpoved") ||
    answer.includes("nemam dost jasny podklad") ||
    answer.includes("nemam dostatocne jasny podklad") ||
    answer.includes("nemozem") ||
    answer.includes("neviem")
  );
}

export function hasContactRequest(response: ChatResponse): boolean {
  const text = norm(`${response.answer} ${response.leadCapture.nextQuestion || ""}`);
  return ["staci email", "staci telefon", "nechajte kontakt", "kontaktne udaje", "ozval odbornik", "ozvat odbornik"].some((term) =>
    text.includes(term),
  );
}

export function countQuestions(value: string): number {
  return (value.match(/\?/g) || []).length;
}

export function hasCautiousLanguage(response: ChatResponse): boolean {
  const answer = norm(response.answer);
  return [
    "zalezi",
    "zavisi",
    "neviem",
    "nemozem",
    "neda sa",
    "neda garantovat",
    "orientacne",
    "individualne",
    "individualna",
    "predbez",
    "potrebujem",
    "potrebujeme",
    "potreboval",
    "aktualn",
    "asistenc",
    "potvrdene",
    "pokial",
    "bezpecne",
    "moze",
    "mozu",
    "dolezite",
    "nie je mozne",
    "nie je zarucene",
    "nie je zaručene",
    "podmienky",
    "menia",
    "lisi",
    "odlisuje",
    "konkretne",
    "konkretny",
    "potrebujem vediet",
    "treba overit",
    "overit",
    "potvrdit",
    "opatrne",
    "menej isty",
    "bez odbornej",
    "bez obhliadky",
    "odporucam",
    "bezpecnostny",
    "bezpecnost",
    "bezpecnostne",
    "riziko",
    "rizikove",
    "odbornik",
    "technik",
    "profesional",
    "odborny servis",
    "nenasiel",
    "nemam dost jasny podklad",
    "nebral zodpovedne",
    "nechcel hadat",
    "negarantoval",
    "negarantujem",
    "negarantujeme",
    "nesluboval",
    "bez vypoctu",
    "bez rozsahu",
    "bez udajov",
    "neuvadzam",
  ].some((term) => answer.includes(term));
}

function hasForbiddenBehavior(answer: string, forbidden: string): boolean {
  const normalizedAnswer = norm(answer);
  const normalizedForbidden = norm(forbidden);
  if (!normalizedForbidden) return false;
  const safeNegations = [
    "neviem presne",
    "neviem garantovat",
    "nemozem garantovat",
    "neda sa slubit",
    "neviem zodpovedne",
    "bez kontextu",
  ];
  if (safeNegations.some((term) => normalizedAnswer.includes(term)) && ["presne", "garant", "garantujeme", "najlacnejsie", "najlepsie"].some((term) => normalizedForbidden.includes(term))) {
    return false;
  }
  if (
    ["presne", "urcite", "najlacnejsie", "najlepsie"].some((term) => normalizedForbidden.includes(term)) &&
    [
      "neda sa",
      "nie je mozne",
      "neviem",
      "nemozem",
      "zavisi",
      "individual",
      "podmien",
      "treba overit",
      "tazke",
      "vyzaduju",
      "bez podklad",
      "bez udaj",
      "odborne",
      "narok",
      "dotac",
      "negarant",
      "nesluboval",
      "nie je zarucene",
      "nepredvidane",
    ].some((term) => normalizedAnswer.includes(term))
  ) {
    return false;
  }
  if (normalizedForbidden.includes(" ")) return normalizedAnswer.includes(normalizedForbidden);
  return new RegExp(`(^|\\s)${normalizedForbidden}(\\s|$)`).test(normalizedAnswer);
}

export function evaluateMassiveCase(test: MassiveTestCase, response: ChatResponse): EvaluatedCase {
  const reasons: string[] = [];
  const combined = `${response.answer} ${sourceText(response)}`;
  const sourceRequired = test.expectedBehavior === "answer_with_sources" || test.expectedBehavior === "answer_cautiously";
  const sourcePresence = !sourceRequired || response.sources.length > 0 || isFallback(response);
  const retrievalRelevant =
    test.expectedRetrievalThemes.length === 0 ||
    test.expectedRetrievalThemes.some((term) => includesTerm(combined, term));
  const forbiddenHits = test.forbiddenBehavior.filter((term) => hasForbiddenBehavior(response.answer, term));
  const confidence = response.confidence || "low";
  const confidenceOk =
    confidenceRank[confidence] >= confidenceRank[test.expectedConfidenceRange.min] &&
    confidenceRank[confidence] <= confidenceRank[test.expectedConfidenceRange.max];
  const contactAggressive = hasContactRequest(response) && !response.lead.captured;
  const tooManyFollowups = countQuestions(response.answer) > 1;

  const visibleFollowupAsked = countQuestions(response.answer) >= 1 || Boolean(response.leadCapture.shouldAsk && response.leadCapture.nextQuestion);
  let behaviorMatch = true;
  if (test.expectedBehavior === "answer_with_sources") behaviorMatch = response.confidence !== "low" && response.sources.length > 0;
  if (test.expectedBehavior === "ask_followup") behaviorMatch = visibleFollowupAsked && !isFallback(response);
  if (test.expectedBehavior === "refuse_or_fallback") behaviorMatch = isFallback(response) && !response.leadCapture.shouldAsk;
  if (test.expectedBehavior === "answer_cautiously") behaviorMatch = hasCautiousLanguage(response) && (response.sources.length > 0 || isFallback(response) || response.confidence !== "high");

  const hardRetrievalExpected = test.expectedBehavior === "answer_with_sources" || test.expectedBehavior === "answer_cautiously";
  const overconfidenceIncident =
    (confidenceRank[confidence] > confidenceRank[test.expectedConfidenceRange.max] && !hasCautiousLanguage(response)) ||
    (confidence === "high" && test.expectedBehavior === "refuse_or_fallback") ||
    (confidence === "high" && hardRetrievalExpected && !retrievalRelevant);
  const retrievalDriftIncident = response.confidence === "high" && !retrievalRelevant && test.expectedRetrievalThemes.length > 0;
  const hallucinationIncident = forbiddenHits.length > 0;

  if (!sourcePresence) reasons.push("missing sources");
  if (!retrievalRelevant) reasons.push(`weak retrieval themes: ${test.expectedRetrievalThemes.join(", ") || "-"}`);
  if (forbiddenHits.length) reasons.push(`forbidden behavior: ${forbiddenHits.join(", ")}`);
  if (!confidenceOk) reasons.push(`confidence outside expected range: ${confidence}`);
  if (!behaviorMatch) reasons.push(`behavior mismatch: expected ${test.expectedBehavior}`);
  if (contactAggressive) reasons.push("contact request too early");
  if (tooManyFollowups) reasons.push("more than one follow-up question");

  let verdict: EvalVerdict = "PASS";
  if (hallucinationIncident || contactAggressive || overconfidenceIncident || !behaviorMatch) verdict = "FAIL";
  else if (!sourcePresence || !retrievalRelevant || !confidenceOk || tooManyFollowups) verdict = "WARN";

  return {
    test,
    response,
    verdict,
    reasons,
    hallucinationIncident,
    overconfidenceIncident,
    retrievalDriftIncident,
    contactAggressive,
  };
}

export function pct(value: number, total: number): string {
  return total ? `${Math.round((value / total) * 100)}%` : "0%";
}

export function mdTable(headers: string[], rows: Array<Array<string | number>>): string {
  const cell = (value: string | number): string => String(value).replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(cell).join(" | ")} |`),
  ].join("\n");
}
