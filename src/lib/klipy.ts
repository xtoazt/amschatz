export interface KlipyMediaFormat {
  url: string;
  dims: [number, number];
  size: number;
  duration?: number;
}

export interface KlipyItem {
  id: string;
  title: string;
  slug: string;
  /** content_formats keyed by format name (gif, tinygif, mediumgif, mp4, tinymp4, ...) */
  content_formats: Record<string, KlipyMediaFormat>;
}

interface KlipyPagedResponse {
  result: boolean;
  data: {
    current_page: number;
    per_page: number;
    has_next: boolean;
    data: KlipyItem[];
  };
}

const BASE = 'https://api.klipy.com/api/v1';

/** Simple in-memory LRU cache (max 30 entries) */
const cache = new Map<string, KlipyItem[]>();
const CACHE_MAX = 30;

function cachePut(key: string, value: KlipyItem[]) {
  if (cache.size >= CACHE_MAX) {
    // evict oldest entry
    const first = cache.keys().next().value;
    if (first !== undefined) cache.delete(first);
  }
  cache.set(key, value);
}

async function klipyFetch(path: string): Promise<KlipyItem[]> {
  const apiKey = import.meta.env.VITE_KLIPY_API_KEY as string | undefined;
  if (!apiKey) {
    console.warn('[klipy] VITE_KLIPY_API_KEY is not set');
    return [];
  }

  const cacheKey = path;
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  const res = await fetch(`${BASE}/${apiKey}${path}`);
  if (!res.ok) throw new Error(`Klipy request failed: ${res.status}`);

  const json = (await res.json()) as KlipyPagedResponse;
  const items = json?.data?.data ?? [];
  cachePut(cacheKey, items);
  return items;
}

/** Fetch trending GIFs */
export function fetchTrendingGifs(limit = 24): Promise<KlipyItem[]> {
  return klipyFetch(`/gifs/trending?per_page=${limit}`);
}

/** Search GIFs */
export function searchGifs(query: string, limit = 24): Promise<KlipyItem[]> {
  const q = encodeURIComponent(query.trim());
  return klipyFetch(`/gifs/search?q=${q}&per_page=${limit}`);
}

/** Return the best available preview URL for grid display (prefers tinygif, then gif) */
export function getPreviewUrl(item: KlipyItem): string {
  const fmt = item.content_formats;
  return (
    fmt['tinygif']?.url ??
    fmt['nanogif']?.url ??
    fmt['gif']?.url ??
    fmt['mediumgif']?.url ??
    ''
  );
}

/** Return the full-quality GIF URL */
export function getFullUrl(item: KlipyItem): string {
  const fmt = item.content_formats;
  return (
    fmt['gif']?.url ??
    fmt['mediumgif']?.url ??
    fmt['tinygif']?.url ??
    ''
  );
}
