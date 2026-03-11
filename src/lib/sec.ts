// ── SEC EDGAR — Insider Transactions ────────────────────────

const SEC_UA = 'FinSignal research@finsignal.com'

export interface InsiderTransaction {
  insiderName: string
  role: string           // CEO, CFO, Director, 10% Owner, Officer, etc.
  transactionType: 'Buy' | 'Sell' | 'Other'
  shares: number
  pricePerShare: number | null
  date: string           // YYYY-MM-DD
  filingDate: string     // YYYY-MM-DD
}

// ── CIK lookup via company_tickers.json ─────────────────────

let tickerMapCache: { map: Record<string, string>; ts: number } | null = null
const TICKER_MAP_TTL = 60 * 60 * 1000 // 1 hour

async function getTickerToCikMap(): Promise<Record<string, string>> {
  if (tickerMapCache && Date.now() - tickerMapCache.ts < TICKER_MAP_TTL) {
    return tickerMapCache.map
  }

  const res = await fetch('https://www.sec.gov/files/company_tickers.json', {
    headers: { 'User-Agent': SEC_UA },
    next: { revalidate: 3600 },
  })

  if (!res.ok) throw new Error(`SEC company_tickers.json failed: ${res.status}`)

  const data: Record<string, { cik_str: number; ticker: string; title: string }> = await res.json()
  const map: Record<string, string> = {}

  for (const entry of Object.values(data)) {
    map[entry.ticker.toUpperCase()] = String(entry.cik_str).padStart(10, '0')
  }

  tickerMapCache = { map, ts: Date.now() }
  return map
}

export async function getCikForTicker(ticker: string): Promise<string | null> {
  const map = await getTickerToCikMap()
  return map[ticker.toUpperCase()] ?? null
}

// ── Fetch Form 4 filings from submissions ───────────────────

interface SubmissionsResponse {
  cik: string
  name: string
  filings: {
    recent: {
      accessionNumber: string[]
      filingDate: string[]
      reportDate: string[]
      form: string[]
      primaryDocument: string[]
    }
  }
}

async function getRecentForm4Filings(cik: string): Promise<Array<{
  accessionNumber: string
  filingDate: string
  reportDate: string
  primaryDocument: string
}>> {
  const url = `https://data.sec.gov/submissions/CIK${cik}.json`
  const res = await fetch(url, {
    headers: { 'User-Agent': SEC_UA },
    next: { revalidate: 1800 },
  })

  if (!res.ok) throw new Error(`SEC submissions failed: ${res.status}`)

  const data: SubmissionsResponse = await res.json()
  const recent = data.filings.recent
  const filings: Array<{
    accessionNumber: string
    filingDate: string
    reportDate: string
    primaryDocument: string
  }> = []

  for (let i = 0; i < recent.form.length && filings.length < 15; i++) {
    if (recent.form[i] === '4') {
      filings.push({
        accessionNumber: recent.accessionNumber[i],
        filingDate: recent.filingDate[i],
        reportDate: recent.reportDate[i] || recent.filingDate[i],
        primaryDocument: recent.primaryDocument[i],
      })
    }
  }

  return filings
}

// ── Parse Form 4 XML ────────────────────────────────────────

function extractXmlTag(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'i')
  const match = xml.match(regex)
  return match?.[1]?.trim() ?? ''
}

function extractXmlValue(xml: string, tag: string): string {
  const block = extractXmlTag(xml, tag)
  return extractXmlTag(block, 'value') || block
}

function parseRole(xml: string): string {
  const relBlock = extractXmlTag(xml, 'reportingOwnerRelationship')
  if (!relBlock) return 'Insider'

  const isDirector = extractXmlTag(relBlock, 'isDirector') === '1' || extractXmlTag(relBlock, 'isDirector').toLowerCase() === 'true'
  const isOfficer = extractXmlTag(relBlock, 'isOfficer') === '1' || extractXmlTag(relBlock, 'isOfficer').toLowerCase() === 'true'
  const isTenPct = extractXmlTag(relBlock, 'isTenPercentOwner') === '1' || extractXmlTag(relBlock, 'isTenPercentOwner').toLowerCase() === 'true'
  const title = extractXmlTag(relBlock, 'officerTitle')

  if (isOfficer && title) return title
  if (isDirector) return 'Director'
  if (isTenPct) return '10% Owner'
  if (isOfficer) return 'Officer'
  return 'Insider'
}

function parseTransactionCode(code: string): 'Buy' | 'Sell' | 'Other' {
  if (code === 'P') return 'Buy'
  if (code === 'S') return 'Sell'
  return 'Other'
}

function parseForm4Xml(xml: string, filingDate: string): InsiderTransaction[] {
  const transactions: InsiderTransaction[] = []

  // Get insider name
  const ownerBlock = extractXmlTag(xml, 'reportingOwner')
  const nameRaw = extractXmlTag(extractXmlTag(ownerBlock, 'reportingOwnerId'), 'rptOwnerName')
  const insiderName = nameRaw
    ? nameRaw.split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
    : 'Unknown'

  const role = parseRole(ownerBlock)

  // Parse non-derivative transactions
  const ndTable = extractXmlTag(xml, 'nonDerivativeTable')
  if (ndTable) {
    // Match each transaction block
    const txnRegex = /<nonDerivativeTransaction>([\s\S]*?)<\/nonDerivativeTransaction>/gi
    let match
    while ((match = txnRegex.exec(ndTable)) !== null) {
      const txn = match[1]
      const codingBlock = extractXmlTag(txn, 'transactionCoding')
      const code = extractXmlTag(codingBlock, 'transactionCode')
      const txType = parseTransactionCode(code)

      // We primarily care about buys and sells
      if (txType === 'Other') continue

      const amountsBlock = extractXmlTag(txn, 'transactionAmounts')
      const sharesStr = extractXmlValue(amountsBlock, 'transactionShares')
      const priceStr = extractXmlValue(amountsBlock, 'transactionPricePerShare')
      const dateStr = extractXmlValue(txn, 'transactionDate')

      const shares = parseFloat(sharesStr)
      const price = parseFloat(priceStr)

      if (isNaN(shares) || shares === 0) continue

      transactions.push({
        insiderName,
        role,
        transactionType: txType,
        shares: Math.abs(shares),
        pricePerShare: isNaN(price) ? null : price,
        date: dateStr || filingDate,
        filingDate,
      })
    }
  }

  return transactions
}

// ── Public API ──────────────────────────────────────────────

export async function getInsiderTransactions(
  ticker: string,
  limit = 10
): Promise<InsiderTransaction[]> {
  const cik = await getCikForTicker(ticker)
  if (!cik) return []

  const filings = await getRecentForm4Filings(cik)
  if (filings.length === 0) return []

  const cikNum = parseInt(cik, 10).toString() // Remove leading zeros

  // Fetch and parse Form 4 XMLs (limit concurrency to avoid SEC rate limits)
  const allTransactions: InsiderTransaction[] = []

  // Process in batches of 5
  for (let i = 0; i < filings.length && allTransactions.length < limit; i += 5) {
    const batch = filings.slice(i, i + 5)
    const results = await Promise.allSettled(
      batch.map(async (filing) => {
        const accessionNoDashes = filing.accessionNumber.replace(/-/g, '')
        // primaryDocument may have XSL prefix like "xslF345X05/filename.xml"
        const xmlFile = filing.primaryDocument.includes('/')
          ? filing.primaryDocument.split('/').pop()!
          : filing.primaryDocument
        const url = `https://www.sec.gov/Archives/edgar/data/${cikNum}/${accessionNoDashes}/${xmlFile}`

        const res = await fetch(url, {
          headers: { 'User-Agent': SEC_UA },
          next: { revalidate: 1800 },
        })
        if (!res.ok) return []

        const xml = await res.text()
        return parseForm4Xml(xml, filing.filingDate)
      })
    )

    for (const result of results) {
      if (result.status === 'fulfilled') {
        allTransactions.push(...result.value)
      }
    }
  }

  // Sort by date descending, take the requested limit
  allTransactions.sort((a, b) => b.date.localeCompare(a.date))
  return allTransactions.slice(0, limit)
}
