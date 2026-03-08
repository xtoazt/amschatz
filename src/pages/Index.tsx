import { useState, useCallback } from 'react';
import { useChat } from '@/hooks/use-chat';
import { useScreenshotDetect } from '@/hooks/use-screenshot-detect';
import { JoinScreen } from '@/components/JoinScreen';
import { ChatSidebar } from '@/components/ChatSidebar';
import { ChatArea } from '@/components/ChatArea';
import { AdminPanel } from '@/components/AdminPanel';
import { AdminAuthOverlay } from '@/components/AdminAuthOverlay';

const Index = () => {
  const {
    state, joinRoom, leaveRoom, sendMessage, sendTyping,
    toggleNotifications, nukeRoom, freezeChat, sendAnnouncement, editMessage, unsendMessage, sendImage, sendGif,
    checkUsernameAvailable, broadcastScreenshot, kickUser, reactToMessage,
  } = useChat();
  const [adminOpen, setAdminOpen] = useState(false);
  const [authOverlay, setAuthOverlay] = useState(false);
  const [nuking, setNuking] = useState(false);

  useScreenshotDetect(broadcastScreenshot, state.isJoined);

  const handleSend = (text: string, replyTo?: { id: string; username: string; text: string }) => {
    if (text.trim() === '/admin') {
      if (sessionStorage.getItem('is_admin') === 'true') {
        setAdminOpen(true);
      } else {
        setAuthOverlay(true);
      }
      return;
    }
    sendMessage(text, replyTo);
  };

  const handleNuke = useCallback(() => {
    setAdminOpen(false);
    setNuking(true);
    setTimeout(() => {
      nukeRoom();
    }, 800);
    setTimeout(() => {
      setNuking(false);
    }, 2500);
  }, [nukeRoom]);

  const handleJoin = async (username: string, roomCode: string) => {
    const isAdmin = sessionStorage.getItem('is_admin') === 'true';
    if (!isAdmin) {
      const available = await checkUsernameAvailable(username, roomCode);
      if (!available) {
        return { error: 'Username already active in this void. Please choose another identity.' };
      }
    }
    joinRoom(username, roomCode);
    return { error: null };
  };

  if (!state.isJoined) {
    return <JoinScreen onJoin={handleJoin} />;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <ChatSidebar
        roomCode={state.roomCode}
        users={state.users}
        onLeave={leaveRoom}
      />
      <ChatArea
        messages={state.messages}
        currentUser={state.username}
        roomCode={state.roomCode}
        notificationsEnabled={state.notificationsEnabled}
        typingUsers={state.typingUsers}
        frozen={state.frozen}
        frozenBy={state.frozenBy}
        nuking={nuking}
        onSend={handleSend}
        onTyping={sendTyping}
        onToggleNotifications={toggleNotifications}
        onLeave={leaveRoom}
        onEdit={editMessage}
        onUnsend={unsendMessage}
        onSendImage={sendImage}
        onSendGif={sendGif}
        onReact={reactToMessage}
      />
      {authOverlay && (
        <AdminAuthOverlay
          onSuccess={() => { setAuthOverlay(false); setAdminOpen(true); }}
          onCancel={() => setAuthOverlay(false)}
        />
      )}
      {adminOpen && (
        <AdminPanel
          messages={state.messages}
          users={state.users}
          userCount={state.users.length}
          frozen={state.frozen}
          onNuke={handleNuke}
          onFreeze={freezeChat}
          onAnnounce={sendAnnouncement}
          onKick={kickUser}
          onClose={() => setAdminOpen(false)}
        />
      )}
    </div>
  );
};

export default Index;
