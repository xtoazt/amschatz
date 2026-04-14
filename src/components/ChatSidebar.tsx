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
    <div className="relative">
      <div className={`w-5 h-5 rounded-sm flex items-center justify-center text-[9px] font-mono font-medium shrink-0 ${
        isYou ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
      }`}>
        {initial}
      </div>
      <div className={`absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full border border-sidebar ${isYou ? 'bg-online' : 'bg-muted-foreground/40'}`} />
    </div>
  );
}

export function ChatSidebar({ roomCode, users, currentUser, onLeave, className }: ChatSidebarProps) {
  const [isRoomNameHovered, setIsRoomNameHovered] = useState(false);
  
  return (
    <div className={`w-56 h-full bg-sidebar flex flex-col shrink-0 border-r border-sidebar-border ${className ?? 'hidden md:flex'}`}>
      {/* Tool window title bar */}
      <div className="h-8 flex items-center px-3 bg-secondary/50 border-b border-sidebar-border shrink-0">
        <span className="text-[11px] font-mono text-sidebar-foreground uppercase tracking-wider">Room</span>
      </div>

      <div className="px-3 py-2">
        <p 
          className="text-xs font-medium text-foreground truncate font-mono cursor-default select-none transition-all duration-200"
          onMouseEnter={() => setIsRoomNameHovered(true)}
          onMouseLeave={() => setIsRoomNameHovered(false)}
          title="Hover to reveal"
        >
          {isRoomNameHovered ? roomCode : '*'.repeat(roomCode.length || 8)}
        </p>
        <div className="flex items-center gap-1.5 text-muted-foreground mt-1">
          <Timer className="w-3 h-3" />
          <span className="text-[10px] font-mono">expires in 10m</span>
        </div>
      </div>

      <div className="h-px bg-sidebar-border" />

      {/* Users panel */}
      <div className="h-7 flex items-center px-3 bg-secondary/30 border-b border-sidebar-border shrink-0">
        <Users className="w-3 h-3 text-muted-foreground mr-1.5" />
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Online · {users.length}</span>
      </div>

      <div className="flex-1 px-1 py-1 overflow-y-auto scrollbar-thin">
        <div className="space-y-px">
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
                  className={`flex items-center gap-2 px-2 py-1 rounded-sm ${isYou ? 'bg-accent/15 text-accent-foreground' : 'hover:bg-secondary/50'}`}
                >
                  <UserAvatar username={u.username} isYou={isYou} />
                  <span className="text-xs text-foreground truncate font-mono">{u.username}</span>
                  {isYou && (
                    <span className="text-[9px] font-mono text-muted-foreground ml-auto">you</span>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      <div className="p-2 border-t border-sidebar-border">
        <button
          onClick={onLeave}
          className="w-full flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-all duration-200 active:scale-[0.97] py-1.5 rounded-sm hover:bg-destructive/20 font-mono"
        >
          <LogOut className="w-3 h-3" />
          <span>Leave</span>
        </button>
      </div>
    </div>
  );
}
