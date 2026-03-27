'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  BrainCircuit, 
  History, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  Database,
  Search,
  Loader2,
  Server,
  Zap,
  Cloud
} from 'lucide-react';

export default function ReasoningHistory() {
  const { getToken, user } = useAuth();
  const [deployments, setDeployments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetchHistory = async () => {
      const token = await getToken();
      if (!token) return; // Wait for Firebase Auth to hydrate the user session

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
      try {
        const res = await fetch(`${backendUrl}/api/deployments`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (isMounted) {
          if (Array.isArray(data)) {
            setDeployments(data);
          } else {
            console.warn("Deployments API Warning:", data);
            setDeployments([]);
          }
        }
      } catch (e) {
        console.warn("Deployments fetch failed:", e);
        if (isMounted) setDeployments([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchHistory();
    return () => { isMounted = false; };
  }, [getToken]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary-DEFAULT animate-spin" />
      </div>
    );
  }

  const filtered = deployments.filter(d => 
     d.repoUrl.toLowerCase().includes(search.toLowerCase()) ||
     (d.reasoning && d.reasoning.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#020203] text-slate-200">
      <main className="max-w-6xl mx-auto px-6 py-12">
        <header className="mb-12 flex justify-between items-end">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-primary-light">
              <BrainCircuit className="w-5 h-5" />
              <span className="text-sm font-bold uppercase tracking-widest">AetherOS Intelligent History</span>
            </div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight">Autonomous Reasoning Logs</h1>
            <p className="text-slate-500">Every deployment decision processed by the AetherOS Brain.</p>
          </div>
          
          <div className="w-80 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Filter by repo or logic..." 
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 outline-none focus:ring-2 focus:ring-primary-DEFAULT"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </header>

        <div className="space-y-6">
          {filtered.length === 0 ? (
            <div className="glass p-12 rounded-3xl text-center space-y-4">
              <History className="w-12 h-12 text-slate-800 mx-auto" />
              <p className="text-slate-500">No autonomous reasoning logs found for your account.</p>
            </div>
          ) : filtered.map((d) => (
            <div key={d.id} className="glass rounded-3xl overflow-hidden border-white/5 group hover:border-primary-DEFAULT/30 transition-all duration-500">
               <div className="p-8 flex flex-col md:flex-row gap-8">
                 {/* Status & Identity */}
                 <div className="md:w-64 space-y-4 shrink-0">
                    <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-[10px] font-black uppercase ${d.status === 'SUCCESS' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-500'}`}>
                      {d.status === 'SUCCESS' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                      <span>{d.status}</span>
                    </div>
                    
                    <div>
                      <h3 className="font-mono text-xs text-slate-500 mb-1">REPOSITORY</h3>
                      <p className="text-sm font-bold text-white truncate max-w-full" title={d.repoUrl}>{d.repoUrl.split('/').pop()}</p>
                    </div>

                    <div>
                      <h3 className="font-mono text-xs text-slate-500 mb-1">DATE</h3>
                      <p className="text-xs text-slate-400">{new Date(d.createdAt).toLocaleString()}</p>
                    </div>

                    <div className="flex items-center space-x-2 pt-2 pb-4">
                       <Database className="w-4 h-4 text-primary-light" />
                       <span className="text-xs font-bold text-slate-300">{d.cloudProvider || 'RENDER'}</span>
                    </div>
                 </div>

                 {/* Reasoning Logic Output & Cloud Comparison UI */}
                 <div className="flex-1 bg-black/40 rounded-2xl p-6 border border-white/5 relative overflow-hidden flex flex-col space-y-6">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                       <BrainCircuit className="w-24 h-24" />
                    </div>

                    {/* Reasoning Block */}
                    <div>
                      <h3 className="text-xs font-bold text-primary-light mb-4 flex items-center space-x-2 uppercase tracking-widest">
                         <span>Autonomous Logic Loop</span>
                         <ChevronRight className="w-3 h-3" />
                      </h3>
                      <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                         {d.reasoning || "No autonomous reasoning recorded for this legacy deployment."}
                      </p>
                    </div>
                    
                    {/* Cloud Comparison Matrix UI */}
                    <div className="mt-4 border-t border-white/5 pt-6">
                      <h3 className="text-xs font-bold text-slate-500 mb-4 flex items-center space-x-2 uppercase tracking-widest">
                         <span>Broker Multi-Cloud Matrix</span>
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                         
                         {/* Render Box */}
                         <div className={`p-4 rounded-xl border transition-colors ${d.cloudProvider === 'RENDER' ? 'bg-primary-DEFAULT/10 border-primary-DEFAULT/50 shadow-[0_0_15px_rgba(var(--primary-DEFAULT),0.1)]' : 'bg-white/5 border-white/10 opacity-70'}`}>
                           <div className="flex items-center space-x-2 mb-2">
                             <Server className={`w-4 h-4 ${d.cloudProvider === 'RENDER' ? 'text-primary-light' : 'text-slate-400'}`} />
                             <span className={`text-sm font-bold ${d.cloudProvider === 'RENDER' ? 'text-white' : 'text-slate-300'}`}>Render</span>
                           </div>
                           <p className="text-xs text-slate-500">Node JS Native • Auto-SSL • 750h Free Tier</p>
                         </div>

                         {/* Fly.io Box */}
                         <div className={`p-4 rounded-xl border transition-colors ${d.cloudProvider === 'FLY' ? 'bg-[#4B3095]/20 border-[#4B3095]/50 shadow-[0_0_15px_rgba(75,48,149,0.2)]' : 'bg-white/5 border-white/10 opacity-70'}`}>
                           <div className="flex items-center space-x-2 mb-2">
                             <Zap className={`w-4 h-4 ${d.cloudProvider === 'FLY' ? 'text-[#8D6CEB]' : 'text-slate-400'}`} />
                             <span className={`text-sm font-bold ${d.cloudProvider === 'FLY' ? 'text-white' : 'text-slate-300'}`}>Fly.io</span>
                           </div>
                           <p className="text-xs text-slate-500">Firecracker VMs • Go/Rust Optimized • Edge Global</p>
                         </div>

                         {/* GCP Box */}
                         <div className={`p-4 rounded-xl border transition-colors ${d.cloudProvider === 'GCP' ? 'bg-[#4285F4]/10 border-[#4285F4]/50 shadow-[0_0_15px_rgba(66,133,244,0.1)]' : 'bg-white/5 border-white/10 opacity-70'}`}>
                           <div className="flex items-center space-x-2 mb-2">
                             <Cloud className={`w-4 h-4 ${d.cloudProvider === 'GCP' ? 'text-[#4285F4]' : 'text-slate-400'}`} />
                             <span className={`text-sm font-bold ${d.cloudProvider === 'GCP' ? 'text-white' : 'text-slate-300'}`}>GCP Run</span>
                           </div>
                           <p className="text-xs text-slate-500">JVM/Enterprise • Huge Cold Start Buffer • Auto-scale</p>
                         </div>

                      </div>
                    </div>

                    {d.securityScore !== null && (
                      <div className="mt-2 pt-6 border-t border-white/5 flex items-center justify-between">
                         <div className="flex items-center space-x-3">
                           <div className="w-10 h-10 rounded-xl bg-primary-DEFAULT/10 flex items-center justify-center">
                              <span className="text-sm font-bold text-primary-light">{d.securityScore}%</span>
                           </div>
                           <span className="text-xs font-medium text-slate-500 italic">DevSecOps Shield Score</span>
                         </div>
                      </div>
                    )}
                 </div>
               </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
