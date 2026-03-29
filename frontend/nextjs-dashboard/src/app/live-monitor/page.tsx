'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  ShieldCheck, 
  ShieldAlert, 
  Zap, 
  Globe, 
  Cpu, 
  Database,
  ArrowRight
} from 'lucide-react';
import LiveTrafficChart from '@/components/LiveTrafficChart';
import { ThemeToggle } from '@/components/ThemeToggle';

interface Packet {
  timestamp: string;
  source: string;
  destination: string;
  protocol: string;
  size: string;
  risk_score: number;
  verdict: string;
}

export default function LiveMonitorPage() {
  const [packets, setPackets] = useState<Packet[]>([]);
  const [isLive, setIsLive] = useState(true);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Stats derived from packets
  const avgRisk = packets.length > 0 
    ? (packets.reduce((acc, p) => acc + p.risk_score, 0) / packets.length).toFixed(1)
    : "0.0";
    
  const criticalCount = packets.filter(p => p.risk_score > 7).length;

  useEffect(() => {
    if (!isLive) return;

    const fetchTraffic = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/live-traffic');
        if (!res.ok) throw new Error('API Error');
        const newPackets = await res.json();
        
        setPackets(prev => {
          const updated = [...newPackets, ...prev].slice(0, 100);
          return updated;
        });
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch live traffic", err);
      }
    };

    // Initial fetch
    fetchTraffic();

    const interval = setInterval(fetchTraffic, 3000);
    return () => clearInterval(interval);
  }, [isLive]);

  // Auto-scroll to top when new packets arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [packets]);

  return (
    <div className="space-y-6">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-500/20">
            <Activity className="text-white w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Cyber Sentinel</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Real-time AI Network Analysis</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsLive(!isLive)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              isLive 
                ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' 
                : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`} />
            {isLive ? 'LIVE CAPTURE' : 'PAUSED'}
          </button>
          <ThemeToggle />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <Zap className="w-5 h-5 text-amber-500" />
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Avg Risk Score</span>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{avgRisk}/10</p>
          <div className="mt-2 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
             <div 
               className="h-full bg-amber-500 transition-all duration-500" 
               style={{ width: `${Math.min(parseFloat(avgRisk) * 10, 100)}%` }} 
             />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <ShieldAlert className="w-5 h-5 text-rose-500" />
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Critical Anomalies</span>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{criticalCount}</p>
          <p className="text-xs text-rose-500 font-bold mt-1">Requires Immediate Attention</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <Globe className="w-5 h-5 text-blue-500" />
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Links</span>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{packets.length}</p>
          <p className="text-xs text-slate-500 font-bold mt-1">Packets in Buffer</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">AI Confidence</span>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">99.2%</p>
          <p className="text-xs text-emerald-500 font-bold mt-1">Model: RF-HyperSentinel v2</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Live Traffic Chart */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="mb-6">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Risk Pulse</h3>
            <p className="text-xs text-slate-500">Real-time threat level fluctuations</p>
          </div>
          <div className="flex-1 min-h-[250px]">
            <LiveTrafficChart data={packets.slice(0, 50).reverse().map(p => ({ timestamp: p.timestamp, risk_score: p.risk_score }))} />
          </div>
          <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">System Analytics</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed font-mono">
              [SYSTEM] Processing 12.4k packets/sec<br/>
              [AI] Anomaly detection latency: 14ms<br/>
              [DB] Indexing headers... OK
            </p>
          </div>
        </div>

        {/* Live Matrix Feed */}
        <div className="lg:col-span-2 bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[600px]">
          <div className="bg-slate-900/50 border-b border-slate-800 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">Network Interception Feed</span>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500">
              <span className="flex items-center gap-1"><Database className="w-3 h-3" /> BUFFER: 100/100</span>
              <span className="flex items-center gap-1"><ArrowRight className="w-3 h-3" /> STREAMING</span>
            </div>
          </div>

          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-2 font-mono text-[11px] scrollbar-thin scrollbar-thumb-slate-800"
          >
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4">
                <Activity className="w-8 h-8 animate-spin text-indigo-500" />
                <p className="animate-pulse">INITIALIZING SENTINEL NODE...</p>
              </div>
            ) : (
              <table className="w-full border-collapse">
                <thead className="sticky top-0 bg-slate-950 z-10">
                  <tr className="text-slate-500 border-b border-slate-800 text-left">
                    <th className="p-2 font-bold uppercase tracking-tighter">Time</th>
                    <th className="p-2 font-bold uppercase tracking-tighter text-blue-400">Source IP</th>
                    <th className="p-2 font-bold uppercase tracking-tighter">Proto</th>
                    <th className="p-2 font-bold uppercase tracking-tighter">Size</th>
                    <th className="p-2 font-bold uppercase tracking-tighter text-amber-500">Risk</th>
                    <th className="p-2 font-bold uppercase tracking-tighter">AI Verdict</th>
                  </tr>
                </thead>
                <tbody>
                  {packets.map((packet, i) => (
                    <tr 
                      key={`${packet.timestamp}-${i}`} 
                      className={`border-b border-slate-900/50 transition-colors ${
                        packet.risk_score > 7 
                          ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-200' 
                          : 'hover:bg-slate-900/40 text-slate-300'
                      }`}
                    >
                      <td className="p-2 text-slate-600">{packet.timestamp}</td>
                      <td className={`p-2 font-bold ${packet.risk_score > 7 ? 'text-rose-400' : 'text-blue-400'}`}>
                        {packet.source}
                      </td>
                      <td className="p-2"><span className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-400">{packet.protocol}</span></td>
                      <td className="p-2 text-slate-500">{packet.size}</td>
                      <td className={`p-2 font-black ${
                        packet.risk_score > 7 ? 'text-rose-500' : packet.risk_score > 4 ? 'text-amber-500' : 'text-emerald-500'
                      }`}>
                        {packet.risk_score}
                      </td>
                      <td className="p-2 italic">
                        {packet.risk_score > 7 && <ShieldAlert className="inline w-3 h-3 mr-1 mb-0.5" />}
                        {packet.verdict}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
