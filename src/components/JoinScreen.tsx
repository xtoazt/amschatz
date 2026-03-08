import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Loader2, GitCommit, Sparkles, Lock, Plus, LogIn } from 'lucide-react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
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
  await new Promise(r => setTimeout(r, 300));
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
      toast.error('ROOM ALREADY EXISTS', {
        description: 'This room code is already in use. Choose a different code.',
        duration: 4000,
      });
      setCheckingRoom(false);
      return;
    }

    // Clean stale password if any
    const { data: checkData } = await supabase.functions.invoke('room-password', {
      body: { action: 'check', roomCode: room },
    });
    if (checkData?.hasPassword) {
      await supabase.functions.invoke('room-password', {
        body: { action: 'delete', roomCode: room },
      });
    }

    // Set password if toggled
    if (passwordProtect && roomPassword.trim()) {
      await supabase.functions.invoke('room-password', {
        body: { action: 'set', roomCode: room, password: roomPassword.trim(), username: username.trim() },
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
      body: { action: 'check', roomCode: room },
    });
    const roomHasPassword = checkData?.hasPassword;

    const hasActiveUsers = await checkPresence(room);

    const showRoomNotFound = () => {
      setError('ROOM NOT FOUND');
      toast.error('ROOM NOT FOUND', {
        description: 'No active room with this code exists. Try creating one instead.',
        duration: 4000,
      });
      setCheckingRoom(false);
    };

    if (roomHasPassword && !hasActiveUsers) {
      await supabase.functions.invoke('room-password', {
        body: { action: 'delete', roomCode: room },
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
          duration: 5000,
        });
        setCheckingRoom(false);
        return;
      }

      const { data: verifyData } = await supabase.functions.invoke('room-password', {
        body: { action: 'verify', roomCode: room, password: joinPassword.trim() },
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
    (mode === 'create' && passwordProtect && !roomPassword.trim()) ||
    (mode === 'join' && needsPassword && !joinPassword.trim());

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="grain-overlay" />
      
      <ChangelogDialog />
      <LayoutGroup>
      <motion.form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-5 relative z-10"
        initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <GlitchTitle />
        </motion.div>

        {/* Mode tabs */}
        <motion.div
          className="flex gap-1 justify-center relative"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <button
            type="button"
            onClick={() => switchMode('create')}
            disabled={isLoading}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-md transition-colors z-10 ${
              mode === 'create'
                ? 'text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {mode === 'create' && (
              <motion.div
                layoutId="tab-highlight"
                className="absolute inset-0 bg-primary rounded-md"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative flex items-center gap-1.5">
              <Plus className="w-3 h-3" />
              create room
            </span>
          </button>
          <button
            type="button"
            onClick={() => switchMode('join')}
            disabled={isLoading}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-md transition-colors z-10 ${
              mode === 'join'
                ? 'text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {mode === 'join' && (
              <motion.div
                layoutId="tab-highlight"
                className="absolute inset-0 bg-primary rounded-md"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative flex items-center gap-1.5">
              <LogIn className="w-3 h-3" />
              join room
            </span>
          </button>
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

        {/* Username */}
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

        {/* Room code */}
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
              onChange={(e) => { setRoomName(e.target.value); setNeedsPassword(false); setJoinPassword(''); setRoomTaken(false); setError(null); }}
              placeholder={mode === 'create' ? 'choose a room code' : 'enter room code'}
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

        {/* Create mode: password protect toggle */}
        <AnimatePresence>
          {mode === 'create' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
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

        {/* Join mode: password prompt */}
        <AnimatePresence>
          {mode === 'join' && needsPassword && (
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

        {/* Submit */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.7 }}
        >
          <motion.button
            type="submit"
            disabled={isSubmitDisabled}
            className="w-full bg-primary text-primary-foreground font-medium py-2.5 rounded-md flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-20 disabled:cursor-not-allowed font-mono relative join-button-glow"
            whileTap={{ scale: 0.97 }}
            whileHover={!isSubmitDisabled ? { scale: 1.01 } : undefined}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {checkingRoom ? 'checking...' : mode === 'create' ? 'creating...' : 'joining...'}
              </>
            ) : mode === 'join' && needsPassword ? (
              <>
                <Lock className="w-4 h-4" />
                unlock
              </>
            ) : mode === 'create' ? (
              <>
                <Plus className="w-4 h-4" />
                create
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
      </LayoutGroup>
    </div>
  );
}
