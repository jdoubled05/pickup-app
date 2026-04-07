import * as AppleAuthentication from "expo-apple-authentication";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { getAnonymousUserId } from "./checkins";
import type { UserProfile } from "@/src/types/user";

type AuthResult = { user: User; session: Session };

export async function signInWithApple(): Promise<AuthResult | null> {
  if (!supabase) return null;

  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  if (!credential.identityToken) throw new Error("Apple did not return an identity token");

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: "apple",
    token: credential.identityToken,
  });

  if (error) throw new Error(error.message);
  if (!data.user || !data.session) throw new Error("No session returned from Supabase");

  const givenName = credential.fullName?.givenName;
  const familyName = credential.fullName?.familyName;
  if (givenName) {
    const username = [givenName, familyName].filter(Boolean).join(" ");
    await updateProfile(data.user.id, { username });
  }

  await migrateAnonymousData(data.user.id);

  return { user: data.user, session: data.session };
}

export async function signInWithGoogle(): Promise<AuthResult | null> {
  if (!supabase) return null;

  const redirectTo = Linking.createURL("auth/callback");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error || !data.url) return null;

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type !== "success") return null;

  const url = new URL(result.url);

  const errorParam = url.searchParams.get("error");
  if (errorParam) {
    const desc = url.searchParams.get("error_description") ?? errorParam;
    throw new Error(desc.replace(/\+/g, " "));
  }

  // PKCE flow: code in query params
  const code = url.searchParams.get("code");

  // Implicit flow fallback: tokens in hash fragment
  const hash = result.url.includes("#") ? result.url.split("#")[1] : "";
  const hashParams = new URLSearchParams(hash);
  const accessToken = hashParams.get("access_token");
  const refreshToken = hashParams.get("refresh_token");

  if (!code && !accessToken) return null;

  let sessionData: { user: import("@supabase/supabase-js").User; session: import("@supabase/supabase-js").Session } | null = null;

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error || !data.user || !data.session) return null;
    sessionData = { user: data.user, session: data.session };
  } else {
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken!,
      refresh_token: refreshToken ?? "",
    });
    if (error || !data.user || !data.session) return null;
    sessionData = { user: data.user, session: data.session };
  }

  await migrateAnonymousData(sessionData.user.id);

  return { user: sessionData.user, session: sessionData.session };
}

export async function signOut(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function getProfile(userId: string): Promise<UserProfile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) return null;
  return data as UserProfile;
}

export async function updateProfile(
  userId: string,
  updates: Partial<Pick<UserProfile, "username" | "avatar_url" | "play_style" | "skill_level">>
): Promise<void> {
  if (!supabase) return;
  const now = new Date().toISOString();
  const payload: Record<string, unknown> = { ...updates, updated_at: now };
  if (updates.username !== undefined) {
    // Only stamp and increment when the username is actually changing
    const { data: current } = await supabase
      .from("profiles")
      .select("username, username_change_count")
      .eq("id", userId)
      .single();
    if (updates.username !== current?.username) {
      payload.username_updated_at = now;
      payload.username_change_count = (current?.username_change_count ?? 0) + 1;
    }
  }
  await supabase.from("profiles").update(payload).eq("id", userId);
}

async function migrateAnonymousData(userId: string): Promise<void> {
  if (!supabase) return;
  try {
    const anonymousId = await getAnonymousUserId();
    await supabase.rpc("migrate_anonymous_to_user", {
      p_anonymous_id: anonymousId,
      p_user_id: userId,
    });
  } catch {
    // Non-fatal — migration best-effort
  }
}
