'use client'

import { useState } from 'react'
import { WatchlistSection, type WatchlistSignalSummary } from './WatchlistSection'
import { PortfolioSummary } from './PortfolioSummary'

export function WatchlistWithSummary() {
  const [summary, setSummary] = useState<WatchlistSignalSummary | null>(null)

  return (
    <>
      <WatchlistSection onSignalSummary={setSummary} />
      <PortfolioSummary summary={summary} />
    </>
  )
}
