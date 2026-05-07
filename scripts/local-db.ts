import { mkdirSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";

export type SiteRecord = {
  id: string;
  tenant_id: string;
  site_id: string;
  domain: string;
  allowed_origin: string;
  created_at: string;
};

export type SessionRecord = {
  id: string;
  site_id: string;
  anonymous_id: string;
  ip_hash: string | null;
  user_agent: string | null;
  created_at: string;
  last_seen_at: string;
};

export type ConversationRecord = {
  id: string;
  site_id: string;
  session_id: string;
  status: "active" | "lead_captured" | "closed";
  intent: string | null;
  qualification_state_json: string;
  created_at: string;
  updated_at: string;
};

export type LeadRecord = {
  id: string;
  conversation_id: string;
  site_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  project_type: string | null;
  location: string | null;
  timeline: string | null;
  budget: string | null;
  intent: string | null;
  score: number;
  transcript_json: string;
  created_at: string;
};

export const dbPath = path.join(process.cwd(), "data", "arcigy-local.db");

let db: DatabaseSync | null = null;

export function nowIso(): string {
  return new Date().toISOString();
}

export function createId(prefix: string): string {
  return `${prefix}_${randomUUID()}`;
}

export function getDb(): DatabaseSync {
  if (!db) {
    mkdirSync(path.dirname(dbPath), { recursive: true });
    db = new DatabaseSync(dbPath);
    db.exec("PRAGMA journal_mode = WAL;");
    db.exec("PRAGMA busy_timeout = 5000;");
    db.exec("PRAGMA foreign_keys = ON;");
  }
  return db;
}

export function initDb(): void {
  const database = getDb();

  database.exec(`
    CREATE TABLE IF NOT EXISTS tenants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sites (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL REFERENCES tenants(id),
      site_id TEXT NOT NULL UNIQUE,
      domain TEXT NOT NULL,
      allowed_origin TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      site_id TEXT NOT NULL REFERENCES sites(id),
      anonymous_id TEXT NOT NULL,
      ip_hash TEXT,
      user_agent TEXT,
      created_at TEXT NOT NULL,
      last_seen_at TEXT NOT NULL,
      UNIQUE(site_id, anonymous_id)
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      site_id TEXT NOT NULL REFERENCES sites(id),
      session_id TEXT NOT NULL REFERENCES sessions(id),
      status TEXT NOT NULL CHECK(status IN ('active', 'lead_captured', 'closed')),
      intent TEXT,
      qualification_state_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL REFERENCES conversations(id),
      role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
      content TEXT NOT NULL,
      confidence TEXT,
      sources_json TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL REFERENCES conversations(id),
      site_id TEXT NOT NULL REFERENCES sites(id),
      name TEXT,
      email TEXT,
      phone TEXT,
      project_type TEXT,
      location TEXT,
      timeline TEXT,
      budget TEXT,
      intent TEXT,
      score INTEGER NOT NULL,
      transcript_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      site_id TEXT NOT NULL REFERENCES sites(id),
      session_id TEXT,
      conversation_id TEXT,
      event_type TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS knowledge_versions (
      id TEXT PRIMARY KEY,
      site_id TEXT NOT NULL REFERENCES sites(id),
      source_file TEXT NOT NULL,
      chunks_count INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      is_active INTEGER NOT NULL CHECK(is_active IN (0, 1))
    );

    CREATE TABLE IF NOT EXISTS retrieval_events (
      id TEXT PRIMARY KEY,
      conversation_id TEXT,
      query TEXT NOT NULL,
      top_score REAL NOT NULL,
      confidence TEXT NOT NULL,
      top_sources_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_site_anon ON sessions(site_id, anonymous_id);
    CREATE INDEX IF NOT EXISTS idx_conversations_session_status ON conversations(session_id, status);
    CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
    CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
  `);

  seedDefaultData(database);
}

function seedDefaultData(database: DatabaseSync): void {
  const createdAt = nowIso();
  const tenantId = "tenant_geotherm";
  const siteRowId = "site_geotherm";

  database.prepare("INSERT OR IGNORE INTO tenants (id, name, created_at) VALUES (?, ?, ?)").run(
    tenantId,
    "Geotherm local MVP",
    createdAt,
  );
  database
    .prepare(
      "INSERT OR IGNORE INTO sites (id, tenant_id, site_id, domain, allowed_origin, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .run(siteRowId, tenantId, "geotherm", "geotherm.sk", "http://127.0.0.1:4321", createdAt);
  database
    .prepare(
      "INSERT OR IGNORE INTO knowledge_versions (id, site_id, source_file, chunks_count, created_at, is_active) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .run("kv_geotherm_local", siteRowId, "knowledge/chatbot-knowledge.json", 1371, createdAt, 1);
}

export function getSiteByPublicId(siteId: string): SiteRecord | null {
  initDb();
  return (getDb().prepare("SELECT * FROM sites WHERE site_id = ?").get(siteId) as SiteRecord | undefined) ?? null;
}

export function upsertSession(site: SiteRecord, anonymousId: string, userAgent?: string): SessionRecord {
  const database = getDb();
  const existing = database
    .prepare("SELECT * FROM sessions WHERE site_id = ? AND anonymous_id = ?")
    .get(site.id, anonymousId) as SessionRecord | undefined;
  const seenAt = nowIso();

  if (existing) {
    database
      .prepare("UPDATE sessions SET last_seen_at = ?, user_agent = COALESCE(?, user_agent) WHERE id = ?")
      .run(seenAt, userAgent ?? null, existing.id);
    return { ...existing, last_seen_at: seenAt, user_agent: userAgent ?? existing.user_agent };
  }

  const session: SessionRecord = {
    id: createId("ses"),
    site_id: site.id,
    anonymous_id: anonymousId,
    ip_hash: null,
    user_agent: userAgent ?? null,
    created_at: seenAt,
    last_seen_at: seenAt,
  };
  database
    .prepare(
      "INSERT INTO sessions (id, site_id, anonymous_id, ip_hash, user_agent, created_at, last_seen_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .run(session.id, session.site_id, session.anonymous_id, session.ip_hash, session.user_agent, session.created_at, session.last_seen_at);
  return session;
}

export function getOrCreateActiveConversation(site: SiteRecord, session: SessionRecord): ConversationRecord {
  const database = getDb();
  const existing = database
    .prepare("SELECT * FROM conversations WHERE site_id = ? AND session_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 1")
    .get(site.id, session.id) as ConversationRecord | undefined;

  if (existing) return existing;

  const createdAt = nowIso();
  const conversation: ConversationRecord = {
    id: createId("con"),
    site_id: site.id,
    session_id: session.id,
    status: "active",
    intent: null,
    qualification_state_json: "{}",
    created_at: createdAt,
    updated_at: createdAt,
  };
  database
    .prepare(
      "INSERT INTO conversations (id, site_id, session_id, status, intent, qualification_state_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .run(
      conversation.id,
      conversation.site_id,
      conversation.session_id,
      conversation.status,
      conversation.intent,
      conversation.qualification_state_json,
      conversation.created_at,
      conversation.updated_at,
    );
  return conversation;
}

export function updateConversation(
  conversationId: string,
  changes: { status?: string; intent?: string; qualificationStateJson?: string },
): void {
  const current = getDb().prepare("SELECT * FROM conversations WHERE id = ?").get(conversationId) as ConversationRecord;
  getDb()
    .prepare("UPDATE conversations SET status = ?, intent = ?, qualification_state_json = ?, updated_at = ? WHERE id = ?")
    .run(
      changes.status ?? current.status,
      changes.intent ?? current.intent,
      changes.qualificationStateJson ?? current.qualification_state_json,
      nowIso(),
      conversationId,
    );
}

export function insertMessage(input: {
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  confidence?: string | null;
  sources?: unknown;
}): void {
  getDb()
    .prepare(
      "INSERT INTO messages (id, conversation_id, role, content, confidence, sources_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .run(
      createId("msg"),
      input.conversationId,
      input.role,
      input.content,
      input.confidence ?? null,
      input.sources ? JSON.stringify(input.sources) : null,
      nowIso(),
    );
}

export function insertEvent(input: {
  siteId: string;
  sessionId?: string | null;
  conversationId?: string | null;
  eventType: string;
  payload?: unknown;
}): void {
  getDb()
    .prepare(
      "INSERT INTO events (id, site_id, session_id, conversation_id, event_type, payload_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .run(
      createId("evt"),
      input.siteId,
      input.sessionId ?? null,
      input.conversationId ?? null,
      input.eventType,
      JSON.stringify(input.payload ?? {}),
      nowIso(),
    );
}

export function insertRetrievalEvent(input: {
  conversationId: string;
  query: string;
  topScore: number;
  confidence: string;
  topSources: unknown;
}): void {
  getDb()
    .prepare(
      "INSERT INTO retrieval_events (id, conversation_id, query, top_score, confidence, top_sources_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .run(createId("ret"), input.conversationId, input.query, input.topScore, input.confidence, JSON.stringify(input.topSources), nowIso());
}

export function getConversationMessages(conversationId: string): Array<{ role: string; content: string; created_at: string }> {
  return getDb()
    .prepare("SELECT role, content, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at ASC")
    .all(conversationId) as Array<{ role: string; content: string; created_at: string }>;
}

export function upsertLead(input: {
  conversationId: string;
  siteId: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  projectType?: string | null;
  location?: string | null;
  timeline?: string | null;
  budget?: string | null;
  intent?: string | null;
  score: number;
  transcript: unknown;
}): LeadRecord {
  const database = getDb();
  const existing = database.prepare("SELECT * FROM leads WHERE conversation_id = ?").get(input.conversationId) as LeadRecord | undefined;
  const createdAt = existing?.created_at ?? nowIso();
  const lead: LeadRecord = {
    id: existing?.id ?? createId("lead"),
    conversation_id: input.conversationId,
    site_id: input.siteId,
    name: input.name ?? existing?.name ?? null,
    email: input.email ?? existing?.email ?? null,
    phone: input.phone ?? existing?.phone ?? null,
    project_type: input.projectType ?? existing?.project_type ?? null,
    location: input.location ?? existing?.location ?? null,
    timeline: input.timeline ?? existing?.timeline ?? null,
    budget: input.budget ?? existing?.budget ?? null,
    intent: input.intent ?? existing?.intent ?? null,
    score: input.score,
    transcript_json: JSON.stringify(input.transcript),
    created_at: createdAt,
  };

  database
    .prepare(
      `INSERT OR REPLACE INTO leads
       (id, conversation_id, site_id, name, email, phone, project_type, location, timeline, budget, intent, score, transcript_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      lead.id,
      lead.conversation_id,
      lead.site_id,
      lead.name,
      lead.email,
      lead.phone,
      lead.project_type,
      lead.location,
      lead.timeline,
      lead.budget,
      lead.intent,
      lead.score,
      lead.transcript_json,
      lead.created_at,
    );
  return lead;
}

export function listRecentLeads(limit = 20): LeadRecord[] {
  initDb();
  return getDb().prepare("SELECT * FROM leads ORDER BY created_at DESC LIMIT ?").all(limit) as LeadRecord[];
}
