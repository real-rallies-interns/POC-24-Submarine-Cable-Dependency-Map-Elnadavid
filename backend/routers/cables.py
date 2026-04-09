import json
import os
from datetime import datetime
from fastapi import APIRouter, HTTPException

router = APIRouter()

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "mock_cables.json")

def load_data():
    with open(DATA_PATH, "r") as f:
        return json.load(f)

# ─────────────────────────────────────────────
#  DATA SOURCE METADATA
#  This is the "data validation" layer.
#  Every response now includes a metadata block
#  so the user always knows:
#  - Where the data came from
#  - Whether it's real or simulated
#  - When it was last updated
#  - How much to trust it
# ─────────────────────────────────────────────
DATA_SOURCES = {
    "primary": "TeleGeography Submarine Cable Map (public topology reference)",
    "secondary": "PeeringDB, RIPEstat",
    "data_mode": "SIMULATED",  # Change to "LIVE" when real API is connected
    "last_updated": "2024-01-01",
    "trust_level": "HIGH",     # Data structure is accurate; coordinates are approximated
    "disclaimer": "Cable coordinates are approximated from public topology references. "
                  "Real-time outage data requires RIPEstat API integration."
}

def build_response(data: dict) -> dict:
    """
    Wraps any response with metadata so the frontend
    can always show data source information.
    This is a key data validation pattern.
    """
    return {
        "meta": {
            **DATA_SOURCES,
            "generated_at": datetime.utcnow().isoformat() + "Z"
        },
        "data": data
    }


# ─────────────────────────────────────────────
#  ENDPOINT 1: GET /api/cables
# ─────────────────────────────────────────────
@router.get("/cables")
def get_all_cables():
    data = load_data()
    return build_response({"cables": data["cables"]})


# ─────────────────────────────────────────────
#  ENDPOINT 2: GET /api/cables/{cable_id}
# ─────────────────────────────────────────────
@router.get("/cables/{cable_id}")
def get_cable_by_id(cable_id: str):
    data = load_data()
    for cable in data["cables"]:
        if cable["id"] == cable_id:
            return build_response(cable)
    raise HTTPException(status_code=404, detail=f"Cable '{cable_id}' not found")


# ─────────────────────────────────────────────
#  ENDPOINT 3: GET /api/landing-stations
# ─────────────────────────────────────────────
@router.get("/landing-stations")
def get_landing_stations():
    data = load_data()
    return build_response({"landing_stations": data["landing_stations"]})


# ─────────────────────────────────────────────
#  ENDPOINT 4: GET /api/country/{country_name}
#  Now includes a weighted redundancy score and
#  a decision recommendation for allocators.
# ─────────────────────────────────────────────
@router.get("/country/{country_name}")
def get_country_dependency(country_name: str):
    data = load_data()

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

    # ── Weighted Redundancy Score ──────────────────────
    # Simple count is not enough for real decision making.
    # We weight by:
    # - Number of distinct owners (more owners = more resilient)
    # - Cable age (older cables are higher risk of failure)
    # This gives a more meaningful resilience picture.

    current_year = datetime.utcnow().year
    total_score = 0

    for cable in serving_cables:
        age = current_year - cable["ready_for_service"]
        owner_diversity = len(cable["owners"])

        # Age penalty: cables older than 10 years score lower
        age_factor = 1.0 if age <= 10 else 0.7

        # Owner diversity bonus: more owners = more accountability
        diversity_factor = min(owner_diversity / 3, 1.0)

        cable_score = age_factor * (0.5 + 0.5 * diversity_factor)
        total_score += cable_score

    weighted_score = round(total_score, 2)

    # ── Risk Classification ────────────────────────────
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
    })


# ─────────────────────────────────────────────
#  ENDPOINT 5: GET /api/data-sources
#  New endpoint — exposes data provenance
#  so the frontend can show a clear data label
# ─────────────────────────────────────────────
@router.get("/data-sources")
def get_data_sources():
    """
    Returns metadata about where this data comes from.
    Transparency is a core Real Rails principle.
    """
    return DATA_SOURCES