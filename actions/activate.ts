"use server";

import { headers } from "next/headers";
import { validateReviewUrl } from "@/lib/google-url";
import { hashPin } from "@/lib/pin";
import { resolveToReviewUrl } from "@/lib/review-link";
import { rateLimit } from "@/lib/rate-limit";
import { supabaseAdmin } from "@/lib/supabase/admin";

export interface ActivateState {
  ok: boolean;
  error?: string;
  reviewUrl?: string;
  businessName?: string;
}

const CARD_ID_RE = /^[A-Za-z0-9_-]{1,50}$/;

export async function activateCard(
  _prev: ActivateState,
  formData: FormData
): Promise<ActivateState> {
  const cardId = String(formData.get("cardId") ?? "");
  const businessName = String(formData.get("businessName") ?? "").trim();
  const reviewUrlRaw = String(formData.get("reviewUrl") ?? "").trim();
  const pin = String(formData.get("pin") ?? "");

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
  if (!/^\d{4}$/.test(pin)) {
    return { ok: false, error: "PIN harus terdiri dari 4 digit angka." };
  }

  try {
    const h = await headers();
    const ip =
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      h.get("x-real-ip") ||
      "local";
    const rl = await rateLimit(`activate:${ip}`, 20, 3600);
    if (!rl.allowed) {
      return {
        ok: false,
        error: `Terlalu banyak percobaan. Coba lagi dalam ${rl.retryAfter} detik.`,
      };
    }

    const reviewUrl = await resolveToReviewUrl(urlCheck.url);

    const { data, error } = await supabaseAdmin()
      .from("cards")
      .update({
        is_active: true,
        business_name: businessName,
        review_url: reviewUrl,
        pin_hash: hashPin(pin),
        pin_attempts: 0,
        pin_locked_until: null,
      })
      .eq("id", cardId)
      .eq("is_active", false)
      .select("id, review_url")
      .maybeSingle();

    if (error) {
      console.error("activateCard error:", error.message);
      return { ok: false, error: "Gagal menyimpan data. Silakan coba lagi." };
    }
    if (!data) {
      return {
        ok: false,
        error:
          "Kartu ini sudah diaktivasi. Gunakan halaman edit dengan PIN yang sudah didaftarkan.",
      };
    }

    return {
      ok: true,
      reviewUrl,
      businessName,
    };
  } catch (err) {
    console.error("activateCard exception:", err);
    return { ok: false, error: "Terjadi kesalahan. Silakan coba lagi." };
  }
}
