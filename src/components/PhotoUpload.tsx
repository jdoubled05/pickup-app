import React, { useState } from 'react';
import { View, Pressable, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { Text } from './ui/Text';
import {
  pickImage,
  takePhoto,
  uploadCourtPhoto,
  CourtPhoto,
  UploadProgress,
} from '../services/photos';

interface PhotoUploadProps {
  courtId: string;
  onUploadSuccess?: (photo: CourtPhoto) => void;
  onUploadError?: (error: string) => void;
}

export function PhotoUpload({ courtId, onUploadSuccess, onUploadError }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handlePickImage = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const image = await pickImage();
    if (!image) {
      return;
    }

    await uploadImage(image);
  };

  const handleTakePhoto = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const photo = await takePhoto();
    if (!photo) {
      return;
    }

    await uploadImage(photo);
  };

  const uploadImage = async (imageAsset: any) => {
    setUploading(true);
    setUploadProgress(0);

    try {
      const photo = await uploadCourtPhoto(
        courtId,
        imageAsset,
        (progress: UploadProgress) => {
          setUploadProgress(progress.percentage);
        }
      );

      if (photo) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onUploadSuccess?.(photo);
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        onUploadError?.('Failed to upload photo');
        Alert.alert('Upload Failed', 'Could not upload photo. Please try again.');
      }
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      onUploadError?.('Upload error');
      Alert.alert('Upload Error', 'An error occurred while uploading the photo.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const showPhotoOptions = () => {
    Alert.alert(
      'Add Photo',
      'Choose a photo source',
      [
        {
          text: 'Take Photo',
          onPress: handleTakePhoto,
        },
        {
          text: 'Choose from Library',
          onPress: handlePickImage,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  if (uploading) {
    return (
      <View className="items-center rounded-2xl bg-gray-100 dark:bg-gray-900 p-6 border border-white/10">
        <ActivityIndicator size="large" color="#960000" />
        <Text className="mt-3 text-sm text-gray-600 dark:text-white/60">
          Uploading photo... {uploadProgress > 0 ? `${uploadProgress}%` : ''}
        </Text>
      </View>
    );
  }

  return (
    <Pressable
      onPress={showPhotoOptions}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
      className="items-center rounded-2xl bg-brand p-6 border border-brand"
      accessibilityLabel="Add photo"
      accessibilityRole="button"
      accessibilityHint="Double tap to add a photo of this court"
    >
      <Ionicons name="camera" size={48} color="#ffffff" />
      <Text className="mt-3 text-lg font-bold text-white">Add Photo</Text>
      <Text className="mt-1 text-sm text-white/80">Help others find this court</Text>
    </Pressable>
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
