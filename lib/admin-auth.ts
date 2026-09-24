import "server-only";
import type { User } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import { supabaseServer } from "@/lib/supabase/server";

export interface AdminSession {
  user: User | null;
  isAllowed: boolean;
}

export async function getAdminSession(): Promise<AdminSession> {
  const client = await supabaseServer();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user?.email) return { user: null, isAllowed: false };
  const isAllowed = env.adminEmails.includes(user.email.toLowerCase());
  return { user, isAllowed };
}

export async function requireAdmin(): Promise<User> {
  const { user, isAllowed } = await getAdminSession();
  if (!user || !isAllowed) {
    throw new Error("Unauthorized: admin access required");
  }
  return user;
}
