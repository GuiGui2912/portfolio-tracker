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
  if (n >= 1e9) return (n / 1e9).toFixed(2) + ' Md';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + ' M';
  if (n >= 1e3) return (n / 1e3).toFixed(0) + ' K';
  return n.toLocaleString();
}

function fmtDate(ts: number | string | undefined): string {
  if (!ts) return '—';
  // Si c'est une string ISO ou formatée
  if (typeof ts === 'string') {
    if (ts === '—' || ts === '') return '—';
    const d = new Date(ts);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  // Timestamp Unix (secondes)
  if (ts <= 0) return '—';
  // Yahoo retourne parfois des timestamps en millisecondes (> 1e10)
  const ms = ts > 1e10 ? ts : ts * 1000;
  const d = new Date(ms);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://finance.yahoo.com',
  'Origin': 'https://finance.yahoo.com',
};

async function fetchWithCrumb(symbol: string): Promise<any> {
  // Étape 1 : récupérer un cookie valide + crumb
  try {
    const cookieRes = await fetch('https://fc.yahoo.com', { headers: HEADERS, cache: 'no-store' });
    const cookieHeader = cookieRes.headers.get('set-cookie') || '';
    const cookie = cookieHeader.split(';')[0];

    const crumbRes = await fetch('https://query1.finance.yahoo.com/v1/test/getcrumb', {
      headers: { ...HEADERS, 'Cookie': cookie },
      cache: 'no-store',
    });
    const crumb = await crumbRes.text();

    const modules = 'summaryDetail,defaultKeyStatistics,price,calendarEvents';
    const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=${modules}&crumb=${encodeURIComponent(crumb)}`;
    const res = await fetch(url, {
      headers: { ...HEADERS, 'Cookie': cookie },
      cache: 'no-store',
    });
    if (!res.ok) {
      console.warn(`[quoteSummary] ${symbol} HTTP ${res.status}`);
      return null;
    }
    const json = await res.json();
    return json?.quoteSummary?.result?.[0] ?? null;
  } catch (e: any) {
    console.warn(`[quoteSummary] ${symbol} erreur crumb:`, e.message);
    return null;
  }
}

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

  // 2. Données fondamentales avec crumb
  let extra: Record<string, any> = {};
  const r = await fetchWithCrumb(symbol);
  if (r) {
    const getRaw = (obj: any): any => {
      if (obj === null || obj === undefined) return undefined;
      if (typeof obj === 'object' && 'raw' in obj) return obj.raw;
      return obj;
    };

    const sd = r.summaryDetail        ?? {};
    const ks = r.defaultKeyStatistics ?? {};
    const p2 = r.price                ?? {};
    const ce = r.calendarEvents       ?? {};

    const cap      = getRaw(p2.marketCap)      ?? getRaw(sd.marketCap);
    const pe       = getRaw(p2.trailingPE)     ?? getRaw(sd.trailingPE);
    const eps      = getRaw(ks.trailingEps);
    const divRate  = getRaw(sd.dividendRate);
    const divYield = getRaw(sd.dividendYield);
    const exDiv    = getRaw(sd.exDividendDate);
    const payDiv   = getRaw(ce.dividendDate);
    const hi52     = getRaw(sd.fiftyTwoWeekHigh);
    const lo52     = getRaw(sd.fiftyTwoWeekLow);
    const avg50    = getRaw(sd.fiftyDayAverage);
    const avg200   = getRaw(sd.twoHundredDayAverage);
    const vol      = getRaw(p2.regularMarketVolume) ?? getRaw(sd.volume);
    const avgVol   = getRaw(sd.averageVolume)       ?? getRaw(sd.averageVolume10days);
    const beta     = getRaw(sd.beta)               ?? getRaw(ks.beta);
    const earn     = ce.earnings?.earningsDate?.[0];
    const nextEarn = getRaw(earn);

    extra = {
      marketCap:        fmtCap(cap),
      pe:               pe    ? Number(pe).toFixed(2)   : '—',
      eps:              eps   ? Number(eps).toFixed(2) + ' ' + currency : '—',
      high52w:          hi52  ? Number(hi52)  : undefined,
      low52w:           lo52  ? Number(lo52)  : undefined,
      volume:           fmtVol(vol),
      avgVolume:        fmtVol(avgVol),
      dividendRate:     divRate  ? Number(divRate).toFixed(2)  + ' ' + currency : '—',
      dividendYield:    divYield ? (Number(divYield) * 100).toFixed(2) + '%'    : '—',
      exDividendDate:   fmtDate(exDiv),
      payDividendDate:  fmtDate(payDiv),
      nextEarningsDate: fmtDate(nextEarn),
      fiftyDayAvg:      avg50  ? Number(avg50).toFixed(2)  : undefined,
      twoHundredDayAvg: avg200 ? Number(avg200).toFixed(2) : undefined,
      beta:             beta   ? Number(beta).toFixed(2)   : undefined,
      currency,
    };
    console.log(`[Stocks] ${symbol} OK — cap=${extra.marketCap} pe=${extra.pe} div=${extra.dividendYield}`);
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
