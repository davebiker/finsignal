import Link from 'next/link'
import { SearchX, ArrowLeft, Search } from 'lucide-react'

export default function CompanyNotFound() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 text-center">
        <div className="w-20 h-20 rounded-2xl bg-surface-2 border border-border flex items-center justify-center">
          <SearchX className="w-9 h-9 text-text-muted" />
        </div>

        <div className="space-y-2">
          <h2 className="font-display text-2xl font-bold text-text-primary">
            Company Not Found
          </h2>
          <p className="text-text-secondary text-sm max-w-md">
            We couldn&apos;t find any data for this ticker symbol. It may be delisted, misspelled,
            or not yet available in our data sources.
          </p>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <p className="text-text-muted">Try searching for:</p>
          <div className="flex gap-2">
            {['AAPL', 'MSFT', 'GOOGL', 'NVDA'].map((t) => (
              <Link
                key={t}
                href={`/company/${t}`}
                className="px-2.5 py-1 rounded-lg bg-surface-2 border border-border text-xs font-mono text-accent-blue hover:border-accent-blue/40 transition-colors"
              >
                {t}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 mt-2">
          <Link href="/dashboard" className="btn-ghost text-sm">
            <ArrowLeft className="w-3.5 h-3.5" />
            Dashboard
          </Link>
          <Link href="/earnings-calendar" className="btn-ghost text-sm">
            <Search className="w-3.5 h-3.5" />
            Earnings Calendar
          </Link>
        </div>
      </div>
    </div>
  )
}
