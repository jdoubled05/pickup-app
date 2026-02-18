import React from "react";
import { Pressable, PressableProps, View } from "react-native";
import { Text } from "./Text";
import { cn } from "@/src/lib/cn";

type Variant = "primary" | "secondary" | "ghost";

export function Button({
  title,
  variant = "primary",
  icon,
  className,
  textClassName,
  ...props
}: PressableProps & {
  title: string;
  variant?: Variant;
  icon?: React.ReactNode;
  className?: string;
  textClassName?: string;
}) {
  const base = "px-4 py-3 rounded-2xl items-center justify-center";
  const variantClass =
    variant === "primary"
      ? "bg-[#960000]"
      : variant === "secondary"
      ? "bg-gray-200 dark:bg-white/10 border border-gray-300 dark:border-white/20"
      : "bg-transparent";

  const textBase = "text-base font-semibold";
  const textVariant =
    variant === "primary" ? "text-white" : variant === "secondary" ? "text-gray-900 dark:text-white" : "text-gray-900 dark:text-white/80";

  return (
    <Pressable className={cn(base, variantClass, className)} {...props}>
      <View className="flex-row items-center justify-center">
        {icon && <View className="mr-2">{icon}</View>}
        <Text className={cn(textBase, textVariant, textClassName)}>{title}</Text>
      </View>
    </Pressable>
  );
}
