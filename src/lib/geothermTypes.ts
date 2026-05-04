export type KnowledgeEntity = {
  id: string;
  type: "product" | "service" | "brand" | "subsidy" | "faq" | "reference";
  name: string;
  aliases: string[];
  shortDescription: string;
  longDescription?: string;
  benefits?: string[];
  limitations?: string[];
  relatedTopics: string[];
  sourceUrl: string;
  pageAnchor?: string;
  imageIds?: string[];
  actionIds?: string[];
};

export type ImageAsset = {
  id: string;
  url: string;
  alt: string;
  verifiedDescription: string;
  type: "product" | "installation" | "diagram" | "reference" | "generic";
  brands?: string[];
  products?: string[];
  topics: string[];
  allowedIntents?: string[];
  blockedTopics?: string[];
  sourcePage?: string;
  quality: "approved" | "needs_review" | "blocked";
};

export type PageAction = {
  id: string;
  label: string;
  type: "scroll_to" | "open_page" | "open_contact" | "highlight_section";
  url?: string;
  selector?: string;
  anchorId?: string;
  highlightText?: string;
  entityId?: string;
  topic?: string;
  external_unverified?: boolean;
};

export type ChatAnswerPlan = {
  intent: string;
  topic?: string;
  confidence: number;
  answerSourceIds: string[];
  matchedEntityIds: string[];
  selectedImages: ImageAsset[];
  selectedActions: PageAction[];
  shouldAskFollowup: boolean;
  followupQuestion: string;
  answerFacts: string[];
  fallbackUsed: boolean;
};

export type RetrievedKnowledgeChunk = {
  id: string;
  pageUrl: string;
  pageTitle: string;
  score: number;
  content: string;
};

export type GeothermChatResponse = {
  message: string;
  images?: Array<{
    id: string;
    url: string;
    alt: string;
    description: string;
  }>;
  actions?: PageAction[];
  followupQuestion?: string;
  debug?: unknown;
};
