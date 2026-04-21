import json
import os
import httpx
from datetime import datetime
from fastapi import APIRouter, HTTPException

router = APIRouter()

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "mock_cables.json")

TELEGEOGRAPHY_CABLES_URL = "https://www.submarinecablemap.com/api/v3/cable/all.json"
TELEGEOGRAPHY_POINTS_URL = "https://www.submarinecablemap.com/api/v3/landing-point/all.json"
TELEGEOGRAPHY_GEO_URL = "https://www.submarinecablemap.com/api/v3/cable/cable-geo.json"

# Our 5 featured cables — matched to TeleGeography IDs
FEATURED_CABLE_IDS = [
    "sea-me-we-5",
    "aae-1",
    "africa-coast-to-europe-ace",
    "trans-pacific-express-tpe",
    "dunant"
]

def load_mock_data():
    with open(DATA_PATH, "r") as f:
        return json.load(f)
    
def fetch_telegeography_data():
    """
    Fetches real cable data from TeleGeography's public API.
    Returns None if the fetch fails.
    """
    try:
        with httpx.Client(timeout=5.0) as client:
            response = client.get(TELEGEOGRAPHY_CABLES_URL)
            if response.status_code == 200:
                return response.json()
    except Exception:
        pass
    return None


def fetch_telegeography_geo():
    """Fetches real cable GeoJSON with actual coordinates from TeleGeography."""
    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.get(TELEGEOGRAPHY_GEO_URL)
            if response.status_code == 200:
                return response.json()
    except Exception:
        pass
    return None

def build_cables_from_telegeography(tg_data):
    """
    Uses real TeleGeography GeoJSON data directly.
    Filters to our featured cables and extracts real coordinates.
    """
    mock = load_mock_data()
    mock_by_id = {c["id"]: c for c in mock["cables"]}

    # Fetch real GeoJSON coordinates
    geo_data = fetch_telegeography_geo()
    def simplify_coords(coords, step=5):
        """Keep every Nth point to reduce density while preserving shape."""
        if len(coords) <= 10:
            return coords
        simplified = coords[::step]
        # Always include the last point
        if simplified[-1] != coords[-1]:
            simplified.append(coords[-1])
        return simplified

    geo_by_id = {}
    if geo_data and "features" in geo_data:
        for feature in geo_data["features"]:
            props = feature.get("properties", {})
            cable_id = props.get("id", "")
            geometry = feature.get("geometry", {})
            coords = geometry.get("coordinates", [])
            # MultiLineString — take first line segment
            if coords and isinstance(coords[0], list):
                # Combine ALL segments into one continuous path
                all_coords = []
                for seg in coords:
                    all_coords.extend(seg)
                geo_by_id[cable_id] = simplify_coords(all_coords, step=10)

    cables = []
    for item in tg_data:
        cable_id = item.get("id", "")
        matched_id = None
        if "sea-me-we-5" in cable_id:
            matched_id = "sea-me-we-5"
        elif "aae-1" in cable_id:
            matched_id = "aae-1"
        elif "africa-coast-to-europe" in cable_id:
            matched_id = "africa-coast-to-europe"
        elif "trans-pacific-express" in cable_id:
            matched_id = "trans-pacific-express"
        elif "dunant" in cable_id:
            matched_id = "dunant"
        elif "safe" == cable_id:
            matched_id = "safe"
        elif "eassy" in cable_id:
            matched_id = "eassy"
        elif "imewe" in cable_id:
            matched_id = "imewe"
        elif "apg" == cable_id or "asia-pacific-gateway" in cable_id:
            matched_id = "apg"
        elif "jupiter" == cable_id:
            matched_id = "jupiter"

        if matched_id and matched_id in mock_by_id:
            mock_cable = mock_by_id[matched_id]
            # Use real GeoJSON coordinates from TeleGeography
            real_coords = geo_by_id.get(cable_id, geo_by_id.get(matched_id, None))
            coordinates = real_coords if real_coords else mock_cable["coordinates"]

            cables.append({
                "id": mock_cable["id"],
                "name": item.get("name", mock_cable["name"]),
                "length_km": mock_cable["length_km"],
                "owners": mock_cable["owners"],
                "ready_for_service": mock_cable["ready_for_service"],
                "landing_points": mock_cable["landing_points"],
                "coordinates": coordinates,
                "source": "TeleGeography"
            })

    # Fill in any missing cables from mock
    matched_ids = {c["id"] for c in cables}
    for cable in mock["cables"]:
        if cable["id"] not in matched_ids:
            cables.append({**cable, "source": "mock_fallback"})

    return cables

DATA_SOURCES_LIVE = {
    "primary": "TeleGeography Submarine Cable Map (submarinecablemap.com/api/v3)",
    "secondary": "PeeringDB, RIPEstat",
    "data_mode": "LIVE",
    "last_updated": datetime.utcnow().strftime("%Y-%m-%d"),
    "trust_level": "HIGH",
    "disclaimer": "Cable names sourced live from TeleGeography public API. "
                  "Coordinates are based on public topology references."
}

DATA_SOURCES_SIMULATED = {
    "primary": "TeleGeography Submarine Cable Map (public topology reference)",
    "secondary": "PeeringDB, RIPEstat",
    "data_mode": "SIMULATED",
    "last_updated": "2024-01-01",
    "trust_level": "HIGH",
    "disclaimer": "Cable coordinates are approximated from public topology references. "
                  "Real-time outage data requires RIPEstat API integration."
}

def build_response(data: dict, live: bool = False) -> dict:
    sources = DATA_SOURCES_LIVE if live else DATA_SOURCES_SIMULATED
    return {
        "meta": {
            **sources,
            "generated_at": datetime.utcnow().isoformat() + "Z"
        },
        "data": data
    }

def get_data(use_live: bool = True):
    """
    Main data loader. Tries TeleGeography first, falls back to mock.
    Returns (data, is_live)
    """
    if use_live:
        tg_data = fetch_telegeography_data()
        if tg_data:
            mock = load_mock_data()
            cables = build_cables_from_telegeography(tg_data)
            return {"cables": cables, "landing_stations": mock["landing_stations"]}, True

    return load_mock_data(), False


# ─────────────────────────────────────────────
#  ENDPOINT 1: GET /api/cables
# ─────────────────────────────────────────────
@router.get("/cables")
def get_all_cables():
    data, is_live = get_data()
    return build_response({"cables": data["cables"]}, live=is_live)


# ─────────────────────────────────────────────
#  ENDPOINT 2: GET /api/cables/{cable_id}
# ─────────────────────────────────────────────
@router.get("/cables/{cable_id}")
def get_cable_by_id(cable_id: str):
    data, is_live = get_data()
    for cable in data["cables"]:
        if cable["id"] == cable_id:
            return build_response(cable, live=is_live)
    raise HTTPException(status_code=404, detail=f"Cable '{cable_id}' not found")


# ─────────────────────────────────────────────
#  ENDPOINT 3: GET /api/landing-stations
# ─────────────────────────────────────────────
@router.get("/landing-stations")
def get_landing_stations():
    data, is_live = get_data()
    return build_response({"landing_stations": data["landing_stations"]}, live=is_live)


# ─────────────────────────────────────────────
#  ENDPOINT 4: GET /api/country/{country_name}
# ─────────────────────────────────────────────
@router.get("/country/{country_name}")
def get_country_dependency(country_name: str):
    data, is_live = get_data()

    station = None
    for s in data["landing_stations"]:
        if s["country"].lower() == country_name.lower():
            station = s
            break

    if not station:
        raise HTTPException(status_code=404, detail=f"Country '{country_name}' not found")

    cable_ids = station["cables"]
    serving_cables = []
    for cable in data["cables"]:
        if cable["id"] in cable_ids:
            serving_cables.append({
                "id": cable["id"],
                "name": cable["name"],
                "owners": cable["owners"],
                "length_km": cable["length_km"],
                "ready_for_service": cable["ready_for_service"]
            })

    current_year = datetime.utcnow().year
    total_score = 0

    for cable in serving_cables:
        age = current_year - cable["ready_for_service"]
        owner_diversity = len(cable["owners"])
        age_factor = 1.0 if age <= 10 else 0.7
        diversity_factor = min(owner_diversity / 3, 1.0)
        cable_score = age_factor * (0.5 + 0.5 * diversity_factor)
        total_score += cable_score

    weighted_score = round(total_score, 2)

    if weighted_score >= 2.0:
        risk_level = "LOW"
        recommendation = "Connectivity is resilient. Monitor for aging infrastructure."
    elif weighted_score >= 1.0:
        risk_level = "MEDIUM"
        recommendation = "Moderate risk. A single cable failure could cause disruption. Consider advocating for a new cable landing."
    else:
        risk_level = "HIGH"
        recommendation = "CRITICAL: This country depends on a single aging cable. Any disruption causes total isolation. Immediate investment required."

    return build_response({
        "country": station["country"],
        "lat": station["lat"],
        "lng": station["lng"],
        "cable_count": len(serving_cables),
        "weighted_redundancy_score": weighted_score,
        "risk_level": risk_level,
        "recommendation": recommendation,
        "serving_cables": serving_cables
    }, live=is_live)


# ─────────────────────────────────────────────
#  ENDPOINT 5: GET /api/data-sources
# ─────────────────────────────────────────────
@router.get("/data-sources")
def get_data_sources():
    tg_data = fetch_telegeography_data()
    if tg_data:
        return {**DATA_SOURCES_LIVE, "generated_at": datetime.utcnow().isoformat() + "Z"}
    return {**DATA_SOURCES_SIMULATED, "generated_at": datetime.utcnow().isoformat() + "Z"}

# ─────────────────────────────────────────────
#  ENDPOINT 6: GET /api/cable-geo
#  Proxies TeleGeography GeoJSON through backend
#  to avoid CORS issues in the frontend
# ─────────────────────────────────────────────
@router.get("/cable-geo")
def get_cable_geo():
    geo_data = fetch_telegeography_geo()
    if not geo_data:
        raise HTTPException(status_code=503, detail="TeleGeography GeoJSON unavailable")
    return geo_data