import { nextFollowUpQuestion, normalizeText, type ConversationState } from "./geothermConversation";
import {
  geothermEntities,
  geothermImageCatalog,
  geothermPageActions,
  getActionsByIds,
  getEntityById,
  getImagesByIds,
} from "./geothermEntityCatalog";
import type { ChatAnswerPlan, ImageAsset, KnowledgeEntity, PageAction, RetrievedKnowledgeChunk } from "./geothermTypes";

export type AnswerPlanDebug = {
  userMessage: string;
  detectedIntent: string;
  detectedTopic?: string;
  confidence: number;
  matchedEntities: Array<Pick<KnowledgeEntity, "id" | "name" | "type" | "sourceUrl">>;
  selectedChunks: Array<Pick<RetrievedKnowledgeChunk, "id" | "pageUrl" | "pageTitle" | "score">>;
  selectedImages: Array<Pick<ImageAsset, "id" | "url" | "alt" | "verifiedDescription" | "quality" | "topics">>;
  rejectedImages: Array<Pick<ImageAsset, "id" | "quality" | "topics" | "blockedTopics"> & { reason: string }>;
  selectedActions: PageAction[];
  answerFacts: string[];
  fallbackUsed: boolean;
  finalPromptPreview?: string;
};

type PlannerInput = {
  userMessage: string;
  memory: ConversationState;
  knowledgeChunks: RetrievedKnowledgeChunk[];
  followupQuestion?: string;
};

type PlannerResult = {
  plan: ChatAnswerPlan;
  debug: AnswerPlanDebug;
};

const topicAliases: Record<string, string[]> = {
  "tepelne-cerpadla": ["tepelne cerpadlo", "tepelne cerpadla", "cerpadlo", "vykurovanie", "vzduch voda"],
  rekuperacia: ["rekuperacia", "vetranie", "vzduch", "vlhkost", "plesen"],
  "podlahove-kurenie": ["podlahove kurenie", "podlahovka", "podlahove vykurovanie"],
  "stropne-chladenie": ["stropne chladenie", "chladenie", "railfix", "rehau"],
  fotovoltika: ["fotovoltika", "fotovoltaika", "fve", "solar", "solarne panely"],
  dotacie: ["dotacie", "poukaz", "oze", "zelena domacnostiam"],
  servis: ["servis", "servise", "servisne", "montaz", "udrzba", "instalacia"],
  kontakt: ["kontakt", "zavolat", "email", "telefon"],
};

function detectIntent(text: string) {
  if (/(obraz|fotk|foto).*(posli|ukaz|zobraz|co|ake|aky)|posli.*(obraz|fotk|foto)/.test(text)) return "image_meta_question";
  if (/(porovnaj|porovnanie|rozdiel|\bvs\b|co je lepsie|lepsie z tych)/.test(text)) return "comparison_question";
  if (/(zavolat|zavolajte|ozvat|ozvite|kontaktujte|telefon)/.test(text)) return "contact_request";
  if (/(konzultac|odborny navrh|poradit)/.test(text)) return "consultation_request";
  if (/(kolko|cena|stoji|nacenit|ponuk|rozpocet|najlacn)/.test(text)) return "price_question";
  if (/(dotac|poukaz|oze|zelena)/.test(text)) return "subsidy_question";
  if (/(comfoair|railfix|s2125|f2120|arotherm|recovair|ivt|stiebel|wpl|nibe|vaillant|produkt|model|znacka)/.test(text)) {
    return "product_question";
  }
  if (/(rekuper|vetran|podlah|strop|chladen|fotovolt|servis|tepelne|cerpadl|vykurov)/.test(text)) {
    return "service_question";
  }
  if (/(co je|aky je|mate|odporucate)/.test(text)) return "product_question";

  return "unknown";
}

function normalizeAlias(alias: string) {
  return normalizeText(alias).replace(/\s+/g, " ").trim();
}

function aliasMatches(text: string, alias: string) {
  const normalizedAlias = normalizeAlias(alias);
  if (!normalizedAlias) return false;

  return new RegExp(`(^|\\s)${normalizedAlias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\s|$)`).test(text);
}

function detectEntities(text: string) {
  return geothermEntities
    .map((entity) => {
      const matchedAliases = entity.aliases.filter((alias) => aliasMatches(text, alias));
      const nameMatch = aliasMatches(text, entity.name);
      const score = (nameMatch ? 2 : 0) + matchedAliases.reduce((total, alias) => total + normalizeAlias(alias).length, 0);

      return { entity, score, matchedAliases };
    })
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ entity }) => entity);
}

function detectTopic(text: string, entities: KnowledgeEntity[], memory: ConversationState) {
  for (const entity of entities) {
    if (entity.relatedTopics[0]) return entity.relatedTopics[0];
  }

  for (const [topic, aliases] of Object.entries(topicAliases)) {
    if (aliases.some((alias) => aliasMatches(text, alias))) return topic;
  }

  return memory.lastTopic ?? undefined;
}

function confidenceFor(input: {
  intent: string;
  entities: KnowledgeEntity[];
  topic?: string;
  chunks: RetrievedKnowledgeChunk[];
}) {
  if (input.entities.some((entity) => entity.type === "product") && input.intent === "product_question") return 0.88;
  if (input.entities.length && input.intent === "comparison_question") return 0.84;
  if (input.entities.length) return 0.82;
  if (input.topic && input.chunks[0]?.score > 20) return 0.72;
  if (input.topic) return 0.6;
  if (input.chunks[0]?.score > 15) return 0.52;
  if (input.chunks.length) return 0.38;
  return 0.2;
}

function imageAllowedFor(image: ImageAsset, input: { intent: string; topic?: string; entityIds: string[] }) {
  if (image.quality !== "approved") return { allowed: false, reason: `quality:${image.quality}` };
  if (input.topic && image.blockedTopics?.includes(input.topic)) return { allowed: false, reason: "blocked_topic" };
  if (image.allowedIntents?.length && !image.allowedIntents.includes(input.intent)) return { allowed: false, reason: "intent_not_allowed" };
  if (input.entityIds.length && image.products?.some((product) => input.entityIds.includes(product))) return { allowed: true };
  if (input.topic && image.topics.includes(input.topic)) return { allowed: true };
  if (!input.topic && !input.entityIds.length) return { allowed: false, reason: "no_topic_or_entity" };

  return { allowed: false, reason: "topic_mismatch" };
}

function selectImages(input: { intent: string; topic?: string; entities: KnowledgeEntity[] }) {
  const entityIds = input.entities.map((entity) => entity.id);
  const explicitIds = input.entities.flatMap((entity) => entity.imageIds ?? []);
  const candidates = [
    ...getImagesByIds(explicitIds),
    ...geothermImageCatalog.filter((image) => input.topic && image.topics.includes(input.topic)),
  ].filter((image, index, values) => values.findIndex((candidate) => candidate.id === image.id) === index);
  const rejected: AnswerPlanDebug["rejectedImages"] = [];
  const selected = candidates.filter((image) => {
    const result = imageAllowedFor(image, { intent: input.intent, topic: input.topic, entityIds });
    if (!result.allowed) {
      rejected.push({
        id: image.id,
        quality: image.quality,
        topics: image.topics,
        blockedTopics: image.blockedTopics,
        reason: result.reason ?? "unknown",
      });
    }

    return result.allowed;
  });
  const max = input.intent === "comparison_question" ? 2 : 1;

  return { selected: selected.slice(0, max), rejected };
}

function selectActions(input: { topic?: string; entities: KnowledgeEntity[]; intent: string }) {
  const explicitActions = getActionsByIds(input.entities.flatMap((entity) => entity.actionIds ?? []));
  const hasProductEntity = input.entities.some((entity) => entity.type === "product");
  const topicActions = input.topic && !hasProductEntity
    ? geothermPageActions.filter((action) => action.topic === input.topic || action.entityId === `service-${input.topic}`)
    : [];
  const contactActions = ["contact_request", "consultation_request"].includes(input.intent)
    ? geothermPageActions.filter((action) => action.type === "open_contact")
    : [];

  return [...explicitActions, ...topicActions, ...contactActions]
    .filter((action, index, values) => values.findIndex((candidate) => candidate.id === action.id) === index)
    .slice(0, 3);
}

function factsFromEntities(entities: KnowledgeEntity[]) {
  return entities.flatMap((entity) => {
    const facts = [entity.shortDescription];
    if (entity.benefits?.length) facts.push(`Prínosy: ${entity.benefits.slice(0, 3).join(", ")}.`);
    if (entity.limitations?.length) facts.push(`Pozor: ${entity.limitations[0]}.`);
    return facts;
  });
}

function factsFromChunks(chunks: RetrievedKnowledgeChunk[]) {
  return chunks
    .slice(0, 2)
    .map((chunk) => chunk.content.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .map((content) => content.slice(0, 260));
}

export function buildGeothermAnswerPlanWithDebug(input: PlannerInput): PlannerResult {
  const text = normalizeText(input.userMessage);
  const intent = detectIntent(text);
  const matchedEntities = detectEntities(text).slice(0, intent === "comparison_question" ? 3 : 1);
  const topic = detectTopic(text, matchedEntities, input.memory);
  const confidence = confidenceFor({ intent, entities: matchedEntities, topic, chunks: input.knowledgeChunks });
  const { selected: selectedImages, rejected: rejectedImages } = selectImages({ intent, topic, entities: matchedEntities });
  const selectedActions = confidence >= 0.55 ? selectActions({ topic, entities: matchedEntities, intent }) : [];
  const answerFacts = [...factsFromEntities(matchedEntities), ...factsFromChunks(input.knowledgeChunks)].slice(0, 6);
  const fallbackUsed = confidence < 0.55;
  const followupQuestion = input.followupQuestion || nextFollowUpQuestion(input.memory);
  const plan: ChatAnswerPlan = {
    intent,
    topic,
    confidence,
    answerSourceIds: input.knowledgeChunks.slice(0, 5).map((chunk) => chunk.id),
    matchedEntityIds: matchedEntities.map((entity) => entity.id),
    selectedImages,
    selectedActions,
    shouldAskFollowup: true,
    followupQuestion,
    answerFacts: answerFacts.length
      ? answerFacts
      : ["V lokálnej knowledge base nie je dosť presný podklad, preto treba otázku spresniť alebo overiť u GEOTHERM."],
    fallbackUsed,
  };

  return {
    plan,
    debug: {
      userMessage: input.userMessage,
      detectedIntent: intent,
      detectedTopic: topic,
      confidence,
      matchedEntities: matchedEntities.map(({ id, name, type, sourceUrl }) => ({ id, name, type, sourceUrl })),
      selectedChunks: input.knowledgeChunks
        .slice(0, 5)
        .map(({ id, pageUrl, pageTitle, score }) => ({ id, pageUrl, pageTitle, score })),
      selectedImages: selectedImages.map(({ id, url, alt, verifiedDescription, quality, topics }) => ({
        id,
        url,
        alt,
        verifiedDescription,
        quality,
        topics,
      })),
      rejectedImages,
      selectedActions,
      answerFacts: plan.answerFacts,
      fallbackUsed,
    },
  };
}

export function buildGeothermAnswerPlan(input: PlannerInput): ChatAnswerPlan {
  return buildGeothermAnswerPlanWithDebug(input).plan;
}

export function getMatchedEntityDetails(entityIds: string[]) {
  return entityIds.map(getEntityById).filter((entity): entity is KnowledgeEntity => Boolean(entity));
}
