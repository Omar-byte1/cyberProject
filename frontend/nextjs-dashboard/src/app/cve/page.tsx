'use client';

import { useMemo, useState } from 'react';
import rawCves from '../../../../../data/clean_cve.json';
import { ExternalLink, Search, ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react';

interface CveItem {
  cve_id: string;
  description: string;
  score: number;
  severity: string;
}

const cves: CveItem[] = rawCves as CveItem[];

function getSeverityClasses(severity: string): string {
  const normalized = severity.toUpperCase();

  if (normalized === 'CRITICAL' || normalized === 'HIGH') {
    return 'bg-red-100 text-red-700';
  }
  if (normalized === 'MEDIUM') {
    return 'bg-orange-100 text-orange-700';
  }
  return 'bg-green-100 text-green-700';
}

export default function CveExplorerPage() {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const filteredCves = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return cves;
    }
    return cves.filter((cve) => cve.cve_id.toLowerCase().includes(term));
  }, [searchTerm]);

  const toggleDetails = (id: string): void => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 p-6 text-white shadow-xl sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-400/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 left-0 h-44 w-44 rounded-full bg-cyan-400/20 blur-2xl" />
        <div className="relative space-y-3">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold">
            <ShieldAlert className="h-3.5 w-3.5" />
            Vulnerability Intelligence
          </p>
          <h1 className="text-2xl font-black tracking-tight sm:text-4xl">
            CVE Explorer
          </h1>
          <p className="max-w-2xl text-sm text-slate-200 sm:text-base">
            Search, inspect, and investigate known vulnerabilities from your
            local CVE dataset.
          </p>
        </div>
      </section>

      <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur sm:p-5">
        <label
          htmlFor="cve-search"
          className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500"
        >
          Search by CVE ID
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="cve-search"
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="e.g. CVE-1999-0095"
            className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {filteredCves.map((cve) => {
          const isExpanded = expandedIds.has(cve.cve_id);
          return (
            <article
              key={cve.cve_id}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <p className="font-mono text-sm font-black tracking-tight text-slate-900 sm:text-base">
                    {cve.cve_id}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="rounded-lg bg-slate-100 px-2 py-1 font-semibold text-slate-700">
                      Score: {cve.score.toFixed(1)}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-black uppercase tracking-wide ${getSeverityClasses(cve.severity)}`}
                    >
                      {cve.severity}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleDetails(cve.cve_id)}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  {isExpanded ? 'Hide Details' : 'View Details'}
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              </div>

              {isExpanded && (
                <div className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-sm leading-6 text-slate-700">
                    {cve.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
                    <span>Score: {cve.score.toFixed(1)}</span>
                    <span>Severity: {cve.severity}</span>
                  </div>
                  <a
                    href={`https://nvd.nist.gov/vuln/detail/${cve.cve_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open in NVD
                  </a>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {filteredCves.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-600">
          No CVE matched your search.
        </div>
      )}
    </main>
  );
}
