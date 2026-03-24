'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { 
  AlertTriangle, 
  Shield, 
  Search, 
  Filter,
  ChevronRight,
  Copy,
 
} from 'lucide-react';

export interface Alert {
  cve_id: string;
  log: string;
  alert: string; // detection type / category label from the backend
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
  // Expected prefix: "YYYY-MM-DD HH:mm:ss"
  if (typeof log !== 'string' || log.length < 19) return null;
  const prefix = log.slice(0, 19);
  // Convert to ISO-like string: "YYYY-MM-DDTHH:mm:ss"
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

      if (copiedTimeoutRef.current !== null) {
        window.clearTimeout(copiedTimeoutRef.current);
      }
      copiedTimeoutRef.current = window.setTimeout(() => {
        setCopiedField(null);
        copiedTimeoutRef.current = null;
      }, 1200);
    } catch {
      // Keep it simple: no extra UI beyond the existing error state.
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/alerts', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const json: unknown = await res.json();
      if (!Array.isArray(json)) {
        throw new Error('Invalid response format');
      }

      const arr: unknown[] = json;
      const validated = arr.filter((item): item is Alert => {
        if (typeof item !== 'object' || item === null) return false;
        const obj = item as Record<string, unknown>;
        return (
          typeof obj.cve_id === 'string' &&
          typeof obj.log === 'string' &&
          typeof obj.alert === 'string' &&
          (typeof obj.soc_level === 'undefined' || typeof obj.soc_level === 'string') &&
          (typeof obj.threat_score === 'undefined' || typeof obj.threat_score === 'number') &&
          (typeof obj.severity === 'undefined' || typeof obj.severity === 'number') &&
          (typeof obj.prediction === 'undefined' || obj.prediction === null || typeof obj.prediction === 'string') &&
          (typeof obj.recommendation === 'undefined' || obj.recommendation === null || typeof obj.recommendation === 'string')
        );
      });

      const enriched: Alert[] = validated.map((a) => {
        const threatScore = computeThreatScore(a);
        const socLevel =
          typeof a.soc_level === 'string' && a.soc_level.trim().length > 0
            ? a.soc_level
            : computeSocLevel(threatScore);
        return {
          ...a,
          threat_score: threatScore,
          soc_level: socLevel,
        };
      });

      setAlerts(enriched);
      setError(null);
    } catch {
      setError('Failed to load alerts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAlerts();
  }, [fetchAlerts]);

  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current !== null) {
        window.clearTimeout(copiedTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Reset paging when the list changes due to search/filter/sort.
    setCurrentPage(1);
  }, [searchTerm, filter, timeFilter, sortOrder]);

  const filteredAlerts = alerts.filter((alert) => {
    const matchesSearch =
      alert.cve_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.log.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filter === 'ALL' ||
      (alert.soc_level ?? '').toLowerCase() === filter.toLowerCase();

    const matchesTime = (() => {
      if (timeFilter === 'ALL') return true;
      const ts = parseLogTimestamp(alert.log);
      if (!ts) return false;
      const now = Date.now();
      const ageMs = now - ts.getTime();
      const windowMs = timeFilter === 'LAST_1H' ? 3_600_000 : 86_400_000;
      return ageMs >= 0 && ageMs <= windowMs;
    })();

    return matchesSearch && matchesFilter && matchesTime;
  });

  const sortedAlerts = [...filteredAlerts].sort((a, b) => {
    const aSeverity = typeof a.severity === 'number' && Number.isFinite(a.severity) ? a.severity : 0;
    const bSeverity = typeof b.severity === 'number' && Number.isFinite(b.severity) ? b.severity : 0;
    return sortOrder === 'DESC' ? bSeverity - aSeverity : aSeverity - bSeverity;
  });

  const indexOfLast = currentPage * alertsPerPage;
  const indexOfFirst = indexOfLast - alertsPerPage;
  const currentAlerts = sortedAlerts.slice(indexOfFirst, indexOfLast);

  const totalAlerts = sortedAlerts.length;
  const totalPages = Math.ceil(totalAlerts / alertsPerPage) || 1;

  const isPreviousDisabled = currentPage === 1;
  const isNextDisabled = indexOfLast >= totalAlerts;

  const exportCSV = () => {
    const exportRows: Alert[] =
      currentAlerts.length > 0 ? currentAlerts : sortedAlerts.length > 0 ? sortedAlerts : alerts;

    const csvEscape = (value: string): string => {
      const needsQuotes = /[",\n\r]/.test(value);
      const escaped = value.replace(/"/g, '""');
      return needsQuotes ? `"${escaped}"` : escaped;
    };

    const header = ['cve_id', 'log', 'severity', 'soc_level', 'threat_score'];

    const rows = exportRows.map((alert) => {
      const severityValue =
        typeof alert.severity === 'number' && Number.isFinite(alert.severity) ? String(alert.severity) : '';
      const socLevelValue = typeof alert.soc_level === 'string' ? alert.soc_level : '';
      const threatScoreValue =
        typeof alert.threat_score === 'number' && Number.isFinite(alert.threat_score) ? String(alert.threat_score) : '';

      return [
        csvEscape(alert.cve_id),
        csvEscape(alert.log),
        csvEscape(severityValue),
        csvEscape(socLevelValue),
        csvEscape(threatScoreValue),
      ].join(',');
    });

    const csv = [header.join(','), ...rows].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'alerts.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
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
        
        <div className="w-full md:w-auto">
          <div className="bg-white/80 backdrop-blur rounded-3xl border border-slate-200 shadow-sm px-4 py-4 md:px-5">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] gap-3 items-end">
              <div className="min-w-0">
                <label className="block text-[11px] font-black tracking-widest uppercase text-slate-400 mb-2">
                  Search
                </label>
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="text"
                    placeholder="CVE, domain, IP, log..."
                    className="pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all w-full md:w-[360px] shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="w-full md:w-72">
                <label className="block text-[11px] font-black tracking-widest uppercase text-slate-400 mb-2">
                  SOC level
                </label>
                <div className="relative">
                  <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  <select
                    className="appearance-none pl-12 pr-10 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm w-full hover:border-slate-300"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as SocLevelOption)}
                    aria-label="Filter alerts by SOC level"
                  >
                    {SOC_LEVEL_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 rotate-90 pointer-events-none" />
                </div>
              </div>

              <div className="w-full md:w-56">
                <label className="block text-[11px] font-black tracking-widest uppercase text-slate-400 mb-2">
                  Time window
                </label>
                <div className="relative">
                  <select
                    className="appearance-none px-4 pr-10 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm w-full hover:border-slate-300"
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value as TimeFilterOption)}
                    aria-label="Filter alerts by time window"
                  >
                    {TIME_FILTER_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 rotate-90 pointer-events-none" />
                </div>
              </div>

              <div className="w-full md:w-56">
                <label className="block text-[11px] font-black tracking-widest uppercase text-slate-400 mb-2">
                  Severity sort
                </label>
                <div className="relative">
                  <select
                    className="appearance-none px-4 pr-10 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm w-full hover:border-slate-300"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as 'ASC' | 'DESC')}
                    aria-label="Sort alerts by severity"
                  >
                    <option value="DESC">Highest first</option>
                    <option value="ASC">Lowest first</option>
                  </select>
                  <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 rotate-90 pointer-events-none" />
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={exportCSV}
                  className="inline-flex items-center justify-center px-4 py-3 rounded-2xl bg-blue-600 text-white text-sm font-bold shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-colors"
                  aria-label="Export alerts as CSV"
                >
                  Export CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8">
            <div className="text-sm font-semibold text-slate-600 mb-4">Loading alerts...</div>
            <div className="space-y-4 animate-pulse">
              <div className="h-14 rounded-2xl bg-slate-100" />
              <div className="h-14 rounded-2xl bg-slate-100" />
              <div className="h-14 rounded-2xl bg-slate-100" />
              <div className="h-14 rounded-2xl bg-slate-100" />
            </div>
          </div>
        ) : error ? (
          <div className="py-20 px-6 flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="bg-rose-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5">
                <AlertTriangle className="w-8 h-8 text-rose-500" />
              </div>
              <p className="text-slate-900 font-extrabold text-lg">Failed to load alerts</p>
              <p className="text-slate-600 font-medium mt-2">{error}</p>
              <button
                type="button"
                onClick={() => void fetchAlerts()}
                className="mt-6 inline-flex items-center justify-center px-5 py-3 rounded-2xl bg-slate-900 text-white text-sm font-bold shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-900/20 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        ) : alerts.length === 0 ? (
          <div className="py-20 px-6 flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5">
                <Shield className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-900 font-extrabold text-lg">No alerts found</p>
              <p className="text-slate-600 font-medium mt-2">
                Once your backend emits alerts, they’ll appear here.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/80 backdrop-blur-md">
                  <tr>
                    <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Indicator</th>
                    <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Log Detail</th>
                    <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Detection Type</th>
                    <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Threat Score</th>
                    <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Risk Score</th>
                    <th className="px-8 py-5 text-right text-xs font-black text-slate-400 uppercase tracking-widest">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-50">
                  {currentAlerts.map((alert, idx) => (
                    (() => {
                      const threatScore = computeThreatScore(alert);
                      const severity = typeof alert.severity === 'number' ? alert.severity : 0;
                      const rowKey = `${alert.cve_id}-${indexOfFirst + idx}`;
                      const cveFieldKey = `cve:${rowKey}`;
                      const logFieldKey = `log:${rowKey}`;
                      return (
                      <tr key={rowKey} className="hover:bg-blue-50/30 transition-all group cursor-default">
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl shadow-sm ${alert.cve_id === 'ML-ANOMALY' ? 'bg-orange-100 text-orange-600' : 'bg-rose-100 text-rose-600'}`}>
                              {alert.cve_id === 'ML-ANOMALY' ? (
                                <Activity className="w-5 h-5" />
                              ) : (
                                <Shield className="w-5 h-5" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-sm font-black text-slate-700 font-mono tracking-tighter">
                                {alert.cve_id}
                              </span>
                              <button
                                type="button"
                                onClick={() => void copyToClipboard(alert.cve_id, cveFieldKey)}
                                className="inline-flex items-center justify-center w-8 h-8 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50 transition-colors"
                                aria-label="Copy CVE ID"
                                title="Copy CVE ID"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              {copiedField === cveFieldKey && (
                                <span className="text-xs font-bold text-emerald-600">
                                  Copied!
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-start gap-3">
                            <p className="text-sm font-medium text-slate-600 max-w-md truncate group-hover:text-slate-900 transition-colors">
                              {alert.log}
                            </p>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => void copyToClipboard(alert.log, logFieldKey)}
                                className="inline-flex items-center justify-center w-8 h-8 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50 transition-colors"
                                aria-label="Copy log"
                                title="Copy log"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              {copiedField === logFieldKey && (
                                <span className="text-xs font-bold text-emerald-600">
                                  Copied!
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-extrabold shadow-sm ${
                            alert.cve_id === 'ML-ANOMALY' 
                              ? 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700' 
                              : 'bg-gradient-to-r from-rose-100 to-red-100 text-red-700'
                          }`}>
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {alert.alert}
                          </span>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${threatScore >= 9 ? 'bg-red-100 text-red-600' : threatScore >= 7 ? 'bg-orange-100 text-orange-600' : 'bg-yellow-100 text-amber-700'}`}>
                            {Math.round(threatScore)}
                          </span>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="flex items-center gap-4">
                            <div className="flex-1 w-20 h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                              <div 
                                className={`h-full rounded-full bg-gradient-to-r transition-all duration-1000 ease-out ${severity >= 8 ? 'from-red-400 to-rose-600' : 'from-orange-400 to-amber-600'}`}
                                style={{ width: `${severity * 10}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-black text-slate-900 w-8">{alert.severity}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAlert(alert);
                              setIsOpen(true);
                            }}
                            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-colors"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                      );
                    })()
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredAlerts.length === 0 && (
              <div className="py-20 text-center">
                <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Filter className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-500 font-medium">No alerts found matching your search.</p>
              </div>
            )}

            {totalAlerts > 0 && (
              <div className="px-6 py-5 flex flex-col items-center gap-4">
                <div className="text-sm font-semibold text-slate-600">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={isPreviousDisabled}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-800 text-sm font-bold shadow-sm hover:bg-slate-200 disabled:opacity-50 disabled:hover:bg-slate-100 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => p + 1)}
                    disabled={isNextDisabled}
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {isOpen && selectedAlert && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="alert-details-title"
          onClick={() => closeModal()}
        >
          <div
            className="relative w-full max-w-3xl bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 bg-slate-50/80 backdrop-blur border-b border-slate-100">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2
                    id="alert-details-title"
                    className="text-lg font-black text-slate-900 tracking-tight"
                  >
                    Alert Details
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-slate-600 font-mono">
                    {selectedAlert.cve_id}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => closeModal()}
                  className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  aria-label="Close modal"
                >
                  <span className="text-xl leading-none">×</span>
                </button>
              </div>
            </div>

            <div className="p-6">
              {(() => {
                const computedThreatScore = computeThreatScore(selectedAlert);
                const threatScore =
                  typeof selectedAlert.threat_score === 'number' && Number.isFinite(selectedAlert.threat_score)
                    ? selectedAlert.threat_score
                    : computedThreatScore;
                const severity =
                  typeof selectedAlert.severity === 'number' && Number.isFinite(selectedAlert.severity)
                    ? selectedAlert.severity
                    : undefined;
                const socLevel =
                  typeof selectedAlert.soc_level === 'string' && selectedAlert.soc_level.trim().length > 0
                    ? selectedAlert.soc_level
                    : computeSocLevel(threatScore);
                return (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                        <div className="text-[11px] font-black tracking-widest uppercase text-slate-400">
                          Severity
                        </div>
                        <div className="mt-2 text-2xl font-black text-slate-900">
                          {typeof severity === 'number' ? severity : 'N/A'}
                        </div>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                        <div className="text-[11px] font-black tracking-widest uppercase text-slate-400">
                          SOC Level
                        </div>
                        <div className="mt-2 text-lg font-bold text-slate-900">
                          {socLevel}
                        </div>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                        <div className="text-[11px] font-black tracking-widest uppercase text-slate-400">
                          Threat Score
                        </div>
                        <div className="mt-2 text-2xl font-black text-slate-900">
                          {Math.round(threatScore)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5">
                      <div className="text-[11px] font-black tracking-widest uppercase text-slate-400">
                        Full Log
                      </div>
                      <pre className="mt-2 text-sm text-slate-700 bg-slate-50 rounded-2xl p-4 border border-slate-100 whitespace-pre-wrap break-words max-h-[60vh] overflow-y-auto">
                        {selectedAlert.log}
                      </pre>
                    </div>

                    {(typeof selectedAlert.prediction === 'string' && selectedAlert.prediction.trim().length > 0) && (
                      <div className="mt-5">
                        <div className="text-[11px] font-black tracking-widest uppercase text-slate-400">
                          Prediction
                        </div>
                        <div className="mt-2 text-sm font-semibold text-slate-900 bg-slate-50 border border-slate-100 rounded-2xl p-4">
                          {selectedAlert.prediction}
                        </div>
                      </div>
                    )}

                    {(typeof selectedAlert.recommendation === 'string' && selectedAlert.recommendation.trim().length > 0) && (
                      <div className="mt-5">
                        <div className="text-[11px] font-black tracking-widest uppercase text-slate-400">
                          Recommendation
                        </div>
                        <div className="mt-2 text-sm font-semibold text-slate-900 bg-slate-50 border border-slate-100 rounded-2xl p-4">
                          {selectedAlert.recommendation}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            <div className="px-6 py-4 bg-white border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => closeModal()}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-900/20 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function Activity(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
  );
}

