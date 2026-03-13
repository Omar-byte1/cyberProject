import json
import os

# Configuration des chemins
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cve_file = os.path.join(base_dir, "data", "critical_cve.json")
log_file = os.path.join(base_dir, "data", "sample.log")
output_file = os.path.join(base_dir, "data", "alerts.json")

# Vérification des fichiers
if not os.path.exists(cve_file):
    print(f"Erreur : le fichier CVE {cve_file} est introuvable. Exécutez d'abord filter_critical_cve.py")
    exit(1)

if not os.path.exists(log_file):
    print(f"Erreur : le fichier de logs {log_file} est introuvable.")
    exit(1)

# Charger les CVE critiques
with open(cve_file, "r", encoding="utf-8") as f:
    cves = json.load(f)

# Lire les logs
with open(log_file, "r", encoding="utf-8") as f:
    logs = f.readlines()

alerts = []

# Corrélation des logs avec les IDs de CVE
for cve in cves:
    cve_id = cve.get("cve_id")
    if not cve_id:
        continue

    for log in logs:
        if cve_id in log:
            alerts.append({
                "cve_id": cve_id,
                "log": log.strip(),
                "alert": "Possible exploitation detected",
                "severity": cve.get("score", "N/A")
            })

# Sauvegarde des alertes générées
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(alerts, f, indent=4, ensure_ascii=False)

print(f"Analyse terminée — alertes générées dans : {output_file}")