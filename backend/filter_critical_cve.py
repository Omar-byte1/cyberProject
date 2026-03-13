import json 
import os

# Configuration des chemins absolus
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

input_file = os.path.join(base_dir, "data", "clean_cve.json")
output_file = os.path.join(base_dir, "data", "critical_cve.json")

# Vérifier si le fichier existe
if not os.path.exists(input_file):
    print(f"Erreur : fichier non trouvé {input_file}")
    exit(1)

# Charger le dataset
with open(input_file, "r", encoding="utf-8") as f:
    data = json.load(f)

critical_data = []

# Filtrage des CVE critiques
for vul in data:

    severity = vul.get("severity", "N/A")

    if severity in ["HIGH", "CRITICAL"]:

        critical_data.append({
            "cve_id": vul.get("cve_id", "N/A"),
            "score": vul.get("score", "N/A")
        })

# Sauvegarde
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(critical_data, f, indent=4, ensure_ascii=False)

print(f"Fichier CVE critiques créé : {output_file}")