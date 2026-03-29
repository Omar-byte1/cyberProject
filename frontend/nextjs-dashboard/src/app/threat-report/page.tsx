'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BrainCircuit, ShieldAlert, Sparkles, ArrowRight } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAlertContext } from '@/contexts/AlertContext';

interface ThreatReportItem {
  cve_id: string;
  prediction: string;
  recommendation: string;
  soc_level: string;
}

export default function ThreatReportPage() {
  const { alerts } = useAlertContext();
  const [report, setReport] = useState<ThreatReportItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [reportsPerPage] = useState<number>(4); // 4 reports per page for good layout

  useEffect(() => {
    // 1. If we have active simulated alerts, generate an AI report locally!
    if (alerts && alerts.length > 0) {
      setLoading(false);
      setError(null);
      
      const sorted = [...alerts].sort((a, b) => (b.threat_score || 0) - (a.threat_score || 0));
      const distinctAlerts = [];
      const seenCves = new Set();
      
      for (const alert of sorted) {
        if (!seenCves.has(alert.cve_id)) {
          seenCves.add(alert.cve_id);
          distinctAlerts.push(alert);
        }
      }

      const generatedReport: ThreatReportItem[] = distinctAlerts.map(a => {
        const isAnomaly = a.cve_id === 'ML-ANOMALY';
        return {
          cve_id: a.cve_id,
          prediction: isAnomaly 
            ? "Behavioral analytics indicate an active zero-day lateral movement attempt targeting internal subnets."
            : `Threat actor is attempting to exploit ${a.cve_id} to bypass authentication and gain initial access to outer perimeter nodes.`,
          recommendation: isAnomaly
            ? "Immediately isolate anomalous hosts from the network, rotate administrative credentials, and analyze recent EDR memory dumps."
            : `Apply emergency patch for ${a.cve_id}, deploy strict WAF blocking rules, and forcefully terminate any active reverse shells.`,
          soc_level: a.soc_level || (a.threat_score && a.threat_score >= 9 ? 'Critical - Level 3' : 'High - Level 2')
        };
      });

      setReport(generatedReport);
      return; 
    }

    // 2. Otherwise fetch from backend
    const loadThreatReport = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        const token = window.localStorage.getItem('token');
        const response = await fetch('http://127.0.0.1:8000/threat-report', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
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
  }, [alerts]);

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

  // Pagination Logic
  const indexOfLastReport = currentPage * reportsPerPage;
  const indexOfFirstReport = indexOfLastReport - reportsPerPage;
  const currentReports = report.slice(indexOfFirstReport, indexOfLastReport);
  const totalPages = Math.ceil(report.length / reportsPerPage) || 1;

  // Reset to page 1 if data changes significantly
  useEffect(() => {
    setCurrentPage(1);
  }, [report.length]);

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6 animate-in fade-in duration-500">
      {/* Header with Theme Toggle */}
      <div className="flex justify-end mb-2">
        <ThemeToggle />
      </div>

      <section className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-violet-900 via-indigo-900 to-slate-900 p-6 text-white shadow-xl sm:p-8">
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
                className="h-44 animate-pulse rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/50"
              />
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-5 shadow-sm">
            <p className="text-sm text-red-700 dark:text-red-400">
              Failed to load threat report: {error}
            </p>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {currentReports.map((item, index) => (
                <article
                  key={`${item.cve_id}-${index}`}
                  className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Indicator
                      </p>
                      <p className="font-mono text-sm font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-base">
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
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 p-3">
                      <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        <Sparkles className="h-3.5 w-3.5" />
                        Prediction
                      </p>
                      <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{item.prediction}</p>
                    </div>

                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 p-3">
                      <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        <ShieldAlert className="h-3.5 w-3.5" />
                        Recommendation
                      </p>
                      <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                        {item.recommendation}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 p-3">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        SOC Level
                      </p>
                      <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{item.soc_level}</p>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-slate-200 dark:border-slate-800 pt-4">
                    <Link
                      href={`/alerts?cve=${encodeURIComponent(item.cve_id || 'ML-ANOMALY')}`}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-700 dark:text-indigo-400 transition group-hover:translate-x-0.5 hover:text-indigo-900 dark:hover:text-indigo-300"
                    >
                      View related alert
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-center items-center gap-4 py-8">
              <button 
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(p => p - 1)} 
                className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <div className="px-5 py-2 bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-700 dark:text-slate-300 shadow-inner">
                Page {currentPage} of {totalPages}
              </div>
              <button 
                disabled={currentPage >= totalPages} 
                onClick={() => setCurrentPage(p => p + 1)} 
                className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </>
        )}

        {!loading && !error && report.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 text-center text-sm text-slate-600 dark:text-slate-400">
            No threat report data available.
          </div>
        )}
      </div>
    </main>
  );
}
