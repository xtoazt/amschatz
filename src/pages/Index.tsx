import { useChat } from '@/hooks/use-chat';
import { JoinScreen } from '@/components/JoinScreen';
import { ChatSidebar } from '@/components/ChatSidebar';
import { ChatArea } from '@/components/ChatArea';

const Index = () => {
  const {
    state,
    joinRoom,
    leaveRoom,
    sendMessage,
    sendImage,
    sendGif,
    editMessage,
    unsendMessage,
    purgeSession,
    sendTyping,
    exportHistory,
    toggleNotifications,
  } = useChat();

  if (!state.isJoined) {
    return <JoinScreen onJoin={joinRoom} />;
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
        onSend={sendMessage}
        onSendImage={sendImage}
        onSendGif={sendGif}
        onEdit={editMessage}
        onUnsend={unsendMessage}
        onTyping={sendTyping}
        onExport={exportHistory}
        onToggleNotifications={toggleNotifications}
        onLeave={leaveRoom}
        onPurge={purgeSession}
      />
    </div>
  );
};

export default Index;
