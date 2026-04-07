import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type SupabaseEnvStatus = {
  configured: boolean;
  reason?: string;
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_LEGACY_ANON_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  "";

const missing: string[] = [];
if (!supabaseUrl) missing.push("EXPO_PUBLIC_SUPABASE_URL");
if (!supabaseAnonKey) {
  missing.push("EXPO_PUBLIC_SUPABASE_ANON_KEY or EXPO_PUBLIC_SUPABASE_LEGACY_ANON_KEY");
}

const isConfigured = missing.length === 0;

export function getSupabaseEnvStatus(): SupabaseEnvStatus {
  return {
    configured: isConfigured,
    reason: isConfigured
      ? undefined
      : `Missing Supabase env vars: ${missing.join(", ")}`,
  };
}

function buildSupabaseClient(): SupabaseClient | null {
  if (!isConfigured) {
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: "pkce",
    },
  });
}

export const supabase = buildSupabaseClient();
