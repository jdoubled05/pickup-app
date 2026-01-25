import "react-native-reanimated";
import "../global.css";
import { Stack } from "expo-router";
import { AppShell } from "@/src/components/AppShell";

export const unstable_settings = {
  initialRouteName: "index",
};

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
