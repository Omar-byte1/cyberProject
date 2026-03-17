'use client';

import { useEffect, useState } from 'react';
import { 
  ShieldAlert, 
  Search, 
  ExternalLink, 
  Star 
} from 'lucide-react';

type CveItem = {
  cve_id: string;
  log: string;
  severity?: string | number;
};

export default function CveIntelPage() {
  const [cves, setCves] = useState<CveItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch('http://127.0.0.1:8000/alerts')
      .then(res => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const criticalCves = data.filter((a): a is CveItem => {
            if (typeof a !== 'object' || a === null) return false;
            const obj = a as Record<string, unknown>;
            return typeof obj.cve_id === 'string' &&
              typeof obj.log === 'string' &&
              (typeof obj.severity === 'undefined' || typeof obj.severity === 'string' || typeof obj.severity === 'number') &&
              obj.cve_id.startsWith('CVE');
          });
          setCves(criticalCves);
        }
      })
      .catch(err => console.error(err));
  }, []);

  const filteredCves = cves.filter((cve) =>
    cve.cve_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-orange-600">
          Critical CVE Intelligence
        </h1>
        <p className="text-slate-500 mt-2 font-medium flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-500" />
          Database of high-impact vulnerabilities detected in the system.
        </p>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-red-500 transition-colors" />
        <input 
          type="text" 
          placeholder="Search by CVE ID..." 
          className="pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all w-full md:w-96 shadow-sm"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 divide-y divide-slate-100">
        {filteredCves.map((cve, idx) => (
          <div key={idx} className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-red-50/30 transition-colors">
            <div className="flex items-center gap-5">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-red-100 to-rose-100 text-red-600">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <p className="font-mono font-black text-lg text-slate-800">{cve.cve_id}</p>
                <p className="text-sm text-slate-500 font-medium max-w-xl truncate">{cve.log}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 ml-auto md:ml-0">
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-400 fill-current" />
                <span className="font-bold text-slate-700">{cve.severity}</span>
              </div>
              <a 
                href={`https://nvd.nist.gov/vuln/detail/${cve.cve_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 hover:text-red-600 transition-all shadow-sm"
              >
                <ExternalLink className="w-4 h-4" />
                Details
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
