import { NextResponse } from 'next/server'
import { fetchMarketIndices } from '@/lib/yahoo'

export async function GET() {
  try {
    const indices = await fetchMarketIndices()
    return NextResponse.json({ indices })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
