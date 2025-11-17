'use server';
import { cache } from "react";
import { POPULAR_INDIAN_STOCK_SYMBOLS } from "../constants";
import YahooFinance from "yahoo-finance2";


type StockMatch = { [k: string]: string };
type StockWithWatchlistStatus = {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
  isInWatchlist: boolean;
};

const DEFAULT_REGION = 'India';
const DEFAULT_TYPE = 'Stock';
const ALPHA_TIMEOUT_MS = 7000;

const ALPHA_ADVANTAGE_BASE_URL = 'https://www.alphavantage.co';
const yahooFinance = new YahooFinance();


async function fetchJson<T>(url: string, revalidateSeconds?: number, timeoutMs = ALPHA_TIMEOUT_MS): Promise<T> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  const options: RequestInit & { next?: { revalidate?: number } } = revalidateSeconds
    ? { cache: 'force-cache', next: { revalidate: revalidateSeconds }, signal: controller.signal }
    : { cache: 'no-store', signal: controller.signal };

  try {
    const res = await fetch(url, options);
    clearTimeout(id);
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Fetch failed ${res.status}: ${text}`);
    }
    return (await res.json()) as T;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

async function mapInBatches<T, R>(items: T[], batchSize: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const res = await Promise.all(batch.map(fn));
    out.push(...res);
  }
  return out;
}

export const searchStocks = cache(async (query?: string): Promise<StockWithWatchlistStatus[]> => {
  try {
    const queryParam = typeof query === 'string' ? query.trim() : '';
    let rawResults: StockWithWatchlistStatus[] = [];

    if (!queryParam) {
      const top = POPULAR_INDIAN_STOCK_SYMBOLS.slice(0, 10);

      const profiles = await mapInBatches(
        top,
        3,
        async (symbol) => {
          try {
            console.log('Fetching profile for popular symbol', symbol);
            const profile = await yahooFinance.search(symbol);
            return { symbol, profile } as { symbol: string; profile: any };
          } catch (err) {
            console.error('Error searching symbol', symbol, err);
            return { symbol, profile: null } as { symbol: string; profile: any };
          }
        }
      );

      for (const p of profiles) {
        const data = p.profile;
        if (data && Array.isArray(data.quotes)) {
          for (const quote of data.quotes) {
            rawResults.push({
              symbol: quote.symbol ?? p.symbol ?? 'N/A',
              name: quote.longname ?? quote.shortname ?? 'N/A',
              exchange: quote.exchDisp ?? quote.exchange ?? '',
              type: quote.quoteType ?? DEFAULT_TYPE,
              isInWatchlist: false
            });
          }
        } else {
          rawResults.push({
            symbol: p.symbol,
            name: 'N/A',
            exchange: '',
            type: DEFAULT_TYPE,
            isInWatchlist: false
          });
        }
      }
    } else {
      console.log('Fetching profile for selected symbol', queryParam);
      const data = await yahooFinance.search(queryParam);
      
      if (data === null || !data.quotes || !Array.isArray(data.quotes)) {
        rawResults = [];
      } else {
        rawResults = data.quotes.map((quote: any) => ({
          symbol: quote.symbol ?? 'N/A',
          name: quote.longname ?? quote.shortname ?? 'N/A',
          exchange: quote.exchDisp ?? quote.exchange ?? '',
          type: quote.quoteType ?? DEFAULT_TYPE,
          isInWatchlist: false
        }));
      }
    }

    const seen = new Set<string>();
    const normalized: StockWithWatchlistStatus[] = [];

    for (const r of rawResults) {
      const sym = (r.symbol ?? 'N/A').toUpperCase();
      if (sym === 'N/A' || seen.has(sym)) continue;
      seen.add(sym);

      normalized.push({
        symbol: sym,
        name: r.name && r.name !== '' ? r.name : sym,
        exchange: (r.exchange && r.exchange !== '') ? r.exchange : DEFAULT_REGION,
        type: r.type ?? DEFAULT_TYPE,
        isInWatchlist: false
      });

      if (normalized.length >= 10) break;
    }

    return normalized;
  } catch (err) {
    console.error('Stock search failed', err);
    return [];
  }
});