import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kartu Tidak Valid",
  robots: { index: false, follow: false },
};

export default function CardInvalidPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-zinc-50 px-6 font-sans dark:bg-black">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl dark:bg-red-950">
          ❌
        </div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Kartu Tidak Valid
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          Kartu dengan ID yang kamu scan tidak ditemukan. Pastikan QR/NFC di-scan
          dengan benar, atau hubungi penjual kartu.
        </p>
      </div>
      <p className="mt-6 text-xs text-zinc-400">ReviewKU QR</p>
    </main>
  );
}
