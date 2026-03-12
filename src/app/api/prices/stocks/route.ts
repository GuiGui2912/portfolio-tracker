// src/app/api/prices/stocks/route.ts
const cache: Record<string, { price: number; change24h: number; currency: string; ts: number }> = {};
const CACHE_TTL = 3 * 60 * 1000;

async function getStockPrice(symbol: string): Promise<{ price: number; change24h: number; currency: string } | null> {
  const urls = [
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=2d`,
    `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=2d`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Referer': 'https://finance.yahoo.com',
        },
        cache: 'no-store',
      });
      if (!res.ok) continue;

      const data = await res.json();
      const meta = data?.chart?.result?.[0]?.meta;
      if (!meta) continue;

      const price     = meta.regularMarketPrice ?? meta.previousClose;
      const prevClose = meta.chartPreviousClose ?? meta.previousClose;
      const change24h = prevClose ? ((price - prevClose) / prevClose) * 100 : 0;
      const currency  = meta.currency ?? 'USD';

      console.log(`[Stocks] ${symbol} → ${price} ${currency} (${change24h.toFixed(2)}%)`);
      return { price: Math.round(price * 100) / 100, change24h: Math.round(change24h * 100) / 100, currency };
    } catch (e: any) {
      console.warn(`[Stocks] ${symbol} erreur:`, e.message);
    }
  }
  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbols = (searchParams.get('symbols') || '').split(',').filter(Boolean);
  if (!symbols.length) return Response.json({ error: 'No symbols' }, { status: 400 });

  const now = Date.now();
  const result: Record<string, { symbol: string; price: number; change24h: number; currency: string }> = {};

  await Promise.all(symbols.map(async (symbol) => {
    const sym = symbol.trim().toUpperCase();
    if (cache[sym] && now - cache[sym].ts < CACHE_TTL) {
      result[sym] = { symbol: sym, price: cache[sym].price, change24h: cache[sym].change24h, currency: cache[sym].currency };
      return;
    }
    const data = await getStockPrice(sym);
    if (data) {
      cache[sym] = { ...data, ts: now };
      result[sym] = { symbol: sym, ...data };
    } else if (cache[sym]) {
      result[sym] = { symbol: sym, price: cache[sym].price, change24h: cache[sym].change24h, currency: cache[sym].currency };
    }
  }));

  return Response.json(result);
}
