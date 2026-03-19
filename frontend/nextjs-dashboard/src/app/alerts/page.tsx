'use client';

import React, { useEffect, useState } from 'react';
import { 
  AlertTriangle, 
  Shield, 
  Search, 
  Filter,
  ChevronRight,
 
} from 'lucide-react';

type AlertItem = {
  cve_id: string;
  log: string;
  alert: string;
  soc_level?: string;
  threat_score?: number;
  severity?: number;
};

const SOC_LEVEL_OPTIONS = [
  { label: 'All', value: 'ALL' },
  { label: 'SOC Level 1 - Stable', value: 'SOC Level 1 - Stable' },
  { label: 'SOC Level 2 - High Risk', value: 'SOC Level 2 - High Risk' },
  { label: 'SOC Level 3 - Critical Threat', value: 'SOC Level 3 - Critical Threat' },
] as const;

type SocLevelOption = (typeof SOC_LEVEL_OPTIONS)[number]['value'];

function computeThreatScore(alert: Pick<AlertItem, 'cve_id' | 'severity' | 'threat_score'>): number {
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

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<SocLevelOption>('ALL');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  useEffect(() => {
    fetch('http://127.0.0.1:8000/alerts')
      .then(res => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const validated = data.filter((item): item is AlertItem => {
            if (typeof item !== 'object' || item === null) return false;
            const obj = item as Record<string, unknown>;
            return typeof obj.cve_id === 'string' &&
              typeof obj.log === 'string' &&
              typeof obj.alert === 'string' &&
              (typeof obj.soc_level === 'undefined' || typeof obj.soc_level === 'string') &&
              (typeof obj.threat_score === 'undefined' || typeof obj.threat_score === 'number') &&
              (typeof obj.severity === 'undefined' || typeof obj.severity === 'number');
          });
          const enriched: AlertItem[] = validated.map((a) => {
            const threatScore = computeThreatScore(a);
            const socLevel = (typeof a.soc_level === 'string' && a.soc_level.trim().length > 0)
              ? a.soc_level
              : computeSocLevel(threatScore);
            return {
              ...a,
              threat_score: threatScore,
              soc_level: socLevel,
            };
          });
          setAlerts(enriched);
        }
      })
      .catch(err => console.error(err));
  }, []);

  const filteredAlerts = alerts.filter((alert) => {
    const matchesSearch =
      alert.cve_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.log.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filter === 'ALL' ||
      (alert.soc_level ?? '').toLowerCase() === filter.toLowerCase();

    return matchesSearch && matchesFilter;
  });

  const sortedAlerts = [...filteredAlerts].sort((a, b) => {
    const aSeverity = typeof a.severity === 'number' && Number.isFinite(a.severity) ? a.severity : 0;
    const bSeverity = typeof b.severity === 'number' && Number.isFinite(b.severity) ? b.severity : 0;
    return sortOrder === 'DESC' ? bSeverity - aSeverity : aSeverity - bSeverity;
  });

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
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3 items-end">
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
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
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
              {sortedAlerts.map((alert, idx) => (
                (() => {
                  const threatScore = computeThreatScore(alert);
                  const severity = typeof alert.severity === 'number' ? alert.severity : 0;
                  return (
                <tr key={idx} className="hover:bg-blue-50/30 transition-all group cursor-default">
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl shadow-sm ${alert.cve_id === 'ML-ANOMALY' ? 'bg-orange-100 text-orange-600' : 'bg-rose-100 text-rose-600'}`}>
                        {alert.cve_id === 'ML-ANOMALY' ? (
                          <Activity className="w-5 h-5" />
                        ) : (
                          <Shield className="w-5 h-5" />
                        )}
                      </div>
                      <span className="text-sm font-black text-slate-700 font-mono tracking-tighter">{alert.cve_id}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-medium text-slate-600 max-w-md truncate group-hover:text-slate-900 transition-colors">
                      {alert.log}
                    </p>
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
                    <button className="p-2.5 text-slate-300 hover:text-blue-600 hover:bg-blue-100/50 rounded-xl transition-all group-hover:translate-x-1">
                      <ChevronRight className="w-6 h-6" />
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
      </div>
    </div>
  );
}

function Activity(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
  );
}
