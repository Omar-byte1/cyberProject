import os
import json
import uvicorn
from datetime import timedelta

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .ai_engine import AIEngine
from .config.auth import authenticate_user
from .config.dependencies import get_current_user
from .config.jwt_utils import create_access_token


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


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class SandboxRequest(BaseModel):
    type: str  # "email" or "file"
    content: str


class IPActionRequest(BaseModel):
    ip: str
    action: str  # "block", "monitor", "ignore"


def require_admin(current_user: dict[str, str] = Depends(get_current_user)) -> dict[str, str]:
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin only")
    return current_user


@app.get("/")
def root():
    return {
        "project": "Cyber Threat AI Project",
        "status": "online",
        "endpoints": ["/login", "/run-analysis", "/threat-report", "/alerts", "/live-traffic", "/ip-lookup/{ip}", "/analyze-sandbox", "/playbooks"],
    }


@app.post("/login", response_model=TokenResponse)
def login(body: LoginRequest) -> TokenResponse:
    user = authenticate_user(body.username, body.password)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token(
        data={"username": user["username"], "role": user["role"]},
        expires_delta=timedelta(minutes=30),
    )

    return TokenResponse(access_token=token)


@app.post("/run-analysis")
def run_analysis(_: dict[str, str] = Depends(require_admin)):
    """
    Lance l'analyse AI Engine (admin uniquement).
    """
    result = engine.analyze_alerts()
    return {"status": "analysis_completed", "message": result}


@app.get("/threat-report")
def get_report(_: dict[str, str] = Depends(get_current_user)):
    """
    Retourne le contenu du fichier threat_report.json (protégé).
    """
    if not os.path.exists(REPORT_FILE):
        return {"error": "Threat report not found. Run /run-analysis first."}

    with open(REPORT_FILE, "r", encoding="utf-8") as f:
        report = json.load(f)
    return report


@app.get("/alerts")
def get_alerts(_: dict[str, str] = Depends(get_current_user)):
    """
    Retourne les alertes brutes consolidées (protégé).
    """
    if not os.path.exists(ALERTS_FILE):
        return {"error": "No alerts found."}

    with open(ALERTS_FILE, "r", encoding="utf-8") as f:
        alerts = json.load(f)
    return alerts

@app.get("/live-traffic")
def get_live_traffic():
    """
    Génère des données de trafic réseau simulées (temps réel).
    """
    return engine.generate_live_traffic(count=8)


@app.get("/ip-lookup/{ip}")
def ip_lookup(ip: str, _: dict[str, str] = Depends(get_current_user)):
    """
    Analyse une adresse IP (protégé).
    """
    return engine.analyze_ip(ip)


@app.post("/analyze-sandbox")
def analyze_sandbox(body: SandboxRequest, _: dict[str, str] = Depends(get_current_user)):
    """
    Analyse un contenu suspect (email/fichier) dans le sandbox.
    """
    return engine.analyze_context(body.type, body.content)


@app.post("/ip-action")
def ip_action(body: IPActionRequest, _: dict[str, str] = Depends(get_current_user)):
    """
    Enregistre une action SOC sur une IP (protégé).
    """
    print(f"SOC Action: {body.action} executed on {body.ip}")
    return {"status": "success", "message": f"Action {body.action} performed on {body.ip}"}


@app.get("/playbooks")
def get_playbooks(_: dict[str, str] = Depends(get_current_user)):
    """
    Retourne la liste des playbooks d'incident.
    """
    return engine.get_playbooks()


@app.get("/playbooks/{playbook_id}")
def get_playbook_details(playbook_id: str, _: dict[str, str] = Depends(get_current_user)):
    """
    Retourne les étapes d'un playbook spécifique.
    """
    return engine.get_playbook_steps(playbook_id)


if __name__ == "__main__":
    # Lancement du serveur uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=False)