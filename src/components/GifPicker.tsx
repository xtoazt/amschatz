import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { KlipyItem, fetchTrendingGifs, searchGifs, getPreviewUrl, getFullUrl } from '@/lib/klipy';

interface GifPickerProps {
  onSelect: (gifUrl: string, gifPreviewUrl: string, gifTitle: string) => void;
  onClose: () => void;
}

const DEBOUNCE_MS = 400;

export function GifPicker({ onSelect, onClose }: GifPickerProps) {
  const [query, setQuery] = useState('');
  const [gifs, setGifs] = useState<KlipyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async (q: string) => {
    setLoading(true);
    setError(null);
    try {
      const results = q.trim() ? await searchGifs(q) : await fetchTrendingGifs();
      setGifs(results);
    } catch {
      setError('Failed to load GIFs. Check your API key.');
      setGifs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load trending on mount
  useEffect(() => {
    load('');
    inputRef.current?.focus();
  }, [load]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(query), DEBOUNCE_MS);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, load]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSelect = (item: KlipyItem) => {
    const full = getFullUrl(item);
    const preview = getPreviewUrl(item);
    if (!full && !preview) return;
    onSelect(full || preview, preview || full, item.title ?? '');
    onClose();
  };

  return (
    <div
      ref={containerRef}
      className="absolute bottom-full mb-2 left-0 w-80 rounded-xl overflow-hidden shadow-2xl border border-border bg-card flex flex-col"
      style={{ maxHeight: '360px' }}
    >
      {/* Search bar */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border shrink-0">
        <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search GIFs..."
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
        />
        {query && (
          <button onClick={() => setQuery('')} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
          </div>
        )}
        {!loading && error && (
          <p className="text-center text-xs text-muted-foreground py-6 px-2">{error}</p>
        )}
        {!loading && !error && gifs.length === 0 && (
          <p className="text-center text-xs text-muted-foreground py-6">No GIFs found.</p>
        )}
        {!loading && !error && gifs.length > 0 && (
          <div className="columns-3 gap-1.5">
            {gifs.map(item => {
              const preview = getPreviewUrl(item);
              if (!preview) return null;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className="block w-full mb-1.5 rounded-md overflow-hidden hover:opacity-80 transition-opacity focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  title={item.title}
                >
                  <img
                    src={preview}
                    alt={item.title ?? 'GIF'}
                    loading="lazy"
                    className="w-full block"
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Attribution */}
      <div className="shrink-0 flex items-center justify-end px-3 py-1.5 border-t border-border">
        <span className="text-[10px] text-muted-foreground tracking-wide">Powered by KLIPY</span>
      </div>
    </div>
  );
}
