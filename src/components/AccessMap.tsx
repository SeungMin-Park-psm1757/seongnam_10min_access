"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl, { type GeoJSONSource, type Map as MapLibreMap } from "maplibre-gl";
import type { AreaMetric, ServicePoint } from "@/lib/data";

export type ScoreMetric = "overall_score" | "medical_score" | "pharmacy_score" | "transit_score" | "care_score";

type AccessMapProps = {
  areas: AreaMetric[];
  points: ServicePoint[];
  metric: ScoreMetric;
  compact?: boolean;
  serviceFilter?: ServicePoint["service_type"];
  variant?: "v1" | "v2";
};

const scoreStops = [
  0,
  "#a84f3f",
  55,
  "#9a6b2f",
  65,
  "#b7a35a",
  75,
  "#2f6f68",
] as const;

const serviceColors: Record<ServicePoint["service_type"], string> = {
  medical: "#3f4a50",
  pharmacy: "#647077",
  bus: "#7d8585",
  care: "#96938b",
};

const serviceNames: Record<ServicePoint["service_type"], string> = {
  medical: "의료",
  pharmacy: "약국",
  bus: "교통",
  care: "돌봄",
};

function areaFeatures(areas: AreaMetric[], metric: ScoreMetric) {
  return {
    type: "FeatureCollection" as const,
    features: areas.map((area) => ({
      type: "Feature" as const,
      properties: {
        id: area.area_id,
        name: area.area_name,
        district: area.district,
        score: Number(area[metric]),
        overall: area.overall_score,
        vulnerable: area.vulnerable_index,
        population: area.population,
      },
      geometry: {
        type: "Point" as const,
        coordinates: [area.lng, area.lat],
      },
    })),
  };
}

function pointFeatures(points: ServicePoint[], serviceFilter?: ServicePoint["service_type"]) {
  const visible = serviceFilter ? points.filter((point) => point.service_type === serviceFilter) : points;
  return {
    type: "FeatureCollection" as const,
    features: visible.map((point) => ({
      type: "Feature" as const,
      properties: {
        service: point.service_type,
        serviceName: serviceNames[point.service_type],
        name: point.name,
        area: point.area_name,
        color: serviceColors[point.service_type],
      },
      geometry: {
        type: "Point" as const,
        coordinates: [point.lng, point.lat],
      },
    })),
  };
}

function popupContent(lines: string[]) {
  const wrapper = document.createElement("div");
  lines.forEach((line, index) => {
    const element = document.createElement(index === 0 ? "strong" : "span");
    element.textContent = line;
    element.style.display = "block";
    wrapper.append(element);
  });
  return wrapper;
}

export function AccessMap({ areas, points, metric, compact = false, serviceFilter, variant = "v1" }: AccessMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const labelMarkersRef = useRef<maplibregl.Marker[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mapWarning, setMapWarning] = useState<string | null>(null);
  const areaData = useMemo(() => areaFeatures(areas, metric), [areas, metric]);
  const pointData = useMemo(() => pointFeatures(points, serviceFilter), [points, serviceFilter]);
  const metricLabel = serviceFilter ? `${serviceNames[serviceFilter]} 접근성 점수` : "종합 접근권 점수";

  useEffect(() => {
    if (!containerRef.current || mapRef.current || areas.length === 0) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      center: [127.136, 37.405],
      zoom: compact ? 10.6 : 11.15,
      pitch: 0,
      attributionControl: false,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "OpenStreetMap",
          },
        },
        layers: [
          {
            id: "osm",
            type: "raster",
            source: "osm",
            paint: {
              "raster-opacity": variant === "v2" ? (compact ? 0.28 : 0.38) : compact ? 0.42 : 0.58,
              "raster-saturation": variant === "v2" ? -0.78 : -0.65,
              "raster-brightness-min": variant === "v2" ? 0.12 : 0,
            },
          },
        ],
      },
    });

    mapRef.current = map;
    setIsLoaded(false);
    setMapWarning(null);

    map.on("error", () => {
      setMapWarning("배경지도가 늦게 떠도 동별 점수와 위치는 유지됩니다.");
    });

    if (!compact) {
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    }

    map.on("load", () => {
      setIsLoaded(true);
      map.addSource("areas", { type: "geojson", data: areaData });
      map.addSource("services", { type: "geojson", data: pointData });

      map.addLayer({
        id: "access-radius",
        type: "circle",
        source: "areas",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["get", "score"], 40, compact ? 30 : 52, 85, compact ? 16 : 30],
          "circle-color": ["interpolate", ["linear"], ["get", "score"], ...scoreStops],
          "circle-opacity": variant === "v2" ? (compact ? 0.24 : 0.3) : compact ? 0.18 : 0.22,
          "circle-stroke-width": variant === "v2" ? 1.5 : 1,
          "circle-stroke-color": ["interpolate", ["linear"], ["get", "score"], ...scoreStops],
          "circle-stroke-opacity": 0.45,
        },
      });

      map.addLayer({
        id: "area-point",
        type: "circle",
        source: "areas",
        paint: {
          "circle-radius": variant === "v2" ? (compact ? 5.5 : 9) : compact ? 5 : 8,
          "circle-color": ["interpolate", ["linear"], ["get", "score"], ...scoreStops],
          "circle-stroke-width": compact ? 1.5 : 2,
          "circle-stroke-color": "#ffffff",
        },
      });

      map.addLayer({
        id: "service-point",
        type: "circle",
        source: "services",
        paint: {
          "circle-radius": variant === "v2" ? (compact ? 4.8 : 7) : compact ? 4 : 6,
          "circle-color": ["get", "color"],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });

      const bounds = new maplibregl.LngLatBounds();
      areas.forEach((area) => bounds.extend([area.lng, area.lat]));
      points.forEach((point) => bounds.extend([point.lng, point.lat]));
      map.fitBounds(bounds, { padding: compact ? 22 : 54, duration: 0 });
      map.resize();

      map.on("click", "area-point", (event) => {
        const feature = event.features?.[0];
        if (!feature) return;
        new maplibregl.Popup({ closeButton: false, offset: 12 })
          .setLngLat(event.lngLat)
          .setDOMContent(
            popupContent([
              String(feature.properties?.name ?? "지역"),
              `접근성 ${Math.round(Number(feature.properties?.score))}점`,
              `지원수요 ${feature.properties?.vulnerable}점`,
            ]),
          )
          .addTo(map);
      });

      map.on("click", "service-point", (event) => {
        const feature = event.features?.[0];
        if (!feature) return;
        new maplibregl.Popup({ closeButton: false, offset: 12 })
          .setLngLat(event.lngLat)
          .setDOMContent(
            popupContent([
              String(feature.properties?.name ?? "서비스 위치"),
              `${feature.properties?.serviceName} 서비스`,
              String(feature.properties?.area ?? ""),
            ]),
          )
          .addTo(map);
      });

      for (const layer of ["area-point", "service-point"]) {
        map.on("mouseenter", layer, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", layer, () => {
          map.getCanvas().style.cursor = "";
        });
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [areaData, areas, compact, pointData, points, variant]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    (map.getSource("areas") as GeoJSONSource | undefined)?.setData(areaData);
    (map.getSource("services") as GeoJSONSource | undefined)?.setData(pointData);
  }, [areaData, pointData]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || compact) return;

    const renderLabels = () => {
      labelMarkersRef.current.forEach((marker) => marker.remove());
      labelMarkersRef.current = areas.map((area) => {
        const label = document.createElement("div");
        const name = document.createElement("strong");
        const score = document.createElement("span");
        label.className = "areaMapLabel";
        name.textContent = area.area_name;
        score.textContent = `${Math.round(Number(area[metric]))}점`;
        label.append(name, score);
        return new maplibregl.Marker({ element: label, anchor: "top" }).setLngLat([area.lng, area.lat]).addTo(map);
      });
    };

    if (map.loaded()) renderLabels();
    map.once("load", renderLabels);

    return () => {
      labelMarkersRef.current.forEach((marker) => marker.remove());
      labelMarkersRef.current = [];
    };
  }, [areas, compact, metric]);

  return (
    <div
      className={`${compact ? "mapShell compact realMapShell" : "mapShell realMapShell"} ${variant === "v2" ? "mapShellV2" : ""}`}
      role="img"
      tabIndex={0}
      aria-label={`${metricLabel}를 우선 점검 필요, 주의 관찰, 대체로 양호 구간으로 표시한 성남 생활권 지도`}
      aria-describedby={`${metric}-map-desc`}
    >
      <p id={`${metric}-map-desc`} className="srOnly">
        색상만으로 구분하지 않고 지도 범례, 점수 구간 라벨, 동 이름, 점수 숫자를 함께 제공합니다.
      </p>
      {areas.length === 0 ? (
        <div className="mapEmptyState">
          <strong>데이터 없음</strong>
          <span>동별 좌표와 접근성 점수 CSV가 필요합니다.</span>
        </div>
      ) : (
        <>
          <div ref={containerRef} className="accessMap" aria-hidden="true" />
          {!isLoaded && <div className="mapLoading">지도 로딩 중</div>}
          <div className="mapLegend">
            <b>{metricLabel}</b>
            <span>
              <i className="low" />
              우선 점검 필요
            </span>
            <span>
              <i className="mid" />
              주의 관찰
            </span>
            <span>
              <i className="high" />
              대체로 양호
            </span>
          </div>
          {!compact && <p className="mapNote">{mapWarning ?? "원이 클수록 우선 점검 필요가 큽니다. 점을 누르면 근거가 열립니다."}</p>}
        </>
      )}
    </div>
  );
}
