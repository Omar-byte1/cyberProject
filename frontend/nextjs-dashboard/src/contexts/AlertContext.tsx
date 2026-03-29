'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react';

export interface Alert {
  cve_id: string;
  log?: string;
  severity?: number;
  threat_score?: number;
  soc_level?: string;
  prediction?: string;
  recommendation?: string;
  alert?: string;
}

interface AlertContextProps {
  alerts: Alert[];
  setAlerts: React.Dispatch<React.SetStateAction<Alert[]>>;
  isSimulating: boolean;
  toggleSimulation: () => void;
  toastMessage: string | null;
  fetchAlerts: () => Promise<void>;
  isLoading: boolean;
  isRefreshing: boolean;
}

const AlertContext = createContext<AlertContextProps | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const simulationRef = useRef<NodeJS.Timeout | null>(null);

  // Default Backend Fetch
  const fetchAlerts = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
      const res = await fetch('http://127.0.0.1:8000/alerts', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();

      if (Array.isArray(data)) {
        const validatedAlerts: Alert[] = data
          .map((item: any) => ({
            cve_id: typeof item.cve_id === 'string' ? item.cve_id : 'N/A',
            log: item.log,
            severity: item.severity,
            threat_score: item.threat_score,
            soc_level: item.soc_level
          }))
          .filter((a) => a.cve_id !== 'N/A');

        setAlerts(validatedAlerts);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  }, []);

  // Initial Fetch on app load
  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Simulation Logic
  const simulateAttack = useCallback(() => {
    const SIMULATED_IPS = [
      "8.8.8.8", "185.15.59.224", "103.22.200.0", "193.0.14.129",
      "177.71.128.1", "41.141.68.0", "120.136.54.0", "1.1.1.1",
      "175.45.176.0", "197.234.219.0"
    ];
    
    const randomIP = SIMULATED_IPS[Math.floor(Math.random() * SIMULATED_IPS.length)];
    const isAnomaly = Math.random() > 0.8;
    const cveId = isAnomaly ? "ML-ANOMALY" : `CVE-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const severity = Math.floor(Math.random() * 10) + 1;
    const threatScore = isAnomaly ? 9 : Math.floor(Math.random() * 3) + 7;
    const now = new Date();
    const logStr = `${now.toISOString().replace('T', ' ').slice(0, 19)} Suspicious activity from ${randomIP}`;

    const newAlert: Alert = {
      cve_id: cveId,
      severity,
      threat_score: threatScore,
      soc_level: threatScore >= 9 ? 'Critical' : 'High',
      log: logStr
    };

    setAlerts(prev => [newAlert, ...prev].slice(0, 100)); // Limit to 100 global alerts
    
    setToastMessage(`🚨 New Threat Found: ${cveId} from ${randomIP}`);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  const toggleSimulation = useCallback(() => {
    if (isSimulating) {
      if (simulationRef.current) clearInterval(simulationRef.current);
      simulationRef.current = null;
      setIsSimulating(false);
      setToastMessage("⏹ Simulation Stopped");
      setTimeout(() => setToastMessage(null), 2000);
    } else {
      setIsSimulating(true);
      simulateAttack(); 
      simulationRef.current = setInterval(simulateAttack, 3500);
      setToastMessage("▶️ Simulation Started Globally");
      setTimeout(() => setToastMessage(null), 2000);
    }
  }, [isSimulating, simulateAttack]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (simulationRef.current) clearInterval(simulationRef.current);
    };
  }, []);

  return (
    <AlertContext.Provider value={{ 
      alerts, setAlerts, 
      isSimulating, toggleSimulation, 
      toastMessage, fetchAlerts, 
      isLoading, isRefreshing 
    }}>
      {children}
    </AlertContext.Provider>
  );
}

export function useAlertContext() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlertContext must be used within an AlertProvider');
  }
  return context;
}
