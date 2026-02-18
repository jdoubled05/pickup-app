import React, { useRef, useEffect, useState } from 'react';
import { View, Pressable, Animated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { Text } from './ui/Text';
import { CourtCard } from './CourtCard';
import { HotCourtCard } from './HotCourtCard';
import { Court } from '../services/courts';
import { WeatherData } from '../types/weather';
import { openDirections } from '../utils/directions';
import { toggleSavedCourt, hydrateSavedCourts, subscribeSavedCourts } from '../services/savedCourts';

interface SwipeableCourtCardProps {
  court: Court;
  index: number;
  checkInsCount?: number;
  weather?: WeatherData | null;
  isHot?: boolean;
}

/**
 * Wrapper component that adds swipe gestures to court cards
 * - Swipe right: Get directions
 * - Swipe left: Save/unsave court
 */
export function SwipeableCourtCard({
  court,
  index,
  checkInsCount = 0,
  weather,
  isHot = false,
}: SwipeableCourtCardProps) {
  const swipeableRef = useRef<Swipeable>(null);
  const [isSaved, setIsSaved] = useState(false);

  // Track saved state
  useEffect(() => {
    hydrateSavedCourts().then((ids) => {
      setIsSaved(ids.includes(court.id));
    });
    return subscribeSavedCourts((ids) => setIsSaved(ids.includes(court.id)));
  }, [court.id]);

  const handleDirections = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const { latitude, longitude, name } = court;
    if (
      typeof latitude === 'number' &&
      typeof longitude === 'number' &&
      Number.isFinite(latitude) &&
      Number.isFinite(longitude)
    ) {
      openDirections(latitude, longitude, name);
    }

    // Close swipeable after action
    swipeableRef.current?.close();
  };

  const handleSave = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleSavedCourt(court.id);

    // Success haptic
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Close swipeable after action
    swipeableRef.current?.close();
  };

  const renderLeftActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const opacity = dragX.interpolate({
      inputRange: [0, 100],
      outputRange: [0.5, 1],
      extrapolate: 'clamp',
    });

    return (
      <Pressable
        onPress={handleDirections}
        style={{ justifyContent: 'center', alignItems: 'center' }}
        className="px-8 bg-gray-300 dark:bg-black/40"
      >
        <Animated.View style={{ opacity, alignItems: 'center' }}>
          <Ionicons name="navigate-outline" size={32} color="#ffffff" />
          <Text className="mt-2 text-xs font-semibold text-gray-900 dark:text-white">
            Directions
          </Text>
        </Animated.View>
      </Pressable>
    );
  };

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const opacity = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0.5],
      extrapolate: 'clamp',
    });

    return (
      <Pressable
        onPress={handleSave}
        style={{ justifyContent: 'center', alignItems: 'center' }}
        className="px-8 bg-gray-300 dark:bg-black/40"
      >
        <Animated.View style={{ opacity, alignItems: 'center' }}>
          <Ionicons
            name={isSaved ? "bookmark" : "bookmark-outline"}
            size={32}
            color="#ffffff"
          />
          <Text className="mt-2 text-xs font-semibold text-gray-900 dark:text-white">
            {isSaved ? 'Saved' : 'Save'}
          </Text>
        </Animated.View>
      </Pressable>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
      leftThreshold={80}
      rightThreshold={80}
      overshootLeft={false}
      overshootRight={false}
    >
      {isHot ? (
        <HotCourtCard
          court={court}
          checkInsCount={checkInsCount}
          index={index}
          weather={weather}
        />
      ) : (
        <CourtCard court={court} index={index} weather={weather} />
      )}
    </Swipeable>
  );
}
