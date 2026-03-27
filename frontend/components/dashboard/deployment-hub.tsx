'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Rocket, Github, AlertCircle, ShieldAlert, CheckCircle2, Cloud } from 'lucide-react'
import { useAuth } from '@/components/providers/auth-provider'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const CLOUD_PROVIDERS = [
  { id: 'render', name: 'Render' },
  { id: 'flyio', name: 'Fly.io' },
  { id: 'gcp', name: 'Google Cloud Platform' },
  { id: 'vercel', name: 'Vercel (Standard Frontend)' }
]

interface Vulnerability {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  type: string
  description: string
  file?: string
}

interface DeploymentHubProps {
  onDeploymentStarted?: (id: string) => void
}

export function DeploymentHub({ onDeploymentStarted }: DeploymentHubProps) {
  const [githubUrl, setGithubUrl] = useState('')
  const [provider, setProvider] = useState('')
  const [isDeploying, setIsDeploying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([])
  const { getToken, isAdmin } = useAuth()
  const router = useRouter()

  const handleDeploy = async (force = false) => {
    if (!githubUrl || !provider) {
      toast.error('Please fill in all fields')
      return
    }

    setIsDeploying(true)
    setError(null)
    setVulnerabilities([])
    
    try {
      const token = await getToken();
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      
      const response = await fetch(`${backendUrl}/api/deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          repoUrl: githubUrl,
          cloudProvider: provider.toUpperCase(),
          strategy: force ? 'FORCE' : 'BALANCED'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.vulnerabilities) {
           setVulnerabilities(data.vulnerabilities);
           setError('Security Audit Failed: Critical vulnerabilities found.');
           toast.warning('Shield System: Deployment Blocked');
           return;
        }
        throw new Error(data.error || data.message || 'Deployment failed');
      }

      toast.success('Deployment Handshake Successful!');
      
      if (onDeploymentStarted) {
        onDeploymentStarted(data.deploymentId);
      } else {
        router.push(`/deployments/${data.deploymentId}`);
      }
      
    } catch (err: any) {
      console.error('Deployment error:', err)
      setError(err.message)
      toast.error(err.message || 'Failed to start deployment')
    } finally {
      setIsDeploying(false)
    }
  }

  return (
    <Card className="glass p-8 border border-primary/20 backdrop-blur-md h-full flex flex-col">
      <div className="space-y-6 flex-1">
        <div className="flex items-center gap-3 mb-2">
           <div className="p-2 bg-primary/10 rounded-lg">
              <Cloud className="w-5 h-5 text-primary" />
           </div>
           <h2 className="text-2xl font-bold text-foreground">Launchpad</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-2 block uppercase tracking-wider">GitHub Repository URL</label>
            <div className="relative">
              <Github className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground/60" />
              <Input
                placeholder="https://github.com/username/repo"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                className="pl-9 bg-input/40 border-border/40 focus:border-primary/50 h-11 text-sm rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground mb-2 block uppercase tracking-wider">Infrastructure Choice</label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger className="bg-input/40 border-border/40 focus:border-primary/50 h-11 text-sm rounded-xl">
                <SelectValue placeholder="Select a cloud provider" />
              </SelectTrigger>
              <SelectContent>
                {CLOUD_PROVIDERS.map(p => (
                  <SelectItem key={p.id} value={p.id} className="text-sm font-medium">{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && !vulnerabilities.length && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2 text-destructive text-[11px] font-bold">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Vulnerability Report with Force Option */}
          {vulnerabilities.length > 0 && (
            <div className="space-y-4 p-5 rounded-2xl bg-destructive/5 border border-destructive/20 backdrop-blur-sm animate-in fade-in slide-in-from-top-4">
               <div className="flex items-center gap-2 text-destructive font-bold text-xs uppercase tracking-widest">
                  <ShieldAlert className="w-4 h-4" />
                  Shield Report: Action Required
               </div>
               <div className="max-h-40 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {vulnerabilities.map((v, i) => (
                    <div key={i} className="text-[10px] p-2.5 bg-black/50 rounded-lg border border-white/5 flex flex-col gap-1">
                       <span className={`font-black tracking-tighter ${v.severity === 'CRITICAL' ? 'text-red-500' : 'text-orange-500'}`}>
                         {v.severity}
                       </span>
                       <span className="text-foreground leading-tight">{v.type}: {v.description}</span>
                    </div>
                  ))}
               </div>
               
               <div className="pt-3 border-t border-white/10 space-y-3">
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                     <span className="text-destructive font-bold">WARNING:</span> Proceeding despite critical vulnerabilities is high-risk. Ensure you have reviewed all findings before overriding.
                  </p>
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    className="w-full text-[11px] h-9 font-bold tracking-tight rounded-xl" 
                    onClick={() => handleDeploy(true)}
                    disabled={isDeploying}
                  >
                    Override & Deploy Anyway
                  </Button>
               </div>
            </div>
          )}

          <Button
            onClick={() => handleDeploy(false)}
            disabled={isDeploying || !githubUrl || !provider}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground gap-2 mt-4 font-bold text-sm tracking-tight rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all"
          >
            <Rocket className="w-5 h-5" />
            {isDeploying ? (
               <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  Deploying...
               </div>
            ) : 'Start Secure Deployment'}
          </Button>
        </div>
      </div>
    </Card>
  )
}
