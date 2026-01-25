import { View } from "react-native";
import { Text } from "@/src/components/ui/Text";

export default function MapsTest() {
  return (
    <View className="flex-1 bg-black px-6 py-6">
      <Text className="text-2xl font-bold">Maps Test</Text>
      <Text className="mt-2 text-white/70">
        MapLibre will be reintroduced after shell + navigation are stable.
      </Text>
    </View>
  );
}
