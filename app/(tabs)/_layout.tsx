import { Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Platform, useColorScheme } from "react-native";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      initialRouteName="courts"
      screenOptions={{
        headerShown: false,
        unmountOnBlur: false,
        tabBarStyle: {
          backgroundColor: isDark ? "#000" : "#fff",
          borderTopColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)",
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 64 : 56,
          paddingBottom: Platform.OS === "ios" ? 6 : 4,
        },
        tabBarActiveTintColor: isDark ? "#fff" : "#960000",
        tabBarInactiveTintColor: isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.45)",
        tabBarLabelStyle: {
          fontSize: 10,
          marginBottom: 1,
        },
      }}
    >
      <Tabs.Screen
        name="courts"
        options={{
          title: "Courts",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="basketball-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "Map",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
