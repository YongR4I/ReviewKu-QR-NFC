import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getAdminSession } from "@/lib/admin-auth";
import { AdminLogin } from "@/components/admin/AdminLogin";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, isAllowed } = await getAdminSession();

  if (!user) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center bg-zinc-50 px-6 font-sans dark:bg-black">
        <AdminLogin />
        <p className="mt-6 text-xs text-zinc-400">ReviewKU QR · Admin</p>
      </main>
    );
  }

  if (!isAllowed) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center bg-zinc-50 px-6 font-sans dark:bg-black">
        <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-2xl dark:bg-amber-950">
            🚫
          </div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Tidak Berwenang
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Email <span className="font-medium">{user.email}</span> tidak
            terdaftar di daftar admin. Tambahkan emailmu ke variabel{" "}
            <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-900">
              ADMIN_EMAILS
            </code>
            .
          </p>
        </div>
      </main>
    );
  }

  return children;
}
