import { useState } from 'react';
import { Users, LogOut } from 'lucide-react';
import { RoomUser } from '@/types/chat';

interface ChatSidebarProps {
  roomCode: string;
  users: RoomUser[];
  onLeave: () => void;
}

export function ChatSidebar({ roomCode, users, onLeave }: ChatSidebarProps) {
  const [isRoomNameHovered, setIsRoomNameHovered] = useState(false);
  
  return (
    <div className="w-56 h-full bg-card flex flex-col shrink-0 hidden md:flex">
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

      <div className="flex-1 p-4 overflow-y-auto scrollbar-thin">
        <div className="flex items-center gap-1.5 mb-3">
          <Users className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Online — {users.length}</span>
        </div>
        <div className="space-y-1.5">
          {users.map((u) => (
            <div key={u.username} className="flex items-center gap-2 px-2 py-1 rounded">
              <div className="w-1.5 h-1.5 rounded-full bg-online" />
              <span className="text-sm text-foreground truncate">{u.username}</span>
            </div>
          ))}
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
