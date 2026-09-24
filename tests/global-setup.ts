import { createClient } from "@supabase/supabase-js";
import { localEnv } from "./helpers";

export default async function globalSetup() {
  const env = localEnv();
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
        {
          id: "CARD-E2E-02",
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
