'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Rocket, Github } from 'lucide-react'

const CLOUD_PROVIDERS = [
  { id: 'render', name: 'Render' },
  { id: 'flyio', name: 'Fly.io' },
  { id: 'gcp', name: 'Google Cloud Platform' },
  { id: 'aws', name: 'AWS' },
  { id: 'azure', name: 'Microsoft Azure' },
]

export function DeploymentHub() {
  const [githubUrl, setGithubUrl] = useState('')
  const [provider, setProvider] = useState('')
  const [isDeploying, setIsDeploying] = useState(false)

  const handleDeploy = async () => {
    if (!githubUrl || !provider) {
      alert('Please fill in all fields')
      return
    }

    setIsDeploying(true)
    try {
      // Simulate deployment API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      alert('Deployment started! Check the terminal for logs.')
      setGithubUrl('')
      setProvider('')
    } catch (error) {
      console.error('Deployment error:', error)
      alert('Failed to start deployment')
    } finally {
      setIsDeploying(false)
    }
  }

  return (
    <Card className="glass p-8 border border-primary/20 backdrop-blur-md">
      <div className="space-y-6">
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

          <Button
            onClick={handleDeploy}
            disabled={isDeploying || !githubUrl || !provider}
            className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
          >
            <Rocket className="w-4 h-4" />
            {isDeploying ? 'Deploying...' : 'Start Deployment'}
          </Button>
        </div>
      </div>
    </Card>
  )
}
