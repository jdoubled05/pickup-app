import { useColorScheme } from "react-native";
import { Stack } from "expo-router";

export default function CourtsStackLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const bg = isDark ? "#000" : "#fff";
  const fg = isDark ? "#fff" : "#000";

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: bg },
        headerTintColor: fg,
        headerTitleStyle: { color: fg },
        contentStyle: { backgroundColor: bg },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false, title: "Courts" }} />
      <Stack.Screen
        name="[id]"
        options={{
          title: "",
          headerBackTitleVisible: false,
          headerBackTitle: "",
        }}
      />
    </Stack>
  );
}
