import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Loader2, GitCommit, Sparkles, Lock, Plus, LogIn, Github } from 'lucide-react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { ChangelogDialog } from '@/components/ChangelogDialog';
import { CanvasVoidBackground } from '@/components/CanvasVoidBackground';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface JoinScreenProps {
  onJoin: (username: string, roomCode: string, isPasswordProtected: boolean) => Promise<{ error: string | null; }>;
}

const VOID_LETTERS = ['v', '0', 'i', 'd'];

function VoidLogo() {
  const [glitching, setGlitching] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setGlitching(true);
      setTimeout(() => setGlitching(false), 350);
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex flex-col items-center">
      {/* Ambient glow behind logo */}
      <motion.div
        className="absolute -inset-8 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)',
        }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Main title with letter stagger */}
      <h1 className="relative select-none">
        <span className="sr-only">v0id</span>
        <span
          className={`void-logo-text text-5xl font-semibold tracking-tight font-mono text-foreground inline-flex ${glitching ? 'void-glitch-active' : ''}`}
          aria-hidden="true"
        >
          {VOID_LETTERS.map((letter, i) => (
            <motion.span
              key={letter + i}
              className="inline-block"
              initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{
                duration: 0.5,
                delay: 0.15 + i * 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {letter}
            </motion.span>
          ))}
        </span>
      </h1>

      {/* Decorative line under logo */}
      <motion.div
        className="h-px mt-3 bg-gradient-to-r from-transparent via-white/30 to-transparent"
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: 80, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}

async function checkPresence(roomName: string): Promise<boolean> {
  const channel = supabase.channel(`room:${roomName}`);
  const hasUsers = await new Promise<boolean>((resolve) => {
    let resolved = false;
    channel.on('presence', { event: 'sync' }, () => {
      if (resolved) return;
      resolved = true;
      resolve(Object.keys(channel.presenceState()).length > 0);
    });
    channel.subscribe();
    setTimeout(() => { if (!resolved) { resolved = true; resolve(false); } }, 2000);
  });
  supabase.removeChannel(channel);
  // Allow server to fully clean up before re-subscribing in joinRoom
  await new Promise((r) => setTimeout(r, 300));
  return hasUsers;
}

export function JoinScreen({ onJoin }: JoinScreenProps) {
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [username, setUsername] = useState('');
  const [roomName, setRoomName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [roomTaken, setRoomTaken] = useState(false);
  const [joining, setJoining] = useState(false);
  const [passwordProtect, setPasswordProtect] = useState(false);
  const [roomPassword, setRoomPassword] = useState('');
  const [needsPassword, setNeedsPassword] = useState(false);
  const [joinPassword, setJoinPassword] = useState('');
  const [checkingRoom, setCheckingRoom] = useState(false);

  const resetState = () => {
    setError(null);
    setRoomTaken(false);
    setNeedsPassword(false);
    setJoinPassword('');
    setPasswordProtect(false);
    setRoomPassword('');
  };

  const switchMode = (newMode: 'create' | 'join') => {
    if (newMode === mode) return;
    setMode(newMode);
    resetState();
  };

  const handleCreate = async () => {
    const room = roomName.trim();
    const hasActiveUsers = await checkPresence(room);

    if (hasActiveUsers) {
      setRoomTaken(true);
      setError('ROOM ALREADY EXISTS');
      toast.error('ROOM ALREADY EXISTS.', {
        description: 'This room code is already in use. Choose a different code.',
        duration: 4000
      });
      setCheckingRoom(false);
      return;
    }

    // Clean stale password if any
    const { data: checkData } = await supabase.functions.invoke('room-password', {
      body: { action: 'check', roomCode: room }
    });
    if (checkData?.hasPassword) {
      await supabase.functions.invoke('room-password', {
        body: { action: 'delete', roomCode: room }
      });
    }

    // Set password if toggled
    if (passwordProtect && roomPassword.trim()) {
      await supabase.functions.invoke('room-password', {
        body: { action: 'set', roomCode: room, password: roomPassword.trim(), username: username.trim() }
      });
    }

    setCheckingRoom(false);
    setJoining(true);
    const result = await onJoin(username.trim(), room, passwordProtect && !!roomPassword.trim());
    if (result.error) {
      setError(result.error);
      setJoining(false);
    }
  };

  const handleJoinRoom = async () => {
    const room = roomName.trim();

    const { data: checkData } = await supabase.functions.invoke('room-password', {
      body: { action: 'check', roomCode: room }
    });
    const roomHasPassword = checkData?.hasPassword;

    const hasActiveUsers = await checkPresence(room);

    const showRoomNotFound = () => {
      setError('ROOM NOT FOUND');
      toast.error('ROOM NOT FOUND', {
        description: 'No active room with this code exists. Try creating one instead.',
        duration: 4000
      });
      setCheckingRoom(false);
    };

    if (roomHasPassword && !hasActiveUsers) {
      await supabase.functions.invoke('room-password', {
        body: { action: 'delete', roomCode: room }
      });
      showRoomNotFound();
      return;
    }

    if (!hasActiveUsers && !roomHasPassword) {
      showRoomNotFound();
      return;
    }

    if (roomHasPassword) {
      if (!needsPassword) {
        setNeedsPassword(true);
        toast.info('ROOM IS LOCKED', {
          description: 'This room is password-protected. Enter the password to join.',
          duration: 5000
        });
        setCheckingRoom(false);
        return;
      }

      const { data: verifyData } = await supabase.functions.invoke('room-password', {
        body: { action: 'verify', roomCode: room, password: joinPassword.trim() }
      });
      if (!verifyData?.valid) {
        setError('WRONG PASSWORD');
        toast.error('ACCESS DENIED', {
          description: 'The password you entered is incorrect. Please try again.',
          duration: 4000
        });
        setCheckingRoom(false);
        return;
      }
    }

    setCheckingRoom(false);
    setJoining(true);
    const result = await onJoin(username.trim(), room, !!roomHasPassword);
    if (result.error) {
      setError(result.error);
      setJoining(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !roomName.trim()) return;
    setError(null);
    setCheckingRoom(true);

    try {
      if (mode === 'create') {
        await handleCreate();
      } else {
        await handleJoinRoom();
      }
    } catch {
      setError('CONNECTION FAILED');
      toast.error('CONNECTION FAILED', { description: 'Could not reach the server. Try again.' });
      setCheckingRoom(false);
      setJoining(false);
    }
  };

  const isLoading = joining || checkingRoom;

  const isSubmitDisabled =
    !username.trim() ||
    !roomName.trim() ||
    isLoading ||
    mode === 'create' && passwordProtect && !roomPassword.trim() ||
    mode === 'join' && needsPassword && !joinPassword.trim();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-black">
      <CanvasVoidBackground />
      <div className="grain-overlay" />

      <ChangelogDialog />
      <LayoutGroup>
        <motion.form
          onSubmit={handleSubmit}
          className="w-full max-w-sm space-y-5 relative z-10 border border-white/20 bg-card/30 backdrop-blur-xl rounded-2xl p-7 shadow-[0_0_80px_-20px_hsl(var(--foreground)/0.04),inset_0_0_0_1px_rgba(255,255,255,0.05)]"
          initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>

          <motion.div
            className="flex flex-col items-center mb-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}>

            <VoidLogo />
            <motion.p
              className="text-[11px] font-mono text-muted-foreground/40 tracking-[0.25em] uppercase mt-4"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
            </motion.p>
          </motion.div>

          {/* Mode tabs */}
          <motion.div
            className="flex gap-1 justify-center relative"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}>

            <button
              type="button"
              onClick={() => switchMode('create')}
              disabled={isLoading}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-full transition-colors z-10 ${mode === 'create' ?
                'text-primary-foreground' :
                'text-muted-foreground hover:text-foreground hover:bg-white/5'}`
              }>

              {mode === 'create' &&
                <motion.div
                  layoutId="tab-highlight"
                  className="absolute inset-0 bg-primary rounded-full shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }} />

              }
              <span className="relative flex items-center gap-1.5">
                <Plus className="w-3 h-3" />
                create room
              </span>
            </button>
            <button
              type="button"
              onClick={() => switchMode('join')}
              disabled={isLoading}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-full transition-colors z-10 ${mode === 'join' ?
                'text-primary-foreground' :
                'text-muted-foreground hover:text-foreground hover:bg-white/5'}`
              }>

              {mode === 'join' &&
                <motion.div
                  layoutId="tab-highlight"
                  className="absolute inset-0 bg-primary rounded-full shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }} />

              }
              <span className="relative flex items-center gap-1.5">
                <LogIn className="w-3 h-3" />
                join room
              </span>
            </button>
          </motion.div>

          <AnimatePresence>
            {error &&
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}>

                <Alert variant="destructive" className="bg-destructive/10 border-destructive/30">
                  <AlertDescription className="text-xs text-destructive font-mono">{error}</AlertDescription>
                </Alert>
              </motion.div>
            }
          </AnimatePresence>

          {/* Username */}
          <motion.div
            className="space-y-1.5"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}>

            <label className="text-xs font-medium text-muted-foreground font-mono">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(null); }}
              placeholder="your identity"
              className="w-full bg-input rounded-lg border border-white/5 py-2.5 px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring transition-colors font-mono"
              maxLength={20}
              required
              disabled={isLoading} />

          </motion.div>

          {/* Room code */}
          <motion.div
            className="space-y-1.5"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}>

            <label className="text-xs font-medium text-muted-foreground font-mono">Room Code</label>
            <div className="relative">
              <input
                type="text"
                value={roomName}
                onChange={(e) => { setRoomName(e.target.value); setNeedsPassword(false); setJoinPassword(''); setRoomTaken(false); setError(null); }}
                placeholder={mode === 'create' ? 'choose a room code' : 'enter room code'}
                className={`w-full bg-input rounded-lg border border-white/5 py-2.5 px-3 text-sm text-transparent placeholder:text-muted-foreground outline-none focus:ring-1 transition-colors font-mono caret-foreground selection:bg-foreground/20 selection:text-transparent ${roomTaken ? 'ring-2 ring-destructive focus:ring-destructive border-transparent' : 'focus:ring-ring'}`}
                maxLength={30}
                required
                disabled={isLoading}
                autoComplete="off"
                spellCheck={false} />

              <div
                className="absolute inset-0 flex items-center px-3 pointer-events-none font-mono text-sm text-foreground"
                aria-hidden="true">

                {roomName.split('').map((_, i) =>
                  <motion.span
                    key={`${i}-${roomName.length}`}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 15 }}>

                    *
                  </motion.span>
                )}
              </div>
            </div>
          </motion.div>

          {/* Create mode: password protect toggle */}
          <AnimatePresence>
            {mode === 'create' &&
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-3">

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
                    disabled={isLoading} />

                </div>

                <AnimatePresence>
                  {passwordProtect &&
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}>

                      <input
                        type="password"
                        value={roomPassword}
                        onChange={(e) => setRoomPassword(e.target.value)}
                        placeholder="room password"
                        className="w-full bg-input rounded-lg border border-white/5 py-2.5 px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring transition-colors font-mono"
                        maxLength={50}
                        disabled={isLoading}
                        autoComplete="new-password" />

                    </motion.div>
                  }
                </AnimatePresence>
              </motion.div>
            }
          </AnimatePresence>

          {/* Join mode: password prompt */}
          <AnimatePresence>
            {mode === 'join' && needsPassword &&
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-1.5">

                <label className="text-xs font-medium text-muted-foreground font-mono flex items-center gap-1.5">
                  <Lock className="w-3 h-3" />
                  This room is locked — enter password
                </label>
                <input
                  type="password"
                  value={joinPassword}
                  onChange={(e) => { setJoinPassword(e.target.value); setError(null); }}
                  placeholder="••••••••"
                  className="w-full bg-input rounded-lg border border-white/5 py-2.5 px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring transition-colors font-mono"
                  maxLength={50}
                  autoFocus
                  disabled={isLoading}
                  autoComplete="off" />

              </motion.div>
            }
          </AnimatePresence>

          {/* Submit */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.7 }}>

            <motion.button
              type="submit"
              disabled={isSubmitDisabled}
              className="w-full bg-primary text-primary-foreground font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-20 disabled:cursor-not-allowed font-mono text-sm relative join-button-glow overflow-hidden group border border-white/10 shadow-[0_2px_10px_rgba(255,255,255,0.1)]"
              whileTap={{ scale: 0.97 }}
              whileHover={!isSubmitDisabled ? { scale: 1.02 } : undefined}>

              <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />

              {isLoading ?
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {checkingRoom ? 'checking...' : mode === 'create' ? 'creating...' : 'joining...'}
                </> :
                mode === 'join' && needsPassword ?
                  <>
                    <Lock className="w-4 h-4" />
                    unlock
                  </> :
                  mode === 'create' ?
                    <>
                      <Plus className="w-4 h-4" />
                      create
                    </> :

                    <>
                      join
                      <ArrowRight className="w-4 h-4" />
                    </>
              }
            </motion.button>
          </motion.div>

          <motion.p
            className="text-xs text-muted-foreground leading-relaxed font-mono text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.9 }}>

            Everything is deleted on exit · nothing stored
          </motion.p>
          <motion.div
            className="flex flex-col items-center justify-center gap-4 pt-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 1.0 }}>
            
            <div className="flex items-center gap-5">
              <Link to="/changelog" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-white font-mono transition-colors">
                <GitCommit className="w-3.5 h-3.5" /> changelog
              </Link>
              <div className="w-1 h-1 rounded-full bg-white/20 shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
              <Link to="/features" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-white font-mono transition-colors">
                <Sparkles className="w-3.5 h-3.5" /> features
              </Link>
            </div>
            
            <a 
              href="https://github.com/hypnotized1337/Void-chat" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/30 hover:text-white/80 font-mono transition-colors mt-2"
            >
              <Github className="w-4 h-4" />
            </a>
          </motion.div>
        </motion.form>
      </LayoutGroup>
    </div>);

}