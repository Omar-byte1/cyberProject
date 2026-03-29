'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  Search, 
  Filter,
  ChevronRight,
  Database,
  History,
  Info,
  ExternalLink,
  Loader2,
  Trash2
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIncident, setSelectedIncident] = useState<any>(null);

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      const token = window.localStorage.getItem('token');
      const res = await fetch('http://127.0.0.1:8000/incidents', {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        }
      });
      if (res.ok) {
        const data = await res.json();
        setIncidents(data);
      }
    } catch (err) {
      console.error("Failed to fetch incidents", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredIncidents = incidents.filter(inc => 
    inc.verdict.toLowerCase().includes(searchTerm.toLowerCase()) || 
    inc.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inc.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: incidents.length,
    critical: incidents.filter(i => i.risk_score >= 80).length,
    medium: incidents.filter(i => i.risk_score < 80 && i.risk_score > 30).length,
    clean: incidents.filter(i => i.risk_score <= 30).length,
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-5 duration-700">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-500/20">
              <History className="text-white w-5 h-5" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight underline decoration-blue-500/30">Incident History</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium ml-1 flex items-center gap-2">
            <Database className="w-4 h-4" />
            Persistent digital forensics and threat investigation records
          </p>
        </div>
        <ThemeToggle />
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Cases', value: stats.total, color: 'blue' },
          { label: 'Critical', value: stats.critical, color: 'rose' },
          { label: 'Warning', value: stats.medium, color: 'amber' },
          { label: 'Clean', value: stats.clean, color: 'emerald' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className={`text-3xl font-black text-${stat.color}-600 dark:text-${stat.color}-400 underline decoration-2 decoration-offset-4 decoration-${stat.color}-500/20`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden min-h-[400px]">
        
        {/* Toolbar */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/50 dark:bg-slate-950/20">
           <div className="relative group w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by ID, Verdict or Attack Type..."
                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-inner"
              />
           </div>
           <button className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors">
              <Filter className="w-4 h-4" /> Filter Records
           </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-80 opacity-40">
             <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
             <p className="text-xs font-black uppercase tracking-widest text-slate-500">Retrieving Forensics Database...</p>
          </div>
        ) : filteredIncidents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-80 opacity-30">
             <Database className="w-16 h-16 text-slate-300 mb-4" />
             <p className="text-xs font-black uppercase tracking-widest text-slate-400">No incident records found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredIncidents.map((incident) => (
              <div 
                key={incident.id} 
                className="group p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer"
                onClick={() => setSelectedIncident(incident)}
              >
                <div className="flex items-center gap-8">
                  {/* Status Badge */}
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${
                    incident.risk_score >= 80 ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600' : 
                    incident.risk_score > 30 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
                  }`}>
                    {incident.risk_score >= 80 ? <ShieldAlert className="w-7 h-7" /> : <ShieldCheck className="w-7 h-7" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-3 mb-1">
                       <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                         {incident.id}
                       </span>
                       <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">{incident.verdict}</h3>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                       <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(incident.timestamp).toLocaleDateString()} at {new Date(incident.timestamp).toLocaleTimeString()}
                       </div>
                       <span className="w-1 h-1 bg-slate-300 rounded-full" />
                       <div className="flex items-center gap-1.5">
                          <ShieldAlert className="w-3.5 h-3.5 opacity-50" />
                          {incident.type}
                       </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                   <div className="text-right hidden md:block">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Risk Intensity</p>
                      <div className="flex items-center gap-2">
                         <div className="h-1.5 w-24 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${incident.risk_score}%` }} />
                         </div>
                         <span className="text-sm font-black text-slate-700 dark:text-slate-300">{incident.risk_score}%</span>
                      </div>
                   </div>
                   <button className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <ChevronRight className="w-5 h-5" />
                   </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Incident Detail Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 animate-in fade-in duration-300" onClick={() => setSelectedIncident(null)}>
           <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
              
              <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20">
                 <div className="flex items-center gap-6">
                    <div className="bg-slate-900 p-4 rounded-2xl shadow-xl">
                       <ShieldAlert className="w-8 h-8 text-white" />
                    </div>
                    <div>
                       <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{selectedIncident.verdict}</h2>
                       <p className="text-sm font-bold text-blue-600">Incident Reference: {selectedIncident.id}</p>
                    </div>
                 </div>
                 <button onClick={() => setSelectedIncident(null)} className="w-12 h-12 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full flex items-center justify-center transition-all text-slate-400">
                    <Trash2 className="w-6 h-6" onClick={() => setSelectedIncident(null)} />
                 </button>
              </div>

              <div className="p-10 overflow-y-auto flex-1 space-y-10 custom-scrollbar">
                 
                 <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { label: 'Risk Score', value: `${selectedIncident.risk_score}%` },
                      { label: 'Analysis At', value: new Date(selectedIncident.timestamp).toLocaleTimeString() },
                      { label: 'Type', value: selectedIncident.type },
                      { label: 'Threat Status', value: selectedIncident.risk_score > 70 ? 'CRITICAL' : 'REview Required' }
                    ].map(m => (
                      <div key={m.label} className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{m.label}</p>
                        <p className="text-sm font-black text-slate-800 dark:text-slate-200">{m.value}</p>
                      </div>
                    ))}
                 </div>

                 {/* Indicators from Sandbox */}
                 {selectedIncident.details.indicators && (
                   <div className="space-y-4">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Correlated Indicators</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedIncident.details.indicators.map((ind: any, i: number) => (
                          <div key={i} className="flex items-center gap-4 bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                             <div className={`w-2 h-2 rounded-full ${ind.risk === 'Critical' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                             <div className="flex-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase">{ind.type}</p>
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{ind.detail}</p>
                             </div>
                          </div>
                        ))}
                      </div>
                   </div>
                 )}

                 {/* Technical Logs */}
                 <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Forensic Log Extract</h4>
                    <div className="bg-slate-950 p-8 rounded-[2rem] font-mono text-[11px] leading-relaxed text-blue-400/80 border border-slate-800 overflow-x-auto">
                       <pre>{JSON.stringify(selectedIncident.details, null, 2)}</pre>
                    </div>
                 </div>
              </div>

              <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-4 bg-slate-50/50 dark:bg-slate-950/20">
                 <button className="px-8 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 dark:text-white flex items-center gap-3">
                    <ExternalLink className="w-4 h-4" /> Download Report
                 </button>
                 <button onClick={() => setSelectedIncident(null)} className="px-10 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all">
                    Close Case
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Info Notice */}
      <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white flex flex-col md:flex-row items-center gap-8 shadow-2xl shadow-indigo-500/30">
        <div className="bg-white/10 p-6 rounded-3xl outline outline-4 outline-white/5">
           <Info className="w-10 h-10" />
        </div>
        <div className="space-y-2 text-center md:text-left">
           <h3 className="text-2xl font-black uppercase tracking-tighter">Reporting Digital Compliance</h3>
           <p className="text-sm font-medium opacity-80 max-w-2xl leading-relaxed">
             This dashboard displays a historical record of all incidents reported via the AI Sandbox or SOC manual actions. 
             Use this history for compliance audits and cross-departmental incident reviews.
           </p>
        </div>
      </div>

    </div>
  );
}
