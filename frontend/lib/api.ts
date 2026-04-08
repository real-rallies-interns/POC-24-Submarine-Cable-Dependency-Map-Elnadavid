// ─────────────────────────────────────────────────────────
//  lib/api.ts — The Data Bridge
//
//  This file is the ONLY place in the frontend that knows
//  about the backend URL. All components import from here.
//
//  This is a key full-stack concept: if the backend URL
//  ever changes, you update it in ONE place, not everywhere.
// ─────────────────────────────────────────────────────────

const API_BASE = "http://localhost:8000/api";

// TypeScript types — these must match what the backend returns
export interface Cable {
  id: string;
  name: string;
  length_km: number;
  owners: string[];
  ready_for_service: number;
  landing_points: string[];
  coordinates: [number, number][];
}

export interface LandingStation {
  country: string;
  lat: number;
  lng: number;
  cables: string[];
}

export interface CountryDependency {
  country: string;
  lat: number;
  lng: number;
  redundancy_score: number;
  risk_level: "LOW" | "MEDIUM" | "HIGH";
  serving_cables: {
    id: string;
    name: string;
    owners: string[];
    length_km: number;
    ready_for_service: number;
  }[];
}

// ── Fetch all cables ──────────────────────────────────────
export async function fetchCables(): Promise<Cable[]> {
  const res = await fetch(`${API_BASE}/cables`);
  if (!res.ok) throw new Error("Failed to fetch cables");
  const data = await res.json();
  return data.cables;
}

// ── Fetch all landing stations ────────────────────────────
export async function fetchLandingStations(): Promise<LandingStation[]> {
  const res = await fetch(`${API_BASE}/landing-stations`);
  if (!res.ok) throw new Error("Failed to fetch landing stations");
  const data = await res.json();
  return data.landing_stations;
}

// ── Fetch one country's dependency profile ────────────────
export async function fetchCountryDependency(
  country: string
): Promise<CountryDependency> {
  const res = await fetch(`${API_BASE}/country/${country}`);
  if (!res.ok) throw new Error(`Country '${country}' not found`);
  return res.json();
}