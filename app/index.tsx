import { View } from "react-native";
import { Text } from "@/src/components/ui/Text";
import { Button } from "@/src/components/ui/Button";

export default function Home() {
  return (
    <View className="flex-1 items-center justify-center bg-black px-6">
      <Text className="text-2xl font-bold">Pickup</Text>
      <Text className="mt-2 text-white/70 text-center">
        NativeWind baseline is stable ✅
      </Text>

      <View className="mt-6 w-full">
        <Button title="Primary Action" onPress={() => {}} />
        <Button title="Secondary" variant="secondary" className="mt-3" onPress={() => {}} />
      </View>
    </View>
  );
}
