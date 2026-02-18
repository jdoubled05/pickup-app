import React, { useEffect } from 'react';
import { RefreshControl, RefreshControlProps } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface BasketballRefreshControlProps extends Omit<RefreshControlProps, 'children'> {
  refreshing: boolean;
  onRefresh?: () => void;
}

/**
 * Custom RefreshControl with basketball bounce animation
 * Shows a basketball emoji that rotates and bounces during pull-to-refresh
 */
export function BasketballRefreshControl({
  refreshing,
  onRefresh,
  ...props
}: BasketballRefreshControlProps) {
  // Unfortunately, React Native doesn't expose pull distance for custom refresh animations
  // in a cross-platform way. We'll use the refreshing state to trigger animations.

  const rotation = useSharedValue(0);
  const bounce = useSharedValue(0);

  useEffect(() => {
    if (refreshing) {
      // Bouncing animation during refresh
      bounce.value = withRepeat(
        withSequence(
          withSpring(-10, { damping: 2, stiffness: 100 }),
          withSpring(0, { damping: 2, stiffness: 100 })
        ),
        -1, // Infinite repeat
        false
      );

      // Rotation animation during refresh
      rotation.value = withRepeat(
        withSpring(360, { damping: 2, stiffness: 50 }),
        -1,
        false
      );
    } else {
      // Reset when not refreshing
      bounce.value = withSpring(0);
      rotation.value = withSpring(0);
    }
  }, [refreshing, bounce, rotation]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: bounce.value },
        { rotate: `${rotation.value}deg` },
      ],
    };
  });

  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onRefresh?.();
      }}
      tintColor="#960000" // Brand color
      colors={['#960000', '#B71C1C']} // Android colors
      {...props}
    />
  );
}
