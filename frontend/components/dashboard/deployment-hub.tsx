'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Rocket, Github, AlertCircle, ShieldAlert, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/components/providers/auth-provider'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const CLOUD_PROVIDERS = [
  { id: 'render', name: 'Render' },
  { id: 'flyio', name: 'Fly.io' },
  { id: 'gcp', name: 'Google Cloud Platform' }
]

interface Vulnerability {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  type: string
  description: string
  file?: string
}

export function DeploymentHub() {
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
      router.push(`/deployments/${data.deploymentId}`);
      
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
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Deployment Hub</h2>
          <p className="text-sm text-muted-foreground">Connect your GitHub repository and select a cloud provider</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">GitHub Repository URL</label>
            <div className="relative">
              <Github className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="https://github.com/username/repo"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                className="pl-10 bg-input/50 border-border/50 focus:border-primary/50"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Cloud Provider</label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger className="bg-input/50 border-border/50 focus:border-primary/50">
                <SelectValue placeholder="Select a provider" />
              </SelectTrigger>
              <SelectContent>
                {CLOUD_PROVIDERS.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && !vulnerabilities.length && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Vulnerability Report */}
          {vulnerabilities.length > 0 && (
            <div className="space-y-3 p-4 rounded-xl bg-destructive/5 border border-destructive/20">
               <div className="flex items-center gap-2 text-destructive font-bold text-sm mb-2">
                  <ShieldAlert className="w-5 h-5" />
                  Shield Report: Critical Findings
               </div>
               <div className="max-h-40 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {vulnerabilities.map((v, i) => (
                    <div key={i} className="text-[11px] p-2 bg-black/40 rounded border border-white/5">
                       <span className={`font-bold ${v.severity === 'CRITICAL' ? 'text-red-500' : 'text-orange-500'}`}>
                         [{v.severity}]
                       </span> {v.type}: {v.description}
                       {v.file && <div className="text-muted-foreground mt-1 italic">Location: {v.file}</div>}
                    </div>
                  ))}
               </div>
               
               {isAdmin && (
                  <div className="pt-2 border-t border-white/5 mt-4">
                     <p className="text-[10px] text-muted-foreground mb-2 italic">As an Administrator, you can override these findings.</p>
                     <Button 
                        size="sm" 
                        variant="destructive" 
                        className="w-full text-xs" 
                        onClick={() => handleDeploy(true)}
                        disabled={isDeploying}
                      >
                        Force Deployment (Admin Override)
                     </Button>
                  </div>
               )}
            </div>
          )}

          <Button
            onClick={() => handleDeploy(false)}
            disabled={isDeploying || !githubUrl || !provider}
            className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground gap-2 mt-4"
          >
            <Rocket className="w-4 h-4" />
            {isDeploying ? 'Scanning Codebase...' : 'Start Secure Deployment'}
          </Button>
        </div>
      </div>
    </Card>
  )
}
