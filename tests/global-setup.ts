import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

function parseEnvFile(path: string): Record<string, string> {
  const out: Record<string, string> = {};
  const raw = readFileSync(path, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

export default async function globalSetup() {
  const env = parseEnvFile(resolve(process.cwd(), ".env.local"));
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error(".env.local belum lengkap (SUPABASE_URL / SECRET_KEY)");
  }

  const db = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error: upErr } = await db
    .from("cards")
    .upsert(
      [
        {
          id: "CARD-E2E-01",
          is_active: false,
          business_name: null,
          review_url: null,
          pin_hash: null,
          pin_attempts: 0,
          pin_locked_until: null,
        },
      ],
      { onConflict: "id" }
    );
  if (upErr) throw new Error(`globalSetup cards: ${upErr.message}`);

  const { error: delErr } = await db
    .from("rate_limits")
    .delete()
    .or("key.ilike.%CARD-E2E%,key.like.activate:%");
  if (delErr) throw new Error(`globalSetup rate_limits: ${delErr.message}`);
}
