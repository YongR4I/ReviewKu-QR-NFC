"use client";

import { useActionState, useState } from "react";
import QRCode from "qrcode";
import JSZip from "jszip";
import { generateCards, type GenerateResult } from "@/actions/admin";

const initialState: GenerateResult = { ok: false };

function buildCsv(ids: string[], siteUrl: string): string {
  const header = "card_id,url";
  const rows = ids.map((id) => `${id},${siteUrl}/c/${id}`);
  return [header, ...rows].join("\n");
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function GeneratePanel({ siteUrl }: { siteUrl: string }) {
  const [state, formAction, pending] = useActionState(
    generateCards,
    initialState
  );
  const [zipBusy, setZipBusy] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);

  const ids = state.ids ?? [];

  function downloadCsv() {
    const blob = new Blob([buildCsv(ids, siteUrl)], { type: "text/csv" });
    triggerDownload(blob, `reviewku-urls-${Date.now()}.csv`);
  }

  async function downloadZip() {
    if (zipBusy || ids.length === 0) return;
    setZipBusy(true);
    setZipProgress(0);
    try {
      const zip = new JSZip();
      for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        const dataUrl = await QRCode.toDataURL(`${siteUrl}/c/${id}`, {
          errorCorrectionLevel: "H",
          width: 1024,
          margin: 4,
          color: { dark: "#000000", light: "#FFFFFF" },
        });
        zip.file(`${id}.png`, dataUrl.split(",")[1], { base64: true });
        if (i % 20 === 0) {
          setZipProgress(i);
          await new Promise((r) => setTimeout(r, 0));
        }
      }
      zip.file("urls.csv", buildCsv(ids, siteUrl));
      const blob = await zip.generateAsync({ type: "blob" });
      triggerDownload(
        blob,
        `reviewku-qr-${ids[0]}-sampai-${ids[ids.length - 1]}.zip`
      );
    } catch (err) {
      console.error("ZIP generation failed:", err);
      alert("Gagal membuat ZIP QR. Coba lagi.");
    } finally {
      setZipBusy(false);
      setZipProgress(0);
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        Generate Kartu & QR Code
      </h2>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Buat ID kartu baru dalam batch. Kartu baru selalu berstatus{" "}
        <span className="font-medium">belum aktif</span>.
      </p>

      <form action={formAction} className="mt-5 flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Prefix
            </span>
            <input
              type="text"
              name="prefix"
              defaultValue="CARD-"
              maxLength={30}
              className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Nomor Awal
            </span>
            <input
              type="number"
              name="start"
              defaultValue={1}
              min={1}
              className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Jumlah (maks 1000)
            </span>
            <input
              type="number"
              name="count"
              defaultValue={100}
              min={1}
              max={1000}
              className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="h-10 rounded-lg bg-zinc-900 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {pending ? "Membuat..." : "Generate ID Kartu"}
        </button>
      </form>

      {state.error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </div>
      )}

      {state.ok && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
          <p>
            <span className="font-semibold">{state.created}</span> ID baru
            dibuat, <span className="font-semibold">{state.skipped}</span>{" "}
            sudah ada sebelumnya. Total{" "}
            <span className="font-semibold">{ids.length}</span> kartu siap
            di-download.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={downloadCsv}
              className="rounded-lg border border-emerald-300 bg-white px-3.5 py-2 text-xs font-medium text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-zinc-900 dark:text-emerald-300 dark:hover:bg-zinc-800"
            >
              Download CSV
            </button>
            <button
              type="button"
              onClick={downloadZip}
              disabled={zipBusy}
              className="rounded-lg bg-emerald-700 px-3.5 py-2 text-xs font-medium text-white hover:bg-emerald-600 disabled:opacity-60 dark:bg-emerald-600 dark:hover:bg-emerald-500"
            >
              {zipBusy
                ? `Membuat QR... ${zipProgress}/${ids.length}`
                : `Download ZIP QR (${ids.length} gambar)`}
            </button>
          </div>
          <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-400">
            Format ID: <code>{ids[0]}</code> → <code>{ids[ids.length - 1]}</code>
            {" · "}URL: <code>{siteUrl}/c/[ID]</code>
          </p>
        </div>
      )}
    </section>
  );
}
