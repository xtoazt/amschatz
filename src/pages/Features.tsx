import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { InteractiveVoidBackground } from '@/components/InteractiveVoidBackground';

export default function Features() {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);

  useEffect(() => {
    async function fetchFeatures() {
      try {
        const { data, error } = await supabase.functions.invoke('summarize-features');
        if (error) throw new Error(error.message);
        if (data?.error) throw new Error(data.error);
        setSummary(data.summary);
        setCached(data.cached);
      } catch (e: any) {
        setError(e.message || 'Failed to load features');
      } finally {
        setLoading(false);
      }
    }
    fetchFeatures();
  }, []);

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
              Features
            </h1>
            {cached && (
              <span className="text-[10px] text-muted-foreground/60 border border-white/10 rounded px-1.5 py-0.5 leading-none w-fit">
                cached
              </span>
            )}
          </div>
        </div>

        {loading && (
          <div className="flex items-center gap-3 text-sm text-white/50 animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin" /> mapping the void…
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 p-4 rounded-lg">
            <AlertCircle className="w-5 h-5" /> {error}
          </div>
        )}

        {summary && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ease: "easeOut", duration: 0.5 }}
            className="border border-white/10 rounded-xl bg-black/40 backdrop-blur-xl shadow-[0_0_30px_rgba(255,255,255,0.03)] overflow-hidden"
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/[0.02]">
              <Sparkles className="w-3.5 h-3.5 text-white/80" />
              <span className="text-[11px] text-white/60 font-medium tracking-wide">
                AI-GENERATED · GEMINI-2.5-FLASH
              </span>
            </div>
            <div className="px-5 py-6 text-[13px] text-white/80 leading-relaxed whitespace-pre-wrap prose prose-invert prose-xs max-w-none [&_h2]:text-[14px] [&_h2]:font-semibold [&_h2]:text-white/90 [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:tracking-wide [&_ul]:mt-0 [&_li]:text-white/70">
              {summary}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
