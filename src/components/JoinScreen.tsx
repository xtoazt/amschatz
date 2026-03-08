import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Loader2, GitCommit, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChangelogDialog } from '@/components/ChangelogDialog';

interface JoinScreenProps {
  onJoin: (username: string, roomCode: string) => Promise<{ error: string | null }>;
}

// Glitch text effect component
function GlitchTitle() {
  const [glitching, setGlitching] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setGlitching(true);
      setTimeout(() => setGlitching(false), 200);
    }, 4000 + Math.random() * 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.h1
      className="text-lg font-medium text-foreground tracking-tight font-mono relative select-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <span className={glitching ? 'glitch-text' : ''}>v0id</span>
    </motion.h1>
  );
}

export function JoinScreen({ onJoin }: JoinScreenProps) {
  const [username, setUsername] = useState('');
  const [roomName, setRoomName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !roomName.trim()) return;
    setError(null);
    setJoining(true);
    const result = await onJoin(username.trim(), roomName.trim());
    if (result.error) {
      setError(result.error);
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Grain texture overlay */}
      <div className="grain-overlay" />
      
      <ChangelogDialog />
      <motion.form
        onSubmit={handleJoin}
        className="w-full max-w-sm space-y-5 relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <GlitchTitle />
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Alert variant="destructive" className="bg-destructive/10 border-destructive/30">
                <AlertDescription className="text-xs text-destructive font-mono">{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Username field - stagger delay 0.2s */}
        <motion.div
          className="space-y-1.5"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <label className="text-xs font-medium text-muted-foreground font-mono">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => { setUsername(e.target.value); setError(null); }}
            placeholder="your identity"
            className="w-full bg-input rounded-md py-2.5 px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring transition-colors font-mono"
            maxLength={20}
            required
            disabled={joining}
          />
        </motion.div>

        {/* Room code field - stagger delay 0.4s */}
        <motion.div
          className="space-y-1.5"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <label className="text-xs font-medium text-muted-foreground font-mono">Room Code</label>
          <div className="relative">
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="any code creates a room"
              className="w-full bg-input rounded-md py-2.5 px-3 text-sm text-transparent placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring transition-colors font-mono caret-foreground selection:bg-foreground/20 selection:text-transparent"
              maxLength={30}
              required
              disabled={joining}
              autoComplete="off"
              spellCheck={false}
            />
            <div
              className="absolute inset-0 flex items-center px-3 pointer-events-none font-mono text-sm text-foreground"
              aria-hidden="true"
            >
              {roomName.split('').map((_, i) => (
                <motion.span
                  key={`${i}-${roomName.length}`}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    type: 'spring',
                    stiffness: 500,
                    damping: 15,
                  }}
                >
                  *
                </motion.span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Join button - stagger delay 0.6s with breathing glow */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.7 }}
        >
          <motion.button
            type="submit"
            disabled={!username.trim() || !roomName.trim() || joining}
            className="w-full bg-primary text-primary-foreground font-medium py-2.5 rounded-md flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-20 disabled:cursor-not-allowed font-mono relative join-button-glow"
            whileTap={{ scale: 0.95 }}
          >
            {joining ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                entering...
              </>
            ) : (
              <>
                join
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </motion.div>

        <motion.p
          className="text-[9px] text-muted-foreground leading-relaxed font-mono text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.9 }}
        >
          all messages self-destruct after 10 minutes. no logs. no history.
        </motion.p>
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 1.0 }}
        >
          <Link to="/changelog" className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/80 hover:text-foreground font-mono transition-colors">
            <GitCommit className="w-3 h-3" /> changelog
          </Link>
          <span className="text-muted-foreground/40 text-[10px]">·</span>
          <Link to="/features" className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/80 hover:text-foreground font-mono transition-colors">
            <Sparkles className="w-3 h-3" /> features
          </Link>
        </motion.div>
      </motion.form>
    </div>
  );
}
