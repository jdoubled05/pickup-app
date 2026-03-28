import "react-native-reanimated";
import "../global.css";
import { Stack, useRouter } from "expo-router";
import { Pressable, useColorScheme } from "react-native";
import { useEffect } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import { AppShell } from "@/src/components/AppShell";
import { configureNotificationHandler } from "@/src/services/notifications";
import { hasCompletedOnboarding } from "@/src/services/onboarding";
import { setPendingDeepLink } from "@/src/services/pendingDeepLink";
import { AuthProvider } from "@/src/context/AuthContext";
import { supabase } from "@/src/services/supabase";
import { setCurrentUser } from "@/src/services/savedCourts";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

export default function RootLayout() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Show onboarding on first launch; capture any deep link that arrived first
  useEffect(() => {
    Promise.all([
      hasCompletedOnboarding(),
      Linking.getInitialURL(),
    ]).then(([completed, initialUrl]) => {
      if (!completed) {
        // Store the deep link so onboarding can navigate there on finish
        if (initialUrl) {
          const parsed = Linking.parse(initialUrl);
          if (parsed.path?.startsWith('court/')) {
            setPendingDeepLink(initialUrl);
          }
        }
        router.replace("/onboarding");
      }
    });
  }, [router]);

  // Keep savedCourts in sync with auth state
  useEffect(() => {
    if (!supabase) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Initialize notification handler
  useEffect(() => {
    configureNotificationHandler();

    // Handle notification taps
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const courtId = response.notification.request.content.data.courtId;
      if (courtId && typeof courtId === 'string') {
        router.push(`/court/${courtId}`);
      }
    });

    return () => subscription.remove();
  }, [router]);

  return (
    <AuthProvider>
    <AppShell>
      <Stack
        initialRouteName="(tabs)"
        screenOptions={{
          headerStyle: { backgroundColor: isDark ? "#000" : "#fff" },
          headerTintColor: isDark ? "#fff" : "#000",
          headerTitleStyle: { color: isDark ? "#fff" : "#000" },
          contentStyle: { backgroundColor: isDark ? "#000" : "#fff" },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="onboarding"
          options={{ headerShown: false, presentation: "fullScreenModal", gestureEnabled: false }}
        />
        <Stack.Screen
          name="court/[id]"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="submit-court"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="saved"
          options={{
            headerShown: true,
            headerTitle: "",
            headerBackButtonDisplayMode: "minimal",
            headerBackTitleVisible: false,
            headerBackTitle: "",
            headerLeft: () => (
              <Pressable
                onPress={() => {
                  if (router.canGoBack()) {
                    router.back();
                  } else {
                    router.replace("/courts");
                  }
                }}
                hitSlop={8}
                style={{ paddingHorizontal: 6, paddingVertical: 2 }}
              >
                <Ionicons name="chevron-back" size={22} color={isDark ? "#fff" : "#000"} />
              </Pressable>
            ),
          }}
        />
        <Stack.Screen name="sign-in" options={{ headerShown: false, presentation: "modal" }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="setup-profile" options={{ headerShown: false, presentation: "fullScreenModal", gestureEnabled: false }} />
        <Stack.Screen name="friend-search" options={{ headerShown: false, presentation: "modal" }} />
        <Stack.Screen name="user/[id]" options={{ headerShown: false }} />
      </Stack>
    </AppShell>
    </AuthProvider>
  );
}
