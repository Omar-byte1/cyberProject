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

    def generate_live_traffic(self, count=5):
        """
        Simule des paquets réseau en temps réel avec des scores d'anomalies.
        """
        import random
        import time

        protocols = ["TCP", "UDP", "HTTP", "HTTPS", "ICMP", "SSH", "FTP"]
        source_ips = ["192.168.1.10", "10.0.0.5", "172.16.2.30", "45.78.1.12", "185.23.4.99", "8.8.8.8"]
        dest_ips = ["192.168.1.1", "10.0.0.1", "172.16.1.100"]

        packets = []
        for _ in range(count):
            proto = random.choice(protocols)
            src = random.choice(source_ips)
            dst = random.choice(dest_ips)
            size = random.randint(40, 1500)
            
            # Simple heuristic for risk score
            risk_score = 0
            alert_msg = "Normal"
            
            # Simulate anomalies
            if src in ["45.78.1.12", "185.23.4.99"] or proto == "SSH" and random.random() > 0.8:
                risk_score = random.uniform(7.0, 9.8)
                alert_msg = "Attaque Brute-Force suspectée" if proto == "SSH" else "IP source sur liste noire"
            elif size > 1400 and proto == "ICMP":
                risk_score = random.uniform(6.0, 8.5)
                alert_msg = "Ping of Death suspecté"
            else:
                risk_score = random.uniform(0.1, 3.5)

            packets.append({
                "timestamp": time.strftime("%H:%M:%S"),
                "source": src,
                "destination": dst,
                "protocol": proto,
                "size": f"{size}B",
                "risk_score": round(risk_score, 2),
                "verdict": alert_msg
            })

        return packets

    def analyze_ip(self, ip):
        """
        Analyse une adresse IP pour déterminer sa réputation et sa localisation (mock).
        """
        import random
        
        # Simple simulation based on IP parts
        parts = ip.split('.')
        is_valid = len(parts) == 4 and all(p.isdigit() and 0 <= int(p) <= 255 for p in parts)
        
        if not is_valid:
            return {"error": "Format d'adresse IP invalide."}

        # IP Reputation mock logic
        last_digit = int(parts[-1])
        
        reputation = "Clean"
        risk_score = random.randint(0, 15)
        threat_types = []
        recommendation = "Aucune action requise."
        
        if last_digit % 7 == 0:
            reputation = "Malicious"
            risk_score = random.randint(85, 99)
            threat_types = ["Botnet C2", "DDoS Source"]
            recommendation = "Bloquer immédiatement sur tous les pare-feu."
        elif last_digit % 3 == 0:
            reputation = "Suspicious"
            risk_score = random.randint(40, 75)
            threat_types = ["Anonymous Proxy", "SSH Brute Force"]
            recommendation = "Surveiller étroitement le trafic en provenance de cette IP."

        # Mock Geo data
        countries = ["United States", "China", "Russia", "Germany", "France", "Brazil", "Morocco"]
        isps = ["Cloudflare", "DigitalOcean", "Amazon Data Services", "Comcast", "IA Maroc"]
        
        country = countries[last_digit % len(countries)]
        isp = isps[last_digit % len(isps)]

        return {
            "ip": ip,
            "reputation": reputation,
            "risk_score": risk_score,
            "geo": {
                "country": country,
                "city": "Unknown City",
                "isp": isp
            },
            "threat_types": threat_types,
            "recommendation": recommendation,
            "last_seen": "2026-03-29 17:35:00"
        }

    def analyze_context(self, analysis_type, content):
        """
        Analyse un email (Phishing) ou un fichier (Malware) - SIMULATION AVANCÉE.
        """
        import random
        import time
        from datetime import datetime

        if analysis_type == "email":
            # Heuristiques de phishing détaillées
            score = 0
            indicators = []
            
            # 1. Analyse de Contenu
            urgent_keywords = ["urgent", "immédiat", "suspendu", "clôture", "cliquez ici", "vérifier", "action requise"]
            if any(kw in content.lower() for kw in urgent_keywords):
                score += 35
                indicators.append({"type": "Content", "detail": "Urgence injustifiée détectée", "risk": "High"})
                
            if "http" in content.lower():
                score += 25
                indicators.append({"type": "Link", "detail": "Liens externes suspects (Redirection potentielle)", "risk": "Medium"})
                
            if any(kw in content.lower() for kw in ["mot de passe", "password", "identifiants"]):
                score += 20
                indicators.append({"type": "Privacy", "detail": "Requête de données sensibles", "risk": "High"})
                
            # 2. Simulation de Réputation (Mock)
            reputation_score = random.randint(0, 100)
            if reputation_score > 70:
                score += 30
                indicators.append({"type": "Reputation", "detail": "Expéditeur sur liste noire (Blacklisted)", "risk": "Critical"})
            
            # Verdict
            if score > 50:
                verdict = "Phishing Probable"
                recommendation = "Ne cliquez sur aucun lien. Signalez l'email et supprimez-le immédiatement."
            else:
                score = max(5, score)
                verdict = "Sain"
                recommendation = "L'email semble légitime, restez toujours vigilant."

            return {
                "type": "Email Phishing Analysis",
                "risk_score": min(score, 100),
                "verdict": verdict,
                "recommendation": recommendation,
                "status": "Completed",
                "timestamp": datetime.now().isoformat(),
                "indicators": indicators,
                "technical_details": {
                    "spf_check": "Pass" if reputation_score < 50 else "Fail",
                    "dkim_check": "Pass",
                    "sender_ip": f"192.{random.randint(10,255)}.{random.randint(1,255)}.42",
                    "tone_analysis": "Manipulative/Urgent" if score > 40 else "Neutral"
                }
            }

        elif analysis_type == "file":
            # Simulation plus technique pour un malware
            malware_families = {
                "WannaCry.A": {"type": "Ransomware", "danger": 98, "behavior": ["Shadow Copy Deletion", "File Encryption", "Tor Communication"]},
                "Emotet.v4": {"type": "Trojan / Stealer", "danger": 92, "behavior": ["Registry Run Key", "Hooking Browsers", "Keylogging"]},
                "Pegasus.Lite": {"type": "Spyware", "danger": 95, "behavior": ["Microphone Access", "GPS Tracking", "Exfiltration via HTTPS"]},
                "AgentTesla": {"type": "Infostealer", "danger": 88, "behavior": ["SMTP Exfiltration", "Process Hollowing", "Credential Scrapers"]},
                "CobaltStrike.Beacon": {"type": "Hacktool/C2", "danger": 90, "behavior": ["Reflective Injection", "C2 Communication", "SMB Pivoting"]}
            }
            
            is_malicious = random.random() > 0.3 # 70% chance of threat for the demo
            
            if is_malicious:
                name, info = random.choice(list(malware_families.items()))
                
                # Mock Behavioral Logs
                behavior_logs = [
                    f"[SYSTEM] Process started (PID: {random.randint(1000, 9999)})",
                    f"[FS] Created file: C:\\Windows\\Temp\\{name.lower()}.tmp",
                    f"[REG] Registry Key 'HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\SysUpdate' modified",
                    f"[NET] Connection attempt to C2 Server (8.8.4.4:443)",
                    f"[API] Call detected: CryptEncrypt (Sensitive API call)"
                ]
                
                return {
                    "type": "Binary Malware Analysis",
                    "risk_score": info["danger"],
                    "verdict": "Malware Détecté",
                    "family": name,
                    "malware_type": info["type"],
                    "recommendation": "Isoler la machine hôte immédiatement et initier le playbook d'incident (Containment).",
                    "status": "Malicious",
                    "timestamp": datetime.now().isoformat(),
                    "indicators": [
                        {"type": "Signature", "detail": f"Match: {name}", "risk": "Critical"},
                        {"type": "Behavior", "detail": info["type"], "risk": "High"},
                        {"type": "Entropy", "detail": f"{random.uniform(7.1, 7.9):.2f} (Packed/Obfuscated)", "risk": "High"}
                    ],
                    "behavior_logs": behavior_logs + [f"[THREAT] {b}" for b in info["behavior"]],
                    "mitre_attack": [
                        {"id": "T1059", "name": "Command and Scripting Interpreter"},
                        {"id": "T1547", "name": "Boot or Logon Autostart Execution"},
                        {"id": "T1027", "name": "Obfuscated Files or Information"}
                    ]
                }
            else:
                return {
                    "type": "Binary Malware Analysis",
                    "risk_score": 3,
                    "verdict": "Fichier Sain",
                    "recommendation": "Aucune menace détectée. Le fichier peut être ouvert en sécurité.",
                    "status": "Clean",
                    "timestamp": datetime.now().isoformat(),
                    "indicators": [
                        {"type": "Signature", "detail": "Aucune correspondance trouvée", "risk": "Low"},
                        {"type": "Heuristic", "detail": "Comportement normal détecté", "risk": "Low"}
                    ],
                    "behavior_logs": [
                        "[SYSTEM] Process started (PID: 1204)",
                        "[FS] Reading local configuration files",
                        "[API] Normal Windows API usage detected",
                        "[SYSTEM] Process exited gracefully (Code 0)"
                    ]
                }
        
        return {"error": "Type d'analyse inconnu."}
        
        
        return {"error": "Type d'analyse inconnu."}

    def get_playbooks(self):
        """
        Liste des scénarios d'incidents disponibles.
        """
        return [
            {
                "id": "ransomware",
                "title": "Ransomware Containment",
                "category": "Critical",
                "duration": "4-8h",
                "description": "Procédure d'urgence pour isoler les hôtes infectés par un ransomware et stopper l'exfiltration."
            },
            {
                "id": "phishing",
                "title": "Credential Harvest Response",
                "category": "High",
                "duration": "1-2h",
                "description": "Réponse rapide à une campagne de phishing visant le vol d'identifiants."
            },
            {
                "id": "brute-force",
                "title": "SSH/RDP Brute Force",
                "category": "Medium",
                "duration": "30m",
                "description": "Atténuation d'une attaque de force brute sur les services d'accès distant."
            }
        ]

    def get_playbook_steps(self, playbook_id):
        """
        Détails des étapes pour un playbook spécifique (NIST SP 800-61).
        """
        playbooks_data = {
            "ransomware": [
                {
                    "phase": "Identification",
                    "tasks": [
                        {"id": "r1", "title": "Identifier le point d'entrée", "advice": "Analysez les logs EDR pour trouver le processus initial (souvent un email ou un hacktool)."},
                        {"id": "r2", "title": "Lister les partages réseau impactés", "advice": "Vérifiez les accès SMB inhabituels depuis l'hôte infecté."}
                    ]
                },
                {
                    "phase": "Containment",
                    "tasks": [
                        {"id": "r3", "title": "Isoler les hôtes du réseau", "advice": "Utilisez l'isolation réseau au niveau Switch ou Firewall."},
                        {"id": "r4", "title": "Désactiver les comptes compromis", "advice": "Réinitialisez les mots de passe Active Directory immédiatement."}
                    ]
                },
                {
                    "phase": "Recovery",
                    "tasks": [
                        {"id": "r5", "title": "Restaurer via backups immuables", "advice": "Vérifiez l'intégrité des sauvegardes avant restauration."},
                        {"id": "r6", "title": "Patching des vulnérabilités", "advice": "Appliquez les derniers correctifs pour éviter une réinfection."}
                    ]
                }
            ],
            "phishing": [
                 {
                    "phase": "Identification",
                    "tasks": [
                        {"id": "p1", "title": "Extraire les URLs malveillantes", "advice": "Utilisez CyberChef pour décoder les URLs obfusquées."},
                        {"id": "p2", "title": "Lister les victimes potentielles", "advice": "Cherchez qui a ouvert l'email ou cliqué sur le lien."}
                    ]
                },
                {
                    "phase": "Cleanup",
                    "tasks": [
                        {"id": "p3", "title": "Purge des boîtes mail", "advice": "Supprimez l'email de tous les serveurs Exchange ou O365."},
                        {"id": "p4", "title": "Blocage des domaines", "advice": "Ajoutez les domaines détectés à la Blacklist DNS."}
                    ]
                }
            ],
            "brute-force": [
                {
                    "phase": "Mitigation",
                    "tasks": [
                        {"id": "bf1", "title": "Identifier l'IP source", "advice": "Consultez les échecs de connexion répétés dans les journaux d'audit."},
                        {"id": "bf2", "title": "Bloquer l'IP au niveau local", "advice": "Ajoutez l'IP à la politique de restriction de l'hôte (Fail2Ban/Windows FW)."}
                    ]
                },
                {
                    "phase": "Hardening",
                    "tasks": [
                        {"id": "bf3", "title": "Activer le MFA", "advice": "Forcez l'authentification multi-facteurs pour tous les accès distants."},
                        {"id": "bf4", "title": "Changer le port par défaut", "advice": "Modifiez le port d'écoute standard pour réduire le bruit de fond."}
                    ]
                }
            ]
        }
        
        return playbooks_data.get(playbook_id, [])

if __name__ == "__main__":

    engine = AIEngine()
    print(engine.analyze_alerts())