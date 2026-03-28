import React, { useState } from "react";
import {
  View,
  Switch,
  Pressable,
  Linking,
  ScrollView,
  ActivityIndicator,
  useColorScheme,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Constants from "expo-constants";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { Text } from "@/src/components/ui/Text";
import {
  getNotificationsEnabled,
  setNotificationsEnabled,
} from "@/src/services/nearbyActivity";
import { requestNotificationPermissions } from "@/src/services/notifications";
import { useAuth } from "@/src/context/AuthContext";
import { signOut } from "@/src/services/auth";

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const iconColor = isDark ? "#ffffff99" : "#374151";
  const { user } = useAuth();

  const [notificationsEnabled, setNotificationsEnabledState] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const version = Constants.expoConfig?.version ?? "—";
  const build =
    Constants.expoConfig?.ios?.buildNumber ??
    Constants.expoConfig?.android?.versionCode?.toString() ??
    "—";

  React.useEffect(() => {
    getNotificationsEnabled().then(setNotificationsEnabledState);
  }, []);

  const handleToggleNotifications = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!notificationsEnabled) {
      const granted = await requestNotificationPermissions();
      if (granted) {
        await setNotificationsEnabled(true);
        setNotificationsEnabledState(true);
      }
    } else {
      await setNotificationsEnabled(false);
      setNotificationsEnabledState(false);
    }
  };

  const handleSignOut = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSigningOut(true);
    try {
      await signOut();
      router.back();
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-black"
      contentContainerStyle={{
        paddingHorizontal: 24,
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 32,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View className="flex-row items-center gap-3 mb-8">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={24} color={isDark ? "#fff" : "#000"} />
        </Pressable>
        <Text className="text-2xl font-bold text-gray-900 dark:text-white">Settings</Text>
      </View>

      {/* Notifications */}
      <Text className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-white/30 mb-2 px-1">
        Notifications
      </Text>
      <View className="rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 overflow-hidden mb-6">
        <View className="flex-row items-center justify-between px-4 py-4">
          <View className="flex-1 mr-4">
            <Text className="text-gray-800 dark:text-white/90">Nearby Check-in Alerts</Text>
            <Text className="mt-0.5 text-xs text-gray-400 dark:text-white/40">
              Get notified when players check in nearby
            </Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleToggleNotifications}
            trackColor={{ false: "#3e3e3e", true: "#960000" }}
            thumbColor="#ffffff"
            accessibilityLabel="Enable nearby check-in alerts"
            accessibilityRole="switch"
          />
        </View>
      </View>

      {/* Legal */}
      <Text className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-white/30 mb-2 px-1">
        Legal
      </Text>
      <View className="rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 overflow-hidden mb-6">
        <Pressable
          onPress={() => Linking.openURL("https://privacy.runpickup.com/")}
          className="flex-row items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-white/10"
          accessibilityLabel="View Privacy Policy"
          accessibilityRole="link"
        >
          <View className="flex-row items-center gap-3">
            <Ionicons name="shield-checkmark-outline" size={18} color={iconColor} />
            <Text className="text-gray-700 dark:text-white/80">Privacy Policy</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={isDark ? "#ffffff40" : "#9ca3af"} />
        </Pressable>
        <Pressable
          onPress={() => Linking.openURL("https://privacy.runpickup.com/terms")}
          className="flex-row items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-white/10"
          accessibilityLabel="View Terms of Service"
          accessibilityRole="link"
        >
          <View className="flex-row items-center gap-3">
            <Ionicons name="document-text-outline" size={18} color={iconColor} />
            <Text className="text-gray-700 dark:text-white/80">Terms of Service</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={isDark ? "#ffffff40" : "#9ca3af"} />
        </Pressable>
        <Pressable
          onPress={() => Linking.openURL("mailto:support@runpickup.com").catch(() => null)}
          className="flex-row items-center justify-between px-4 py-4"
          accessibilityLabel="Contact Support"
          accessibilityRole="link"
        >
          <View className="flex-row items-center gap-3">
            <Ionicons name="mail-outline" size={18} color={iconColor} />
            <Text className="text-gray-700 dark:text-white/80">Contact Support</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={isDark ? "#ffffff40" : "#9ca3af"} />
        </Pressable>
      </View>

      {/* Account */}
      {user ? (
        <>
          <Text className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-white/30 mb-2 px-1">
            Account
          </Text>
          <View className="rounded-2xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/10 overflow-hidden mb-6">
            <Pressable
              onPress={handleSignOut}
              disabled={signingOut}
              className="flex-row items-center justify-center gap-2 px-4 py-4"
              accessibilityLabel="Sign out"
              accessibilityRole="button"
            >
              {signingOut ? (
                <ActivityIndicator size="small" color="#960000" />
              ) : (
                <>
                  <Ionicons name="log-out-outline" size={18} color="#960000" />
                  <Text className="text-red-700 dark:text-red-400 font-medium">Sign Out</Text>
                </>
              )}
            </Pressable>
          </View>
        </>
      ) : null}

      {/* App version */}
      <Text className="text-center text-xs text-gray-400 dark:text-white/30">
        {`v${version} • build ${build}`}
      </Text>
    </ScrollView>
  );
}
