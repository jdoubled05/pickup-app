import React, { useEffect, useMemo } from "react";
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

  useEffect(() => {
    console.log("[CourtsMap] courts", {
      total: courts.length,
      withCoords: courtsWithCoords.length,
    });
  }, [courts.length, courtsWithCoords.length]);

  const features = useMemo(
    () =>
      courtsWithCoords.map((court) => ({
        type: "Feature",
        id: court.id,
        properties: {
          id: court.id,
          name: court.name ?? "",
        },
        geometry: {
          type: "Point",
          coordinates: [court.longitude, court.latitude],
        },
      })),
    [courtsWithCoords]
  );

  const collection = useMemo(
    () =>
      ({
        type: "FeatureCollection",
        features,
      }) as const,
    [features]
  );

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
      <MapLibreGL.ShapeSource
        id="courts"
        shape={collection}
        onPress={(e) => {
          const feat = e?.features?.[0];
          const courtId = feat?.properties?.id;
          if (typeof courtId === "string" && courtId.length > 0) {
            onSelectCourt?.(courtId);
          }
        }}
      >
        <MapLibreGL.CircleLayer
          id="courtCircles"
          style={{
            circleRadius: 6,
            circleColor: "#960000",
            circleStrokeWidth: 2,
            circleStrokeColor: "#ffffff",
          }}
        />
      </MapLibreGL.ShapeSource>
    </MapLibreGL.MapView>
  );
}
