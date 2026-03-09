import { memo } from 'react';
import { motion } from 'framer-motion';
import { getFileIcon, formatFileSize } from './FileHelpers';

interface FileAttachmentProps {
  fileName: string;
  fileSize?: number;
  fileMimeType?: string;
  isOwn: boolean;
  onInspect: () => void;
}

export const FileAttachment = memo(function FileAttachment({ fileName, fileSize, fileMimeType, isOwn, onInspect }: FileAttachmentProps) {
  const IconComponent = getFileIcon(fileMimeType, fileName);

  return (
    <motion.button
      onClick={onInspect}
      whileHover={{ y: -1, boxShadow: '0 0 10px rgba(255,255,255,0.15)' }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`flex items-center gap-2 p-2.5 border transition-colors active:scale-[0.95] mb-1 w-full ${
        isOwn
          ? 'border-message-own-foreground/30 hover:bg-message-own-foreground/10'
          : 'border-message-other-foreground/30 hover:bg-message-other-foreground/10'
      }`}
    >
      <IconComponent className={`w-4 h-4 shrink-0 ${isOwn ? 'text-message-own-foreground' : 'text-message-other-foreground'}`} />
      <span className={`text-xs font-mono truncate flex-1 text-left ${isOwn ? 'text-message-own-foreground' : 'text-message-other-foreground'}`}>
        {fileName}
      </span>
      {fileSize !== undefined && (
        <span className={`text-[10px] font-mono shrink-0 ${isOwn ? 'text-message-own-foreground/60' : 'text-message-other-foreground/60'}`}>
          {formatFileSize(fileSize)}
        </span>
      )}
    </motion.button>
  );
});
