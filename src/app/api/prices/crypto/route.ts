import { NextRequest, NextResponse } from 'next/server'
import { getCryptoPrices, getCryptoHistory, getCryptoExtra } from '@/lib/coingecko'

const CACHE_TTL_MS = 5 * 60 * 1000
const memCache = new Map<string, { data: unknown; ts: number }>()

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const symbolsParam = searchParams.get('symbols')
  const withHistory  = searchParams.get('history') === 'true'

  if (!symbolsParam) {
    return NextResponse.json({ error: 'symbols param required' }, { status: 400 })
  }

  const symbols  = symbolsParam.toUpperCase().split(',').filter(Boolean)
  const cacheKey = `crypto:${symbols.sort().join(',')}:${withHistory}`

  const cached = memCache.get(cacheKey)
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return NextResponse.json(cached.data)
  }

  try {
    const prices = await getCryptoPrices(symbols)
    const result: Record<string, unknown> = {}

    await Promise.all(symbols.map(async (symbol) => {
      const p = prices[symbol]
      if (!p) return
      const [history, extra] = await Promise.all([
        withHistory ? getCryptoHistory(symbol) : Promise.resolve({}),
        getCryptoExtra(symbol),
      ])
      result[symbol] = { symbol, price: p.price, change24h: p.change24h, history, extra }
    }))

    memCache.set(cacheKey, { data: result, ts: Date.now() })
    return NextResponse.json(result)

  } catch (err) {
    console.error('[/api/prices/crypto]', err)
    return NextResponse.json({ error: 'Failed to fetch prices' }, { status: 500 })
  }
}
