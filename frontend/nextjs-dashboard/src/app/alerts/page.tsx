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
import { ThemeToggle } from '@/components/ThemeToggle';
import AICopilot from '@/components/AICopilot';
import { useAlertContext, Alert } from '@/contexts/AlertContext';

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
  const { alerts, fetchAlerts, isLoading } = useAlertContext();
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

  // Sync or reload data explicitly if empty on mount
  useEffect(() => { 
    if (alerts.length === 0 && !isLoading) {
      void fetchAlerts(); 
    }
  }, [fetchAlerts, alerts.length, isLoading]);

  // Filters & Sorting
  const filteredAlerts = alerts.filter((alert) => {
    const safeLog = alert.log || '';
    const matchesSearch = alert.cve_id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          safeLog.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'ALL' || alert.soc_level === filter;
    const matchesTime = (() => {
      if (timeFilter === 'ALL') return true;
      const ts = parseLogTimestamp(safeLog);
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
    const rows = sortedAlerts.map(a => {
      const safeLog = a.log || '';
      return [`"${a.cve_id}"`, `"${safeLog.replace(/"/g, '""')}"`, a.severity, `"${a.soc_level}"`, a.threat_score].join(',');
    });
    const csvContent = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `security_alerts_${new Date().getTime()}.csv`;
    link.click();
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 p-6 bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              Security Alerts
            </h1>
            <ThemeToggle />
          </div>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-500" />
            Real-time monitoring of correlated threats and anomalies
          </p>
        </div>
        
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 flex flex-wrap gap-4 items-end">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input 
              type="text" placeholder="Search..." 
              className="pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select 
            className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm outline-none"
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
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        {isLoading ? (
          <div className="p-20 text-center animate-pulse text-slate-400 font-bold">Fetching latest threats...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
              <thead className="bg-slate-50/80 dark:bg-slate-800/50 uppercase text-[10px] font-black text-slate-400 dark:text-slate-500 tracking-widest">
                <tr>
                  <th className="px-8 py-5 text-left">Indicator</th>
                  <th className="px-8 py-5 text-left">Log Detail</th>
                  <th className="px-8 py-5 text-left">Threat Score</th>
                  <th className="px-8 py-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {currentAlerts.map((alert, idx) => (
                  <tr key={`${alert.cve_id}-${idx}`} className="hover:bg-blue-50/30 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${alert.cve_id === 'ML-ANOMALY' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'}`}>
                          {alert.cve_id === 'ML-ANOMALY' ? <Activity className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                        </div>
                        <span className="font-mono font-bold text-sm text-slate-800 dark:text-slate-200">{alert.cve_id}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 max-w-md truncate text-sm text-slate-600 dark:text-slate-400">{alert.log}</td>
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

      {/* Pagination Controls */}
      <div className="flex justify-center items-center gap-4 py-8">
        <button 
          disabled={currentPage === 1} 
          onClick={() => setCurrentPage(p => p - 1)} 
          className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        <div className="px-5 py-2 bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-700 dark:text-slate-300 shadow-inner">
          Page {currentPage} of {totalPages}
        </div>
        <button 
          disabled={currentPage >= totalPages} 
          onClick={() => setCurrentPage(p => p + 1)} 
          className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>

      {/* MODAL COMPLET */}
      {isOpen && selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" onClick={closeModal}>
          <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-8 py-6 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">Alert Deep Dive</h2>
                <p className="text-sm font-mono text-blue-600 dark:text-blue-400">{selectedAlert.cve_id}</p>
              </div>
              <button onClick={closeModal} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-200 transition-colors text-slate-400 text-2xl">×</button>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Severity</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{selectedAlert.severity || 'N/A'}</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Threat Score</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{selectedAlert.threat_score}</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SOC Level</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">{selectedAlert.soc_level}</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Raw Log Information</p>
                <div className="p-4 bg-slate-900 text-blue-400 rounded-2xl font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed border border-slate-800">
                  {selectedAlert.log}
                </div>
              </div>

              {selectedAlert.prediction && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-2xl">
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">AI Prediction</p>
                  <p className="text-sm text-blue-900 dark:text-blue-200 font-medium">{selectedAlert.prediction}</p>
                </div>
              )}

              {selectedAlert.recommendation && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 rounded-2xl">
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Action Recommendation</p>
                  <p className="text-sm text-emerald-900 dark:text-emerald-200 font-medium">{selectedAlert.recommendation}</p>
                </div>
              )}
            </div>

            <div className="px-8 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
              <button 
                onClick={() => copyToClipboard(JSON.stringify(selectedAlert, null, 2), 'json')}
                className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
              >
                {copiedField === 'json' ? 'Copied!' : 'Copy JSON'}
              </button>
              <button onClick={closeModal} className="px-6 py-2 bg-slate-900 dark:bg-slate-700 text-white text-sm font-bold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-600 transition-all">
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* AICopilot Injection */}
      <AICopilot alerts={alerts} />
    </div>
  );
}