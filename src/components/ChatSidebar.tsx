import { useState } from 'react';
import { Users, LogOut, Timer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { RoomUser } from '@/types/chat';

interface ChatSidebarProps {
  roomCode: string;
  users: RoomUser[];
  currentUser: string;
  onLeave: () => void;
  className?: string;
}

function UserAvatar({ username, isYou }: { username: string; isYou: boolean }) {
  const initial = username.charAt(0).toUpperCase();
  return (
    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-medium shrink-0 ${
      isYou ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground'
    }`}>
      {initial}
    </div>
  );
}

export function ChatSidebar({ roomCode, users, currentUser, onLeave, className }: ChatSidebarProps) {
  const [isRoomNameHovered, setIsRoomNameHovered] = useState(false);
  
  return (
    <div className={`w-56 h-full bg-card flex flex-col shrink-0 ${className ?? 'hidden md:flex'}`}>
      <div className="p-4">
        <span className="text-xs font-medium text-muted-foreground">Room</span>
        <p 
          className="text-sm font-medium text-foreground truncate mt-0.5 font-mono cursor-default select-none transition-all duration-200"
          onMouseEnter={() => setIsRoomNameHovered(true)}
          onMouseLeave={() => setIsRoomNameHovered(false)}
          title="Hover to reveal"
        >
          {isRoomNameHovered ? roomCode : '*'.repeat(roomCode.length || 8)}
        </p>
      </div>

      {/* Self-destruct info */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-1.5 text-muted-foreground/50">
          <Timer className="w-3 h-3" />
          <span className="text-[10px] font-mono">messages expire in 10m</span>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto scrollbar-thin">
        <div className="flex items-center gap-1.5 mb-3">
          <Users className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Online — {users.length}</span>
        </div>
        <div className="space-y-0.5">
          <AnimatePresence initial={false}>
            {users.map((u) => {
              const isYou = u.username === currentUser;
              return (
                <motion.div
                  key={u.username}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2 }}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded ${isYou ? 'bg-muted/50' : ''}`}
                >
                  <UserAvatar username={u.username} isYou={isYou} />
                  <span className="text-sm text-foreground truncate">{u.username}</span>
                  {isYou && (
                    <span className="text-[9px] font-mono text-muted-foreground ml-auto">you</span>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      <div className="p-4">
        <button
          onClick={onLeave}
          className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-all active:scale-[0.95] py-2 rounded-md hover:bg-muted"
        >
          <LogOut className="w-4 h-4" />
          Leave
        </button>
      </div>
    </div>
  );
}
