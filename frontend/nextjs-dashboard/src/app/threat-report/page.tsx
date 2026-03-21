'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BrainCircuit, ShieldAlert, Sparkles, ArrowRight } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ThreatReportItem {
  cve_id: string;
  prediction: string;
  recommendation: string;
  soc_level: string;
}

export default function ThreatReportPage() {
  const [report, setReport] = useState<ThreatReportItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  useEffect(() => {
    const loadThreatReport = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('http://127.0.0.1:8000/threat-report');
        if (!response.ok) {
          throw new Error(`Request failed: ${response.status}`);
        }

        const data: unknown = await response.json();
        if (Array.isArray(data)) {
          const validatedItems = data.filter((item): item is ThreatReportItem => {
            if (typeof item !== 'object' || item === null) return false;
            const obj = item as Record<string, unknown>;

            return typeof obj.cve_id === 'string' &&
                   typeof obj.prediction === 'string' &&
                   typeof obj.recommendation === 'string' &&
                   typeof obj.soc_level === 'string';
          });

          setReport(validatedItems);
        } else {
          setReport([]);
        }

      } catch (fetchError) {
        const message =
          fetchError instanceof Error
            ? fetchError.message
            : 'Unable to load threat report.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadThreatReport();
  }, []);

  const getSocBadgeClasses = (level: string): string => {
    const normalized = level.toLowerCase();
    if (normalized.includes('level 3') || normalized.includes('critical')) {
      return 'bg-red-100 text-red-700';
    }
    if (normalized.includes('level 2')) {
      return 'bg-orange-100 text-orange-700';
    }
    return 'bg-green-100 text-green-700';
  };

  const exportPDF = async (): Promise<void> => {
    const reportElement = document.getElementById('report-content');
    if (!reportElement) {
      return;
    }

    const pdfModeClassName = 'pdf-mode';

    try {
      setIsExporting(true);
      reportElement.classList.add(pdfModeClassName);

      // Let the browser apply temporary PDF-safe styles before capture.
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });

      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imageData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Keep simple single-page behavior and fit content within A4.
      const finalHeight = Math.min(imgHeight, pdfHeight);
      pdf.addImage(imageData, 'PNG', 0, 0, imgWidth, finalHeight);
      pdf.save('threat-report.pdf');
    } finally {
      reportElement.classList.remove(pdfModeClassName);
      setIsExporting(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-violet-900 via-indigo-900 to-slate-900 p-6 text-white shadow-xl sm:p-8">
        <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-fuchsia-400/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 left-0 h-44 w-44 rounded-full bg-blue-400/20 blur-2xl" />
        <div className="relative space-y-3">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold">
            <BrainCircuit className="h-3.5 w-3.5" />
            AI Threat Intelligence
          </p>
          <h1 className="text-2xl font-black tracking-tight sm:text-4xl">
            Threat Report
          </h1>
          <p className="max-w-2xl text-sm text-slate-200 sm:text-base">
            Automated predictions and recommendations generated from your SOC
            data pipeline.
          </p>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={exportPDF}
          disabled={isExporting || loading || !!error}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isExporting ? 'Exporting...' : 'Export PDF'}
        </button>
      </div>

      <div id="report-content" className="space-y-6">
        {loading && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-44 animate-pulse rounded-2xl border border-slate-200 bg-slate-100"
              />
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 shadow-sm">
            <p className="text-sm text-red-700">
              Failed to load threat report: {error}
            </p>
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {report.map((item, index) => (
              <article
                key={`${item.cve_id}-${index}`}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Indicator
                    </p>
                    <p className="font-mono text-sm font-black tracking-tight text-slate-900 sm:text-base">
                    {item.cve_id || 'ML-ANOMALY'}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-black uppercase tracking-wide ${getSocBadgeClasses(item.soc_level)}`}
                  >
                    {item.soc_level}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                    <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-slate-500">
                      <Sparkles className="h-3.5 w-3.5" />
                      Prediction
                    </p>
                    <p className="mt-1 text-sm text-slate-700">{item.prediction}</p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                    <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-slate-500">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      Recommendation
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                      {item.recommendation}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                      SOC Level
                    </p>
                    <p className="mt-1 text-sm text-slate-700">{item.soc_level}</p>
                  </div>
                </div>

                <div className="mt-5 border-t border-slate-200 pt-4">
                  <Link
                    href={`/alerts?cve=${encodeURIComponent(item.cve_id || 'ML-ANOMALY')}`}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-700 transition group-hover:translate-x-0.5 hover:text-indigo-900"
                  >
                    View related alert
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

        {!loading && !error && report.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-600">
            No threat report data available.
          </div>
        )}
      </div>
    </main>
  );
}
