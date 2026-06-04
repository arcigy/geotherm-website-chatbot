import { startChatServer } from "./chat-server";

type ChatBody = {
  conversationId: string;
  answer: string;
  leadCapture: {
    shouldAsk: boolean;
    nextQuestion: string | null;
    reason?: string | null;
    requestedFields?: string[];
  };
  lead: {
    id?: string | null;
    captured: boolean;
    score: number;
    temperature?: string | null;
    status?: string | null;
    extractedContact?: Record<string, string>;
    missingFields?: string[];
    nextAction?: string | null;
  };
  debug?: {
    lead?: ChatBody["lead"];
    outreach?: {
      created: boolean;
      priority: string | null;
      reason: string | null;
      id: string | null;
    };
    persistence?: {
      conversationSaved: boolean;
      leadSaved: boolean;
      outreachSaved: boolean;
    };
  };
};

type Turn = {
  scenario: string;
  message: string;
  response: ChatBody;
};

const failures: string[] = [];

function assert(condition: unknown, message: string): void {
  if (!condition) failures.push(message);
}

function parseJsonObject(value: unknown): Record<string, unknown> {
  if (typeof value !== "string") return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function textIncludes(value: unknown, term: string): boolean {
  return typeof value === "string" && value.toLowerCase().includes(term.toLowerCase());
}

async function postChat(endpoint: string, anonymousId: string, message: string): Promise<ChatBody> {
  const response = await fetch(`${endpoint}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "http://localhost:5173" },
    body: JSON.stringify({
      siteId: "geotherm",
      anonymousId,
      currentUrl: "http://localhost/crm-test",
      message,
    }),
  });
  if (!response.ok) throw new Error(`POST /chat failed ${response.status}: ${await response.text()}`);
  return (await response.json()) as ChatBody;
}

async function adminGet<T>(endpoint: string, path: string, token: string): Promise<T> {
  const response = await fetch(`${endpoint}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`GET ${path} failed ${response.status}: ${await response.text()}`);
  return (await response.json()) as T;
}

async function runFlow(endpoint: string, anonymousId: string, messages: string[], scenario: string): Promise<Turn[]> {
  const turns: Turn[] = [];
  for (const message of messages) {
    const response = await postChat(endpoint, anonymousId, message);
    turns.push({ scenario, message, response });
  }
  return turns;
}

async function main(): Promise<void> {
  const token = `crm_test_${Date.now()}`;
  process.env.ADMIN_TOKEN = token;
  const server = await startChatServer({ port: 0 });
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  const endpoint = `http://127.0.0.1:${port}`;
  const allTurns: Turn[] = [];

  try {
    const contactTurns = await runFlow(
      endpoint,
      `crm_contact_${Date.now()}`,
      ["robim rekonstrukciu", "kurenie/chladenie", "radiatory, planujem zateplenie", "chcem prehliadku", "Dalibor Garek, 0987543621"],
      "contact_capture",
    );
    allTurns.push(...contactTurns);
    const dalibor = contactTurns.at(-1)?.response;
    assert(dalibor?.lead.captured === true, "Dalibor lead should be captured");
    assert(dalibor?.lead.extractedContact?.name === "Dalibor Garek", `Dalibor name not captured: ${JSON.stringify(dalibor?.lead.extractedContact)}`);
    assert(dalibor?.lead.extractedContact?.phone === "0987543621", `Dalibor phone not captured: ${JSON.stringify(dalibor?.lead.extractedContact)}`);
    assert(dalibor?.lead.status === "inspection_requested", `Dalibor status should be inspection_requested, got ${dalibor?.lead.status}`);
    assert((dalibor?.lead.score || 0) >= 70, `Dalibor score too low: ${dalibor?.lead.score}`);
    assert(dalibor?.debug?.outreach?.created === true, "Dalibor outreach item should be created");
    assert(dalibor?.debug?.persistence?.leadSaved === true, "Dalibor lead should be persisted");
    if (dalibor?.lead.id) {
      const saved = await adminGet<Record<string, unknown>>(endpoint, `/admin/leads/${encodeURIComponent(dalibor.lead.id)}`, token);
      assert(saved.name === "Dalibor Garek", `saved lead name mismatch: ${JSON.stringify(saved)}`);
      assert(saved.phone === "0987543621", `saved lead phone mismatch: ${JSON.stringify(saved)}`);
      assert(saved.location !== "Dalibor Garek", "name must not be saved as location");
      assert(saved.marketing_consent === 0, "marketing consent must stay false");
      assert(saved.contact_requested_by_user === 1, "contactRequestedByUser should be true");
      assert(typeof saved.summary === "string" && saved.summary.length > 40, "saved lead should include sales summary");
      assert(typeof saved.notes === "string" && saved.notes.length > 40, "saved lead should include notes for sales");
      const transcript = parseJsonObject(saved.transcript_json);
      assert(Array.isArray(transcript.messages) && transcript.messages.length >= 5, "saved lead transcript should include conversation messages");
      assert(textIncludes(transcript.summary, "Dalibor") || textIncludes(saved.summary, "Dalibor"), "lead summary should include contact name");
      assert(textIncludes(transcript.status, "inspection_requested"), `lead transcript status mismatch: ${String(transcript.status)}`);
    }

    const missing = await postChat(endpoint, `crm_missing_${Date.now()}`, "chcem obhliadku");
    allTurns.push({ scenario: "missing_contact", message: "chcem obhliadku", response: missing });
    assert(missing.leadCapture.shouldAsk === true, "missing contact should ask for contact");
    assert(missing.lead.status === "missing_contact", `missing contact status mismatch: ${missing.lead.status}`);
    assert((missing.leadCapture.requestedFields || []).includes("name"), "missing contact should request name");
    assert((missing.leadCapture.requestedFields || []).includes("phone"), "missing contact should request phone");
    assert((missing.leadCapture.requestedFields || []).includes("email"), "missing contact should request email");

    const technicianTurns = await runFlow(
      endpoint,
      `crm_technician_${Date.now()}`,
      ["Ahoj, chcem tč", "Starší 140m radiatory", "chcem aby prisiel technik, Dalibor Garek 0987543621"],
      "technician_inspection_request",
    );
    allTurns.push(...technicianTurns);
    const technician = technicianTurns.at(-1)?.response;
    assert(technician?.lead.captured === true, "technician inspection lead should be captured");
    assert(technician?.lead.status === "inspection_requested", `technician request status should be inspection_requested, got ${technician?.lead.status}`);
    assert((technician?.lead.score || 0) >= 70, `technician request score too low: ${technician?.lead.score}`);
    assert(technician?.debug?.outreach?.created === true, "technician inspection outreach should be created");

    const quoteTurns = await runFlow(
      endpoint,
      `crm_quote_${Date.now()}`,
      ["chcem cenovu ponuku na tepelne cerpadlo", "mam starsi dom 150m2, radiatory", "Peter, peter@example.com"],
      "quote_request",
    );
    allTurns.push(...quoteTurns);
    const quote = quoteTurns.at(-1)?.response;
    assert(quote?.lead.captured === true, "quote lead should be captured");
    assert(quote?.lead.extractedContact?.email === "peter@example.com", "quote email missing");
    assert(["quote_requested", "contact_captured"].includes(quote?.lead.status || ""), `quote status mismatch: ${quote?.lead.status}`);
    assert(quote?.debug?.outreach?.created === true, "quote outreach should be created");
    if (quote?.lead.id) {
      const savedQuote = await adminGet<Record<string, unknown>>(endpoint, `/admin/leads/${encodeURIComponent(quote.lead.id)}`, token);
      const quoteTranscript = parseJsonObject(savedQuote.transcript_json);
      assert(textIncludes(savedQuote.summary, "150") || textIncludes(quoteTranscript.summary, "150"), "quote summary should include known area");
      assert(textIncludes(savedQuote.summary, "radi") || textIncludes(quoteTranscript.summary, "radi"), "quote summary should include radiator context");
      assert(Array.isArray(quoteTranscript.messages) && quoteTranscript.messages.length >= 3, "quote transcript should include conversation messages");
    }

    const service = await postChat(endpoint, `crm_service_${Date.now()}`, "NIBE mi hlasi chybu, som v Nitre, 0911111111");
    allTurns.push({ scenario: "service_fault", message: "NIBE mi hlasi chybu, som v Nitre, 0911111111", response: service });
    assert(service.lead.captured === true, "service phone should be captured");
    assert(service.lead.status === "service_requested", `service status mismatch: ${service.lead.status}`);
    assert(service.debug?.outreach?.priority === "high", `service outreach should be high priority, got ${service.debug?.outreach?.priority}`);

    if (dalibor?.conversationId) {
      const detail = await adminGet<Record<string, unknown>>(endpoint, `/admin/conversations/${encodeURIComponent(dalibor.conversationId)}`, token);
      assert(Array.isArray(detail.messages), "conversation detail should include messages");
      assert(Boolean(detail.lead), "conversation detail should include lead");
    }
    const outreach = await adminGet<{ items: unknown[] }>(endpoint, "/admin/outreach", token);
    assert(outreach.items.length > 0, "admin outreach list should not be empty");
    if (dalibor?.lead.id) {
      const item = outreach.items.find((value) => typeof value === "object" && value && (value as Record<string, unknown>).lead_id === dalibor.lead.id) as Record<string, unknown> | undefined;
      assert(Boolean(item), "admin outreach should include Dalibor lead");
      assert(textIncludes(item?.suggested_action, "obhliad") || textIncludes(item?.suggested_action, "Zavola"), "outreach should tell sales the next action");
      assert(textIncludes(item?.suggested_action, "Výcuc"), "outreach should include a lead digest for sales");
      assert(textIncludes(item?.suggested_action, "Dalibor") || textIncludes(item?.suggested_action, "radi"), "outreach digest should include concrete conversation facts");
    }
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }

  console.log(`CRM lead tests: ${failures.length ? "FAIL" : "PASS"} (${allTurns.length} turns)`);
  if (failures.length) {
    for (const failure of failures) console.error(`- ${failure}`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
