"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  clearAdminCookie,
  requireAdmin,
  setAdminCookie,
  verifyAdminCredentials,
} from "@/lib/admin-auth";
import { hashPin } from "@/lib/pin";
import { rateLimit } from "@/lib/rate-limit";
import { supabaseAdmin } from "@/lib/supabase/admin";

const CARD_ID_RE = /^[A-Za-z0-9_-]{1,50}$/;
const PREFIX_RE = /^[A-Za-z0-9_-]{1,30}$/;

export interface GenerateResult {
  ok: boolean;
  error?: string;
  ids?: string[];
  created?: number;
  skipped?: number;
}

export interface LoginState {
  ok: boolean;
  error?: string;
}

export interface SearchState {
  ok: boolean;
  error?: string;
  card?: CardAdminInfo;
}

export interface SimpleResult {
  ok: boolean;
  error?: string;
  message?: string;
}

export interface CardAdminInfo {
  id: string;
  is_active: boolean;
  business_name: string | null;
  review_url: string | null;
  scan_count: number;
  pin_attempts: number;
  pin_locked_until: string | null;
  created_at: string;
  updated_at: string;
}

export async function generateCards(
  _prev: GenerateResult,
  formData: FormData
): Promise<GenerateResult> {
  try {
    await requireAdmin();

    const prefix = String(formData.get("prefix") ?? "CARD-").trim();
    const start = Number(formData.get("start") ?? 1);
    const count = Number(formData.get("count") ?? 100);

    if (!PREFIX_RE.test(prefix)) {
      return { ok: false, error: "Prefix hanya boleh huruf/angka/-/_ (maks 30)." };
    }
    if (!Number.isInteger(start) || start < 1 || start > 999999) {
      return { ok: false, error: "Nomor awal harus angka ≥ 1." };
    }
    if (!Number.isInteger(count) || count < 1 || count > 1000) {
      return { ok: false, error: "Jumlah kartu per batch: 1–1000." };
    }

    const pad = String(start + count - 1).length;
    const ids: string[] = [];
    for (let i = 0; i < count; i++) {
      const id = `${prefix}${String(start + i).padStart(pad, "0")}`;
      if (!CARD_ID_RE.test(id)) {
        return { ok: false, error: `ID tidak valid: ${id}` };
      }
      ids.push(id);
    }

    const { data, error } = await supabaseAdmin()
      .from("cards")
      .upsert(ids.map((id) => ({ id })), { onConflict: "id", ignoreDuplicates: true })
      .select("id");

    if (error) {
      console.error("generateCards error:", error.message);
      return { ok: false, error: `Gagal menyimpan kartu: ${error.message}` };
    }

    const created = data?.length ?? 0;
    return { ok: true, ids, created, skipped: count - created };
  } catch (err) {
    console.error("generateCards exception:", err);
    return { ok: false, error: "Gagal — kamu tidak berwenang atau server error." };
  }
}

export async function searchCard(
  _prev: SearchState,
  formData: FormData
): Promise<SearchState> {
  try {
    await requireAdmin();
    const cardId = String(formData.get("cardId") ?? "").trim().toUpperCase();
    if (!CARD_ID_RE.test(cardId)) {
      return { ok: false, error: "ID kartu tidak valid." };
    }

    const { data, error } = await supabaseAdmin()
      .from("cards")
      .select(
        "id, is_active, business_name, review_url, scan_count, pin_attempts, pin_locked_until, created_at, updated_at"
      )
      .eq("id", cardId)
      .maybeSingle();

    if (error) {
      console.error("searchCard error:", error.message);
      return { ok: false, error: "Gagal mencari kartu." };
    }
    if (!data) {
      return { ok: false, error: `Kartu ${cardId} tidak ditemukan.` };
    }
    return { ok: true, card: data as CardAdminInfo };
  } catch (err) {
    console.error("searchCard exception:", err);
    return { ok: false, error: "Gagal — kamu tidak berwenang atau server error." };
  }
}

export async function adminSetPin(
  _prev: SimpleResult,
  formData: FormData
): Promise<SimpleResult> {
  try {
    await requireAdmin();
    const cardId = String(formData.get("cardId") ?? "").trim().toUpperCase();
    const pin = String(formData.get("pin") ?? "");
    if (!CARD_ID_RE.test(cardId)) {
      return { ok: false, error: "ID kartu tidak valid." };
    }
    if (!/^\d{4}$/.test(pin)) {
      return { ok: false, error: "PIN baru harus 4 digit angka." };
    }

    const { data, error } = await supabaseAdmin()
      .from("cards")
      .update({
        pin_hash: hashPin(pin),
        pin_attempts: 0,
        pin_locked_until: null,
      })
      .eq("id", cardId)
      .eq("is_active", true)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("adminSetPin error:", error.message);
      return { ok: false, error: "Gagal mengganti PIN." };
    }
    if (!data) {
      return { ok: false, error: "Hanya kartu aktif yang bisa diganti PIN-nya." };
    }
    return { ok: true, message: `PIN ${cardId} berhasil diganti.` };
  } catch (err) {
    console.error("adminSetPin exception:", err);
    return { ok: false, error: "Gagal — kamu tidak berwenang atau server error." };
  }
}

export async function adminResetCard(
  _prev: SimpleResult,
  formData: FormData
): Promise<SimpleResult> {
  try {
    await requireAdmin();
    const cardId = String(formData.get("cardId") ?? "").trim().toUpperCase();
    if (!CARD_ID_RE.test(cardId)) {
      return { ok: false, error: "ID kartu tidak valid." };
    }

    const { data, error } = await supabaseAdmin()
      .from("cards")
      .update({
        is_active: false,
        business_name: null,
        review_url: null,
        pin_hash: null,
        pin_attempts: 0,
        pin_locked_until: null,
      })
      .eq("id", cardId)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("adminResetCard error:", error.message);
      return { ok: false, error: "Gagal mereset kartu." };
    }
    if (!data) {
      return { ok: false, error: `Kartu ${cardId} tidak ditemukan.` };
    }
    return { ok: true, message: `Kartu ${cardId} dikembalikan ke status blank.` };
  } catch (err) {
    console.error("adminResetCard exception:", err);
    return { ok: false, error: "Gagal — kamu tidak berwenang atau server error." };
  }
}

export async function adminLogin(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  try {
    const username = String(formData.get("username") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    if (!username || !password) {
      return { ok: false, error: "Isi username dan password." };
    }

    const h = await headers();
    const ip =
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      h.get("x-real-ip") ||
      "local";
    const rl = await rateLimit(`admin-login:${ip}`, 10, 300);
    if (!rl.allowed) {
      return {
        ok: false,
        error: `Terlalu banyak percobaan. Tunggu ${rl.retryAfter} detik lagi.`,
      };
    }

    if (!verifyAdminCredentials(username, password)) {
      return { ok: false, error: "Username atau password salah." };
    }

    await setAdminCookie();
    return { ok: true };
  } catch (err) {
    console.error("adminLogin exception:", err);
    return { ok: false, error: "Terjadi kesalahan. Silakan coba lagi." };
  }
}

export async function adminDeleteCard(
  _prev: SimpleResult,
  formData: FormData
): Promise<SimpleResult> {
  try {
    await requireAdmin();
    const cardId = String(formData.get("cardId") ?? "").trim().toUpperCase();
    if (!CARD_ID_RE.test(cardId)) {
      return { ok: false, error: "ID kartu tidak valid." };
    }

    const { data, error } = await supabaseAdmin()
      .from("cards")
      .delete()
      .eq("id", cardId)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("adminDeleteCard error:", error.message);
      return { ok: false, error: "Gagal menghapus kartu." };
    }
    if (!data) {
      return { ok: false, error: `Kartu ${cardId} tidak ditemukan.` };
    }
    return { ok: true, message: `Kartu ${cardId} dihapus permanen.` };
  } catch (err) {
    console.error("adminDeleteCard exception:", err);
    return { ok: false, error: "Gagal — kamu tidak berwenang atau server error." };
  }
}

export async function signOut(): Promise<void> {
  await clearAdminCookie();
  revalidatePath("/admin", "layout");
}
