import { useState } from 'react';
import { ArrowRight, Shuffle, ShieldAlert } from 'lucide-react';

interface JoinScreenProps {
  onJoin: (username: string, roomCode: string) => void;
}

function generateSecureRoomCode(): string {
  const array = new Uint8Array(12);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

export function JoinScreen({ onJoin }: JoinScreenProps) {
  const [username, setUsername] = useState('');
  const [roomCode, setRoomCode] = useState('');

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() && roomCode.trim()) {
      onJoin(username.trim(), roomCode.trim());
    }
  };

  const handleGenerate = () => {
    setRoomCode(generateSecureRoomCode());
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={handleJoin} className="w-full max-w-sm space-y-5">
        <div className="text-center mb-6">
          <h1 className="text-lg font-medium text-foreground tracking-tight">Join a room</h1>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Name</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Your name"
            className="w-full bg-input rounded-md py-2.5 px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring transition-colors"
            maxLength={20}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Room code</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              placeholder="Enter or generate a code"
              className="flex-1 bg-input rounded-md py-2.5 px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring transition-colors"
              maxLength={30}
              required
            />
            <button
              type="button"
              onClick={handleGenerate}
              className="bg-secondary text-secondary-foreground p-2.5 rounded-md hover:opacity-80 transition-opacity"
              title="Generate secure room code"
            >
              <Shuffle className="w-4 h-4" />
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={!username.trim() || !roomCode.trim()}
          className="w-full bg-primary text-primary-foreground font-medium py-2.5 rounded-md flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-20 disabled:cursor-not-allowed"
        >
          Join
          <ArrowRight className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-2 pt-2">
          <ShieldAlert className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Room codes are not passwords. Anyone with the code can join. Use a generated code for better privacy. Messages are ephemeral and not stored.
          </p>
        </div>
      </form>
    </div>
  );
}
