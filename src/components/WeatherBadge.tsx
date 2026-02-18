import React from 'react';
import { View, useColorScheme } from 'react-native';
import { Text } from './ui/Text';
import { WeatherData } from '../types/weather';

interface WeatherBadgeProps {
  weather: WeatherData | null;
  className?: string;
}

/**
 * Compact weather display badge
 * Shows weather icon + temperature
 */
export function WeatherBadge({ weather, className = '' }: WeatherBadgeProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  if (!weather) {
    return null;
  }

  return (
    <View className={`rounded-full px-2 py-1 flex-row items-center ${isDark ? 'bg-white/10' : 'bg-gray-700'} ${className}`}>
      <Text className="text-xs mr-1">{weather.icon}</Text>
      <Text className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-white'}`}>{weather.temp}°</Text>
    </View>
  );
}
