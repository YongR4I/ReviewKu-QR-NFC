function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  get supabaseUrl(): string {
    return required("NEXT_PUBLIC_SUPABASE_URL");
  },
  get publishableKey(): string {
    return required("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  },
  get secretKey(): string {
    return required("SUPABASE_SECRET_KEY");
  },
  get pinPepper(): string {
    return required("PIN_PEPPER");
  },
  get editTokenSecret(): string {
    return required("EDIT_TOKEN_SECRET");
  },
  get siteUrl(): string {
    return required("NEXT_PUBLIC_SITE_URL");
  },
  get adminUsername(): string {
    return required("ADMIN_USERNAME");
  },
  get adminPassword(): string {
    return required("ADMIN_PASSWORD");
  },
};
