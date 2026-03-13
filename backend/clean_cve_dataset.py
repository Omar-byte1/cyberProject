import json
import os

# Configuration des chemins absolus
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
input_file = os.path.join(base_dir, "data", "cve_sample.json")
output_file = os.path.join(base_dir, "data", "clean_cve.json")

# Vérifier si le fichier source existe
if not os.path.exists(input_file):
    print(f"Erreur : Le fichier source {input_file} n'existe pas.")
    exit(1)

with open(input_file, "r", encoding="utf-8") as f:
    data = json.load(f)

clean_data = []

# Extraction et nettoyage des données
for vuln in data.get("vulnerabilities", []):
    cve = vuln.get("cve", {})
    cve_id = cve.get("id", "N/A")
    
    # Description
    descriptions = cve.get("descriptions", [])
    description = descriptions[0].get("value", "Pas de description") if descriptions else "Pas de description"

    # Extraction du score et de la sévérité (priorité V3.1 > V3.0 > V2)
    metrics = cve.get("metrics", {})
    score = "N/A"
    severity = "N/A"

    if "cvssMetricV31" in metrics:
        m = metrics["cvssMetricV31"][0]
        score = m["cvssData"]["baseScore"]
        severity = m.get("cvssData", {}).get("baseSeverity", "N/A")
    elif "cvssMetricV30" in metrics:
        m = metrics["cvssMetricV30"][0]
        score = m["cvssData"]["baseScore"]
        severity = m.get("cvssData", {}).get("baseSeverity", "N/A")
    elif "cvssMetricV2" in metrics:
        m = metrics["cvssMetricV2"][0]
        score = m["cvssData"]["baseScore"]
        severity = m.get("baseSeverity", "N/A")

    clean_data.append({
        "cve_id": cve_id,
        "description": description,
        "score": score,
        "severity": severity
    })

# Sauvegarde du fichier nettoyé (en dehors de la boucle)
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(clean_data, f, indent=4, ensure_ascii=False)

print(f"Dataset CVE propre créé avec succès : {output_file}")