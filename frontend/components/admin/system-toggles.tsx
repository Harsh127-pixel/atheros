'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'

interface SystemSetting {
  id: string
  label: string
  description: string
  enabled: boolean
}

const INITIAL_SETTINGS: SystemSetting[] = [
  {
    id: 'maintenance',
    label: 'Maintenance Mode',
    description: 'Pause all deployments and show maintenance page',
    enabled: false,
  },
  {
    id: 'freetier',
    label: 'Free Tier Enabled',
    description: 'Allow new free tier registrations',
    enabled: true,
  },
  {
    id: 'subscription',
    label: 'Subscription Required',
    description: 'Require subscription for advanced features',
    enabled: true,
  },
]

export function SystemToggles() {
  const [settings, setSettings] = useState(INITIAL_SETTINGS)
  const [isSaving, setIsSaving] = useState(false)

  const toggleSetting = async (id: string) => {
    setIsSaving(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      setSettings(settings.map(s => 
        s.id === id ? { ...s, enabled: !s.enabled } : s
      ))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="glass p-6 border border-primary/20 space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">System Settings</h3>
        <p className="text-sm text-muted-foreground">Control global system behavior</p>
      </div>

      <div className="space-y-3">
        {settings.map((setting) => (
          <div key={setting.id} className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-border/30">
            <div>
              <p className="font-medium text-foreground">{setting.label}</p>
              <p className="text-xs text-muted-foreground">{setting.description}</p>
            </div>
            <Switch
              checked={setting.enabled}
              onCheckedChange={() => toggleSetting(setting.id)}
              disabled={isSaving}
            />
          </div>
        ))}
      </div>

      <Button
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
        disabled={isSaving}
      >
        {isSaving ? 'Saving...' : 'Save Changes'}
      </Button>
    </Card>
  )
}
