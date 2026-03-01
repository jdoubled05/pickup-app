import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { Text } from './ui/Text';
import { Court, formatAddress, formatDistance, formatHoops, formatIndoor } from '../services/courts';
import { WeatherBadge } from './WeatherBadge';
import { WeatherData } from '../types/weather';

interface CourtCardProps {
  court: Court;
  index: number;
  weather?: WeatherData | null;
}

export function CourtCard({ court, index, weather }: CourtCardProps) {
  const courtType = formatIndoor(court.indoor).toLowerCase();
  const hoops = formatHoops(court.num_hoops);
  const lighting = court.lighting === null || court.lighting === undefined
    ? null
    : court.lighting
      ? 'lit'
      : 'no lights';
  const distance = formatDistance(court.distance_meters);
  const isIndoor = court.indoor === true;

  return (
    <Link
      href={{ pathname: '/court/[id]', params: { id: court.id } }}
      asChild
    >
      <Pressable
        style={({ pressed }) => [
          styles.container,
          pressed && styles.pressed,
        ]}
        className={`mb-3 overflow-hidden rounded-2xl border bg-gray-100 dark:bg-gray-900 ${
          isIndoor ? 'border-secondary/30' : 'border-court/30'
        }`}
        accessibilityLabel={`${court.name}, ${courtType} court, ${hoops}, ${distance || 'nearby'}`}
        accessibilityRole="button"
        accessibilityHint="Double tap to view court details"
      >
        {/* Accent bar */}
        <View
          className={`h-1 ${isIndoor ? 'bg-secondary' : 'bg-court'}`}
        />

        <View className="p-4">
          {/* Header with badges */}
          <View className="mb-2 flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-lg font-bold text-gray-900 dark:text-white">{court.name}</Text>
            </View>
            <View className="flex-row gap-2">
              <WeatherBadge weather={weather} />
              {distance && (
                <View className="rounded-full bg-brand px-3 py-1">
                  <Text className="text-xs font-semibold text-white">{distance}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Address */}
          {court.address && (
            <Text className="mb-3 text-sm text-gray-500 dark:text-white/60" numberOfLines={1}>
              {formatAddress(court)}
            </Text>
          )}

          {/* Attributes */}
          <View className="flex-row flex-wrap gap-2">
            {/* Court type badge */}
            <View className={`rounded-lg px-3 py-1.5 ${isIndoor ? 'bg-secondary' : 'bg-court'}`}>
              <Text className="text-xs font-semibold text-white">
                {isIndoor ? '🏠 Indoor' : '🌤️ Outdoor'}
              </Text>
            </View>

            {/* Court size */}
            {court.court_size != null && (
              <View className="rounded-lg bg-gray-200 dark:bg-white/10 px-3 py-1.5">
                <Text className="text-xs font-medium text-gray-600 dark:text-white/70">
                  {court.court_size === 'full' ? 'Full Court' : court.court_size === 'half' ? 'Half Court' : 'Full & Half'}
                </Text>
              </View>
            )}

            {/* Hoops */}
            {court.num_hoops != null && (
              <View className="rounded-lg bg-gray-200 dark:bg-white/10 px-3 py-1.5">
                <Text className="text-xs font-medium text-gray-600 dark:text-white/70">
                  🏀 {court.num_hoops} {court.num_hoops === 1 ? 'hoop' : 'hoops'}
                </Text>
              </View>
            )}

            {/* Lighting */}
            {lighting && (
              <View className="rounded-lg bg-gray-200 dark:bg-white/10 px-3 py-1.5">
                <Text className="text-xs font-medium text-gray-600 dark:text-white/70">
                  {court.lighting ? '💡 Lit' : '🌙 No lights'}
                </Text>
              </View>
            )}

            {/* Free / Paid */}
            {court.is_free != null && (
              <View className="rounded-lg bg-gray-200 dark:bg-white/10 px-3 py-1.5">
                <Text className="text-xs font-medium text-gray-600 dark:text-white/70">
                  {court.is_free ? 'Free' : 'Paid'}
                </Text>
              </View>
            )}

            {/* Public / Private */}
            {court.is_public != null && (
              <View className="rounded-lg bg-gray-200 dark:bg-white/10 px-3 py-1.5">
                <Text className="text-xs font-medium text-gray-600 dark:text-white/70">
                  {court.is_public ? 'Public' : 'Private'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  container: {
    transform: [{ scale: 1 }],
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
});
