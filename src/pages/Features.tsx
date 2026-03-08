import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

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
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-8 font-mono">
      <div className="max-w-xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-3 h-3" /> back
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-sm font-medium tracking-tight">features</h1>
          {cached && (
            <span className="text-[9px] text-muted-foreground/60">cached</span>
          )}
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" /> generating summary…
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-xs text-destructive">
            <AlertCircle className="w-3 h-3" /> {error}
          </div>
        )}

        {summary && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-border rounded-lg bg-card overflow-hidden"
          >
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border">
              <Sparkles className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">ai-generated from commit history</span>
            </div>
            <div className="px-3 py-3 text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">
              {summary}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
