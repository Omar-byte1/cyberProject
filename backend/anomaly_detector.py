import pandas as pd
import os
import json
from sklearn.ensemble import IsolationForest
import numpy as np
import math

class AnomalyDetector:
    def __init__(self):
        self.base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.log_file = os.path.join(self.base_dir, "data", "sample.log")
        self.alerts_file = os.path.join(self.base_dir, "data", "alerts.json")
        self.model = IsolationForest(contamination=0.1, random_state=42)

    def extract_features(self, log_lines):
        """
        Extrait des caractéristiques numériques avancées des lignes de logs pour le ML.
        """
        features = []
        for line in log_lines:
            line = line.strip()
            parts = line.split(',')
            if len(parts) < 3:
                continue
            
            # Feature 1: Longueur de la ligne
            length = len(line)
            
            # Feature 2: Niveau de sévérité (numérique)
            level_map = {"INFO": 0, "WARNING": 1, "ERROR": 2, "CRITICAL": 3}
            level_str = parts[1]
            level = level_map.get(level_str, 0)
            
            # Feature 3: Score de mots clés pondérés (STEP 2)
            danger_keywords = {
                "rm -rf": 5.0,
                "sudo": 2.0,
                "failed": 0.5,
                "root": 1.5,
                "admin": 1.0,
                "exploit": 4.0,
                "malicious": 3.0,
                "cve": 2.5,
                "base64": 2.0,
                "\\x": 4.5  # Shellcode / Hex
            }
            weighted_score = sum(weight for kw, weight in danger_keywords.items() if kw in line.lower())

            # --- NOUVELLES FEATURES (STEP 1) ---
            # ... (Entropie moved down for clarity)

            # Feature 4: Entropie de Shannon
            entropy = 0
            if length > 0:
                prob = [float(line.count(c)) / length for c in set(line)]
                entropy = - sum([p * math.log(p, 2) for p in prob])

            # Feature 5: Compte de caractères spéciaux
            special_chars = set("!@#$%^&*()[]{};:'\"<>, /\\|")
            spec_count = sum(1 for c in line if c in special_chars)

            # Feature 6: Ratio de chiffres
            digit_count = sum(1 for c in line if c.isdigit())
            digit_ratio = digit_count / length if length > 0 else 0

            # Feature 7: Profondeur de Chemin (STEP 2)
            path_depth = line.count('/')
            
            features.append([length, level, weighted_score, entropy, spec_count, digit_ratio, path_depth])
        
        return np.array(features)

    def train_and_detect(self):
        if not os.path.exists(self.log_file):
            return "Fichier log introuvable."

        with open(self.log_file, "r", encoding="utf-8") as f:
            log_lines = f.readlines()

        if not log_lines:
            return "Fichier log vide."

        X = self.extract_features(log_lines)
        
        if len(X) < 2:
            return "Pas assez de données pour l'entraînement."

        # Entraînement et prédiction (-1 pour anomalie, 1 pour normal)
        predictions = self.model.fit_predict(X)
        
        anomalies = []
        for i, pred in enumerate(predictions):
            if pred == -1:
                anomalies.append({
                    "cve_id": "ML-ANOMALY",
                    "log": log_lines[i].strip(),
                    "alert": "Anomalie détectée par Isolation Forest",
                    "severity": 8.5  # Score arbitraire pour le ML
                })

        # Sauvegarde/Mise à jour des alertes
        existing_alerts = []
        if os.path.exists(self.alerts_file):
            with open(self.alerts_file, "r", encoding="utf-8") as f:
                try:
                    existing_alerts = json.load(f)
                except json.JSONDecodeError:
                    existing_alerts = []

        # Fusionner sans doublons (basé sur le log exact)
        existing_logs = [a["log"] for a in existing_alerts]
        for anomaly in anomalies:
            if anomaly["log"] not in existing_logs:
                existing_alerts.append(anomaly)

        with open(self.alerts_file, "w", encoding="utf-8") as f:
            json.dump(existing_alerts, f, indent=4, ensure_ascii=False)

        return f"Détection terminée : {len(anomalies)} anomalies ML trouvées."

if __name__ == "__main__":
    detector = AnomalyDetector()
    print(detector.train_and_detect())
