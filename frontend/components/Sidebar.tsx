"use client";

import { useState } from "react";
import { Cable, fetchCountryDependency } from "@/lib/api";

interface SidebarProps {
  selectedCable: Cable | null;
  onCountrySelect: (country: string) => void;
}

// Updated to match new backend response shape
interface CountryDependency {
  country: string;
  lat: number;
  lng: number;
  cable_count: number;
  weighted_redundancy_score: number;
  risk_level: "LOW" | "MEDIUM" | "HIGH";
  recommendation: string;
  serving_cables: {
    id: string;
    name: string;
    owners: string[];
    length_km: number;
    ready_for_service: number;
  }[];
}

interface ApiMeta {
  primary: string;
  data_mode: string;
  trust_level: string;
  disclaimer: string;
  generated_at: string;
}

const RISK_COLORS = {
  LOW: "#34D399",
  MEDIUM: "#F59E0B",
  HIGH: "#F87171",
};

const RISK_BG = {
  LOW: "rgba(52,211,153,0.1)",
  MEDIUM: "rgba(245,158,11,0.1)",
  HIGH: "rgba(248,113,113,0.1)",
};

const COUNTRIES = [
  "France", "India", "Singapore", "Egypt",
  "USA", "South Africa", "Nigeria", "China",
  "Japan", "Saudi Arabia"
];

export default function Sidebar({ selectedCable, onCountrySelect }: SidebarProps) {
  const [countryData, setCountryData] = useState<CountryDependency | null>(null);
  const [meta, setMeta] = useState<ApiMeta | null>(null);
  const [loadingCountry, setLoadingCountry] = useState(false);

  const handleCountrySelect = async (country: string) => {
    if (!country) return;
    setLoadingCountry(true);
    try {
      // fetchCountryDependency now returns the full wrapped response
      const res = await fetch(`http://localhost:8000/api/country/${country}`);
      const json = await res.json();
      setCountryData(json.data);
      setMeta(json.meta);
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
      source: meta?.primary || "Mock topology data",
      data_mode: meta?.data_mode || "SIMULATED",
      country_selected: countryData?.country || "None",
      weighted_redundancy_score: countryData?.weighted_redundancy_score || null,
      risk_level: countryData?.risk_level || null,
      recommendation: countryData?.recommendation || null,
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
          onChange={(e) => handleCountrySelect(e.target.value)}
          style={{
            width: "100%", background: "#030712", color: "#F9FAFB",
            border: "1px solid #1F2937", borderRadius: "6px",
            padding: "8px", fontSize: "12px", cursor: "pointer"
          }}
        >
          <option value="">Select a country...</option>
          {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        {loadingCountry && (
          <p style={{ color: "#38BDF8", fontSize: "12px", marginTop: "8px" }}>Loading...</p>
        )}

        {countryData && !loadingCountry && (
          <div style={{ marginTop: "12px" }}>

            {/* Country header + risk badge */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ color: "#F9FAFB", fontWeight: 600, fontSize: "14px" }}>{countryData.country}</span>
              <span style={{
                background: RISK_COLORS[countryData.risk_level],
                color: "#000", fontSize: "10px", fontWeight: 700,
                padding: "2px 8px", borderRadius: "4px"
              }}>
                {countryData.risk_level} RISK
              </span>
            </div>

            {/* Weighted score */}
            <div style={{ color: "#6B7280", fontSize: "11px", marginBottom: "4px" }}>
              Weighted Resilience Score:{" "}
              <span style={{ color: "#38BDF8", fontWeight: 700 }}>
                {countryData.weighted_redundancy_score}
              </span>
            </div>
            <div style={{ color: "#6B7280", fontSize: "11px", marginBottom: "12px" }}>
              Cables serving this country:{" "}
              <span style={{ color: "#F9FAFB", fontWeight: 600 }}>{countryData.cable_count}</span>
            </div>

            {/* ── DECISION RECOMMENDATION ── */}
            <div style={{
              background: RISK_BG[countryData.risk_level],
              border: `1px solid ${RISK_COLORS[countryData.risk_level]}`,
              borderRadius: "6px", padding: "10px", marginBottom: "12px"
            }}>
              <div style={{ color: RISK_COLORS[countryData.risk_level], fontSize: "10px", letterSpacing: "1px", marginBottom: "4px", fontWeight: 700 }}>
                ALLOCATOR RECOMMENDATION
              </div>
              <p style={{ color: "#F9FAFB", fontSize: "12px", lineHeight: 1.5 }}>
                {countryData.recommendation}
              </p>
            </div>

            {/* Serving cables list */}
            {countryData.serving_cables.map((cable) => (
              <div key={cable.id} style={{
                background: "#030712", border: "1px solid #1F2937",
                borderRadius: "6px", padding: "8px", marginBottom: "6px"
              }}>
                <div style={{ color: "#F9FAFB", fontSize: "12px", fontWeight: 600 }}>{cable.name}</div>
                <div style={{ color: "#6B7280", fontSize: "11px" }}>
                  {cable.length_km.toLocaleString()} km · Since {cable.ready_for_service}
                </div>
                <div style={{ color: "#818CF8", fontSize: "11px" }}>{cable.owners.join(", ")}</div>
              </div>
            ))}

            {/* ── DATA SOURCE LABEL ── */}
            {meta && (
              <div style={{
                marginTop: "8px", borderTop: "1px solid #1F2937", paddingTop: "8px"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                  <div style={{
                    background: meta.data_mode === "LIVE" ? "#34D399" : "#F59E0B",
                    borderRadius: "3px", padding: "1px 6px",
                    fontSize: "9px", fontWeight: 700, color: "#000"
                  }}>
                    {meta.data_mode}
                  </div>
                  <span style={{ color: "#6B7280", fontSize: "10px" }}>
                    Trust: {meta.trust_level}
                  </span>
                </div>
                <p style={{ color: "#4B5563", fontSize: "10px", lineHeight: 1.4 }}>
                  {meta.disclaimer}
                </p>
              </div>
            )}
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
