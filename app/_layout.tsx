import "react-native-reanimated";
import { Stack } from "expo-router";
import { AppShell } from "@/src/components/AppShell";

export default function RootLayout() {
  return (
    <AppShell>
      <Stack
        initialRouteName="index"
        screenOptions={{
          headerStyle: { backgroundColor: "#000" },
          headerTintColor: "#fff",
          headerTitleStyle: { color: "#fff" },
          contentStyle: { backgroundColor: "#000" },
        }}
      />
    </AppShell>
  );
}
