import json
import os

class AIEngine:

    def __init__(self):

        self.base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

        self.alerts_file = os.path.join(self.base_dir, "data", "alerts.json")
        self.report_file = os.path.join(self.base_dir, "data", "threat_report.json")

    def analyze_alerts(self):

        if not os.path.exists(self.alerts_file):
            return "Aucune alerte à analyser."

        with open(self.alerts_file, "r", encoding="utf-8") as f:
            alerts = json.load(f)

        if not alerts:
            return "Le fichier d'alertes est vide."

        insights = []

        for alert in alerts:
            cve_id = alert.get("cve_id", "N/A")
            severity = alert.get("severity", 0)
            log_content = alert.get("log", "")

            # Threat score (simple)
            anomaly_score = 1 if cve_id == "ML-ANOMALY" else 0
            try:
                base_severity = float(severity)
            except (ValueError, TypeError):
                base_severity = 0

            threat_score = base_severity + anomaly_score

            # Détermination du niveau SOC
            if threat_score >= 9:
                level = "SOC Level 3 - Critical Threat"
            elif threat_score >= 7:
                level = "SOC Level 2 - High Risk"
            else:
                level = "SOC Level 1 - Warning"

            # Personnalisation de la prédiction et recommandation
            if cve_id == "ML-ANOMALY":
                prediction = "Comportement anormal détecté par l'IA (Machine Learning)"
                recommendation = "Investiguer manuellement le log pour confirmer l'intrusion."
            else:
                prediction = f"Exploitation potentielle de la vulnérabilité {cve_id}"
                recommendation = "Appliquer les correctifs de sécurité immédiatement."

            insight = {
                "cve_id": cve_id,
                "log_source": log_content,
                "severity": base_severity,
                "anomaly_score": anomaly_score,
                "threat_score": threat_score,
                "prediction": prediction,
                "recommendation": recommendation,
                "soc_level": level
            }
            insights.append(insight)

        with open(self.report_file, "w", encoding="utf-8") as f:
            json.dump(insights, f, indent=4, ensure_ascii=False)

        return f"Analyse terminée : {len(insights)} menaces détectées"

if __name__ == "__main__":

    engine = AIEngine()
    print(engine.analyze_alerts())