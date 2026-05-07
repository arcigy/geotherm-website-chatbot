import { readFile } from "node:fs/promises";
import path from "node:path";
import { type KnowledgeChunk, retrieveKnowledge } from "./local-retrieval";

const knowledgePath = path.join(process.cwd(), "knowledge", "chatbot-knowledge.json");

async function main(): Promise<void> {
  const query = process.argv.slice(2).join(" ").replace(/\^/g, "").trim();
  if (!query) {
    console.error('Usage: npm run retrieve -- "otázka používateľa"');
    process.exitCode = 1;
    return;
  }

  const chunks = JSON.parse(await readFile(knowledgePath, "utf8")) as KnowledgeChunk[];
  const response = retrieveKnowledge(chunks, query, 5);

  console.log(`Query: ${response.query}`);
  console.log(`Normalized query: ${response.normalizedQuery}`);
  console.log(`Expanded tokens: ${response.expandedTokens.join(", ")}`);
  console.log("");

  if (!response.results.length) {
    console.log("No relevant local chunks found.");
    return;
  }

  response.results.forEach((result, index) => {
    console.log(`#${index + 1} score=${result.score.finalScore} confidence=${result.confidence}`);
    console.log(
      `breakdown title=${result.score.titleScore} heading=${result.score.headingScore} text=${result.score.textScore} phrase=${result.score.phraseScore} synonym=${result.score.synonymScore} url=${result.score.urlScore}`,
    );
    console.log(`pageTitle: ${result.chunk.pageTitle}`);
    console.log(`url: ${result.chunk.url}`);
    console.log(`sectionHeading: ${result.chunk.sectionHeading}`);
    console.log(`snippet: ${result.snippet}`);
    console.log("");
  });
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Retrieval failed: ${message}`);
  process.exitCode = 1;
});
