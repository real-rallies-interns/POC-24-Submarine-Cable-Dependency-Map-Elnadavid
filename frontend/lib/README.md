# 🌊 Submarine Cable Dependency Map — Real Rails PoC #24

> *"You aren't just building a map. You are building Infrastructure Transparency."*

A fullstack intelligence dashboard that visualizes the global submarine cable network — revealing which countries are well-connected and which are at high risk of digital isolation.

---

## 📸 Preview

![Submarine Cable Dependency Map](preview.png)ith an actual screenshot of your dashboard

---

## 🎯 Purpose

We think of the internet as "wireless" or "the cloud" — but **99% of international data** travels through underwater fiber-optic cables. If a single cable is cut by an anchor, an earthquake, or sabotage, entire nations can go offline.

This dashboard answers three critical questions:
- **Which countries are most dependent** on a single cable?
- **Who owns and controls** these billion-dollar physical rails?
- **What should an allocator do** to ensure business continuity?

---

## 🏗️ Architecture

```
┌─────────────────────────────┐     HTTP/JSON      ┌──────────────────────────┐
│      Next.js Frontend       │ ◄────────────────► │    FastAPI Backend        │
│  (React + Tailwind + Leaflet)│                    │  (Python + Pandas)        │
│       localhost:3000        │                    │     localhost:8000        │
└─────────────────────────────┘                    └──────────────────────────┘
                                                              │
                                                   ┌──────────────────────────┐
                                                   │     Data Sources          │
                                                   │  - TeleGeography (topology)│
                                                   │  - PeeringDB              │
                                                   │  - RIPEstat               │
                                                   │  - Mock data (v1)         │
                                                   └──────────────────────────┘
```

---

## 🧠 Intelligence Features

### Phase 1 (Complete)
- **Interactive Cable Map** — Leaflet-powered geospatial visualization of major submarine cable paths
- **Landing Point Markers** — Coastal stations where cables exit the ocean
- **Country Dependency View** — Click any country to see every cable it relies on
- **Weighted Resilience Score** — Mathematical scoring based on cable count, age, and owner diversity
- **Allocator Recommendation** — Plain-English decision support (LOW / MEDIUM / HIGH risk)
- **Data Transparency Layer** — Every response includes source metadata, trust level, and disclaimer
- **Who Controls the Rail** — Identifies consortiums (Google, Meta, Orange, Tata, China Telecom)
- **Downloadable Sample Data** — Export current analysis as JSON

### Phase 2 (Planned)
- Failure Simulation Tool (Turf.js) — "Cut" a cable and see redundancy scores drop
- Redundancy Benchmarking (D3.js) — Compare two regions side by side
- RIPEstat Outage Alerts — Live routing anomaly detection

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Components | shadcn/ui |
| Map | Leaflet, React Leaflet |
| Backend | Python FastAPI |
| Data | Pandas, mock topology (TeleGeography reference) |
| Styling | Real Rails DNA — #030712 Obsidian Black |

---

## 🚀 Running Locally

### Prerequisites
- Python 3.10+
- Node.js 18+

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install fastapi uvicorn pandas
uvicorn main:app --reload
# API running at http://localhost:8000
# Docs at http://localhost:8000/docs
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Dashboard running at http://localhost:3000
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/cables` | All submarine cables with coordinates |
| GET | `/api/cables/{id}` | Single cable details |
| GET | `/api/landing-stations` | All coastal landing points |
| GET | `/api/country/{name}` | Country dependency profile + recommendation |
| GET | `/api/data-sources` | Data provenance and trust metadata |

---

## 📊 Data Sources

| Source | Usage | Mode |
|---|---|---|
| TeleGeography Submarine Cable Map | Cable paths and topology | Simulated (v1) |
| PeeringDB | Network peering data | Planned |
| RIPEstat | Routing anomaly detection | Planned |

> **Note:** v1 uses public topology references for cable coordinates. Real-time outage data requires RIPEstat API integration (Phase 2).

---

## 🏢 Internship Context

**Program:** Real Rails Intelligence Library  
**PoC:** #24 — Submarine Cable Dependency Map  
**Category:** Data & Intelligence / Infrastructure  
**Intern:** Elnad  
**Coordinator:** Unnikrishnan P S  

---

*Built as part of the Real Rails internship program — mapping the physical infrastructure beneath the digital world.*