export type UrlValidation = { ok: true; url: string } | { ok: false; error: string };

function isAllowedHost(host: string): boolean {
  if (host === "g.page" || host.endsWith(".g.page")) return true;
  if (host === "google.com" || host.endsWith(".google.com")) return true;
  if (host === "maps.app.goo.gl") return true;
  if (/^[a-z]{2,3}\.google\.[a-z]{2,3}(\.[a-z]{2})?$/.test(host)) return true;
  return false;
}

export function validateReviewUrl(raw: string): UrlValidation {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, error: "Link Google Review wajib diisi." };
  }
  if (trimmed.length > 2048) {
    return { ok: false, error: "Link terlalu panjang (maks 2048 karakter)." };
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return { ok: false, error: "Link tidak valid. Contoh: https://search.google.com/local/writereview?placeid=..." };
  }

  if (url.protocol !== "https:") {
    return { ok: false, error: "Link harus menggunakan https://" };
  }

  const host = url.hostname.toLowerCase();
  if (!isAllowedHost(host)) {
    return {
      ok: false,
      error: "Hanya link Google yang diizinkan (google.com, g.page, atau maps.app.goo.gl).",
    };
  }

  return { ok: true, url: url.toString() };
}
