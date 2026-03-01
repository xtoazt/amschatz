import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useChat } from '@/hooks/use-chat';
import { ChatArea } from '@/components/ChatArea';
import { ChatSidebar } from '@/components/ChatSidebar';

const SCHOOLWIDE_ROOM_CODE = 'ams';

export default function SchoolwideChatPage() {
  const navigate = useNavigate();
  const [hasJoined, setHasJoined] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  const chat = useChat();

  // Get username from sessionStorage (set by SchoolwideChatButton)
  useEffect(() => {
    const storedUsername = sessionStorage.getItem('schoolwide_chat_username');
    if (storedUsername) {
      setUsername(storedUsername);
    } else {
      // No username; redirect back to join screen
      navigate('/');
    }
  }, [navigate]);

  // Auto-join the schoolwide chat room once username is available
  useEffect(() => {
    if (username && !hasJoined) {
      chat.joinRoom(username, SCHOOLWIDE_ROOM_CODE);
      setHasJoined(true);
    }
  }, [username, hasJoined, chat]);

  const handleLeave = () => {
    chat.leaveRoom();
    navigate('/');
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <button
          onClick={handleLeave}
          className="p-2 hover:bg-muted rounded-md transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div>
          <h1 className="font-semibold text-foreground">Schoolwide Chat</h1>
          <p className="text-xs text-muted-foreground">Room: {SCHOOLWIDE_ROOM_CODE}</p>
        </div>
      </div>

      {/* Chat content */}
      <div className="flex-1 flex overflow-hidden">
        <ChatArea
          messages={chat.state.messages}
          currentUser={chat.state.username}
          roomCode={chat.state.roomCode}
          notificationsEnabled={chat.state.notificationsEnabled}
          typingUsers={chat.state.typingUsers}
          onSend={chat.sendMessage}
          onSendImage={chat.sendImage}
          onSendGif={chat.sendGif}
          onEdit={chat.editMessage}
          onUnsend={chat.unsendMessage}
          onTyping={chat.sendTyping}
          onExport={chat.exportHistory}
          onToggleNotifications={chat.toggleNotifications}
          onLeave={handleLeave}
          onPurge={chat.purgeSession}
        />
        <ChatSidebar
          roomCode={SCHOOLWIDE_ROOM_CODE}
          users={chat.state.users}
          onLeave={handleLeave}
        />
      </div>
    </div>
  );
}
