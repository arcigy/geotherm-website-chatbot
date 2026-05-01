import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { getRelevantGeothermContext } from "@/lib/geothermKnowledge";
import { geothermSystemPrompt } from "@/lib/geothermPrompt";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function cleanMarkdownResponse(value: string) {
  return value
    .split("\n")
    .map((line) => (line.includes("|") ? line.replace(/ {2,}/g, " ").trim() : line))
    .join("\n")
    .trim();
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing GEMINI_API_KEY environment variable." },
      { status: 500 },
    );
  }

  const body = (await request.json()) as { messages?: ChatMessage[] };
  const messages = body.messages?.slice(-12) ?? [];
  const latestUserMessage = [...messages].reverse().find((message) => message.role === "user");

  if (!latestUserMessage?.content?.trim()) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }

  const ai = new GoogleGenAI({ apiKey });
  const queryContext = messages
    .slice(-4)
    .map((message) => `${message.role}: ${message.content}`)
    .join("\n");
  const knowledgeContext = getRelevantGeothermContext(
    queryContext,
  );
  const wantsComparison = /porovnaj|porovnanie|rozdiel|vs\.?|výhody|vyhody|značky|znacky|možnosti|moznosti/i.test(
    queryContext,
  );
  const formatInstruction = wantsComparison
    ? "Použi presne tento kompaktný formát: ### Krátky nadpis\n1 veta úvodu.\n| Položka | Kedy dáva zmysel | Hlavný prínos |\n|---|---|---|\n| Názov | krátky text | krátky text |\nPotom 1 krátky záver. Nikdy nezarovnávaj tabuľku medzerami. Nepouži vnorené odrážky."
    : "Použi krátky nadpis, stručné sekcie a maximálne jeden krátky zoznam.";

      const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: messages.map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    })),
    config: {
      systemInstruction: `${geothermSystemPrompt}

Používaj primárne tieto aktuálne podklady zo stránky GEOTHERM. Ak v nich odpoveď nie je, povedz, že to treba overiť u GEOTHERM.

Formát tejto odpovede:
${formatInstruction}

${knowledgeContext}`,
      temperature: 0.45,
      maxOutputTokens: 520,
      thinkingConfig: {
        thinkingBudget: 0,
      },
    },
  });

  return NextResponse.json({
    message: cleanMarkdownResponse(
      response.text ?? "Nepodarilo sa pripraviť odpoveď. Skúste otázku preformulovať.",
    ),
  });
}
