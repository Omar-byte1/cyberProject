'use client';

import { useEffect, useState } from 'react';
import { 
  BrainCircuit, 
  ShieldCheck, 
  Terminal, 
  Lightbulb, 
  BarChart, 
  ChevronRight 
} from 'lucide-react';

type ThreatReportItem = {
  soc_level: string;
  log_source: string;
  prediction: string;
  recommendation: string;
};

export default function ThreatReportPage() {
  const [report, setReport] = useState<ThreatReportItem[]>([]);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/threat-report')
      .then(res => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const validated = data.filter((item): item is ThreatReportItem => {
            if (typeof item !== 'object' || item === null) return false;
            const obj = item as Record<string, unknown>;
            return typeof obj.soc_level === 'string' &&
                   typeof obj.log_source === 'string' &&
                   typeof obj.prediction === 'string' &&
                   typeof obj.recommendation === 'string';
          });
          setReport(validated);
        }
      })
      .catch(err => console.error(err));
  }, []);

  const getSocLevelStyles = (level: string) => {
    if (level.includes('Level 3')) return 'from-red-500 to-rose-600';
    if (level.includes('Level 2')) return 'from-amber-500 to-orange-600';
    return 'from-blue-500 to-indigo-600';
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
          AI Threat Intelligence Report
        </h1>
        <p className="text-slate-500 mt-2 font-medium flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-purple-500" />
          Automated analysis and recommendations from the CTI AI Engine.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {report.map((item, idx) => (
          <div key={idx} className="group bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 flex flex-col hover:-translate-y-2 transition-transform duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div className={`p-3 rounded-2xl bg-gradient-to-br ${getSocLevelStyles(item.soc_level)} text-white shadow-lg shadow-current/20`}>
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">SOC Level</p>
                <p className="font-black text-lg text-slate-800 tracking-tight">{item.soc_level.split(' - ')[0]}</p>
              </div>
            </div>

            <div className="space-y-6 flex-1">
              <div className="space-y-2">
                <h3 className="font-bold text-sm text-slate-500 flex items-center gap-2">
                  <Terminal className="w-4 h-4" /> Log Source
                </h3>
                <p className="font-mono text-xs bg-slate-50 p-3 rounded-lg text-slate-600 border border-slate-100">
                  {item.log_source}
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-sm text-slate-500 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" /> AI Prediction
                </h3>
                <p className="text-sm font-medium text-slate-700">
                  {item.prediction}
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-sm text-slate-500 flex items-center gap-2">
                  <BarChart className="w-4 h-4" /> Recommendation
                </h3>
                <p className="text-sm font-semibold text-blue-600 bg-blue-50 p-3 rounded-lg border border-blue-100">
                  {item.recommendation}
                </p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 text-right">
              <button className="text-xs font-bold text-slate-400 group-hover:text-blue-600 flex items-center gap-1 ml-auto transition-colors">
                Investigate <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
