import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter: number;
}

export async function rateLimit(
  key: string,
  max: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  try {
    const { data, error } = await supabaseAdmin().rpc("p_rate_limit", {
      p_key: key,
      p_max: max,
      p_window_seconds: windowSeconds,
    });
    if (error) throw new Error(error.message);
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) throw new Error("empty rate limit result");
    return {
      allowed: Boolean(row.allowed),
      remaining: Number(row.remaining ?? 0),
      retryAfter: Number(row.retry_after_seconds ?? 0),
    };
  } catch (err) {
    console.error("rateLimit failed (fail-open):", err);
    return { allowed: true, remaining: max, retryAfter: 0 };
  }
}
