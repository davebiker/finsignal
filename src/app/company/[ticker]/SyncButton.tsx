'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, Check, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function SyncButton({ ticker }: { ticker: string }) {
  const router = useRouter()
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  async function handleSync() {
    setState('loading')
    try {
      const res = await fetch(`/api/sync/${ticker}`, { method: 'POST' })
      if (res.ok) {
        setState('success')
        router.refresh()
        setTimeout(() => setState('idle'), 2000)
      } else {
        setState('error')
        setTimeout(() => setState('idle'), 3000)
      }
    } catch {
      setState('error')
      setTimeout(() => setState('idle'), 3000)
    }
  }

  return (
    <button
      onClick={handleSync}
      disabled={state === 'loading'}
      className={cn(
        'btn-ghost text-xs gap-1.5 transition-all',
        state === 'success' && 'text-accent-green border-accent-green/30',
        state === 'error' && 'text-accent-red border-accent-red/30',
      )}
    >
      {state === 'loading' && <RefreshCw className="w-3 h-3 animate-spin" />}
      {state === 'success' && <Check className="w-3 h-3" />}
      {state === 'error' && <AlertCircle className="w-3 h-3" />}
      {state === 'idle' && <RefreshCw className="w-3 h-3" />}
      {state === 'loading' ? 'Syncing…' : state === 'success' ? 'Updated' : state === 'error' ? 'Failed' : 'Sync Data'}
    </button>
  )
}
