import { useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface JoinScreenProps {
  onJoin: (username: string, roomCode: string) => Promise<{ error: string | null }>;
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
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.form
        onSubmit={handleJoin}
        className="w-full max-w-sm space-y-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <div className="text-center mb-6">
          <h1 className="text-lg font-medium text-foreground tracking-tight font-mono">v0id</h1>
        </div>

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

        <div className="space-y-1.5">
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
        </div>

        <div className="space-y-1.5">
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
                    delay: 0,
                  }}
                >
                  *
                </motion.span>
              ))}
            </div>
          </div>
        </div>

        <motion.button
          type="submit"
          disabled={!username.trim() || !roomName.trim() || joining}
          className="w-full bg-primary text-primary-foreground font-medium py-2.5 rounded-md flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-20 disabled:cursor-not-allowed font-mono"
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

        <p className="text-[9px] text-muted-foreground leading-relaxed font-mono text-center">
          all messages self-destruct after 10 minutes. no logs. no history.
        </p>
      </motion.form>
    </div>
  );
}
