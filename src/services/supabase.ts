import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type SupabaseEnvStatus = {
  isConfigured: boolean;
  missing: string[];
  message: string;
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

const missing: string[] = [];
if (!supabaseUrl) missing.push("EXPO_PUBLIC_SUPABASE_URL");
if (!supabaseAnonKey) missing.push("EXPO_PUBLIC_SUPABASE_ANON_KEY");

const isConfigured = missing.length === 0;

export function getSupabaseEnvStatus(): SupabaseEnvStatus {
  if (__DEV__ && !isConfigured) {
    throw new Error(
      `Supabase is not configured. Set ${missing.join(
        ", "
      )} in your environment before using Supabase.`
    );
  }

  return {
    isConfigured,
    missing,
    message: isConfigured
      ? "Supabase env vars are configured."
      : `Missing Supabase env vars: ${missing.join(", ")}`,
  };
}

function buildSupabaseClient(): SupabaseClient | null {
  if (!isConfigured) {
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = buildSupabaseClient();
