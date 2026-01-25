import React from "react";
import { Pressable, PressableProps } from "react-native";
import { Text } from "./Text";
import { cn } from "@/src/lib/cn";

type Variant = "primary" | "secondary" | "ghost";

export function Button({
  title,
  variant = "primary",
  className,
  textClassName,
  ...props
}: PressableProps & {
  title: string;
  variant?: Variant;
  className?: string;
  textClassName?: string;
}) {
  const base = "px-4 py-3 rounded-2xl items-center justify-center";
  const variantClass =
    variant === "primary"
      ? "bg-[#960000]"
      : variant === "secondary"
      ? "bg-white/10"
      : "bg-transparent";

  const textBase = "text-base font-semibold";
  const textVariant =
    variant === "primary" ? "text-white" : variant === "secondary" ? "text-white" : "text-white/80";

  return (
    <Pressable className={cn(base, variantClass, className)} {...props}>
      <Text className={cn(textBase, textVariant, textClassName)}>{title}</Text>
    </Pressable>
  );
}
