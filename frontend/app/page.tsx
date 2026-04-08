"use client";

// ─────────────────────────────────────────────────────────
//  app/page.tsx — The Main Dashboard Page
//
//  This is the root of your application. It enforces the
//  mandatory 70/30 split from the Real Rails Manifesto.
//
//  It also manages "state" — the currently selected cable
//  and country — and passes them down to child components.
//
//  This is the core full-stack pattern:
//  page.tsx (state) → MapStage (map) + Sidebar (intelligence)
// ─────────────────────────────────────────────────────────

import { useState } from "react";
import dynamic from "next/dynamic";
import { Cable } from "@/lib/api";
import Sidebar from "@/components/Sidebar";

// We load the map with dynamic import and ssr:false
// because Leaflet requires the browser environment.
// Without this Next.js would crash trying to render
// the map on the server.
const MapStage = dynamic(() => import("@/components/MapStage"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center"
      style={{ background: "#030712" }}>
      <span style={{ color: "#38BDF8", fontFamily: "monospace" }}>
        Initializing map...
      </span>
    </div>
  ),
});

export default function Home() {
  const [selectedCable, setSelectedCable] = useState<Cable | null>(null);
  const [selectedCableId, setSelectedCableId] = useState<string | null>(null);

  const handleCableClick = (cable: Cable) => {
    setSelectedCable(cable);
    setSelectedCableId(cable.id);
  };

  const handleCountrySelect = (country: string) => {
    // Could pan the map to the country in future phases
    console.log("Country selected:", country);
  };

  return (
    <main
      style={{
        display: "flex",
        width: "100vw",
        height: "100vh",
        background: "#030712",
        overflow: "hidden",
      }}
    >
      {/* ── MAP STAGE: 70% ── */}
      <div style={{ width: "70%", height: "100%", position: "relative" }}>
        {/* Top bar */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, zIndex: 1000,
          background: "rgba(3,7,18,0.9)", borderBottom: "1px solid #1F2937",
          padding: "10px 16px", display: "flex", alignItems: "center", gap: "12px",
          backdropFilter: "blur(8px)"
        }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#38BDF8", boxShadow: "0 0 8px #38BDF8" }} />
          <span style={{ color: "#38BDF8", fontSize: "11px", letterSpacing: "2px", fontWeight: 600 }}>
            SUBMARINE CABLE DEPENDENCY MAP
          </span>
          <span style={{ color: "#1F2937", fontSize: "11px" }}>|</span>
          <span style={{ color: "#6B7280", fontSize: "11px" }}>
            Click a cable or landing point to inspect
          </span>
        </div>

        <MapStage
          onCableClick={handleCableClick}
          onStationClick={handleCountrySelect}
          selectedCableId={selectedCableId}
        />
      </div>

      {/* ── INTELLIGENCE SIDEBAR: 30% ── */}
      <div style={{ width: "30%", height: "100%" }}>
        <Sidebar
          selectedCable={selectedCable}
          onCountrySelect={handleCountrySelect}
        />
      </div>
    </main>
  );
}
