import React, { useState } from "react";
import {
  View,
  Pressable,
  ActivityIndicator,
  useColorScheme,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as AppleAuthentication from "expo-apple-authentication";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Text } from "@/src/components/ui/Text";
import { signInWithApple, signInWithGoogle } from "@/src/services/auth";

export default function SignInScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [loading, setLoading] = useState<"apple" | "google" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleApple = async () => {
    setError(null);
    setLoading("apple");
    try {
      const result = await signInWithApple();
      if (result) {
        router.back();
      }
    } catch (err: unknown) {
      // ERR_CANCELED means user dismissed — not an error worth showing
      if (
        err instanceof Error &&
        (err.message.includes("canceled") || err.message.includes("ERR_CANCELED"))
      ) {
        return;
      }
      setError("Apple sign-in failed. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setLoading("google");
    try {
      const result = await signInWithGoogle();
      if (result) {
        router.back();
      } else {
        setError("Google sign-in was cancelled.");
      }
    } catch {
      setError("Google sign-in failed. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <View
      className="flex-1 bg-white dark:bg-black px-6"
      style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}
    >
      {/* Back button */}
      <Pressable
        onPress={() => router.back()}
        hitSlop={8}
        className="mb-8 self-start"
        accessibilityLabel="Go back"
        accessibilityRole="button"
      >
        <Ionicons name="chevron-back" size={24} color={isDark ? "#fff" : "#000"} />
      </Pressable>

      {/* Header */}
      <View className="mb-10">
        <Text className="text-3xl font-bold text-gray-900 dark:text-white">
          Sign in
        </Text>
        <Text className="mt-2 text-base text-gray-500 dark:text-white/60">
          Sync your saved courts and check-in history across devices.
        </Text>
      </View>

      {/* Sign-in buttons */}
      <View className="gap-3">
        {/* Apple Sign In — iOS only */}
        {Platform.OS === "ios" && (
          <Pressable
            onPress={handleApple}
            disabled={!!loading}
            className="flex-row items-center justify-center rounded-2xl bg-black dark:bg-white px-5 py-4 gap-3"
            style={{ opacity: loading === "apple" ? 0.6 : 1 }}
            accessibilityLabel="Sign in with Apple"
            accessibilityRole="button"
          >
            {loading === "apple" ? (
              <ActivityIndicator size="small" color={isDark ? "#000" : "#fff"} />
            ) : (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={
                  isDark
                    ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                    : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
                }
                cornerRadius={16}
                style={{ width: "100%", height: 50 }}
                onPress={handleApple}
              />
            )}
          </Pressable>
        )}

        {/* Google Sign In */}
        <Pressable
          onPress={handleGoogle}
          disabled={!!loading}
          className="flex-row items-center justify-center rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-5 py-4 gap-3"
          style={{ opacity: loading === "google" ? 0.6 : 1 }}
          accessibilityLabel="Sign in with Google"
          accessibilityRole="button"
        >
          {loading === "google" ? (
            <ActivityIndicator size="small" color={isDark ? "#fff" : "#000"} />
          ) : (
            <>
              <Ionicons name="logo-google" size={20} color={isDark ? "#fff" : "#000"} />
              <Text className="text-base font-semibold text-gray-900 dark:text-white">
                Continue with Google
              </Text>
            </>
          )}
        </Pressable>
      </View>

      {error ? (
        <Text className="mt-4 text-center text-sm text-red-500">{error}</Text>
      ) : null}

      {/* Fine print */}
      <Text className="mt-auto text-center text-xs text-gray-400 dark:text-white/30">
        By signing in you agree to our Terms of Service and Privacy Policy.
        Your saved courts and check-in history will sync to your account.
      </Text>
    </View>
  );
}
