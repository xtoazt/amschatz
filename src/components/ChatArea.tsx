import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bell, BellOff, LogOut, Plus, Check, CheckCheck, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GifPicker } from '@/components/GifPicker';
import { FullscreenImageViewer } from '@/components/FullscreenImageViewer';
import { ChatMessage } from '@/types/chat';
import { Progress } from '@/components/ui/progress';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from '@/components/ui/context-menu';

interface ChatAreaProps {
  messages: ChatMessage[];
  currentUser: string;
  roomCode: string;
  notificationsEnabled: boolean;
  typingUsers: string[];
  frozen: boolean;
  frozenBy: string | null;
  onSend: (text: string) => void;
  onTyping: () => void;
  onToggleNotifications: () => void;
  onLeave: () => void;
  onEdit: (messageId: string, newText: string) => void;
  onUnsend: (messageId: string) => void;
  onSendImage: (file: File, onProgress?: (p: number) => void) => void;
  onSendGif: (url: string) => void;
}

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

function isImageExpired(expiry?: number) {
  if (!expiry) return false;
  return Date.now() > expiry;
}

function StatusIcon({ status }: { status?: string }) {
  if (status === 'read') {
    return <CheckCheck className="w-3 h-3 text-primary inline-block" />;
  }
  if (status === 'delivered') {
    return <CheckCheck className="w-3 h-3 text-muted-foreground inline-block" />;
  }
  if (status === 'sent') {
    return <Check className="w-3 h-3 text-muted-foreground inline-block" />;
  }
  return null;
}

export function ChatArea({
  messages,
  currentUser,
  roomCode,
  notificationsEnabled,
  typingUsers,
  frozen,
  frozenBy,
  onSend,
  onTyping,
  onToggleNotifications,
  onLeave,
  onEdit,
  onUnsend,
  onSendImage,
  onSendGif,
}: ChatAreaProps) {
  const [input, setInput] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const lastMessageCountRef = useRef(messages.length);
  const userScrolledRef = useRef(false);

  const checkIfScrolledUp = useCallback(() => {
    if (!scrollContainerRef.current) return false;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const threshold = 100;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < threshold;
    return !isAtBottom;
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

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    const newMessageCount = messages.length;
    const hasNewMessages = newMessageCount > lastMessageCountRef.current;

    if (hasNewMessages) {
      const isUserScrolledUp = checkIfScrolledUp();

      if (isUserScrolledUp && userScrolledRef.current) {
        const newMessagesAdded = newMessageCount - lastMessageCountRef.current;
        setUnreadCount(prev => prev + newMessagesAdded);
      } else {
        scrollToBottom(false);
      }
    }

    lastMessageCountRef.current = newMessageCount;
  }, [messages, checkIfScrolledUp, scrollToBottom]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSend(input);
      setInput('');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    onTyping();
  };

  const handleEditSubmit = (messageId: string) => {
    if (editText.trim()) {
      onEdit(messageId, editText.trim());
    }
    setEditingId(null);
    setEditText('');
  };

  const handleFileUpload = useCallback(async (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) return;
    setUploading(true);
    setUploadProgress(0);
    await onSendImage(file, (p) => setUploadProgress(p));
    setUploading(false);
    setUploadProgress(0);
  }, [onSendImage]);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleImageClick = (imageUrl: string) => {
    setFullscreenImage(imageUrl);
  };

  const formatTime = (ts: number) =>
    new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

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
          <span className="text-foreground text-sm font-medium">Drop image to share</span>
        </div>
      )}

      <header className="h-12 flex items-center justify-between px-4 shrink-0 bg-card">
        <span className="text-sm font-medium text-foreground">{roomCode}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleNotifications}
            className={`p-2 rounded-md transition-colors ${notificationsEnabled ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {notificationsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          </button>
          <button onClick={onLeave} className="p-2 rounded-md text-muted-foreground hover:text-foreground transition-colors md:hidden">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {frozen && (
        <div className="px-4 py-1.5 bg-secondary text-center">
          <span className="text-[11px] text-muted-foreground">Chat frozen{frozenBy ? ` by ${frozenBy}` : ''}</span>
        </div>
      )}

      {uploading && (
        <div className="px-4 py-2">
          <Progress value={uploadProgress} className="h-1" />
        </div>
      )}

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-2">
        {messages.map((msg) => {
          if (msg.type === 'system') {
            return (
              <div key={msg.id} className="flex justify-center py-1">
                <span className="text-[11px] text-muted-foreground font-mono">{msg.text}</span>
              </div>
            );
          }

          if (msg.type === 'announcement') {
            return (
              <div key={msg.id} className="flex justify-center py-2">
                <span className="text-xs font-semibold text-foreground">{msg.text}</span>
              </div>
            );
          }

          if (msg.deleted) {
            return (
              <div key={msg.id} className={`flex ${msg.username === currentUser ? 'justify-end' : 'justify-start'}`}>
                <span className="text-[11px] italic text-muted-foreground px-3 py-2">Message deleted</span>
              </div>
            );
          }

          const isOwn = msg.username === currentUser;
          const imageExpired = isImageExpired(msg.imageExpiry);

          const bubble = (
            <div className="max-w-[75%] space-y-0.5">
              {!isOwn && (
                <span className="text-[11px] text-muted-foreground ml-1">{msg.username}</span>
              )}
              {editingId === msg.id ? (
                <div className="flex gap-1">
                  <input
                    autoFocus
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleEditSubmit(msg.id); if (e.key === 'Escape') { setEditingId(null); setEditText(''); } }}
                    className="flex-1 bg-input rounded-lg py-2 px-3 text-sm text-foreground outline-none"
                  />
                </div>
              ) : (
                <div
                  className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    isOwn
                      ? 'bg-message-own text-message-own-foreground rounded-br-sm'
                      : 'bg-message-other text-message-other-foreground rounded-bl-sm'
                  }`}
                >
                  {msg.imageUrl && !imageExpired && (
                    <div className="relative">
                      <img
                        src={msg.imageUrl}
                        alt="Shared image"
                        onClick={() => handleImageClick(msg.imageUrl!)}
                        className="max-w-full rounded-lg mb-1 border border-foreground/20 grayscale hover:grayscale-0 transition-all duration-300 cursor-pointer"
                        loading="lazy"
                      />
                      {!msg.text && (
                        <span className="absolute bottom-2 right-1.5 text-[8px] font-mono text-foreground/80 bg-background/60 px-1 py-0.5 rounded">via KLIPY</span>
                      )}
                    </div>
                  )}
                  {msg.imageUrl && imageExpired && (
                    <span className="text-[11px] italic text-muted-foreground">Image expired</span>
                  )}
                  {msg.text}
                </div>
              )}
              <div className={`flex items-center gap-1 ${isOwn ? 'justify-end mr-1' : 'ml-1'}`}>
                <span className="text-[10px] text-muted-foreground">{formatTime(msg.timestamp)}</span>
                {msg.edited && <span className="text-[10px] text-muted-foreground">· edited</span>}
                {isOwn && msg.status && (
                  <StatusIcon status={msg.status} />
                )}
              </div>
            </div>
          );

          if (isOwn) {
            return (
              <ContextMenu key={msg.id}>
                <ContextMenuTrigger asChild>
                  <div className="flex justify-end">{bubble}</div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem onSelect={() => { setEditingId(msg.id); setEditText(msg.text); }}>
                    Edit
                  </ContextMenuItem>
                  <ContextMenuItem onSelect={() => onUnsend(msg.id)}>
                    Unsend
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            );
          }

          return (
            <div key={msg.id} className="flex justify-start">{bubble}</div>
          );
        })}
        <div ref={endRef} />
      </div>

      <AnimatePresence>
        {isScrolledUp && unreadCount > 0 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ duration: 0.2 }}
            onClick={() => scrollToBottom(true)}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 w-12 h-12 rounded-full bg-black border border-white flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors shadow-lg"
            aria-label="Scroll to bottom"
          >
            <ChevronDown className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white text-black text-[10px] font-mono font-bold flex items-center justify-center border border-black">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {typingUsers.length > 0 && (
        <div className="px-4 pb-1 flex items-center gap-2">
          <div className="bg-message-other rounded-2xl rounded-bl-sm px-3 py-2 flex items-center gap-1">
            <span className="typing-dot w-1.5 h-1.5 rounded-full bg-muted-foreground inline-block" />
            <span className="typing-dot w-1.5 h-1.5 rounded-full bg-muted-foreground inline-block" />
            <span className="typing-dot w-1.5 h-1.5 rounded-full bg-muted-foreground inline-block" />
          </div>
          <span className="text-[11px] text-muted-foreground">
            {typingUsers.join(', ')}
          </span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file);
          e.target.value = '';
        }}
      />

      <form onSubmit={handleSubmit} className="p-3 shrink-0">
        <div className="flex gap-1 items-center">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isInputDisabled}
            className="p-2.5 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
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
            className="bg-primary text-primary-foreground p-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>

      {fullscreenImage && (
        <FullscreenImageViewer
          imageUrl={fullscreenImage}
          onClose={() => setFullscreenImage(null)}
        />
      )}
    </div>
  );
}
