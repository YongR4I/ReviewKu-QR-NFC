"use client";

import { useState, useTransition } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

export function AdminLogin() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const supabase = supabaseBrowser();
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: `${window.location.origin}/admin` },
      });
      if (otpError) {
        setError(otpError.message);
        return;
      }
      setMessage("Link login dikirim ke emailmu. Buka link tersebut untuk masuk.");
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-lg text-white dark:bg-zinc-100 dark:text-zinc-900">
          🔑
        </div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Login Admin
        </h1>
        <p className="mt-1.5 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
          Masukkan email terdaftar untuk menerima link login.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}
      {message && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
          {message}
        </div>
      )}

      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Email
          </span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@domain.com"
            className="h-11 rounded-lg border border-zinc-300 bg-white px-3.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="flex h-11 items-center justify-center rounded-lg bg-zinc-900 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {pending ? "Mengirim..." : "Kirim Link Login"}
        </button>
      </div>
    </form>
  );
}
