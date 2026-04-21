"use client";

import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Tooltip, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Cable, LandingStation, fetchCables, fetchLandingStations } from "@/lib/api";

const CABLE_COLORS = [
  "#38BDF8", "#818CF8", "#34D399", "#F59E0B", "#F472B6",
  "#60A5FA", "#A78BFA", "#34D399", "#FB923C", "#F87171",
  "#22D3EE", "#C084FC", "#4ADE80", "#FACC15", "#FB7185",
];

// Our featured cable IDs to filter from TeleGeography
const FEATURED_IDS = [
  "sea-me-we-5", "aae-1", "africa-coast-to-europe-ace",
  "trans-pacific-express-tpe", "dunant", "safe",
  "eassy", "imewe", "apg", "jupiter"
];

interface MapStageProps {
  onCableClick: (cable: Cable) => void;
  onStationClick: (country: string) => void;
  selectedCableId: string | null;
  selectedCountry: string | null;
}

export default function MapStage({
  onCableClick,
  onStationClick,
  selectedCableId,
  selectedCountry,
}: MapStageProps) {
  const [cables, setCables] = useState<Cable[]>([]);
  const [stations, setStations] = useState<LandingStation[]>([]);
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchCables(),
      fetchLandingStations(),
      fetch("http://localhost:8000/api/cable-geo").then(r => r.json())
    ])
      .then(([cablesRes, stationsRes, geoRes]) => {
        const cableList = (cablesRes as any).data?.cables ?? cablesRes;
        setCables(cableList);
        setStations((stationsRes as any).data?.landing_stations ?? stationsRes);

        // Filter GeoJSON to only our featured cables
        const cableIds = new Set(cableList.map((c: Cable) => c.id));
        const filtered = {
          ...geoRes,
          features: geoRes.features.filter((f: any) => {
            const id = f.properties?.id || "";
            return Array.from(cableIds).some((cid: any) =>
              id.includes(cid) || cid.includes(id.split("-").slice(0, 3).join("-"))
            );
          })
        };
        setGeoJsonData(filtered);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load map data:", err);
        setLoading(false);
      });
  }, []);

  const getCableByGeoId = (geoId: string): Cable | undefined => {
    return cables.find(c =>
      geoId.includes(c.id) || c.id.includes(geoId.split("-").slice(0, 3).join("-"))
    );
  };

  const geoJsonStyle = (feature: any) => {
    const geoId = feature?.properties?.id || "";
    const cable = getCableByGeoId(geoId);
    const index = cable ? cables.indexOf(cable) : 0;
    const isSelected = cable?.id === selectedCableId;
    return {
      color: isSelected ? "#FFFFFF" : CABLE_COLORS[index % CABLE_COLORS.length],
      weight: isSelected ? 4 : 2,
      opacity: isSelected ? 1 : 0.7,
      smoothFactor: 1.5,
    };
  };

  const onEachFeature = (feature: any, layer: any) => {
    const geoId = feature?.properties?.id || "";
    const cable = getCableByGeoId(geoId);

    if (cable) {
      layer.bindTooltip(`
        <div style="background:#0B1117;color:#F9FAFB;padding:4px 8px;border:1px solid #1F2937">
          <strong>${cable.name}</strong><br/>
          ${cable.length_km.toLocaleString()} km<br/>
          Owners: ${cable.owners.join(", ")}
        </div>
      `, { sticky: true });

      layer.on("click", () => onCableClick(cable));
    }

    // Log geometry type as coordinator suggested
    console.log(feature.properties?.id, "→", feature.geometry.type);
  };

  return (
    <div className="relative w-full h-full">
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center"
          style={{ background: "#030712" }}>
          <div className="text-center">
            <div className="text-cyan-400 text-lg font-mono mb-2">
              Loading cable topology...
            </div>
            <div className="text-gray-500 text-sm">
              Connecting to TeleGeography live data
            </div>
          </div>
        </div>
      )}

      {/* Filter panel */}
      <div style={{
        position: "absolute", top: "80px", left: "16px", zIndex: 1000,
        background: "#0B1117", border: "1px solid #1F2937",
        borderRadius: "8px", padding: "12px", width: "220px",
      }}>
        <div style={{ color: "#38BDF8", fontSize: "11px", marginBottom: "8px" }}>FILTERS</div>
        <div style={{ color: "#6B7280", fontSize: "10px", marginBottom: "4px" }}>SELECT COUNTRY</div>
        <select
          value={selectedCountry || ""}
          onChange={(e) => onStationClick(e.target.value)}
          style={{
            width: "100%", background: "#030712", color: "#F9FAFB",
            border: "1px solid #1F2937", borderRadius: "6px",
            padding: "8px", fontSize: "12px", cursor: "pointer"
          }}
        >
          <option value="">Select a country...</option>
          {stations.map((s) => (
            <option key={s.country} value={s.country}>{s.country}</option>
          ))}
        </select>
      </div>

      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ width: "100%", height: "100%" }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />
        <ZoomControl position="bottomleft" />

        {/* Render cables using L.geoJSON as coordinator suggested */}
        {geoJsonData && (
          <GeoJSON
            key={selectedCableId || "default"}
            data={geoJsonData}
            style={geoJsonStyle}
            onEachFeature={onEachFeature}
          />
        )}

        {/* Landing station markers */}
        {stations.map((station) => (
          <CircleMarker
            key={station.country}
            center={[station.lat, station.lng]}
            radius={6}
            pathOptions={{
              color: "#38BDF8", fillColor: "#38BDF8",
              fillOpacity: 0.8, weight: 2,
            }}
            eventHandlers={{ click: () => onStationClick(station.country) }}
          >
            <Tooltip>
              <div style={{ background: "#0B1117", color: "#F9FAFB", padding: "4px 8px", border: "1px solid #1F2937" }}>
                <strong>{station.country}</strong><br />
                {station.cables.length} cable{station.cables.length !== 1 ? "s" : ""}
              </div>
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}