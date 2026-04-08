"use client";

// ─────────────────────────────────────────────────────────
//  MapStage.tsx
//
//  This is the 70% left panel. It renders the interactive
//  Leaflet map with cable paths and landing point markers.
//
//  "use client" is required because Leaflet needs the browser
//  (it uses window, document etc). Next.js runs some code
//  on the server — Leaflet can't run there.
// ─────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Cable, LandingStation, fetchCables, fetchLandingStations } from "@/lib/api";

// Each cable gets a distinct color so they're visually separate
const CABLE_COLORS = [
  "#38BDF8", // cyan
  "#818CF8", // indigo
  "#34D399", // emerald
  "#F59E0B", // amber
  "#F472B6", // pink
];

interface MapStageProps {
  onCableClick: (cable: Cable) => void;
  onStationClick: (country: string) => void;
  selectedCableId: string | null;
}

export default function MapStage({
  onCableClick,
  onStationClick,
  selectedCableId,
}: MapStageProps) {
  const [cables, setCables] = useState<Cable[]>([]);
  const [stations, setStations] = useState<LandingStation[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch data from our FastAPI backend when the component loads
  useEffect(() => {
    Promise.all([fetchCables(), fetchLandingStations()])
      .then(([cablesData, stationsData]) => {
        setCables(cablesData);
        setStations(stationsData);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load map data:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="relative w-full h-full">
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center"
          style={{ background: "#030712" }}>
          <div className="text-center">
            <div className="text-cyan-400 text-lg font-mono mb-2">
              Loading cable topology...
            </div>
            <div className="text-gray-500 text-sm">
              Connecting to Real Rails backend
            </div>
          </div>
        </div>
      )}

      {/* The Leaflet Map */}
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ width: "100%", height: "100%" }}
        zoomControl={false}
      >
        {/* Dark map tiles from CartoDB — matches our #030712 theme */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />

        <ZoomControl position="bottomleft" />

        {/* Draw each cable as a colored polyline */}
        {cables.map((cable, index) => {
          const color = CABLE_COLORS[index % CABLE_COLORS.length];
          const isSelected = cable.id === selectedCableId;

          return (
            <Polyline
              key={cable.id}
              // Leaflet expects [lat, lng] but our data is [lng, lat]
              // so we reverse each coordinate pair
              positions={cable.coordinates.map(([lng, lat]) => [lat, lng])}
              pathOptions={{
                color: isSelected ? "#FFFFFF" : color,
                weight: isSelected ? 4 : 2,
                opacity: isSelected ? 1 : 0.7,
              }}
              eventHandlers={{
                click: () => onCableClick(cable),
              }}
            >
              <Tooltip sticky>
                <div style={{ background: "#0B1117", color: "#F9FAFB", padding: "4px 8px", border: "1px solid #1F2937" }}>
                  <strong>{cable.name}</strong><br />
                  {cable.length_km.toLocaleString()} km<br />
                  Owners: {cable.owners.join(", ")}
                </div>
              </Tooltip>
            </Polyline>
          );
        })}

        {/* Draw landing station markers */}
        {stations.map((station) => (
          <CircleMarker
            key={station.country}
            center={[station.lat, station.lng]}
            radius={6}
            pathOptions={{
              color: "#38BDF8",
              fillColor: "#38BDF8",
              fillOpacity: 0.8,
              weight: 2,
            }}
            eventHandlers={{
              click: () => onStationClick(station.country),
            }}
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
