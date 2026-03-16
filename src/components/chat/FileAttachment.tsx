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
      className={`flex items-center gap-2 p-3 border rounded-lg transition-colors active:scale-[0.95] mb-1.5 w-full border-white/10 hover:bg-white/5`}
    >
      <IconComponent className={`w-4 h-4 shrink-0 text-foreground`} />
      <span className={`text-sm font-mono truncate flex-1 text-left text-foreground`}>
        {fileName}
      </span>
    </motion.button>
  );
});
