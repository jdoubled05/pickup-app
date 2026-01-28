import { Stack } from "expo-router";

export default function CourtsStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#000" },
        headerTintColor: "#fff",
        headerTitleStyle: { color: "#fff" },
        contentStyle: { backgroundColor: "#000" },
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
