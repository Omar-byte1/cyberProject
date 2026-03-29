import Sidebar from '@/components/Sidebar';
import AuthGuard from '@/components/AuthGuard';

export default function PlaybooksLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="ml-64 flex-1 min-h-screen p-8 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
