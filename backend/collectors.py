# Ce fichier contiendra les fonctions de collecte de données pour les différentes sources.
import json
import requests

import os

URL = "https://services.nvd.nist.gov/rest/json/cves/2.0?resultsPerPage=5"

def collect_cve():
    response = requests.get(URL)
    if response.status_code == 200:
        data = response.json()
        
        # Obtenir le chemin absolu du dossier data à la racine du projet
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        data_path = os.path.join(base_dir, "data", "cve_sample.json")
        
        with open(data_path, "w") as f:
            json.dump(data, f, indent=4)
            print("CVE data saved")
    else:
        print("Error:", response.status_code)

if __name__ == "__main__":
    collect_cve()


