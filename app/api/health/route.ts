import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { error } = await supabaseAdmin()
      .from("cards")
      .select("id", { head: true, count: "exact" });
    if (error) throw new Error(error.message);
    return NextResponse.json({
      ok: true,
      db: "up",
      ts: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { ok: false, db: "down", ts: new Date().toISOString() },
      { status: 503 }
    );
  }
}
