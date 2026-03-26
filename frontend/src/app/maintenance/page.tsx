'use client';

import { Shield, Hammer, Clock } from 'lucide-react';
import Link from 'next/link';

export default function Maintenance() {
  return (
    <div className="min-h-screen bg-[#020203] flex flex-col items-center justify-center p-6 text-center">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-primary-DEFAULT blur-3xl opacity-20 animate-pulse"></div>
        <div className="w-24 h-24 bg-[#09090b] rounded-3xl border border-white/10 flex items-center justify-center relative z-10 shadow-2xl">
           <Hammer className="text-primary-DEFAULT w-12 h-12" />
        </div>
      </div>

      <h1 className="text-5xl font-extrabold text-white mb-4 tracking-tight">System <span className="gradient-text">Upgrading.</span></h1>
      <p className="text-slate-400 text-lg max-w-md mx-auto mb-8">
        AetherOS is currently undergoing scheduled maintenance to bring you even more secure AI guardrails.
      </p>

      <div className="glass p-6 rounded-2xl flex items-center space-x-4 mb-8">
         <Clock className="text-primary-light w-6 h-6" />
         <div className="text-left">
            <p className="text-sm font-bold text-white uppercase tracking-widest">Expected Recovery</p>
            <p className="text-xs text-slate-500">Approx. 45 minutes remaining</p>
         </div>
      </div>

      <div className="flex space-x-4">
         <button onClick={() => window.location.reload()} className="px-6 py-2 bg-primary-DEFAULT text-white rounded-lg font-bold hover:bg-primary-dark transition glow">
           Check Status
         </button>
         <Link href="https://twitter.com/aetheros" className="px-6 py-2 glass rounded-lg text-sm transition hover:bg-white/5">
           Follow Updates
         </Link>
      </div>

      <footer className="mt-16 pt-8 border-t border-white/5 w-full max-w-xs flex items-center justify-center space-x-2 opacity-50">
         <Shield className="w-4 h-4" />
         <span className="text-[10px] uppercase font-mono tracking-widest font-bold">MCP-Foundation Engine Securely Paused</span>
      </footer>
    </div>
  );
}
