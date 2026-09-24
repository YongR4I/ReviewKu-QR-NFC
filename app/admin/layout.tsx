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
  const { username } = await getAdminSession();

  if (!username) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center bg-zinc-50 px-6 font-sans dark:bg-black">
        <AdminLogin />
        <p className="mt-6 text-xs text-zinc-400">ReviewKU QR · Admin</p>
      </main>
    );
  }

  return children;
}
