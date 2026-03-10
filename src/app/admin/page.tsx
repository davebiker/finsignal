'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import {
  Shield, UserCheck, UserX, Clock, CheckCircle, Users, ArrowLeft, RefreshCw
} from 'lucide-react'
import Link from 'next/link'

interface Profile {
  id: string
  email: string
  role: string
  approved: boolean
  created_at: string
  updated_at: string
}

export default function AdminPage() {
  const router = useRouter()
  const supabase = createSupabaseClient()
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  async function fetchUsers() {
    setLoading(true)
    setError(null)
    const res = await fetch('/api/admin/users')
    if (!res.ok) {
      if (res.status === 403) {
        router.push('/dashboard')
        return
      }
      setError('Failed to load users')
      setLoading(false)
      return
    }
    const data = await res.json()
    setUsers(data.users ?? [])
    setLoading(false)
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  async function handleAction(userId: string, action: 'approve' | 'reject') {
    setActionLoading(userId)
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action }),
    })

    if (res.ok) {
      if (action === 'reject') {
        setUsers((prev) => prev.filter((u) => u.id !== userId))
      } else {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, approved: true } : u))
        )
      }
    } else {
      const data = await res.json()
      setError(data.error ?? 'Action failed')
    }
    setActionLoading(null)
  }

  const pending = users.filter((u) => !u.approved)
  const approved = users.filter((u) => u.approved)

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/dashboard" className="text-text-muted hover:text-text-secondary transition-colors flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" />
          Dashboard
        </Link>
        <span className="text-border-bright">/</span>
        <span className="text-text-secondary">Admin</span>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-accent-blue" />
            <span className="text-xs font-mono text-accent-blue uppercase tracking-widest">
              Administration
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold text-text-primary">
            User Management
          </h1>
        </div>
        <button onClick={fetchUsers} className="btn-ghost text-sm" disabled={loading}>
          <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-accent-red-dim border border-accent-red/20 rounded-lg text-xs text-accent-red">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4 text-center">
          <Users className="w-5 h-5 text-text-muted mx-auto mb-2" />
          <p className="font-display text-xl font-bold text-text-primary">{users.length}</p>
          <p className="text-xs font-mono text-text-muted">Total Users</p>
        </div>
        <div className="card p-4 text-center">
          <Clock className="w-5 h-5 text-accent-gold mx-auto mb-2" />
          <p className="font-display text-xl font-bold text-accent-gold">{pending.length}</p>
          <p className="text-xs font-mono text-text-muted">Pending</p>
        </div>
        <div className="card p-4 text-center">
          <CheckCircle className="w-5 h-5 text-accent-green mx-auto mb-2" />
          <p className="font-display text-xl font-bold text-accent-green">{approved.length}</p>
          <p className="text-xs font-mono text-text-muted">Approved</p>
        </div>
      </div>

      {/* Pending users */}
      <section>
        <h2 className="font-display font-semibold text-sm text-accent-gold uppercase tracking-widest mb-4 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" />
          Pending Approval ({pending.length})
        </h2>

        {loading ? (
          <div className="card p-8 animate-pulse">
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="h-4 w-48 bg-surface-3 rounded" />
                  <div className="flex gap-2">
                    <div className="h-8 w-20 bg-surface-3 rounded" />
                    <div className="h-8 w-20 bg-surface-3 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : pending.length === 0 ? (
          <div className="card p-8 text-center text-text-muted text-sm">
            No pending registrations.
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-xs font-mono text-text-muted uppercase tracking-widest">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-mono text-text-muted uppercase tracking-widest">Registered</th>
                  <th className="text-right px-4 py-3 text-xs font-mono text-text-muted uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((user) => (
                  <tr key={user.id} className="border-b border-border last:border-0 hover:bg-surface-2 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm text-text-primary">{user.email}</span>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-text-secondary">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleAction(user.id, 'approve')}
                          disabled={actionLoading === user.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-accent-green/10 text-accent-green border border-accent-green/20 hover:bg-accent-green/20 transition-colors disabled:opacity-50"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleAction(user.id, 'reject')}
                          disabled={actionLoading === user.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-accent-red-dim text-accent-red border border-accent-red/20 hover:bg-accent-red/20 transition-colors disabled:opacity-50"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Approved users */}
      <section>
        <h2 className="font-display font-semibold text-sm text-accent-green uppercase tracking-widest mb-4 flex items-center gap-2">
          <CheckCircle className="w-3.5 h-3.5" />
          Approved Users ({approved.length})
        </h2>

        {approved.length === 0 ? (
          <div className="card p-8 text-center text-text-muted text-sm">
            No approved users yet.
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-xs font-mono text-text-muted uppercase tracking-widest">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-mono text-text-muted uppercase tracking-widest">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-mono text-text-muted uppercase tracking-widest">Registered</th>
                </tr>
              </thead>
              <tbody>
                {approved.map((user) => (
                  <tr key={user.id} className="border-b border-border last:border-0 hover:bg-surface-2 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm text-text-primary">{user.email}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-semibold border',
                        user.role === 'admin'
                          ? 'bg-accent-blue/10 text-accent-blue border-accent-blue/20'
                          : 'bg-surface-3 text-text-secondary border-border'
                      )}>
                        {user.role === 'admin' && <Shield className="w-2.5 h-2.5" />}
                        {user.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-text-secondary">
                      {formatDate(user.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
