import json
import os

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
file_path = os.path.join(base_dir, "data", "cve_sample.json")

# Vérifier si le fichier existe
if not os.path.exists(file_path):
    print(f"Erreur : Le fichier {file_path} est introuvable. Avez-vous lancé collectors.py ?")
else:
    with open(file_path, "r") as f:
        data = json.load(f)

    if "vulnerabilities" in data:
        for vuln in data["vulnerabilities"]:
            cve = vuln.get("cve", {})
            cve_id = cve.get("id", "N/A")
            
            # Récupération de la description
            descriptions = cve.get("descriptions", [])
            description = descriptions[0].get("value", "Pas de description") if descriptions else "Pas de description"
            
            # Tentative de récupération du score CVSS (V3 puis V2)
            metrics = cve.get("metrics", {})
            score = "N/A"
            if "cvssMetricV31" in metrics:
                score = metrics["cvssMetricV31"][0]["cvssData"]["baseScore"]
            elif "cvssMetricV30" in metrics:
                score = metrics["cvssMetricV30"][0]["cvssData"]["baseScore"]
            elif "cvssMetricV2" in metrics:
                score = metrics["cvssMetricV2"][0]["cvssData"]["baseScore"]

            print(f"CVE : {cve_id}")
            print(f"Score : {score}")
            print(f"Description : {description[:100]}...") # Tronqué pour la lisibilité
            print("-" * 30)
    else:
        print("Format de données invalide dans le fichier JSON.")
