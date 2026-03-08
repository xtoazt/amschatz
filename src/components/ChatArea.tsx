import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Send, Bell, BellOff, LogOut, Plus, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GifPicker } from '@/components/GifPicker';
import { FullscreenImageViewer } from '@/components/FullscreenImageViewer';
import { ChatMessage, ReplyTo } from '@/types/chat';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { FileInspector, InspectedFile } from '@/components/chat/FileInspector';
import { ReplyPreview } from '@/components/chat/ReplyPreview';
import { ACCEPTED_FILE_TYPES } from '@/components/chat/FileHelpers';

interface ChatAreaProps {
  messages: ChatMessage[];
  currentUser: string;
  roomCode: string;
  notificationsEnabled: boolean;
  typingUsers: string[];
  frozen: boolean;
  frozenBy: string | null;
  nuking: boolean;
  onSend: (text: string, replyTo?: ReplyTo) => void;
  onTyping: () => void;
  onToggleNotifications: () => void;
  onLeave: () => void;
  onEdit: (messageId: string, newText: string) => void;
  onUnsend: (messageId: string) => void;
  onSendImage: (file: File, onProgress?: (p: number) => void) => void;
  onSendGif: (url: string) => void;
  onReact: (messageId: string, emoji: string) => void;
}

export function ChatArea({
  messages,
  currentUser,
  roomCode,
  notificationsEnabled,
  typingUsers,
  frozen,
  frozenBy,
  nuking,
  onSend,
  onTyping,
  onToggleNotifications,
  onLeave,
  onEdit,
  onUnsend,
  onSendImage,
  onSendGif,
  onReact,
}: ChatAreaProps) {
  const [input, setInput] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationJiggle, setNotificationJiggle] = useState(false);
  const [inspectedFile, setInspectedFile] = useState<InspectedFile | null>(null);
  const [replyingTo, setReplyingTo] = useState<ReplyTo | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const lastMessageCountRef = useRef(messages.length);
  const userScrolledRef = useRef(false);

  // Shared 1-second ticker for self-destruct timers
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const checkIfScrolledUp = useCallback(() => {
    if (!scrollContainerRef.current) return false;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    return scrollHeight - scrollTop - clientHeight >= 100;
  }, []);

  const handleScroll = useCallback(() => {
    const scrolledUp = checkIfScrolledUp();
    setIsScrolledUp(scrolledUp);
    if (!scrolledUp) {
      setUnreadCount(0);
      userScrolledRef.current = false;
    } else {
      userScrolledRef.current = true;
    }
  }, [checkIfScrolledUp]);

  const scrollToBottom = useCallback((smooth = true) => {
    endRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    setUnreadCount(0);
    setIsScrolledUp(false);
    userScrolledRef.current = false;
  }, []);

  const scrollToMessage = useCallback((id: string) => {
    const el = document.getElementById(`msg-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('bg-muted/30');
      setTimeout(() => el.classList.remove('bg-muted/30'), 1500);
    }
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    const newCount = messages.length;
    if (newCount > lastMessageCountRef.current) {
      if (checkIfScrolledUp() && userScrolledRef.current) {
        setUnreadCount(prev => prev + (newCount - lastMessageCountRef.current));
      } else {
        scrollToBottom(false);
      }
    }
    lastMessageCountRef.current = newCount;
  }, [messages, checkIfScrolledUp, scrollToBottom]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSend(input, replyingTo || undefined);
      setInput('');
      setReplyingTo(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    onTyping();
  };

  const handleEditSubmit = useCallback((messageId: string) => {
    if (editText.trim()) onEdit(messageId, editText.trim());
    setEditingId(null);
    setEditText('');
  }, [editText, onEdit]);

  const handleEditCancel = useCallback(() => {
    setEditingId(null);
    setEditText('');
  }, []);

  const handleStartEdit = useCallback((id: string, text: string) => {
    setEditingId(id);
    setEditText(text);
  }, []);

  const handleNotificationToggle = useCallback(() => {
    setNotificationJiggle(true);
    setTimeout(() => setNotificationJiggle(false), 600);
    onToggleNotifications();
  }, [onToggleNotifications]);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) return;
    setUploading(true);
    setUploadProgress(0);
    setUploadComplete(false);
    await onSendImage(file, (p) => setUploadProgress(p));
    setUploadComplete(true);
    setTimeout(() => {
      setUploading(false);
      setUploadProgress(0);
      setUploadComplete(false);
    }, 400);
  }, [onSendImage]);

  const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); dragCounter.current++; setDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); dragCounter.current--; if (dragCounter.current === 0) setDragging(false); };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); dragCounter.current = 0; setDragging(false); const file = e.dataTransfer.files[0]; if (file) handleFileUpload(file); };

  const isInputDisabled = frozen && frozenBy !== currentUser;

  

  return (
    <div
      className="flex-1 flex flex-col h-screen min-w-0 relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {dragging && (
        <div className="absolute inset-0 z-40 bg-background/90 flex items-center justify-center pointer-events-none">
          <span className="text-foreground text-sm font-mono">Drop file to share</span>
        </div>
      )}

      {/* Header */}
      <header className="h-12 flex items-center justify-between px-4 shrink-0 bg-card">
        <span className="text-sm font-medium text-foreground font-mono cursor-default select-none">
          {currentUser}
        </span>
        <div className="flex items-center gap-1">
          <motion.button
            onClick={handleNotificationToggle}
            animate={notificationJiggle ? {
              rotate: [0, -15, 15, -12, 12, -6, 6, -2, 2, 0],
            } : { rotate: 0 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className={`p-2 rounded-md transition-colors ${notificationsEnabled ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {notificationsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          </motion.button>
          <button onClick={onLeave} className="p-2 rounded-md text-muted-foreground hover:text-foreground transition-all active:scale-[0.95] md:hidden">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {frozen && (
        <div className="px-4 py-1.5 bg-secondary text-center">
          <span className="text-[11px] text-muted-foreground">Chat frozen{frozenBy ? ` by ${frozenBy}` : ''}</span>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-2 relative">
        <AnimatePresence initial={false}>
          {!nuking && messages.map((msg, i) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              isOwn={msg.username === currentUser}
              index={i}
              currentTime={currentTime}
              onImageClick={setFullscreenImage}
              onInspectFile={setInspectedFile}
              onEdit={handleStartEdit}
              onUnsend={onUnsend}
              onReply={setReplyingTo}
              onReact={onReact}
              onScrollToMessage={scrollToMessage}
              editingId={editingId}
              editText={editText}
              onEditTextChange={setEditText}
              onEditSubmit={handleEditSubmit}
              onEditCancel={handleEditCancel}
            />
          ))}
        </AnimatePresence>

        {/* Nuke dissolve overlay */}
        <AnimatePresence>
          {nuking && (
            <>
              <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: 'easeIn' }}
                className="absolute inset-0 z-10"
              >
                {Array.from({ length: 40 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{
                      opacity: 1,
                      x: `${Math.random() * 100}%`,
                      y: `${(i / 40) * 100}%`,
                      scale: 1,
                    }}
                    animate={{
                      opacity: 0,
                      y: `${(i / 40) * 100 + 30 + Math.random() * 40}%`,
                      x: `${Math.random() * 100}%`,
                      scale: 0,
                      rotate: Math.random() * 360,
                    }}
                    transition={{
                      duration: 0.6 + Math.random() * 0.4,
                      delay: (i / 40) * 0.4,
                      ease: 'easeIn',
                    }}
                    className="absolute w-1 h-1 bg-foreground"
                  />
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.0, delay: 0.9 }}
                className="absolute inset-0 flex items-center justify-center z-20"
              >
                <span className="text-xs font-mono text-muted-foreground tracking-widest">
                  [SYSTEM]: ROOM NEUTRALIZED
                </span>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div ref={endRef} />
      </div>

      {/* Scroll to bottom */}
      <AnimatePresence>
        {isScrolledUp && unreadCount > 0 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            onClick={() => scrollToBottom(true)}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 w-12 h-12 rounded-full bg-background border border-foreground flex items-center justify-center text-foreground hover:bg-foreground hover:text-background transition-colors active:scale-[0.95] shadow-lg"
            aria-label="Scroll to bottom"
          >
            <ChevronDown className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-foreground text-background text-[10px] font-mono font-bold flex items-center justify-center border border-background">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div className="px-4 pb-1 flex items-center gap-2">
          <div className="bg-message-other rounded-2xl rounded-bl-sm px-3 py-2 flex items-center gap-1">
            <span className="typing-dot w-1.5 h-1.5 rounded-full bg-muted-foreground inline-block" />
            <span className="typing-dot w-1.5 h-1.5 rounded-full bg-muted-foreground inline-block" />
            <span className="typing-dot w-1.5 h-1.5 rounded-full bg-muted-foreground inline-block" />
          </div>
          <span className="text-[11px] text-muted-foreground">{typingUsers.join(', ')}</span>
        </div>
      )}

      {/* File input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_FILE_TYPES.join(',')}
        className="hidden"
        onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(file); e.target.value = ''; }}
      />

      {/* Reply preview bar */}
      {replyingTo && (
        <ReplyPreview replyTo={replyingTo} onCancel={() => setReplyingTo(null)} />
      )}

      {/* Input bar */}
      <form onSubmit={handleSubmit} className="p-3 shrink-0 relative">
        {uploading && (
          <div className="absolute top-0 left-3 right-3 h-[1px] bg-muted overflow-hidden">
            <motion.div
              className={`h-full bg-foreground ${uploadComplete ? '' : 'animate-pulse'}`}
              initial={{ width: '0%' }}
              animate={{
                width: `${uploadProgress}%`,
                opacity: uploadComplete ? [1, 1, 0] : 1,
              }}
              transition={{
                width: { duration: 0.2 },
                opacity: uploadComplete ? { duration: 0.4, times: [0, 0.5, 1] } : undefined,
              }}
            />
          </div>
        )}
        <div className="flex gap-1 items-center">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isInputDisabled}
            className="p-2.5 text-muted-foreground hover:text-foreground transition-all active:scale-[0.95] disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
          </button>
          <GifPicker onSelect={onSendGif} disabled={isInputDisabled} />
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder={isInputDisabled ? 'Chat is frozen' : 'Message'}
            disabled={isInputDisabled}
            className="flex-1 bg-input rounded-lg py-2.5 px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring transition-colors disabled:opacity-30 disabled:cursor-not-allowed font-sans"
            maxLength={2000}
          />
          <button
            type="submit"
            disabled={!input.trim() || isInputDisabled}
            className="bg-primary text-primary-foreground p-2.5 rounded-lg hover:opacity-90 transition-all active:scale-[0.95] disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Fullscreen image viewer */}
      {fullscreenImage && (
        <FullscreenImageViewer
          imageUrl={fullscreenImage}
          onClose={() => setFullscreenImage(null)}
        />
      )}

      {/* File inspector */}
      <AnimatePresence>
        {inspectedFile && (
          <FileInspector
            file={inspectedFile}
            onClose={() => setInspectedFile(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
