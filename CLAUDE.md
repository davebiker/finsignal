# FinSignal — Architecture & Key Decisions

## Overview
FinSignal is a financial intelligence terminal built on Next.js 14 (App Router), 
Supabase, and Anthropic Claude. It provides real-time market data, earnings analysis, 
and AI-powered investment research.

---

## Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | Next.js 14 App Router | Server components for data fetching, ISR caching |
| Database | Supabase (PostgreSQL) | RLS, real-time, Auth out of the box |
| Styling | Tailwind CSS | Rapid iteration, consistent design tokens |
| Charts | Recharts | Lightweight, composable, SSR-compatible |
| AI | Anthropic Claude (claude-sonnet-4-20250514) | Best-in-class financial reasoning |
| Market Data | Yahoo Finance (yfinance2) | Free, reliable quotes |
| Earnings | Alpha Vantage + FMP | Complementary datasets |
| Hosting | Vercel | Zero-config Next.js deployment |

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout (nav, ticker tape, fonts)
│   ├── globals.css             # Tailwind base + custom utilities
│   ├── page.tsx                # Redirect → /dashboard
│   ├── dashboard/
│   │   ├── page.tsx            # Server component — fetches market data
│   │   ├── MarketOverview.tsx  # Client: market index cards
│   │   ├── WatchlistSection.tsx # Client: watchlist table
│   │   ├── EarningsThisWeek.tsx # Server: upcoming earnings
│   │   └── RecentAnalyses.tsx  # Server: latest AI analyses
│   ├── company/[ticker]/
│   │   ├── page.tsx            # Server component — parallel data fetch
│   │   ├── CompanyHeader.tsx   # Price, 52W range, breadcrumb
│   │   ├── MetricsPanel.tsx    # Key financial metrics
│   │   ├── EarningsTable.tsx   # Client: table + chart toggle
│   │   ├── AiAnalysisPanel.tsx # Client: AI analysis generation
│   │   ├── AnalystPanel.tsx    # Analyst ratings + PT
│   │   └── SyncButton.tsx      # Client: trigger data sync
│   ├── earnings-calendar/
│   │   └── page.tsx            # Server: upcoming earnings calendar
│   └── api/
│       ├── analyze/route.ts    # POST: Claude AI analysis
│       ├── sync/[ticker]/route.ts # POST: Sync FMP + Yahoo data
│       ├── market/route.ts     # GET: Market indices
│       └── earnings-calendar/route.ts # GET: Calendar events
├── components/
│   ├── layout/
│   │   ├── Navigation.tsx      # Responsive nav + search
│   │   └── Ticker.tsx          # Animated price ticker tape
│   ├── ui/index.tsx            # Shared UI components
│   └── charts/
│       └── EarningsChart.tsx   # Recharts earnings visualization
├── lib/
│   ├── alphavantage.ts         # Alpha Vantage API client
│   ├── fmp.ts                  # Financial Modeling Prep client
│   ├── yahoo.ts                # Yahoo Finance server-side wrapper
│   ├── supabase.ts             # Supabase client factory
│   └── utils.ts                # Formatting, colors, helpers
└── types/
    └── index.ts                # TypeScript interfaces
```

---

## Data Flow

### Company Page Load
1. Server component fetches in parallel:
   - Yahoo Finance quote (price, change, 52W range)
   - FMP profile (company info, sector)
   - Alpha Vantage overview (P/E, EV/EBITDA, description)
   - Supabase earnings_snapshots (historical)
   - Supabase ai_analyses (existing analysis)
   - FMP analyst recommendations

2. ISR cache: 5 minutes (`revalidate = 300`)

### Sync Data Flow
```
SyncButton → POST /api/sync/[ticker]
  → fetchYahooQuote() → price_snapshots
  → getEarningsResults() → earnings_snapshots (upsert)
```

### AI Analysis Flow
```
AiAnalysisPanel → POST /api/analyze
  → getEarningsResults()     (FMP — last 8 quarters)
  → getAnalystEstimates()    (FMP — forward estimates)
  → getCompanyProfile()      (FMP — sector, mkt cap)
  → getCompanyOverview()     (Alpha Vantage — ratios)
  → getConsensusPriceTarget() (FMP — avg PT)
  → Anthropic Claude API     (structured JSON analysis)
  → ai_analyses upsert       (Supabase — persist)
  → Return to client
```

---

## Database Schema

### RLS Policy Summary
- `watchlist`: User sees only their own rows (`user_id = auth.uid()`)
- `earnings_snapshots`: All authenticated users (shared dataset)
- `ai_analyses`: All authenticated users (shared dataset)
- `price_snapshots`: All authenticated users (shared dataset)

### Key Indexes
- `earnings_snapshots(ticker, fiscal_year DESC, quarter DESC)`
- `ai_analyses(ticker, fiscal_year DESC)`
- `price_snapshots(ticker, recorded_at DESC)`

---

## Design System

### Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `accent-green` | `#00d4aa` | Positive, beats, buy |
| `accent-red` | `#ff4d6d` | Negative, misses, sell |
| `accent-gold` | `#f5a623` | Neutral, inline, hold |
| `accent-blue` | `#58a6ff` | Ticker symbols, links |
| `background` | `#0a0a0f` | Page background |
| `surface` | `#0d1117` | Card background |

### Fonts
- Display: Space Grotesk (headings)
- Body: DM Sans (paragraphs)
- Mono: JetBrains Mono (numbers, tickers, labels)

---

## API Rate Limits

| Service | Free Tier | Notes |
|---------|-----------|-------|
| Alpha Vantage | 25 req/day | Cache aggressively; use ISR |
| FMP | 250 req/day | Most endpoints |
| Yahoo Finance | Unofficial | No hard limit; be respectful |
| Anthropic | Pay-per-use | claude-sonnet-4-20250514 |

### Caching Strategy
- Dashboard: `revalidate = 60` (1 minute)
- Company page: `revalidate = 300` (5 minutes)
- Earnings calendar: `revalidate = 1800` (30 minutes)
- API routes use Next.js `next: { revalidate }` on fetch calls

---

## Deployment (Vercel)

1. Connect GitHub repo `davebiker/finsignal`
2. Set environment variables in Vercel dashboard
3. Deploy — Vercel auto-detects Next.js
4. Set custom domain if needed

### Required Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
ALPHA_VANTAGE_API_KEY
FMP_API_KEY
```

---

## Key Decisions

### Why App Router over Pages Router?
Server components allow data fetching at the page level without client-side
waterfalls. Parallel `Promise.allSettled` in company page reduces load time.

### Why Supabase over direct Postgres?
RLS provides row-level security without extra middleware. Supabase Auth handles
user sessions. The Supabase client works well in both server and client contexts.

### Why `Promise.allSettled` everywhere?
Financial APIs are unreliable (rate limits, timeouts). `allSettled` means partial
data renders gracefully rather than the whole page failing.

### Why mock data for watchlist prices?
Yahoo Finance is unofficial and could break. Mock prices demonstrate the UI
while real sync happens via the SyncButton → `/api/sync/[ticker]` flow.

### Quarterly period detection
FMP dates are fiscal dates, not calendar dates. We approximate Q1–Q4 by month
ranges (Jan–Mar = Q1, etc). This works for US companies; may differ for
international fiscal years.

---

## Future Roadmap
- [ ] Supabase Auth (email/password login)
- [ ] Real-time price updates via WebSocket
- [ ] Earnings call transcript analysis
- [ ] Portfolio P&L tracking
- [ ] Email alerts for earnings beats/misses
- [ ] Mobile app (React Native / Expo)
- [ ] Multi-currency support
