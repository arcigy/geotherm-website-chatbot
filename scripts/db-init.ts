import { initDb, dbPath } from "./local-db";

initDb();
console.log(`Initialized local Arcigy SQLite database: ${dbPath}`);
