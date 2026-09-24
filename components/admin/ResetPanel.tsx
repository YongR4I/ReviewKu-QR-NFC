"use client";

import { useActionState, useState } from "react";
import {
  adminResetCard,
  adminSetPin,
  searchCard,
  type SearchState,
  type SimpleResult,
} from "@/actions/admin";

const searchInitial: SearchState = { ok: false };
const pinInitial: SimpleResult = { ok: false };
const resetInitial: SimpleResult = { ok: false };

export function ResetPanel() {
  const [searchState, searchAction, searchPending] = useActionState(
    searchCard,
    searchInitial
  );
  const [pinState, pinAction, pinPending] = useActionState(
    adminSetPin,
    pinInitial
  );
  const [resetState, resetAction, resetPending] = useActionState(
    adminResetCard,
    resetInitial
  );

  const [pin, setPin] = useState("");

  const card = searchState.ok ? searchState.card : undefined;

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        Cari & Reset Kartu
      </h2>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Atur PIN baru (lupa PIN) atau kembalikan kartu ke status blank
        (salah aktivasi / dijual ulang).
      </p>

      <form
        action={searchAction}
        className="mt-5 flex gap-2"
        onSubmit={() => setPin("")}
      >
        <input
          type="text"
          name="cardId"
          required
          placeholder="CARD-001"
          className="h-10 flex-1 rounded-lg border border-zinc-300 bg-white px-3 font-mono text-sm uppercase text-zinc-900 outline-none placeholder:normal-case placeholder:text-zinc-400 focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <button
          type="submit"
          disabled={searchPending}
          className="rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {searchPending ? "Mencari..." : "Cari"}
        </button>
      </form>

      {searchState.error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {searchState.error}
        </div>
      )}

      {card && (
        <div className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {card.id}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                card.is_active
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  : "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
              }`}
            >
              {card.is_active ? "Aktif" : "Belum aktif"}
            </span>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
            <div>
              <dt className="inline font-medium">Nama:</dt>{" "}
              <span className="inline">{card.business_name ?? "—"}</span>
            </div>
            <div>
              <dt className="inline font-medium">Scan:</dt>{" "}
              <span className="inline">{card.scan_count}</span>
            </div>
            <div className="col-span-2 break-all">
              <dt className="inline font-medium">Link:</dt>{" "}
              <span className="inline">{card.review_url ?? "—"}</span>
            </div>
            <div>
              <dt className="inline font-medium">Percobaan PIN gagal:</dt>{" "}
              <span className="inline">{card.pin_attempts}</span>
            </div>
            <div>
              <dt className="inline font-medium">Terkunci sampai:</dt>{" "}
              <span className="inline">{card.pin_locked_until ?? "—"}</span>
            </div>
          </dl>

          {card.is_active && (
            <form action={pinAction} className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
              <input type="hidden" name="cardId" value={card.id} />
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Atur PIN baru
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="pin"
                    required
                    inputMode="numeric"
                    maxLength={4}
                    pattern="\d{4}"
                    value={pin}
                    onChange={(e) =>
                      setPin(e.target.value.replace(/\D/g, "").slice(0, 4))
                    }
                    placeholder="••••"
                    className="h-10 w-28 rounded-lg border border-zinc-300 bg-white px-3 text-center font-mono tracking-[0.3em] text-zinc-900 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                  />
                  <button
                    type="submit"
                    disabled={pinPending}
                    className="rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                  >
                    {pinPending ? "Menyimpan..." : "Ganti PIN"}
                  </button>
                </div>
              </label>
              {pinState.message && (
                <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-400">
                  {pinState.message}
                </p>
              )}
              {pinState.error && (
                <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                  {pinState.error}
                </p>
              )}
            </form>
          )}

          <form
            action={resetAction}
            className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-800"
            onSubmit={(e) => {
              if (
                !confirm(
                  `Kembalikan ${card.id} ke blank? Semua data bisnis & PIN akan dihapus.`
                )
              ) {
                e.preventDefault();
              }
            }}
          >
            <input type="hidden" name="cardId" value={card.id} />
            <button
              type="submit"
              disabled={resetPending}
              className="h-9 rounded-lg border border-red-300 px-4 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
            >
              {resetPending ? "Meriset..." : "Kembalikan ke Blank"}
            </button>
            {resetState.message && (
              <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-400">
                {resetState.message}
              </p>
            )}
            {resetState.error && (
              <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                {resetState.error}
              </p>
            )}
          </form>
        </div>
      )}
    </section>
  );
}
