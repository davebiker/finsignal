'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createSupabaseClient } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Calendar, Search, Signal, Menu, X, LogOut, User
} from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/earnings-calendar', label: 'Earnings', icon: Calendar },
]

export function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const supabase = createSupabaseClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/company/${searchQuery.trim().toUpperCase()}`
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // Don't show nav on login page
  if (pathname === '/login') return null

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? '??'

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-8 h-8 rounded-lg bg-accent-green/10 border border-accent-green/30 flex items-center justify-center group-hover:bg-accent-green/20 transition-colors">
            <Signal className="w-4 h-4 text-accent-green" />
          </div>
          <span className="font-display font-semibold text-base tracking-tight">
            Fin<span className="text-accent-green">Signal</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150',
                pathname.startsWith(href)
                  ? 'bg-surface-2 text-text-primary border border-border-bright'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-2'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Search */}
        <form onSubmit={handleSearch} className="hidden sm:flex items-center flex-1 max-w-xs">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Search ticker… (AAPL, MSFT)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
              className="terminal-input w-full pl-9 pr-3 h-9 text-xs"
            />
          </div>
        </form>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent-green/10 border border-accent-green/20">
            <span className="live-dot" />
            <span className="text-xs font-mono text-accent-green">LIVE</span>
          </div>

          {/* User menu */}
          {user && (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-surface-2 border border-border">
                <div className="w-6 h-6 rounded-full bg-accent-blue/20 border border-accent-blue/30 flex items-center justify-center">
                  <span className="text-[9px] font-mono font-bold text-accent-blue">{initials}</span>
                </div>
                <span className="text-xs font-mono text-text-secondary truncate max-w-[120px]">
                  {user.email}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="btn-ghost p-1.5"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            className="md:hidden btn-ghost p-1.5"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl px-4 py-3 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                pathname.startsWith(href)
                  ? 'bg-surface-2 text-text-primary'
                  : 'text-text-secondary'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
          <form onSubmit={handleSearch} className="pt-2">
            <input
              type="text"
              placeholder="Search ticker…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
              className="terminal-input w-full"
            />
          </form>
          {user && (
            <div className="pt-2 border-t border-border mt-2">
              <div className="flex items-center justify-between px-3 py-2">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-text-muted" />
                  <span className="text-xs text-text-secondary truncate">{user.email}</span>
                </div>
                <button onClick={handleSignOut} className="text-xs text-accent-red hover:underline font-mono">
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
