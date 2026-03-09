import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

interface AdminAuthOverlayProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function AdminAuthOverlay({ onSuccess, onCancel }: AdminAuthOverlayProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [granted, setGranted] = useState(false);
  const [glitchText, setGlitchText] = useState('');

  // Typewriter effect for granted state
  useEffect(() => {
    if (!granted) return;
    const fullText = 'ADMIN AUTHENTICATED';
    let i = 0;
    const interval = setInterval(() => {
      setGlitchText(fullText.slice(0, i + 1));
      i++;
      if (i >= fullText.length) {
        clearInterval(interval);
        setTimeout(() => onSuccess(), 800);
      }
    }, 40);
    return () => clearInterval(interval);
  }, [granted, onSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || loading) return;

    setLoading(true);
    setError('');

    try {
      const { data, error: fnError } = await supabase.functions.invoke('verify-admin', {
        body: { password: password.trim() },
      });

      if (fnError) throw fnError;

      if (data?.valid) {
        sessionStorage.setItem('is_admin', 'true');
        setGranted(true);
      } else {
        setError('ACCESS DENIED');
        setPassword('');
      }
    } catch {
      setError('CONNECTION FAILED');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 bg-background flex items-center justify-center p-4"
    >
      <AnimatePresence mode="wait">
        {granted ? (
          <motion.div
            key="granted"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center space-y-3"
          >
            <div className="w-12 h-[1px] bg-foreground mx-auto" />
            <p className="text-sm font-mono text-foreground tracking-widest">
              {glitchText}
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="inline-block w-[2px] h-3.5 bg-foreground ml-0.5 align-middle"
              />
            </p>
            <div className="w-12 h-[1px] bg-foreground mx-auto" />
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-sm space-y-5 font-mono"
          >
            <div className="text-foreground/60 text-xs space-y-1">
              <p>{'>'} ADMIN AUTHENTICATION REQUIRED</p>
              <p>{'>'} ENTER MASTER KEY TO PROCEED</p>
            </div>

            <div className="flex items-center gap-2 border border-foreground/20 rounded-xl px-3 py-2.5">
              <span className="text-foreground/40 text-sm">$</span>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoFocus
                disabled={loading}
                className="flex-1 bg-transparent border-none outline-none text-foreground text-sm placeholder:text-foreground/20 caret-foreground font-mono"
                maxLength={100}
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-foreground text-xs font-mono border-l-2 border-foreground pl-2"
                >
                  {'>'} {error}
                </motion.p>
              )}
            </AnimatePresence>

            <div className="flex gap-3 text-xs">
              <motion.button
                type="submit"
                disabled={loading || !password.trim()}
                whileTap={{ scale: 0.95 }}
                className="border border-foreground text-foreground px-4 py-2 rounded-xl hover:bg-foreground hover:text-background disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
              >
                [{loading ? 'VERIFYING...' : 'AUTHENTICATE'}]
              </motion.button>
              <motion.button
                type="button"
                onClick={onCancel}
                whileTap={{ scale: 0.95 }}
                className="text-foreground/40 hover:text-foreground transition-colors px-4 py-2"
              >
                [CANCEL]
              </motion.button>
            </div>

            <div className="h-[1px] bg-foreground/10 mt-4" />
            <p className="text-foreground/20 text-[10px] font-mono">
              Session persists until browser tab closes.
            </p>
          </motion.form>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
