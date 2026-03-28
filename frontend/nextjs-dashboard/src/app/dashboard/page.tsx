'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ShieldAlert,
  Activity,
  Zap,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  RefreshCw
} from 'lucide-react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Filler,
} from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import AlertChart from '@/components/AlertChart';
import { useEnrichedIPs } from '@/hooks/useEnrichedIPs';

// --- Interfaces & Types ---
interface Alert {
  cve_id: string;
  log?: string;
  severity?: number;
  threat_score?: number;
  soc_level?: string;
}

type AlertStatItem = {
  cve_id?: string;
  log?: string;
  severity?: number;
  threat_score?: number;
  soc_level?: string;
};

type DashboardSummary = {
  totalAlerts: number;
  criticalAlerts: number;
  mlAnomalies: number;
  topThreats: Alert[];
  generatedAt: string;
};

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Filler
);

export default function Dashboard() {
  const TOP_THREATS_COUNT = 5;

  // --- States ---
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState({
    total_alerts: 0,
    critical_cves: 0,
    ml_anomalies: 0,
    soc_level: 'Stable'
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // --- Helpers ---
  const isAlertStatItem = useCallback((value: unknown): value is AlertStatItem => {
    return typeof value === 'object' && value !== null;
  }, []);

  const getPriorityScore = (alert: Alert): number => {
    return alert.threat_score ?? alert.severity ?? 0;
  };

  const getBadgeClasses = (score: number): string => {
    if (score >= 9) return 'bg-red-100 text-red-700';
    if (score >= 7) return 'bg-orange-100 text-orange-700';
    return 'bg-emerald-100 text-emerald-700';
  };

  const extractIPFromLog = (log: string): string | null => {
    const match = log.match(/\b\d{1,3}(?:\.\d{1,3}){3}\b/);
    return match ? match[0] : null;
  };

  // mapIPToCountry removed – replaced by useEnrichedIPs hook

  const extractHourFromLog = (log: string): number | null => {
    if (typeof log !== 'string' || log.length < 19) return null;
    const prefix = log.slice(0, 19).replace(' ', 'T');
    const date = new Date(prefix);
    return Number.isNaN(date.getTime()) ? null : date.getHours();
  };

  // --- Data Fetching ---
  const fetchAlerts = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const token = window.localStorage.getItem('token');
      const res = await fetch('http://127.0.0.1:8000/alerts', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();

      if (Array.isArray(data)) {
        const validatedAlerts: Alert[] = data
          .filter(isAlertStatItem)
          .map((item) => ({
            cve_id: typeof item.cve_id === 'string' ? item.cve_id : 'N/A',
            log: item.log,
            severity: item.severity,
            threat_score: item.threat_score,
            soc_level: item.soc_level
          }))
          .filter((a) => a.cve_id !== 'N/A');

        setAlerts(validatedAlerts);
        const mlAnomalies = validatedAlerts.filter((a) => a.cve_id === 'ML-ANOMALY').length;

        setStats({
          total_alerts: validatedAlerts.length,
          critical_cves: validatedAlerts.filter((a) => a.cve_id.startsWith('CVE')).length,
          ml_anomalies: mlAnomalies,
          soc_level: mlAnomalies > 0 ? 'SOC Level 2 - High Risk' : 'SOC Level 1 - Stable'
        });
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  }, [isAlertStatItem]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // --- Memos for Charts & UI ---
  const topThreats = useMemo(() => {
    return [...alerts]
      .sort((a, b) => getPriorityScore(b) - getPriorityScore(a))
      .slice(0, TOP_THREATS_COUNT);
  }, [alerts]);

  const insight = useMemo(() => {
    const criticals = alerts.filter(a => (a.severity ?? 0) >= 8 || a.soc_level?.toLowerCase().includes('critical')).length;
    const anomalies = alerts.filter(a => a.cve_id === 'ML-ANOMALY').length;

    if (criticals > 5) return { tone: 'critical', message: 'High number of critical threats detected.', criticals, anomalies };
    if (anomalies > 0) return { tone: 'anomaly', message: 'Unusual behavior detected in system activity.', criticals, anomalies };
    return { tone: 'stable', message: 'System appears stable. No major threats.', criticals, anomalies };
  }, [alerts]);

  // --- Real-time IP enrichment ---
  const { enrichedIPs, isLoadingGeo } = useEnrichedIPs(alerts);

  const trendChartData = useMemo(() => {
    const hourCounts: Record<number, number> = {};
    alerts.forEach(alert => {
      if (!alert.log) return;
      const hour = extractHourFromLog(alert.log);
      if (hour !== null) hourCounts[hour] = (hourCounts[hour] ?? 0) + 1;
    });
    const hours = Object.keys(hourCounts).map(Number).sort((a, b) => a - b);
    return {
      labels: hours.map(h => `${String(h).padStart(2, '0')}:00`),
      counts: hours.map(h => hourCounts[h]),
    };
  }, [alerts]);

  const exportSummary = useCallback(() => {
    setIsExporting(true);
    try {
      const summary: DashboardSummary = {
        totalAlerts: alerts.length,
        criticalAlerts: insight.criticals,
        mlAnomalies: insight.anomalies,
        topThreats,
        generatedAt: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(summary, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `security-report-${new Date().getTime()}.json`;
      link.click();
    } finally {
      setIsExporting(false);
    }
  }, [alerts, insight, topThreats]);

  // --- Render ---
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-700 p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            Security Overview
          </h1>
          <p className="text-slate-500 mt-2 flex items-center gap-2 font-medium">
            <Clock className="w-4 h-4 text-blue-500" />
            {isLoading ? 'Loading...' : `Last sync: ${lastUpdated.toLocaleTimeString()}`}
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={fetchAlerts}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
          >
            {isRefreshing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Refresh
          </button>
          <button
            onClick={exportSummary}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all"
          >
            <ShieldAlert className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Alerts" value={stats.total_alerts} icon={Activity} gradient="from-blue-500 to-indigo-600" trend="+12%" trendUp />
        <StatCard title="Critical CVEs" value={stats.critical_cves} icon={ShieldAlert} gradient="from-rose-500 to-red-600" trend="+5%" trendUp />
        <StatCard title="ML Anomalies" value={stats.ml_anomalies} icon={Zap} gradient="from-amber-400 to-orange-500" trend="-2%" trendUp={false} />
        <StatCard title="SOC Status" value={stats.soc_level} icon={Target} gradient={stats.soc_level.includes('Stable') ? 'from-emerald-400 to-green-600' : 'from-rose-500 to-red-600'} trend="Live" trendUp isStatus />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Top Threats */}
        <div className="lg:col-span-1 bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
          <h3 className="text-xl font-bold text-slate-800 mb-5">🔥 Top Threats</h3>
          <div className="space-y-3">
            {topThreats.map((alert, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-50 bg-slate-50/50">
                <div className="truncate pr-2">
                  <p className="font-bold text-slate-900 truncate">{alert.cve_id}</p>
                  <p className="text-xs text-slate-500">{alert.soc_level || 'General'}</p>
                </div>
                <span className={`px-3 py-1 rounded-lg text-xs font-bold ${getBadgeClasses(getPriorityScore(alert))}`}>
                  {getPriorityScore(alert)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Distribution Chart */}
        <div className="lg:col-span-1 bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
          <h3 className="text-xl font-bold text-slate-800 mb-8">🎯 Threat Distribution</h3>
          <div className="h-[250px]">
            <Doughnut
              data={{
                labels: ['Critical', 'Anomalies', 'Other'],
                datasets: [{
                  data: [stats.critical_cves, stats.ml_anomalies, stats.total_alerts - (stats.critical_cves + stats.ml_anomalies)],
                  backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6']
                }]
              }}
              options={{ maintainAspectRatio: false }}
            />
          </div>
        </div>

        {/* AI Insights */}
        <div className={`lg:col-span-1 p-8 rounded-3xl shadow-xl border ${insight.tone === 'critical' ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
          <h3 className="text-xl font-bold text-slate-800 mb-4">🧠 AI Insight</h3>
          <p className="font-semibold text-slate-700 mb-4">{insight.message}</p>
          <div className="text-xs font-bold space-y-1">
            <p>Critical: {insight.criticals}</p>
            <p>Anomalies: {insight.anomalies}</p>
          </div>
        </div>

        {/* Alerts Trend */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
          <h3 className="text-xl font-bold text-slate-800 mb-6">📈 Activity Timeline</h3>
          <div className="h-[300px]">
            <Line
              data={{
                labels: trendChartData.labels,
                datasets: [{
                  label: 'Alerts',
                  data: trendChartData.counts,
                  borderColor: '#3b82f6',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  fill: true,
                  tension: 0.4
                }]
              }}
              options={{ maintainAspectRatio: false }}
            />
          </div>
        </div>

        {/* Threat Origins (IP Stats) */}
        <div className="lg:col-span-1 bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
          <h3 className="text-xl font-bold text-slate-800 mb-6">🌍 Threat Origins</h3>

          {/* Loading skeleton */}
          {isLoadingGeo && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoadingGeo && enrichedIPs.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-6">No IP data available.</p>
          )}

          {/* Enriched IP list */}
          {!isLoadingGeo && enrichedIPs.length > 0 && (
            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
              {enrichedIPs.map((item) => (
                <div
                  key={item.ip}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl leading-none">{item.flag}</span>
                      <span className="font-bold text-slate-900 text-sm">{item.country}</span>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-blue-100 text-blue-700">
                      🔢 {item.count}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-500 mt-1 pl-8">
                    <span>🏙️ {item.city}</span>
                    <span>🧠 {item.org}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 pl-8 font-mono">{item.ip}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Sub-components ---
interface StatCardProps {
  title: string;
  value: string | number;
  icon: any;
  gradient: string;
  trend: string;
  trendUp: boolean;
  isStatus?: boolean;
}

function StatCard({ title, value, icon: Icon, gradient, trend, trendUp, isStatus }: StatCardProps) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} text-white`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded ${trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
          {trend}
        </span>
      </div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
      <p className={`font-black ${isStatus ? 'text-sm text-slate-600' : 'text-2xl text-slate-900'}`}>{value}</p>
    </div>
  );
}