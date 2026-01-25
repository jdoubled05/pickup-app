import React from "react";
import { View } from "react-native";
import { Text } from "@/src/components/ui/Text";

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mt-6">
      <Text className="text-lg font-semibold">{title}</Text>
      <View className="mt-2">{children}</View>
    </View>
  );
}
