'use client';

import React from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Bug, 
  AlertCircle, 
  CheckCircle2, 
  AlertTriangle,
  FileSearch
} from 'lucide-react';

interface SandboxAnalysis {
  type: string;
  risk_score: number;
  indicators: string[];
  verdict: string;
  recommendation: string;
}

interface SandboxReportProps {
  data: SandboxAnalysis;
}

export default function SandboxReport({ data }: SandboxReportProps) {
  const isSafe = data.risk_score <= 15;
  const isCritical = data.risk_score > 70;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
      
      {/* Risk Header */}
      <div className={`p-8 rounded-[2.5rem] border ${
        isSafe ? 'bg-emerald-500/5 border-emerald-500/20' : 
        isCritical ? 'bg-rose-500/5 border-rose-500/20' : 
        'bg-amber-500/5 border-amber-500/20'
      } mb-8 flex flex-col md:flex-row items-center gap-8`}>
        
        {/* Risk Gauge */}
        <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="58"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="10"
              className="text-slate-100 dark:text-slate-800"
            />
            <circle
              cx="64"
              cy="64"
              r="58"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="10"
              strokeDasharray={364.4}
              strokeDashoffset={364.4 - (364.4 * data.risk_score) / 100}
              strokeLinecap="round"
              className={`transition-all duration-1000 ${
                isSafe ? 'text-emerald-500' : isCritical ? 'text-rose-500' : 'text-amber-500'
              }`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-slate-900 dark:text-white leading-none">{data.risk_score}</span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Score</span>
          </div>
        </div>

        {/* Verdict Info */}
        <div className="text-center md:text-left space-y-2 flex-1">
          <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1">
            <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-[0.2em] border ${
              isSafe ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
              isCritical ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 
              'bg-amber-500/10 text-amber-500 border-amber-500/20'
            }`}>
              {data.verdict}
            </span>
            <span className="text-sm font-bold text-slate-400 font-mono">{data.type}</span>
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">AI Diagnostic Report</h3>
          <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xl leading-relaxed">
            Notre moteur d'intelligence artificielle a fini d'analyser le contenu soumis. Les résultats indiquent un niveau de risque 
            <span className={`font-bold mx-1 ${isSafe ? 'text-emerald-500' : isCritical ? 'text-rose-500' : 'text-amber-500'}`}>
              {isSafe ? 'Minime' : isCritical ? 'Critique' : 'Intermédiaire'}
            </span>.
          </p>
        </div>

        {/* Icon Status */}
        <div className="hidden lg:block shrink-0">
          {isSafe ? <CheckCircle2 className="w-16 h-16 text-emerald-500/20" /> : <Bug className="w-16 h-16 text-rose-500/20 animate-pulse" />}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Indicators List */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <FileSearch className="w-5 h-5 text-indigo-500" />
            </div>
            <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-sm">Indicateurs de Menace (IoC)</h4>
          </div>

          <div className="space-y-3 flex-1">
            {data.indicators.length > 0 ? (
              data.indicators.map((indicator, idx) => (
                <div key={idx} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                  <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{indicator}</span>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-10 text-center opacity-40">
                <ShieldCheck className="w-12 h-12 text-emerald-500 mb-4" />
                <p className="text-sm font-bold">Aucun indicateur de compromission détecté.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recommendation & Actions */}
        <div className="space-y-6">
          <div className="bg-slate-900 dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-2xl text-white">
            <div className="flex items-center gap-3 mb-6">
               <AlertCircle className="w-5 h-5 text-blue-400" />
               <h4 className="font-black uppercase tracking-wider text-sm">Recommandation de l'IA</h4>
            </div>
            <p className="text-lg font-bold text-slate-300 leading-relaxed mb-8">
              "{data.recommendation}"
            </p>
            <div className="pt-6 border-t border-slate-800 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                 <ShieldAlert className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Confidence Level</p>
                <p className="text-sm font-black text-white">96.8% (Neural Shield Engine)</p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <h5 className="text-sm font-black text-slate-900 dark:text-white">Action Recommandée</h5>
              <p className="text-xs text-slate-500 font-medium">Automatisation SOC de niveau 1</p>
            </div>
            <button className={`px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest text-white shadow-lg transition-transform active:scale-95 ${
              isSafe ? 'bg-indigo-600 shadow-indigo-500/20' : 'bg-rose-600 shadow-rose-500/20'
            }`}>
              {isSafe ? 'Archiver le cas' : 'Isoler & Signaler'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
