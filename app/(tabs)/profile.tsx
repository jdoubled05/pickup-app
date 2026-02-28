import React from "react";
import { View, Switch, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Link } from "expo-router";
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

export default function ProfileScreen() {
  const [savedCount, setSavedCount] = React.useState(0);
  const [notificationsEnabled, setNotificationsEnabledState] = React.useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const iconColor = isDark ? '#ffffff' : '#1f2937';
  const insets = useSafeAreaInsets(); // white in dark mode, gray-800 in light mode
  const version =
    Constants.expoConfig?.version ??
    Constants.manifest?.version ??
    "Unknown";
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
      // Request permissions when enabling
      const granted = await requestNotificationPermissions();
      if (granted) {
        await setNotificationsEnabled(true);
        setNotificationsEnabledState(true);
      }
    } else {
      // Disable notifications
      await setNotificationsEnabled(false);
      setNotificationsEnabledState(false);
    }
  };

  return (
    <View className="flex-1 bg-white dark:bg-black px-6 pb-6" style={{ paddingTop: insets.top + 24 }}>
      <Text className="text-2xl font-bold text-gray-900 dark:text-white">Profile</Text>
      <Text className="mt-2 text-gray-600 dark:text-white/70">
        Profile features will be added soon.
      </Text>
      <View className="mt-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 p-4">
        <Text className="text-gray-700 dark:text-white/80">App version</Text>
        <Text className="mt-1 text-gray-500 dark:text-white/60">{`v${version} • build ${build}`}</Text>
      </View>
      <View className="mt-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 p-4">
        <Text className="text-gray-700 dark:text-white/80">Saved Courts</Text>
        <Text className="mt-1 text-gray-500 dark:text-white/60">{savedCount}</Text>
      </View>

      {/* Notifications Settings */}
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
            trackColor={{ false: '#3e3e3e', true: '#960000' }}
            thumbColor="#ffffff"
            accessibilityLabel="Enable nearby check-in alerts"
            accessibilityRole="switch"
          />
        </View>
      </View>

      <View className="mt-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 p-4">
        <Text className="text-gray-700 dark:text-white/80">Account</Text>
        <Text className="mt-1 text-gray-500 dark:text-white/60">Coming soon</Text>
      </View>
      <View className="mt-6">
        <Link href="/saved" asChild>
          <Button
            title={`Saved Courts (${savedCount})`}
            variant="secondary"
            icon={<Ionicons name="bookmark" size={20} color={iconColor} />}
            accessibilityLabel={`View saved courts, ${savedCount} saved`}
            accessibilityRole="button"
          />
        </Link>
      </View>
      <View className="mt-3">
        <Link href="/courts" asChild>
          <Button
            title="Browse Courts"
            variant="secondary"
            icon={<Ionicons name="basketball" size={20} color={iconColor} />}
            accessibilityLabel="Browse all courts"
            accessibilityRole="button"
          />
        </Link>
      </View>
      <View className="mt-3">
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
    </View>
  );
}
