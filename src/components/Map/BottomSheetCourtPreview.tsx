import React, { useEffect } from 'react';
import { View, Pressable, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '../ui/Text';
import { Court, formatDistance } from '@/src/services/courts';

interface BottomSheetCourtPreviewProps {
  court: Court | null;
  checkInsCount?: number;
  onClose: () => void;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = 180;

/**
 * Bottom sheet preview for court markers on map
 * Shows court info and "View Details" button
 */
export function BottomSheetCourtPreview({
  court,
  checkInsCount = 0,
  onClose,
}: BottomSheetCourtPreviewProps) {
  const router = useRouter();
  const translateY = React.useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const opacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (court) {
      // Slide up and fade in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 90,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Slide down and fade out
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SHEET_HEIGHT,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [court, translateY, opacity]);

  if (!court) {
    return null;
  }

  const distance = formatDistance(court.distance_meters);
  const isHot = checkInsCount > 0;

  const handleViewDetails = () => {
    router.push(`/court/${court.id}`);
    onClose();
  };

  return (
    <Animated.View
      pointerEvents="box-none"
      style={{
        transform: [{ translateY }],
        opacity,
      }}
      className="absolute bottom-0 left-0 right-0"
    >
      <View className="mx-4 mb-6 overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-gray-900">
        {/* Close button */}
        <Pressable
          onPress={onClose}
          className="absolute right-3 top-3 z-10 h-11 w-11 items-center justify-center rounded-full bg-gray-200 dark:bg-white/10"
          accessibilityLabel="Close court preview"
          accessibilityRole="button"
        >
          <Text className="text-lg text-gray-900 dark:text-white">×</Text>
        </Pressable>

        <View className="p-4">
          {/* Court name and distance */}
          <View className="mb-3 pr-10">
            <Text className="text-xl font-bold text-gray-900 dark:text-white">{court.name}</Text>
            {distance && (
              <Text className="mt-1 text-sm text-gray-500 dark:text-white/60">📍 {distance} away</Text>
            )}
          </View>

          {/* Live activity badge */}
          {isHot && (
            <View className="mb-3 inline-flex self-start rounded-lg bg-brand/20 px-3 py-1.5">
              <Text className="text-sm font-semibold text-brand dark:text-brand-light">
                🔥 {checkInsCount} {checkInsCount === 1 ? 'player' : 'players'} here now
              </Text>
            </View>
          )}

          {/* Court type */}
          {court.indoor !== null && court.indoor !== undefined && (
            <View className="mb-3 inline-flex self-start">
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
          )}

          {/* View Details button */}
          <Pressable
            onPress={handleViewDetails}
            className="mt-2 rounded-xl bg-brand py-3"
            accessibilityLabel={`View details for ${court.name}`}
            accessibilityRole="button"
          >
            <Text className="text-center font-semibold text-white">View Details</Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}
