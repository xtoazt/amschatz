import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, GitCommit, Loader2, AlertCircle, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

interface CachedCommit {
  sha: string;
  message: string;
  author_name: string;
  author_date: string;
  html_url: string;
}

interface GroupedCommits {
  date: string;
  commits: CachedCommit[];
}

const REPO = 'hypnotized1337/Anonymous-Chat';

export default function Changelog() {
  const [commits, setCommits] = useState<GroupedCommits[]>([]);
  const [allCommits, setAllCommits] = useState<CachedCommit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryCached, setSummaryCached] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [commitsCached, setCommitsCached] = useState(false);

  useEffect(() => {
    async function fetchAllCommits() {
      try {
        const { data, error } = await supabase.functions.invoke('fetch-commits');
        if (error) throw new Error(error.message);
        if (data?.error) throw new Error(data.error);

        const allData: CachedCommit[] = data.commits || [];
        setAllCommits(allData);
        setCommitsCached(!!data.cached);

        const grouped: Record<string, CachedCommit[]> = {};
        allData.forEach(c => {
          const date = new Date(c.author_date).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
          });
          (grouped[date] ||= []).push(c);
        });
        setCommits(Object.entries(grouped).map(([date, commits]) => ({ date, commits })));
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchAllCommits();
  }, []);

  const handleSummarize = async () => {
    if (allCommits.length === 0) return;
    setSummarizing(true);
    setSummaryError(null);

    try {
      const commitMessages = allCommits.map(c => (c.message || '').split('\n')[0]);
      const latestSha = allCommits[0]?.sha;
      const { data, error } = await supabase.functions.invoke('summarize-changelog', {
        body: { commits: commitMessages, latest_sha: latestSha },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      setSummary(data.summary);
      setSummaryCached(!!data.cached);
    } catch (e: any) {
      setSummaryError(e.message || 'Failed to summarize');
    } finally {
      setSummarizing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-8 font-mono">
      <div className="max-w-xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-3 h-3" /> back
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-medium tracking-tight">changelog</h1>
            {commitsCached && (
              <span className="text-[9px] text-muted-foreground/60 border border-border rounded px-1 py-0.5 leading-none">cached</span>
            )}
          </div>
          {!loading && !error && allCommits.length > 0 && !summary && (
            <button
              onClick={handleSummarize}
              disabled={summarizing}
              className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 font-mono border border-border rounded-md px-2 py-1 hover:bg-muted/50"
            >
              {summarizing ? (
                <><Loader2 className="w-3 h-3 animate-spin" /> summarizing…</>
              ) : (
                <><Sparkles className="w-3 h-3" /> summarize with ai</>
              )}
            </button>
          )}
        </div>

        {summaryError && (
          <div className="flex items-center gap-2 text-xs text-destructive mb-4">
            <AlertCircle className="w-3 h-3" /> {summaryError}
          </div>
        )}

        <AnimatePresence>
          {summary && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-6 border border-border rounded-lg bg-card overflow-hidden"
            >
              <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                <span className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" /> ai summary · gemini-2.5-flash
                  {summaryCached && (
                    <span className="text-[9px] text-muted-foreground/60 border border-border rounded px-1 py-0.5 leading-none">cached</span>
                  )}
                </span>
                <button
                  onClick={() => setSummary(null)}
                  className="p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div className="px-3 py-3 text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap prose prose-invert prose-xs max-w-none [&_h2]:text-[11px] [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mt-3 [&_h2]:mb-1 [&_ul]:mt-0 [&_li]:text-foreground/70">
                {summary}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" /> fetching commits…
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-xs text-destructive">
            <AlertCircle className="w-3 h-3" /> {error}
          </div>
        )}

        {!loading && !error && commits.map((group, gi) => (
          <motion.div
            key={group.date}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: gi * 0.05 }}
            className="mb-5"
          >
            <p className="text-[10px] text-muted-foreground mb-1.5">{group.date}</p>
            <div className="space-y-1">
              {group.commits.map(c => (
                <a
                  key={c.sha}
                  href={c.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 group text-xs hover:bg-muted/50 rounded px-1.5 py-1 -mx-1.5 transition-colors"
                >
                  <GitCommit className="w-3 h-3 mt-0.5 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground font-medium shrink-0">{c.sha.slice(0, 7)}</span>
                  <span className="text-foreground/80 group-hover:text-foreground transition-colors truncate">
                    {(c.message || '').split('\n')[0]}
                  </span>
                </a>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
