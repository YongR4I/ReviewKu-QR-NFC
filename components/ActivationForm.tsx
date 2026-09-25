"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { activateCard, type ActivateState } from "@/actions/activate";

const initialState: ActivateState = { ok: false };

export function ActivationForm({ cardId }: { cardId: string }) {
  const [state, formAction, pending] = useActionState(activateCard, initialState);
  const [pin, setPin] = useState("");

  if (state.ok && state.reviewUrl) {
    return (
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-2xl dark:bg-emerald-950">
          ✅
        </div>
        <h1 className="text-center text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Kartu Berhasil Diaktivasi
        </h1>
        <p className="mt-2 text-center text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {state.businessName}
          </span>{" "}
          sekarang terhubung ke Google Review.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <a
            href={state.reviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-11 items-center justify-center rounded-lg bg-zinc-900 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Buka Google Review
          </a>
          <Link
            href={`/c/${cardId}/edit`}
            className="flex h-11 items-center justify-center rounded-lg border border-zinc-300 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Edit Data Kartu
          </Link>
        </div>
        <p className="mt-5 break-all text-center text-xs text-zinc-400">
          {state.reviewUrl}
        </p>
        <p className="mt-3 text-center text-xs text-zinc-400">
          Scan kartu lagi untuk mengarahkan pelanggan ke Google Review.
        </p>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
    >
      <input type="hidden" name="cardId" value={cardId} />

      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-lg font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
          ⚡
        </div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Aktivasi Kartu
        </h1>
        <p className="mt-1.5 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
          Kartu ini belum terdaftar. Isi data bisnismu untuk mengaktifkan.
        </p>
      </div>

      {state.error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </div>
      )}

      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Nama Bisnis
          </span>
          <input
            type="text"
            name="businessName"
            required
            maxLength={150}
            autoComplete="organization"
            placeholder="Contoh: Warung Kopi Senja"
            className="h-11 rounded-lg border border-zinc-300 bg-white px-3.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-100"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Link Google Review
          </span>
          <input
            type="url"
            name="reviewUrl"
            required
            inputMode="url"
            placeholder="https://search.google.com/local/writereview?placeid=..."
            className="h-11 rounded-lg border border-zinc-300 bg-white px-3.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-100"
          />
          <span className="text-xs text-zinc-400">
            Bisa tempel link Maps apa saja (“Bagikan” / place / g.page) — otomatis
            diubah jadi link tulis ulasan.
          </span>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            PIN 4 Digit
          </span>
          <input
            type="text"
            name="pin"
            required
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
            pattern="\d{4}"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="••••"
            className="h-11 rounded-lg border border-zinc-300 bg-white px-3.5 font-mono text-lg tracking-[0.4em] text-zinc-900 outline-none placeholder:text-zinc-300 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
          <span className="text-xs text-zinc-400">
            Ingat baik-baik — PIN ini dipakai untuk mengedit data kartu.
          </span>
        </label>

        <button
          type="submit"
          disabled={pending}
          className="mt-1 flex h-11 items-center justify-center rounded-lg bg-zinc-900 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {pending ? "Mengaktifkan..." : "Aktivasi Kartu"}
        </button>
      </div>
    </form>
  );
}
