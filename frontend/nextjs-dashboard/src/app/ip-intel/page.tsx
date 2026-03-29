'use client';

import React, { useState } from 'react';
import { Search, Globe, ShieldAlert, Loader2, Info } from 'lucide-react';
import IPAnalysisResults from '@/components/IPAnalysisResults';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function IPIntelPage() {
  const [ip, setIp] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ip.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const token = window.localStorage.getItem('token');
      const res = await fetch(`http://127.0.0.1:8000/ip-lookup/${ip}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        throw new Error('IP Lookup failed. Ensure the backend is running and you are logged in.');
      }

      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* Header Section */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
              <Globe className="text-white w-5 h-5 animate-pulse" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">IP Intelligence Hub</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium ml-1">AI-Powered Global Reputation & Threat Analysis</p>
        </div>
        <ThemeToggle />
      </div>

      {/* Search Bar */}
      <section className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/20 dark:shadow-none">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Ex: 8.8.8.8 or 185.23.4.99..."
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500/50 focus:bg-white dark:focus:bg-slate-900 rounded-[2rem] px-14 py-4 font-bold text-slate-900 dark:text-white transition-all outline-none shadow-inner"
            />
          </div>
          <button 
            type="submit"
            disabled={loading || !ip.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-black px-10 py-4 rounded-[2rem] shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            ANALYSER
          </button>
        </form>
      </section>

      {/* Error State */}
      {error && (
        <div className="p-6 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/50 rounded-3xl flex items-center gap-4 text-rose-600 dark:text-rose-400 font-bold animate-in bounce-in duration-300">
          <ShieldAlert className="w-6 h-6 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Initial/Empty State */}
      {!result && !loading && !error && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
           <div className="p-10 bg-slate-100 dark:bg-slate-800 rounded-full">
              <Globe className="w-16 h-16 text-slate-400" />
           </div>
           <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Prêt pour l'Analyse</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Entrez une adresse IP ci-dessus pour lancer le diagnostic IA.</p>
           </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 space-y-6">
           <div className="relative">
              <div className="w-24 h-24 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
              <Globe className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-blue-500 animate-pulse" />
           </div>
           <div className="text-center">
              <p className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">Consultation des sources Threat Intelligence...</p>
              <p className="text-sm text-slate-500 font-medium">L'IA analyse les vecteurs de menaces mondiaux.</p>
           </div>
        </div>
      )}

      {/* Result State */}
      {result && <IPAnalysisResults data={result} />}

      {/* Info Footer */}
      <footer className="pt-10">
        <div className="p-6 bg-slate-900/5 dark:bg-white/5 rounded-3xl border border-slate-200/50 dark:border-white/5 flex items-start gap-4">
           <Info className="w-5 h-5 text-slate-400 mt-1" />
           <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Notice</p>
              <p className="text-xs text-slate-500 dark:text-slate-500 font-medium leading-relaxed">
                Cet outil agrège des données provenant de bases de réputation IP simulées. Pour une utilisation réelle, une connexion à des API professionnelles comme AlienVault OTX ou VirusTotal est nécessaire. Les scores de risque sont calculés via notre moteur IA local.
              </p>
           </div>
        </div>
      </footer>

    </div>
  );
}
