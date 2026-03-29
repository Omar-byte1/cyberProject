'use client';

import React from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  ShieldX, 
  Info, 
  MapPin, 
  Server, 
  Calendar,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import Toast from './Toast';

interface IPAnalysis {
  ip: string;
  reputation: 'Clean' | 'Suspicious' | 'Malicious';
  risk_score: number;
  geo: {
    country: string;
    city: string;
    isp: string;
  };
  threat_types: string[];
  recommendation: string;
  last_seen: string;
}

interface IPAnalysisResultsProps {
  data: IPAnalysis;
}

export default function IPAnalysisResults({ data }: IPAnalysisResultsProps) {
  const [isActing, setIsActing] = React.useState<string | null>(null);
  const [toast, setToast] = React.useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleAction = async (action: 'block' | 'monitor' | 'ignore') => {
    setIsActing(action);
    setToast(null);

    // Simulate API delay
    await new Promise(r => setTimeout(r, 1200));

    try {
      const token = window.localStorage.getItem('token');
      const res = await fetch('http://127.0.0.1:8000/ip-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ ip: data.ip, action }),
      });

      if (!res.ok) throw new Error('Failed to perform SOC action');

      const result = await res.json();
      setToast({ message: result.message, type: 'success' });
    } catch (err) {
      setToast({ message: "Erreur lors de l'exécution de l'action SOC.", type: 'error' });
    } finally {
      setIsActing(null);
    }
  };

  const getReputationStyles = () => {
    switch (data.reputation) {
      case 'Clean':
        return {
          bg: 'bg-emerald-500/10',
          text: 'text-emerald-500',
          border: 'border-emerald-500/20',
          icon: <ShieldCheck className="w-12 h-12 text-emerald-500" />
        };
      case 'Suspicious':
        return {
          bg: 'bg-amber-500/10',
          text: 'text-amber-500',
          border: 'border-amber-500/20',
          icon: <ShieldAlert className="w-12 h-12 text-amber-500" />
        };
      case 'Malicious':
        return {
          bg: 'bg-rose-500/10',
          text: 'text-rose-500',
          border: 'border-rose-500/20',
          icon: <ShieldX className="w-12 h-12 text-rose-500" />
        };
    }
  };

  const styles = getReputationStyles();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
      
      {/* Reputation Card */}
      <div className={`lg:col-span-1 p-8 rounded-3xl border ${styles.border} ${styles.bg} flex flex-col items-center text-center shadow-lg shadow-black/5`}>
        <div className="mb-4 p-4 bg-white/20 dark:bg-black/20 rounded-full backdrop-blur-sm">
          {styles.icon}
        </div>
        <h3 className={`text-2xl font-black uppercase tracking-tighter ${styles.text}`}>
          {data.reputation}
        </h3>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Reputation Status</p>
        
        <div className="mt-8 w-full space-y-4">
          <div className="bg-white dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] uppercase tracking-widest font-black text-slate-400 block mb-1">Risk Intensity</span>
            <div className="flex items-center justify-between">
              <span className={`text-3xl font-black ${styles.text}`}>{data.risk_score}%</span>
              <div className="flex-1 ml-4 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${data.risk_score > 70 ? 'bg-rose-500' : data.risk_score > 30 ? 'bg-amber-500' : 'bg-emerald-500'} transition-all duration-1000`} 
                  style={{ width: `${data.risk_score}%` }} 
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details Card */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Info className="w-5 h-5 text-indigo-500" />
            <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-sm">Intelligence Breakdown</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
              <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                <MapPin className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Geographic Info</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{data.geo.country}, {data.geo.city}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
              <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                <Server className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Provider / ISP</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{data.geo.isp}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
              <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                <Calendar className="w-5 h-5 text-slate-500" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Last Detection</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{data.last_seen}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
              <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Threat Vectors</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {data.threat_types.length > 0 ? data.threat_types.join(', ') : 'None Identified'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800/50">
            <h5 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <ShieldCheck className="w-3 h-3" />
              AI Recommendation
            </h5>
            <p className="text-sm text-indigo-900 dark:text-indigo-100 font-medium leading-relaxed">
              {data.recommendation}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button 
            disabled={!!isActing}
            onClick={() => handleAction('ignore')}
            className="px-6 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isActing === 'ignore' && <Loader2 className="w-4 h-4 animate-spin" />}
            Ignorer
          </button>
          <button 
            disabled={!!isActing}
            onClick={() => handleAction(data.reputation === 'Clean' ? 'monitor' : 'block')}
            className={`px-6 py-3 rounded-xl font-bold text-sm text-white shadow-lg shadow-black/10 transition-transform active:scale-95 disabled:opacity-50 flex items-center gap-2 ${
              data.reputation === 'Clean' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            {isActing && isActing !== 'ignore' && <Loader2 className="w-4 h-4 animate-spin" />}
            {data.reputation === 'Clean' ? 'Monitorer' : 'Bloquer l\'IP'}
          </button>
        </div>
      </div>

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
}
