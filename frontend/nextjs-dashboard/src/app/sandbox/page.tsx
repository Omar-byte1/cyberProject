'use client';

import React, { useState } from 'react';
import { 
  FlaskConical, 
  Mail, 
  FileCode2, 
  ShieldAlert, 
  Loader2, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import SandboxReport from '@/components/SandboxReport';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function SandboxPage() {
  const [activeTab, setActiveTab] = useState<'email' | 'file'>('email');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'email' && !content.trim()) return;
    
    setLoading(true);
    setError(null);
    setReport(null);

    // Minor delay to simulate "detonating" in sandbox
    await new Promise(r => setTimeout(r, 1500));

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
          content: activeTab === 'file' ? 'simulated_file_binary_stream' : content
        }),
      });

      if (!res.ok) {
        throw new Error('Analysis failed. Please ensure the backend is running and you are logged in.');
      }

      const data = await res.json();
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during analysis');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-500/20">
              <FlaskConical className="text-white w-5 h-5" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">AI Sandbox</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium ml-1">Heuristic Malware & Phishing Detonation Chamber</p>
        </div>
        <ThemeToggle />
      </div>

      {/* Main Analysis Tool */}
      <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        
        {/* Tabs Navigation */}
        <div className="flex border-b border-slate-100 dark:border-slate-800">
          <button 
            onClick={() => { setActiveTab('email'); setReport(null); }}
            className={`flex-1 flex items-center justify-center gap-3 py-6 font-black text-sm uppercase tracking-widest transition-all ${
              activeTab === 'email' 
                ? 'bg-blue-600 text-white' 
                : 'text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Mail className="w-5 h-5" />
            Email Analysis
          </button>
          <button 
            onClick={() => { setActiveTab('file'); setReport(null); }}
            className={`flex-1 flex items-center justify-center gap-3 py-6 font-black text-sm uppercase tracking-widest transition-all ${
              activeTab === 'file' 
                ? 'bg-blue-600 text-white' 
                : 'text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <FileCode2 className="w-5 h-5" />
            Malware File Analysis
          </button>
        </div>

        {/* Input Area */}
        <div className="p-8">
          <form onSubmit={handleAnalyze} className="space-y-6">
            {activeTab === 'email' ? (
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-4">Suspicious Email Content</label>
                <textarea 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Collez ici le corps ou l'objet de l'email suspect..."
                  className="w-full h-48 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 focus:border-blue-500/50 rounded-[2rem] p-6 text-sm font-medium text-slate-900 dark:text-white transition-all outline-none resize-none shadow-inner"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border-4 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-12 flex flex-col items-center justify-center text-center group hover:border-blue-500/50 transition-colors cursor-pointer bg-slate-50/50 dark:bg-slate-950/20">
                   <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-3xl shadow-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <FileCode2 className="w-10 h-10 text-slate-400 group-hover:text-blue-500 transition-colors" />
                   </div>
                   <h3 className="text-xl font-black text-slate-900 dark:text-white">Déposez le fichier suspect ici</h3>
                   <p className="text-sm text-slate-500 font-medium mt-1">L'IA analysera les en-têtes binaires et les signatures (simulation).</p>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-500">
                   <ShieldAlert className="w-4 h-4" />
                   Evironnement d'Analyse Isolé Actif
                </div>
              </div>
            )}

            <div className="flex justify-center">
              <button 
                type="submit"
                disabled={loading || (activeTab === 'email' && !content.trim())}
                className="bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-black px-12 py-5 rounded-[2rem] shadow-2xl transition-all active:scale-95 flex items-center gap-4 group"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    DÉTONATION EN COURS...
                  </>
                ) : (
                  <>
                    LANCER L'ANALYSE IA
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Error Message */}
      {error && (
        <div className="p-6 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 rounded-3xl flex items-center gap-4 text-rose-600 font-bold animate-in bounce-in duration-300">
          <ShieldAlert className="w-6 h-6 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Report Section */}
      {report && <SandboxReport data={report} />}

      {/* Info Notice */}
      {!report && !loading && (
        <div className="flex flex-col items-center justify-center py-10 opacity-30">
           <Sparkles className="w-12 h-12 text-slate-400 mb-4" />
           <p className="text-xs font-black text-slate-400 uppercase tracking-widest">En attente d'une soumission d'analyse</p>
        </div>
      )}

    </div>
  );
}
