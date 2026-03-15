// src/app/api/yahoo-history/route.ts
const cache: Record<string, { prices: number[]; currency: string; ts: number }> = {};
const CACHE_TTL = 10 * 60 * 1000;
const fxCache: { eurUsd: number; ts: number } = { eurUsd: 1.1469, ts: 0 };

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json',
  'Referer': 'https://finance.yahoo.com',
};

async function getEurUsd(): Promise<number> {
  if (Date.now() - fxCache.ts < 3600000) return fxCache.eurUsd;
  try {
    const res = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/EURUSD=X?interval=1d&range=1d', { headers: HEADERS, cache: 'no-store' });
    if (res.ok) {
      const d = await res.json();
      const rate = d?.chart?.result?.[0]?.meta?.regularMarketPrice;
      if (rate) { fxCache.eurUsd = rate; fxCache.ts = Date.now(); return rate; }
    }
  } catch {}
  return fxCache.eurUsd;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol   = searchParams.get('symbol') || '';
  const range    = searchParams.get('range')    || '1mo';
  const interval = searchParams.get('interval') || '1d';

  if (!symbol) return Response.json({ error: 'No symbol' }, { status: 400 });

  const key = `${symbol}:${range}:${interval}`;
  const now = Date.now();

  if (cache[key] && now - cache[key].ts < CACHE_TTL) {
    return Response.json({ prices: cache[key].prices, currency: cache[key].currency });
  }

  const eurUsd = await getEurUsd();

  for (const host of ['query1', 'query2']) {
    try {
      const url = `https://${host}.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`;
      const res = await fetch(url, { headers: HEADERS, cache: 'no-store' });
      if (!res.ok) continue;
      const data = await res.json();
      const result = data?.chart?.result?.[0];
      const closes = result?.indicators?.quote?.[0]?.close;
      const currency = result?.meta?.currency ?? 'USD';
      if (!closes?.length) continue;

      // Convertir en USD si nécessaire (même logique que fetchPrices)
      const prices = closes
        .filter((v: number | null) => v != null)
        .map((v: number) => {
          let usd = v;
          if (currency === 'EUR') usd = v * eurUsd;
          else if (currency === 'GBp') usd = v / 100 * 1.27;
          else if (currency === 'GBP') usd = v * 1.27;
          return Math.round(usd * 100) / 100;
        });

      if (prices.length < 2) continue;

      cache[key] = { prices, currency: 'USD', ts: now };
      return Response.json({ prices, currency: 'USD' });
    } catch {}
  }

  return Response.json({ prices: [] });
}
