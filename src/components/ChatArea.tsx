import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bell, BellOff, LogOut, Plus, Check, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GifPicker } from '@/components/GifPicker';
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

const messageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24, duration: 0.4 } },
  exit: { opacity: 0, transition: { duration: 0.6 } },
};

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
  const endRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const formatTime = (ts: number) =>
    new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const isInputDisabled = frozen && frozenBy !== currentUser;

  return (
    <div
      className="flex-1 flex flex-col h-screen min-w-0 relative border-l border-border"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {dragging && (
        <div className="absolute inset-0 z-40 bg-background/90 flex items-center justify-center pointer-events-none border border-foreground">
          <span className="text-foreground text-sm font-mono">Drop image to share</span>
        </div>
      )}

      <header className="h-12 flex items-center justify-between px-4 shrink-0 bg-card border-b border-border">
        <span className="text-sm font-mono text-foreground glitch-text tracking-widest uppercase">{roomCode}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleNotifications}
            className={`p-2 transition-colors ${notificationsEnabled ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {notificationsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          </button>
          <button onClick={onLeave} className="p-2 text-muted-foreground hover:text-foreground transition-colors md:hidden">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {frozen && (
        <div className="px-4 py-1.5 bg-secondary text-center border-b border-border">
          <span className="text-[11px] text-muted-foreground font-mono">Chat frozen{frozenBy ? ` by ${frozenBy}` : ''}</span>
        </div>
      )}

      {uploading && (
        <div className="px-4 py-2">
          <Progress value={uploadProgress} className="h-px" />
        </div>
      )}

      <div className="flex-1 overflow-y-auto scrollbar-void p-4 space-y-2">
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            if (msg.type === 'system') {
              return (
                <motion.div
                  key={msg.id}
                  variants={messageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  layout
                  className="flex justify-center py-1"
                >
                  <span className="text-[11px] text-muted-foreground font-mono">{msg.text}</span>
                </motion.div>
              );
            }

            if (msg.type === 'announcement') {
              return (
                <motion.div
                  key={msg.id}
                  variants={messageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  layout
                  className="flex justify-center py-2"
                >
                  <span className="text-xs font-semibold text-foreground font-mono">{msg.text}</span>
                </motion.div>
              );
            }

            if (msg.deleted) {
              return (
                <motion.div
                  key={msg.id}
                  variants={messageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  layout
                  className={`flex ${msg.username === currentUser ? 'justify-end' : 'justify-start'}`}
                >
                  <span className="text-[11px] italic text-muted-foreground px-3 py-2 font-mono">Message deleted</span>
                </motion.div>
              );
            }

            const isOwn = msg.username === currentUser;
            const imageExpired = isImageExpired(msg.imageExpiry);

            const bubble = (
              <div className="max-w-[75%] space-y-0.5">
                {!isOwn && (
                  <span className="text-[11px] text-muted-foreground ml-1 font-mono">{msg.username}</span>
                )}
                {editingId === msg.id ? (
                  <div className="flex gap-1">
                    <input
                      autoFocus
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleEditSubmit(msg.id); if (e.key === 'Escape') { setEditingId(null); setEditText(''); } }}
                      className="flex-1 bg-input py-2 px-3 text-sm text-foreground outline-none border border-border font-mono input-glow"
                    />
                  </div>
                ) : (
                  <div
                    className={`px-3 py-2 text-sm leading-relaxed ${
                      isOwn
                        ? 'bg-message-own text-message-own-foreground'
                        : 'bg-message-other text-message-other-foreground'
                    }`}
                  >
                    {msg.imageUrl && !imageExpired && (
                      <div className="relative">
                        <img
                          src={msg.imageUrl}
                          alt="Shared image"
                          className="max-w-full mb-1 border border-foreground/20 grayscale hover:grayscale-0 transition-all duration-300 cursor-pointer"
                          loading="lazy"
                        />
                        {!msg.text && (
                          <span className="absolute bottom-2 right-1.5 text-[8px] font-mono text-foreground/80 bg-background/60 px-1 py-0.5">via KLIPY</span>
                        )}
                      </div>
                    )}
                    {msg.imageUrl && imageExpired && (
                      <span className="text-[11px] italic text-muted-foreground font-mono">Image expired</span>
                    )}
                    {msg.text}
                  </div>
                )}
                <div className={`flex items-center gap-1 ${isOwn ? 'justify-end mr-1' : 'ml-1'}`}>
                  <span className="text-[10px] text-muted-foreground font-mono">{formatTime(msg.timestamp)}</span>
                  {msg.edited && <span className="text-[10px] text-muted-foreground font-mono">· edited</span>}
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
                    <motion.div
                      variants={messageVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      layout
                      className="flex justify-end"
                    >
                      {bubble}
                    </motion.div>
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
              <motion.div
                key={msg.id}
                variants={messageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                layout
                className="flex justify-start"
              >
                {bubble}
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={endRef} />
      </div>

      {typingUsers.length > 0 && (
        <div className="px-4 pb-2 flex items-center gap-2">
          <div className="w-8 h-px bg-foreground typing-line" />
          <span className="text-[11px] text-muted-foreground font-mono">
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

      <form onSubmit={handleSubmit} className="p-3 shrink-0 border-t border-border">
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
            className="flex-1 bg-input py-2.5 px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border transition-all font-mono input-glow disabled:opacity-30 disabled:cursor-not-allowed"
            maxLength={2000}
          />
          <button
            type="submit"
            disabled={!input.trim() || isInputDisabled}
            className="btn-invert p-2.5"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
