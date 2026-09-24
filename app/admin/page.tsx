import { signOut } from "@/actions/admin";
import { getAdminSession } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { GeneratePanel } from "@/components/admin/GeneratePanel";
import { ResetPanel } from "@/components/admin/ResetPanel";

export default async function AdminPage() {
  const { username } = await getAdminSession();
  if (!username) return null;

  const db = supabaseAdmin();
  const [totalRes, activeRes, scansRes] = await Promise.all([
    db.from("cards").select("id", { count: "exact", head: true }),
    db.from("cards").select("id", { count: "exact", head: true }).eq("is_active", true),
    db.from("cards").select("scan_count").limit(10000),
  ]);

  const total = totalRes.count ?? 0;
  const active = activeRes.count ?? 0;
  const totalScans =
    scansRes.data?.reduce((sum, row) => sum + (row.scan_count ?? 0), 0) ?? 0;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  return (
    <main className="mx-auto min-h-dvh max-w-5xl px-6 py-8 font-sans">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            ReviewKU QR · Admin
          </h1>
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
            Masuk sebagai <span className="font-medium">{username}</span>
          </p>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="h-9 rounded-lg border border-zinc-300 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Keluar
          </button>
        </form>
      </header>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Kartu" value={total.toLocaleString("id-ID")} />
        <StatCard label="Sudah Aktif" value={active.toLocaleString("id-ID")} />
        <StatCard label="Total Scan" value={totalScans.toLocaleString("id-ID")} />
      </div>

      <div className="flex flex-col gap-6">
        <GeneratePanel siteUrl={siteUrl} />
        <ResetPanel />
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
        {value}
      </p>
    </div>
  );
}
