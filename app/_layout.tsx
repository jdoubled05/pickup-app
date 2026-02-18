import "react-native-reanimated";
import "../global.css";
import { Stack, useRouter } from "expo-router";
import { Pressable, useColorScheme } from "react-native";
import { useEffect } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Notifications from "expo-notifications";
import { AppShell } from "@/src/components/AppShell";
import { configureNotificationHandler } from "@/src/services/notifications";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

export default function RootLayout() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

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
          name="court/[id]"
          options={{
            headerShown: false,
          }}
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
      </Stack>
    </AppShell>
  );
}
