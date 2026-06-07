import { transcribeGeothermAudio } from "@/lib/geotherm-transcribe";
import { NextResponse } from "next/server";

type TranscribeRequest = {
  audioBase64?: string;
  mimeType?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TranscribeRequest;
    const result = await transcribeGeothermAudio({
      audioBase64: body.audioBase64 || "",
      mimeType: body.mimeType,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message.includes("required") || message.includes("large") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
