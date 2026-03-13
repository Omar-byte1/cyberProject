import Link from 'next/link';
import { 
  LayoutDashboard, 
  AlertCircle, 
  ShieldAlert, 
  FileText, 
  Settings, 
  ShieldCheck 
} from 'lucide-react';

export default function Sidebar() {
  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Alerts', href: '/alerts', icon: AlertCircle },
    { name: 'CVE Intel', href: '/cve', icon: ShieldAlert },
    { name: 'Threat Report', href: '/threat-report', icon: FileText },
  ];

  return (
    <div className="w-64 bg-slate-950 text-slate-300 h-screen p-6 flex flex-col fixed shadow-2xl border-r border-slate-800/50 backdrop-blur-xl">
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
          <ShieldCheck className="text-white w-6 h-6" />
        </div>
        <h2 className="text-2xl font-black text-white tracking-tighter">
          CYBER<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">AI</span>
        </h2>
      </div>

      <nav className="space-y-2 flex-1">
        {menuItems.map((item) => (
          <Link 
            key={item.name}
            href={item.href} 
            className="flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-white/5 hover:text-white transition-all duration-300 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <item.icon className="w-5 h-5 text-slate-500 group-hover:text-blue-400 transition-colors z-10" />
            <span className="font-bold text-sm tracking-wide z-10">{item.name}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-auto">
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl p-5 border border-slate-800 shadow-inner">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping absolute inset-0"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 relative"></div>
            </div>
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">System Online</span>
          </div>
          <p className="text-[10px] text-slate-500 font-bold leading-relaxed uppercase tracking-wider">
            CTI Engine <span className="text-slate-400">v1.2.4</span><br/>
            <span className="text-blue-500/50">Infrastructure Secure</span>
          </p>
        </div>
      </div>
    </div>
  );
}
