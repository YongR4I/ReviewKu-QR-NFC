"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { verifyCardPin, type PinState } from "@/actions/verify-pin";

const initialState: PinState = { ok: false };

export function PinGate({ cardId }: { cardId: string }) {
  const [state, formAction, pending] = useActionState(verifyCardPin, initialState);
  const [pin, setPin] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (state.ok) {
      router.refresh();
    }
  }, [state.ok, router]);

  return (
    <form
      action={formAction}
      className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
    >
      <input type="hidden" name="cardId" value={cardId} />

      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-lg text-white dark:bg-zinc-100 dark:text-zinc-900">
          🔒
        </div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Edit Data Kartu
        </h1>
        <p className="mt-1.5 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
          Masukkan PIN 4 digit untuk membuka pengaturan kartu ini.
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
            PIN
          </span>
          <input
            type="text"
            name="pin"
            required
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
            pattern="\d{4}"
            autoFocus
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="••••"
            className="h-11 rounded-lg border border-zinc-300 bg-white px-3.5 text-center font-mono text-lg tracking-[0.5em] text-zinc-900 outline-none placeholder:text-zinc-300 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </label>

        <button
          type="submit"
          disabled={pending}
          className="flex h-11 items-center justify-center rounded-lg bg-zinc-900 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {pending ? "Memeriksa..." : "Buka Pengaturan"}
        </button>
      </div>
    </form>
  );
}
