import React from "react";
import { View } from "react-native";
import MapLibreGL from "@maplibre/maplibre-react-native";
import { Court } from "@/src/services/courts";

type CourtsMapProps = {
  center: { lat: number; lon: number };
  courts: Court[];
};

export function CourtsMap({ center, courts }: CourtsMapProps) {
  const points = courts.filter(
    (court) =>
      Number.isFinite(court.latitude) && Number.isFinite(court.longitude)
  );

  return (
    <MapLibreGL.MapView
      style={{ flex: 1 }}
      styleURL={MapLibreGL.StyleURL.Street}
      logoEnabled={false}
      compassEnabled
    >
      <MapLibreGL.Camera
        zoomLevel={11.5}
        centerCoordinate={[center.lon, center.lat]}
      />
      {points.map((court) => (
        <MapLibreGL.PointAnnotation
          key={court.id}
          id={court.id}
          coordinate={[court.longitude, court.latitude]}
        >
          <View className="h-3 w-3 rounded-full border border-white/80 bg-[#960000]" />
        </MapLibreGL.PointAnnotation>
      ))}
    </MapLibreGL.MapView>
  );
}
