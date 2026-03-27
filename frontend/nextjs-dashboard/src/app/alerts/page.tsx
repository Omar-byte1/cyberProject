'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { 
  AlertTriangle, 
  Shield, 
  Search, 
  Filter,
  ChevronRight,
  Copy,
  Activity, // Ajouté pour les anomalies ML
  Download
} from 'lucide-react';

export interface Alert {
  cve_id: string;
  log: string;
  alert: string; 
  soc_level?: string;
  threat_score?: number;
  severity?: number;
  prediction?: string;
  recommendation?: string;
}

const SOC_LEVEL_OPTIONS = [
  { label: 'All', value: 'ALL' },
  { label: 'SOC Level 1 - Stable', value: 'SOC Level 1 - Stable' },
  { label: 'SOC Level 2 - High Risk', value: 'SOC Level 2 - High Risk' },
  { label: 'SOC Level 3 - Critical Threat', value: 'SOC Level 3 - Critical Threat' },
] as const;

type SocLevelOption = (typeof SOC_LEVEL_OPTIONS)[number]['value'];

const TIME_FILTER_OPTIONS = [
  { label: 'All', value: 'ALL' },
  { label: 'Last 1 hour', value: 'LAST_1H' },
  { label: 'Last 24 hours', value: 'LAST_24H' },
] as const;

type TimeFilterOption = (typeof TIME_FILTER_OPTIONS)[number]['value'];

// --- Utility Functions ---
function computeThreatScore(alert: Pick<Alert, 'cve_id' | 'severity' | 'threat_score'>): number {
  if (typeof alert.threat_score === 'number' && Number.isFinite(alert.threat_score)) {
    return alert.threat_score;
  }
  const baseSeverity = typeof alert.severity === 'number' && Number.isFinite(alert.severity) ? alert.severity : 0;
  const anomalyBonus = alert.cve_id === 'ML-ANOMALY' ? 1 : 0;
  return baseSeverity + anomalyBonus;
}

function computeSocLevel(threatScore: number): Exclude<SocLevelOption, 'ALL'> {
  if (threatScore >= 9) return 'SOC Level 3 - Critical Threat';
  if (threatScore >= 7) return 'SOC Level 2 - High Risk';
  return 'SOC Level 1 - Stable';
}

function parseLogTimestamp(log: string): Date | null {
  if (typeof log !== 'string' || log.length < 19) return null;
  const prefix = log.slice(0, 19);
  const isoLike = prefix.replace(' ', 'T');
  const date = new Date(isoLike);
  return Number.isNaN(date.getTime()) ? null : date;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const copiedTimeoutRef = useRef<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<SocLevelOption>('ALL');
  const [timeFilter, setTimeFilter] = useState<TimeFilterOption>('ALL');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [alertsPerPage] = useState<number>(10);

  const closeModal = () => {
    setIsOpen(false);
    setSelectedAlert(null);
  };

  const copyToClipboard = useCallback(async (value: string, fieldKey: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(fieldKey);
      if (copiedTimeoutRef.current !== null) window.clearTimeout(copiedTimeoutRef.current);
      copiedTimeoutRef.current = window.setTimeout(() => setCopiedField(null), 1200);
    } catch (err) { console.error("Clipboard error", err); }
  }, []);

  const fetchAlerts = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = window.localStorage.getItem('token');
      const res = await fetch('http://127.0.0.1:8000/alerts', {
        cache: 'no-store',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      if (!Array.isArray(json)) throw new Error('Invalid format');

      const enriched: Alert[] = json.map((a: any) => {
        const threatScore = computeThreatScore(a);
        const socLevel = a.soc_level || computeSocLevel(threatScore);
        return { ...a, threat_score: threatScore, soc_level: socLevel };
      });

      setAlerts(enriched);
      setError(null);
    } catch {
      setError('Failed to load alerts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void fetchAlerts(); }, [fetchAlerts]);

  // Filters & Sorting
  const filteredAlerts = alerts.filter((alert) => {
    const matchesSearch = alert.cve_id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          alert.log.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'ALL' || alert.soc_level === filter;
    const matchesTime = (() => {
      if (timeFilter === 'ALL') return true;
      const ts = parseLogTimestamp(alert.log);
      if (!ts) return false;
      const windowMs = timeFilter === 'LAST_1H' ? 3600000 : 86400000;
      return (Date.now() - ts.getTime()) <= windowMs;
    })();
    return matchesSearch && matchesFilter && matchesTime;
  });

  const sortedAlerts = [...filteredAlerts].sort((a, b) => {
    const valA = a.severity ?? 0;
    const valB = b.severity ?? 0;
    return sortOrder === 'DESC' ? valB - valA : valA - valB;
  });

  // Pagination logic
  const indexOfLast = currentPage * alertsPerPage;
  const indexOfFirst = indexOfLast - alertsPerPage;
  const currentAlerts = sortedAlerts.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(sortedAlerts.length / alertsPerPage) || 1;

  const exportCSV = () => {
    const header = ['CVE_ID', 'Log', 'Severity', 'SOC_Level', 'Threat_Score'];
    const rows = sortedAlerts.map(a => [
      `"${a.cve_id}"`, `"${a.log.replace(/"/g, '""')}"`, a.severity, `"${a.soc_level}"`, a.threat_score
    ].join(','));
    const csvContent = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `security_alerts_${new Date().getTime()}.csv`;
    link.click();
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 p-6 bg-slate-50 min-h-screen">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            Security Alerts
          </h1>
          <p className="text-slate-500 mt-2 font-medium flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-500" />
            Real-time monitoring of correlated threats and anomalies
          </p>
        </div>
        
        <div className="bg-white/80 backdrop-blur rounded-3xl border border-slate-200 shadow-sm p-4 flex flex-wrap gap-4 items-end">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" placeholder="Search..." 
              className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select 
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
            value={filter} onChange={(e) => setFilter(e.target.value as SocLevelOption)}
          >
            {SOC_LEVEL_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>

          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        {isLoading ? (
          <div className="p-20 text-center animate-pulse text-slate-400 font-bold">Fetching latest threats...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/80 uppercase text-[10px] font-black text-slate-400 tracking-widest">
                <tr>
                  <th className="px-8 py-5 text-left">Indicator</th>
                  <th className="px-8 py-5 text-left">Log Detail</th>
                  <th className="px-8 py-5 text-left">Threat Score</th>
                  <th className="px-8 py-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {currentAlerts.map((alert, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${alert.cve_id === 'ML-ANOMALY' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'}`}>
                          {alert.cve_id === 'ML-ANOMALY' ? <Activity className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                        </div>
                        <span className="font-mono font-bold text-sm">{alert.cve_id}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 max-w-md truncate text-sm text-slate-600">{alert.log}</td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${alert.threat_score! >= 7 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                        {alert.threat_score}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button 
                        onClick={() => { setSelectedAlert(alert); setIsOpen(true); }}
                        className="text-blue-600 font-bold text-sm hover:underline"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-4">
        <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2 disabled:opacity-30">Previous</button>
        <span className="text-sm font-bold">Page {currentPage} of {totalPages}</span>
        <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-2 disabled:opacity-30">Next</button>
      </div>

      {/* MODAL COMPLET */}
      {isOpen && selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" onClick={closeModal}>
          <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black text-slate-900">Alert Deep Dive</h2>
                <p className="text-sm font-mono text-blue-600">{selectedAlert.cve_id}</p>
              </div>
              <button onClick={closeModal} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-200 transition-colors text-slate-400 text-2xl">×</button>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Severity</p>
                  <p className="text-2xl font-black text-slate-900">{selectedAlert.severity || 'N/A'}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Threat Score</p>
                  <p className="text-2xl font-black text-slate-900">{selectedAlert.threat_score}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SOC Level</p>
                  <p className="text-sm font-bold text-slate-900 mt-1">{selectedAlert.soc_level}</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Raw Log Information</p>
                <div className="p-4 bg-slate-900 text-blue-400 rounded-2xl font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed border border-slate-800">
                  {selectedAlert.log}
                </div>
              </div>

              {selectedAlert.prediction && (
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">AI Prediction</p>
                  <p className="text-sm text-blue-900 font-medium">{selectedAlert.prediction}</p>
                </div>
              )}

              {selectedAlert.recommendation && (
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Action Recommendation</p>
                  <p className="text-sm text-emerald-900 font-medium">{selectedAlert.recommendation}</p>
                </div>
              )}
            </div>

            <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={() => copyToClipboard(JSON.stringify(selectedAlert, null, 2), 'json')}
                className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
              >
                {copiedField === 'json' ? 'Copied!' : 'Copy JSON'}
              </button>
              <button onClick={closeModal} className="px-6 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-all">
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}