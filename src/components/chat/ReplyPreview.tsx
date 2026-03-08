import { memo } from 'react';
import { X } from 'lucide-react';
import type { ReplyTo } from '@/types/chat';

interface ReplyPreviewProps {
  replyTo: ReplyTo;
  onCancel: () => void;
}

export const ReplyPreview = memo(function ReplyPreview({ replyTo, onCancel }: ReplyPreviewProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 border-l-2 border-foreground/30 bg-muted/50 rounded-sm mx-3 mb-1">
      <div className="flex-1 min-w-0">
        <span className="text-[11px] font-mono text-foreground font-medium">{replyTo.username}</span>
        <p className="text-[11px] text-muted-foreground truncate">{replyTo.text || '[media]'}</p>
      </div>
      <button
        onClick={onCancel}
        className="p-0.5 text-muted-foreground hover:text-foreground transition-colors shrink-0"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
});
