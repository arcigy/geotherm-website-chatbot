# Current System Status

Generated: 2026-05-07

## Čo systém teraz vie

- Exportovať verejný WordPress obsah cez REST API.
- Vyčistiť obsah do retrieval chunkov.
- Lokálne vyhľadávať relevantné chunky bez OpenAI a bez embeddings.
- Obslúžiť `POST /chat` cez lokálne API.
- Viesť session a active conversation v SQLite.
- Ukladať user/assistant messages.
- Detegovať intent deterministicky.
- Viesť jednoduchý HVAC qualification state.
- Extrahovať email/telefón/meno z textu.
- Vytvoriť lead a uložiť transcript.
- Logovať základné events a retrieval events.
- Vypísať leady cez CLI.
- Vygenerovať analytics a security report.
- Otestovať sales flow lokálne.

## Čo systém nevie

- Nemá produkčnú autentifikáciu tenant/site requestov.
- Nemá rate limiting.
- Nemá CRM ani email handoff.
- Nemá admin dashboard.
- Nemá LLM odpovede ani grounded synthesis.
- Nemá embeddings/vector DB.
- Nemá queue systém pre ingestion/retry.
- Nemá production monitoring ani alerting.
- Nemá reálne multi-tenant billing/isoláciu.

## Ako spustiť DB

```bash
npm run db:init
```

Vytvorí lokálnu SQLite DB:

```text
data/arcigy-local.db
```

## Ako spustiť chat API

```bash
npm run dev:chat-api
```

Default:

```text
http://127.0.0.1:4317/chat
```

## Ako spustiť widget

```bash
npm run preview:embed
```

Preview:

```text
http://127.0.0.1:4321/embed-preview.html
```

## Ako spustiť testy

```bash
npm run test:chat-api
npm run test:embed-ui
npm run test:sales-flow
npm run evaluate:retrieval
```

## Reporty

```bash
npm run leads:list
npm run analytics:report
npm run security:self-check
```

## Čo je stále demo

- SQLite je lokálna MVP databáza, nie production managed DB.
- Intent detection je keyword-based.
- Qualification flow je pevne napísaný pre HVAC.
- Lead handoff sa len uloží do DB, neposiela sa obchodníkovi.
- Analytics sú CLI/report, nie dashboard.
- Security self-check explicitne hlási chýbajúce signed site keys a rate limit.

## Čo je pripravené na produkčnú fázu

- Základné API contracts pre sales intake.
- Prenositeľná tabuľková schéma smerom na Postgres.
- Event taxonomy ako základ analytics.
- Lead capture model.
- Testovateľný flow bez LLM závislosti.
- Lokálne E2E testy widget → API → retrieval → sales state.
