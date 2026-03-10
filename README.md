# FinSignal — Financial Intelligence Terminal

> AI-powered earnings analysis, market dashboards, and investment research.

![FinSignal Dashboard](https://via.placeholder.com/1200x600/0d1117/00d4aa?text=FinSignal+Dashboard)

## Features

- 📊 **Market Overview** — Live indices: S&P 500, NASDAQ, DAX, DOW, VIX
- 🎯 **Company Analysis** — Earnings history, financial metrics, 52-week range
- 🤖 **AI Analysis** — Claude-powered bull/base/bear scenarios with catalysts & risks
- 📅 **Earnings Calendar** — Upcoming reports with consensus estimates
- 📈 **Interactive Charts** — Revenue & EPS beat/miss visualization

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/davebiker/finsignal
cd finsignal
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env.local
# Fill in your API keys (see below)
```

### 3. Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Run the migration in `supabase/migrations/001_initial_schema.sql` in your SQL editor
3. Copy your project URL and keys to `.env.local`

### 4. Get API Keys

| Service | URL | Free Tier |
|---------|-----|-----------|
| **Supabase** | [supabase.com/dashboard](https://supabase.com/dashboard) | Free forever |
| **Anthropic** | [console.anthropic.com](https://console.anthropic.com/settings/keys) | Pay-per-use |
| **Alpha Vantage** | [alphavantage.co](https://www.alphavantage.co/support/#api-key) | 25 req/day |
| **FMP** | [financialmodelingprep.com](https://financialmodelingprep.com/developer/docs) | 250 req/day |

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Usage

### Company Analysis
1. Search for any ticker in the nav bar (e.g. `AAPL`, `MSFT`, `NVDA`)
2. Click **Sync Data** to pull latest earnings from FMP + price from Yahoo
3. Click **Generate Analysis** for a Claude AI-powered investment thesis

### Earnings Calendar
- Navigate to `/earnings-calendar` for upcoming reports
- Click any company to view their full analysis page

## Deployment

```bash
# Deploy to Vercel
vercel deploy

# Set environment variables in Vercel dashboard
# or via CLI:
vercel env add ANTHROPIC_API_KEY
```

## Architecture

See [CLAUDE.md](./CLAUDE.md) for full architecture documentation.

## Tech Stack

- **Next.js 14** (App Router + Server Components)
- **Supabase** (PostgreSQL + RLS + Auth)
- **Tailwind CSS** (dark financial theme)
- **Recharts** (earnings visualization)
- **Anthropic Claude** (AI analysis)
- **Yahoo Finance** + **Alpha Vantage** + **FMP** (market data)

## License

MIT
