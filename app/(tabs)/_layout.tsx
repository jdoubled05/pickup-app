import { Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Platform, Pressable, useColorScheme, View } from "react-native";
import { getPendingRequests } from "@/src/services/friends";
import { useAuth } from "@/src/context/AuthContext";
import React from "react";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user } = useAuth();
  const [pendingCount, setPendingCount] = React.useState(0);

  React.useEffect(() => {
    if (!user) { setPendingCount(0); return; }
    getPendingRequests().then((r) => setPendingCount(r.length));
  }, [user]);

  return (
    <Tabs
      initialRouteName="courts"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? "#000" : "#fff",
          borderTopColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)",
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 82 : 72,
          paddingTop: Platform.OS === "ios" ? 8 : 6,
          paddingBottom: Platform.OS === "ios" ? 12 : 10,
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
          tabBarButton: (props) => <Pressable {...props} testID="courts-tab" />,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="basketball-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "Map",
          tabBarButton: (props) => <Pressable {...props} testID="map-tab" />,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: "Friends",
          tabBarButton: (props) => <Pressable {...props} testID="friends-tab" />,
          tabBarIcon: ({ color, size }) => (
            <View>
              <Ionicons name="people-outline" size={size} color={color} />
              {pendingCount > 0 && (
                <View
                  style={{
                    position: "absolute",
                    top: -3,
                    right: -6,
                    backgroundColor: "#960000",
                    borderRadius: 6,
                    minWidth: 12,
                    height: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingHorizontal: 2,
                  }}
                />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarButton: (props) => <Pressable {...props} testID="profile-tab" />,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
