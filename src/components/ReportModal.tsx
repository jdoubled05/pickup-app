import React, { useState, useEffect } from 'react';
import { View, Modal, Pressable, ScrollView, useColorScheme, ActivityIndicator } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { Text } from './ui/Text';
import { Court } from '../services/courts';
import { submitCourtReports, CourtReport } from '../services/courtReports';

interface ReportModalProps {
  visible: boolean;
  court: Court;
  onClose: () => void;
}

type HoopCount = '1' | '2' | '4' | '6';

interface Selections {
  indoor: boolean | null;
  lighting: boolean | null;
  is_free: boolean | null;
  is_public: boolean | null;
  num_hoops: HoopCount | null;
}

function initialSelections(court: Court): Selections {
  return {
    indoor: court.indoor ?? null,
    lighting: court.lighting ?? null,
    is_free: court.is_free ?? null,
    is_public: court.is_public ?? null,
    num_hoops: hoopCountToOption(court.num_hoops),
  };
}

function hoopCountToOption(n: number | null | undefined): HoopCount | null {
  if (n == null) return null;
  if (n <= 1) return '1';
  if (n === 2) return '2';
  if (n <= 4) return '4';
  return '6';
}

function buildReports(original: Selections, current: Selections, courtId: string): CourtReport[] {
  const reports: CourtReport[] = [];

  if (current.indoor !== null && current.indoor !== original.indoor) {
    reports.push({ courtId, fieldName: 'indoor', correctValue: String(current.indoor) });
  }
  if (current.lighting !== null && current.lighting !== original.lighting) {
    reports.push({ courtId, fieldName: 'lighting', correctValue: String(current.lighting) });
  }
  if (current.is_free !== null && current.is_free !== original.is_free) {
    reports.push({ courtId, fieldName: 'is_free', correctValue: String(current.is_free) });
  }
  if (current.is_public !== null && current.is_public !== original.is_public) {
    reports.push({ courtId, fieldName: 'is_public', correctValue: String(current.is_public) });
  }
  if (current.num_hoops !== null && current.num_hoops !== original.num_hoops) {
    reports.push({ courtId, fieldName: 'num_hoops', correctValue: current.num_hoops });
  }

  return reports;
}

interface SegmentButtonProps<T> {
  options: { label: string; value: T }[];
  selected: T | null;
  onSelect: (value: T) => void;
}

function SegmentButton<T>({ options, selected, onSelect }: SegmentButtonProps<T>) {
  return (
    <View className="flex-row gap-2 flex-wrap">
      {options.map((opt) => {
        const isSelected = selected === opt.value;
        return (
          <Pressable
            key={String(opt.value)}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSelect(opt.value);
            }}
            className={`rounded-lg border px-3 py-2 ${
              isSelected
                ? 'border-brand bg-brand/20'
                : 'border-gray-300 dark:border-white/20 bg-gray-100 dark:bg-white/5'
            }`}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
          >
            <Text
              className={`text-sm font-semibold ${
                isSelected ? 'text-brand dark:text-brand-light' : 'text-gray-600 dark:text-white/60'
              }`}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ReportModal({ visible, court, onClose }: ReportModalProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const original = initialSelections(court);
  const [selections, setSelections] = useState<Selections>(original);
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setSelections(initialSelections(court));
      setValidationError(null);
      setSuccess(false);
    }
  }, [visible, court]);

  // Auto-close after success
  useEffect(() => {
    if (success) {
      const timer = setTimeout(onClose, 1500);
      return () => clearTimeout(timer);
    }
  }, [success, onClose]);

  const update = <K extends keyof Selections>(key: K, value: Selections[K]) => {
    setValidationError(null);
    setSelections((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    const reports = buildReports(original, selections, court.id);
    if (reports.length === 0) {
      setValidationError('No changes selected. Update at least one field.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSubmitting(true);
    try {
      await submitCourtReports(reports);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccess(true);
    } catch {
      setValidationError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="pageSheet">
      <View className="flex-1 bg-black/50">
        <View className="mt-auto rounded-t-3xl bg-white dark:bg-black" style={{ maxHeight: '85%' }}>
          {/* Header */}
          <View className="flex-row items-center justify-between border-b border-gray-200 dark:border-white/10 px-6 py-4">
            <Text className="text-xl font-bold text-gray-900 dark:text-white">Report an Issue</Text>
            <Pressable
              onPress={onClose}
              className="h-11 w-11 items-center justify-center"
              accessibilityLabel="Close report"
              accessibilityRole="button"
            >
              <Ionicons name="close" size={24} color={isDark ? '#fff' : '#000'} />
            </Pressable>
          </View>

          <ScrollView className="px-6 py-4" contentContainerStyle={{ flexGrow: 1 }}>
            {success ? (
              <View className="flex-1 items-center justify-center py-12">
                <Ionicons name="checkmark-circle" size={48} color="#22c55e" />
                <Text className="mt-4 text-xl font-bold text-gray-900 dark:text-white">
                  Thanks for the report!
                </Text>
                <Text className="mt-2 text-center text-gray-500 dark:text-white/60">
                  We'll review your correction and update the court info.
                </Text>
              </View>
            ) : (
              <>
                <Text className="mb-5 text-sm text-gray-500 dark:text-white/60">
                  Select the correct values for any fields that look wrong.
                </Text>

                {/* Court Type */}
                <View className="mb-5">
                  <Text className="mb-2 text-sm font-semibold text-gray-500 dark:text-white/60">COURT TYPE</Text>
                  <SegmentButton
                    options={[
                      { label: '🏠 Indoor', value: true },
                      { label: '🌤️ Outdoor', value: false },
                    ]}
                    selected={selections.indoor}
                    onSelect={(v) => update('indoor', v)}
                  />
                </View>

                {/* Lighting */}
                <View className="mb-5">
                  <Text className="mb-2 text-sm font-semibold text-gray-500 dark:text-white/60">LIGHTING</Text>
                  <SegmentButton
                    options={[
                      { label: '💡 Has Lighting', value: true },
                      { label: '🌙 No Lighting', value: false },
                    ]}
                    selected={selections.lighting}
                    onSelect={(v) => update('lighting', v)}
                  />
                </View>

                {/* Free to Play */}
                <View className="mb-5">
                  <Text className="mb-2 text-sm font-semibold text-gray-500 dark:text-white/60">FREE TO PLAY</Text>
                  <SegmentButton
                    options={[
                      { label: 'Free', value: true },
                      { label: 'Paid', value: false },
                    ]}
                    selected={selections.is_free}
                    onSelect={(v) => update('is_free', v)}
                  />
                </View>

                {/* Public Access */}
                <View className="mb-5">
                  <Text className="mb-2 text-sm font-semibold text-gray-500 dark:text-white/60">ACCESS</Text>
                  <SegmentButton
                    options={[
                      { label: 'Public', value: true },
                      { label: 'Private', value: false },
                    ]}
                    selected={selections.is_public}
                    onSelect={(v) => update('is_public', v)}
                  />
                </View>

                {/* Number of Hoops */}
                <View className="mb-5">
                  <Text className="mb-2 text-sm font-semibold text-gray-500 dark:text-white/60">NUMBER OF HOOPS</Text>
                  <SegmentButton<HoopCount>
                    options={[
                      { label: '1', value: '1' },
                      { label: '2', value: '2' },
                      { label: '4', value: '4' },
                      { label: '6+', value: '6' },
                    ]}
                    selected={selections.num_hoops}
                    onSelect={(v) => update('num_hoops', v)}
                  />
                </View>

                {validationError && (
                  <Text className="mb-3 text-sm text-red-500">{validationError}</Text>
                )}
              </>
            )}
          </ScrollView>

          {/* Footer */}
          {!success && (
            <View className="border-t border-gray-200 dark:border-white/10 px-6 py-4">
              <Pressable
                onPress={handleSubmit}
                disabled={submitting}
                className="items-center justify-center rounded-xl bg-brand py-3"
                accessibilityLabel="Submit report"
                accessibilityRole="button"
                accessibilityState={{ disabled: submitting }}
              >
                {submitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="font-bold text-white">Submit Report</Text>
                )}
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
