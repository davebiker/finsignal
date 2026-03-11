// ── CNN Fear & Greed Index ───────────────────────────────────

export interface FearGreedData {
  score: number         // 0-100
  rating: string        // e.g. "Fear", "Greed", "Extreme Fear", etc.
  previousClose: number // previous session score
  oneWeekAgo: number
  oneMonthAgo: number
  oneYearAgo: number
}

export type FearGreedLevel = 'extreme-fear' | 'fear' | 'neutral' | 'greed' | 'extreme-greed'

export function getFearGreedLevel(score: number): FearGreedLevel {
  if (score <= 25) return 'extreme-fear'
  if (score <= 45) return 'fear'
  if (score <= 55) return 'neutral'
  if (score <= 75) return 'greed'
  return 'extreme-greed'
}

export function getFearGreedLabel(level: FearGreedLevel): string {
  switch (level) {
    case 'extreme-fear': return 'Extreme Fear'
    case 'fear': return 'Fear'
    case 'neutral': return 'Neutral'
    case 'greed': return 'Greed'
    case 'extreme-greed': return 'Extreme Greed'
  }
}

export function getFearGreedColor(level: FearGreedLevel): string {
  switch (level) {
    case 'extreme-fear': return 'text-accent-red'
    case 'fear': return 'text-orange-400'
    case 'neutral': return 'text-accent-gold'
    case 'greed': return 'text-accent-green'
    case 'extreme-greed': return 'text-emerald-400'
  }
}

export function getFearGreedBg(level: FearGreedLevel): string {
  switch (level) {
    case 'extreme-fear': return 'bg-accent-red/10 border-accent-red/20'
    case 'fear': return 'bg-orange-400/10 border-orange-400/20'
    case 'neutral': return 'bg-accent-gold/10 border-accent-gold/20'
    case 'greed': return 'bg-accent-green/10 border-accent-green/20'
    case 'extreme-greed': return 'bg-emerald-400/10 border-emerald-400/20'
  }
}

export async function fetchFearGreedIndex(): Promise<FearGreedData | null> {
  try {
    const res = await fetch('https://production.dataviz.cnn.io/index/fearandgreed/graphdata', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
      next: { revalidate: 300 },
    })

    if (!res.ok) {
      console.error(`CNN Fear & Greed API failed: ${res.status}`)
      return null
    }

    const data = await res.json()

    // The API response has: fear_and_greed.score, fear_and_greed.rating,
    // fear_and_greed.previous_close, fear_and_greed.previous_1_week, etc.
    const fg = data?.fear_and_greed
    if (!fg || typeof fg.score !== 'number') return null

    return {
      score: Math.round(fg.score),
      rating: fg.rating ?? getFearGreedLabel(getFearGreedLevel(fg.score)),
      previousClose: fg.previous_close ?? fg.score,
      oneWeekAgo: fg.previous_1_week ?? fg.score,
      oneMonthAgo: fg.previous_1_month ?? fg.score,
      oneYearAgo: fg.previous_1_year ?? fg.score,
    }
  } catch (err) {
    console.error('CNN Fear & Greed fetch error:', err)
    return null
  }
}
