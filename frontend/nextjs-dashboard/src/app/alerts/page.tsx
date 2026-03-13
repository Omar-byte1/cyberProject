'use client';

import { useEffect, useState } from 'react';
import { 
  AlertTriangle, 
  Shield, 
  Search, 
  Filter,
  ExternalLink,
  ChevronRight,
  Activity
} from 'lucide-react';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch('http://127.0.0.1:8000/alerts')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setAlerts(data);
      })
      .catch(err => console.error(err));
  }, []);

  const filteredAlerts = alerts.filter((alert: any) => 
    alert.cve_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    alert.log.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            Security Alerts
          </h1>
          <p className="text-slate-500 mt-2 font-medium flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-500" />
            Real-time monitoring of correlated threats and anomalies
          </p>
        </div>
        
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search CVE or logs..." 
            className="pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all w-full md:w-80 shadow-sm"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/80 backdrop-blur-md">
              <tr>
                <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Indicator</th>
                <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Log Detail</th>
                <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Detection Type</th>
                <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Risk Score</th>
                <th className="px-8 py-5 text-right text-xs font-black text-slate-400 uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-50">
              {filteredAlerts.map((alert: any, idx) => (
                <tr key={idx} className="hover:bg-blue-50/30 transition-all group cursor-default">
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl shadow-sm ${alert.cve_id === 'ML-ANOMALY' ? 'bg-orange-100 text-orange-600' : 'bg-rose-100 text-rose-600'}`}>
                        {alert.cve_id === 'ML-ANOMALY' ? (
                          <Activity className="w-5 h-5" />
                        ) : (
                          <Shield className="w-5 h-5" />
                        )}
                      </div>
                      <span className="text-sm font-black text-slate-700 font-mono tracking-tighter">{alert.cve_id}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-medium text-slate-600 max-w-md truncate group-hover:text-slate-900 transition-colors">
                      {alert.log}
                    </p>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-extrabold shadow-sm ${
                      alert.cve_id === 'ML-ANOMALY' 
                        ? 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700' 
                        : 'bg-gradient-to-r from-rose-100 to-red-100 text-red-700'
                    }`}>
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {alert.alert}
                    </span>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 w-20 h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                        <div 
                          className={`h-full rounded-full bg-gradient-to-r transition-all duration-1000 ease-out ${alert.severity >= 8 ? 'from-red-400 to-rose-600' : 'from-orange-400 to-amber-600'}`}
                          style={{ width: `${alert.severity * 10}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-black text-slate-900 w-8">{alert.severity}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap text-right">
                    <button className="p-2.5 text-slate-300 hover:text-blue-600 hover:bg-blue-100/50 rounded-xl transition-all group-hover:translate-x-1">
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredAlerts.length === 0 && (
          <div className="py-20 text-center">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Filter className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium">No alerts found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}

