# ReviewKU QR

Platform aktivasi & redirect kartu QR/NFC untuk ulasan Google Review.
Kartu dicetak "blank" dengan URL permanen `https://[domain]/c/[CARD_ID]` —
scan pertama menampilkan formulir aktivasi, scan berikutnya langsung
redirect (307) ke link Google Review bisnis tersebut.

## Stack

- Next.js 16 (App Router, Server Actions, Proxy)
- Supabase (PostgreSQL) — akses server-only via secret key
- Tailwind CSS 4
- Deploy: Vercel · Repo: GitHub Actions (keep-alive + backup)

## Setup Lokal

```bash
npm install
cp .env.example .env.local   # lalu isi nilai dari dashboard Supabase
npm run dev                  # http://localhost:3000
```

### 1. Supabase

1. Buat project (region **Southeast Asia / Singapore**).
2. Buka **SQL Editor** → jalankan isi `supabase/migrations/0001_init.sql`, lalu `supabase/seed.sql`.
3. Salin **Project URL** + **publishable key** + **secret key** ke `.env.local`
   (Settings → API Keys).

### 2. Env (`.env.local`)

| Variabel | Keterangan |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | key publik (aman terekspos) |
| `SUPABASE_SECRET_KEY` | **RAHASIA** — hanya server |
| `PIN_PEPPER` | HMAC PIN (random 32 byte hex) |
| `EDIT_TOKEN_SECRET` | HMAC cookie edit (random 32 byte hex) |
| `NEXT_PUBLIC_SITE_URL` | URL dasar kartu (mis. `https://reviewku-qr.vercel.app`) |
| `ADMIN_USERNAME` | Username login `/admin` (default contoh: `admin`) |
| `ADMIN_PASSWORD` | Password login `/admin` (default contoh: `admin123`) |
| `RATE_LIMIT_DISABLED` | `true` = matikan rate limit **hanya saat lokal**. Di production selalu aktif apa pun nilainya. |

### 3. Login admin (`/admin`)

Login memakai **username + password** dari env (`ADMIN_USERNAME` /
`ADMIN_PASSWORD`) — session disimpan sebagai cookie HMAC 7 hari, tanpa
email/magic link. Ganti password di `.env.local` sebelum deploy.

## Deploy (Vercel)

1. Import repo ini di Vercel → set environment variables = isi `.env.local`.
2. **Jangan rename project** setelah kartu dicetak (URL di QR/NFC permanen).
3. GitHub repo → Settings → Variables: `SITE_URL` = URL production.
   Secrets: `SUPABASE_URL`, `SUPABASE_SECRET_KEY` (untuk workflow backup).

## Alur

| URL | Fungsi |
|---|---|
| `/c/[ID]` | Inactive → form aktivasi · Active → 307 ke Google Review |
| `/c/[ID]/edit` | Gate PIN 4 digit → edit nama/link |
| `/admin` | Login username+password → bulk generate ID + QR ZIP/CSV + reset kartu |
| `/api/health` | Pinging keep-alive (query DB) |

## Perintah

```bash
npm run dev         # development
npm run lint        # eslint
npx tsc --noEmit    # typecheck
npm run build       # production build
npm run test:e2e    # Playwright (butuh Supabase + SQL sudah dijalankan)
```

> **Catatan e2e:** Next.js 16 hanya mengizinkan satu `next dev` per project.
> Stop dulu `npm run dev` (Ctrl+C) sebelum `npm run test:e2e` — test otomatis
> memakai port 3100 dengan rate limit **aktif** (test lockout butuh), lalu
> jalankan `npm run dev` lagi sesudahnya.

## Keamanan

- Kolom `pin` disimpan sebagai `pin_hash` (HMAC-SHA256 + pepper di env).
- RLS aktif + `revoke` penuh untuk `anon`/`authenticated` — semua akses lewat secret key di server.
- Rate limit 3 lapis: per-IP (tabel `rate_limits`), backoff bertingkat, soft-lock kartu.
  Lokal bisa dimatikan dengan `RATE_LIMIT_DISABLED=true` di `.env.local`; production tetap aktif.
- `review_url` wajib host Google (allowlist) — cegah open redirect.
