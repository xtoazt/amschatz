import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Loader2, GitCommit, Sparkles, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { ChangelogDialog } from '@/components/ChangelogDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface JoinScreenProps {
  onJoin: (username: string, roomCode: string, isPasswordProtected: boolean) => Promise<{ error: string | null }>;
}

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
  const [roomTaken, setRoomTaken] = useState(false);
  const [joining, setJoining] = useState(false);
  const [passwordProtect, setPasswordProtect] = useState(false);
  const [roomPassword, setRoomPassword] = useState('');
  // State for when joining a password-protected room
  const [needsPassword, setNeedsPassword] = useState(false);
  const [joinPassword, setJoinPassword] = useState('');
  const [checkingRoom, setCheckingRoom] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !roomName.trim()) return;
    setError(null);
    setCheckingRoom(true);

    try {
      // Always check if room already has a password first
      const { data: checkData } = await supabase.functions.invoke('room-password', {
        body: { action: 'check', roomCode: roomName.trim() },
      });

      const roomAlreadyHasPassword = checkData?.hasPassword;

      let roomIsActiveAndLocked = false;

      if (roomAlreadyHasPassword) {
        // Check if anyone is actually in the room
        const presenceChannel = supabase.channel(`room:${roomName.trim()}`);
        const hasActiveUsers = await new Promise<boolean>((resolve) => {
          let resolved = false;
          presenceChannel.on('presence', { event: 'sync' }, () => {
            if (resolved) return;
            resolved = true;
            const users = Object.keys(presenceChannel.presenceState());
            resolve(users.length > 0);
          });
          presenceChannel.subscribe();
          setTimeout(() => { if (!resolved) { resolved = true; resolve(false); } }, 2000);
        });
        supabase.removeChannel(presenceChannel);

        if (!hasActiveUsers) {
          // Stale password — room is inactive, clean it up
          await supabase.functions.invoke('room-password', {
            body: { action: 'delete', roomCode: roomName.trim() },
          });
          // Proceed as if no password existed
        } else {
          roomIsActiveAndLocked = true;
          // Room is active and password-protected
          if (!needsPassword) {
            const hadPasswordToggle = passwordProtect;
            toast.info('ROOM ALREADY IN USE', {
              description: hadPasswordToggle
                ? 'This room name is already taken and password-protected. Your password settings were ignored. Enter the existing password to join.'
                : 'This room name is already taken and password-protected. Enter the password to join.',
              duration: 5000,
            });
            setNeedsPassword(true);
            setPasswordProtect(false);
            setRoomTaken(true);
            setCheckingRoom(false);
            return;
          }
          const { data: verifyData } = await supabase.functions.invoke('room-password', {
            body: { action: 'verify', roomCode: roomName.trim(), password: joinPassword.trim() },
          });

          if (!verifyData?.valid) {
            setError('WRONG PASSWORD');
            toast.error('ACCESS DENIED', {
              description: 'The password you entered is incorrect. Please try again.',
              duration: 4000,
            });
            setCheckingRoom(false);
            return;
          }
        }
      }

      // If stale password was cleaned up or room never had a password, allow setting new one
      const stillHasPassword = roomIsActiveAndLocked;
      if (!stillHasPassword && passwordProtect && roomPassword.trim()) {
        // Only allow setting a password if the room is empty (no active users)
        const channel2 = supabase.channel(`room-check:${roomName.trim()}`);
        const roomHasUsers = await new Promise<boolean>((resolve) => {
          let resolved = false;
          channel2.on('presence', { event: 'sync' }, () => {
            if (resolved) return;
            resolved = true;
            const users = Object.keys(channel2.presenceState());
            resolve(users.length > 0);
          });
          channel2.subscribe();
          setTimeout(() => { if (!resolved) { resolved = true; resolve(false); } }, 2000);
        });
        supabase.removeChannel(channel2);

        if (roomHasUsers) {
          setRoomTaken(true);
          setError('ROOM ALREADY ACTIVE');
          toast.error('CANNOT SET PASSWORD', {
            description: 'This room already has active users. You cannot add a password to an existing room.',
            duration: 4000,
          });
          setPasswordProtect(false);
          setRoomPassword('');
          setCheckingRoom(false);
          return;
        }

        await supabase.functions.invoke('room-password', {
          body: { action: 'set', roomCode: roomName.trim(), password: roomPassword.trim(), username: username.trim() },
        });
      }

      setCheckingRoom(false);
      setJoining(true);
      const isProtected = passwordProtect || roomAlreadyHasPassword;
      const result = await onJoin(username.trim(), roomName.trim(), isProtected);
      if (result.error) {
        setError(result.error);
        setJoining(false);
      }
    } catch {
      setError('CONNECTION FAILED');
      toast.error('CONNECTION FAILED', { description: 'Could not reach the server. Try again.' });
      setCheckingRoom(false);
      setJoining(false);
    }
  };

  const isLoading = joining || checkingRoom;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
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

        {/* Username field */}
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
            disabled={isLoading}
          />
        </motion.div>

        {/* Room code field */}
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
              onChange={(e) => { setRoomName(e.target.value); setNeedsPassword(false); setJoinPassword(''); setRoomTaken(false); }}
              placeholder="any code creates a room"
              className={`w-full bg-input rounded-md py-2.5 px-3 text-sm text-transparent placeholder:text-muted-foreground outline-none focus:ring-1 transition-colors font-mono caret-foreground selection:bg-foreground/20 selection:text-transparent ${roomTaken ? 'ring-2 ring-destructive focus:ring-destructive' : 'focus:ring-ring'}`}
              maxLength={30}
              required
              disabled={isLoading}
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
                  transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                >
                  *
                </motion.span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Password protect toggle */}
        <AnimatePresence>
          {!needsPassword && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, delay: 0.6 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground font-mono flex items-center gap-1.5">
                  <Lock className="w-3 h-3" />
                  Password Protect
                </label>
                <Switch
                  checked={passwordProtect}
                  onCheckedChange={(checked) => {
                    setPasswordProtect(checked);
                    if (!checked) setRoomPassword('');
                  }}
                  disabled={isLoading}
                />
              </div>

              <AnimatePresence>
                {passwordProtect && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <input
                      type="password"
                      value={roomPassword}
                      onChange={(e) => setRoomPassword(e.target.value)}
                      placeholder="room password"
                      className="w-full bg-input rounded-md py-2.5 px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring transition-colors font-mono"
                      maxLength={50}
                      disabled={isLoading}
                      autoComplete="new-password"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Password prompt when joining a protected room */}
        <AnimatePresence>
          {needsPassword && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-1.5"
            >
              <label className="text-xs font-medium text-muted-foreground font-mono flex items-center gap-1.5">
                <Lock className="w-3 h-3" />
                This room is locked — enter password
              </label>
              <input
                type="password"
                value={joinPassword}
                onChange={(e) => { setJoinPassword(e.target.value); setError(null); }}
                placeholder="••••••••"
                className="w-full bg-input rounded-md py-2.5 px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring transition-colors font-mono"
                maxLength={50}
                autoFocus
                disabled={isLoading}
                autoComplete="off"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Join button */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.7 }}
        >
          <motion.button
            type="submit"
            disabled={!username.trim() || !roomName.trim() || isLoading || (passwordProtect && !roomPassword.trim()) || (needsPassword && !joinPassword.trim())}
            className="w-full bg-primary text-primary-foreground font-medium py-2.5 rounded-md flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-20 disabled:cursor-not-allowed font-mono relative join-button-glow"
            whileTap={{ scale: 0.95 }}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {checkingRoom ? 'checking...' : 'entering...'}
              </>
            ) : needsPassword ? (
              <>
                <Lock className="w-4 h-4" />
                unlock
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
          className="flex flex-col items-center gap-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 1.0 }}
        >
          <Link to="/changelog" className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/80 hover:text-foreground font-mono transition-colors">
            <GitCommit className="w-3 h-3" /> changelog
          </Link>
          <Link to="/features" className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/80 hover:text-foreground font-mono transition-colors">
            <Sparkles className="w-3 h-3" /> features
          </Link>
        </motion.div>
      </motion.form>
    </div>
  );
}
