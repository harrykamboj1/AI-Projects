'use server';
import { cache } from "react";
import { POPULAR_INDIAN_STOCK_SYMBOLS } from "../constants";

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
    const token = process.env.ALPHA_ADVANTAGE_API_KEY;
    if (!token) {
      console.error('Stock Search: Alpha Vantage API key is not set');
      return [];
    }

    const queryParam = typeof query === 'string' ? query.trim() : '';
    let rawResults: StockWithWatchlistStatus[] = [];

    if (!queryParam) {
      const top = POPULAR_INDIAN_STOCK_SYMBOLS.slice(0, 10);

      const profiles = await mapInBatches(
        top,
        3,
        async (symbol) => {
          const url = `${ALPHA_ADVANTAGE_BASE_URL}/query?function=SYMBOL_SEARCH&apikey=${token}&keywords=${encodeURIComponent(
            symbol
          )}`;
          try {
            const profile = await fetchJson<any>(url, 3600);
            return { symbol, profile } as { symbol: string; profile: any };
          } catch (err) {
            console.error('Error searching symbol', symbol, err);
            return { symbol, profile: null } as { symbol: string; profile: any };
          }
        }
      );

      for (const p of profiles) {
        const data = p.profile;
        if (Array.isArray(data?.bestMatches)) {
          for (const m of data.bestMatches as StockMatch[]) {
            rawResults.push({
              symbol: m['1. symbol'] ?? p.symbol ?? 'N/A',
              name: m['2. name'] ?? 'N/A',
              exchange: m['4. region'] ?? '',
              type: m['3. type'] ?? DEFAULT_TYPE,
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
      const url = `${ALPHA_ADVANTAGE_BASE_URL}/query?function=SYMBOL_SEARCH&apikey=${token}&keywords=${encodeURIComponent(
        queryParam
      )}`;
      const data = await fetchJson<any>(url, 1800);
      if (Array.isArray(data?.bestMatches)) {
        rawResults = data.bestMatches.map((m: StockMatch) => ({
          symbol: m['1. symbol'] ?? 'N/A',
          name: m['2. name'] ?? 'N/A',
          exchange: m['4. region'] ?? '',
          type: m['3. type'] ?? DEFAULT_TYPE,
          isInWatchlist: false
        }));
      } else {
        rawResults = [];
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

    if (process.env.NODE_ENV !== 'production') console.debug('searchStocks ->', normalized);

    return normalized;
  } catch (err) {
    console.error('Stock search failed', err);
    return [];
  }
});