import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Card } from "@/lib/types";

export async function getCard(id: string): Promise<Card | null> {
  const { data, error } = await supabaseAdmin()
    .from("cards")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`getCard failed: ${error.message}`);
  return (data as Card | null) ?? null;
}
