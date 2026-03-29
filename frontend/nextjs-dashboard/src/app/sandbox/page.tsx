'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  FlaskConical, 
  Mail, 
  FileCode2, 
  ShieldAlert, 
  Loader2, 
  ArrowRight,
  Sparkles,
  Terminal,
  Cpu,
  ShieldCheck,
  X
} from 'lucide-react';
import SandboxReport from '@/components/SandboxReport';
import { ThemeToggle } from '@/components/ThemeToggle';

const DETONATION_STEPS = [
  "Initializing isolated VM environment (Windows 10 x64)...",
  "Loading analysis engine 'Antigravity AI'...",
  "Snapshotting clean system state...",
  "Starting kernel-level API monitoring...",
  "Detonating specimen in secure chamber...",
  "Tracing process lifecycle and child forks...",
  "Intercepting HTTP/SSL traffic...",
  "Monitoring registry and file system modifications...",
  "Running heuristic pattern matching...",
  "Correlating behaviors with MITRE ATT&CK base...",
  "Generating final forensic report..."
];

export default function SandboxPage() {
  const [activeTab, setActiveTab] = useState<'email' | 'file'>('email');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<{name: string, size: string} | null>(null);
  const [detonationLogs, setDetonationLogs] = useState<string[]>([]);
  
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [detonationLogs]);

  const runDetonationSequence = async () => {
    setDetonationLogs([]);
    for (const step of DETONATION_STEPS) {
      setDetonationLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${step}`]);
      await new Promise(r => setTimeout(r, 250 + Math.random() * 400));
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'email' && !content.trim()) return;
    if (activeTab === 'file' && !selectedFile) return;
    
    setLoading(true);
    setError(null);
    setReport(null);

    // Run theatrical detonation sequence
    await runDetonationSequence();

    try {
      const token = window.localStorage.getItem('token');
      const res = await fetch('http://127.0.0.1:8000/analyze-sandbox', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          type: activeTab,
          content: activeTab === 'file' ? selectedFile?.name : content
        }),
      });

      if (!res.ok) {
        throw new Error('Analysis failed. Backend unreachable or session expired.');
      }

      const data = await res.json();
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis timeout');
    } finally {
      setLoading(false);
    }
  };

  const simulateFileSelect = () => {
    const files = [
      { name: "invoice_9921.pdf.exe", size: "2.4 MB" },
      { name: "update_patch_system.vbs", size: "12 KB" },
      { name: "salary_spreadsheet_Q1.xlsx.js", size: "450 KB" }
    ];
    setSelectedFile(files[Math.floor(Math.random() * files.length)]);
    setReport(null);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-500/20">
              <FlaskConical className="text-white w-5 h-5" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">AI Sandbox</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium ml-1">Heuristic Malware Detect & Detonation Chamber</p>
        </div>
        <ThemeToggle />
      </div>

      {/* Main Analysis Tool */}
      {!loading && !report && (
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden scale-in-center">
          
          {/* Tabs Navigation */}
          <div className="flex border-b border-slate-100 dark:border-slate-800 p-2 gap-2">
            <button 
              onClick={() => { setActiveTab('email'); setReport(null); }}
              className={`flex-1 flex items-center justify-center gap-3 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                activeTab === 'email' 
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-xl' 
                  : 'text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <Mail className="w-4 h-4" />
              Email Detonation
            </button>
            <button 
              onClick={() => { setActiveTab('file'); setReport(null); }}
              className={`flex-1 flex items-center justify-center gap-3 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                activeTab === 'file' 
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-xl' 
                  : 'text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <FileCode2 className="w-4 h-4" />
              Malware Detonation
            </button>
          </div>

          {/* Input Area */}
          <div className="p-8">
            <form onSubmit={handleAnalyze} className="space-y-6">
              {activeTab === 'email' ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-4">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Mail Body / Header Source</label>
                    <span className="text-[10px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-lg font-black">AI ANALYZER v3</span>
                  </div>
                  <textarea 
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Collez ici le contenu suspect de l'email..."
                    className="w-full h-48 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 focus:border-indigo-500/50 rounded-[2rem] p-6 text-sm font-medium text-slate-700 dark:text-slate-300 transition-all outline-none resize-none shadow-inner"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  {!selectedFile ? (
                    <div 
                      onClick={simulateFileSelect}
                      className="border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-16 flex flex-col items-center justify-center text-center group hover:border-indigo-500/30 transition-all cursor-pointer bg-slate-50/50 dark:bg-slate-950/20"
                    >
                      <div className="w-24 h-24 bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all border border-slate-100 dark:border-slate-800">
                          <FileCode2 className="w-10 h-10 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                      </div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white">Sélectionner un fichier suspect</h3>
                      <p className="text-sm text-slate-500 font-medium mt-1">L'IA isolera et analysera le binaire (simulation)</p>
                    </div>
                  ) : (
                    <div className="bg-indigo-50 dark:bg-indigo-950/30 border-2 border-indigo-100 dark:border-indigo-500/20 rounded-[2rem] p-8 flex items-center justify-between">
                       <div className="flex items-center gap-6">
                          <div className="bg-white dark:bg-indigo-600 p-4 rounded-2xl shadow-lg">
                             <FileCode2 className="w-8 h-8 text-indigo-600 dark:text-white" />
                          </div>
                          <div>
                             <h4 className="font-black text-slate-900 dark:text-white text-lg">{selectedFile.name}</h4>
                             <p className="text-xs font-bold text-slate-500">{selectedFile.size} • Payload Detected</p>
                          </div>
                       </div>
                       <button 
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="p-3 hover:bg-white dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400"
                       >
                          <X className="w-6 h-6" />
                       </button>
                    </div>
                  )}
                  <div className="flex items-center justify-center gap-4 py-4">
                     <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-xl">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Gated VM Active
                     </div>
                     <div className="flex items-center gap-2 text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 dark:bg-blue-950/30 px-3 py-1.5 rounded-xl">
                        <Cpu className="w-3.5 h-3.5" />
                        Static + Dynamic
                     </div>
                  </div>
                </div>
              )}

              <div className="flex justify-center pt-4">
                <button 
                  type="submit"
                  disabled={loading || (activeTab === 'email' && !content.trim()) || (activeTab === 'file' && !selectedFile)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-12 py-5 rounded-[2rem] shadow-2xl shadow-indigo-500/30 transition-all active:scale-95 flex items-center gap-4 group"
                >
                  LANCER LA DÉTONATION IA
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      {/* Detonation Loading Screen */}
      {loading && (
        <section className="bg-slate-950 rounded-[3rem] border border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in duration-500">
           <div className="p-10 flex flex-col items-center">
              <div className="relative mb-10 text-center">
                 <div className="w-32 h-32 border-4 border-indigo-500/20 rounded-full border-t-indigo-500 animate-spin" />
                 <FlaskConical className="w-12 h-12 text-indigo-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                 <div className="mt-8">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">ANALYSE EN COURS</h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Environnement Hyper-V Isolé</p>
                 </div>
              </div>
              
              <div className="w-full max-w-2xl bg-black/40 rounded-3xl p-6 border border-slate-800 font-mono text-[10px]">
                 <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
                    <Terminal className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-slate-400 font-bold uppercase">Sandbox Kernel Output</span>
                 </div>
                 <div className="space-y-1 h-[140px] overflow-hidden">
                    {detonationLogs.map((log, i) => (
                      <div key={i} className="text-emerald-500/90 flex gap-3 animate-in slide-in-from-left-2">
                        <span className="opacity-30">{i+1}</span>
                        <span>{log}</span>
                      </div>
                    ))}
                    <div ref={logEndRef} />
                    {detonationLogs.length < DETONATION_STEPS.length && (
                      <div className="text-white animate-pulse">_</div>
                    )}
                 </div>
              </div>
           </div>
        </section>
      )}

      {/* Error Message */}
      {error && !loading && (
        <div className="p-8 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 rounded-[2.5rem] flex items-center gap-6 text-rose-600 animate-in bounce-in duration-300 shadow-xl shadow-rose-500/5">
          <div className="bg-rose-600 p-3 rounded-2xl shadow-lg shadow-rose-500/20">
             <ShieldAlert className="w-8 h-8 text-white" />
          </div>
          <div>
            <h4 className="font-black uppercase tracking-widest text-sm">Incident Rapporté</h4>
            <p className="font-bold opacity-80">{error}</p>
          </div>
        </div>
      )}

      {/* Report Section */}
      {report && !loading && (
        <div className="space-y-6">
           <div className="flex items-center justify-between px-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Forensic Sandbox Report</h3>
              <button 
                onClick={() => { setReport(null); setSelectedFile(null); setContent(''); }}
                className="text-xs font-black text-indigo-600 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-950/30 px-4 py-2 rounded-xl transition-all"
              >
                 Nouvelle Analyse
              </button>
           </div>
           <SandboxReport data={report} />
        </div>
      )}

      {/* Placeholder Welcome */}
      {!report && !loading && (
        <div className="flex flex-col items-center justify-center py-10 fade-in duration-1000">
           <Sparkles className="w-12 h-12 text-slate-200 dark:text-slate-800 mb-4" />
           <p className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest">Prêt pour l'ingestion de menaces</p>
        </div>
      )}

    </div>
  );
}
