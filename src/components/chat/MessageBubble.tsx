import { memo } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage } from '@/types/chat';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from '@/components/ui/context-menu';
import { ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { StatusIcon } from './StatusIcon';
import { ImageAttachment } from './ImageAttachment';
import { FileAttachment } from './FileAttachment';
import { VideoAttachment } from './VideoAttachment';
import { isImageOrGif, isImageExpired, isVideo } from './FileHelpers';
import type { InspectedVideo } from './VideoInspector';
import { SelfDestructTimer } from './SelfDestructTimer';
import type { InspectedFile } from './FileInspector';
import type { ReplyTo } from '@/types/chat';

export interface MessageGroupInfo {
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
}

interface MessageBubbleProps {
  msg: ChatMessage;
  isOwn: boolean;
  currentUser: string;
  index: number;
  groupInfo: MessageGroupInfo;
  onImageClick: (url: string) => void;
  onInspectFile: (file: InspectedFile) => void;
  onInspectVideo: (video: InspectedVideo) => void;
  onEdit: (id: string, text: string) => void;
  onUnsend: (id: string) => void;
  onReply: (replyTo: ReplyTo) => void;
  onScrollToMessage?: (id: string) => void;
  editingId: string | null;
  editText: string;
  onEditTextChange: (text: string) => void;
  onEditSubmit: (id: string) => void;
  onEditCancel: () => void;
}

const URL_RE = /https?:\/\/[^\s<>"')\]]+/g;

function renderMessageText(text: string) {
  const parts: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  URL_RE.lastIndex = 0;
  while ((match = URL_RE.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    const url = match[0];
    parts.push(
      <a key={match.index} href={url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 decoration-current/40 hover:decoration-current inline-flex items-baseline gap-0.5 break-all">
        {url}<ExternalLink className="w-2.5 h-2.5 inline shrink-0 translate-y-[1px]" />
      </a>
    );
    lastIndex = match.index + url.length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts.length > 0 ? parts : text;
}

const formatTime = (ts: number) =>
  new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const messageVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.96, filter: 'blur(2px)' },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      type: 'spring' as const,
      stiffness: 380,
      damping: 28,
      mass: 0.8,
      delay: Math.min(i * 0.02, 0.2),
    },
  }),
};

function getBubbleRadius(isOwn: boolean, groupInfo: MessageGroupInfo) {
  const { isFirstInGroup, isLastInGroup } = groupInfo;
  
  if (isOwn) {
    if (isFirstInGroup && isLastInGroup) return 'rounded-2xl rounded-br-sm';
    if (isFirstInGroup) return 'rounded-2xl rounded-br-md';
    if (isLastInGroup) return 'rounded-2xl rounded-tr-md rounded-br-sm';
    return 'rounded-2xl rounded-tr-md rounded-br-md';
  } else {
    if (isFirstInGroup && isLastInGroup) return 'rounded-2xl rounded-bl-sm';
    if (isFirstInGroup) return 'rounded-2xl rounded-bl-md';
    if (isLastInGroup) return 'rounded-2xl rounded-tl-md rounded-bl-sm';
    return 'rounded-2xl rounded-tl-md rounded-bl-md';
  }
}

export const MessageBubble = memo(function MessageBubble({
  msg,
  isOwn,
  currentUser,
  index,
  groupInfo,
  onImageClick,
  onInspectFile,
  onInspectVideo,
  onEdit,
  onUnsend,
  onReply,
  onScrollToMessage,
  editingId,
  editText,
  onEditTextChange,
  onEditSubmit,
  onEditCancel,
}: MessageBubbleProps) {

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
  const isFileVideo = msg.fileUrl ? isVideo(msg.fileUrl, msg.fileMimeType) : false;
  const isFileImageOrGif = msg.fileUrl ? isImageOrGif(msg.fileUrl, msg.fileMimeType) : true;
  const showUsername = !isOwn && groupInfo.isFirstInGroup;
  const radiusClass = getBubbleRadius(isOwn, groupInfo);

  const bubble = (
    <div className={`max-w-[75%] space-y-0.5 ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
      {showUsername && (
        <span className="text-[11px] text-muted-foreground ml-1">{msg.username}</span>
      )}

      {msg.replyTo && (
        <div
          className="ml-1 mb-0.5 border-l-2 border-muted-foreground/30 pl-2 py-0.5 cursor-pointer"
          onClick={() => onScrollToMessage?.(msg.replyTo!.id)}
        >
          <span className="text-[10px] font-mono text-muted-foreground font-medium">{msg.replyTo.username}</span>
          <p className="text-[10px] text-muted-foreground/60 truncate max-w-[200px]">{msg.replyTo.text || '[media]'}</p>
        </div>
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
          className={`px-3 py-2 text-sm leading-relaxed transition-[filter] duration-150 hover:brightness-110 w-fit max-w-full select-none ${radiusClass} ${
            isOwn
              ? 'bg-message-own text-message-own-foreground'
              : 'bg-message-other text-message-other-foreground'
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
          {hasFile && isFileVideo && (
            <VideoAttachment
              fileUrl={msg.fileUrl!}
              fileName={msg.fileName!}
              isOwn={isOwn}
              onOpen={() => onInspectVideo({ name: msg.fileName!, size: msg.fileSize, url: msg.fileUrl!, mimeType: msg.fileMimeType, timestamp: msg.timestamp })}
            />
          )}
          {hasFile && !isFileImageOrGif && !isFileVideo && (
            <FileAttachment
              fileName={msg.fileName!}
              fileSize={msg.fileSize}
              fileMimeType={msg.fileMimeType}
              isOwn={isOwn}
              onInspect={() => onInspectFile({ name: msg.fileName!, size: msg.fileSize, url: msg.fileUrl!, mimeType: msg.fileMimeType, timestamp: msg.timestamp })}
            />
          )}
          {msg.text && renderMessageText(msg.text)}
        </div>
      )}

      {groupInfo.isLastInGroup && (
        <div className={`flex items-center gap-1 ${isOwn ? 'justify-end mr-1' : 'ml-1'}`}>
          <span className="text-[10px] text-muted-foreground">{formatTime(msg.timestamp)}</span>
          {msg.edited && <span className="text-[10px] text-muted-foreground">· edited</span>}
          {isOwn && msg.status && <StatusIcon status={msg.status} />}
          <SelfDestructTimer timestamp={msg.timestamp} />
        </div>
      )}

    </div>
  );

  const contextMenuItems = (
    <ContextMenuContent>
      {isOwn && <ContextMenuItem onSelect={() => onEdit(msg.id, msg.text)}>Edit</ContextMenuItem>}
      {isOwn && <ContextMenuItem onSelect={() => onUnsend(msg.id)}>Unsend</ContextMenuItem>}
      <ContextMenuItem onSelect={() => onReply({ id: msg.id, username: msg.username, text: msg.text.slice(0, 100) })}>
        Reply
      </ContextMenuItem>
      {msg.text && (
        <ContextMenuItem onSelect={() => { navigator.clipboard.writeText(msg.text); toast('Copied to clipboard', { duration: 1500 }); }}>
          Copy
        </ContextMenuItem>
      )}
    </ContextMenuContent>
  );

  return (
    <motion.div
      id={`msg-${msg.id}`}
      variants={messageVariants}
      initial="hidden"
      animate="visible"
      custom={index}
      className={groupInfo.isFirstInGroup ? 'mt-2' : 'mt-0.5'}
    >
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className={`group flex items-center gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            {isOwn && !groupInfo.isLastInGroup && (
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[10px] font-mono text-muted-foreground whitespace-nowrap select-none">
                {formatTime(msg.timestamp)}
              </span>
            )}
            {bubble}
            {!isOwn && !groupInfo.isLastInGroup && (
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[10px] font-mono text-muted-foreground whitespace-nowrap select-none">
                {formatTime(msg.timestamp)}
              </span>
            )}
          </div>
        </ContextMenuTrigger>
        {contextMenuItems}
      </ContextMenu>
    </motion.div>
  );
});
