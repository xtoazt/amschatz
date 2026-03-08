import { memo } from 'react';
import { motion } from 'framer-motion';

const REACTIONS = ['✓', '✗', '⚡', '👁', '🔥'];

interface ReactionPickerProps {
  onSelect: (emoji: string) => void;
}

export const ReactionPicker = memo(function ReactionPicker({ onSelect }: ReactionPickerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.12 }}
      className="flex gap-0.5 bg-card border border-border rounded-full px-1.5 py-0.5 shadow-md"
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
    </motion.div>
  );
});
