import React, { useState } from 'react';
import { View, Modal, Pressable, ScrollView, Switch, useColorScheme } from 'react-native';
import Slider from '@react-native-community/slider';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { Text } from './ui/Text';
import { CourtFilters, CourtType, DEFAULT_FILTERS, hasActiveFilters } from '../services/courtFilters';

interface FilterModalProps {
  visible: boolean;
  filters: CourtFilters;
  onClose: () => void;
  onApply: (filters: CourtFilters) => void;
}

export function FilterModal({ visible, filters, onClose, onApply }: FilterModalProps) {
  const [localFilters, setLocalFilters] = useState<CourtFilters>(filters);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleCourtTypeChange = (type: CourtType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLocalFilters({ ...localFilters, courtType: type });
  };

  const handleDistanceChange = (value: number) => {
    setLocalFilters({ ...localFilters, maxDistanceMiles: value });
  };

  const handleToggle = (key: keyof CourtFilters) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLocalFilters({ ...localFilters, [key]: !localFilters[key] });
  };

  const handleApply = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onApply(localFilters);
    onClose();
  };

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLocalFilters(DEFAULT_FILTERS);
  };

  const isActive = hasActiveFilters(localFilters);

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="pageSheet">
      <View className="flex-1 bg-black/50">
        <View className="mt-auto rounded-t-3xl bg-white dark:bg-black" style={{ maxHeight: '85%', display: 'flex' }}>
          {/* Header */}
          <View className="flex-row items-center justify-between border-b border-gray-200 dark:border-white/10 px-6 py-4">
            <Text className="text-xl font-bold text-gray-900 dark:text-white">Filters</Text>
            <Pressable
              onPress={onClose}
              className="h-11 w-11 items-center justify-center"
              accessibilityLabel="Close filters"
              accessibilityRole="button"
            >
              <Ionicons name="close" size={24} color={isDark ? "#fff" : "#000"} />
            </Pressable>
          </View>

          <ScrollView className="px-6 py-4" contentContainerStyle={{ flexGrow: 1 }}>
            {/* Court Type */}
            <View className="mb-6">
              <Text className="mb-3 text-sm font-semibold text-gray-500 dark:text-white/60">COURT TYPE</Text>
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => handleCourtTypeChange('both')}
                  className={`flex-1 rounded-xl border py-3 ${
                    localFilters.courtType === 'both'
                      ? 'border-brand bg-brand/20'
                      : 'border-gray-300 dark:border-white/20 bg-gray-100 dark:bg-white/5'
                  }`}
                  accessibilityLabel="Show both indoor and outdoor courts"
                  accessibilityRole="button"
                  accessibilityState={{ selected: localFilters.courtType === 'both' }}
                >
                  <Text
                    className={`text-center font-semibold ${
                      localFilters.courtType === 'both' ? 'text-brand dark:text-brand-light' : 'text-gray-600 dark:text-white/60'
                    }`}
                  >
                    Both
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => handleCourtTypeChange('indoor')}
                  className={`flex-1 rounded-xl border py-3 ${
                    localFilters.courtType === 'indoor'
                      ? 'border-secondary bg-secondary/20'
                      : 'border-gray-300 dark:border-white/20 bg-gray-100 dark:bg-white/5'
                  }`}
                  accessibilityLabel="Filter for indoor courts only"
                  accessibilityRole="button"
                  accessibilityState={{ selected: localFilters.courtType === 'indoor' }}
                >
                  <Text
                    className={`text-center font-semibold ${
                      localFilters.courtType === 'indoor' ? 'text-secondary-light' : 'text-gray-600 dark:text-white/60'
                    }`}
                  >
                    🏠 Indoor
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => handleCourtTypeChange('outdoor')}
                  className={`flex-1 rounded-xl border py-3 ${
                    localFilters.courtType === 'outdoor'
                      ? 'border-court bg-court/20'
                      : 'border-gray-300 dark:border-white/20 bg-gray-100 dark:bg-white/5'
                  }`}
                  accessibilityLabel="Filter for outdoor courts only"
                  accessibilityRole="button"
                  accessibilityState={{ selected: localFilters.courtType === 'outdoor' }}
                >
                  <Text
                    className={`text-center font-semibold ${
                      localFilters.courtType === 'outdoor' ? 'text-court-light' : 'text-gray-600 dark:text-white/60'
                    }`}
                  >
                    🌤️ Outdoor
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Max Distance */}
            <View className="mb-6">
              <View className="mb-3 flex-row items-center justify-between">
                <Text className="text-sm font-semibold text-gray-500 dark:text-white/60">MAX DISTANCE</Text>
                <Text className="text-sm font-bold text-gray-900 dark:text-white">
                  {localFilters.maxDistanceMiles} miles
                </Text>
              </View>
              <Slider
                value={localFilters.maxDistanceMiles}
                onValueChange={handleDistanceChange}
                minimumValue={1}
                maximumValue={100}
                step={5}
                minimumTrackTintColor="#960000"
                maximumTrackTintColor={isDark ? "#ffffff40" : "#00000020"}
                thumbTintColor="#960000"
                accessibilityLabel={`Maximum distance: ${localFilters.maxDistanceMiles} miles`}
                accessibilityRole="adjustable"
              />
            </View>

            {/* Amenities */}
            <View className="mb-6">
              <Text className="mb-3 text-sm font-semibold text-gray-500 dark:text-white/60">AMENITIES</Text>

              {/* Has Lighting */}
              <View className="mb-3 flex-row items-center justify-between rounded-xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-gray-900 px-4 py-3">
                <View className="flex-row items-center">
                  <Text className="mr-3 text-xl">💡</Text>
                  <Text className="text-base font-medium text-gray-900 dark:text-white">Has Lighting</Text>
                </View>
                <Switch
                  value={localFilters.mustHaveLighting}
                  onValueChange={() => handleToggle('mustHaveLighting')}
                  trackColor={{ false: '#3e3e3e', true: '#960000' }}
                  thumbColor="#ffffff"
                  accessibilityLabel="Filter for courts with lighting"
                  accessibilityRole="switch"
                />
              </View>

              {/* Multiple Hoops */}
              <View className="mb-3 flex-row items-center justify-between rounded-xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-gray-900 px-4 py-3">
                <View className="flex-row items-center">
                  <Text className="mr-3 text-xl">🏀</Text>
                  <Text className="text-base font-medium text-gray-900 dark:text-white">Multiple Hoops (2+)</Text>
                </View>
                <Switch
                  value={localFilters.multipleHoops}
                  onValueChange={() => handleToggle('multipleHoops')}
                  trackColor={{ false: '#3e3e3e', true: '#960000' }}
                  thumbColor="#ffffff"
                  accessibilityLabel="Filter for courts with multiple hoops"
                  accessibilityRole="switch"
                />
              </View>

              {/* Full Court Only */}
              <View className="mb-3 flex-row items-center justify-between rounded-xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-gray-900 px-4 py-3">
                <View className="flex-row items-center">
                  <Text className="mr-3 text-xl">⛹️</Text>
                  <Text className="text-base font-medium text-gray-900 dark:text-white">Full Court Only</Text>
                </View>
                <Switch
                  value={localFilters.fullCourtOnly}
                  onValueChange={() => handleToggle('fullCourtOnly')}
                  trackColor={{ false: '#3e3e3e', true: '#960000' }}
                  thumbColor="#ffffff"
                  accessibilityLabel="Filter for full courts only"
                  accessibilityRole="switch"
                />
              </View>

              {/* Open 24 Hours */}
              <View className="mb-3 flex-row items-center justify-between rounded-xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-gray-900 px-4 py-3">
                <View className="flex-row items-center">
                  <Text className="mr-3 text-xl">⏰</Text>
                  <Text className="text-base font-medium text-gray-900 dark:text-white">Open 24 Hours</Text>
                </View>
                <Switch
                  value={localFilters.open24Hours}
                  onValueChange={() => handleToggle('open24Hours')}
                  trackColor={{ false: '#3e3e3e', true: '#960000' }}
                  thumbColor="#ffffff"
                  accessibilityLabel="Filter for courts open 24 hours"
                  accessibilityRole="switch"
                />
              </View>

              {/* Free to Play */}
              <View className="mb-3 flex-row items-center justify-between rounded-xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-gray-900 px-4 py-3">
                <View className="flex-row items-center">
                  <Ionicons name="cash-outline" size={20} color={isDark ? '#fff' : '#374151'} style={{ marginRight: 12 }} />
                  <Text className="text-base font-medium text-gray-900 dark:text-white">Free to Play</Text>
                </View>
                <Switch
                  value={localFilters.mustBeFree}
                  onValueChange={() => handleToggle('mustBeFree')}
                  trackColor={{ false: '#3e3e3e', true: '#960000' }}
                  thumbColor="#ffffff"
                  accessibilityLabel="Filter for free courts"
                  accessibilityRole="switch"
                />
              </View>

              {/* Public Access */}
              <View className="flex-row items-center justify-between rounded-xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-gray-900 px-4 py-3">
                <View className="flex-row items-center">
                  <Ionicons name="people-outline" size={20} color={isDark ? '#fff' : '#374151'} style={{ marginRight: 12 }} />
                  <Text className="text-base font-medium text-gray-900 dark:text-white">Public Access</Text>
                </View>
                <Switch
                  value={localFilters.mustBePublic}
                  onValueChange={() => handleToggle('mustBePublic')}
                  trackColor={{ false: '#3e3e3e', true: '#960000' }}
                  thumbColor="#ffffff"
                  accessibilityLabel="Filter for publicly accessible courts"
                  accessibilityRole="switch"
                />
              </View>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View className="border-t border-gray-200 dark:border-white/10 px-6 py-4">
            <View className="flex-row gap-3">
              {isActive && (
                <Pressable
                  onPress={handleReset}
                  className="flex-1 items-center justify-center rounded-xl border border-gray-300 dark:border-white/20 bg-gray-200 dark:bg-white/10 py-3"
                  accessibilityLabel="Clear all filters"
                  accessibilityRole="button"
                >
                  <Text className="font-semibold text-gray-900 dark:text-white">Clear All</Text>
                </Pressable>
              )}
              <Pressable
                onPress={handleApply}
                className={`items-center justify-center rounded-xl bg-brand py-3 ${
                  isActive ? 'flex-1' : 'flex-1'
                }`}
                accessibilityLabel={isActive ? 'Apply filters' : 'Close filters'}
                accessibilityRole="button"
              >
                <Text className="font-bold text-white">
                  {isActive ? 'Apply Filters' : 'Close'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
