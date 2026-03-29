'use client';

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  ShieldAlert, 
  Clock, 
  ChevronRight, 
  AlertCircle,
  Loader2,
  Lock,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';

interface Playbook {
  id: string;
  title: string;
  category: string;
  duration: string;
  description: string;
}

export default function PlaybooksPage() {
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlaybooks = async () => {
      try {
        const token = window.localStorage.getItem('token');
        const res = await fetch('http://127.0.0.1:8000/playbooks', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        
        if (!res.ok) throw new Error('Failed to fetch playbooks. Ensure backend is running.');
        const data = await res.json();
        setPlaybooks(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchPlaybooks();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500 p-2.5 rounded-2xl shadow-lg shadow-amber-500/20">
              <BookOpen className="text-white w-5 h-5" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Response Playbooks</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium ml-1">NIST-compliant Standard Operating Procedures for Cyber Incidents</p>
        </div>
        <ThemeToggle />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
          <p className="font-bold text-slate-400">Loading Playbook Library...</p>
        </div>
      ) : error ? (
        <div className="p-8 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 rounded-[2rem] flex items-center gap-4 text-rose-600">
           <AlertCircle className="w-8 h-8" />
           <p className="font-bold">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {playbooks.map((pb) => (
            <Link 
              key={pb.id} 
              href={`/playbooks/${pb.id}`}
              className="group bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-6">
                  <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                    pb.category === 'Critical' 
                      ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' 
                      : pb.category === 'High' 
                      ? 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                      : 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
                  }`}>
                    {pb.category} Priority
                  </div>
                  <Zap className="w-5 h-5 text-slate-200 dark:text-slate-800 group-hover:text-amber-500 transition-colors" />
                </div>
                
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3 group-hover:text-blue-500 transition-colors">
                  {pb.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed line-clamp-3">
                  {pb.description}
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-bold">{pb.duration} est.</span>
                </div>
                <div className="flex items-center gap-1 text-blue-600 font-black text-xs uppercase tracking-widest">
                  Execute
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}

          {/* Locked/Soon Card */}
          <div className="bg-slate-50 dark:bg-slate-900/40 p-8 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-4 opacity-70">
             <div className="p-4 bg-white dark:bg-slate-800 rounded-full shadow-inner">
                <Lock className="w-6 h-6 text-slate-400" />
             </div>
             <div>
                <h4 className="font-black text-slate-500">More Playbooks</h4>
                <p className="text-xs font-medium text-slate-400">Update AI Core to unlock</p>
             </div>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-12 p-6 bg-slate-900/5 dark:bg-white/5 rounded-3xl border border-slate-200/50 dark:border-white/5">
        <div className="flex items-center gap-3 mb-2">
           <ShieldAlert className="w-4 h-4 text-slate-400" />
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Regulatory Notice</span>
        </div>
        <p className="text-xs text-slate-500 font-medium leading-relaxed">
          Ces procédures sont conformes aux recommandations NIST SP 800-61 Rev. 2. En situation réelle, assurez-vous de suivre la chaîne de commandement de votre organisation avant toute action de confinement majeure.
        </p>
      </div>

    </div>
  );
}
