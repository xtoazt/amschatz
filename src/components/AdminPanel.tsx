import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Eye, Lock, Megaphone, Users, UserX } from 'lucide-react';
import { ChatMessage, RoomUser } from '@/types/chat';

interface AdminPanelProps {
  messages: ChatMessage[];
  users: RoomUser[];
  userCount: number;
  frozen: boolean;
  onNuke: () => void;
  onFreeze: () => void;
  onAnnounce: (text: string) => void;
  onKick: (username: string) => void;
  onClose: () => void;
}

export function AdminPanel({
  messages,
  users,
  userCount,
  frozen,
  onNuke,
  onFreeze,
  onAnnounce,
  onKick,
  onClose,
}: AdminPanelProps) {
  const [view, setView] = useState<'main' | 'logs' | 'kick'>('main');
  const [announcement, setAnnouncement] = useState('');

  const handleAnnounce = () => {
    if (announcement.trim()) {
      onAnnounce(announcement.trim());
      setAnnouncement('');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
      onClick={onClose}
    >
      <AnimatePresence mode="wait">
        {view === 'logs' ? (
          <motion.div
            key="logs"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-lg border border-foreground rounded-2xl bg-background overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-foreground/10">
              <span className="text-xs font-mono font-medium text-foreground tracking-wider uppercase">Message Log</span>
              <button
                onClick={() => setView('main')}
                className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-background hover:bg-foreground transition-colors active:scale-[0.95]"
              >
                <X className="w-3.5 h-3.5" />
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
                <span className="text-[11px] font-mono text-muted-foreground">No messages.</span>
              )}
            </div>
          </motion.div>
        ) : view === 'kick' ? (
          <motion.div
            key="kick"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-xs border border-foreground rounded-2xl bg-background overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-foreground/10">
              <span className="text-xs font-mono font-medium text-foreground tracking-wider uppercase">Kick User</span>
              <button
                onClick={() => setView('main')}
                className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-background hover:bg-foreground transition-colors active:scale-[0.95]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-4 space-y-1.5">
              {users.length === 0 && (
                <span className="text-[11px] font-mono text-muted-foreground">No users online.</span>
              )}
              {users.map(u => (
                <motion.button
                  key={u.username}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { onKick(u.username); setView('main'); }}
                  className="w-full flex items-center gap-2 text-sm font-mono text-foreground py-2 px-3 rounded-xl border border-foreground/10 hover:border-foreground hover:bg-foreground hover:text-background transition-colors"
                >
                  <UserX className="w-3.5 h-3.5" />
                  {u.username}
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="main"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-xs space-y-3"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-medium text-foreground tracking-widest uppercase">/admin</span>
              <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-background hover:bg-foreground transition-colors active:scale-[0.95]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* User count */}
            <div className="flex items-center gap-2 py-2 px-3 border border-foreground/20 rounded-xl">
              <Users className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-mono text-muted-foreground">Active:</span>
              <span className="text-xs font-mono text-foreground font-medium">{userCount}</span>
            </div>

            {/* Actions */}
            <motion.button
              onClick={onNuke}
              whileTap={{ scale: 0.95 }}
              className="w-full flex items-center gap-2 border border-foreground text-foreground text-sm font-mono py-2.5 px-3 rounded-xl hover:bg-foreground hover:text-background transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Nuke Room
            </motion.button>

            <motion.button
              onClick={() => setView('logs')}
              whileTap={{ scale: 0.95 }}
              className="w-full flex items-center gap-2 border border-foreground/30 text-foreground text-sm font-mono py-2.5 px-3 rounded-xl hover:border-foreground transition-colors"
            >
              <Eye className="w-4 h-4" />
              Log View
            </motion.button>

            <motion.button
              onClick={onFreeze}
              whileTap={{ scale: 0.95 }}
              className="w-full flex items-center gap-2 border border-foreground/30 text-foreground text-sm font-mono py-2.5 px-3 rounded-xl hover:border-foreground transition-colors"
            >
              <Lock className="w-4 h-4" />
              {frozen ? 'Unfreeze Chat' : 'Freeze Chat'}
            </motion.button>

            <motion.button
              onClick={() => setView('kick')}
              whileTap={{ scale: 0.95 }}
              className="w-full flex items-center gap-2 border border-foreground/30 text-foreground text-sm font-mono py-2.5 px-3 rounded-xl hover:border-foreground transition-colors"
            >
              <UserX className="w-4 h-4" />
              Kick User
            </motion.button>

            {/* Announcement */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2">
                <Megaphone className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Announce</span>
              </div>
              <div className="flex gap-2">
                <input
                  value={announcement}
                  onChange={e => setAnnouncement(e.target.value)}
                  placeholder="System message..."
                  className="flex-1 bg-input rounded-xl py-2.5 px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none font-mono border border-foreground/10 focus:border-foreground/30 transition-colors"
                  maxLength={200}
                />
                <motion.button
                  onClick={handleAnnounce}
                  disabled={!announcement.trim()}
                  whileTap={{ scale: 0.95 }}
                  className="border border-foreground text-foreground text-sm font-mono py-2.5 px-4 rounded-xl hover:bg-foreground hover:text-background disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                >
                  Send
                </motion.button>
              </div>
            </div>

            <div className="h-[1px] bg-foreground/10 mt-2" />
            <p className="text-foreground/20 text-[10px] font-mono text-center">
              admin session active
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
