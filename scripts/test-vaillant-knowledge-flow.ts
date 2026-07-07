import assert from "node:assert/strict";
import { createChatResponse, type ChatResponse } from "./chat-server";

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasAny(value: string, terms: string[]): boolean {
  const normalized = normalize(value);
  return terms.some((term) => normalized.includes(normalize(term)));
}

async function ask(anonymousId: string, message: string): Promise<ChatResponse> {
  return createChatResponse({
    message,
    siteId: "geotherm",
    anonymousId,
    currentUrl: "http://127.0.0.1:4321/embed-preview.html",
    metadata: {
      userAgent: "vaillant-knowledge-flow-test",
      referrer: "local-vaillant-knowledge-flow-test",
    },
  });
}

async function runConversation(id: string, messages: string[]): Promise<ChatResponse[]> {
  const anonymousId = `vaillant_flow_${id}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const responses: ChatResponse[] = [];
  for (const message of messages) responses.push(await ask(anonymousId, message));
  return responses;
}

async function main(): Promise<void> {
  const noContext = await ask(
    `vaillant_no_context_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    "Kolko stoji tepelne cerpadlo?",
  );
  assert.equal(hasAny(noContext.answer, ["13 890", "13890", "18 520", "18520", "aroTHERM split plus 55"]), false);
  assert.equal(hasAny(noContext.answer, ["plocha", "m2", "radiatory", "podlahove", "dom"]), true, noContext.answer);

  const initial = await ask(
    `initial_ai_first_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    "chcem si vybrat tc",
  );
  assert.equal(initial.debug?.llmUsed, true);
  assert.equal(hasAny((initial.debug?.validatorsTriggered || []).join(" "), ["initial_heat_pump_recommendation_repaired"]), false);
  assert.equal(hasAny(initial.answer, ["novostav", "rekonstruk", "plocha", "m2", "radiator", "podlah"]), true, initial.answer);

  const qualified = await runConversation("qualified_250_reconstruction_radiators", [
    "Chcem tepelne cerpadlo",
    "Dom ma 250 m2",
    "Je to rekonstrukcia",
    "Mame radiatory",
    "Kurime plynom",
    "Chcem vediet orientacnu cenu s montazou",
  ]);
  const finalQualified = qualified.at(-1);
  assert.ok(finalQualified, "qualified conversation did not produce a final response");
  assert.equal(finalQualified.debug?.llmUsed, true);
  assert.equal(hasAny(finalQualified.answer, ["orientac", "predbez", "nie final", "ponuka", "nacenenie"]), true, finalQualified.answer);
  assert.equal(hasAny(finalQualified.answer, ["radiator", "teplotu vody", "kotoln", "plyn"]), true, finalQualified.answer);

  const splitPlusNewBuild = await runConversation("split_plus_150_new_build_floor_heating", [
    "Chcem tepelne cerpadlo",
    "Novostavba",
    "150 m2",
    "Podlahovka",
    "Kolko to bude stat?",
  ]);
  const areaFollowUp = splitPlusNewBuild.at(2);
  assert.ok(areaFollowUp, "split-plus conversation did not produce area follow-up");
  assert.equal(hasAny(areaFollowUp.answer, ["radiator", "podlah"]), true, areaFollowUp.answer);
  assert.equal(hasAny(areaFollowUp.answer, ["14 450", "14450", "Vaillant", "aroTHERM"]), false, areaFollowUp.answer);
  const finalSplitPlus = splitPlusNewBuild.at(-1);
  assert.ok(finalSplitPlus, "split-plus conversation did not produce a final response");
  assert.equal(hasAny(finalSplitPlus.answer, ["14 450", "14450"]), true, finalSplitPlus.answer);
  assert.equal(hasAny(finalSplitPlus.answer, ["split plus", "75/8.2AS", "75 8 2AS"]), true, finalSplitPlus.answer);
  assert.equal(hasAny(finalSplitPlus.answer, ["16 350", "16350", "15 880", "15880"]), false, finalSplitPlus.answer);

  const largeHouse = await runConversation("large_house_580", [
    "Mam 580 m2 dom a chcem cenu tepelneho cerpadla s montazou",
    "Je to rekonstrukcia",
    "Mame radiatory",
    "Kurime plynom",
    "Chcem cenu",
  ]);
  const finalLarge = largeHouse.at(-1);
  assert.ok(finalLarge, "large-house conversation did not produce a final response");
  assert.equal(hasAny(finalLarge.answer, ["nad 320", "nad 300", "individual", "neodhad", "projekt"]), true, finalLarge.answer);
  assert.equal(hasAny(finalLarge.answer, ["18 520", "18520", "19 225", "19225"]), false, finalLarge.answer);

  console.log("PASS Vaillant chatbot-friendly knowledge flow");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
