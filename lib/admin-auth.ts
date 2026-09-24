import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

export const ADMIN_COOKIE = "reviewku_admin";
export const ADMIN_TOKEN_TTL_SECONDS = 7 * 24 * 3600;

function hmacHex(value: string): string {
  return createHmac("sha256", env.editTokenSecret)
    .update(`admin:${value}`)
    .digest("hex");
}

function safeEqualHex(aHex: string, bHex: string): boolean {
  const a = Buffer.from(aHex, "hex");
  const b = Buffer.from(bHex, "hex");
  if (a.length === 0 || a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function verifyAdminCredentials(
  username: string,
  password: string
): boolean {
  const userOk = safeEqualHex(hmacHex(username), hmacHex(env.adminUsername));
  const passOk = safeEqualHex(hmacHex(password), hmacHex(env.adminPassword));
  return userOk && passOk;
}

function sign(username: string, exp: number): string {
  return createHmac("sha256", env.editTokenSecret)
    .update(`admin.${username}.${exp}`)
    .digest("hex");
}

function createAdminToken(username: string): string {
  const exp = Math.floor(Date.now() / 1000) + ADMIN_TOKEN_TTL_SECONDS;
  return `${username}.${exp}.${sign(username, exp)}`;
}

function verifyAdminToken(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [username, expStr, sig] = parts;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp * 1000 < Date.now()) return false;
  if (username !== env.adminUsername) return false;

  const expected = Buffer.from(sign(username, exp), "hex");
  let actual: Buffer;
  try {
    actual = Buffer.from(sig, "hex");
  } catch {
    return false;
  }
  if (expected.length === 0 || expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

export interface AdminSession {
  username: string | null;
}

export async function getAdminSession(): Promise<AdminSession> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  if (!verifyAdminToken(token)) return { username: null };
  return { username: env.adminUsername };
}

export async function setAdminCookie(): Promise<void> {
  const store = await cookies();
  store.set(ADMIN_COOKIE, createAdminToken(env.adminUsername), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_TOKEN_TTL_SECONDS,
  });
}

export async function clearAdminCookie(): Promise<void> {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
}

export async function requireAdmin(): Promise<void> {
  const { username } = await getAdminSession();
  if (!username) {
    throw new Error("Unauthorized: admin access required");
  }
}
