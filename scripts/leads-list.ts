import { listRecentLeads } from "./local-db";

const leads = listRecentLeads(20);

if (!leads.length) {
  console.log("No leads captured yet.");
  process.exit(0);
}

for (const lead of leads) {
  const rawTranscript = JSON.parse(lead.transcript_json) as
    | Array<{ role: string; content: string }>
    | { messages?: Array<{ role: string; content: string }>; leadProfile?: { description?: string; interestLevel?: string; stage?: string } };
  const transcript = Array.isArray(rawTranscript) ? rawTranscript : rawTranscript.messages || [];
  const leadProfile = Array.isArray(rawTranscript) ? null : rawTranscript.leadProfile || null;
  const summary = transcript
    .filter((message) => message.role === "user")
    .slice(-3)
    .map((message) => message.content.replace(/\s+/g, " ").slice(0, 90))
    .join(" | ");

  console.log([
    `Lead ${lead.id}`,
    `created_at: ${lead.created_at}`,
    `name: ${lead.name || "-"}`,
    `email: ${lead.email || "-"}`,
    `phone: ${lead.phone || "-"}`,
    `intent: ${lead.intent || "-"}`,
    `score: ${lead.score}`,
    `description: ${leadProfile?.description || "-"}`,
    `interest_level: ${leadProfile?.interestLevel || "-"}`,
    `stage: ${leadProfile?.stage || "-"}`,
    `summary: ${summary || "-"}`,
    "",
  ].join("\n"));
}
