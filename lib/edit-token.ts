import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

export const EDIT_COOKIE = "reviewku_edit";
export const EDIT_TOKEN_TTL_SECONDS = 900;

function sign(cardId: string, exp: number): string {
  return createHmac("sha256", env.editTokenSecret)
    .update(`${cardId}.${exp}`)
    .digest("hex");
}

export function createEditToken(cardId: string): string {
  const exp = Math.floor(Date.now() / 1000) + EDIT_TOKEN_TTL_SECONDS;
  return `${exp}.${sign(cardId, exp)}`;
}

export function verifyEditToken(cardId: string, token: string | undefined): boolean {
  if (!token) return false;
  const [expStr, sig] = token.split(".");
  if (!expStr || !sig) return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp * 1000 < Date.now()) return false;

  const expected = Buffer.from(sign(cardId, exp), "hex");
  let actual: Buffer;
  try {
    actual = Buffer.from(sig, "hex");
  } catch {
    return false;
  }
  if (expected.length === 0 || expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

export async function setEditCookie(cardId: string): Promise<void> {
  const store = await cookies();
  store.set(EDIT_COOKIE, createEditToken(cardId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: `/c/${cardId}/edit`,
    maxAge: EDIT_TOKEN_TTL_SECONDS,
  });
}

export async function getEditToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(EDIT_COOKIE)?.value;
}
