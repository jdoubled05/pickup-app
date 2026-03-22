import * as AppleAuthentication from "expo-apple-authentication";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { getAnonymousUserId } from "./checkins";
import type { UserProfile } from "@/src/types/user";

type AuthResult = { user: User; session: Session };

/**
 * Sign in with Apple. Uses expo-apple-authentication to get an identity token,
 * then exchanges it with Supabase. On first sign-in, Apple provides the user's
 * name which we store in their profile.
 */
export async function signInWithApple(): Promise<AuthResult | null> {
  if (!supabase) return null;

  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  if (!credential.identityToken) return null;

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: "apple",
    token: credential.identityToken,
  });

  if (error || !data.user || !data.session) return null;

  // Apple only provides name on the very first sign-in
  const givenName = credential.fullName?.givenName;
  const familyName = credential.fullName?.familyName;
  if (givenName) {
    const username = [givenName, familyName].filter(Boolean).join(" ");
    await updateProfile(data.user.id, { username });
  }

  await migrateAnonymousData(data.user.id);

  return { user: data.user, session: data.session };
}

/**
 * Sign in with Google. Opens a browser session via Supabase OAuth, waits for
 * the redirect back to the app, then exchanges the auth code for a session.
 */
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
  const code = url.searchParams.get("code");
  if (!code) return null;

  const { data: sessionData, error: sessionError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (sessionError || !sessionData.user || !sessionData.session) return null;

  await migrateAnonymousData(sessionData.user.id);

  return { user: sessionData.user, session: sessionData.session };
}

export async function signOut(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function getProfile(
  userId: string
): Promise<UserProfile | null> {
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
  updates: Partial<Pick<UserProfile, "username" | "avatar_url">>
): Promise<void> {
  if (!supabase) return;
  await supabase
    .from("profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", userId);
}

/**
 * Transfers anonymous check-ins to the newly authenticated user so they
 * don't lose activity history when they sign up.
 */
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
