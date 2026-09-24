import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

export function hashPin(pin: string): string {
  return createHmac("sha256", env.pinPepper).update(`pin:${pin}`).digest("hex");
}

export function verifyPin(pin: string, storedHash: string | null): boolean {
  if (!storedHash) return false;
  const a = Buffer.from(hashPin(pin), "hex");
  let b: Buffer;
  try {
    b = Buffer.from(storedHash, "hex");
  } catch {
    return false;
  }
  if (a.length !== b.length || a.length === 0) return false;
  return timingSafeEqual(a, b);
}
