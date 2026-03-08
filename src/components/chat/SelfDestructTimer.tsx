import { memo } from 'react';
import { useTick } from '@/hooks/use-tick';

const TEN_MINUTES = 10 * 60 * 1000;

interface SelfDestructTimerProps {
  timestamp: number;
}

export const SelfDestructTimer = memo(function SelfDestructTimer({ timestamp }: SelfDestructTimerProps) {
  const now = useTick();

  const remaining = Math.max(0, (timestamp + TEN_MINUTES) - now);
  const totalSeconds = Math.ceil(remaining / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const display = `[${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}]`;
  const urgent = remaining < 2 * 60 * 1000;

  return (
    <span
      className={`text-[9px] font-mono tabular-nums ${urgent ? 'text-foreground' : 'text-muted-foreground/50'}`}
    >
      {display}
    </span>
  );
});
