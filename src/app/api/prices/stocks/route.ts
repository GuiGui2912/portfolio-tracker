// src/app/api/prices/stocks/route.ts
const cache: Record<string, { price: number; change24h: number; currency: string; ts: number; extra?: any }> = {};
const fxCache: { rate: number; ts: number } = { rate: 1.12, ts: 0 };
const CACHE_TTL = 3 * 60 * 1000;
const FX_TTL    = 60 * 60 * 1000;

async function getEurUsdRate(): Promise<number> {
  if (Date.now() - fxCache.ts < FX_TTL) return fxCache.rate;
  try {
    const res = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/EURUSD=X?interval=1d&range=1d',
      { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }, cache: 'no-store' }
    );
    if (res.ok) {
      const data = await res.json();
      const rate = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
      if (rate) { fxCache.rate = rate; fxCache.ts = Date.now(); return rate; }
    }
  } catch {}
  return fxCache.rate;
}

function fmtCap(n: number | undefined): string {
  if (!n) return '—';
  if (n >= 1e12) return (n / 1e12).toFixed(2) + ' T$';
  if (n >= 1e9)  return (n / 1e9).toFixed(2)  + ' Md$';
  if (n >= 1e6)  return (n / 1e6).toFixed(2)  + ' M$';
  return n.toLocaleString();
}

async function getStockPrice(symbol: string): Promise<{
  price: number; change24h: number; currency: string;
  extra: {
    marketCap?: string; pe?: string; eps?: string;
    high52w?: number; low52w?: number; volume?: string; avgVolume?: string;
    dividendRate?: string; dividendYield?: string; exDividendDate?: string;
    nextEarningsDate?: string; fiftyDayAvg?: string; twoHundredDayAvg?: string;
  }
} | null> {
  const urls = [
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=2d`,
    `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=2d`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
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

      // Données enrichies depuis meta Yahoo
      const extra = {
        marketCap:        fmtCap(meta.marketCap),
        pe:               meta.trailingPE        ? meta.trailingPE.toFixed(2)        : '—',
        eps:              meta.epsTrailingTwelveMonths ? meta.epsTrailingTwelveMonths.toFixed(2) : '—',
        high52w:          meta.fiftyTwoWeekHigh  ? Math.round(meta.fiftyTwoWeekHigh * 100) / 100  : undefined,
        low52w:           meta.fiftyTwoWeekLow   ? Math.round(meta.fiftyTwoWeekLow  * 100) / 100  : undefined,
        volume:           meta.regularMarketVolume
                            ? (meta.regularMarketVolume >= 1e6
                                ? (meta.regularMarketVolume / 1e6).toFixed(2) + ' M'
                                : meta.regularMarketVolume.toLocaleString())
                            : '—',
        avgVolume:        meta.averageDailyVolume10Day
                            ? (meta.averageDailyVolume10Day >= 1e6
                                ? (meta.averageDailyVolume10Day / 1e6).toFixed(2) + ' M'
                                : meta.averageDailyVolume10Day.toLocaleString())
                            : '—',
        dividendRate:     meta.dividendRate      ? meta.dividendRate.toFixed(2) + ' ' + currency : '—',
        dividendYield:    meta.dividendYield     ? (meta.dividendYield * 100).toFixed(2) + '%'   : '—',
        exDividendDate:   meta.exDividendDate
                            ? new Date(meta.exDividendDate * 1000).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' })
                            : '—',
        fiftyDayAvg:      meta.fiftyDayAverage   ? meta.fiftyDayAverage.toFixed(2)   : '—',
        twoHundredDayAvg: meta.twoHundredDayAverage ? meta.twoHundredDayAverage.toFixed(2) : '—',
      };

      console.log(`[Stocks] ${symbol} → ${price} ${currency} (${change24h.toFixed(2)}%)`);
      return { price: Math.round(price * 100) / 100, change24h: Math.round(change24h * 100) / 100, currency, extra };
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

  const eurUsd = await getEurUsdRate();
  const now = Date.now();
  const result: Record<string, any> = {};

  await Promise.all(symbols.map(async (symbol) => {
    const sym = symbol.trim().toUpperCase();
    if (cache[sym] && now - cache[sym].ts < CACHE_TTL) {
      result[sym] = { symbol: sym, price: cache[sym].price, change24h: cache[sym].change24h, currency: cache[sym].currency, eurUsd, extra: cache[sym].extra };
      return;
    }
    const data = await getStockPrice(sym);
    if (data) {
      cache[sym] = { ...data, ts: now };
      result[sym] = { symbol: sym, ...data, eurUsd };
    } else if (cache[sym]) {
      result[sym] = { symbol: sym, price: cache[sym].price, change24h: cache[sym].change24h, currency: cache[sym].currency, eurUsd, extra: cache[sym].extra };
    }
  }));

  return Response.json(result);
}
