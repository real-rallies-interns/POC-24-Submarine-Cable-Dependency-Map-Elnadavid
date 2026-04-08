"use client";

// ─────────────────────────────────────────────────────────
//  Sidebar.tsx — The 30% Intelligence Panel
//
//  This panel shows contextual intelligence based on what
//  the user clicks on the map. It has 5 sections as defined
//  in the Real Rails Master Manifesto:
//  A: Title & Metric
//  B: Why This Matters
//  C: Who Controls the Rail
//  D: Filters & Selection
//  E: Download Sample Data
// ─────────────────────────────────────────────────────────

import { useState } from "react";
import { Cable, CountryDependency, fetchCountryDependency } from "@/lib/api";

interface SidebarProps {
  selectedCable: Cable | null;
  onCountrySelect: (country: string) => void;
}

const RISK_COLORS = {
  LOW: "#34D399",
  MEDIUM: "#F59E0B",
  HIGH: "#F87171",
};

const COUNTRIES = [
  "France", "India", "Singapore", "Egypt",
  "USA", "South Africa", "Nigeria", "China",
  "Japan", "Saudi Arabia"
];

export default function Sidebar({ selectedCable, onCountrySelect }: SidebarProps) {
  const [countryData, setCountryData] = useState<CountryDependency | null>(null);
  const [loadingCountry, setLoadingCountry] = useState(false);

  const handleCountrySelect = async (country: string) => {
    setLoadingCountry(true);
    try {
      const data = await fetchCountryDependency(country);
      setCountryData(data);
      onCountrySelect(country);
    } catch (err) {
      console.error("Failed to fetch country data:", err);
    } finally {
      setLoadingCountry(false);
    }
  };

  const downloadSampleData = () => {
    const sample = {
      note: "Real Rails PoC #24 — Submarine Cable Dependency Map",
      source: "Mock topology data based on TeleGeography references",
      country_selected: countryData?.country || "None",
      redundancy_score: countryData?.redundancy_score || null,
      risk_level: countryData?.risk_level || null,
    };
    const blob = new Blob([JSON.stringify(sample, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "submarine_cable_sample.json";
    a.click();
  };

  return (
    <div
      className="h-full flex flex-col sidebar-scroll"
      style={{
        background: "#0B1117",
        borderLeft: "1px solid #1F2937",
        padding: "16px",
        gap: "12px",
      }}
    >
      {/* ── SECTION A: Title & Metric ── */}
      <div className="glass-card p-4">
        <div style={{ color: "#38BDF8", fontSize: "10px", letterSpacing: "2px", marginBottom: "4px" }}>
          REAL RAILS — POC #24
        </div>
        <h1 style={{ color: "#F9FAFB", fontSize: "16px", fontWeight: 700, lineHeight: 1.3 }}>
          Submarine Cable Dependency Map
        </h1>
        <p style={{ color: "#6B7280", fontSize: "12px", marginTop: "6px" }}>
          Mapping the physical infrastructure beneath the digital world.
        </p>
        <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
          <div style={{ background: "#030712", border: "1px solid #1F2937", borderRadius: "6px", padding: "8px 12px", flex: 1, textAlign: "center" }}>
            <div style={{ color: "#38BDF8", fontSize: "20px", fontWeight: 700 }}>5</div>
            <div style={{ color: "#6B7280", fontSize: "10px" }}>Major Cables</div>
          </div>
          <div style={{ background: "#030712", border: "1px solid #1F2937", borderRadius: "6px", padding: "8px 12px", flex: 1, textAlign: "center" }}>
            <div style={{ color: "#818CF8", fontSize: "20px", fontWeight: 700 }}>10</div>
            <div style={{ color: "#6B7280", fontSize: "10px" }}>Landing Points</div>
          </div>
        </div>
      </div>

      {/* ── SECTION B: Why This Matters ── */}
      <div className="glass-card p-4">
        <div style={{ color: "#38BDF8", fontSize: "10px", letterSpacing: "2px", marginBottom: "8px" }}>
          WHY THIS MATTERS
        </div>
        <p style={{ color: "#9CA3AF", fontSize: "12px", lineHeight: 1.6 }}>
          The internet feels wireless, but <span style={{ color: "#F9FAFB", fontWeight: 600 }}>99% of international data</span> travels through underwater fiber-optic cables.
          A single anchor strike or earthquake can take an entire nation offline.
          This map reveals which countries are <span style={{ color: "#F87171" }}>dangerously under-connected</span> — and which corridors need investment.
        </p>
      </div>

      {/* ── SECTION C: Who Controls the Rail ── */}
      <div className="glass-card p-4">
        <div style={{ color: "#38BDF8", fontSize: "10px", letterSpacing: "2px", marginBottom: "8px" }}>
          WHO CONTROLS THE RAIL
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {["Google", "Meta", "Orange", "Tata Communications", "China Telecom"].map((owner) => (
            <div key={owner} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#38BDF8", flexShrink: 0 }} />
              <span style={{ color: "#D1D5DB", fontSize: "12px" }}>{owner}</span>
            </div>
          ))}
        </div>
        <p style={{ color: "#6B7280", fontSize: "11px", marginTop: "8px" }}>
          A handful of tech giants and telecoms own the billion-dollar cables that carry global commerce.
        </p>
      </div>

      {/* ── SECTION D: Country Dependency Filter ── */}
      <div className="glass-card p-4">
        <div style={{ color: "#38BDF8", fontSize: "10px", letterSpacing: "2px", marginBottom: "8px" }}>
          COUNTRY DEPENDENCY VIEW
        </div>
        <select
          onChange={(e) => e.target.value && handleCountrySelect(e.target.value)}
          style={{
            width: "100%", background: "#030712", color: "#F9FAFB",
            border: "1px solid #1F2937", borderRadius: "6px",
            padding: "8px", fontSize: "12px", cursor: "pointer"
          }}
        >
          <option value="">Select a country...</option>
          {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Country result */}
        {loadingCountry && (
          <p style={{ color: "#38BDF8", fontSize: "12px", marginTop: "8px" }}>Loading...</p>
        )}
        {countryData && !loadingCountry && (
          <div style={{ marginTop: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ color: "#F9FAFB", fontWeight: 600 }}>{countryData.country}</span>
              <span style={{
                background: RISK_COLORS[countryData.risk_level],
                color: "#000", fontSize: "10px", fontWeight: 700,
                padding: "2px 8px", borderRadius: "4px"
              }}>
                {countryData.risk_level} RISK
              </span>
            </div>
            <div style={{ color: "#6B7280", fontSize: "11px", marginBottom: "8px" }}>
              Redundancy Score: <span style={{ color: "#38BDF8", fontWeight: 700 }}>{countryData.redundancy_score}</span> cable{countryData.redundancy_score !== 1 ? "s" : ""}
            </div>
            {countryData.serving_cables.map((cable) => (
              <div key={cable.id} style={{
                background: "#030712", border: "1px solid #1F2937",
                borderRadius: "6px", padding: "8px", marginBottom: "6px"
              }}>
                <div style={{ color: "#F9FAFB", fontSize: "12px", fontWeight: 600 }}>{cable.name}</div>
                <div style={{ color: "#6B7280", fontSize: "11px" }}>{cable.length_km.toLocaleString()} km · {cable.ready_for_service}</div>
                <div style={{ color: "#818CF8", fontSize: "11px" }}>{cable.owners.join(", ")}</div>
              </div>
            ))}
          </div>
        )}

        {/* Selected cable info */}
        {selectedCable && (
          <div style={{ marginTop: "12px", borderTop: "1px solid #1F2937", paddingTop: "12px" }}>
            <div style={{ color: "#38BDF8", fontSize: "10px", letterSpacing: "2px", marginBottom: "6px" }}>
              SELECTED CABLE
            </div>
            <div style={{ color: "#F9FAFB", fontSize: "13px", fontWeight: 600 }}>{selectedCable.name}</div>
            <div style={{ color: "#6B7280", fontSize: "11px", marginTop: "4px" }}>{selectedCable.length_km.toLocaleString()} km</div>
            <div style={{ color: "#818CF8", fontSize: "11px" }}>{selectedCable.owners.join(", ")}</div>
            <div style={{ color: "#6B7280", fontSize: "11px" }}>Since {selectedCable.ready_for_service}</div>
          </div>
        )}
      </div>

      {/* ── SECTION E: Download ── */}
      <button
        onClick={downloadSampleData}
        style={{
          background: "transparent", border: "1px solid #38BDF8",
          color: "#38BDF8", borderRadius: "6px", padding: "10px",
          fontSize: "12px", cursor: "pointer", fontWeight: 600,
          letterSpacing: "1px"
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(56,189,248,0.1)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        ↓ DOWNLOAD SAMPLE DATA
      </button>
    </div>
  );
}
