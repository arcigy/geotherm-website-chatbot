import assert from "node:assert/strict";
import { buildGeothermAnswerPlanWithDebug } from "../src/lib/geothermAnswerPlanner";
import { createConversationState, type ConversationState } from "../src/lib/geothermConversation";
import type { RetrievedKnowledgeChunk } from "../src/lib/geothermTypes";

type TestCase = {
  name: string;
  run: () => void;
};

const chunk: RetrievedKnowledgeChunk = {
  id: "chunk-test-1",
  pageUrl: "https://www.geotherm.sk/rekuperacna-jednotka/",
  pageTitle: "Rekuperácia",
  score: 30,
  content: "GEOTHERM rieši rekuperáciu, tepelné čerpadlá, stropné chladenie a návrh systémov podľa konkrétneho domu.",
};

function plan(userMessage: string, memory: ConversationState = createConversationState()) {
  return buildGeothermAnswerPlanWithDebug({
    userMessage,
    memory,
    knowledgeChunks: [chunk],
    followupQuestion: "Staviate nový dom alebo rekonštruujete?",
  });
}

const tests: TestCase[] = [
  {
    name: "ComfoAir Q matches product entity, confidence and action",
    run: () => {
      const result = plan("čo je ComfoAir Q?");
      assert.equal(result.plan.intent, "product_question");
      assert.equal(result.plan.matchedEntityIds[0], "zehnder-comfoair-q");
      assert.ok(result.plan.confidence >= 0.82);
      assert.ok(result.plan.selectedActions.some((action) => action.id.includes("comfoair")));
    },
  },
  {
    name: "RAILFIX matches entity and topic",
    run: () => {
      const result = plan("máte railfix?");
      assert.equal(result.plan.matchedEntityIds[0], "rehau-railfix");
      assert.equal(result.plan.topic, "stropne-chladenie");
    },
  },
  {
    name: "NIBE heat pump question stays in heat pump topic",
    run: () => {
      const result = plan("aké tepelné čerpadlo nibe odporúčate?");
      assert.equal(result.plan.intent, "product_question");
      assert.ok(result.plan.topic === "tepelne-cerpadla" || result.plan.matchedEntityIds.some((id) => id.includes("nibe")));
    },
  },
  {
    name: "Recuperation is service question",
    run: () => {
      const result = plan("čo je rekuperácia?");
      assert.equal(result.plan.intent, "service_question");
      assert.equal(result.plan.matchedEntityIds[0], "service-rekuperacia");
      assert.equal(result.plan.topic, "rekuperacia");
    },
  },
  {
    name: "Price question does not select exact price fact",
    run: () => {
      const result = plan("koľko to stojí pre dom 150m2?");
      assert.equal(result.plan.intent, "price_question");
      assert.ok(result.plan.followupQuestion.length > 0);
      assert.ok(!result.plan.answerFacts.join(" ").match(/\b\d{4,}\s*€/));
    },
  },
  {
    name: "Recuperation photo returns only approved max one image",
    run: () => {
      const result = plan("pošli mi fotku rekuperácie");
      assert.ok(result.plan.selectedImages.length <= 1);
      assert.ok(result.plan.selectedImages.every((image) => image.quality === "approved"));
      assert.ok(result.plan.selectedImages.every((image) => image.topics.includes("rekuperacia")));
    },
  },
  {
    name: "Comparison returns max two images",
    run: () => {
      const result = plan("porovnaj rekuperáciu a tepelné čerpadlo");
      assert.equal(result.plan.intent, "comparison_question");
      assert.ok(result.plan.selectedImages.length <= 2);
    },
  },
  {
    name: "Unknown product has low confidence fallback",
    run: () => {
      const result = plan("čo je model XZQ-999?");
      assert.ok(result.plan.confidence < 0.55);
      assert.equal(result.plan.fallbackUsed, true);
    },
  },
  {
    name: "Needs review image is never returned",
    run: () => {
      const result = plan("čo je Vaillant aroTHERM Plus?");
      assert.equal(result.plan.matchedEntityIds[0], "vaillant-arotherm-plus");
      assert.ok(result.debug.rejectedImages.some((image) => image.id === "img-vaillant-arotherm-generic"));
      assert.ok(result.plan.selectedImages.every((image) => image.quality === "approved"));
    },
  },
  {
    name: "Blocked image is never returned",
    run: () => {
      const result = plan("čo robíte pri servise?");
      assert.ok(result.debug.rejectedImages.some((image) => image.quality === "blocked"));
      assert.ok(result.plan.selectedImages.every((image) => image.quality === "approved"));
    },
  },
  {
    name: "Approved image only returns for compatible topic",
    run: () => {
      const result = plan("pošli mi fotku stropného chladenia");
      assert.ok(result.plan.selectedImages.every((image) => image.quality === "approved"));
      assert.ok(result.plan.selectedImages.every((image) => image.topics.includes("stropne-chladenie")));
    },
  },
  {
    name: "Blocked topics prevent wrong image",
    run: () => {
      const result = plan("pošli mi fotku dotácie");
      assert.ok(!result.plan.selectedImages.some((image) => image.topics.includes("rekuperacia")));
    },
  },
  {
    name: "Product question returns action with selector or anchor",
    run: () => {
      const result = plan("čo je IVT Air X?");
      assert.ok(result.plan.selectedActions.some((action) => action.selector || action.anchorId));
    },
  },
  {
    name: "Service question returns service action",
    run: () => {
      const result = plan("čo je stropné chladenie?");
      assert.ok(result.plan.selectedActions.some((action) => action.entityId === "service-stropne-chladenie"));
    },
  },
  {
    name: "Unknown intent does not return random actions",
    run: () => {
      const result = plan("ahoj, len testujem");
      assert.equal(result.plan.intent, "unknown");
      assert.equal(result.plan.selectedActions.length, 0);
    },
  },
  {
    name: "Debug contains selected chunks and no raw contact values from memory",
    run: () => {
      const memory = createConversationState();
      memory.userProfile.email = "peter@test.sk";
      memory.userProfile.phone = "0903 123 456";
      const result = plan("čo je ComfoAir Q?", memory);
      assert.ok(result.debug.selectedChunks.length > 0);
      assert.ok(!JSON.stringify(result.debug).includes("peter@test.sk"));
      assert.ok(!JSON.stringify(result.debug).includes("0903 123 456"));
    },
  },
];

let passed = 0;

for (const test of tests) {
  test.run();
  passed += 1;
  console.log(`PASS ${test.name}`);
}

console.log(`\n${passed}/${tests.length} geotherm answer planner tests passed.`);
