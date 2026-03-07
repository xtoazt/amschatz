import { useState, useCallback, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface GifResult {
  id: string;
  url: string;
  preview_url: string;
  width: number;
  height: number;
}

interface GifPickerProps {
  onSelect: (url: string) => void;
  disabled?: boolean;
}

export function GifPicker({ onSelect, disabled }: GifPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GifResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setError(false);
      return;
    }

    setLoading(true);
    setError(false);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('gif-search', {
        body: { q: q.trim(), limit: 24 },
      });

      if (fnError || !data?.results) {
        setError(true);
        setResults([]);
      } else {
        setResults(data.results);
      }
    } catch {
      setError(true);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 300);
  };

  const handleSelect = (url: string) => {
    onSelect(url);
    setOpen(false);
    setQuery('');
    setResults([]);
    setError(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className="p-2.5 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
          title="Send GIF"
        >
          <span className="text-xs font-bold tracking-tight">GIF</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="w-80 p-0 bg-background border border-foreground"
      >
        {/* Search input */}
        <div className="flex items-center gap-2 p-2 border-b border-foreground">
          <Search className="w-3.5 h-3.5 text-foreground shrink-0" />
          <input
            value={query}
            onChange={e => handleQueryChange(e.target.value)}
            placeholder="Search GIFs via KLIPY"
            autoFocus
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-foreground/50 outline-none"
            maxLength={100}
          />
          {query && (
            <button onClick={() => { setQuery(''); setResults([]); setError(false); }}>
              <X className="w-3.5 h-3.5 text-foreground" />
            </button>
          )}
        </div>

        {/* Results grid */}
        <div className="max-h-64 overflow-y-auto scrollbar-thin p-1.5 bg-background">
          {loading && (
            <div className="flex justify-center py-8">
              <span className="text-xs text-muted-foreground animate-pulse">Searching the void...</span>
            </div>
          )}

          {!loading && error && (
            <div className="flex justify-center py-8">
              <span className="text-xs text-muted-foreground">Search failed. Try again.</span>
            </div>
          )}

          {!loading && !error && results.length === 0 && query && (
            <div className="flex justify-center py-8">
              <span className="text-xs text-muted-foreground">No results</span>
            </div>
          )}

          {!loading && !error && results.length === 0 && !query && (
            <div className="flex justify-center py-8">
              <span className="text-xs text-muted-foreground">Type to search GIFs</span>
            </div>
          )}

          {results.length > 0 && (
            <div className="grid grid-cols-2 gap-1">
              {results.map(gif => (
                <button
                  key={gif.id}
                  onClick={() => handleSelect(gif.url)}
                  className="relative overflow-hidden border border-foreground hover:border-primary transition-all duration-200"
                >
                  <img
                    src={gif.preview_url}
                    alt=""
                    loading="lazy"
                    className="w-full h-24 object-cover grayscale hover:grayscale-0 transition-all duration-200 ease-in-out"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Attribution */}
        <div className="px-2 py-1.5 border-t border-foreground bg-background">
          <span className="text-[10px] font-mono text-foreground/70 tracking-wide">Powered by KLIPY</span>
        </div>
      </PopoverContent>
    </Popover>
  );
}
