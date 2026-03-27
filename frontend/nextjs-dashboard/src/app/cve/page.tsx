'use client';

import { useMemo, useState } from 'react';
import rawCves from '../../../../../data/clean_cve.json';
import { ExternalLink, Search, ShieldAlert, ChevronDown, ChevronUp, X } from 'lucide-react';

interface CveItem {
  cve_id: string;
  description: string;
  score: number;
  severity: string;
}

const cves = rawCves as CveItem[];

function getSeverityClasses(severity: string): string {
  const normalized = severity.toUpperCase();
  if (normalized === 'CRITICAL' || normalized === 'HIGH') return 'bg-red-100 text-red-700 border-red-200';
  if (normalized === 'MEDIUM') return 'bg-orange-100 text-orange-700 border-orange-200';
  return 'bg-green-100 text-green-700 border-green-200';
}

export default function CveExplorerPage() {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const filteredCves = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return cves.slice(0, 50); // Limit initial view for performance
    return cves.filter((cve) => 
      cve.cve_id.toLowerCase().includes(term) || 
      cve.description.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  const toggleDetails = (id: string) => {
    const next = new Set(expandedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedIds(next);
  };

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6 animate-in fade-in duration-500">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 p-6 text-white shadow-xl sm:p-8">
        <div className="relative z-10 space-y-3">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold">
            <ShieldAlert className="h-3.5 w-3.5" />
            Threat Intelligence Module
          </p>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">CVE Explorer</h1>
          <p className="max-w-2xl text-sm text-slate-200 sm:text-base">
            Accessing {cves.length} local records. High-fidelity vulnerability data for automated analysis.
          </p>
        </div>
      </section>

      {/* Search Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur sm:p-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ID or keywords (e.g. 'Buffer Overflow')..."
            className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-10 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <p className="mt-2 text-[10px] font-medium uppercase tracking-widest text-slate-400">
          Showing {filteredCves.length} results
        </p>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {filteredCves.map((cve) => {
          const isExpanded = expandedIds.has(cve.cve_id);
          return (
            <article key={cve.cve_id} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <span className="font-mono text-sm font-bold text-blue-600">{cve.cve_id}</span>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-md border px-2 py-0.5 text-xs font-bold uppercase ${getSeverityClasses(cve.severity)}`}>
                      {cve.severity}
                    </span>
                    <span className="text-xs font-medium text-slate-500">CVSS {cve.score.toFixed(1)}</span>
                  </div>
                </div>
                <button
                  onClick={() => toggleDetails(cve.cve_id)}
                  className="p-2 text-slate-400 hover:text-slate-600"
                >
                  {isExpanded ? <ChevronUp /> : <ChevronDown />}
                </button>
              </div>

              {isExpanded && (
                <div className="mt-4 space-y-4 border-t border-slate-100 pt-4 animate-in slide-in-from-top-2">
                  <p className="text-sm leading-relaxed text-slate-600">{cve.description}</p>
                  <a
                    href={`https://nvd.nist.gov/vuln/detail/${cve.cve_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded-lg bg-slate-100 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-200"
                  >
                    <ExternalLink className="h-3 w-3" />
                    NVD Reference
                  </a>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </main>
  );
}