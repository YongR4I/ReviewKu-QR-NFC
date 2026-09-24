-- ReviewKU QR — skema awal
-- Jalankan di Supabase Dashboard → SQL Editor

create extension if not exists pgcrypto;

-- ============================================================
-- cards
-- ============================================================
create table if not exists public.cards (
  id               varchar(50) primary key check (id ~ '^[A-Za-z0-9_-]+$'),
  is_active        boolean not null default false,
  business_name    varchar(150),
  review_url       text,
  pin_hash         text,
  scan_count       integer not null default 0,
  pin_attempts     smallint not null default 0,
  pin_locked_until timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint activated_requires_data check (
    is_active = false or (
      business_name is not null
      and review_url is not null
      and pin_hash is not null
    )
  )
);

create index if not exists cards_is_active_idx on public.cards (is_active);

-- ============================================================
-- rate_limits (throttle per-IP / per-key)
-- ============================================================
create table if not exists public.rate_limits (
  key          text primary key,
  window_start timestamptz not null default now(),
  attempts     smallint not null default 1,
  updated_at   timestamptz not null default now()
);

-- ============================================================
-- trigger updated_at
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists cards_updated_at on public.cards;
create trigger cards_updated_at
  before update on public.cards
  for each row
  execute function public.set_updated_at();

-- ============================================================
-- p_card_scan: baca status + increment scan atomik (satu statement)
-- 0 baris = kartu tidak ada.
-- scan_count hanya naik jika kartu sudah aktif.
-- ============================================================
create or replace function public.p_card_scan(p_card_id varchar)
returns table (
  card_is_active     boolean,
  card_review_url    text,
  card_business_name text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update public.cards
     set scan_count = scan_count + case when is_active then 1 else 0 end
   where id = p_card_id
  returning cards.is_active, cards.review_url, cards.business_name;
end;
$$;

-- ============================================================
-- p_rate_limit: fixed-window counter atomik per key
-- Mengembalikan allowed / sisa kuota / detik tunggu.
-- ============================================================
create or replace function public.p_rate_limit(
  p_key text,
  p_max integer,
  p_window_seconds integer
)
returns table (
  allowed             boolean,
  remaining           integer,
  retry_after_seconds integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempts integer;
  v_start     timestamptz;
  v_retry     integer;
begin
  insert into public.rate_limits as rl (key, window_start, attempts, updated_at)
  values (p_key, now(), 1, now())
  on conflict (key) do update
    set window_start = case
          when rl.window_start + make_interval(secs => p_window_seconds) <= now()
            then now()
          else rl.window_start
        end,
        attempts = case
          when rl.window_start + make_interval(secs => p_window_seconds) <= now()
            then 1
          else rl.attempts + 1
        end,
        updated_at = now()
  returning rl.window_start, rl.attempts into v_start, v_attempts;

  if v_attempts <= p_max then
    return query select true, (p_max - v_attempts)::integer, 0;
  else
    v_retry := greatest(
      ceil(extract(epoch from (v_start + make_interval(secs => p_window_seconds) - now())))::integer,
      1
    );
    return query select false, 0, v_retry;
  end if;
end;
$$;

-- ============================================================
-- Keamanan: blokir akses publik (anon/authenticated).
-- Semua akses aplikasi lewat service-role/secret key di server.
-- ============================================================
alter table public.cards enable row level security;
alter table public.rate_limits enable row level security;

revoke all on table public.cards from anon, authenticated;
revoke all on table public.rate_limits from anon, authenticated;

revoke execute on function public.p_card_scan(varchar) from public, anon, authenticated;
revoke execute on function public.p_rate_limit(text, integer, integer) from public, anon, authenticated;

grant execute on function public.p_card_scan(varchar) to service_role;
grant execute on function public.p_rate_limit(text, integer, integer) to service_role;
