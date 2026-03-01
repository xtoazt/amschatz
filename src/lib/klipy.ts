export interface KlipyMediaFormat {
  url: string;
  dims: [number, number];
  size: number;
  duration?: number;
}

// Tenor v1-compatible: media is an array of objects keyed by format name
export interface KlipyItem {
  id: string;
  title: string;
  slug?: string;
  /** Tenor v1: array of one object whose keys are format names */
  media: Record<string, KlipyMediaFormat>[];
}

interface KlipyResponse {
  results?: KlipyItem[];
  // paginated wrapper (klipy-specific)
  data?: {
    current_page?: number;
    per_page?: number;
    has_next?: boolean;
    data?: KlipyItem[];
  };
}

/** Simple in-memory LRU cache (max 30 entries) */
const cache = new Map<string, KlipyItem[]>();
const CACHE_MAX = 30;

function cachePut(key: string, value: KlipyItem[]) {
  if (cache.size >= CACHE_MAX) {
    const first = cache.keys().next().value;
    if (first !== undefined) cache.delete(first);
  }
  cache.set(key, value);
}

async function klipyFetch(path: string): Promise<KlipyItem[]> {
  if (cache.has(path)) return cache.get(path)!;

  const res = await fetch(`/klipy${path}`);
  if (!res.ok) throw new Error(`Klipy request failed: ${res.status}`);

  const json = (await res.json()) as KlipyResponse;

  // Handle both Tenor v1 top-level `results` and klipy paginated `data.data`
  const items: KlipyItem[] =
    json?.results ??
    json?.data?.data ??
    [];

  cachePut(path, items);
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

/** Get a specific format from a Tenor v1 media array */
function getFormat(item: KlipyItem, ...formats: string[]): string {
  const mediaObj = item.media?.[0];
  if (!mediaObj) return '';
  for (const fmt of formats) {
    const url = mediaObj[fmt]?.url;
    if (url) return url;
  }
  return '';
}

/** Best preview URL for grid display (small, fast-loading) */
export function getPreviewUrl(item: KlipyItem): string {
  return getFormat(item, 'tinygif', 'nanogif', 'gif', 'mediumgif');
}

/** Full-quality GIF URL for sending in chat */
export function getFullUrl(item: KlipyItem): string {
  return getFormat(item, 'gif', 'mediumgif', 'tinygif');
}
