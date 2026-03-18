import React, { useEffect, useState } from 'react';
import { View, Pressable, StyleSheet, Animated } from 'react-native';
import { Link } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from './ui/Text';
import { Court, formatAddress, formatDistance } from '../services/courts';
import { WeatherBadge } from './WeatherBadge';
import { WeatherData } from '../types/weather';
import { toggleCheckIn, isCheckedInAtCourt } from '../services/checkins';
import * as Haptics from 'expo-haptics';

interface HotCourtCardProps {
  court: Court;
  checkInsCount: number;
  index: number;
  weather?: WeatherData | null;
}

/**
 * Special card for courts with active check-ins
 * More prominent, shows live activity
 */
export function HotCourtCard({ court, checkInsCount, index, weather }: HotCourtCardProps) {
  const distance = formatDistance(court.distance_meters);
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  // Check if user is checked in at this court
  useEffect(() => {
    let mounted = true;

    const checkStatus = async () => {
      const status = await isCheckedInAtCourt(court.id);
      if (mounted) {
        setIsCheckedIn(status);
      }
    };

    checkStatus();

    return () => {
      mounted = false;
    };
  }, [court.id]);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const handleJoinGame = async (e: any) => {
    // Prevent card navigation when button is pressed
    e.preventDefault();
    e.stopPropagation();

    if (isCheckingIn) return;

    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setIsCheckingIn(true);

    // Optimistic UI update
    const wasCheckedIn = isCheckedIn;
    setIsCheckedIn(!wasCheckedIn);

    try {
      await toggleCheckIn(court.id);
      // Success haptic
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      // Revert on error
      setIsCheckedIn(wasCheckedIn);
      console.error('Failed to toggle check-in:', error);
    } finally {
      setIsCheckingIn(false);
    }
  };

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
        testID="court-card"
        className="mb-3 overflow-hidden rounded-2xl border border-brand/40 bg-brand/10"
        accessibilityLabel={`${court.name}, ${checkInsCount} ${checkInsCount === 1 ? 'player' : 'players'} checked in, ${distance || 'nearby'}`}
        accessibilityRole="button"
        accessibilityHint="Double tap to view court details"
      >
        {/* Live indicator bar */}
        <View className="h-1 bg-brand" />

        <View className="p-4">
          {/* Header with live badge */}
          <View className="mb-2 flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <View className="mb-1 flex-row items-center">
                <Animated.View
                  className="mr-2 h-2 w-2 rounded-full bg-brand"
                  style={{ opacity: pulseAnim }}
                />
                <Text className="text-xs font-semibold uppercase tracking-wide text-brand dark:text-brand-light">
                  LIVE NOW
                </Text>
              </View>
              <Text className="text-xl font-extrabold text-gray-900 dark:text-white">{court.name}</Text>
            </View>
            <View className="flex-col gap-2">
              <WeatherBadge weather={weather} />
              {distance && (
                <View className="rounded-full bg-brand px-3 py-1">
                  <Text className="text-xs font-bold text-white">{distance}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Address */}
          {court.address && (
            <Text className="mb-3 text-sm text-gray-500 dark:text-white/60" numberOfLines={1}>
              📍 {formatAddress(court)}
            </Text>
          )}

          {/* Activity info */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              {/* Player count with icons */}
              <View className="flex-row items-center rounded-lg bg-brand px-3 py-2">
                {Array.from({ length: Math.min(checkInsCount, 5) }).map((_, i) => (
                  <Text key={i} className="text-base" style={{ marginLeft: i > 0 ? -6 : 0 }}>
                    🏀
                  </Text>
                ))}
                <Text className="ml-2 font-bold text-white">
                  {checkInsCount} {checkInsCount === 1 ? 'player' : 'players'}
                </Text>
              </View>
            </View>

            {/* Court type badge */}
            <View
              className={`rounded-lg px-3 py-1.5 ${
                court.indoor ? 'bg-secondary' : 'bg-court'
              }`}
            >
              <Text className="text-xs font-semibold text-white">
                {court.indoor ? '🏠 Indoor' : '🌤️ Outdoor'}
              </Text>
            </View>
          </View>

          {/* Free/Paid + Public/Private badges */}
          {(court.is_free != null || court.is_public != null) && (
            <View className="mt-2 flex-row flex-wrap gap-2">
              {court.is_free != null && (
                <View className="rounded-lg bg-white/10 px-3 py-1.5">
                  <Text className="text-xs font-medium text-white/70">
                    {court.is_free ? 'Free' : 'Paid'}
                  </Text>
                </View>
              )}
              {court.is_public != null && (
                <View className="rounded-lg bg-white/10 px-3 py-1.5">
                  <Text className="text-xs font-medium text-white/70">
                    {court.is_public ? 'Public' : 'Private'}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Join Game Button */}
          <Pressable
            onPress={handleJoinGame}
            disabled={isCheckingIn}
            style={({ pressed }) => [
              pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
            ]}
            className={`mt-3 rounded-xl py-3 px-4 ${
              isCheckedIn ? 'bg-status-active' : 'bg-brand'
            }`}
            accessibilityLabel={isCheckedIn ? 'Leave game' : 'Join game'}
            accessibilityRole="button"
            accessibilityState={{ disabled: isCheckingIn }}
          >
            <View className="flex-row items-center justify-center">
              {!isCheckingIn && (
                <View className="mr-2">
                  <Ionicons
                    name={isCheckedIn ? 'checkmark-circle' : 'basketball'}
                    size={20}
                    color="#ffffff"
                  />
                </View>
              )}
              <Text className="text-center font-bold text-white">
                {isCheckingIn ? 'Loading...' : isCheckedIn ? 'Joined' : 'Join Game'}
              </Text>
            </View>
          </Pressable>
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
