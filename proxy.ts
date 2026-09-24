import { NextResponse, type NextRequest } from "next/server";

const CARD_ID_RE = /^[A-Za-z0-9_-]{1,50}$/;
const BOT_RE =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|discord|twitterbot|lighthouse|pagespeed|uptime|monitor|headless/i;

interface ScanRow {
  card_is_active?: boolean;
  card_review_url?: string | null;
}

function rewriteTo(req: NextRequest, path: string, status: number): NextResponse {
  const res = NextResponse.rewrite(new URL(path, req.url), { status });
  res.headers.set("X-Robots-Tag", "noindex");
  return res;
}

async function fetchCardStatus(cardId: string, isBot: boolean): Promise<ScanRow | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Supabase env missing");

  const headers = { apikey: key, Authorization: `Bearer ${key}` };
  const timeout = AbortSignal.timeout(2500);

  if (isBot) {
    const res = await fetch(
      `${url}/rest/v1/cards?id=eq.${encodeURIComponent(cardId)}` +
        `&select=is_active,review_url&limit=1`,
      { headers, cache: "no-store", signal: timeout }
    );
    if (!res.ok) throw new Error(`select ${res.status}`);
    const rows = (await res.json()) as Array<{ is_active: boolean; review_url: string | null }>;
    const row = rows[0];
    if (!row) return null;
    return { card_is_active: row.is_active, card_review_url: row.review_url };
  }

  const res = await fetch(`${url}/rest/v1/rpc/p_card_scan`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ p_card_id: cardId }),
    cache: "no-store",
    signal: timeout,
  });
  if (!res.ok) throw new Error(`p_card_scan ${res.status}`);
  const rows = (await res.json()) as ScanRow[];
  return rows[0] ?? null;
}

export async function proxy(req: NextRequest) {
  const parts = req.nextUrl.pathname.split("/");

  // /c/<id>/edit → biarkan page edit yang memproses
  if (parts.length === 4 && parts[3] === "edit") {
    return NextResponse.next();
  }

  const cardId = parts[2] ?? "";
  if (parts.length !== 3 || !CARD_ID_RE.test(cardId)) {
    return rewriteTo(req, "/card-invalid", 404);
  }

  const isBot = BOT_RE.test(req.headers.get("user-agent") ?? "");

  try {
    const card = await fetchCardStatus(cardId, isBot);
    if (!card) {
      return rewriteTo(req, "/card-invalid", 404);
    }

    if (card.card_is_active && card.card_review_url) {
      let target: URL;
      try {
        target = new URL(card.card_review_url);
      } catch {
        return rewriteTo(req, "/card-invalid", 404);
      }
      if (target.protocol !== "https:") {
        return rewriteTo(req, "/card-invalid", 404);
      }
      const res = NextResponse.redirect(target, 307);
      res.headers.set("X-Robots-Tag", "noindex");
      return res;
    }

    // belum aktif → render form aktivasi
    return NextResponse.next();
  } catch (err) {
    console.error("middleware scan error:", err);
    return rewriteTo(req, "/system-error", 503);
  }
}

export const config = {
  matcher: ["/c/:path*"],
};
