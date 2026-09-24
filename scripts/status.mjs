import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const env = {};
const envPath = fileURLToPath(new URL("../.env.local", import.meta.url));
for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2];
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SECRET_KEY;
if (!url || !key) throw new Error(".env.local belum lengkap");
const H = { apikey: key, Authorization: `Bearer ${key}` };

const rl = await fetch(
  `${url}/rest/v1/rate_limits?select=key,attempts,window_start&order=updated_at.desc&limit=25`,
  { headers: H }
);
console.log("== rate_limits (aktif) ==");
console.log(await rl.text());

const cards = await fetch(
  `${url}/rest/v1/cards?select=id,is_active,pin_attempts,pin_locked_until,scan_count&order=id`,
  { headers: H }
);
console.log("\n== cards ==");
console.log(await cards.text());
