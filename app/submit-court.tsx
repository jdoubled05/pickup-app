import React, { useState, useEffect } from 'react';
import { View, ScrollView, Pressable, Switch, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { Text } from '@/src/components/ui/Text';
import { Button } from '@/src/components/ui/Button';
import { supabase } from '@/src/services/supabase';
import { getAnonymousUserId } from '@/src/services/checkins';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function SubmitCourtScreen() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    latitude: null as number | null,
    longitude: null as number | null,
    indoor: false,
    numHoops: '',
    lighting: false,
    surfaceType: '',
    notes: '',
  });

  const handleGetCurrentLocation = async () => {
    setGettingLocation(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Needed',
          'Location permission is required to auto-fill coordinates. You can also enter the address manually.'
        );
        setGettingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setFormData(prev => ({
        ...prev,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      }));

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Location captured! Make sure you\'re standing at the court.');
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get location. Please try again.');
    } finally {
      setGettingLocation(false);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      Alert.alert('Required Field', 'Please enter a court name.');
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      Alert.alert(
        'Location Required',
        'Please use "Get Current Location" button while standing at the court, or enter coordinates manually.'
      );
      return;
    }

    setSubmitting(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const userId = await getAnonymousUserId();

      const { error } = await supabase.from('pending_courts').insert({
        name: formData.name.trim(),
        address: formData.address.trim() || null,
        city: formData.city.trim() || null,
        state: formData.state.trim() || null,
        postal_code: formData.postalCode.trim() || null,
        latitude: formData.latitude,
        longitude: formData.longitude,
        indoor: formData.indoor,
        num_hoops: formData.numHoops ? parseInt(formData.numHoops, 10) : null,
        lighting: formData.lighting,
        surface_type: formData.surfaceType.trim() || null,
        notes: formData.notes.trim() || null,
        submitted_by: userId,
        status: 'pending',
      });

      if (error) {
        console.error('Submission error:', error);
        throw error;
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Alert.alert(
        'Thank You! 🏀',
        'Your court submission has been received. We\'ll review and add it within 24 hours. You\'ll get 1 month of free premium when approved!',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Failed to submit court:', error);
      Alert.alert(
        'Submission Failed',
        'Something went wrong. Please try again or contact support if the issue persists.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white dark:bg-black">
      <View className="px-6 py-6">
        {/* Header */}
        <View className="mb-6 flex-row items-center">
          <Pressable
            onPress={() => router.back()}
            className="mr-4 h-11 w-11 items-center justify-center rounded-full bg-gray-200 dark:bg-white/10"
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Text className="text-xl text-gray-900 dark:text-white">←</Text>
          </Pressable>
          <View>
            <Text className="text-2xl font-bold text-gray-900 dark:text-white">
              Submit a Court
            </Text>
            <Text className="mt-1 text-sm text-gray-500 dark:text-white/60">
              Help the community discover new courts
            </Text>
          </View>
        </View>

        {/* Location Section */}
        <View className="mb-6">
          <Text className="mb-3 text-sm font-semibold text-gray-500 dark:text-white/60">
            LOCATION *
          </Text>

          <Pressable
            onPress={handleGetCurrentLocation}
            disabled={gettingLocation}
            className={`mb-4 rounded-xl border border-brand bg-brand/10 py-4 ${
              gettingLocation ? 'opacity-50' : ''
            }`}
            accessibilityLabel="Get current location"
            accessibilityRole="button"
          >
            <View className="flex-row items-center justify-center gap-2">
              <Ionicons name="location" size={16} color="#960000" />
              <Text className="font-bold text-brand dark:text-brand-light">
                {gettingLocation ? 'Getting Location...' : 'Get Current Location'}
              </Text>
            </View>
            <Text className="mt-1 text-center text-xs text-brand/80 dark:text-brand-light/70">
              Stand at the court and tap this button
            </Text>
          </Pressable>

          {formData.latitude && formData.longitude && (
            <View className="mb-4 rounded-xl bg-status-active/10 p-3">
              <Text className="text-xs text-status-active">
                ✓ Location captured: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
              </Text>
            </View>
          )}
        </View>

        {/* Court Details */}
        <View className="mb-6">
          <Text className="mb-3 text-sm font-semibold text-gray-500 dark:text-white/60">
            COURT DETAILS *
          </Text>

          <TextInput
            className="mb-3 rounded-xl border border-gray-200 dark:border-white/20 bg-gray-100 dark:bg-white/5 px-4 py-3 text-gray-900 dark:text-white"
            placeholder="Court Name (e.g., Mission Park Courts)"
            placeholderTextColor="#999"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            accessibilityLabel="Court name"
          />

          <TextInput
            className="mb-3 rounded-xl border border-gray-200 dark:border-white/20 bg-gray-100 dark:bg-white/5 px-4 py-3 text-gray-900 dark:text-white"
            placeholder="Address (optional)"
            placeholderTextColor="#999"
            value={formData.address}
            onChangeText={(text) => setFormData({ ...formData, address: text })}
            accessibilityLabel="Address"
          />

          <View className="mb-3 flex-row gap-3">
            <TextInput
              className="flex-1 rounded-xl border border-gray-200 dark:border-white/20 bg-gray-100 dark:bg-white/5 px-4 py-3 text-gray-900 dark:text-white"
              placeholder="City"
              placeholderTextColor="#999"
              value={formData.city}
              onChangeText={(text) => setFormData({ ...formData, city: text })}
              accessibilityLabel="City"
            />
            <TextInput
              className="w-20 rounded-xl border border-gray-200 dark:border-white/20 bg-gray-100 dark:bg-white/5 px-4 py-3 text-gray-900 dark:text-white"
              placeholder="ST"
              placeholderTextColor="#999"
              value={formData.state}
              onChangeText={(text) => setFormData({ ...formData, state: text.toUpperCase() })}
              maxLength={2}
              accessibilityLabel="State"
            />
          </View>
        </View>

        {/* Court Attributes */}
        <View className="mb-6">
          <Text className="mb-3 text-sm font-semibold text-gray-500 dark:text-white/60">
            COURT TYPE
          </Text>

          <View className="mb-4 flex-row items-center justify-between rounded-xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-gray-900 px-4 py-3">
            <Text className="text-base font-medium text-gray-900 dark:text-white">
              Indoor Court
            </Text>
            <Switch
              value={formData.indoor}
              onValueChange={(value) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFormData({ ...formData, indoor: value });
              }}
              trackColor={{ false: '#3e3e3e', true: '#960000' }}
              thumbColor="#ffffff"
              accessibilityLabel="Indoor court toggle"
              accessibilityRole="switch"
            />
          </View>

          <View className="mb-4 flex-row items-center justify-between rounded-xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-gray-900 px-4 py-3">
            <Text className="text-base font-medium text-gray-900 dark:text-white">
              Has Lighting
            </Text>
            <Switch
              value={formData.lighting}
              onValueChange={(value) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFormData({ ...formData, lighting: value });
              }}
              trackColor={{ false: '#3e3e3e', true: '#960000' }}
              thumbColor="#ffffff"
              accessibilityLabel="Lighting toggle"
              accessibilityRole="switch"
            />
          </View>

          <TextInput
            className="mb-3 rounded-xl border border-gray-200 dark:border-white/20 bg-gray-100 dark:bg-white/5 px-4 py-3 text-gray-900 dark:text-white"
            placeholder="Number of Hoops (optional)"
            placeholderTextColor="#999"
            value={formData.numHoops}
            onChangeText={(text) => setFormData({ ...formData, numHoops: text.replace(/[^0-9]/g, '') })}
            keyboardType="number-pad"
            maxLength={2}
            accessibilityLabel="Number of hoops"
          />

          <TextInput
            className="mb-3 rounded-xl border border-gray-200 dark:border-white/20 bg-gray-100 dark:bg-white/5 px-4 py-3 text-gray-900 dark:text-white"
            placeholder="Surface Type (e.g., asphalt, concrete)"
            placeholderTextColor="#999"
            value={formData.surfaceType}
            onChangeText={(text) => setFormData({ ...formData, surfaceType: text })}
            accessibilityLabel="Surface type"
          />

          <TextInput
            className="rounded-xl border border-gray-200 dark:border-white/20 bg-gray-100 dark:bg-white/5 px-4 py-3 text-gray-900 dark:text-white"
            placeholder="Additional Notes (optional)"
            placeholderTextColor="#999"
            value={formData.notes}
            onChangeText={(text) => setFormData({ ...formData, notes: text })}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            accessibilityLabel="Additional notes"
          />
        </View>

        {/* Submit Button */}
        <Button
          title={submitting ? 'Submitting...' : 'Submit Court'}
          onPress={handleSubmit}
          disabled={submitting}
          accessibilityLabel="Submit court for review"
          accessibilityRole="button"
        />

        <Text className="mt-4 text-center text-xs text-gray-500 dark:text-white/50">
          By submitting, you agree that the information is accurate.
          {'\n'}
          Submissions are reviewed within 24 hours.
        </Text>
      </View>
    </ScrollView>
  );
}
