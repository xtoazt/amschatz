import { memo } from 'react';
import { motion } from 'framer-motion';
import { ChatMessage } from '@/types/chat';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from '@/components/ui/context-menu';
import { StatusIcon } from './StatusIcon';
import { ImageAttachment } from './ImageAttachment';
import { FileAttachment } from './FileAttachment';
import { isImageOrGif, isImageExpired } from './FileHelpers';
import type { InspectedFile } from './FileInspector';

interface MessageBubbleProps {
  msg: ChatMessage;
  isOwn: boolean;
  // currentUser kept for potential future use
  index: number;
  onImageClick: (url: string) => void;
  onInspectFile: (file: InspectedFile) => void;
  onEdit: (id: string, text: string) => void;
  onUnsend: (id: string) => void;
  editingId: string | null;
  editText: string;
  onEditTextChange: (text: string) => void;
  onEditSubmit: (id: string) => void;
  onEditCancel: () => void;
}

const formatTime = (ts: number) =>
  new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const messageVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.25,
      delay: Math.min(i * 0.03, 0.3),
      ease: 'easeOut' as const,
    },
  }),
};

export const MessageBubble = memo(function MessageBubble({
  msg,
  isOwn,
  
  index,
  onImageClick,
  onInspectFile,
  onEdit,
  onUnsend,
  editingId,
  editText,
  onEditTextChange,
  onEditSubmit,
  onEditCancel,
}: MessageBubbleProps) {
  // System messages
  if (msg.type === 'system') {
    return (
      <motion.div
        key={msg.id}
        variants={messageVariants}
        initial="hidden"
        animate="visible"
        custom={index}
        className="flex justify-center py-1"
      >
        <span className="text-[11px] text-muted-foreground font-mono">{msg.text}</span>
      </motion.div>
    );
  }

  // Announcements
  if (msg.type === 'announcement') {
    return (
      <motion.div
        key={msg.id}
        variants={messageVariants}
        initial="hidden"
        animate="visible"
        custom={index}
        className="flex justify-center py-2"
      >
        <span className="text-xs font-semibold text-foreground">{msg.text}</span>
      </motion.div>
    );
  }

  // Deleted messages
  if (msg.deleted) {
    return (
      <motion.div
        key={msg.id}
        variants={messageVariants}
        initial="hidden"
        animate="visible"
        custom={index}
        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
      >
        <span className="text-[11px] italic text-muted-foreground px-3 py-2">Message deleted</span>
      </motion.div>
    );
  }

  const imageExpired = isImageExpired(msg.imageExpiry);
  const hasFile = !!(msg.fileUrl && msg.fileName);
  const isFileImageOrGif = msg.fileUrl ? isImageOrGif(msg.fileUrl, msg.fileMimeType) : true;

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
            onChange={(e) => onEditTextChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onEditSubmit(msg.id);
              if (e.key === 'Escape') onEditCancel();
            }}
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
          {msg.imageUrl && (
            <ImageAttachment
              imageUrl={msg.imageUrl}
              hasText={!!msg.text}
              expired={imageExpired}
              onImageClick={onImageClick}
            />
          )}
          {hasFile && !isFileImageOrGif && (
            <FileAttachment
              fileName={msg.fileName!}
              fileSize={msg.fileSize}
              fileMimeType={msg.fileMimeType}
              isOwn={isOwn}
              onInspect={() => onInspectFile({ name: msg.fileName!, size: msg.fileSize, url: msg.fileUrl! })}
            />
          )}
          {msg.text}
        </div>
      )}
      <div className={`flex items-center gap-1 ${isOwn ? 'justify-end mr-1' : 'ml-1'}`}>
        <span className="text-[10px] text-muted-foreground">{formatTime(msg.timestamp)}</span>
        {msg.edited && <span className="text-[10px] text-muted-foreground">· edited</span>}
        {isOwn && msg.status && <StatusIcon status={msg.status} />}
      </div>
    </div>
  );

  if (isOwn) {
    return (
      <motion.div
        variants={messageVariants}
        initial="hidden"
        animate="visible"
        custom={index}
      >
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div className="flex justify-end">{bubble}</div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onSelect={() => onEdit(msg.id, msg.text)}>Edit</ContextMenuItem>
            <ContextMenuItem onSelect={() => onUnsend(msg.id)}>Unsend</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={messageVariants}
      initial="hidden"
      animate="visible"
      custom={index}
      className="flex justify-start"
    >
      {bubble}
    </motion.div>
  );
});
