import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

const REACTIONS = ['✓', '✗', '⚡', '👁', '🔥'];

const EMOJI_CATEGORIES = [
  { label: 'Smileys', emojis: ['😀','😂','🥹','😍','🤩','😎','🤔','😏','😤','😭','🥺','💀','🫡','🤝'] },
  { label: 'Hands', emojis: ['👍','👎','👏','🙌','🤙','✌️','🫶','💪','🖕'] },
  { label: 'Hearts', emojis: ['❤️','🖤','💜','💚','💙','🤍','💔','❤️‍🔥'] },
  { label: 'Objects', emojis: ['⭐','💯','🔥','💎','🎯','🏆','🚀','💡','⚡','🎉'] },
  { label: 'Symbols', emojis: ['✅','❌','⚠️','❓','💤','🔒','👀','🫥'] },
];

interface ReactionPickerProps {
  onSelect: (emoji: string) => void;
}

export const ReactionPicker = memo(function ReactionPicker({ onSelect }: ReactionPickerProps) {
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.12 }}
      className="flex gap-0.5 bg-card border border-border rounded-full px-1.5 py-0.5 shadow-md items-center"
    >
      {REACTIONS.map(emoji => (
        <button
          key={emoji}
          onClick={() => onSelect(emoji)}
          className="w-7 h-7 flex items-center justify-center rounded-full text-sm hover:bg-muted transition-colors active:scale-[0.9]"
        >
          {emoji}
        </button>
      ))}
      <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
        <PopoverTrigger asChild>
          <button className="w-7 h-7 flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors active:scale-[0.9]">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2" side="top" align="start">
          <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
            {EMOJI_CATEGORIES.map(cat => (
              <div key={cat.label}>
                <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider px-1">{cat.label}</span>
                <div className="flex flex-wrap gap-0.5 mt-0.5">
                  {cat.emojis.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => { onSelect(emoji); setEmojiPickerOpen(false); }}
                      className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted transition-colors text-sm active:scale-[0.85]"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </motion.div>
  );
});
