import { listRecentLeads } from "./local-db";

const leads = listRecentLeads(20);

if (!leads.length) {
  console.log("No leads captured yet.");
  process.exit(0);
}

for (const lead of leads) {
  const transcript = JSON.parse(lead.transcript_json) as Array<{ role: string; content: string }>;
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
    `summary: ${summary || "-"}`,
    "",
  ].join("\n"));
}
