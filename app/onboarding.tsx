import React, { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Pressable,
  View,
  ViewToken,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Location from "expo-location";
import { Text } from "@/src/components/ui/Text";
import { Button } from "@/src/components/ui/Button";
import { markOnboardingComplete } from "@/src/services/onboarding";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type Slide = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  body: string;
  highlight?: string; // bolded phrase within body
};

const SLIDES: Slide[] = [
  {
    id: "welcome",
    icon: "basketball",
    iconColor: "#960000",
    title: "Welcome to Pickup",
    body: "Find real-time pickup basketball games at courts near you.",
  },
  {
    id: "checkins",
    icon: "radio-button-on",
    iconColor: "#43A047",
    title: "See Who's Playing",
    body: "Players check in when they arrive at a court. See live activity before you make the trip.",
  },
  {
    id: "submit",
    icon: "add-circle",
    iconColor: "#FFD700",
    title: "Know a Court We're Missing?",
    body: "Our database grows with your help. Submit a court directly from the app — it only takes a minute.",
  },
  {
    id: "access",
    icon: "shield-checkmark",
    iconColor: "#FF7043",
    title: "Not All Courts Are Public",
    body: "Some courts — especially indoor gyms and rec centers — may require a membership or fee. Help the community by reporting access info when you visit.",
  },
  {
    id: "location",
    icon: "location",
    iconColor: "#00BCD4",
    title: "Courts Near You",
    body: "Pickup uses your location to find nearby courts and active games. We never store or share it.",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList<Slide>>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const goToNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    }
  };

  const finish = async () => {
    await markOnboardingComplete();
    router.replace("/(tabs)/courts");
  };

  const handleGetStarted = async () => {
    try {
      await Location.requestForegroundPermissionsAsync();
    } catch {
      // Permission denied is fine — app degrades gracefully
    }
    finish();
  };

  const isLast = activeIndex === SLIDES.length - 1;

  return (
    <View className="flex-1 bg-black" style={{ paddingBottom: insets.bottom }}>
      {/* Skip button */}
      {!isLast && (
        <Pressable
          onPress={finish}
          hitSlop={12}
          style={{ position: "absolute", top: insets.top + 16, right: 24, zIndex: 10 }}
        >
          <Text className="text-base text-white/50">Skip</Text>
        </Pressable>
      )}

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        renderItem={({ item }) => (
          <SlideView slide={item} topInset={insets.top} />
        )}
      />

      {/* Dot indicators */}
      <View className="flex-row justify-center gap-2 pb-6">
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={{
              width: i === activeIndex ? 20 : 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: i === activeIndex ? "#960000" : "rgba(255,255,255,0.25)",
            }}
          />
        ))}
      </View>

      {/* CTA */}
      <View className="px-6 pb-4">
        {isLast ? (
          <Button
            title="Get Started"
            onPress={handleGetStarted}
            className="py-4"
          />
        ) : (
          <Button
            title="Next"
            onPress={goToNext}
            className="py-4"
          />
        )}
      </View>
    </View>
  );
}

function SlideView({ slide, topInset }: { slide: Slide; topInset: number }) {
  return (
    <View
      style={{ width: SCREEN_WIDTH, paddingTop: topInset + 80 }}
      className="flex-1 items-center px-8"
    >
      {/* Icon circle */}
      <View
        style={{ backgroundColor: `${slide.iconColor}18`, borderColor: `${slide.iconColor}30` }}
        className="mb-8 h-24 w-24 items-center justify-center rounded-full border"
      >
        <Ionicons name={slide.icon} size={44} color={slide.iconColor} />
      </View>

      <Text className="mb-4 text-center text-3xl font-extrabold text-white">
        {slide.title}
      </Text>

      <Text className="text-center text-base leading-7 text-white/65">
        {slide.body}
      </Text>

      {/* Extra nudge on the submit slide */}
      {slide.id === "submit" && (
        <View className="mt-8 w-full rounded-2xl border border-vibrant-gold/20 bg-vibrant-gold/10 px-5 py-4">
          <View className="flex-row items-center gap-3">
            <Ionicons name="people" size={18} color="#FFD700" />
            <Text className="flex-1 text-sm text-vibrant-gold/90">
              Submissions are reviewed and added within 24 hours.
            </Text>
          </View>
        </View>
      )}

      {/* Extra nudge on the access slide */}
      {slide.id === "access" && (
        <View className="mt-8 w-full rounded-2xl border border-orange-500/20 bg-orange-500/10 px-5 py-4">
          <View className="flex-row items-center gap-3">
            <Ionicons name="flag" size={18} color="#FF7043" />
            <Text className="flex-1 text-sm text-orange-300/90">
              On any court page, tap "Report an Issue" to mark it as free/paid or public/private.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
