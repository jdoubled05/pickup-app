import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Text } from "@/src/components/ui/Text";

export default function CourtDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View className="flex-1 bg-black px-6 py-6">
      <Text className="text-2xl font-bold">Court Details</Text>
      <Text className="mt-2 text-white/70">Court ID: {id}</Text>
    </View>
  );
}
