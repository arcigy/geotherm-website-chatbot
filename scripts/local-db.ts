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
  visitor_id: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  preferred_contact_method: string | null;
  service_type: string | null;
  service_intent: string | null;
  project_type: string | null;
  location: string | null;
  area_m2: number | null;
  heating_distribution: string | null;
  current_heat_source: string | null;
  wants_cooling: number | null;
  wants_hot_water: number | null;
  project_available: number | null;
  heat_loss_known: number | null;
  timeline: string | null;
  budget: string | null;
  intent: string | null;
  score: number;
  temperature: string | null;
  status: string | null;
  owner: string | null;
  next_action: string | null;
  next_action_at: string | null;
  last_contacted_at: string | null;
  source: string | null;
  tags_json: string | null;
  summary: string | null;
  notes: string | null;
  consent_to_contact: number | null;
  contact_requested_by_user: number | null;
  marketing_consent: number | null;
  privacy_notice_shown: number | null;
  data_retention_until: string | null;
  transcript_json: string;
  created_at: string;
  updated_at: string;
};

export type OutreachRecord = {
  id: string;
  lead_id: string;
  conversation_id: string;
  site_id: string;
  priority: string;
  reason: string;
  suggested_action: string;
  status: string;
  due_at: string | null;
  created_at: string;
  updated_at: string;
};

export const dbPath = path.join(process.cwd(), "data", "arcigy-local.db");

let db: DatabaseSync | null = null;

export function nowIso(): string {
  return new Date().toISOString();
}

function sessionTimeoutSeconds(): number {
  const parsed = Number.parseInt(process.env.SESSION_TIMEOUT_SECONDS || "7200", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 7200;
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

    CREATE TABLE IF NOT EXISTS outreach_items (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL REFERENCES leads(id),
      conversation_id TEXT NOT NULL REFERENCES conversations(id),
      site_id TEXT NOT NULL REFERENCES sites(id),
      priority TEXT NOT NULL,
      reason TEXT NOT NULL,
      suggested_action TEXT NOT NULL,
      status TEXT NOT NULL,
      due_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
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
    CREATE INDEX IF NOT EXISTS idx_leads_conversation ON leads(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
    CREATE INDEX IF NOT EXISTS idx_outreach_status ON outreach_items(status, priority);
    CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
  `);

  migrateLeadSchema(database);
  database.exec("CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);");
  seedDefaultData(database);
}

function tableColumns(database: DatabaseSync, tableName: string): Set<string> {
  return new Set((database.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string }>).map((column) => column.name));
}

function ensureColumn(database: DatabaseSync, tableName: string, columnName: string, definition: string): void {
  if (tableColumns(database, tableName).has(columnName)) return;
  database.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
}

function migrateLeadSchema(database: DatabaseSync): void {
  ensureColumn(database, "leads", "visitor_id", "TEXT");
  ensureColumn(database, "leads", "preferred_contact_method", "TEXT");
  ensureColumn(database, "leads", "service_type", "TEXT");
  ensureColumn(database, "leads", "service_intent", "TEXT");
  ensureColumn(database, "leads", "area_m2", "INTEGER");
  ensureColumn(database, "leads", "heating_distribution", "TEXT");
  ensureColumn(database, "leads", "current_heat_source", "TEXT");
  ensureColumn(database, "leads", "wants_cooling", "INTEGER");
  ensureColumn(database, "leads", "wants_hot_water", "INTEGER");
  ensureColumn(database, "leads", "project_available", "INTEGER");
  ensureColumn(database, "leads", "heat_loss_known", "INTEGER");
  ensureColumn(database, "leads", "temperature", "TEXT");
  ensureColumn(database, "leads", "status", "TEXT");
  ensureColumn(database, "leads", "owner", "TEXT");
  ensureColumn(database, "leads", "next_action", "TEXT");
  ensureColumn(database, "leads", "next_action_at", "TEXT");
  ensureColumn(database, "leads", "last_contacted_at", "TEXT");
  ensureColumn(database, "leads", "source", "TEXT");
  ensureColumn(database, "leads", "tags_json", "TEXT");
  ensureColumn(database, "leads", "summary", "TEXT");
  ensureColumn(database, "leads", "notes", "TEXT");
  ensureColumn(database, "leads", "consent_to_contact", "INTEGER");
  ensureColumn(database, "leads", "contact_requested_by_user", "INTEGER");
  ensureColumn(database, "leads", "marketing_consent", "INTEGER");
  ensureColumn(database, "leads", "privacy_notice_shown", "INTEGER");
  ensureColumn(database, "leads", "data_retention_until", "TEXT");
  ensureColumn(database, "leads", "updated_at", "TEXT");
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
  const activeConversations = database
    .prepare("SELECT * FROM conversations WHERE site_id = ? AND session_id = ? AND status = 'active' ORDER BY updated_at DESC")
    .all(site.id, session.id) as ConversationRecord[];

  const timeoutMs = sessionTimeoutSeconds() * 1000;
  const now = Date.now();
  for (const active of activeConversations) {
    const updatedAtMs = Date.parse(active.updated_at);
    const isExpired = !Number.isFinite(updatedAtMs) || now - updatedAtMs > timeoutMs;
    if (!isExpired) return active;
    database.prepare("UPDATE conversations SET status = ?, updated_at = ? WHERE id = ?").run("closed", nowIso(), active.id);
  }

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
  visitorId?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  preferredContactMethod?: string | null;
  serviceType?: string | null;
  serviceIntent?: string | null;
  projectType?: string | null;
  location?: string | null;
  areaM2?: number | null;
  heatingDistribution?: string | null;
  currentHeatSource?: string | null;
  wantsCooling?: boolean | null;
  wantsHotWater?: boolean | null;
  projectAvailable?: boolean | null;
  heatLossKnown?: boolean | null;
  timeline?: string | null;
  budget?: string | null;
  intent?: string | null;
  score: number;
  temperature?: string | null;
  status?: string | null;
  owner?: string | null;
  nextAction?: string | null;
  nextActionAt?: string | null;
  lastContactedAt?: string | null;
  source?: string | null;
  tags?: string[] | null;
  summary?: string | null;
  notes?: string | null;
  consentToContact?: boolean | null;
  contactRequestedByUser?: boolean | null;
  marketingConsent?: boolean | null;
  privacyNoticeShown?: boolean | null;
  dataRetentionUntil?: string | null;
  transcript: unknown;
}): LeadRecord {
  const database = getDb();
  const existing = database.prepare("SELECT * FROM leads WHERE conversation_id = ?").get(input.conversationId) as LeadRecord | undefined;
  const createdAt = existing?.created_at ?? nowIso();
  const updatedAt = nowIso();
  const lead: LeadRecord = {
    id: existing?.id ?? createId("lead"),
    conversation_id: input.conversationId,
    site_id: input.siteId,
    visitor_id: input.visitorId ?? existing?.visitor_id ?? null,
    name: input.name ?? existing?.name ?? null,
    email: input.email ?? existing?.email ?? null,
    phone: input.phone ?? existing?.phone ?? null,
    preferred_contact_method: input.preferredContactMethod ?? existing?.preferred_contact_method ?? null,
    service_type: input.serviceType ?? existing?.service_type ?? null,
    service_intent: input.serviceIntent ?? existing?.service_intent ?? null,
    project_type: input.projectType ?? existing?.project_type ?? null,
    location: input.location ?? existing?.location ?? null,
    area_m2: input.areaM2 ?? existing?.area_m2 ?? null,
    heating_distribution: input.heatingDistribution ?? existing?.heating_distribution ?? null,
    current_heat_source: input.currentHeatSource ?? existing?.current_heat_source ?? null,
    wants_cooling: input.wantsCooling === undefined || input.wantsCooling === null ? existing?.wants_cooling ?? null : input.wantsCooling ? 1 : 0,
    wants_hot_water: input.wantsHotWater === undefined || input.wantsHotWater === null ? existing?.wants_hot_water ?? null : input.wantsHotWater ? 1 : 0,
    project_available: input.projectAvailable === undefined || input.projectAvailable === null ? existing?.project_available ?? null : input.projectAvailable ? 1 : 0,
    heat_loss_known: input.heatLossKnown === undefined || input.heatLossKnown === null ? existing?.heat_loss_known ?? null : input.heatLossKnown ? 1 : 0,
    timeline: input.timeline ?? existing?.timeline ?? null,
    budget: input.budget ?? existing?.budget ?? null,
    intent: input.intent ?? existing?.intent ?? null,
    score: input.score,
    temperature: input.temperature ?? existing?.temperature ?? null,
    status: input.status ?? existing?.status ?? null,
    owner: input.owner ?? existing?.owner ?? null,
    next_action: input.nextAction ?? existing?.next_action ?? null,
    next_action_at: input.nextActionAt ?? existing?.next_action_at ?? null,
    last_contacted_at: input.lastContactedAt ?? existing?.last_contacted_at ?? null,
    source: input.source ?? existing?.source ?? null,
    tags_json: input.tags ? JSON.stringify(input.tags) : existing?.tags_json ?? null,
    summary: input.summary ?? existing?.summary ?? null,
    notes: input.notes ?? existing?.notes ?? null,
    consent_to_contact: input.consentToContact === undefined || input.consentToContact === null ? existing?.consent_to_contact ?? null : input.consentToContact ? 1 : 0,
    contact_requested_by_user:
      input.contactRequestedByUser === undefined || input.contactRequestedByUser === null ? existing?.contact_requested_by_user ?? null : input.contactRequestedByUser ? 1 : 0,
    marketing_consent: input.marketingConsent === undefined || input.marketingConsent === null ? existing?.marketing_consent ?? 0 : input.marketingConsent ? 1 : 0,
    privacy_notice_shown: input.privacyNoticeShown === undefined || input.privacyNoticeShown === null ? existing?.privacy_notice_shown ?? null : input.privacyNoticeShown ? 1 : 0,
    data_retention_until: input.dataRetentionUntil ?? existing?.data_retention_until ?? null,
    transcript_json: JSON.stringify(input.transcript),
    created_at: createdAt,
    updated_at: updatedAt,
  };

  database
    .prepare(
      `INSERT OR REPLACE INTO leads
       (id, conversation_id, site_id, visitor_id, name, email, phone, preferred_contact_method, service_type, service_intent, project_type, location,
        area_m2, heating_distribution, current_heat_source, wants_cooling, wants_hot_water, project_available, heat_loss_known, timeline, budget,
        intent, score, temperature, status, owner, next_action, next_action_at, last_contacted_at, source, tags_json, summary, notes,
        consent_to_contact, contact_requested_by_user, marketing_consent, privacy_notice_shown, data_retention_until, transcript_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      lead.id,
      lead.conversation_id,
      lead.site_id,
      lead.visitor_id,
      lead.name,
      lead.email,
      lead.phone,
      lead.preferred_contact_method,
      lead.service_type,
      lead.service_intent,
      lead.project_type,
      lead.location,
      lead.area_m2,
      lead.heating_distribution,
      lead.current_heat_source,
      lead.wants_cooling,
      lead.wants_hot_water,
      lead.project_available,
      lead.heat_loss_known,
      lead.timeline,
      lead.budget,
      lead.intent,
      lead.score,
      lead.temperature,
      lead.status,
      lead.owner,
      lead.next_action,
      lead.next_action_at,
      lead.last_contacted_at,
      lead.source,
      lead.tags_json,
      lead.summary,
      lead.notes,
      lead.consent_to_contact,
      lead.contact_requested_by_user,
      lead.marketing_consent,
      lead.privacy_notice_shown,
      lead.data_retention_until,
      lead.transcript_json,
      lead.created_at,
      lead.updated_at,
    );
  return lead;
}

export function listRecentLeads(limit = 20): LeadRecord[] {
  initDb();
  return getDb().prepare("SELECT * FROM leads ORDER BY updated_at DESC, created_at DESC LIMIT ?").all(limit) as LeadRecord[];
}

export function getLeadById(id: string): LeadRecord | null {
  initDb();
  return (getDb().prepare("SELECT * FROM leads WHERE id = ?").get(id) as LeadRecord | undefined) ?? null;
}

export function getLeadByConversation(conversationId: string): LeadRecord | null {
  initDb();
  return (getDb().prepare("SELECT * FROM leads WHERE conversation_id = ?").get(conversationId) as LeadRecord | undefined) ?? null;
}

export function updateLeadById(id: string, changes: Partial<Pick<LeadRecord, "status" | "owner" | "next_action" | "next_action_at" | "last_contacted_at" | "notes">>): LeadRecord | null {
  initDb();
  const current = getLeadById(id);
  if (!current) return null;
  const updatedAt = nowIso();
  getDb()
    .prepare("UPDATE leads SET status = ?, owner = ?, next_action = ?, next_action_at = ?, last_contacted_at = ?, notes = ?, updated_at = ? WHERE id = ?")
    .run(
      changes.status ?? current.status,
      changes.owner ?? current.owner,
      changes.next_action ?? current.next_action,
      changes.next_action_at ?? current.next_action_at,
      changes.last_contacted_at ?? current.last_contacted_at,
      changes.notes ?? current.notes,
      updatedAt,
      id,
    );
  return getLeadById(id);
}

export function createOrUpdateOutreachItem(input: {
  leadId: string;
  conversationId: string;
  siteId: string;
  priority: "low" | "medium" | "high";
  reason: string;
  suggestedAction: string;
  dueAt?: string | null;
}): OutreachRecord {
  initDb();
  const database = getDb();
  const existing = database
    .prepare("SELECT * FROM outreach_items WHERE lead_id = ? AND reason = ? AND status = 'open' ORDER BY created_at DESC")
    .get(input.leadId, input.reason) as OutreachRecord | undefined;
  const now = nowIso();
  const item: OutreachRecord = {
    id: existing?.id ?? createId("out"),
    lead_id: input.leadId,
    conversation_id: input.conversationId,
    site_id: input.siteId,
    priority: input.priority,
    reason: input.reason,
    suggested_action: input.suggestedAction,
    status: existing?.status ?? "open",
    due_at: input.dueAt ?? existing?.due_at ?? null,
    created_at: existing?.created_at ?? now,
    updated_at: now,
  };
  database
    .prepare(
      `INSERT OR REPLACE INTO outreach_items
       (id, lead_id, conversation_id, site_id, priority, reason, suggested_action, status, due_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(item.id, item.lead_id, item.conversation_id, item.site_id, item.priority, item.reason, item.suggested_action, item.status, item.due_at, item.created_at, item.updated_at);
  return item;
}

export function listOutreachItems(status = "open", limit = 50): OutreachRecord[] {
  initDb();
  return getDb()
    .prepare("SELECT * FROM outreach_items WHERE status = ? ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, created_at DESC LIMIT ?")
    .all(status, limit) as OutreachRecord[];
}

export function updateOutreachItem(id: string, changes: Partial<Pick<OutreachRecord, "status" | "priority" | "suggested_action" | "due_at">>): OutreachRecord | null {
  initDb();
  const current = getDb().prepare("SELECT * FROM outreach_items WHERE id = ?").get(id) as OutreachRecord | undefined;
  if (!current) return null;
  getDb()
    .prepare("UPDATE outreach_items SET status = ?, priority = ?, suggested_action = ?, due_at = ?, updated_at = ? WHERE id = ?")
    .run(changes.status ?? current.status, changes.priority ?? current.priority, changes.suggested_action ?? current.suggested_action, changes.due_at ?? current.due_at, nowIso(), id);
  return (getDb().prepare("SELECT * FROM outreach_items WHERE id = ?").get(id) as OutreachRecord | undefined) ?? null;
}

export function listAdminConversations(limit = 50): Array<Record<string, unknown>> {
  initDb();
  return getDb()
    .prepare(
      `SELECT c.*, s.anonymous_id AS visitor_id, l.id AS lead_id, l.status AS lead_status, l.score AS lead_score, l.temperature AS lead_temperature,
              (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message
       FROM conversations c
       JOIN sessions s ON s.id = c.session_id
       LEFT JOIN leads l ON l.conversation_id = c.id
       ORDER BY c.updated_at DESC
       LIMIT ?`,
    )
    .all(limit) as Array<Record<string, unknown>>;
}

export function getAdminConversation(id: string): Record<string, unknown> | null {
  initDb();
  const conversation = getDb()
    .prepare(
      `SELECT c.*, s.anonymous_id AS visitor_id, s.user_agent
       FROM conversations c
       JOIN sessions s ON s.id = c.session_id
       WHERE c.id = ?`,
    )
    .get(id) as Record<string, unknown> | undefined;
  if (!conversation) return null;
  const messages = getDb().prepare("SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC").all(id);
  const events = getDb().prepare("SELECT * FROM events WHERE conversation_id = ? ORDER BY created_at ASC").all(id);
  const retrieval = getDb().prepare("SELECT * FROM retrieval_events WHERE conversation_id = ? ORDER BY created_at ASC").all(id);
  const lead = getLeadByConversation(id);
  const outreach = getDb().prepare("SELECT * FROM outreach_items WHERE conversation_id = ? ORDER BY created_at DESC").all(id);
  return { conversation, messages, events, retrieval, lead, outreach };
}
