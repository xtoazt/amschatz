import { useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
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
    <div className="min-h-screen flex items-center justify-center p-4 film-grain scanline">
      <form onSubmit={handleJoin} className="w-full max-w-sm space-y-5 border border-border p-8">
        <div className="text-center mb-6">
          <h1 className="text-lg font-medium text-foreground tracking-[0.3em] font-mono uppercase glitch-text">v0id</h1>
        </div>

        {error && (
          <Alert variant="destructive" className="bg-destructive/10 border border-destructive/30">
            <AlertDescription className="text-xs text-destructive font-mono">{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-1.5">
          <label className="text-[10px] font-medium text-muted-foreground font-mono uppercase tracking-widest">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => { setUsername(e.target.value); setError(null); }}
            placeholder="your identity"
            className="w-full bg-input py-2.5 px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border transition-all font-mono input-glow"
            maxLength={20}
            required
            disabled={joining}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-medium text-muted-foreground font-mono uppercase tracking-widest">Room Name</label>
          <input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="any name creates a room"
            className="w-full bg-input py-2.5 px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border transition-all font-mono input-glow"
            maxLength={30}
            required
            disabled={joining}
          />
        </div>

        <button
          type="submit"
          disabled={!username.trim() || !roomName.trim() || joining}
          className="w-full btn-invert font-medium py-2.5 flex items-center justify-center gap-2 font-mono uppercase tracking-widest text-sm"
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
        </button>

        <p className="text-[9px] text-muted-foreground leading-relaxed font-mono text-center">
          all messages self-destruct after 10 minutes. no logs. no history.
        </p>
      </form>
    </div>
  );
}
