const WRITE_REVIEW_BASE = "https://search.google.com/local/writereview";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

function extractPlaceId(url: string): string | null {
  const match =
    url.match(/[?&]placeid=([A-Za-z0-9_-]+)/i) ??
    url.match(/place_id:([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
}

function extractCid(url: string): string | null {
  const match = url.match(/0x[0-9a-fA-F]{6,16}:0x[0-9a-fA-F]{6,16}/);
  return match ? match[0] : null;
}

function cidToPlaceId(cid: string): string | null {
  const match = cid.match(/^0x([0-9a-fA-F]+):0x([0-9a-fA-F]+)$/);
  if (!match) return null;
  const hexA = match[1];
  const hexB = match[2];
  if (hexA.length !== 16 || hexB.length !== 16) return null;

  const partA = Buffer.from(hexA, "hex").reverse();
  const partB = Buffer.from(hexB, "hex").reverse();
  const payload = Buffer.concat([
    Buffer.from([0x0a, 0x12, 0x09]),
    partA,
    Buffer.from([0x11]),
    partB,
  ]);
  return payload.toString("base64url");
}

function buildReviewUrl(placeId: string): string {
  return `${WRITE_REVIEW_BASE}?placeid=${placeId}`;
}

function needsResolution(url: URL): boolean {
  const host = url.hostname.toLowerCase();
  if (host === "maps.app.goo.gl" || host.endsWith(".goo.gl")) return true;
  if (host === "g.page" || host.endsWith(".g.page")) {
    return !url.pathname.endsWith("/review");
  }
  return false;
}

async function followRedirects(startUrl: string, maxHops = 5): Promise<string> {
  let current = startUrl;
  for (let i = 0; i < maxHops; i++) {
    const res = await fetch(current, {
      redirect: "manual",
      signal: AbortSignal.timeout(6000),
      headers: { "user-agent": UA, accept: "text/html,*/*" },
    });
    const location = res.headers.get("location");
    await res.body?.cancel().catch(() => {});
    if (!location) return current;
    current = new URL(location, current).toString();
  }
  return current;
}

export async function resolveToReviewUrl(rawUrl: string): Promise<string> {
  try {
    let current = rawUrl;
    for (let hop = 0; hop < 3; hop++) {
      const placeId = extractPlaceId(current);
      if (placeId) return buildReviewUrl(placeId);

      const cid = extractCid(current);
      if (cid) {
        const converted = cidToPlaceId(cid);
        if (converted) return buildReviewUrl(converted);
      }

      let parsed: URL;
      try {
        parsed = new URL(current);
      } catch {
        return rawUrl;
      }
      if (!needsResolution(parsed)) break;

      const next = await followRedirects(current);
      if (next === current) break;
      current = next;
    }
    return rawUrl;
  } catch (err) {
    console.error("resolveToReviewUrl error:", err);
    return rawUrl;
  }
}
