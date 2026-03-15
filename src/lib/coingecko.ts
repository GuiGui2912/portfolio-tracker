// ============================================================
// lib/coingecko.ts — Prix cryptos via CoinGecko
// ============================================================

const BASE_URL = 'https://api.coingecko.com/api/v3'
const API_KEY  = process.env.COINGECKO_API_KEY

const COINGECKO_IDS: Record<string, string> = {
  BTC:   'bitcoin',
  ETH:   'ethereum',
  SOL:   'solana',
  BNB:   'binancecoin',
  XRP:   'ripple',
  ADA:   'cardano',
  AVAX:  'avalanche-2',
  DOT:   'polkadot',
  MATIC: 'matic-network',
  LINK:  'chainlink',
  UNI:   'uniswap',
  DOGE:  'dogecoin',
  ATOM:  'cosmos',
  LTC:   'litecoin',
  BCH:   'bitcoin-cash',
  APT:   'aptos',
  OP:    'optimism',
  ARB:   'arbitrum',
  INJ:   'injective-protocol',
  SUI:   'sui',
  PEPE:  'pepe',
  WIF:   'dogwifcoin',
  BONK:  'bonk',
  TIA:   'celestia',
  SEI:   'sei-network',
  JUP:   'jupiter-exchange-solana',
  NEAR:  'near',
  FTM:   'fantom',
  SAND:  'the-sandbox',
  MANA:  'decentraland',
  CRV:   'curve-dao-token',
  AAVE:  'aave',
  MKR:   'maker',
  SNX:   'havven',
  LDO:   'lido-dao',
  RNDR:  'render-token',
  FIL:   'filecoin',
  ICP:   'internet-computer',
  HBAR:  'hedera-hashgraph',
  VET:   'vechain',
  XLM:   'stellar',
  ALGO:  'algorand',
  SHIB:  'shiba-inu',
  FLOKI: 'floki',
  TON:   'the-open-network',
  PYTH:  'pyth-network',
}

function getHeaders() {
  const h: HeadersInit = { 'Accept': 'application/json' }
  if (API_KEY) h['x-cg-demo-api-key'] = API_KEY
  return h
}

function fmtCap(n: number | undefined): string {
  if (!n) return '—'
  if (n >= 1e12) return (n / 1e12).toFixed(2) + ' T$'
  if (n >= 1e9)  return (n / 1e9).toFixed(2)  + ' Md$'
  if (n >= 1e6)  return (n / 1e6).toFixed(2)  + ' M$'
  return n.toLocaleString()
}

function fmtVol(n: number | undefined): string {
  if (!n) return '—'
  if (n >= 1e9) return (n / 1e9).toFixed(2) + ' Md$'
  if (n >= 1e6) return (n / 1e6).toFixed(2) + ' M$'
  if (n >= 1e3) return (n / 1e3).toFixed(0) + ' K$'
  return n.toLocaleString()
}

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
    { headers: getHeaders(), next: { revalidate: 60 } }
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

// Données fondamentales enrichies pour une crypto
export async function getCryptoExtra(symbol: string): Promise<Record<string, any>> {
  const id = COINGECKO_IDS[symbol.toUpperCase()]
  if (!id) return {}

  try {
    const res = await fetch(
      `${BASE_URL}/coins/${id}?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false`,
      { headers: getHeaders(), next: { revalidate: 300 } }
    )
    if (!res.ok) return {}
    const d = await res.json()

    const md  = d.market_data ?? {}
    const ath = md.ath?.usd
    const atl = md.atl?.usd
    const athDate = md.ath_date?.usd ? new Date(md.ath_date.usd).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' }) : '—'
    const atlDate = md.atl_date?.usd ? new Date(md.atl_date.usd).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' }) : '—'
    const supply  = md.circulating_supply
    const maxSup  = md.max_supply
    const totalSup = md.total_supply

    return {
      marketCap:          fmtCap(md.market_cap?.usd),
      marketCapRank:      d.market_cap_rank ? `#${d.market_cap_rank}` : '—',
      volume24h:          fmtVol(md.total_volume?.usd),
      high24h:            md.high_24h?.usd  ? Math.round(md.high_24h.usd  * 100) / 100 : undefined,
      low24h:             md.low_24h?.usd   ? Math.round(md.low_24h.usd   * 100) / 100 : undefined,
      high52w:            md.high_24h?.usd  ? undefined : undefined, // pas dispo directement
      ath:                ath  ? Math.round(ath  * 100) / 100 : undefined,
      athDate,
      atl:                atl  ? Math.round(atl  * 100) / 100 : undefined,
      atlDate,
      circulatingSupply:  supply   ? fmtCap(supply)   : '—',
      maxSupply:          maxSup   ? fmtCap(maxSup)   : '∞',
      totalSupply:        totalSup ? fmtCap(totalSup) : '—',
      change7d:           md.price_change_percentage_7d   != null ? md.price_change_percentage_7d.toFixed(2)   + '%' : '—',
      change30d:          md.price_change_percentage_30d  != null ? md.price_change_percentage_30d.toFixed(2)  + '%' : '—',
      change1y:           md.price_change_percentage_1y   != null ? md.price_change_percentage_1y.toFixed(2)   + '%' : '—',
      description:        d.description?.en ? d.description.en.replace(/<[^>]+>/g, '').slice(0, 300) + '…' : '',
      website:            d.links?.homepage?.[0] ?? '',
      categories:         (d.categories ?? []).slice(0, 3).join(', '),
    }
  } catch (e: any) {
    console.warn(`[CoinGecko extra] ${symbol}:`, e.message)
    return {}
  }
}

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
  await Promise.all(
    scales.map(async ({ label, days }) => {
      try {
        const res = await fetch(
          `${BASE_URL}/coins/${id}/market_chart?vs_currency=usd&days=${days}&interval=daily`,
          { headers: getHeaders(), next: { revalidate: 300 } }
        )
        if (!res.ok) return
        const data = await res.json()
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
