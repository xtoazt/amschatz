import { memo, useState, useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

const EMOJI_MAP: Record<string, string[]> = {
  '👍': ['thumbs up', 'like', 'yes', 'ok', 'good', 'approve'],
  '👎': ['thumbs down', 'dislike', 'no', 'bad', 'disapprove'],
  '❤️': ['heart', 'love', 'red heart'],
  '😂': ['laugh', 'lol', 'funny', 'cry laugh', 'tears', 'haha'],
  '😭': ['cry', 'sad', 'sobbing', 'tears'],
  '💀': ['skull', 'dead', 'dying', 'im dead'],
  '🔥': ['fire', 'hot', 'lit', 'flame'],
  '💯': ['hundred', '100', 'perfect', 'score'],
  '😍': ['heart eyes', 'love', 'crush', 'adore'],
  '🙏': ['pray', 'please', 'thanks', 'hope', 'grateful'],
  '👀': ['eyes', 'look', 'see', 'watching', 'stare'],
  '😤': ['angry', 'mad', 'frustrated', 'huff'],
  '🥺': ['pleading', 'puppy', 'sad', 'cute', 'uwu'],
  '😀': ['smile', 'happy', 'grin'],
  '😆': ['laugh', 'haha', 'lol', 'grin squint'],
  '🤣': ['rofl', 'laugh', 'rolling', 'lmao'],
  '😅': ['sweat', 'nervous', 'awkward', 'heh'],
  '🥹': ['hold back tears', 'emotional', 'touched'],
  '🤩': ['star eyes', 'excited', 'starstruck', 'wow'],
  '😎': ['cool', 'sunglasses', 'chill'],
  '🤔': ['think', 'thinking', 'hmm', 'wondering'],
  '😏': ['smirk', 'sly', 'suggestive'],
  '🫡': ['salute', 'respect', 'sir', 'aye'],
  '🤝': ['handshake', 'deal', 'agree', 'respect'],
  '👏': ['clap', 'applause', 'bravo', 'congrats'],
  '🙌': ['hands up', 'celebration', 'praise', 'yay'],
  '🤙': ['call', 'hang loose', 'shaka'],
  '✌️': ['peace', 'victory', 'two'],
  '🫶': ['heart hands', 'love', 'care'],
  '💪': ['strong', 'muscle', 'flex', 'power', 'bicep'],
  '🖕': ['middle finger', 'flip off', 'fuck'],
  '💜': ['purple heart', 'love'],
  '💚': ['green heart', 'love'],
  '💙': ['blue heart', 'love'],
  '🖤': ['black heart', 'dark', 'love'],
  '🤍': ['white heart', 'love', 'pure'],
  '💔': ['broken heart', 'heartbreak', 'sad'],
  '❤️‍🔥': ['heart fire', 'burning', 'passion'],
  '⭐': ['star', 'favorite', 'bookmark'],
  '💎': ['diamond', 'gem', 'precious', 'rare'],
  '🎯': ['target', 'bullseye', 'goal', 'direct hit'],
  '🏆': ['trophy', 'winner', 'champion', 'award'],
  '🚀': ['rocket', 'launch', 'go', 'fast', 'ship'],
  '💡': ['bulb', 'idea', 'light', 'thought'],
  '🎉': ['party', 'celebrate', 'confetti', 'tada'],
  '✅': ['check', 'done', 'complete', 'yes'],
  '❌': ['cross', 'no', 'wrong', 'cancel', 'delete'],
  '⚠️': ['warning', 'caution', 'alert'],
  '❓': ['question', 'what', 'huh'],
  '💤': ['sleep', 'zzz', 'tired', 'boring'],
  '🔒': ['lock', 'secure', 'private', 'secret'],
  '🫥': ['dotted face', 'invisible', 'hidden', 'blank'],
  '😈': ['devil', 'evil', 'naughty', 'mischief'],
  '💅': ['nail', 'slay', 'queen', 'fabulous', 'periodt'],
  '🤡': ['clown', 'fool', 'joke'],
  '🫠': ['melt', 'melting', 'overwhelmed'],
  '😮‍💨': ['exhale', 'relief', 'sigh', 'phew'],
  '🤯': ['mind blown', 'shocked', 'explode', 'wow'],
  '😴': ['sleep', 'sleepy', 'tired', 'bored'],
  '🥴': ['woozy', 'drunk', 'dizzy', 'tipsy'],
  '💩': ['poop', 'shit', 'crap'],
  '👻': ['ghost', 'boo', 'spooky', 'halloween'],
  '🤷': ['shrug', 'idk', 'whatever', 'dunno'],
};

const CATEGORIES = [
  { label: 'Popular', emojis: ['👍', '👎', '❤️', '😂', '😭', '💀', '🔥', '💯', '🙏', '👀', '🎉', '✅'] },
  { label: 'Faces', emojis: ['😀', '😆', '🤣', '😅', '🥹', '🤩', '😎', '🤔', '😏', '😈', '🤡', '🫠', '😮‍💨', '🤯', '😴', '🥴', '🫡'] },
  { label: 'Gestures', emojis: ['👍', '👎', '👏', '🙌', '🤙', '✌️', '🫶', '💪', '🤝', '🤷', '💅', '🖕'] },
  { label: 'Hearts', emojis: ['❤️', '🖤', '💜', '💚', '💙', '🤍', '💔', '❤️‍🔥'] },
  { label: 'Objects', emojis: ['⭐', '💎', '🎯', '🏆', '🚀', '💡', '🎉', '💩', '👻', '⚡'] },
  { label: 'Symbols', emojis: ['✅', '❌', '⚠️', '❓', '💤', '🔒', '🫥'] },
];

interface ReactionPickerProps {
  onSelect: (emoji: string) => void;
  quickReactions: string[];
  frequentlyUsed: string[];
  recordReaction: (emoji: string) => void;
}

export const ReactionPicker = memo(function ReactionPicker({ onSelect, quickReactions, frequentlyUsed, recordReaction }: ReactionPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setSearch('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const searchResults = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase().trim();
    return Object.entries(EMOJI_MAP)
      .filter(([, keywords]) => keywords.some(k => k.includes(q)))
      .map(([emoji]) => emoji);
  }, [search]);

  const handlePick = (emoji: string) => {
    recordReaction(emoji);
    onSelect(emoji);
    setOpen(false);
  };

  const handleQuickPick = (emoji: string) => {
    recordReaction(emoji);
    onSelect(emoji);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.12 }}
      className="flex gap-0.5 bg-card border border-border rounded-full px-1.5 py-0.5 shadow-md items-center"
    >
      {quickReactions.map(emoji => (
        <button
          key={emoji}
          onClick={() => handleQuickPick(emoji)}
          className="w-7 h-7 flex items-center justify-center rounded-full text-sm hover:bg-muted transition-colors active:scale-[0.9]"
        >
          {emoji}
        </button>
      ))}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className="w-7 h-7 flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors active:scale-[0.9]">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" side="top" align="start">
          <div className="p-2 border-b border-border">
            <div className="flex items-center gap-1.5 bg-muted/50 rounded-md px-2 py-1">
              <Search className="w-3 h-3 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search emoji…"
                className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto scrollbar-thin p-1.5 space-y-2">
            {searchResults ? (
              searchResults.length > 0 ? (
                <div className="flex flex-wrap gap-0.5">
                  {searchResults.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => handlePick(emoji)}
                      className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted transition-colors text-base active:scale-[0.85]"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-muted-foreground text-center py-3 font-mono">No results</p>
              )
            ) : (
              <>
                {frequentlyUsed.length > 0 && (
                <div>
                  <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider px-1">Your Frequent</span>
                  <div className="flex flex-wrap gap-0.5 mt-0.5">
                    {frequentlyUsed.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => handlePick(emoji)}
                        className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted transition-colors text-base active:scale-[0.85]"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
                )}
                {CATEGORIES.map(cat => (
                  <div key={cat.label}>
                    <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider px-1">{cat.label}</span>
                    <div className="flex flex-wrap gap-0.5 mt-0.5">
                      {cat.emojis.map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => handlePick(emoji)}
                          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted transition-colors text-base active:scale-[0.85]"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </motion.div>
  );
});
