import React, { useState } from "react";
import { View } from "react-native";
import MapLibreGL from "@maplibre/maplibre-react-native";
import { Court } from "@/src/services/courts";

type CourtsMapProps = {
  center: { lat: number; lon: number };
  courts: Court[];
  onSelectCourt?: (courtId: string) => void;
  cameraKey?: number;
};

export function CourtsMap({
  center,
  courts,
  onSelectCourt,
  cameraKey = 0,
}: CourtsMapProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const points = courts.filter(
    (court) =>
      Number.isFinite(court.latitude) && Number.isFinite(court.longitude)
  );

  const handleSelect = (courtId: string) => {
    setSelectedId(courtId);
    onSelectCourt?.(courtId);
  };

  return (
    <MapLibreGL.MapView
      style={{ flex: 1 }}
      styleURL={MapLibreGL.StyleURL.Street}
      logoEnabled={false}
      compassEnabled
    >
      <MapLibreGL.Camera
        key={cameraKey}
        zoomLevel={11.5}
        centerCoordinate={[center.lon, center.lat]}
      />
      {points.map((court) => (
        <MapLibreGL.PointAnnotation
          key={court.id}
          id={court.id}
          coordinate={[court.longitude, court.latitude]}
          onSelected={() => handleSelect(court.id)}
        >
          <View
            className={
              selectedId === court.id
                ? "h-4 w-4 rounded-full border border-white bg-white"
                : "h-3 w-3 rounded-full border border-white/80 bg-[#960000]"
            }
          />
        </MapLibreGL.PointAnnotation>
      ))}
    </MapLibreGL.MapView>
  );
}
