import React from "react";
import { View, Switch, Pressable, Linking, useColorScheme, ScrollView, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Link, useRouter } from "expo-router";
import Constants from "expo-constants";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { Text } from "@/src/components/ui/Text";
import { Button } from "@/src/components/ui/Button";
import { hydrateSavedCourts, subscribeSavedCourts } from "@/src/services/savedCourts";
import {
  getNotificationsEnabled,
  setNotificationsEnabled,
} from "@/src/services/nearbyActivity";
import { requestNotificationPermissions } from "@/src/services/notifications";
import { useAuth } from "@/src/context/AuthContext";
import { signOut } from "@/src/services/auth";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [savedCount, setSavedCount] = React.useState(0);
  const [notificationsEnabled, setNotificationsEnabledState] = React.useState(false);
  const [signingOut, setSigningOut] = React.useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const iconColor = isDark ? "#ffffff" : "#1f2937";
  const insets = useSafeAreaInsets();
  const version = Constants.expoConfig?.version ?? "Unknown";
  const build =
    Constants.expoConfig?.ios?.buildNumber ??
    Constants.expoConfig?.android?.versionCode?.toString() ??
    "Unknown";

  React.useEffect(() => {
    hydrateSavedCourts();
    return subscribeSavedCourts((ids) => {
      setSavedCount(ids.length);
    });
  }, []);

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
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  };

  const displayName = profile?.username ?? user?.email ?? "Player";
  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-black"
      contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40, paddingTop: insets.top + 24 }}
      showsVerticalScrollIndicator={false}
    >
      <Text className="text-2xl font-bold text-gray-900 dark:text-white">Profile</Text>

      {/* Account section */}
      {authLoading ? (
        <View className="mt-6 items-center py-6">
          <ActivityIndicator color="#960000" />
        </View>
      ) : user ? (
        <View className="mt-6 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 p-4">
          <View className="flex-row items-center gap-4">
            {/* Avatar initials */}
            <View className="h-14 w-14 rounded-full bg-red-900 items-center justify-center">
              <Text className="text-white font-bold text-lg">{initials}</Text>
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-gray-900 dark:text-white text-base">
                {displayName}
              </Text>
              {user.email ? (
                <Text className="text-sm text-gray-500 dark:text-white/50 mt-0.5">
                  {user.email}
                </Text>
              ) : null}
            </View>
          </View>
          <Pressable
            onPress={handleSignOut}
            disabled={signingOut}
            className="mt-4 flex-row items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-white/10 py-2.5"
            accessibilityLabel="Sign out"
            accessibilityRole="button"
          >
            {signingOut ? (
              <ActivityIndicator size="small" color={isDark ? "#fff" : "#000"} />
            ) : (
              <>
                <Ionicons name="log-out-outline" size={16} color={isDark ? "#ffffff80" : "#6b7280"} />
                <Text className="text-sm text-gray-500 dark:text-white/50">Sign out</Text>
              </>
            )}
          </Pressable>
        </View>
      ) : (
        <Pressable
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onPress={() => router.push("/sign-in" as any)}
          className="mt-6 rounded-2xl bg-red-900 px-5 py-4 items-center"
          accessibilityLabel="Sign in to your account"
          accessibilityRole="button"
        >
          <Text className="text-white font-semibold text-base">Sign in</Text>
          <Text className="text-white/70 text-xs mt-1">
            Sync saved courts across devices
          </Text>
        </Pressable>
      )}

      {/* Stats */}
      <View className="mt-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 p-4">
        <Text className="text-gray-700 dark:text-white/80">Saved Courts</Text>
        <Text className="mt-1 text-gray-500 dark:text-white/60">{savedCount}</Text>
      </View>

      {/* Notifications */}
      <View className="mt-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 p-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-gray-700 dark:text-white/80">Nearby Check-in Alerts</Text>
            <Text className="mt-1 text-xs text-gray-400 dark:text-white/50">
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

      {/* Quick links */}
      <View className="mt-6 gap-3">
        <Link href="/saved" asChild>
          <Button
            title={`Saved Courts (${savedCount})`}
            variant="secondary"
            icon={<Ionicons name="bookmark" size={20} color={iconColor} />}
            accessibilityLabel={`View saved courts, ${savedCount} saved`}
            accessibilityRole="button"
            testID="saved-courts-button"
          />
        </Link>
        <Link href="/courts" asChild>
          <Button
            title="Browse Courts"
            variant="secondary"
            icon={<Ionicons name="basketball" size={20} color={iconColor} />}
            accessibilityLabel="Browse all courts"
            accessibilityRole="button"
          />
        </Link>
        <Link href="/submit-court" asChild>
          <Button
            title="Submit a Court"
            variant="secondary"
            icon={<Ionicons name="add-circle" size={20} color={iconColor} />}
            accessibilityLabel="Submit a new court"
            accessibilityRole="button"
          />
        </Link>
      </View>

      {/* App info */}
      <View className="mt-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 p-4">
        <Text className="text-gray-500 dark:text-white/50 text-sm">{`v${version} • build ${build}`}</Text>
      </View>

      {/* Legal */}
      <View className="mt-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 overflow-hidden">
        <Pressable
          onPress={() => Linking.openURL("https://privacy.runpickup.com/")}
          className="flex-row items-center justify-between px-4 py-3.5 border-b border-gray-200 dark:border-white/10"
          accessibilityLabel="View Privacy Policy"
          accessibilityRole="link"
        >
          <View className="flex-row items-center gap-3">
            <Ionicons name="shield-checkmark-outline" size={18} color={isDark ? "#ffffff99" : "#374151"} />
            <Text className="text-gray-700 dark:text-white/80">Privacy Policy</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={isDark ? "#ffffff40" : "#9ca3af"} />
        </Pressable>
        <Pressable
          onPress={() => Linking.openURL("https://privacy.runpickup.com/terms")}
          className="flex-row items-center justify-between px-4 py-3.5 border-b border-gray-200 dark:border-white/10"
          accessibilityLabel="View Terms of Service"
          accessibilityRole="link"
        >
          <View className="flex-row items-center gap-3">
            <Ionicons name="document-text-outline" size={18} color={isDark ? "#ffffff99" : "#374151"} />
            <Text className="text-gray-700 dark:text-white/80">Terms of Service</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={isDark ? "#ffffff40" : "#9ca3af"} />
        </Pressable>
        <Pressable
          onPress={() => Linking.openURL("mailto:support@runpickup.com").catch(() => null)}
          className="flex-row items-center justify-between px-4 py-3.5"
          accessibilityLabel="Contact Support"
          accessibilityRole="link"
        >
          <View className="flex-row items-center gap-3">
            <Ionicons name="mail-outline" size={18} color={isDark ? "#ffffff99" : "#374151"} />
            <Text className="text-gray-700 dark:text-white/80">Contact Support</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={isDark ? "#ffffff40" : "#9ca3af"} />
        </Pressable>
      </View>
    </ScrollView>
  );
}
