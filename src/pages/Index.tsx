import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '@/hooks/use-chat';
import { JoinScreen } from '@/components/JoinScreen';
import { ChatSidebar } from '@/components/ChatSidebar';
import { ChatArea } from '@/components/ChatArea';
import { AdminPanel } from '@/components/AdminPanel';
import { AdminAuthOverlay } from '@/components/AdminAuthOverlay';

const Index = () => {
  const {
    state, joinRoom, leaveRoom, sendMessage, sendTyping,
    toggleNotifications, nukeRoom, freezeChat, sendAnnouncement, editMessage, unsendMessage, sendImage, sendGif,
    kickUser,
  } = useChat();
  const [adminOpen, setAdminOpen] = useState(false);
  const [authOverlay, setAuthOverlay] = useState(false);
  const [nuking, setNuking] = useState(false);
  const [uiScale, setUiScale] = useState(() => {
    const saved = localStorage.getItem('v0id-ui-scale');
    return saved ? Number(saved) : 100;
  });

  const handleScaleChange = useCallback((val: number[]) => {
    const s = val[0];
    setUiScale(s);
    localStorage.setItem('v0id-ui-scale', String(s));
  }, []);

  useEffect(() => {
    document.documentElement.style.fontSize = `${uiScale}%`;
    return () => { document.documentElement.style.fontSize = ''; };
  }, [uiScale]);

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

  const handleJoin = async (username: string, roomCode: string, isPasswordProtected: boolean) => {
    const isAdmin = sessionStorage.getItem('is_admin') === 'true';
    const result = await joinRoom(username, roomCode, isAdmin, isPasswordProtected);
    return { error: result.error };
  };

  return (
    <AnimatePresence mode="wait">
      {!state.isJoined ? (
        <motion.div
          key="join"
          initial={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 0.96, filter: 'blur(6px)' }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="h-screen w-full"
        >
          <JoinScreen onJoin={handleJoin} />
        </motion.div>
      ) : (
        <motion.div
          key="chat"
          initial={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="flex h-screen w-full overflow-hidden"
        >
          <ChatSidebar
            roomCode={state.roomCode}
            users={state.users}
            currentUser={state.username}
            onLeave={leaveRoom}
          />
          <ChatArea
            messages={state.messages}
            currentUser={state.username}
            roomCode={state.roomCode}
            users={state.users}
            notificationsEnabled={state.notificationsEnabled}
            typingUsers={state.typingUsers}
            frozen={state.frozen}
            frozenBy={state.frozenBy}
            nuking={nuking}
            isPasswordProtected={state.isPasswordProtected}
            uiScale={uiScale}
            onScaleChange={handleScaleChange}
            onSend={handleSend}
            onTyping={sendTyping}
            onToggleNotifications={toggleNotifications}
            onLeave={leaveRoom}
            onEdit={editMessage}
            onUnsend={unsendMessage}
            onSendImage={sendImage}
            onSendGif={sendGif}
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
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Index;
