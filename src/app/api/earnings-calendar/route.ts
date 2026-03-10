import { NextRequest, NextResponse } from 'next/server'
import { getEarningsCalendar } from '@/lib/fmp'
import { format, addDays } from 'date-fns'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from') ?? format(new Date(), 'yyyy-MM-dd')
  const to = searchParams.get('to') ?? format(addDays(new Date(), 14), 'yyyy-MM-dd')

  try {
    const events = await getEarningsCalendar(from, to)
    return NextResponse.json({ events, from, to })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
