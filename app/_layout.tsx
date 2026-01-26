import "react-native-reanimated";
import "../global.css";
import { Stack } from "expo-router";
import { AppShell } from "@/src/components/AppShell";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

export default function RootLayout() {
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
          }}
        />
      </Stack>
    </AppShell>
  );
}
