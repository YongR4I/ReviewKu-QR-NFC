"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import QRCode from "qrcode";
import { adminDeleteCard, type SimpleResult } from "@/actions/admin";

export interface CardListRow {
  id: string;
  is_active: boolean;
  business_name: string | null;
  scan_count: number;
  pin_attempts: number;
  pin_locked_until: string | null;
  created_at: string;
  locked: boolean;
}

type StatusFilter = "all" | "active" | "blank";

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "active", label: "Aktif" },
  { key: "blank", label: "Belum aktif" },
];

const deleteInitial: SimpleResult = { ok: false };

export function CardListPanel({
  cards,
  total,
  siteUrl,
}: {
  cards: CardListRow[];
  total: number;
  siteUrl: string;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [deleteState, deleteAction, deletePending] = useActionState(
    adminDeleteCard,
    deleteInitial
  );
  const [qr, setQr] = useState<{ id: string; url: string; dataUrl: string } | null>(
    null
  );
  const [qrBusy, setQrBusy] = useState(false);
  const router = useRouter();
  const skipInitial = useRef(true);

  useEffect(() => {
    if (skipInitial.current) {
      skipInitial.current = false;
      return;
    }
    router.refresh();
  }, [deleteState, router]);

  useEffect(() => {
    if (!qr) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setQr(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [qr]);

  async function openQr(id: string) {
    const url = `${siteUrl || window.location.origin}/c/${id}`;
    setQr({ id, url, dataUrl: "" });
    setQrBusy(true);
    try {
      const dataUrl = await QRCode.toDataURL(url, {
        errorCorrectionLevel: "H",
        width: 1024,
        margin: 4,
        color: { dark: "#000000", light: "#FFFFFF" },
      });
      setQr({ id, url, dataUrl });
    } catch (err) {
      console.error("QR generation failed:", err);
      alert("Gagal membuat QR. Coba lagi.");
      setQr(null);
    } finally {
      setQrBusy(false);
    }
  }

  function downloadQr() {
    if (!qr?.dataUrl) return;
    const a = document.createElement("a");
    a.href = qr.dataUrl;
    a.download = `qr-${qr.id}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cards.filter((c) => {
      if (status === "active" && !c.is_active) return false;
      if (status === "blank" && c.is_active) return false;
      if (!q) return true;
      return (
        c.id.toLowerCase().includes(q) ||
        (c.business_name ?? "").toLowerCase().includes(q)
      );
    });
  }, [cards, query, status]);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Daftar Kartu
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Semua kartu yang sudah dibuat — klik <span className="font-medium">Scan</span>{" "}
            untuk membuka halaman kartu, <span className="font-medium">Edit</span> untuk
            gate PIN.
          </p>
        </div>
        <p className="text-xs text-zinc-400">
          Menampilkan {filtered.length} dari {total} kartu
          {cards.length < total ? " (1000 terbaru)" : ""}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari ID atau nama bisnis…"
          className="h-10 w-full max-w-xs rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <div className="flex gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setStatus(f.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                status === f.key
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {deleteState.message && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
          {deleteState.message}
        </div>
      )}
      {deleteState.error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {deleteState.error}
        </div>
      )}

      {cards.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-zinc-300 px-4 py-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          Belum ada kartu. Buat lewat <span className="font-medium">Generate Kartu</span>{" "}
          di atas.
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-zinc-300 px-4 py-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          Tidak ada kartu yang cocok dengan pencarian.
        </div>
      ) : (
        <div className="mt-4 max-h-[28rem] overflow-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
            <thead className="sticky top-0 z-10 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-2.5 font-medium">ID</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Nama Bisnis</th>
                <th className="px-4 py-2.5 text-right font-medium">Scan</th>
                <th className="px-4 py-2.5 font-medium">PIN</th>
                <th className="px-4 py-2.5 font-medium">Dibuat</th>
                <th className="px-4 py-2.5 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
              {filtered.map((c) => {
                return (
                  <tr
                    key={c.id}
                    className="bg-white hover:bg-zinc-50 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                  >
                    <td className="px-4 py-2.5 font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      {c.id}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          c.is_active
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                        }`}
                      >
                        {c.is_active ? "Aktif" : "Belum aktif"}
                      </span>
                    </td>
                    <td className="max-w-[14rem] truncate px-4 py-2.5 text-zinc-700 dark:text-zinc-300">
                      {c.business_name ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                      {c.scan_count}
                    </td>
                    <td className="px-4 py-2.5">
                      {c.locked ? (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
                          Terkunci
                        </span>
                      ) : c.is_active && c.pin_attempts > 0 ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          Salah {c.pin_attempts}×
                        </span>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-zinc-500 dark:text-zinc-400">
                      {c.created_at.slice(0, 10)}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openQr(c.id)}
                          className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        >
                          QR
                        </button>
                        <Link
                          href={`/c/${c.id}`}
                          target="_blank"
                          className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        >
                          Scan ↗
                        </Link>
                        <Link
                          href={`/c/${c.id}/edit`}
                          target="_blank"
                          className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        >
                          Edit ↗
                        </Link>
                        <form
                          action={deleteAction}
                          onSubmit={(e) => {
                            if (
                              !confirm(
                                `Hapus permanen ${c.id}? Kartu, data bisnis, dan PIN-nya dihapus selamanya — tidak bisa dibatalkan.`
                              )
                            ) {
                              e.preventDefault();
                            }
                          }}
                        >
                          <input type="hidden" name="cardId" value={c.id} />
                          <button
                            type="submit"
                            disabled={deletePending}
                            className="rounded-md border border-red-300 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-60 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
                          >
                            {deletePending ? "Menghapus…" : "Hapus"}
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {qr && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
          onClick={() => setQr(null)}
          role="presentation"
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                QR{" "}
                <code className="font-mono text-sm text-zinc-600 dark:text-zinc-400">
                  {qr.id}
                </code>
              </h3>
              <button
                type="button"
                onClick={() => setQr(null)}
                className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Tutup
              </button>
            </div>

            <div className="mt-4">
              {qr.dataUrl ? (
                <Image
                  src={qr.dataUrl}
                  alt={`QR ${qr.id}`}
                  width={1024}
                  height={1024}
                  unoptimized
                  className="mx-auto w-full max-w-[18rem] rounded-lg border border-zinc-200 dark:border-zinc-800"
                />
              ) : (
                <p className="py-14 text-center text-sm text-zinc-500 dark:text-zinc-400">
                  {qrBusy ? "Membuat QR…" : "QR tidak tersedia."}
                </p>
              )}
            </div>

            <p className="mt-3 break-all text-center text-xs text-zinc-500 dark:text-zinc-400">
              {qr.url}
            </p>

            <button
              type="button"
              onClick={downloadQr}
              disabled={!qr.dataUrl}
              className="mt-4 h-10 w-full rounded-lg bg-zinc-900 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              Download PNG
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
