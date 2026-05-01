import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { geothermSystemPrompt } from "@/lib/geothermPrompt";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

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

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: messages.map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    })),
    config: {
      systemInstruction: geothermSystemPrompt,
      temperature: 0.45,
      maxOutputTokens: 420,
      thinkingConfig: {
        thinkingBudget: 0,
      },
    },
  });

  return NextResponse.json({
    message: response.text ?? "Nepodarilo sa pripraviť odpoveď. Skúste otázku preformulovať.",
  });
}
