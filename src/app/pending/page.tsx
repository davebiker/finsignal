'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase'
import { Signal, Clock, LogOut } from 'lucide-react'

export default function PendingApprovalPage() {
  const router = useRouter()
  const supabase = createSupabaseClient()
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push('/login')
        return
      }
      setEmail(data.user.email ?? null)
    })

    // Poll every 10 seconds to check if approved
    const interval = setInterval(async () => {
      const res = await fetch('/api/profile')
      if (res.ok) {
        const { profile } = await res.json()
        if (profile?.approved) {
          router.push('/dashboard')
          router.refresh()
        }
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 -mt-[104px]">
      <div className="w-full max-w-sm text-center space-y-6">
        {/* Logo */}
        <div className="w-12 h-12 rounded-xl bg-accent-green/10 border border-accent-green/30 flex items-center justify-center mx-auto">
          <Signal className="w-6 h-6 text-accent-green" />
        </div>

        {/* Pending icon */}
        <div className="w-20 h-20 rounded-2xl bg-accent-gold/10 border border-accent-gold/30 flex items-center justify-center mx-auto">
          <Clock className="w-10 h-10 text-accent-gold" />
        </div>

        <div className="space-y-2">
          <h1 className="font-display text-xl font-bold text-text-primary">
            Account Pending Approval
          </h1>
          <p className="text-sm text-text-secondary leading-relaxed">
            Your account{email ? ` (${email})` : ''} has been created successfully.
            An administrator needs to approve your access before you can use FinSignal.
          </p>
          <p className="text-xs text-text-muted mt-3">
            This page checks automatically — you&apos;ll be redirected once approved.
          </p>
        </div>

        <div className="pt-2">
          <button
            onClick={handleSignOut}
            className="btn-ghost text-sm mx-auto"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
