'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ChevronLeft, 
  CheckCircle2, 
  Circle, 
  AlertTriangle, 
  Info, 
  PlusCircle, 
  Loader2, 
  ShieldCheck,
  Send,
  Zap,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import Toast from '@/components/Toast';

interface Task {
  id: string;
  title: string;
  advice: string;
}

interface Phase {
  phase: string;
  tasks: Task[];
}

export default function PlaybookExecutionPage() {
  const { type } = useParams();
  const router = useRouter();
  const [phases, setPhases] = useState<Phase[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [activeTask, setActiveTask] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  useEffect(() => {
    const fetchPlaybook = async () => {
      try {
        const token = window.localStorage.getItem('token');
        const res = await fetch(`http://127.0.0.1:8000/playbooks/${type}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        
        if (!res.ok) throw new Error('Failed to fetch playbook details.');
        const data = await res.json();
        if (Array.isArray(data)) {
          setPhases(data);
          if (data[0] && data[0].tasks && data[0].tasks[0]) {
            setActiveTask(data[0].tasks[0].id);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaybook();
  }, [type]);

  const toggleTask = (taskId: string) => {
    setCompletedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId) 
        : [...prev, taskId]
    );
    
    if (!completedTasks.includes(taskId)) {
      setToast({ message: `Step ${taskId} validated. AI is monitoring for progress...`, type: 'success' });
    }
  };

  const totalTasks = phases.reduce((acc, p) => acc + (p.tasks?.length || 0), 0);
  const progress = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;

  if (loading) {
     return (
        <div className="flex h-screen flex-col items-center justify-center gap-4">
           <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
           <p className="font-bold text-slate-400 uppercase tracking-widest text-xs">Deploying Incident Core...</p>
        </div>
     );
  }

  const currentTaskData = phases.flatMap(p => p.tasks || []).find(t => t && t.id === activeTask);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
      
      {/* Header with Progress */}
      <div className="bg-slate-900 rounded-[2.5rem] p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Abstract Background Animation */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-4">
            <Link 
              href="/playbooks" 
              className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-black uppercase tracking-widest"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Library
            </Link>
            <div className="space-y-2">
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
                {type?.toString().replace('-', ' ')} <span className="text-blue-500 underline decoration-4 underline-offset-8">Execution</span>
              </h1>
              <p className="text-slate-400 font-medium">SOC Mission ID: #IRT-2026-{Math.floor(Math.random() * 9000) + 1000}</p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
             <div className="text-right">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Incident Lifecycle</span>
                <span className="text-3xl font-black text-white">{Math.round(progress)}% <span className="text-sm font-bold text-slate-500">COMPLETE</span></span>
             </div>
             <div className="w-48 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(59,130,246,0.5)]" 
                  style={{ width: `${progress}%` }} 
                />
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Steps Column */}
        <div className="lg:col-span-2 space-y-6">
          {phases.map((phase, pIdx) => (
            <div key={pIdx} className="space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] ml-4 flex items-center gap-3">
                <span className="w-8 h-px bg-slate-200 dark:bg-slate-800" />
                Phase {pIdx + 1}: {phase.phase}
              </h3>
              
              <div className="space-y-2">
                {phase.tasks?.map((task) => (
                  <div 
                    key={task.id}
                    onClick={() => setActiveTask(task.id)}
                    className={`group p-5 rounded-3xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                      activeTask === task.id 
                        ? 'bg-white dark:bg-slate-900 border-blue-500 shadow-xl shadow-blue-500/10' 
                        : 'bg-white/50 dark:bg-slate-900/50 border-transparent hover:border-slate-200 dark:hover:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                       <button 
                        onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }}
                        className={`transition-colors ${completedTasks.includes(task.id) ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-700 hover:text-blue-500'}`}
                       >
                         {completedTasks.includes(task.id) ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                       </button>
                       <span className={`font-bold transition-all ${
                         completedTasks.includes(task.id) ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200'
                       }`}>
                         {task.title}
                       </span>
                    </div>
                    <ArrowRight className={`w-4 h-4 transition-all ${activeTask === task.id ? 'text-blue-500 translate-x-0 opacity-100' : '-translate-x-2 opacity-0'}`} />
                  </div>
                ))}
              </div>
            </div>
          ))}

          {progress === 100 && (
             <div className="p-8 bg-emerald-500/10 border-2 border-dashed border-emerald-500/30 rounded-[2.5rem] text-center space-y-4 animate-in zoom-in duration-500">
                <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                   <ShieldCheck className="text-white w-8 h-8" />
                </div>
                <div>
                   <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tight">Mission Accomplished</h3>
                   <p className="text-sm font-medium text-slate-500">Incident successfully contained. Generating Post-Incident Report...</p>
                </div>
                <button 
                  onClick={() => { setToast({ message: 'Generating summary for management...', type: 'info' }); }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-8 py-3 rounded-2xl shadow-lg transition-all"
                >
                  Generate Incident Summary
                </button>
             </div>
          )}
        </div>

        {/* AI Tactical Advice Column */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl lg:sticky lg:top-8">
             <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-500/10 rounded-xl">
                   <Zap className="w-5 h-5 text-blue-500" />
                </div>
                <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-sm">AI Tactical Advice</h4>
             </div>

             {currentTaskData ? (
               <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Focus Task</p>
                     <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{currentTaskData.title}</p>
                  </div>
                  
                  <div className="space-y-4">
                     <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-1" />
                        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                          {currentTaskData.advice}
                        </p>
                     </div>
                     <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-1" />
                        <p className="text-xs text-slate-500 font-medium italic leading-relaxed">
                          Attention: Assurez-vous d'avoir l'approbation du management avant d'effectuer des modifications réseau critiques sur les serveurs de production.
                        </p>
                     </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Ask Cyber Copilot</p>
                     <div className="flex items-center gap-2">
                        <input 
                          type="text" 
                          placeholder="Ex: Comment isoler SMB?" 
                          className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                        <button className="p-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors">
                           <Send className="w-4 h-4" />
                        </button>
                     </div>
                  </div>
               </div>
             ) : (
               <div className="py-10 text-center space-y-4 opacity-50 grayscale">
                  <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto" />
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Select a task for advice</p>
               </div>
             )}
          </div>
          
          <div className="p-6 bg-indigo-600 rounded-[2rem] text-white shadow-xl shadow-indigo-600/20 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-700">
                <Zap className="w-20 h-20" />
             </div>
             <p className="text-xs font-black uppercase tracking-[0.2em] mb-2">SOC Intelligence</p>
             <p className="text-xl font-black italic tracking-tighter mb-4 leading-none">AI CORE IS AUTO-CORRELATING LOGS FOR THIS INCIDENT</p>
             <button className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all">
                View Dynamic Analysis <PlusCircle className="w-3 h-3" />
             </button>
          </div>
        </div>
      </div>

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type === 'success' ? 'success' : 'info'} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
}
