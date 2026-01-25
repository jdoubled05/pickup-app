import React from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-1">{children}</View>
    </SafeAreaView>
  );
}
