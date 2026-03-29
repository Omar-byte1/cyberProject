'use client';

import React, { useRef, useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Terminal, 
  Search, 
  Database, 
  Network,
  Clock,
  ExternalLink,
  ChevronRight,
  Fingerprint,
  Loader2,
  CheckCircle2
} from 'lucide-react';

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface SandboxReportProps {
  data: any;
}

export default function SandboxReport({ data }: SandboxReportProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!data) return null;

  const handleExportPDF = async () => {
    const reportElement = reportRef.current;
    if (!reportElement) return;
    
    setIsExporting(true);
    const pdfModeClassName = 'pdf-mode';
    
    try {
      // Force plain colors/styles for html2canvas compatibility
      reportElement.classList.add(pdfModeClassName);
      
      // Wait for the DOM to update styles
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });

      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff', // Use white background for PDF
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add the first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add subsequent pages if the content is longer than one A4
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Forensic_Report_${data.verdict || 'Analysis'}_${Date.now()}.pdf`);
    } catch (err) {
      console.error("PDF Export failed", err);
      alert("Erreur lors de l'exportation PDF. Veuillez réessayer.");
    } finally {
      if (reportElement) reportElement.classList.remove(pdfModeClassName);
      setIsExporting(false);
    }
  };

  const handleAddToIncident = async () => {
    setIsSaving(true);
    setSavedSuccess(false);

    const incidentData = {
      id: `INC-${Math.floor(Math.random() * 90000) + 10000}`,
      type: data.type || "Unknown Analysis",
      verdict: data.verdict,
      risk_score: data.risk_score,
      timestamp: new Date().toISOString(),
      details: data
    };

    try {
      const token = window.localStorage.getItem('token');
      const res = await fetch('http://127.0.0.1:8000/incidents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(incidentData)
      });

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      } else {
        throw new Error("API Failure");
      }
    } catch (err) {
      alert("Erreur lors de l'enregistrement de l'incident.");
    } finally {
      setIsSaving(false);
    }
  };

  const isMalicious = data.status === 'Malicious' || data.verdict?.toLowerCase().includes('phishing') || data.verdict?.toLowerCase().includes('malware');

  return (
    <div className="space-y-6">
      
      <div ref={reportRef} id="report-content" className="animate-in fade-in slide-in-from-bottom-5 duration-700 p-1">
        {/* Summary Header */}
        <div className={`p-8 rounded-[2.5rem] border ${
          isMalicious 
            ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30' 
            : 'bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/30'
        } mb-8 flex flex-col md:flex-row gap-8 items-center justify-between`}>
          
          <div className="flex items-center gap-6">
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl ${
              isMalicious ? 'bg-rose-600 text-white shadow-rose-500/30' : 'bg-emerald-600 text-white shadow-emerald-500/30'
            }`}>
              {isMalicious ? <ShieldAlert className="w-10 h-10" /> : <ShieldCheck className="w-10 h-10" />}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                 <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{data.verdict}</h2>
                 <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                   isMalicious ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
                 }`}>
                   Risk Score: {data.risk_score}/100
                 </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">{data.recommendation}</p>
            </div>
          </div>

          <div className="flex gap-4 text-slate-900 dark:text-white">
             <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Analysis Type</p>
                <p className="font-bold">{data.type}</p>
             </div>
             <div className="w-px h-10 bg-slate-200 dark:bg-slate-800" />
             <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Analyzed At</p>
                <p className="font-bold">
                  {new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-8">
            
            <section className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                 <Search className="w-4 h-4 text-indigo-500" />
                 <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Security Indicators</h3>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.indicators?.map((indicator: any, idx: number) => (
                  <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-2 rounded-full ${
                        indicator.risk === 'Critical' ? 'bg-rose-500' : indicator.risk === 'High' ? 'bg-orange-500' : 'bg-blue-500'
                      }`} />
                      <span className="text-xs font-black text-slate-400 uppercase w-20">{indicator.type}</span>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{indicator.detail}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {data.behavior_logs && (
              <section className="bg-slate-950 rounded-[2.5rem] border border-slate-800 overflow-hidden shadow-2xl">
                <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                      <Terminal className="w-4 h-4 text-emerald-500" />
                      <h3 className="text-xs font-black text-white uppercase tracking-widest">Sandboxing Detonation Logs</h3>
                  </div>
                </div>
                <div className="p-6 font-mono text-[11px] leading-relaxed overflow-y-auto max-h-[300px]">
                  {data.behavior_logs.map((log: string, idx: number) => (
                    <div key={idx} className={`flex gap-3 mb-1 ${log.includes('[THREAT]') ? 'text-rose-400 font-bold' : 'text-emerald-500/80'}`}>
                      <span className="opacity-30 select-none">[{idx.toString().padStart(3, '0')}]</span>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="space-y-8">
            {data.mitre_attack && (
              <section className="bg-indigo-600 rounded-[2.5rem] p-6 text-white shadow-xl shadow-indigo-500/20">
                <div className="flex items-center gap-3 mb-6">
                  <Database className="w-5 h-5 text-indigo-200" />
                  <h3 className="text-sm font-black uppercase tracking-widest">MITRE ATT&CK® Mapping</h3>
                </div>
                <div className="space-y-4">
                  {data.mitre_attack.map((tech: any) => (
                    <div key={tech.id} className="bg-white/10 p-4 rounded-2xl border border-white/5">
                      <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">{tech.id}</p>
                      <p className="font-bold text-sm">{tech.name}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons Container (Outside Ref) */}
      <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 flex flex-col md:flex-row gap-4 items-center justify-between">
         <div className="flex items-center gap-4">
            <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-2xl">
               <Fingerprint className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
               <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">Forensic Post-Actions</h3>
               <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Execute compliance and archival workflows</p>
            </div>
         </div>
         
         <div className="flex flex-wrap gap-4">
            <button 
              onClick={handleExportPDF}
              disabled={isExporting}
              className="flex items-center gap-3 px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-black rounded-2xl text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
               {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
               {isExporting ? "Exporting..." : "Generate PDF Export"}
            </button>
            <button 
              onClick={handleAddToIncident}
              disabled={isSaving || savedSuccess}
              className={`flex items-center gap-3 px-8 py-4 font-black rounded-2xl text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-70 ${
                savedSuccess ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20'
              }`}
            >
               {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : savedSuccess ? <CheckCircle2 className="w-4 h-4" /> : <Database className="w-4 h-4" />}
               {isSaving ? "Saving..." : savedSuccess ? "Case Saved" : "Add to Incident Case"}
            </button>
         </div>
      </section>

    </div>
  );
}
