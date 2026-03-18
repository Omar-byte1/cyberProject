'use client';

import { useCallback, useEffect, useState } from 'react';
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
  const [stats, setStats] = useState({
    total_alerts: 0,
    critical_cves: 0,
    ml_anomalies: 0,
    soc_level: 'Stable'
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  type AlertStatItem = {
    cve_id?: string;
  };

  const isAlertStatItem = useCallback((value: unknown): value is AlertStatItem => {
    return typeof value === 'object' && value !== null;
  }, []);

  const fetchData = useCallback(async () => {
    setIsRefreshing(true);
    setIsLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/alerts');
      const data = await res.json();
      if (Array.isArray(data)) {
        const validatedItems = data.filter(isAlertStatItem);
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
    fetchData();
  }, [fetchData]);

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
            onClick={fetchData}
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
