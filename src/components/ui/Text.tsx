import React from "react";
import { Text as RNText, TextProps } from "react-native";
import { cn } from "@/src/lib/cn";

export function Text({ className, ...props }: TextProps & { className?: string }) {
  return <RNText className={cn("text-gray-900 dark:text-white", className)} {...props} />;
}
