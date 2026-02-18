import React, { useState, useEffect } from 'react';
import { View, ScrollView, Pressable, Image, ActivityIndicator, Alert, StyleSheet, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text } from './ui/Text';
import { getCourtPhotos, deleteCourtPhoto, setPrimaryPhoto, CourtPhoto } from '../services/photos';
import { getAnonymousUserId } from '../services/checkins';

interface PhotoGalleryProps {
  courtId: string;
  onPhotoDeleted?: () => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const PHOTO_SIZE = (SCREEN_WIDTH - 48 - 16) / 3; // Account for padding and gaps

export function PhotoGallery({ courtId, onPhotoDeleted }: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<CourtPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    loadPhotos();
    loadUserId();
  }, [courtId]);

  const loadUserId = async () => {
    const userId = await getAnonymousUserId();
    setCurrentUserId(userId);
  };

  const loadPhotos = async () => {
    setLoading(true);
    const courtPhotos = await getCourtPhotos(courtId);
    setPhotos(courtPhotos);
    setLoading(false);
  };

  const handlePhotoPress = (photo: CourtPhoto) => {
    const isOwnPhoto = photo.user_id === currentUserId;

    const options = [
      {
        text: 'View Full Size',
        onPress: () => {
          // TODO: Open full-screen image viewer
          Alert.alert('View Photo', 'Full-screen viewer coming soon!');
        },
      },
    ];

    if (isOwnPhoto) {
      options.push({
        text: 'Delete Photo',
        style: 'destructive' as const,
        onPress: () => handleDeletePhoto(photo.id),
      });
    }

    if (!photo.is_primary) {
      options.push({
        text: 'Set as Primary',
        onPress: () => handleSetPrimary(photo.id),
      });
    }

    options.push({
      text: 'Cancel',
      style: 'cancel' as const,
    });

    Alert.alert(
      'Photo Options',
      isOwnPhoto ? 'This is your photo' : 'Photo uploaded by another user',
      options,
      { cancelable: true }
    );
  };

  const handleDeletePhoto = async (photoId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteCourtPhoto(photoId);
            if (success) {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              await loadPhotos();
              onPhotoDeleted?.();
            } else {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('Error', 'Failed to delete photo');
            }
          },
        },
      ]
    );
  };

  const handleSetPrimary = async (photoId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const success = await setPrimaryPhoto(photoId);
    if (success) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await loadPhotos();
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to set primary photo');
    }
  };

  if (loading) {
    return (
      <View className="items-center justify-center py-8">
        <ActivityIndicator size="small" color="#960000" />
      </View>
    );
  }

  if (photos.length === 0) {
    return null; // Don't show anything if no photos
  }

  return (
    <View className="mb-6">
      <Text className="mb-3 px-6 text-lg font-bold text-gray-900 dark:text-white">
        Photos ({photos.length})
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}
      >
        {photos.map((photo) => (
          <Pressable
            key={photo.id}
            onPress={() => handlePhotoPress(photo)}
            onLongPress={() => handlePhotoPress(photo)}
            style={({ pressed }) => [
              styles.photoContainer,
              pressed && styles.pressed,
            ]}
          >
            <Image
              source={{ uri: photo.url }}
              style={{
                width: PHOTO_SIZE,
                height: PHOTO_SIZE,
                borderRadius: 12,
              }}
              resizeMode="cover"
            />
            {photo.is_primary && (
              <View className="absolute top-2 right-2 rounded-full bg-brand px-2 py-1">
                <Text className="text-xs font-semibold text-white">★</Text>
              </View>
            )}
            {photo.user_id === currentUserId && (
              <View className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-1">
                <Text className="text-xs text-white">Your photo</Text>
              </View>
            )}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  photoContainer: {
    transform: [{ scale: 1 }],
  },
  pressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.8,
  },
});
