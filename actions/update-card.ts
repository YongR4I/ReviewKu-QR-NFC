"use server";

import { headers } from "next/headers";
import { validateReviewUrl } from "@/lib/google-url";
import { getEditToken, verifyEditToken } from "@/lib/edit-token";
import { rateLimit } from "@/lib/rate-limit";
import { supabaseAdmin } from "@/lib/supabase/admin";

export interface UpdateState {
  ok: boolean;
  error?: string;
  message?: string;
}

const CARD_ID_RE = /^[A-Za-z0-9_-]{1,50}$/;

export async function updateCard(
  _prev: UpdateState,
  formData: FormData
): Promise<UpdateState> {
  const cardId = String(formData.get("cardId") ?? "");
  const businessName = String(formData.get("businessName") ?? "").trim();
  const reviewUrlRaw = String(formData.get("reviewUrl") ?? "").trim();

  if (!CARD_ID_RE.test(cardId)) {
    return { ok: false, error: "ID kartu tidak valid." };
  }
  if (!businessName || businessName.length > 150) {
    return { ok: false, error: "Nama bisnis wajib diisi (maks 150 karakter)." };
  }
  const urlCheck = validateReviewUrl(reviewUrlRaw);
  if (!urlCheck.ok) {
    return { ok: false, error: urlCheck.error };
  }

  try {
    const token = await getEditToken();
    if (!verifyEditToken(cardId, token)) {
      return { ok: false, error: "Sesi edit berakhir. Masukkan PIN lagi." };
    }

    const h = await headers();
    const ip =
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      h.get("x-real-ip") ||
      "local";
    const rl = await rateLimit(`update:${ip}:${cardId}`, 20, 3600);
    if (!rl.allowed) {
      return {
        ok: false,
        error: `Terlalu banyak percobaan. Coba lagi dalam ${rl.retryAfter} detik.`,
      };
    }

    const { data, error } = await supabaseAdmin()
      .from("cards")
      .update({ business_name: businessName, review_url: urlCheck.url })
      .eq("id", cardId)
      .eq("is_active", true)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("updateCard error:", error.message);
      return { ok: false, error: "Gagal menyimpan. Silakan coba lagi." };
    }
    if (!data) {
      return { ok: false, error: "Kartu tidak ditemukan atau belum aktif." };
    }

    return { ok: true, message: "Data kartu berhasil diperbarui." };
  } catch (err) {
    console.error("updateCard exception:", err);
    return { ok: false, error: "Terjadi kesalahan. Silakan coba lagi." };
  }
}
