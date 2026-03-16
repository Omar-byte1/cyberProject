import os
import json
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .ai_engine import AIEngine

app = FastAPI(title="Cyber Threat Intelligence API")

# Configuration CORS pour Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # URL par défaut de Next.js
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration des chemins absolus
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPORT_FILE = os.path.join(BASE_DIR, "data", "threat_report.json")
ALERTS_FILE = os.path.join(BASE_DIR, "data", "alerts.json")

engine = AIEngine()

@app.get("/")
def root():
    return {
        "project": "Cyber Threat AI Project",
        "status": "online",
        "endpoints": ["/run-analysis", "/threat-report", "/alerts"]
    }

@app.post("/run-analysis")
def run_analysis():
    """
    Lance l'analyse AI Engine et retourne le statut.
    """
    result = engine.analyze_alerts()
    return {
        "status": "analysis_completed",
        "message": result
    }

@app.get("/threat-report")
def get_report():
    """
    Retourne le contenu du fichier threat_report.json.
    """
    if not os.path.exists(REPORT_FILE):
        return {"error": "Threat report not found. Run /run-analysis first."}

    with open(REPORT_FILE, "r", encoding="utf-8") as f:
        report = json.load(f)
    return report

@app.get("/alerts")
def get_alerts():
    """
    Retourne les alertes brutes consolidées.
    """
    if not os.path.exists(ALERTS_FILE):
        return {"error": "No alerts found."}

    with open(ALERTS_FILE, "r", encoding="utf-8") as f:
        alerts = json.load(f)
    return alerts

if __name__ == "__main__":
    # Lancement du serveur uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=False)