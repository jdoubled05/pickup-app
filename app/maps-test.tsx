import React from "react";
import { View } from "react-native";
import { Text } from "@/src/components/ui/Text";
import { CourtsMap } from "@/src/components/Map/CourtsMap";
import { Court, listCourtsNearby } from "@/src/services/courts";
import {
  DEFAULT_CENTER,
  getForegroundLocationOrDefault,
} from "@/src/services/location";

type MapErrorBoundaryProps = {
  children: React.ReactNode;
};

type MapErrorBoundaryState = {
  hasError: boolean;
};

class MapErrorBoundary extends React.Component<MapErrorBoundaryProps, MapErrorBoundaryState> {
  state: MapErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 bg-black px-6 py-6">
          <Text className="text-2xl font-bold">Maps Test</Text>
          <Text className="mt-2 text-white/70">
            Map failed to load. Rebuild the dev client with `npx expo run:ios` and restart
            Metro using `npx expo start --dev-client -c`.
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

export default function MapsTest() {
  const [center, setCenter] = React.useState(DEFAULT_CENTER);
  const [courts, setCourts] = React.useState<Court[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    const load = async () => {
      const location = await getForegroundLocationOrDefault();
      if (!isMounted) {
        return;
      }
      setCenter(location.coords);
      try {
        const data = await listCourtsNearby(
          location.coords.lat,
          location.coords.lon,
          50000
        );
        if (isMounted) {
          setCourts(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load courts.");
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <View className="flex-1 bg-black">
      <MapErrorBoundary>
        <CourtsMap center={center} courts={courts} />
      </MapErrorBoundary>
      <View className="absolute left-0 right-0 top-0 px-6 pt-6">
        <Text className="text-2xl font-bold">Maps Test</Text>
        {error ? (
          <Text className="mt-2 text-white/70">{error}</Text>
        ) : null}
      </View>
    </View>
  );
}
