"use client";

import { useActionState } from "react";
import Link from "next/link";
import { updateCard, type UpdateState } from "@/actions/update-card";

const initialState: UpdateState = { ok: false };

export function EditForm({
  cardId,
  initialBusinessName,
  initialReviewUrl,
}: {
  cardId: string;
  initialBusinessName: string;
  initialReviewUrl: string;
}) {
  const [state, formAction, pending] = useActionState(updateCard, initialState);

  return (
    <form
      action={formAction}
      className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
    >
      <input type="hidden" name="cardId" value={cardId} />

      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-lg text-white dark:bg-zinc-100 dark:text-zinc-900">
          ✏️
        </div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Pengaturan Kartu
        </h1>
        <p className="mt-1.5 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
          Perubahan langsung berlaku pada scan kartu berikutnya.
        </p>
      </div>

      {state.ok && state.message && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
          {state.message}
        </div>
      )}
      {!state.ok && state.error && (
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
            defaultValue={initialBusinessName}
            className="h-11 rounded-lg border border-zinc-300 bg-white px-3.5 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-100"
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
            defaultValue={initialReviewUrl}
            className="h-11 rounded-lg border border-zinc-300 bg-white px-3.5 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-100"
          />
          <span className="text-xs text-zinc-400">
            Link Maps apa saja otomatis diubah jadi link tulis ulasan.
          </span>
        </label>

        <button
          type="submit"
          disabled={pending}
          className="flex h-11 items-center justify-center rounded-lg bg-zinc-900 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {pending ? "Menyimpan..." : "Simpan Perubahan"}
        </button>

        <div className="flex items-center justify-between text-sm">
          <Link
            href={`/c/${cardId}`}
            className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            ← Kembali
          </Link>
        </div>
      </div>
    </form>
  );
}
