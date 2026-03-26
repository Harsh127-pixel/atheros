'use client';

import { useState } from 'react';
import { deployRepo } from './actions/deploy';
import { Github, Play, Shield, Cloud, CheckCircle2, AlertCircle, Terminal, Loader2 } from 'lucide-react';

export default function Dashboard() {
  const [isPending, setIsPending] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    setError(null);
    setResponse(null);

    const formData = new FormData(e.currentTarget);
    const result = await deployRepo(formData);

    setIsPending(false);

    if (result.error) {
      setError(result.error);
    } else {
      setResponse(result);
    }
  }

  return (
    <main className="max-w-7xl mx-auto px-6 py-12">
      {/* Header Section */}
      <header className="flex justify-between items-center mb-16">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-primary-DEFAULT rounded-xl flex items-center justify-center glow">
            <Shield className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight gradient-text">AetherOS</span>
        </div>
        <div className="flex items-center space-x-4">
          <button className="px-4 py-2 glass rounded-lg text-sm transition hover:bg-white/10">Documentation</button>
          <button className="px-4 py-2 bg-primary-DEFAULT rounded-lg text-sm font-medium hover:bg-primary-dark transition glow">Sign In</button>
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
                <Github className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
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
                  className="w-full bg-black/40 border border-slate-700 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary-DEFAULT outline-none"
                >
                  <option value="RENDER">Render</option>
                  <option value="VERCEL">Vercel</option>
                  <option value="AWS">AWS</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">Environment</label>
                <select className="w-full bg-black/40 border border-slate-700 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary-DEFAULT outline-none">
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
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Scanning & Initializing...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span>Deploy to AetherOS</span>
                </>
              )}
            </button>
          </form>

          {/* Features highlight */}
          <div className="grid grid-cols-2 gap-4">
             <div className="glass p-4 rounded-xl flex items-start space-x-3">
               <Shield className="w-5 h-5 text-primary-light mt-1" />
               <div>
                 <p className="font-semibold text-sm">SecScan Plus</p>
                 <p className="text-xs text-slate-500">Real-time code analysis</p>
               </div>
             </div>
             <div className="glass p-4 rounded-xl flex items-start space-x-3">
               <Cloud className="w-5 h-5 text-accent-light mt-1" />
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
              <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
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
                    <CheckCircle2 className="text-green-500 w-8 h-8" />
                    <div>
                      <h3 className="text-xl font-bold">Deploying Environment</h3>
                      <p className="text-sm text-slate-400">ID: <span className="text-primary-light font-mono">{response.deploymentId}</span></p>
                    </div>
                 </div>
                 
                 <div className="bg-black/60 rounded-xl p-4 font-mono text-sm text-slate-300 border border-slate-800 h-64 overflow-y-auto">
                    <div className="flex items-center space-x-2 text-slate-500 mb-2">
                       <Terminal className="w-4 h-4" />
                       <span>AetherOS CI/CD Terminal</span>
                    </div>
                    <p className="text-primary-light">[info] Initializing AetherOS engine...</p>
                    <p className="text-green-400">[info] Connecting to Render API...</p>
                    <p className="text-green-400">[info] Authorized: Security token validated.</p>
                    <p>[scan] Running SecScan Plus AI analyzer...</p>
                    <p className="text-yellow-400">[warn] 2 low-risk dependencies found.</p>
                    <p>[deploy] Provisioning Render instance...</p>
                    <p className="animate-pulse">_</p>
                 </div>
               </div>
            </div>
          ) : !error && (
            <div className="glass h-full min-h-[400px] rounded-2xl border-white/5 flex flex-col items-center justify-center text-center p-8 space-y-4">
              <div className="relative">
                <div className="absolute inset-0 bg-primary-DEFAULT blur-2xl opacity-20"></div>
                <Terminal className="w-16 h-16 text-slate-700 relative z-10" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-400">Deployment Logs</h3>
                <p className="text-sm text-slate-500 max-w-xs mt-2">
                  Logs from your secure deployment pipeline will appear here in real-time.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Footer / MCP Status */}
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
