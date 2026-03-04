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
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('gif-search', {
        body: { q: q.trim(), limit: 20 },
      });

      if (!error && data?.results) {
        setResults(data.results);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 400);
  };

  const handleSelect = (url: string) => {
    onSelect(url);
    setOpen(false);
    setQuery('');
    setResults([]);
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
        className="w-80 p-0 bg-card border-border"
      >
        {/* Search input */}
        <div className="flex items-center gap-2 p-2 border-b border-border">
          <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <input
            value={query}
            onChange={e => handleQueryChange(e.target.value)}
            placeholder="Search GIFs..."
            autoFocus
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            maxLength={100}
          />
          {query && (
            <button onClick={() => { setQuery(''); setResults([]); }}>
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Results grid */}
        <div className="max-h-64 overflow-y-auto scrollbar-thin p-1.5">
          {loading && (
            <div className="flex justify-center py-8">
              <span className="text-xs text-muted-foreground">Searching...</span>
            </div>
          )}

          {!loading && results.length === 0 && query && (
            <div className="flex justify-center py-8">
              <span className="text-xs text-muted-foreground">No results</span>
            </div>
          )}

          {!loading && results.length === 0 && !query && (
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
                  className="relative overflow-hidden rounded-sm border border-foreground/20 hover:border-foreground/50 transition-all group"
                >
                  <img
                    src={gif.preview_url}
                    alt=""
                    loading="lazy"
                    className="w-full h-24 object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Attribution */}
        <div className="px-2 py-1 border-t border-border">
          <span className="text-[9px] text-muted-foreground">Powered by KLIPY</span>
        </div>
      </PopoverContent>
    </Popover>
  );
}
