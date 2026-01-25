export type SupabaseConfig = {
  url: string;
  anonKey: string;
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabaseConfig: SupabaseConfig = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
};

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const baseHeaders = isSupabaseConfigured
  ? {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    }
  : {};

export async function supabaseFetch<T>(path: string, init: RequestInit = {}) {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured.");
  }

  const response = await fetch(`${supabaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...baseHeaders,
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Supabase request failed: ${message}`);
  }

  return (await response.json()) as T;
}
