"use client";

export default function SystemErrorPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-zinc-50 px-6 font-sans dark:bg-black">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-2xl dark:bg-amber-950">
          ⚠️
        </div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Sedang Ada Gangguan
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          Layanan sedang tidak dapat dihubungi. Silakan coba lagi beberapa saat
          lagi.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-5 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Coba Lagi
        </button>
      </div>
    </main>
  );
}
