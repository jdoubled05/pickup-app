import React, { useState } from "react";
import {
  View,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  ActionSheetIOS,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import { Text } from "@/src/components/ui/Text";
import { Avatar } from "@/src/components/Avatar";
import { useAuth } from "@/src/context/AuthContext";
import { updateProfile } from "@/src/services/auth";
import { uploadAvatar, deleteAvatar } from "@/src/services/storage";
import {
  type PlayStyle,
  type SkillLevel,
  PLAY_STYLE_LABELS,
  SKILL_LEVEL_LABELS,
} from "@/src/types/user";

const USERNAME_COOLDOWN_MS = 365 * 24 * 60 * 60 * 1000; // 1 year

function getNextUsernameChangeDate(usernameUpdatedAt: string): Date {
  return new Date(new Date(usernameUpdatedAt).getTime() + USERNAME_COOLDOWN_MS);
}

function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

const PLAY_STYLES: PlayStyle[] = [
  "ball_handler",
  "shooter",
  "facilitator",
  "big",
  "slasher",
  "defender",
];

const SKILL_LEVELS: SkillLevel[] = ["casual", "intermediate", "competitive"];

export default function SetupProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, profile, refreshProfile } = useAuth();

  const [username, setUsername] = useState(profile?.username ?? "");
  const [playStyles, setPlayStyles] = useState<PlayStyle[]>(profile?.play_style ?? []);
  const [skillLevel, setSkillLevel] = useState<SkillLevel | null>(profile?.skill_level ?? null);
  const [avatarUri, setAvatarUri] = useState<string | null>(profile?.avatar_url ?? null);
  const [avatarChanged, setAvatarChanged] = useState(false);
  const [profileSynced, setProfileSynced] = useState(!!profile);

  // Sync state from profile once it loads (in case it wasn't ready on first render)
  React.useEffect(() => {
    if (profile && !profileSynced) {
      setUsername(profile.username ?? "");
      setPlayStyles(profile.play_style ?? []);
      setSkillLevel(profile.skill_level ?? null);
      setAvatarUri(profile.avatar_url ?? null);
      setProfileSynced(true);
    }
  }, [profile, profileSynced]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const isEditing = !!profile?.username;
  const changeCount = profile?.username_change_count ?? 0;

  // Lock after the free change (count >= 2) until 1 year has passed
  const nextChangeDate =
    changeCount >= 2 && profile?.username_updated_at
      ? getNextUsernameChangeDate(profile.username_updated_at)
      : null;
  const usernameLocked = nextChangeDate !== null && nextChangeDate > new Date();

  // Only show the username policy notice when the username is actually being changed
  const willChangeUsername =
    !usernameLocked &&
    username.trim() !== (profile?.username ?? "") &&
    username.trim().length >= 2;

  const usernameNotice: string | null =
    !willChangeUsername
      ? null
      : changeCount === 0
      ? "You can change your username one more time for free after this. After that, you'll need to wait a year."
      : changeCount === 1
      ? "This is your last free username change. After confirming, you won't be able to change it for 1 year."
      : null;

  const handleAvatarPress = () => {
    const options = ["Take Photo", "Choose from Library"];
    if (avatarUri) options.push("Remove Photo");
    options.push("Cancel");

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: options.length - 1, destructiveButtonIndex: avatarUri ? options.length - 2 : undefined },
        async (index) => {
          if (options[index] === "Take Photo") await pickImage("camera");
          else if (options[index] === "Choose from Library") await pickImage("library");
          else if (options[index] === "Remove Photo") { setAvatarUri(null); setAvatarChanged(true); }
        }
      );
    } else {
      Alert.alert("Profile Photo", undefined, [
        { text: "Take Photo", onPress: () => pickImage("camera") },
        { text: "Choose from Library", onPress: () => pickImage("library") },
        ...(avatarUri ? [{ text: "Remove Photo", style: "destructive" as const, onPress: () => { setAvatarUri(null); setAvatarChanged(true); } }] : []),
        { text: "Cancel", style: "cancel" },
      ]);
    }
  };

  const pickImage = async (source: "camera" | "library") => {
    const permissionResult = source === "camera"
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert("Permission required", `Please allow access to your ${source === "camera" ? "camera" : "photo library"} in Settings.`);
      return;
    }

    const result = source === "camera"
      ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: "images", allowsEditing: true, aspect: [1, 1], quality: 0.7 });

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
      setAvatarChanged(true);
    }
  };

  const handleReview = () => {
    const trimmed = username.trim();
    if (!usernameLocked) {
      if (!trimmed) {
        setError("Please enter a username.");
        return;
      }
      if (trimmed.length < 2) {
        setError("Username must be at least 2 characters.");
        return;
      }
    }
    setError(null);
    setConfirmVisible(true);
  };

  const handleConfirm = async () => {
    if (!user) return;
    setSaving(true);
    setConfirmVisible(false);
    try {
      let finalAvatarUrl = profile?.avatar_url ?? null;

      if (avatarChanged) {
        if (avatarUri) {
          finalAvatarUrl = await uploadAvatar(user.id, avatarUri);
        } else {
          await deleteAvatar(user.id);
          finalAvatarUrl = null;
        }
      }

      const trimmedUsername = username.trim();
      const usernameChanged = !usernameLocked && trimmedUsername !== (profile?.username ?? "");

      await updateProfile(user.id, {
        ...(usernameChanged ? { username: trimmedUsername } : {}),
        avatar_url: finalAvatarUrl,
        play_style: playStyles.length > 0 ? playStyles : null,
        skill_level: skillLevel,
      });
      await refreshProfile();
      router.back();
    } catch {
      setError("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <KeyboardAvoidingView
        className="flex-1 bg-white dark:bg-black"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: insets.top + 32,
            paddingBottom: insets.bottom + 32,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          {isEditing ? (
            <View className="flex-row items-center gap-3">
              <Pressable
                onPress={() => router.back()}
                hitSlop={8}
                accessibilityLabel="Go back"
                accessibilityRole="button"
              >
                <Ionicons name="chevron-back" size={24} color="#960000" />
              </Pressable>
              <Text className="text-3xl font-bold text-gray-900 dark:text-white">
                Edit Profile
              </Text>
            </View>
          ) : (
            <Text className="text-3xl font-bold text-gray-900 dark:text-white">
              Set up your profile
            </Text>
          )}
          <Text className="mt-2 text-base text-gray-500 dark:text-white/60">
            {isEditing
              ? "Update your info anytime."
              : "Tell the pickup community a little about your game."}
          </Text>

          {/* Avatar picker */}
          <View className="mt-8 items-center">
            <Avatar
              uri={avatarUri}
              initials={username.trim() ? username.trim().slice(0, 2).toUpperCase() : "?"}
              size={88}
              editable
              onPress={handleAvatarPress}
            />
            <Text className="mt-2 text-xs text-gray-400 dark:text-white/40">
              Tap to add a photo
            </Text>
          </View>

          {/* Username */}
          <View className="mt-8">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm font-medium text-gray-700 dark:text-white/70">
                Username {!usernameLocked && <Text className="text-red-500">*</Text>}
              </Text>
              {usernameLocked && nextChangeDate ? (
                <View className="flex-row items-center gap-1">
                  <Ionicons name="lock-closed" size={11} color="#9ca3af" />
                  <Text className="text-xs text-gray-400 dark:text-white/30">
                    Can change {formatDate(nextChangeDate)}
                  </Text>
                </View>
              ) : null}
            </View>
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="e.g. jordand"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={30}
              editable={!usernameLocked}
              className={`rounded-xl border px-4 py-3.5 text-base ${
                usernameLocked
                  ? "border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02] text-gray-400 dark:text-white/30"
                  : "border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white"
              }`}
            />
          </View>

          {/* Play Style */}
          <View className="mt-8">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-sm font-medium text-gray-700 dark:text-white/70">
                How do you play?{" "}
                <Text className="text-gray-400 dark:text-white/40">(optional)</Text>
              </Text>
              <Text className="text-xs text-gray-400 dark:text-white/40">
                {playStyles.length}/2
              </Text>
            </View>
            <View className="flex-row flex-wrap gap-2">
              {PLAY_STYLES.map((style) => {
                const selected = playStyles.includes(style);
                const maxReached = playStyles.length >= 2 && !selected;
                return (
                  <Pressable
                    key={style}
                    onPress={() => {
                      if (selected) {
                        setPlayStyles(playStyles.filter((s) => s !== style));
                      } else if (!maxReached) {
                        setPlayStyles([...playStyles, style]);
                      }
                    }}
                    className={`rounded-full px-4 py-2 border ${
                      selected
                        ? "bg-red-900 border-red-900"
                        : maxReached
                        ? "bg-gray-50 dark:bg-white/[0.02] border-gray-100 dark:border-white/5"
                        : "bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10"
                    }`}
                    accessibilityRole="button"
                    accessibilityState={{ selected, disabled: maxReached }}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        selected
                          ? "text-white"
                          : maxReached
                          ? "text-gray-300 dark:text-white/20"
                          : "text-gray-700 dark:text-white/70"
                      }`}
                    >
                      {PLAY_STYLE_LABELS[style]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Skill Level */}
          <View className="mt-8">
            <Text className="text-sm font-medium text-gray-700 dark:text-white/70 mb-3">
              Skill level{" "}
              <Text className="text-gray-400 dark:text-white/40">(optional)</Text>
            </Text>
            <View className="flex-row gap-2">
              {SKILL_LEVELS.map((level) => {
                const selected = skillLevel === level;
                return (
                  <Pressable
                    key={level}
                    onPress={() => setSkillLevel(selected ? null : level)}
                    className={`flex-1 items-center rounded-xl py-3 border ${
                      selected
                        ? "bg-red-900 border-red-900"
                        : "bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10"
                    }`}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        selected ? "text-white" : "text-gray-700 dark:text-white/70"
                      }`}
                    >
                      {SKILL_LEVEL_LABELS[level]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {error ? (
            <Text className="mt-4 text-sm text-red-500">{error}</Text>
          ) : null}

          {/* Review / Save button */}
          <Pressable
            onPress={handleReview}
            disabled={saving}
            className="mt-10 rounded-2xl bg-red-900 py-4 items-center"
            style={{ opacity: saving ? 0.6 : 1 }}
            accessibilityRole="button"
            accessibilityLabel={isEditing ? "Save changes" : "Review profile"}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-base">
                {isEditing ? "Save Changes" : "Let's go"}
              </Text>
            )}
          </Pressable>

          {/* Skip / Cancel */}
          <Pressable
            onPress={() => router.back()}
            className="mt-4 items-center py-2"
            accessibilityRole="button"
          >
            <Text className="text-sm text-gray-400 dark:text-white/40">
              {isEditing ? "Cancel" : "Skip for now"}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Confirmation modal */}
      <Modal
        visible={confirmVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setConfirmVisible(false)}
      >
        <Pressable
          className="flex-1 bg-black/60 justify-end"
          onPress={() => setConfirmVisible(false)}
        >
          <Pressable
            onPress={() => {}}
            className="bg-white dark:bg-zinc-900 rounded-t-3xl px-6 pt-6"
            style={{ paddingBottom: insets.bottom + 24 }}
          >
            {/* Handle */}
            <View className="w-10 h-1 rounded-full bg-gray-300 dark:bg-white/20 self-center mb-6" />

            <Text className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              {isEditing ? "Save changes?" : "Confirm your profile"}
            </Text>
            <Text className="text-sm text-gray-500 dark:text-white/50 mb-6">
              {isEditing ? "Review your updates before saving." : "Review your selections before saving."}
            </Text>

            {/* Selections summary */}
            <View className="rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-4 gap-3">
              {/* Username */}
              {!usernameLocked ? (
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm text-gray-500 dark:text-white/40">Username</Text>
                  <Text className="text-sm font-semibold text-gray-900 dark:text-white">
                    {username.trim()}
                  </Text>
                </View>
              ) : null}

              {/* Play style */}
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-gray-500 dark:text-white/40">Play Style</Text>
                {playStyles.length > 0 ? (
                  <View className="flex-row gap-1.5">
                    {playStyles.map((s) => (
                      <View key={s} className="rounded-full bg-red-900/20 px-2.5 py-0.5">
                        <Text className="text-xs font-medium text-red-800 dark:text-red-400">
                          {PLAY_STYLE_LABELS[s]}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text className="text-sm text-gray-400 dark:text-white/30">Not set</Text>
                )}
              </View>

              {/* Skill level */}
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-gray-500 dark:text-white/40">Skill Level</Text>
                {skillLevel ? (
                  <View className="rounded-full bg-gray-200 dark:bg-white/10 px-2.5 py-0.5">
                    <Text className="text-xs font-medium text-gray-600 dark:text-white/60">
                      {SKILL_LEVEL_LABELS[skillLevel]}
                    </Text>
                  </View>
                ) : (
                  <Text className="text-sm text-gray-400 dark:text-white/30">Not set</Text>
                )}
              </View>
            </View>

            {/* Username policy notice */}
            {usernameNotice ? (
              <View className="mt-4 flex-row gap-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 p-3.5">
                <Ionicons name="information-circle" size={18} color="#d97706" style={{ marginTop: 1 }} />
                <Text className="flex-1 text-sm text-amber-800 dark:text-amber-400 leading-5">
                  {usernameNotice}
                </Text>
              </View>
            ) : null}

            {/* Actions */}
            <View className="mt-5 gap-3">
              <Pressable
                onPress={handleConfirm}
                className="rounded-2xl bg-red-900 py-4 items-center"
                accessibilityRole="button"
                accessibilityLabel="Confirm and save profile"
              >
                <Text className="text-white font-semibold text-base">Confirm</Text>
              </Pressable>
              <Pressable
                onPress={() => setConfirmVisible(false)}
                className="rounded-2xl py-3.5 items-center"
                accessibilityRole="button"
                accessibilityLabel="Go back and edit"
              >
                <Text className="text-sm text-gray-500 dark:text-white/50">Edit</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
