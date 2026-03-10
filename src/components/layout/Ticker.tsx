'use client'

import { cn } from '@/lib/utils'
import { formatPercent } from '@/lib/utils'

interface TickerItem {
  symbol: string
  name: string
  price: number
  changePct: number
}

const MOCK_TICKERS: TickerItem[] = [
  { symbol: 'AAPL', name: 'Apple', price: 189.30, changePct: 0.82 },
  { symbol: 'MSFT', name: 'Microsoft', price: 415.50, changePct: 1.23 },
  { symbol: 'NVDA', name: 'NVIDIA', price: 875.40, changePct: 2.14 },
  { symbol: 'GOOGL', name: 'Alphabet', price: 172.80, changePct: -0.31 },
  { symbol: 'AMZN', name: 'Amazon', price: 185.60, changePct: 0.95 },
  { symbol: 'META', name: 'Meta', price: 494.20, changePct: 1.67 },
  { symbol: 'TSLA', name: 'Tesla', price: 174.30, changePct: -2.45 },
  { symbol: 'BRK.B', name: 'Berkshire', price: 402.10, changePct: 0.18 },
  { symbol: 'JPM', name: 'JPMorgan', price: 196.80, changePct: 0.54 },
  { symbol: 'V', name: 'Visa', price: 278.90, changePct: 0.29 },
  { symbol: 'UNH', name: 'UnitedHealth', price: 492.40, changePct: -0.87 },
  { symbol: 'LLY', name: 'Eli Lilly', price: 796.50, changePct: 3.21 },
  { symbol: '^GSPC', name: 'S&P 500', price: 5308.14, changePct: 0.48 },
  { symbol: '^IXIC', name: 'NASDAQ', price: 16742.39, changePct: 0.65 },
  { symbol: '^VIX', name: 'VIX', price: 13.82, changePct: -3.14 },
]

export function Ticker() {
  // Duplicate for seamless loop
  const doubled = [...MOCK_TICKERS, ...MOCK_TICKERS]

  return (
    <div className="fixed top-16 left-0 right-0 z-40 bg-surface/90 backdrop-blur-sm border-b border-border overflow-hidden h-[40px]">
      <div className="flex items-center h-full gap-0 animate-ticker whitespace-nowrap">
        {doubled.map((item, i) => (
          <span
            key={`${item.symbol}-${i}`}
            className="inline-flex items-center gap-2 px-4 text-xs font-mono shrink-0"
          >
            <span className="text-text-secondary font-semibold">{item.symbol}</span>
            <span className="text-text-primary tabular-nums">
              {item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className={cn(
              'tabular-nums',
              item.changePct > 0 ? 'text-accent-green' : item.changePct < 0 ? 'text-accent-red' : 'text-text-secondary'
            )}>
              {formatPercent(item.changePct)}
            </span>
            <span className="text-border-bright mx-1">·</span>
          </span>
        ))}
      </div>
    </div>
  )
}
