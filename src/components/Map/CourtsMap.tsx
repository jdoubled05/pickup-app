import React, { useEffect, useMemo, useState } from "react";
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
  const courtsWithCoords = useMemo(
    () =>
      courts.filter(
        (court) =>
          typeof court.latitude === "number" &&
          typeof court.longitude === "number" &&
          Number.isFinite(court.latitude) &&
          Number.isFinite(court.longitude) &&
          typeof court.id === "string" &&
          court.id.length > 0
      ),
    [courts]
  );

  const handleSelect = (courtId: string) => {
    setSelectedId(courtId);
    onSelectCourt?.(courtId);
  };

  useEffect(() => {
    console.log("[CourtsMap] courts", {
      total: courts.length,
      withCoords: courtsWithCoords.length,
    });
  }, [courts.length, courtsWithCoords.length]);

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
      {courtsWithCoords.map((court) => (
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
                : "h-3 w-3 rounded-full bg-[#960000] border border-white"
            }
          />
        </MapLibreGL.PointAnnotation>
      ))}
    </MapLibreGL.MapView>
  );
}
