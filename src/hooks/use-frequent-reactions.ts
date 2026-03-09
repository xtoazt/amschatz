import { useState, useCallback, useMemo } from 'react';

const STORAGE_KEY = 'v0id-reaction-freq';
const DEFAULTS = ['✓', '✗', '⚡', '👁', '🔥'];

function load(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

export function useFrequentReactions() {
  const [counts, setCounts] = useState<Record<string, number>>(load);

  const recordReaction = useCallback((emoji: string) => {
    setCounts(prev => {
      const next = { ...prev, [emoji]: (prev[emoji] || 0) + 1 };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const quickReactions = useMemo(() => {
    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([e]) => e);
    if (sorted.length >= 5) return sorted.slice(0, 5);
    const fill = DEFAULTS.filter(d => !sorted.includes(d));
    return [...sorted, ...fill].slice(0, 5);
  }, [counts]);

  const frequentlyUsed = useMemo(() => {
    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([e]) => e)
      .slice(0, 12);
    return sorted;
  }, [counts]);

  return { quickReactions, frequentlyUsed, recordReaction };
}
