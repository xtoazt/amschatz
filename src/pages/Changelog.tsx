import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, GitCommit, Loader2, AlertCircle, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { InteractiveVoidBackground } from '@/components/InteractiveVoidBackground';

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
    <div className="min-h-screen bg-black text-foreground p-4 sm:p-8 font-mono relative overflow-hidden">
      <InteractiveVoidBackground />
      <div className="grain-overlay" />
      
      <div className="max-w-xl mx-auto relative z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white hover:text-shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all mb-8"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> back to reality
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tighter text-white/90 drop-shadow-[0_0_12px_rgba(255,255,255,0.2)]">
              Changelog
            </h1>
            {commitsCached && (
              <span className="text-[10px] text-muted-foreground/60 border border-white/10 rounded px-1.5 py-0.5 leading-none w-fit">
                cached
              </span>
            )}
          </div>
          {!loading && !error && allCommits.length > 0 && !summary && (
            <button
              onClick={handleSummarize}
              disabled={summarizing}
              className="inline-flex items-center gap-2 text-xs text-white/70 hover:text-white transition-all disabled:opacity-50 font-mono border border-white/10 rounded-full px-4 py-2 hover:bg-white/5 hover:border-white/20 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] backdrop-blur-sm"
            >
              {summarizing ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> summarizing…</>
              ) : (
                <><Sparkles className="w-3.5 h-3.5" /> summarize with ai</>
              )}
            </button>
          )}
        </div>

        {summaryError && (
          <div className="flex items-center gap-2 text-xs text-destructive mb-6 bg-destructive/10 border border-destructive/20 p-3 rounded-md">
            <AlertCircle className="w-4 h-4" /> {summaryError}
          </div>
        )}

        <AnimatePresence>
          {summary && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-10 border border-white/10 rounded-xl bg-black/40 backdrop-blur-xl shadow-[0_0_30px_rgba(255,255,255,0.03)] overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.02]">
                <span className="text-[11px] text-white/60 flex items-center gap-2 font-medium tracking-wide">
                  <Sparkles className="w-3.5 h-3.5 text-white/80" /> AI SUMMARY · GEMINI-2.5-FLASH
                  {summaryCached && (
                    <span className="text-[9px] border border-white/10 rounded px-1.5 py-0.5 leading-none ml-2">cached</span>
                  )}
                </span>
                <button
                  onClick={() => setSummary(null)}
                  className="p-1 rounded-sm text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="px-5 py-5 text-[13px] text-white/80 leading-relaxed whitespace-pre-wrap prose prose-invert prose-xs max-w-none [&_h2]:text-[14px] [&_h2]:font-semibold [&_h2]:text-white/90 [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:tracking-wide [&_ul]:mt-0 [&_li]:text-white/70">
                {summary}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading && (
          <div className="flex items-center gap-3 text-sm text-white/50 animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin" /> fetching void records…
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 p-4 rounded-lg">
            <AlertCircle className="w-5 h-5" /> {error}
          </div>
        )}

        <div className="space-y-8">
          {!loading && !error && commits.map((group, gi) => (
            <motion.div
              key={group.date}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: gi * 0.08, ease: "easeOut" }}
              className="relative"
            >
              <h2 className="text-[11px] uppercase tracking-[0.2em] font-medium text-white/40 mb-3 ml-2">
                {group.date}
              </h2>
              <div className="space-y-1 border-l border-white/10 ml-3 pl-4 relative">
                {group.commits.map(c => (
                  <a
                    key={c.sha}
                    href={c.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 group text-[13px] hover:bg-white/5 rounded-lg px-3 py-2 -ml-3 transition-colors relative"
                  >
                    {/* Tiny connector dot */}
                    <div className="absolute left-[3px] top-[14px] w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-white/60 group-hover:shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all -translate-x-[50%]" />
                    
                    <span className="text-white/40 font-medium shrink-0 group-hover:text-white/80 transition-colors mt-0.5">
                      {c.sha.slice(0, 7)}
                    </span>
                    <span className="text-white/70 group-hover:text-white transition-colors leading-relaxed">
                      {(c.message || '').split('\n')[0]}
                    </span>
                  </a>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
