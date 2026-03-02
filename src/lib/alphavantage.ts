// ============================================================
// lib/alphavantage.ts — Prix actions & ETF via Alpha Vantage
// ============================================================

const BASE_URL = 'https://www.alphavantage.co/query'
const API_KEY  = process.env.ALPHA_VANTAGE_API_KEY!

// Délai entre requêtes (évite le rate limit 25req/jour gratuit)
async function delay(ms: number) {
  return new Promise(res => setTimeout(res, ms))
}

// Prix actuel d'une action/ETF
export async function getStockPrice(symbol: string): Promise<{
  price:     number
  change24h: number
  changeAmt: number
} | null> {
  const url = `${BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`

  try {
    const res  = await fetch(url, { next: { revalidate: 300 } }) // cache 5min
    if (!res.ok) return null
    const data = await res.json()
    const q    = data['Global Quote']
    if (!q || !q['05. price']) return null

    return {
      price:     parseFloat(q['05. price']),
      change24h: parseFloat(q['10. change percent'].replace('%', '')),
      changeAmt: parseFloat(q['09. change']),
    }
  } catch {
    return null
  }
}

// Historique journalier (jusqu'à 20 ans)
export async function getStockHistory(
  symbol: string,
  outputsize: 'compact' | 'full' = 'full'
): Promise<Record<string, number[]>> {
  const url = `${BASE_URL}?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=${outputsize}&apikey=${API_KEY}`

  try {
    const res  = await fetch(url, { next: { revalidate: 3600 } }) // cache 1h
    if (!res.ok) return {}
    const data = await res.json()
    const ts   = data['Time Series (Daily)']
    if (!ts) return {}

    // Trier par date ASC
    const dates  = Object.keys(ts).sort()
    const closes = dates.map(d => parseFloat(ts[d]['4. close']))

    const now = Date.now()
    const DAY = 86400000

    return {
      '1S':  closes.slice(-7),
      '1M':  closes.slice(-30),
      '3M':  closes.slice(-90),
      '6M':  closes.slice(-180),
      '1A':  closes.slice(-365),
      'MAX': closes,
    }
  } catch {
    return {}
  }
}

// Recherche d'un symbole action/ETF
export async function searchStock(query: string) {
  const url = `${BASE_URL}?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(query)}&apikey=${API_KEY}`

  try {
    const res  = await fetch(url, { next: { revalidate: 60 } })
    if (!res.ok) return []
    const data = await res.json()
    return (data.bestMatches || []).slice(0, 8).map((m: Record<string, string>) => ({
      symbol:   m['1. symbol'],
      name:     m['2. name'],
      type:     m['3. type'],
      region:   m['4. region'],
      currency: m['8. currency'],
    }))
  } catch {
    return []
  }
}

// Prix en batch pour plusieurs symboles (avec délai pour respecter le rate limit)
export async function getMultipleStockPrices(
  symbols: string[]
): Promise<Record<string, { price: number; change24h: number }>> {
  const results: Record<string, { price: number; change24h: number }> = {}

  for (const symbol of symbols) {
    const data = await getStockPrice(symbol)
    if (data) {
      results[symbol] = { price: data.price, change24h: data.change24h }
    }
    // Pause 200ms entre chaque appel (free tier = max 5 req/min)
    await delay(200)
  }

  return results
}
