// src/app/api/prices/stocks/route.ts
// Prix actions en temps réel via Yahoo Finance (gratuit, pas de clé API)

const cache: Record<string, { price: number; change24h: number; ts: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getStockPrice(symbol: string): Promise<{ price: number; change24h: number } | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=2d`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
      next: { revalidate: 300 },
    });

    if (!res.ok) return null;
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) return null;

    const price      = meta.regularMarketPrice ?? meta.previousClose;
    const prevClose  = meta.chartPreviousClose  ?? meta.previousClose;
    const change24h  = prevClose ? ((price - prevClose) / prevClose) * 100 : 0;

    return { price: Math.round(price * 100) / 100, change24h: Math.round(change24h * 100) / 100 };
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbols = (searchParams.get('symbols') || '').split(',').filter(Boolean);

  if (!symbols.length) {
    return Response.json({ error: 'No symbols provided' }, { status: 400 });
  }

  const now = Date.now();
  const result: Record<string, { symbol: string; price: number; change24h: number }> = {};

  await Promise.all(
    symbols.map(async (symbol) => {
      const sym = symbol.trim().toUpperCase();

      // Check cache
      if (cache[sym] && now - cache[sym].ts < CACHE_TTL) {
        result[sym] = { symbol: sym, price: cache[sym].price, change24h: cache[sym].change24h };
        return;
      }

      const data = await getStockPrice(sym);
      if (data) {
        cache[sym] = { ...data, ts: now };
        result[sym] = { symbol: sym, ...data };
      }
    })
  );

  return Response.json(result);
}
