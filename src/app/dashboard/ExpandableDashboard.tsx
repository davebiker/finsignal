'use client'

import { useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { WatchlistWithSummary } from './WatchlistWithSummary'
import { Maximize2, Minimize2, TrendingUp } from 'lucide-react'

interface Props {
  earningsSection: ReactNode
  analysesSection: ReactNode
}

export function ExpandableDashboard({ earningsSection, analysesSection }: Props) {
  const [expanded, setExpanded] = useState(false)

  return (
    <>
      {/* Watchlist section */}
      <div className={cn(expanded && 'col-span-full')}>
        <div className={cn(
          expanded
            ? 'space-y-6'
            : 'grid grid-cols-1 lg:grid-cols-3 gap-6'
        )}>
          <div className={cn(!expanded && 'lg:col-span-2', 'space-y-6')}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-text-secondary" />
                <h2 className="font-display font-semibold text-sm text-text-secondary uppercase tracking-widest">
                  Watchlist
                </h2>
              </div>
              <button
                onClick={() => setExpanded(!expanded)}
                className="btn-ghost text-xs gap-1.5"
                title={expanded ? 'Collapse watchlist' : 'Expand watchlist to full page'}
              >
                {expanded ? (
                  <>
                    <Minimize2 className="w-3.5 h-3.5" />
                    Collapse
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5" />
                    Expand
                  </>
                )}
              </button>
            </div>
            <WatchlistWithSummary />
          </div>

          {/* Earnings sidebar — hidden when expanded */}
          {!expanded && (
            <div className="space-y-6">
              {earningsSection}
            </div>
          )}
        </div>
      </div>

      {/* Sections below watchlist — hidden when expanded */}
      {!expanded && (
        <>
          <div className="glow-line" />
          {analysesSection}
        </>
      )}

      {/* When expanded, show earnings + analyses collapsed at the bottom */}
      {expanded && (
        <>
          <div className="glow-line" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              {earningsSection}
            </div>
            <div>
              {analysesSection}
            </div>
          </div>
        </>
      )}
    </>
  )
}
