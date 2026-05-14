import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

let loaded = false;

export function loadLocalEnv(): void {
  if (loaded) return;
  loaded = true;

  for (const file of [".env.local", ".env"]) {
    const fullPath = path.join(process.cwd(), file);
    if (!existsSync(fullPath)) continue;

    const lines = readFileSync(fullPath, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const match = trimmed.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/i);
      if (!match) continue;
      const key = match[1];
      if (process.env[key]) continue;
      const value = match[2].replace(/^['"]|['"]$/g, "");
      process.env[key] = value;
    }
  }
}
