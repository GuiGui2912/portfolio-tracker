// ============================================================
// lib/coingecko.ts — Prix cryptos via CoinGecko
// ============================================================

const BASE_URL = 'https://api.coingecko.com/api/v3'
const API_KEY  = process.env.COINGECKO_API_KEY   // optionnel en gratuit

// Mapping symbole → ID CoinGecko
const COINGECKO_IDS: Record<string, string> = {
  BTC:  'bitcoin',
  ETH:  'ethereum',
  SOL:  'solana',
  BNB:  'binancecoin',
  XRP:  'ripple',
  ADA:  'cardano',
  AVAX: 'avalanche-2',
  DOT:  'polkadot',
  MATIC:'matic-network',
  LINK: 'chainlink',
  UNI:  'uniswap',
  DOGE: 'dogecoin',
}

function getHeaders() {
  const h: HeadersInit = { 'Accept': 'application/json' }
  if (API_KEY) h['x-cg-demo-api-key'] = API_KEY
  return h
}

// Prix actuel + variation 24h pour un ou plusieurs symboles
export async function getCryptoPrices(symbols: string[]): Promise<
  Record<string, { price: number; change24h: number }>
> {
  const ids = symbols
    .map(s => COINGECKO_IDS[s.toUpperCase()])
    .filter(Boolean)
    .join(',')

  if (!ids) return {}

  const res = await fetch(
    `${BASE_URL}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
    { headers: getHeaders(), next: { revalidate: 60 } }  // cache 60s Next.js
  )

  if (!res.ok) throw new Error(`CoinGecko error: ${res.status}`)
  const data = await res.json()

  const result: Record<string, { price: number; change24h: number }> = {}
  for (const symbol of symbols) {
    const id = COINGECKO_IDS[symbol.toUpperCase()]
    if (id && data[id]) {
      result[symbol] = {
        price:     data[id].usd,
        change24h: data[id].usd_24h_change ?? 0,
      }
    }
  }
  return result
}

// Historique OHLC pour une crypto (7j, 30j, 90j, 180j, 365j, max)
export async function getCryptoHistory(
  symbol: string
): Promise<Record<string, number[]>> {
  const id = COINGECKO_IDS[symbol.toUpperCase()]
  if (!id) return {}

  const scales: Array<{ label: string; days: string }> = [
    { label: '1S',  days: '7'   },
    { label: '1M',  days: '30'  },
    { label: '3M',  days: '90'  },
    { label: '6M',  days: '180' },
    { label: '1A',  days: '365' },
    { label: 'MAX', days: 'max' },
  ]

  const results: Record<string, number[]> = {}

  // Fetch en parallèle (attention aux rate limits)
  await Promise.all(
    scales.map(async ({ label, days }) => {
      try {
        const res = await fetch(
          `${BASE_URL}/coins/${id}/market_chart?vs_currency=usd&days=${days}&interval=daily`,
          { headers: getHeaders(), next: { revalidate: 300 } } // cache 5min
        )
        if (!res.ok) return
        const data = await res.json()
        // data.prices = [[timestamp, price], ...]
        results[label] = data.prices.map(([, price]: [number, number]) =>
          Math.round(price * 100) / 100
        )
      } catch {
        results[label] = []
      }
    })
  )

  return results
}

// Tout en un : prix + historique
export async function getCryptoFullData(symbol: string) {
  const [prices, history] = await Promise.all([
    getCryptoPrices([symbol]),
    getCryptoHistory(symbol),
  ])
  return {
    symbol,
    price:     prices[symbol]?.price     ?? 0,
    change24h: prices[symbol]?.change24h ?? 0,
    history,
  }
}

// Recherche d'une crypto par nom/symbole
export async function searchCrypto(query: string) {
  const res = await fetch(
    `${BASE_URL}/search?query=${encodeURIComponent(query)}`,
    { headers: getHeaders(), next: { revalidate: 60 } }
  )
  if (!res.ok) return []
  const data = await res.json()
  return data.coins.slice(0, 10).map((c: {
    symbol: string; name: string; id: string; thumb: string
  }) => ({
    symbol: c.symbol.toUpperCase(),
    name:   c.name,
    id:     c.id,
    thumb:  c.thumb,
  }))
}
