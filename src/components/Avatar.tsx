import React from "react";
import { View, Pressable } from "react-native";
import { Image } from "expo-image";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Text } from "@/src/components/ui/Text";

type Props = {
  uri?: string | null;
  initials: string;
  size?: number;
  editable?: boolean;
  showOverlay?: boolean;
  onPress?: () => void;
};

export function Avatar({ uri, initials, size = 64, editable = false, showOverlay = editable, onPress }: Props) {
  const borderRadius = size / 2;
  const editIconSize = Math.round(size * 0.3);

  const inner = (
    <View style={{ width: size, height: size, borderRadius }} className="overflow-hidden">
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size }}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View
          style={{ width: size, height: size, borderRadius }}
          className="bg-red-900 items-center justify-center"
        >
          <Text
            className="text-white font-bold"
            style={{ fontSize: size * 0.3 }}
          >
            {initials}
          </Text>
        </View>
      )}

      {/* Edit overlay */}
      {showOverlay ? (
        <View
          className="absolute inset-0 items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.25)" }}
        >
          <Ionicons name="camera" size={editIconSize} color="#fff" />
        </View>
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityLabel="Change profile photo"
        accessibilityRole="button"
        style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
      >
        {inner}
      </Pressable>
    );
  }

  return inner;
}
