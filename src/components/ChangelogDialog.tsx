import { useState, useEffect } from 'react';
import { GitCommit, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'v0id_last_seen_sha';

interface CachedCommit {
  sha: string;
  message: string;
  author_name: string;
  author_date: string;
  html_url: string;
}

export function ChangelogDialog() {
  const [open, setOpen] = useState(false);
  const [newCommits, setNewCommits] = useState<CachedCommit[]>([]);

  useEffect(() => {
    supabase.functions.invoke('fetch-commits')
      .then(({ data, error }) => {
        if (error || data?.error || !data?.commits?.length) return;

        const commits: CachedCommit[] = data.commits;
        const lastSeen = localStorage.getItem(STORAGE_KEY);
        const latestSha = commits[0].sha;

        if (!lastSeen) {
          localStorage.setItem(STORAGE_KEY, latestSha);
          return;
        }

        if (lastSeen === latestSha) return;

        const idx = commits.findIndex(c => c.sha === lastSeen);
        const unseen = idx === -1 ? commits.slice(0, 10) : commits.slice(0, idx);

        if (unseen.length > 0) {
          setNewCommits(unseen);
          setOpen(true);
          localStorage.setItem(STORAGE_KEY, latestSha);
        }
      })
      .catch(() => {});
  }, []);

  const handleClose = () => setOpen(false);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={handleClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-sm bg-card border border-border rounded-lg shadow-lg overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h2 className="text-xs font-medium font-mono text-foreground">what's new</h2>
              <button
                onClick={handleClose}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="px-4 py-3 max-h-64 overflow-y-auto space-y-1.5">
              {newCommits.map(c => (
                <a
                  key={c.sha}
                  href={c.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 group text-xs hover:bg-muted/50 rounded px-1.5 py-1 -mx-1.5 transition-colors"
                >
                  <GitCommit className="w-3 h-3 mt-0.5 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground font-mono font-medium shrink-0">{c.sha.slice(0, 7)}</span>
                  <span className="text-foreground/80 group-hover:text-foreground font-mono text-[11px] transition-colors">
                    {(c.message || '').split('\n')[0]}
                  </span>
                </a>
              ))}
            </div>

            <div className="px-4 py-2.5 border-t border-border">
              <button
                onClick={handleClose}
                className="w-full text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors"
              >
                dismiss
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
