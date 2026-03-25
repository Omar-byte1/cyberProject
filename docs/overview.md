# Overview (travail effectué)

Ce document résume **les tâches réalisées** sur le dashboard CTI (Next.js/TS/Tailwind) pendant cette session, et où trouver les changements.

## Changements principaux

### Page Alerts — filtrage SOC Level
- **Ajout d’un filtre dynamique** par `soc_level` via un `<select>` (options SOC 1/2/3 + All).
- **État React**: `filter` (valeur par défaut: `"ALL"`).
- **Comportement**: `ALL` affiche toutes les alertes, sinon filtre strict sur `alert.soc_level`.

### Page Alerts — `threat_score` et `soc_level` “cohérents” même si le backend ne les fournit pas
Constat: l’endpoint FastAPI **`GET /alerts`** renvoie souvent des items sans `soc_level` / `threat_score` (ces champs sont plutôt dans `threat_report.json`).

Solution (frontend):
- Enrichissement des items côté client après le fetch:
  - `threat_score` est calculé de façon compatible avec `backend/ai_engine.py`:
    - \(threat\_score = severity + (cve\_id == "ML-ANOMALY" ? 1 : 0)\)
  - `soc_level` est déduit du `threat_score`:
    - \(>= 9\) → **SOC Level 3 - Critical Threat**
    - \(>= 7\) → **SOC Level 2 - High Risk**
    - sinon → **SOC Level 1 - Stable**
- **Objectif**: rendre le filtre SOC fonctionnel et donner une valeur stable au Threat Score sans casser le fetch existant.

### Page Alerts — tri (sorting) par sévérité
- **Ajout d’un tri** sur `severity`.
- **État React**:
  - `sortOrder`: `"ASC" | "DESC"` (défaut: `"DESC"`).
- **Règle**:
  - `DESC` → sévérité la plus haute en premier
  - `ASC` → sévérité la plus basse en premier
- **Sans mutation**: tri fait sur une copie `sortedAlerts = [...filteredAlerts].sort(...)`.
- **Ordre correct**: **filtrer d’abord**, **trier ensuite**.

### Page Alerts — amélioration esthétique (UI)
- Barre de contrôle refaite en “card” (fond léger + blur + border + shadow).
- Labels clairs au-dessus des inputs (Search / SOC level / Severity sort).
- Responsive: 1 colonne sur mobile, 3 colonnes sur desktop.
- Style Tailwind amélioré (focus ring, hover border, alignements).

## Fichiers modifiés

- `frontend/nextjs-dashboard/src/app/alerts/page.tsx`
  - Filtre SOC + tri severity
  - Enrichissement `soc_level`/`threat_score`
  - UI controls améliorée

## Comment tester rapidement

### Backend (FastAPI)
Depuis la racine:

```powershell
.\venv\Scripts\python.exe -m backend.api
```

Endpoints utiles:
- `GET http://127.0.0.1:8000/alerts`
- `POST http://127.0.0.1:8000/run-analysis`
- `GET http://127.0.0.1:8000/threat-report`

### Frontend (Next.js)

```powershell
cd frontend/nextjs-dashboard
npm run dev
```

Ouvrir:
- `http://localhost:3000/alerts`

Vérifications attendues:
- Le filtre SOC Level doit réduire/étendre la table selon la sélection.
- Le tri “Highest first / Lowest first” doit réordonner les lignes par `severity`.
- La colonne “Threat Score” doit afficher une valeur stable (même si `threat_score` n’est pas fourni par le backend).

## Notes Git (push)
- Si ta branche locale est `master`, pousser avec:

```powershell
git push -u origin master
```

- Si tu veux utiliser `main`:

```powershell
git branch -M main
git push -u origin main
```

