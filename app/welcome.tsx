import { View } from "react-native";
import { Link } from "expo-router";
import { Text } from "@/src/components/ui/Text";
import { Button } from "@/src/components/ui/Button";

export default function Welcome() {
  return (
    <View className="flex-1 justify-center bg-black px-6">
      <Text className="text-3xl font-bold">Pickup</Text>
      <Text className="mt-2 text-white/70">
        NativeWind baseline is stable ✅
      </Text>

      <View className="mt-8">
        <Link href="/courts" asChild>
          <Button title="Browse Courts" />
        </Link>

        <Link href="/court/123" asChild>
          <Button title="Go to Court Details (id=123)" className="mt-3" />
        </Link>

        <Link href="/map" asChild>
          <Button
            title="Open Map"
            variant="secondary"
            className="mt-3"
          />
        </Link>
      </View>
    </View>
  );
}
