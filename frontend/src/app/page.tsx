'use client';

import { useState } from 'react';
import { deployRepo } from './actions/deploy';
import AetherTerminal from '../components/terminal/AetherTerminal';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import Pricing from '../components/payment/Pricing';

// Re-mapping icons to lucide-react (correcting accidental 'lucide-center')
import { Github as GitIcon, Play as PlayIcon, Shield as ShieldIcon, Cloud as CloudIcon, CheckCircle2 as CheckIcon, AlertCircle as AlertIcon, Terminal as TermIcon, Loader2 as LoadIcon, Lock as LockIcon, BrainCircuit as BrainIcon } from 'lucide-react';

export default function Dashboard() {
  const { user, loginWithGoogle, logout, getToken, loading, isAdmin, settings } = useAuth();
  const [isPending, setIsPending] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) {
      setError("You must be logged in to deploy.");
      return;
    }
    
    setIsPending(true);
    setError(null);
    setResponse(null);

    const formData = new FormData(e.currentTarget);
    const token = await getToken();
    
    const result = await deployRepo(formData, token || '');

    setIsPending(false);

    if (result.error) {
      setError(result.error);
    } else {
      setResponse(result);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <LoadIcon className="w-12 h-12 text-primary-DEFAULT animate-spin" />
      </div>
    );
  }

  const isPremium = user && (user.role === 'ADMIN' || (user as any).upgradeLevel > 0);

  return (
    <main className="max-w-7xl mx-auto px-6 py-12">
      {/* Header Section */}
      <header className="flex justify-between items-center mb-16">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-primary-DEFAULT rounded-xl flex items-center justify-center glow">
            <ShieldIcon className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white leading-none">AetherOS</span>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/history" className="flex items-center space-x-2 px-4 py-2 hover:bg-white/5 rounded-lg text-sm text-slate-400 transition hover:text-white">
            <BrainIcon className="w-4 h-4" />
            <span>AI Reasoning</span>
          </Link>
          {isAdmin && (
            <Link href="/admin" className="flex items-center space-x-2 px-4 py-2 border border-primary-DEFAULT/30 bg-primary-DEFAULT/5 text-primary-light rounded-lg text-sm hover:bg-primary-DEFAULT/10 transition">
              <LockIcon className="w-4 h-4" />
              <span>God Mode</span>
            </Link>
          )}
          <button className="px-4 py-2 glass rounded-lg text-sm transition hover:bg-white/10">Documentation</button>
          {user ? (
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">{user.displayName || user.email?.split('@')[0]}</p>
                <p className="text-[10px] text-primary-light font-bold uppercase tracking-widest">
                  {isAdmin ? 'System Admin' : (user as any).upgradeLevel > 0 ? 'Pro Member' : 'Free Tier'}
                </p>
              </div>
              {user.photoURL ? (
                <img src={user.photoURL} alt="User" className="w-10 h-10 rounded-full border border-primary-DEFAULT shadow-[0_0_10px_rgba(124,58,237,0.3)]" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold">{user.email?.[0].toUpperCase()}</div>
              )}
              <button 
                onClick={() => logout()}
                className="px-4 py-2 bg-slate-800 rounded-lg text-sm font-medium hover:bg-slate-700 transition"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button 
              onClick={() => loginWithGoogle()}
              className="px-4 py-2 bg-primary-DEFAULT rounded-lg text-sm font-medium hover:bg-primary-dark transition glow"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left Column: Input Form */}
        <section className="space-y-8 animate-in fade-in slide-in-from-left duration-700">
          <div>
            <h1 className="text-5xl font-extrabold mb-4 leading-tight tracking-tight">
              Deploy with <span className="gradient-text">AI Security</span> Guardrails.
            </h1>
            <p className="text-slate-400 text-lg max-w-lg">
              Automated DevSecOps for your cloud-native applications. Connected to Vercel, Render, and Neon.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 glass p-8 rounded-2xl shadow-premium">
            <div className="space-y-2">
              <label htmlFor="repoUrl" className="block text-sm font-medium text-slate-300">
                GitHub Repository URL
              </label>
              <div className="relative">
                <GitIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                <input
                  type="url"
                  name="repoUrl"
                  id="repoUrl"
                  required
                  placeholder="https://github.com/user/repo"
                  className="w-full bg-black/40 border border-slate-700 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-primary-DEFAULT focus:border-transparent outline-none transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">Cloud Provider</label>
                <select 
                  name="cloudProvider"
                  className="w-full bg-black/40 border border-slate-700 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary-DEFAULT outline-none appearance-none"
                >
                  <option value="RENDER">Render (Basic)</option>
                  <option value="VERCEL">Vercel (Standard)</option>
                  <option value="AWS" disabled={!isPremium}>AWS (Enterprise {!isPremium && '🔒'})</option>
                  <option value="AZURE" disabled={!isPremium}>Azure (Scale {!isPremium && '🔒'})</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">Environment</label>
                <select className="w-full bg-black/40 border border-slate-700 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary-DEFAULT outline-none appearance-none">
                  <option value="production">Production</option>
                  <option value="staging">Staging</option>
                </select>
              </div>
            </div>

            <button
              disabled={isPending}
              className="w-full bg-primary-DEFAULT hover:bg-primary-dark disabled:opacity-70 text-white font-bold py-4 rounded-xl flex items-center justify-center space-x-2 transition-all duration-300 glow group"
            >
              {isPending ? (
                <>
                  <LoadIcon className="w-5 h-5 animate-spin" />
                  <span>Scanning & Initializing...</span>
                </>
              ) : (
                <>
                  <PlayIcon className="w-5 h-5 fill-current" />
                  <span>Deploy to AetherOS</span>
                </>
              )}
            </button>
          </form>

          {/* Features highlight */}
          <div className="grid grid-cols-2 gap-4">
             <div className="glass p-4 rounded-xl flex items-start space-x-3">
               <ShieldIcon className="w-5 h-5 text-primary-light mt-1" />
               <div>
                 <p className="font-semibold text-sm">SecScan Plus</p>
                 <p className="text-xs text-slate-500">Real-time code analysis</p>
               </div>
             </div>
             <div className="glass p-4 rounded-xl flex items-start space-x-3">
               <CloudIcon className="w-5 h-5 text-accent-light mt-1" />
               <div>
                 <p className="font-semibold text-sm">Multi-Cloud</p>
                 <p className="text-xs text-slate-500">Auto-scaling infrastructure</p>
               </div>
             </div>
          </div>
        </section>

        {/* Right Column: Results/Logs */}
        <section className="lg:mt-32">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 p-6 rounded-2xl flex items-start space-x-4 animate-in fade-in duration-500">
              <AlertIcon className="w-6 h-6 text-red-500 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-red-500">Configuration Error</h3>
                <p className="text-red-200/80 text-sm mt-1">{error}</p>
                <button className="mt-4 text-xs font-semibold underline">Troubleshooting Guide</button>
              </div>
            </div>
          )}

          {response ? (
            <div className="space-y-6 animate-in zoom-in-95 duration-500">
               <div className="glass p-6 rounded-2xl border-green-500/30">
                 <div className="flex items-center space-x-3 mb-4">
                    <CheckIcon className="text-green-500 w-8 h-8" />
                    <div>
                      <h3 className="text-xl font-bold text-white">Deploying Environment</h3>
                      <p className="text-sm text-slate-400">ID: <span className="text-primary-light font-mono">{response.deploymentId}</span></p>
                      {response.url && (
                        <a 
                          href={response.url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-green-400 hover:text-green-300 transition text-xs flex items-center mt-2 font-mono group"
                        >
                          <CheckIcon className="w-3 h-3 mr-2 group-hover:scale-110 transition" />
                          <span>Open Live Deployment</span>
                        </a>
                      )}
                    </div>
                 </div>
                 
                 <div className="h-80 w-full mb-4">
                    <AetherTerminal deploymentId={response.deploymentId} />
                 </div>
               </div>
            </div>
          ) : !error && (
            <div className="glass h-full min-h-[460px] rounded-2xl border-white/5 flex flex-col items-center justify-center text-center p-8 space-y-4">
              <div className="relative">
                <div className="absolute inset-0 bg-primary-DEFAULT blur-3xl opacity-10"></div>
                <TermIcon className="w-16 h-16 text-slate-700 relative z-10" />
              </div>
              <div className="h-64 flex flex-col items-center justify-center">
                 <h3 className="text-xl font-semibold text-slate-400">Live Log-Room</h3>
                 <p className="text-sm text-slate-500 max-w-xs mt-2">
                   Real-time terminal logs from your secure deployment pipeline will stream here.
                 </p>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Pricing Section (Only if enabled and user needs upgrade) */}
      {settings?.subscriptionModelOn && (!isPremium) && (
        <section className="mt-24 border-t border-white/5 pt-24 animate-in fade-in slide-in-from-bottom-10 duration-1000">
           <div className="text-center mb-16">
             <h2 className="text-4xl font-extrabold text-white mb-4 tracking-tight">Elevate Your <span className="gradient-text">Security Architecture.</span></h2>
             <p className="text-slate-400 max-w-lg mx-auto">
               Unlock professional-grade AI guardrails and priority deployment infrastructure.
             </p>
           </div>
           <Pricing getToken={getToken} onSuccess={() => window.location.reload()} />
        </section>
      )}

      <footer className="mt-24 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center opacity-70">
        <p className="text-sm text-slate-500">© 2026 AetherOS Technologies. All rights reserved.</p>
        <div className="flex items-center space-x-6 mt-4 md:mt-0">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-xs font-mono uppercase tracking-widest text-slate-400">MCP Foundation Engine: ACTIVE</span>
          </div>
          <a href="#" className="text-sm text-slate-400 hover:text-white transition">Privacy</a>
          <a href="#" className="text-sm text-slate-400 hover:text-white transition">Terms</a>
        </div>
      </footer>
    </main>
  );
}
