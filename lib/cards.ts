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

export interface AdminCardRow {
  id: string;
  is_active: boolean;
  business_name: string | null;
  scan_count: number;
  pin_attempts: number;
  pin_locked_until: string | null;
  created_at: string;
  locked: boolean;
}

export async function getAdminCardList(limit = 1000): Promise<AdminCardRow[]> {
  const { data, error } = await supabaseAdmin()
    .from("cards")
    .select(
      "id, is_active, business_name, scan_count, pin_attempts, pin_locked_until, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`getAdminCardList failed: ${error.message}`);

  const now = Date.now();
  return (data ?? []).map((row) => ({
    ...row,
    locked:
      !!row.pin_locked_until && new Date(row.pin_locked_until).getTime() > now,
  }));
}
