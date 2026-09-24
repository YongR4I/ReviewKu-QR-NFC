import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export function parseEnvFile(path: string): Record<string, string> {
  const out: Record<string, string> = {};
  const raw = readFileSync(path, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

export function localEnv(): Record<string, string> {
  return parseEnvFile(resolve(process.cwd(), ".env.local"));
}
