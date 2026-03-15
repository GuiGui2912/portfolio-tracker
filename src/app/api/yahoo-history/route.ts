// src/app/api/yahoo-history/route.ts
const cache: Record<string, { prices: number[]; ts: number }> = {};
const CACHE_TTL = 10 * 60 * 1000;

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json',
  'Referer': 'https://finance.yahoo.com',
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol   = searchParams.get('symbol') || '';
  const range    = searchParams.get('range')    || '1mo';
  const interval = searchParams.get('interval') || '1d';

  if (!symbol) return Response.json({ error: 'No symbol' }, { status: 400 });

  const key = `${symbol}:${range}:${interval}`;
  const now = Date.now();

  if (cache[key] && now - cache[key].ts < CACHE_TTL) {
    return Response.json({ prices: cache[key].prices });
  }

  for (const host of ['query1', 'query2']) {
    try {
      const url = `https://${host}.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`;
      const res = await fetch(url, { headers: HEADERS, cache: 'no-store' });
      if (!res.ok) continue;
      const data = await res.json();
      const closes = data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close;
      if (!closes?.length) continue;

      const prices = closes
        .filter((v: number | null) => v != null)
        .map((v: number) => Math.round(v * 100) / 100);

      if (prices.length < 2) continue;

      cache[key] = { prices, ts: now };
      return Response.json({ prices });
    } catch {}
  }

  return Response.json({ prices: [] });
}
