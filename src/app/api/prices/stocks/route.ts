// src/app/api/prices/stocks/route.ts
// Prix actions en temps réel via Yahoo Finance (gratuit, pas de clé API)

const cache: Record<string, { price: number; change24h: number; ts: number }> = {};
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes

async function getStockPrice(symbol: string): Promise<{ price: number; change24h: number } | null> {
  // Essaie plusieurs endpoints Yahoo Finance
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
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://finance.yahoo.com',
        },
        cache: 'no-store', // pas de cache Next.js — on gère nous-mêmes
      });

      if (!res.ok) {
        console.warn(`[Stocks] ${symbol} → ${res.status} sur ${url}`);
        continue;
      }

      const data = await res.json();
      const result = data?.chart?.result?.[0];
      const meta = result?.meta;
      if (!meta) {
        console.warn(`[Stocks] ${symbol} → pas de meta dans la réponse`);
        continue;
      }

      const price     = meta.regularMarketPrice ?? meta.previousClose;
      const prevClose = meta.chartPreviousClose  ?? meta.previousClose;
      const change24h = prevClose ? ((price - prevClose) / prevClose) * 100 : 0;

      console.log(`[Stocks] ${symbol} → ${price} (prev: ${prevClose}, change: ${change24h.toFixed(2)}%)`);
      return { price: Math.round(price * 100) / 100, change24h: Math.round(change24h * 100) / 100 };
    } catch (e: any) {
      console.warn(`[Stocks] ${symbol} erreur:`, e.message);
    }
  }

  return null;
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

      if (cache[sym] && now - cache[sym].ts < CACHE_TTL) {
        result[sym] = { symbol: sym, price: cache[sym].price, change24h: cache[sym].change24h };
        return;
      }

      const data = await getStockPrice(sym);
      if (data) {
        cache[sym] = { ...data, ts: now };
        result[sym] = { symbol: sym, ...data };
      } else {
        // Retourner le cache expiré plutôt que rien
        if (cache[sym]) {
          result[sym] = { symbol: sym, price: cache[sym].price, change24h: cache[sym].change24h };
        }
      }
    })
  );

  return Response.json(result);
}
