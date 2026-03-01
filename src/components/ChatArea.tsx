import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send, Download, Bell, BellOff, LogOut, ImagePlus, Smile,
  Pencil, Trash2, Check, X,
} from 'lucide-react';
import { ChatMessage } from '@/types/chat';
import { GifPicker } from './GifPicker';
import { ImageLightbox } from './ImageLightbox';
import { validateImageFile, compressImageToDataUrl } from '@/lib/image-utils';

interface ChatAreaProps {
  messages: ChatMessage[];
  currentUser: string;
  roomCode: string;
  notificationsEnabled: boolean;
  typingUsers: string[];
  onSend: (text: string) => void;
  onSendImage: (dataUrl: string, mimeType: string) => void;
  onSendGif: (gifUrl: string, gifPreviewUrl: string, gifTitle: string) => void;
  onEdit: (messageId: string, newText: string) => void;
  onUnsend: (messageId: string) => void;
  onTyping: () => void;
  onExport: () => void;
  onToggleNotifications: () => void;
  onLeave: () => void;
  onPurge: () => void;
}

export function ChatArea({
  messages,
  currentUser,
  roomCode,
  notificationsEnabled,
  typingUsers,
  onSend,
  onSendImage,
  onSendGif,
  onEdit,
  onUnsend,
  onTyping,
  onExport,
  onToggleNotifications,
  onLeave,
  onPurge,
}: ChatAreaProps) {
  const [input, setInput] = useState('');
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  // Message actions hover state
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  // Purge confirmation
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const gifButtonRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus edit input when entering edit mode
  useEffect(() => {
    if (editingId) {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }
  }, [editingId]);

  // Ctrl+Shift+Q = purge confirm dialog
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'Q') {
        e.preventDefault();
        setShowPurgeConfirm(true);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

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

  // Image selection via file input or paste/drag-drop
  const processImageFile = useCallback(async (file: File) => {
    setImageError(null);
    const err = validateImageFile(file);
    if (err) {
      setImageError(err);
      setTimeout(() => setImageError(null), 4000);
      return;
    }
    try {
      const dataUrl = await compressImageToDataUrl(file);
      onSendImage(dataUrl, file.type);
    } catch {
      setImageError('Failed to process image.');
      setTimeout(() => setImageError(null), 4000);
    }
  }, [onSendImage]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
    // Reset so the same file can be picked again
    e.target.value = '';
  };

  // Paste image from clipboard
  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = Array.from(e.clipboardData?.items ?? []);
    const imageItem = items.find(i => i.type.startsWith('image/'));
    if (imageItem) {
      const file = imageItem.getAsFile();
      if (file) {
        e.preventDefault();
        processImageFile(file);
      }
    }
  }, [processImageFile]);

  // Drag and drop image onto the entire chat area
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) processImageFile(file);
  }, [processImageFile]);

  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  // Edit helpers
  const startEdit = (msg: ChatMessage) => {
    setEditingId(msg.id);
    setEditValue(msg.text);
  };

  const commitEdit = () => {
    if (editingId && editValue.trim()) {
      onEdit(editingId, editValue);
    }
    setEditingId(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); commitEdit(); }
    if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); }
  };

  const formatTime = (ts: number) =>
    new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const statusLabel = (s?: string) => {
    if (s === 'read') return 'Read';
    if (s === 'delivered') return 'Delivered';
    return '';
  };

  return (
    <div
      className="flex-1 flex flex-col h-screen min-w-0"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Header */}
      <header className="h-12 flex items-center justify-between px-4 shrink-0 bg-card">
        <span className="text-sm font-medium text-foreground">{roomCode}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleNotifications}
            className={`p-2 rounded-md transition-colors ${notificationsEnabled ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            aria-label={notificationsEnabled ? 'Disable notifications' : 'Enable notifications'}
          >
            {notificationsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          </button>
          <button
            onClick={onExport}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Export chat history"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={onLeave}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground transition-colors md:hidden"
            aria-label="Leave room"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-2">
        {messages.map((msg) => {
          if (msg.type === 'system') {
            return (
              <div key={msg.id} className="flex justify-center py-1">
                <span className="text-[11px] text-muted-foreground">{msg.text}</span>
              </div>
            );
          }

          const isOwn = msg.username === currentUser;
          const isEditing = editingId === msg.id;

          // Unsent tombstone
          if (msg.unsent) {
            return (
              <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[75%] space-y-0.5">
                  {!isOwn && (
                    <span className="text-[11px] text-muted-foreground ml-1">{msg.username}</span>
                  )}
                  <div
                    className={`px-3 py-2 rounded-2xl text-sm italic ${
                      isOwn
                        ? 'bg-message-own text-message-own-foreground/40 rounded-br-sm'
                        : 'bg-message-other text-message-other-foreground/40 rounded-bl-sm'
                    }`}
                  >
                    Message unsent
                  </div>
                  <div className={`flex items-center gap-1 ${isOwn ? 'justify-end mr-1' : 'ml-1'}`}>
                    <span className="text-[10px] text-muted-foreground">{formatTime(msg.timestamp)}</span>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              onMouseEnter={() => setHoveredId(msg.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <div className={`flex items-end gap-1.5 max-w-[75%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Action buttons (own messages only, hover) */}
                {isOwn && !msg.unsent && hoveredId === msg.id && !isEditing && (
                  <div className="flex flex-col gap-0.5 mb-5 shrink-0">
                    {msg.type === 'message' && (
                      <button
                        onClick={() => startEdit(msg)}
                        className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Edit message"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      onClick={() => onUnsend(msg.id)}
                      className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Unsend message"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <div className="space-y-0.5 min-w-0">
                  {!isOwn && (
                    <span className="text-[11px] text-muted-foreground ml-1">{msg.username}</span>
                  )}

                  {/* Image message */}
                  {msg.type === 'image' && msg.imageDataUrl && (
                    <button
                      onClick={() => setLightboxSrc(msg.imageDataUrl!)}
                      className="block rounded-xl overflow-hidden hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      aria-label="View full image"
                    >
                      <img
                        src={msg.imageDataUrl}
                        alt="Sent image"
                        className="max-w-[240px] max-h-[320px] block object-cover rounded-xl"
                        loading="lazy"
                      />
                    </button>
                  )}

                  {/* GIF message */}
                  {msg.type === 'gif' && (msg.gifUrl || msg.gifPreviewUrl) && (
                    <button
                      onClick={() => setLightboxSrc(msg.gifUrl ?? msg.gifPreviewUrl!)}
                      className="block rounded-xl overflow-hidden hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      aria-label="View full GIF"
                    >
                      <img
                        src={msg.gifPreviewUrl ?? msg.gifUrl!}
                        alt={msg.gifTitle ?? 'GIF'}
                        className="max-w-[240px] block rounded-xl"
                        loading="lazy"
                      />
                    </button>
                  )}

                  {/* Text message / inline edit */}
                  {msg.type === 'message' && (
                    isEditing ? (
                      <div className="flex items-center gap-1">
                        <input
                          ref={editInputRef}
                          type="text"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onKeyDown={handleEditKeyDown}
                          className="bg-input rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring min-w-[160px]"
                          maxLength={2000}
                          aria-label="Edit message text"
                        />
                        <button
                          onClick={commitEdit}
                          className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                          aria-label="Confirm edit"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                          aria-label="Cancel edit"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div
                        className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                          isOwn
                            ? 'bg-message-own text-message-own-foreground rounded-br-sm'
                            : 'bg-message-other text-message-other-foreground rounded-bl-sm'
                        }`}
                      >
                        {msg.text}
                      </div>
                    )
                  )}

                  {/* Timestamp + status + edited label */}
                  {!isEditing && (
                    <div className={`flex items-center gap-1 ${isOwn ? 'justify-end mr-1' : 'ml-1'}`}>
                      <span className="text-[10px] text-muted-foreground">{formatTime(msg.timestamp)}</span>
                      {msg.edited && (
                        <span className="text-[10px] text-muted-foreground">· edited</span>
                      )}
                      {isOwn && msg.status && (
                        <span className="text-[10px] text-muted-foreground">· {statusLabel(msg.status)}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Typing indicator */}
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

      {/* Image error toast */}
      {imageError && (
        <div className="mx-3 mb-2 px-3 py-2 rounded-lg bg-destructive/20 border border-destructive/30 text-destructive-foreground text-xs">
          {imageError}
        </div>
      )}

      {/* Input area */}
      <form onSubmit={handleSubmit} className="p-3 shrink-0">
        <div className="flex gap-2 items-center relative">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileChange}
            className="hidden"
            aria-hidden="true"
          />

          {/* Image upload button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors shrink-0"
            aria-label="Upload image"
          >
            <ImagePlus className="w-4 h-4" />
          </button>

          {/* GIF picker button */}
          <div className="relative shrink-0">
            <button
              ref={gifButtonRef}
              type="button"
              onClick={() => setShowGifPicker(v => !v)}
              className={`p-2 rounded-lg transition-colors ${showGifPicker ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              aria-label="Open GIF picker"
              aria-expanded={showGifPicker}
            >
              <Smile className="w-4 h-4" />
            </button>

            {showGifPicker && (
              <GifPicker
                onSelect={onSendGif}
                onClose={() => setShowGifPicker(false)}
              />
            )}
          </div>

          {/* Text input */}
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Message"
            className="flex-1 bg-input rounded-lg py-2.5 px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring transition-colors"
            maxLength={2000}
          />

          {/* Send button */}
          <button
            type="submit"
            disabled={!input.trim()}
            className="bg-primary text-primary-foreground p-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-20 disabled:cursor-not-allowed shrink-0"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Lightbox */}
      {lightboxSrc && (
        <ImageLightbox
          src={lightboxSrc}
          alt="Full image"
          onClose={() => setLightboxSrc(null)}
        />
      )}

      {/* Purge confirmation dialog */}
      {showPurgeConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          role="dialog"
          aria-modal="true"
          aria-labelledby="purge-dialog-title"
        >
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-xs shadow-2xl space-y-4">
            <div>
              <h2 id="purge-dialog-title" className="text-sm font-medium text-foreground">Purge session?</h2>
              <p className="text-xs text-muted-foreground mt-1">
                This will clear all messages for everyone in the room. This cannot be undone.
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowPurgeConfirm(false)}
                className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowPurgeConfirm(false);
                  onPurge();
                }}
                className="px-3 py-1.5 rounded-lg text-sm bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity"
              >
                Purge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
