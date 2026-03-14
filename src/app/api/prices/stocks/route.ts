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

function fmtVol(n: number | undefined): string {
  if (!n) return '—';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + ' M';
  if (n >= 1e3) return (n / 1e3).toFixed(0) + ' K';
  return n.toLocaleString();
}

function fmtDate(ts: number | undefined): string {
  if (!ts) return '—';
  return new Date(ts * 1000).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'application/json',
  'Referer': 'https://finance.yahoo.com',
};

async function getStockPrice(symbol: string): Promise<{
  price: number; change24h: number; currency: string; extra: Record<string, any>;
} | null> {

  // 1. Prix via chart
  let price = 0, change24h = 0, currency = 'USD';
  for (const host of ['query1', 'query2']) {
    try {
      const res = await fetch(
        `https://${host}.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=2d`,
        { headers: HEADERS, cache: 'no-store' }
      );
      if (!res.ok) continue;
      const data = await res.json();
      const meta = data?.chart?.result?.[0]?.meta;
      if (!meta) continue;
      price      = meta.regularMarketPrice ?? meta.previousClose ?? 0;
      const prev = meta.chartPreviousClose ?? meta.previousClose ?? price;
      change24h  = prev ? ((price - prev) / prev) * 100 : 0;
      currency   = meta.currency ?? 'USD';
      break;
    } catch {}
  }
  if (!price) return null;

  // 2. Données fondamentales via quoteSummary
  let extra: Record<string, any> = {};
  try {
    const modules = 'price,summaryDetail,defaultKeyStatistics,calendarEvents';
    for (const host of ['query1', 'query2']) {
      const url = `https://${host}.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=${modules}&corsDomain=finance.yahoo.com&formatted=false`;
      const res = await fetch(url, { headers: { ...HEADERS, 'Accept-Language': 'en-US,en;q=0.9' }, cache: 'no-store' });
      if (!res.ok) continue;
      const json = await res.json();
      const r    = json?.quoteSummary?.result?.[0];
      if (!r) continue;

      const sd = r.summaryDetail    ?? {};
      const ks = r.defaultKeyStatistics ?? {};
      const p2 = r.price            ?? {};
      const ce = r.calendarEvents   ?? {};

      const getRaw = (obj: any) => typeof obj === 'object' && obj !== null ? (obj.raw ?? obj) : obj;

      extra = {
        marketCap:        fmtCap(getRaw(p2.marketCap) ?? getRaw(sd.marketCap)),
        pe:               getRaw(p2.trailingPE) ?? getRaw(sd.trailingPE)
                            ? Number(getRaw(p2.trailingPE) ?? getRaw(sd.trailingPE)).toFixed(2) : '—',
        eps:              getRaw(ks.trailingEps)
                            ? Number(getRaw(ks.trailingEps)).toFixed(2) + ' ' + currency : '—',
        high52w:          getRaw(sd.fiftyTwoWeekHigh)  ? Number(getRaw(sd.fiftyTwoWeekHigh))  : undefined,
        low52w:           getRaw(sd.fiftyTwoWeekLow)   ? Number(getRaw(sd.fiftyTwoWeekLow))   : undefined,
        volume:           fmtVol(getRaw(p2.regularMarketVolume) ?? getRaw(sd.volume)),
        avgVolume:        fmtVol(getRaw(sd.averageVolume) ?? getRaw(sd.averageVolume10days)),
        dividendRate:     getRaw(sd.dividendRate)
                            ? Number(getRaw(sd.dividendRate)).toFixed(2) + ' ' + currency : '—',
        dividendYield:    getRaw(sd.dividendYield)
                            ? (Number(getRaw(sd.dividendYield)) * 100).toFixed(2) + '%' : '—',
        exDividendDate:   fmtDate(getRaw(sd.exDividendDate)),
        payDividendDate:  fmtDate(getRaw(ce.dividendDate)),
        nextEarningsDate: fmtDate(getRaw(ce.earnings?.earningsDate?.[0])),
        fiftyDayAvg:      getRaw(sd.fiftyDayAverage)       ? Number(getRaw(sd.fiftyDayAverage)).toFixed(2)       : undefined,
        twoHundredDayAvg: getRaw(sd.twoHundredDayAverage)  ? Number(getRaw(sd.twoHundredDayAverage)).toFixed(2)  : undefined,
        beta:             getRaw(sd.beta) ?? getRaw(ks.beta)
                            ? Number(getRaw(sd.beta) ?? getRaw(ks.beta)).toFixed(2) : undefined,
        currency,
      };
      console.log(`[Stocks] ${symbol} quoteSummary OK — cap=${extra.marketCap} pe=${extra.pe} div=${extra.dividendYield}`);
      break;
    }
  } catch (e: any) {
    console.warn(`[Stocks] ${symbol} quoteSummary erreur:`, e.message);
  }

  return {
    price:     Math.round(price     * 100) / 100,
    change24h: Math.round(change24h * 100) / 100,
    currency,
    extra,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbols = (searchParams.get('symbols') || '').split(',').filter(Boolean);
  if (!symbols.length) return Response.json({ error: 'No symbols' }, { status: 400 });

  const eurUsd = await getEurUsdRate();
  const now    = Date.now();
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
