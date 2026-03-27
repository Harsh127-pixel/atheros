'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AetherTerminal } from '@/components/terminal/aether-terminal';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ExternalLink, ShieldCheck, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';

export default function DeploymentDetailPage() {
  const { id } = useParams();
  const { getToken, user } = useAuth();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchToken = async () => {
      const token = await getToken();
      setAccessToken(token);
    };
    fetchToken();
  }, [getToken]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-black/95 text-foreground p-8 space-y-8"
    >
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/dashboard')}
          className="gap-2 text-primary hover:text-primary/80 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Dashboard
        </Button>
        <div className="flex items-center gap-4">
           <div className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-xs font-mono text-primary flex items-center gap-2">
             <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
             Live Monitoring
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Column: Stats & Meta */}
        <div className="lg:col-span-1 space-y-6">
           <Card className="glass p-6 border-primary/20 space-y-4">
              <h2 className="text-xl font-bold font-mono">Deployment Info</h2>
              <div className="space-y-4 pt-2">
                 <div className="space-y-1">
                    <label className="text-[10px] uppercase text-muted-foreground font-bold">Deployment ID</label>
                    <p className="font-mono text-sm truncate">{id}</p>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] uppercase text-muted-foreground font-bold">Started By</label>
                    <p className="text-sm">{user?.name || 'AetherOS System'}</p>
                 </div>
                 <div className="pt-4 border-t border-white/5 space-y-2">
                    <div className="flex items-center gap-2 text-primary">
                       <ShieldCheck className="w-4 h-4" />
                       <span className="text-xs">DevSecOps Active</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                       <Globe className="w-4 h-4" />
                       <span className="text-xs">Preparing URL...</span>
                    </div>
                 </div>
              </div>
           </Card>

           <Button variant="outline" className="w-full border-primary/20 hover:bg-primary/5 gap-2 group transition-all">
              <ExternalLink className="w-4 h-4 group-hover:scale-110 transition-transform" />
              Visit Preview
           </Button>
        </div>

        {/* Right Column: Terminal */}
        <div className="lg:col-span-3">
          <AetherTerminal deploymentId={id as string} accessToken={accessToken} />
        </div>

      </div>
    </motion.div>
  );
}
