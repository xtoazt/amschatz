import { useState } from 'react';
import { X, Trash2, Eye, Lock, Megaphone, Users } from 'lucide-react';
import { ChatMessage } from '@/types/chat';

interface AdminPanelProps {
  messages: ChatMessage[];
  userCount: number;
  frozen: boolean;
  onNuke: () => void;
  onFreeze: () => void;
  onAnnounce: (text: string) => void;
  onClose: () => void;
}

export function AdminPanel({
  messages,
  userCount,
  frozen,
  onNuke,
  onFreeze,
  onAnnounce,
  onClose,
}: AdminPanelProps) {
  const [view, setView] = useState<'main' | 'logs'>('main');
  const [announcement, setAnnouncement] = useState('');

  const handleAnnounce = () => {
    if (announcement.trim()) {
      onAnnounce(announcement.trim());
      setAnnouncement('');
    }
  };

  if (view === 'logs') {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-card rounded-lg overflow-hidden">
          <div className="flex items-center justify-between p-4">
            <span className="text-xs font-medium text-foreground">Message Log</span>
            <button onClick={() => setView('main')} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto scrollbar-thin p-4 space-y-1">
            {messages.filter(m => m.type === 'message').map(m => (
              <div key={m.id} className="text-[11px] font-mono text-muted-foreground">
                <span className="text-foreground">{new Date(m.timestamp).toLocaleTimeString()}</span>
                {' '}&lt;{m.username}&gt; {m.deleted ? '[deleted]' : m.text}
              </div>
            ))}
            {messages.filter(m => m.type === 'message').length === 0 && (
              <span className="text-[11px] text-muted-foreground">No messages.</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/95 flex items-center justify-center p-4">
      <div className="w-full max-w-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-foreground tracking-wide uppercase">/admin</span>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 py-2">
          <Users className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Active users:</span>
          <span className="text-xs text-foreground font-medium">{userCount}</span>
        </div>

        <button
          onClick={onNuke}
          className="w-full flex items-center gap-2 bg-primary text-primary-foreground text-sm font-medium py-2.5 px-3 rounded-md hover:opacity-90 transition-opacity"
        >
          <Trash2 className="w-4 h-4" />
          Nuke Room
        </button>

        <button
          onClick={() => setView('logs')}
          className="w-full flex items-center gap-2 bg-secondary text-secondary-foreground text-sm py-2.5 px-3 rounded-md hover:opacity-80 transition-opacity"
        >
          <Eye className="w-4 h-4" />
          Log View
        </button>

        <button
          onClick={onFreeze}
          className="w-full flex items-center gap-2 bg-secondary text-secondary-foreground text-sm py-2.5 px-3 rounded-md hover:opacity-80 transition-opacity"
        >
          <Lock className="w-4 h-4" />
          {frozen ? 'Unfreeze Chat' : 'Freeze Chat'}
        </button>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Megaphone className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Announcement</span>
          </div>
          <div className="flex gap-2">
            <input
              value={announcement}
              onChange={e => setAnnouncement(e.target.value)}
              placeholder="System message..."
              className="flex-1 bg-input rounded-md py-2 px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none"
              maxLength={200}
            />
            <button
              onClick={handleAnnounce}
              disabled={!announcement.trim()}
              className="bg-primary text-primary-foreground text-sm font-medium py-2 px-3 rounded-md hover:opacity-90 disabled:opacity-20 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
