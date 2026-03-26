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

interface Alert {
  cve_id: string;
  log?: string;
  severity?: number;
  threat_score?: number;
  soc_level?: string;
}

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

  type AlertStatItem = {
    cve_id?: string;
  };

  type DashboardSummary = {
    totalAlerts: number;
    criticalAlerts: number;
    mlAnomalies: number;
    topThreats: Alert[];
    generatedAt: string;
  };

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

  const isAlertStatItem = useCallback((value: unknown): value is AlertStatItem => {
    return typeof value === 'object' && value !== null;
  }, []);

  const fetchAlerts = useCallback(async () => {
    setIsRefreshing(true);
    setIsLoading(true);
    try {
      const token = window.localStorage.getItem('token');
      const res = await fetch('http://127.0.0.1:8000/alerts', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        const validatedItems = data.filter(isAlertStatItem);
        const validatedAlerts: Alert[] = validatedItems
          .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
          .map((item) => {
            const cveId = typeof item.cve_id === 'string' ? item.cve_id : 'N/A';
            const log = typeof item.log === 'string' ? item.log : undefined;
            const severity =
              typeof item.severity === 'number' && Number.isFinite(item.severity)
                ? item.severity
                : undefined;
            const threatScore =
              typeof item.threat_score === 'number' && Number.isFinite(item.threat_score)
                ? item.threat_score
                : undefined;
            const socLevel = typeof item.soc_level === 'string' ? item.soc_level : undefined;
            return { cve_id: cveId, log, severity, threat_score: threatScore, soc_level: socLevel };
          })
          .filter((a) => a.cve_id !== 'N/A');

        setAlerts(validatedAlerts);
        const mlAnomalies = validatedItems.filter((a) => a.cve_id === 'ML-ANOMALY').length;
        setStats({
          total_alerts: validatedItems.length,
          critical_cves: validatedItems.filter((a) => typeof a.cve_id === 'string' && a.cve_id.startsWith('CVE')).length,
          ml_anomalies: mlAnomalies,
          soc_level: mlAnomalies > 0 ? 'SOC Level 2 - High Risk' : 'SOC Level 1 - Stable'
        });
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  }, [isAlertStatItem]);


  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const getPriorityScore = (alert: Alert): number => {
    if (typeof alert.threat_score === 'number' && Number.isFinite(alert.threat_score)) {
      return alert.threat_score;
    }
    if (typeof alert.severity === 'number' && Number.isFinite(alert.severity)) {
      return alert.severity;
    }
    return 0;
  };

  const getBadgeClasses = (score: number): string => {
    if (score >= 9) return 'bg-red-100 text-red-700';
    if (score >= 7) return 'bg-orange-100 text-orange-700';
    return 'bg-emerald-100 text-emerald-700';
  };

  const parseLogTimestamp = (log: string): Date | null => {
    // Expected prefix: "YYYY-MM-DD HH:mm:ss"
    if (typeof log !== 'string' || log.length < 19) return null;
    const prefix = log.slice(0, 19);
    const isoLike = prefix.replace(' ', 'T');
    const date = new Date(isoLike);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const extractHourFromLog = (log: string): number | null => {
    const ts = parseLogTimestamp(log);
    return ts ? ts.getHours() : null;
  };

  const formatHourLabel = (hour: number): string => `${String(hour).padStart(2, '0')}:00`;

  const topThreats = useMemo(() => {
    const sorted = [...alerts].sort((a, b) => getPriorityScore(b) - getPriorityScore(a));
    return sorted.slice(0, TOP_THREATS_COUNT);
  }, [alerts]);

  const insight = useMemo(() => {
    const totalAlerts = alerts.length;
    const criticalAlerts = alerts.filter((alert) => {
      const severity = typeof alert.severity === 'number' ? alert.severity : undefined;
      const hasCriticalSeverity = typeof severity === 'number' && severity >= 8;

      const socLevel = typeof alert.soc_level === 'string' ? alert.soc_level : '';
      const hasCriticalSoc =
        socLevel.toLowerCase().includes('critical');

      return hasCriticalSeverity || hasCriticalSoc;
    }).length;

    const mlAnomalies = alerts.filter((alert) => alert.cve_id === 'ML-ANOMALY').length;

    if (criticalAlerts > 5) {
      return {
        tone: 'critical' as const,
        message: 'High number of critical threats detected. Immediate attention required.',
        totalAlerts,
        criticalAlerts,
        mlAnomalies,
      };
    }

    if (mlAnomalies > 0) {
      return {
        tone: 'anomaly' as const,
        message: 'Unusual behavior detected. Potential anomaly in system activity.',
        totalAlerts,
        criticalAlerts,
        mlAnomalies,
      };
    }

    return {
      tone: 'stable' as const,
      message: 'System appears stable. No major threats detected.',
      totalAlerts,
      criticalAlerts,
      mlAnomalies,
    };
  }, [alerts]);

  const exportSummary = useCallback(() => {
    setIsExporting(true);
    try {
      const summary: DashboardSummary = {
        totalAlerts: insight.totalAlerts,
        criticalAlerts: insight.criticalAlerts,
        mlAnomalies: insight.mlAnomalies,
        topThreats,
        generatedAt: new Date().toISOString(),
      };

      const json = JSON.stringify(summary, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'dashboard-summary.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  }, [insight, topThreats]);

  const doughnutData = {
    labels: ['CVE Critical', 'ML Anomalies', 'Others'],
    datasets: [
      {
        data: [stats.critical_cves, stats.ml_anomalies, stats.total_alerts - (stats.critical_cves + stats.ml_anomalies)],
        backgroundColor: [
          'rgba(255, 30, 86, 0.85)', // Rose/Red vibrant
          'rgba(255, 150, 0, 0.85)', // Orange vibrant
          'rgba(0, 150, 255, 0.85)', // Blue vibrant
        ],
        borderColor: [
          '#ff1e56',
          '#ff9600',
          '#0096ff',
        ],
        borderWidth: 2,
        hoverOffset: 15,
      },
    ],
  };

  const lineData = {
    labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
    datasets: [
      {
        fill: true,
        label: 'Threat Frequency',
        data: [12, 19, 3, 5, 2, 3, 10],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        tension: 0.4,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#fff',
        pointHoverRadius: 6,
      },
    ],
  };

  const trendChartData = useMemo(() => {
    const hourCounts: Record<number, number> = {};

    for (const alert of alerts) {
      const log = alert.log;
      if (typeof log !== 'string') continue;

      const hour = extractHourFromLog(log);
      if (hour === null) continue;

      hourCounts[hour] = (hourCounts[hour] ?? 0) + 1;
    }

    const hours = Object.keys(hourCounts)
      .map((k) => Number(k))
      .filter((h) => Number.isFinite(h))
      .sort((a, b) => a - b);

    return {
      labels: hours.map(formatHourLabel),
      counts: hours.map((h) => hourCounts[h]),
    };
  }, [alerts]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            Security Overview
          </h1>
          <p className="text-slate-500 mt-2 flex items-center gap-2 font-medium">
            <Clock className="w-4 h-4 text-blue-500" />
            {isLoading ? 'Loading data...' : `Last sync: ${lastUpdated.toLocaleTimeString()}`}
          </p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={fetchAlerts}
            disabled={isRefreshing}
            className={`flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-bold hover:shadow-lg hover:scale-105 active:scale-95 transition-all shadow-md shadow-blue-500/20 disabled:opacity-70`}
          >
            {isRefreshing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>

          <button
            type="button"
            onClick={exportSummary}
            disabled={isLoading || isExporting || isRefreshing}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold border transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed ${
              insight.tone === 'critical'
                ? 'bg-rose-50 border-rose-200 text-rose-900 hover:bg-rose-100'
                : insight.tone === 'anomaly'
                  ? 'bg-orange-50 border-orange-200 text-orange-900 hover:bg-orange-100'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100'
            }`}
          >
            {isExporting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <ShieldAlert className="w-4 h-4" />
            )}
            {isExporting ? 'Exporting...' : 'Export Summary'}
          </button>
        </div>
      </div>
      
      {/* Stat Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-28 rounded-2xl bg-slate-800/70 border border-slate-700" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Total Alerts" 
            value={stats.total_alerts} 
            icon={Activity} 
            gradient="from-blue-500 to-indigo-600"
            trend="+12%"
            trendUp={true}
          />
          <StatCard 
            title="Critical CVEs" 
            value={stats.critical_cves} 
            icon={ShieldAlert} 
            gradient="from-rose-500 to-red-600"
            trend="+5%"
            trendUp={true}
          />
          <StatCard 
            title="ML Anomalies" 
            value={stats.ml_anomalies} 
            icon={Zap} 
            gradient="from-amber-400 to-orange-500"
            trend="-2%"
            trendUp={false}
          />
          <StatCard 
            title="SOC Status" 
            value={stats.soc_level} 
            icon={Target} 
            gradient={stats.soc_level.includes('Stable') ? 'from-emerald-400 to-green-600' : 'from-rose-500 to-red-600'}
            trend="Live"
            trendUp={true}
            isStatus
          />
        </div>
      )}

      {/* Top Threats */}
      {isLoading ? (
        <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 animate-pulse">
          <div className="h-6 w-44 bg-slate-200 rounded mb-5" />
          <div className="space-y-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 rounded-2xl bg-slate-100/70" />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
          <h3 className="text-xl font-bold text-slate-800 mb-5 flex items-center gap-2">
            <span aria-hidden="true">🔥</span>
            Top Threats
          </h3>

          {topThreats.length === 0 ? (
            <p className="text-sm font-medium text-slate-500">No threats found.</p>
          ) : (
            <div className="space-y-3">
              {topThreats.map((alert, idx) => {
                const hasThreatScore =
                  typeof alert.threat_score === 'number' && Number.isFinite(alert.threat_score);
                const scoreValue = getPriorityScore(alert);
                const scoreLabel = hasThreatScore ? 'TS' : 'SEV';
                const badgeClasses = getBadgeClasses(scoreValue);

                return (
                  <div
                    key={`${alert.cve_id}-${scoreValue}-${idx}`}
                    className="flex items-start justify-between gap-4 rounded-2xl px-4 py-3 border border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-black text-slate-900 truncate">{alert.cve_id}</p>
                      <p className="text-xs font-semibold text-slate-500 truncate mt-1">
                        {alert.soc_level ?? 'Unknown'}
                      </p>
                    </div>

                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap shadow-sm ${badgeClasses}`}>
                      <span className="opacity-90">{scoreLabel}</span>
                      {Math.round(scoreValue)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* AI Insight */}
      {isLoading ? (
        <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 animate-pulse">
          <div className="h-6 w-40 bg-slate-200 rounded mb-5" />
          <div className="h-5 w-4/5 bg-slate-200 rounded" />
          <div className="mt-3 h-5 w-3/5 bg-slate-200 rounded" />
        </div>
      ) : (
        <div
          className={`p-8 rounded-3xl shadow-xl shadow-slate-200/50 border ${
            insight.tone === 'critical'
              ? 'bg-rose-50/70 border-rose-100'
              : insight.tone === 'anomaly'
                ? 'bg-orange-50/70 border-orange-100'
                : 'bg-emerald-50/70 border-emerald-100'
          }`}
        >
          <h3 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2">
            <span aria-hidden="true">🧠</span>
            AI Insight
          </h3>

          <div
            className={`rounded-2xl px-4 py-3 border ${
              insight.tone === 'critical'
                ? 'bg-rose-100/60 border-rose-200 text-rose-900'
                : insight.tone === 'anomaly'
                  ? 'bg-orange-100/60 border-orange-200 text-orange-900'
                  : 'bg-emerald-100/60 border-emerald-200 text-emerald-900'
            }`}
          >
            <p className="text-sm font-semibold leading-relaxed">
              {insight.message}
            </p>

            <p
              className={`mt-2 text-xs font-bold ${
                insight.tone === 'critical'
                  ? 'text-rose-800'
                  : insight.tone === 'anomaly'
                    ? 'text-orange-800'
                    : 'text-emerald-800'
              }`}
            >
              {insight.criticalAlerts > 0 ? `Critical: ${insight.criticalAlerts} • ` : ''}
              Anomalies (ML): {insight.mlAnomalies} • Total: {insight.totalAlerts}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isLoading ? (
          <div className="h-64 rounded-2xl bg-slate-800/70 border border-slate-700 animate-pulse" />
        ) : (
          <AlertChart />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-1">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Threat Activity Timeline
            </h3>
          </div>
          <div className="h-[350px]">
            <Line data={lineData} options={{ 
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                y: { grid: { color: '#f1f5f9' }, ticks: { color: '#94a3b8' } },
                x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
              }
            }} />
          </div>
        </div>

        {/* Distribution Chart */}
        <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
          <h3 className="text-xl font-bold text-slate-800 mb-8 flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-500" />
            Threat Distribution
          </h3>
          <div className="h-[300px] flex items-center justify-center">
            <Doughnut data={doughnutData} options={{ 
              maintainAspectRatio: false, 
              plugins: { 
                legend: { 
                  position: 'bottom',
                  labels: { usePointStyle: true, padding: 25, font: { weight: 'bold', size: 12 } } 
                } 
              } 
            }} />
          </div>
        </div>

        {/* Alerts Trend Chart */}
        <div className="lg:col-span-3 bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="flex items-center justify-between mb-6 gap-4">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              📊 Alerts Trend
            </h3>
          </div>

          {isLoading ? (
            <div className="h-[280px] rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />
          ) : trendChartData.labels.length === 0 ? (
            <div className="h-[280px] flex items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50">
              <p className="text-sm font-semibold text-slate-600">
                No timestamps found in alerts logs.
              </p>
            </div>
          ) : (
            <div className="h-[280px]">
              <Line
                data={{
                  labels: trendChartData.labels,
                  datasets: [
                    {
                      label: 'Alerts per hour',
                      data: trendChartData.counts,
                      borderColor: '#3b82f6',
                      backgroundColor: 'rgba(59, 130, 246, 0.15)',
                      tension: 0.4,
                      pointBackgroundColor: '#3b82f6',
                      pointBorderColor: '#fff',
                      pointHoverRadius: 6,
                    },
                  ],
                }}
                options={{
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: { grid: { color: '#f1f5f9' }, ticks: { color: '#94a3b8' } },
                    x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
                  },
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type StatCardProps = {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  trend: string;
  trendUp: boolean;
  isStatus?: boolean;
};

function StatCard({ title, value, icon: Icon, gradient, trend, trendUp, isStatus = false }: StatCardProps) {
  return (
    <div className="group bg-white p-1 rounded-2xl shadow-lg shadow-slate-200/50 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
      <div className="bg-white p-5 rounded-xl border border-slate-50 flex flex-col h-full">
        <div className="flex justify-between items-start mb-6">
          <div className={`p-3 rounded-2xl bg-gradient-to-br ${gradient} shadow-lg shadow-current/10 text-white group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="w-6 h-6" />
          </div>
          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            {trend} {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          </div>
        </div>
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
          <p className={`font-black tracking-tight ${isStatus ? 'text-lg text-slate-700 truncate' : 'text-3xl text-slate-900'}`}>{value}</p>
        </div>
      </div>
    </div>
  );
}
