'use client';

import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
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
import WorldMap, { ThreatLocation } from '@/components/WorldMap';
import { ThemeToggle } from '@/components/ThemeToggle';
import AICopilot from '@/components/AICopilot';
import { useAlertContext } from '@/contexts/AlertContext';

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

  // --- Global Context States ---
  const { 
    alerts, isSimulating, toggleSimulation, toastMessage, fetchAlerts, isLoading, isRefreshing 
  } = useAlertContext();

  const [isExporting, setIsExporting] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // --- Dynamic Stats ---
  const stats = useMemo(() => {
    const total_alerts = alerts.length;
    const critical_cves = alerts.filter(a => a.cve_id && a.cve_id.startsWith('CVE-')).length;
    const ml_anomalies = alerts.filter(a => a.cve_id === 'ML-ANOMALY').length;
    const soc_level = ml_anomalies > 0 || alerts.some(a => (a.threat_score || 0) >= 9) 
      ? 'SOC Level 2 - High Risk' 
      : 'SOC Level 1 - Stable';
      
    return {
      total_alerts,
      critical_cves,
      ml_anomalies,
      soc_level
    };
  }, [alerts]);

  // Update time when alerts change (acting as sync time)
  useEffect(() => {
    setLastUpdated(new Date());
  }, [alerts]);

  // --- Helpers ---
  const getPriorityScore = (alert: Alert): number => {
    return alert.threat_score ?? alert.severity ?? 0;
  };

  const getBadgeClasses = (score: number): string => {
    if (score >= 9) return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
    if (score >= 7) return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400';
    return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400';
  };

  // --- Real-time Simulation Logic ---
  const extractHourFromLog = (log: string): number | null => {
    if (typeof log !== 'string' || log.length < 19) return null;
    const prefix = log.slice(0, 19).replace(' ', 'T');
    const date = new Date(prefix);
    return Number.isNaN(date.getTime()) ? null : date.getHours();
  };

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

  const mapData: ThreatLocation[] = useMemo(() => {
    return enrichedIPs.map(item => ({
      country: item.country,
      count: item.count
    }));
  }, [enrichedIPs]);

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
    <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-700 p-6 bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            Security Overview
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-2 font-medium">
            <Clock className="w-4 h-4 text-blue-500" />
            {isLoading ? 'Loading...' : `Last sync: ${lastUpdated.toLocaleTimeString()}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <ThemeToggle />
          <button
            onClick={toggleSimulation}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg text-white ${
              isSimulating 
                ? 'bg-rose-500 hover:bg-rose-600 animate-pulse shadow-rose-500/30 ring-2 ring-rose-300' 
                : 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 shadow-red-500/20'
            }`}
          >
            <Zap className={`w-4 h-4 ${isSimulating ? 'animate-bounce' : ''}`} />
            {isSimulating ? 'Stop Simulation' : 'Simulate Attack'}
          </button>
          
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
            className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
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
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-5">🔥 Top Threats</h3>
          <div className="space-y-3">
            {topThreats.map((alert, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                <div className="truncate pr-2">
                  <p className="font-bold text-slate-900 dark:text-slate-200 truncate">{alert.cve_id}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{alert.soc_level || 'General'}</p>
                </div>
                <span className={`px-3 py-1 rounded-lg text-xs font-bold ${getBadgeClasses(getPriorityScore(alert))}`}>
                  {getPriorityScore(alert)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Distribution Chart */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-8">🎯 Threat Distribution</h3>
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
        <div className={`lg:col-span-1 p-8 rounded-3xl shadow-xl border transition-colors ${insight.tone === 'critical' ? 'bg-red-50 dark:bg-rose-950/20 border-red-100 dark:border-rose-900' : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900'}`}>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">🧠 AI Insight</h3>
          <p className="font-semibold text-slate-700 dark:text-slate-300 mb-4">{insight.message}</p>
          <div className="text-xs font-bold space-y-1 text-slate-600 dark:text-slate-400">
            <p>Critical: <span className={insight.criticals > 0 ? "text-red-500" : ""}>{insight.criticals}</span></p>
            <p>Anomalies: <span className={insight.anomalies > 0 ? "text-orange-500" : ""}>{insight.anomalies}</span></p>
          </div>
        </div>

        {/* Alerts Trend */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6">📈 Activity Timeline</h3>
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
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6">🌍 Threat Origins</h3>

          {/* Loading skeleton */}
          {isLoadingGeo && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
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
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl leading-none">{item.flag}</span>
                      <span className="font-bold text-slate-900 dark:text-slate-200 text-sm">{item.country}</span>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                      🔢 {item.count}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400 mt-1 pl-8">
                    <span>🏙️ {item.city}</span>
                    <span>🧠 {item.org}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 pl-8 font-mono">{item.ip}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Global Threat Map */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 mb-8 z-10 relative">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">🌍 Global Threat Map</h3>
            <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 rounded-lg text-xs font-bold border border-indigo-100 dark:border-indigo-800/50 shadow-sm">Live Origins</span>
          </div>
          {isLoadingGeo ? (
            <div className="w-full h-[400px] sm:h-[500px] flex gap-2 flex-col items-center justify-center animate-pulse bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700 mb-4 animate-bounce" />
                <div className="w-48 h-4 rounded-full bg-slate-200 dark:bg-slate-700" />
                <div className="w-32 h-3 rounded-full bg-slate-200 dark:bg-slate-700" />
            </div>
          ) : (
            <WorldMap data={mapData} />
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 backdrop-blur-md text-white px-6 py-4 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <ShieldAlert className="w-5 h-5 text-red-400" />
          <p className="font-bold text-sm tracking-wide">{toastMessage}</p>
        </div>
      )}

      {/* AI Chatbot Copilot */}
      <AICopilot alerts={alerts} />
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
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-md border border-slate-100 dark:border-slate-800 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} text-white`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded ${trendUp ? 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-400'}`}>
          {trend}
        </span>
      </div>
      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{title}</p>
      <p className={`font-black ${isStatus ? 'text-sm text-slate-600 dark:text-slate-300' : 'text-2xl text-slate-900 dark:text-slate-100'}`}>{value}</p>
    </div>
  );
}