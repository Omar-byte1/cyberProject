"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ShieldAlert, Lock, User, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Veuillez saisir un nom d\'utilisateur et un mot de passe.');
      return;
    }

    // Auth local simple (mécanisme simulé)
    if (username === 'soc' && password === 'soc123') {
      localStorage.setItem('auth', 'true');
      router.replace('/dashboard');
      return;
    }

    setError("Identifiants incorrects. ");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-xl p-8">
        <div className="text-center mb-6">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 via-violet-500 to-cyan-500 flex items-center justify-center text-white mb-3 shadow-lg">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">SOC Login</h1>
          <p className="mt-2 text-slate-300">Authentifiez-vous pour accéder au dashboard de cybersécurité.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-slate-300 text-xs uppercase tracking-wide font-semibold">Nom utilisateur</label>
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2">
            <User className="w-4 h-4 text-slate-300" />
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="soc ou admin"
              className="w-full bg-transparent outline-none text-slate-100 placeholder:text-slate-400"
            />
          </div>

          <label className="block text-slate-300 text-xs uppercase tracking-wide font-semibold">Mot de passe</label>
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2">
            <Lock className="w-4 h-4 text-slate-300" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="******"
              className="w-full bg-transparent outline-none text-slate-100 placeholder:text-slate-400"
            />
          </div>

          {error && <p className="text-rose-300 text-sm font-medium">{error}</p>}

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 hover:scale-[1.01] transition"
          >
            Se connecter
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-4 text-xs text-slate-400 rounded-xl bg-slate-800/50 p-2">
          <p className="font-semibold text-slate-200">Accès de test :</p>
          <p>Utilisateur : <span className="text-blue-300">.</span></p>
          <p>Mot de passe : <span className="text-blue-300">.</span></p>
        </div>
      </div>
    </div>
  );
}
