import "react-native-reanimated";
import "../global.css";
import { Stack, useRouter } from "expo-router";
import { Pressable } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { AppShell } from "@/src/components/AppShell";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

export default function RootLayout() {
  const router = useRouter();

  return (
    <AppShell>
      <Stack
        initialRouteName="(tabs)"
        screenOptions={{
          headerStyle: { backgroundColor: "#000" },
          headerTintColor: "#fff",
          headerTitleStyle: { color: "#fff" },
          contentStyle: { backgroundColor: "#000" },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="court/[id]"
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
                <Ionicons name="chevron-back" size={22} color="#fff" />
              </Pressable>
            ),
          }}
        />
      </Stack>
    </AppShell>
  );
}
