import React from "react";
import { View } from "react-native";
import { Link } from "expo-router";
import Constants from "expo-constants";
import { Text } from "@/src/components/ui/Text";
import { Button } from "@/src/components/ui/Button";
import { hydrateSavedCourts, subscribeSavedCourts } from "@/src/services/savedCourts";

export default function ProfileScreen() {
  const [savedCount, setSavedCount] = React.useState(0);
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

  return (
    <View className="flex-1 bg-black px-6 py-6">
      <Text className="text-2xl font-bold">Profile</Text>
      <Text className="mt-2 text-white/70">
        Profile features will be added soon.
      </Text>
      <View className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
        <Text className="text-white/80">App version</Text>
        <Text className="mt-1 text-white/60">{`v${version} • build ${build}`}</Text>
      </View>
      <View className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
        <Text className="text-white/80">Saved Courts</Text>
        <Text className="mt-1 text-white/60">{savedCount}</Text>
      </View>
      <View className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
        <Text className="text-white/80">Account</Text>
        <Text className="mt-1 text-white/60">Coming soon</Text>
      </View>
      <View className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-4">
        <Text className="text-white/80">Saved Courts</Text>
        <Text className="mt-1 text-white/60">Coming soon</Text>
      </View>
      <View className="mt-6">
        <Link href="/courts" asChild>
          <Button title="Open Courts" variant="secondary" />
        </Link>
      </View>
      <View className="mt-3">
        <Link href="/welcome" asChild>
          <Button title="Open Welcome Screen" variant="secondary" />
        </Link>
      </View>
    </View>
  );
}
