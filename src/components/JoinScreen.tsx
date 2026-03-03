import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { ChatMessage } from '@/types/chat';

interface JoinScreenProps {
  onJoin: (username: string, roomCode: string, importedMessages?: ChatMessage[]) => void;
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
          <input
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            placeholder="Enter room code"
            className="w-full bg-input rounded-md py-2.5 px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring transition-colors"
            maxLength={30}
            required
          />
        </div>

        <button
          type="submit"
          disabled={!username.trim() || !roomCode.trim()}
          className="w-full bg-primary text-primary-foreground font-medium py-2.5 rounded-md flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-20 disabled:cursor-not-allowed"
        >
          Join
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
