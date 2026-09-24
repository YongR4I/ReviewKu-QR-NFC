"use server";

import { headers } from "next/headers";
import { setEditCookie } from "@/lib/edit-token";
import { getCard } from "@/lib/cards";
import { verifyPin } from "@/lib/pin";
import { rateLimit, rateLimitsEnabled } from "@/lib/rate-limit";
import { supabaseAdmin } from "@/lib/supabase/admin";

export interface PinState {
  ok: boolean;
  error?: string;
}

const CARD_ID_RE = /^[A-Za-z0-9_-]{1,50}$/;

export async function verifyCardPin(
  _prev: PinState,
  formData: FormData
): Promise<PinState> {
  const cardId = String(formData.get("cardId") ?? "");
  const pin = String(formData.get("pin") ?? "");

  if (!CARD_ID_RE.test(cardId)) {
    return { ok: false, error: "ID kartu tidak valid." };
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

    const easyMode = !rateLimitsEnabled();

    if (!easyMode) {
      const rl = await rateLimit(`pin-verify:${ip}:${cardId}`, 5, 60);
      if (!rl.allowed) {
        return {
          ok: false,
          error: `Terlalu banyak percobaan. Tunggu ${rl.retryAfter} detik lagi.`,
        };
      }
    }

    const card = await getCard(cardId);
    if (!card) {
      return { ok: false, error: "Kartu tidak ditemukan." };
    }
    if (!card.is_active) {
      return { ok: false, error: "Kartu belum aktif. Aktivasi dulu kartunya." };
    }

    if (
      !easyMode &&
      card.pin_locked_until &&
      new Date(card.pin_locked_until).getTime() > Date.now()
    ) {
      const wait = Math.ceil(
        (new Date(card.pin_locked_until).getTime() - Date.now()) / 1000
      );
      return {
        ok: false,
        error: `Terlalu banyak PIN salah. Coba lagi dalam ${wait} detik.`,
      };
    }

    if (!verifyPin(pin, card.pin_hash)) {
      if (easyMode) {
        return { ok: false, error: "PIN salah." };
      }
      const attempts = card.pin_attempts + 1;
      let lockSeconds = 0;
      if (attempts % 5 === 0) {
        lockSeconds = Math.min(60 * Math.pow(2, attempts / 5 - 1), 1800);
      }
      const lockedUntil =
        lockSeconds > 0
          ? new Date(Date.now() + lockSeconds * 1000).toISOString()
          : null;

      const { error } = await supabaseAdmin()
        .from("cards")
        .update({ pin_attempts: attempts, pin_locked_until: lockedUntil })
        .eq("id", cardId);
      if (error) console.error("verifyCardPin update error:", error.message);

      return {
        ok: false,
        error:
          lockSeconds > 0
            ? `PIN salah. Terlalu banyak percobaan — terkunci ${lockSeconds} detik.`
            : "PIN salah.",
      };
    }

    const { error } = await supabaseAdmin()
      .from("cards")
      .update({ pin_attempts: 0, pin_locked_until: null })
      .eq("id", cardId);
    if (error) console.error("verifyCardPin reset error:", error.message);

    await setEditCookie(cardId);
    return { ok: true };
  } catch (err) {
    console.error("verifyCardPin exception:", err);
    return { ok: false, error: "Terjadi kesalahan. Silakan coba lagi." };
  }
}
