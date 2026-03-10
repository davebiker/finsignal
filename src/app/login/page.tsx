'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase'
import { Signal, Mail, Lock, LogIn, UserPlus, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createSupabaseClient()

  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
      } else {
        setSuccess('Check your email for a confirmation link.')
      }
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 -mt-[104px]">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-accent-green/10 border border-accent-green/30 flex items-center justify-center mx-auto mb-4">
            <Signal className="w-6 h-6 text-accent-green" />
          </div>
          <h1 className="font-display text-2xl font-bold">
            Fin<span className="text-accent-green">Signal</span>
          </h1>
          <p className="text-sm text-text-secondary mt-1">Financial Intelligence Terminal</p>
        </div>

        {/* Mode toggle */}
        <div className="flex items-center gap-1 bg-surface-3 rounded-lg p-0.5">
          {(['signin', 'signup'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(null); setSuccess(null) }}
              className={cn(
                'flex-1 py-2 rounded-md text-xs font-mono font-semibold transition-all',
                mode === m
                  ? 'bg-surface text-text-primary border border-border'
                  : 'text-text-muted hover:text-text-secondary'
              )}
            >
              {m === 'signin' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="terminal-input w-full pl-9 text-sm"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="terminal-input w-full pl-9 text-sm"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-accent-red-dim border border-accent-red/20 rounded-lg text-xs text-accent-red">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 bg-accent-green/10 border border-accent-green/20 rounded-lg text-xs text-accent-green">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 rounded-full border-2 border-background border-t-transparent animate-spin" />
            ) : mode === 'signin' ? (
              <>
                <LogIn className="w-4 h-4" />
                Sign In
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Create Account
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-text-muted">
          {mode === 'signin' ? (
            <>No account? <button onClick={() => setMode('signup')} className="text-accent-green hover:underline">Sign up</button></>
          ) : (
            <>Already have an account? <button onClick={() => setMode('signin')} className="text-accent-green hover:underline">Sign in</button></>
          )}
        </p>
      </div>
    </div>
  )
}
