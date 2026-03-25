# Cyber Threat AI Dashboard (CTI Dashboard)

## Overview
Cyber Threat Intelligence (CTI) dashboard that correlates cyber threat data and visualizes it for SOC analysis. The frontend is a Next.js App Router UI (TypeScript + Tailwind) that consumes FastAPI endpoints and renders security insights such as:
- Dashboard stats and charts
- “Top Threats” and “AI Insight” summaries (computed purely on the client from fetched alerts)
- Alerts browsing (search, filter, sorting, pagination, CSV export)
- CVE Intel exploration (with external NVD links)
- Threat report cards (including PDF export)
- Mock authentication (frontend-only) and JSON export of the dashboard summary

## Architecture
### Backend (FastAPI)
Located in `backend/`.
- Exposes HTTP endpoints for:
  - running the analysis pipeline
  - fetching generated `alerts.json`
  - fetching generated `threat_report.json`
- Adds CORS configuration for local frontend development.

### Frontend (Next.js App Router)
Located in `frontend/nextjs-dashboard/`.
- Uses `app/` routes (App Router) and reusable UI components under `src/components/`.
- Fetches alerts from `http://127.0.0.1:8000/alerts` and computes derived views:
  - top threats
  - AI insight message
  - JSON export payload
- Includes mock login/logout via `localStorage` + route guarding.

## Features
- Dashboard overview:
  - Stats cards (total alerts, critical alerts, ML anomalies, SOC status)
  - Charts (threat activity timeline + distribution)
  - “Top Threats” (client-side ranking)
  - “AI Insight” (client-side generated message)
  - “Export Summary” (download `dashboard-summary.json`)
- Alerts page:
  - Search, SOC-level filtering, time window filtering
  - Sorting and pagination
  - Copy-to-clipboard and CSV export
- CVE page:
  - Search and details display with external NVD links
- Threat report page:
  - Cards display and PDF export
- Login / Logout (mock authentication):
  - Logout clears `localStorage` and redirects to `/login`
  - Protected routes redirect to `/login` when unauthenticated

## Technologies Used
### Backend
- Python
- FastAPI
- Uvicorn
- pandas
- scikit-learn
- Requests

### Frontend
- Next.js (App Router) + React
- TypeScript
- Tailwind CSS
- Chart.js (via `react-chartjs-2`)
- lucide-react icons
- html2canvas + jspdf (PDF export)

## Installation
### Backend (FastAPI)
From the repository root:
1. Create/activate the virtual environment (Windows):
   - `.\venv\Scripts\activate`
2. Install dependencies:
   - `pip install -r requirements.txt`
3. Run the API:
   - `python -m backend.api`

The API should be available at `http://127.0.0.1:8000`.

### Frontend (Next.js)
1. Go to the frontend folder:
   - `cd frontend/nextjs-dashboard`
2. Install dependencies:
   - `npm install`
3. Start dev server:
   - `npm run dev`

The dashboard UI should be available at `http://localhost:3000`.
Note: the root route redirects to `/login`.

## API Endpoints
Base URL: `http://127.0.0.1:8000`

- `GET /`
  - Health/status endpoint
- `POST /run-analysis`
  - Runs the analysis pipeline and generates output files used by the UI
- `GET /threat-report`
  - Returns the contents of `data/threat_report.json`
- `GET /alerts`
  - Returns alerts from `data/alerts.json`

## Screenshots
Add screenshots here before defense:
- Dashboard overview screenshot
- Alerts page screenshot
- CVE page screenshot
- Threat report page screenshot

## Author
- Your Name / Your Team
