import * as AppleAuthentication from "expo-apple-authentication";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { getAnonymousUserId } from "./checkins";
import type { UserProfile } from "@/src/types/user";

type AuthResult = { user: User; session: Session };

export async function signInWithApple(): Promise<AuthResult | null> {
  if (!supabase) {
    console.error("[auth] Supabase not configured");
    return null;
  }

  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  if (!credential.identityToken) {
    console.error("[auth] Apple returned no identity token");
    return null;
  }

  console.log("[auth] Got Apple identity token, exchanging with Supabase...");

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: "apple",
    token: credential.identityToken,
  });

  if (error) {
    console.error("[auth] Supabase Apple signInWithIdToken error:", error);
    return null;
  }

  if (!data.user || !data.session) {
    console.error("[auth] Supabase returned no user/session:", data);
    return null;
  }

  console.log("[auth] Apple sign-in success, user:", data.user.id);

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
  if (!supabase) {
    console.error("[auth] Supabase not configured");
    return null;
  }

  const redirectTo = Linking.createURL("auth/callback");
  console.log("[auth] Google redirect URL:", redirectTo);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) {
    console.error("[auth] Supabase signInWithOAuth error:", error);
    return null;
  }

  if (!data.url) {
    console.error("[auth] Supabase returned no OAuth URL");
    return null;
  }

  console.log("[auth] Opening browser for Google OAuth...");
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  console.log("[auth] Browser result:", JSON.stringify(result));

  if (result.type !== "success") {
    console.error("[auth] Browser did not return success:", result.type);
    return null;
  }

  const url = new URL(result.url);
  console.log("[auth] Callback URL:", result.url);

  const code = url.searchParams.get("code");
  if (!code) {
    console.error("[auth] No code in callback URL. Params:", result.url);
    return null;
  }

  console.log("[auth] Exchanging code for session...");
  const { data: sessionData, error: sessionError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (sessionError) {
    console.error("[auth] exchangeCodeForSession error:", sessionError);
    return null;
  }

  if (!sessionData.user || !sessionData.session) {
    console.error("[auth] No user/session after exchange:", sessionData);
    return null;
  }

  console.log("[auth] Google sign-in success, user:", sessionData.user.id);
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
  updates: Partial<Pick<UserProfile, "username" | "avatar_url">>
): Promise<void> {
  if (!supabase) return;
  await supabase
    .from("profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", userId);
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
