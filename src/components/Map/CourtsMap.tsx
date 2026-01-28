import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MapLibreGL from "@maplibre/maplibre-react-native";
import { Court } from "@/src/services/courts";

type CourtsMapProps = {
  center: { lat: number; lon: number };
  courts: Court[];
  recenterSignal?: number;
  onSelectCourt?: (courtId: string) => void;
};

type CameraState = {
  center: [number, number];
  zoom: number;
};

let cachedCamera: CameraState | null = null;

export function CourtsMap({
  center,
  courts,
  recenterSignal,
  onSelectCourt,
}: CourtsMapProps) {
  const initialCamera = cachedCamera ?? {
    center: [center.lon, center.lat] as [number, number],
    zoom: 11.5,
  };
  const [cameraCenter, setCameraCenter] = useState<[number, number]>(
    initialCamera.center
  );
  const [zoom, setZoom] = useState(initialCamera.zoom);
  const lastCameraUpdateRef = useRef(0);
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

  useEffect(() => {
    setCameraCenter([center.lon, center.lat]);
  }, [center.lat, center.lon]);

  useEffect(() => {
    if (typeof recenterSignal === "number") {
      setCameraCenter([center.lon, center.lat]);
      setZoom(11.6);
      const t = setTimeout(() => setZoom(11.5), 50);
      return () => clearTimeout(t);
    }
  }, [recenterSignal, center.lat, center.lon]);

  const handleCameraChanged = useCallback((e: unknown) => {
    const now = Date.now();
    if (now - lastCameraUpdateRef.current < 250) {
      return;
    }
    lastCameraUpdateRef.current = now;
    const payload = (e as { properties?: unknown })?.properties ?? e;
    const centerValue = (payload as { center?: [number, number] })?.center;
    const zoomValue = (payload as { zoom?: number })?.zoom;
    if (
      Array.isArray(centerValue) &&
      centerValue.length === 2 &&
      typeof centerValue[0] === "number" &&
      typeof centerValue[1] === "number" &&
      Number.isFinite(centerValue[0]) &&
      Number.isFinite(centerValue[1]) &&
      typeof zoomValue === "number" &&
      Number.isFinite(zoomValue)
    ) {
      cachedCamera = { center: centerValue, zoom: zoomValue };
    }
  }, []);

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
      onCameraChanged={handleCameraChanged}
    >
      <MapLibreGL.Camera
        zoomLevel={zoom}
        centerCoordinate={cameraCenter}
        animationMode="flyTo"
        animationDuration={600}
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
