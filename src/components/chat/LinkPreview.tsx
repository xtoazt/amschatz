import { memo, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink } from 'lucide-react';

interface OGData {
  title?: string;
  description?: string;
  image?: string;
}

const cache = new Map<string, OGData | null>();

export const LinkPreview = memo(function LinkPreview({ url }: { url: string }) {
  const [data, setData] = useState<OGData | null | undefined>(() =>
    cache.has(url) ? cache.get(url) : undefined
  );

  useEffect(() => {
    if (cache.has(url)) {
      setData(cache.get(url));
      return;
    }

    let cancelled = false;

    supabase.functions.invoke('og-metadata', { body: { url } }).then(({ data: res, error }) => {
      if (cancelled) return;
      if (error || res?.error) {
        cache.set(url, null);
        setData(null);
      } else {
        cache.set(url, res);
        setData(res);
      }
    });

    return () => { cancelled = true; };
  }, [url]);

  // Loading
  if (data === undefined) {
    return (
      <div className="mt-1.5 flex gap-2 rounded-lg bg-muted/30 border border-border/20 p-2 max-w-[280px]">
        <Skeleton className="w-12 h-12 rounded shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-2.5 w-full" />
        </div>
      </div>
    );
  }

  // No data or failed
  if (!data) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-1.5 flex gap-2 rounded-lg bg-muted/30 border border-border/20 p-2 max-w-[280px] hover:bg-muted/50 transition-colors no-underline group/preview"
    >
      {data.image && (
        <img
          src={data.image}
          alt=""
          className="w-12 h-12 rounded object-cover shrink-0"
          loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      )}
      <div className="flex-1 min-w-0">
        {data.title && (
          <p className="text-[11px] font-medium text-foreground truncate leading-tight flex items-center gap-0.5">
            {data.title}
            <ExternalLink className="w-2 h-2 shrink-0 opacity-0 group-hover/preview:opacity-60 transition-opacity" />
          </p>
        )}
        {data.description && (
          <p className="text-[10px] text-muted-foreground line-clamp-2 leading-snug mt-0.5">
            {data.description}
          </p>
        )}
      </div>
    </a>
  );
});
