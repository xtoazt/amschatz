import { memo, useMemo } from 'react';

const TEN_MINUTES = 10 * 60 * 1000;

interface SelfDestructTimerProps {
  timestamp: number;
  currentTime: number;
}

export const SelfDestructTimer = memo(function SelfDestructTimer({ timestamp, currentTime }: SelfDestructTimerProps) {
  const { display, urgent } = useMemo(() => {
    const remaining = Math.max(0, (timestamp + TEN_MINUTES) - currentTime);
    const totalSeconds = Math.ceil(remaining / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return {
      display: `[${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}]`,
      urgent: remaining < 2 * 60 * 1000, // < 2 min
    };
  }, [timestamp, currentTime]);

  return (
    <span
      className={`text-[9px] font-mono tabular-nums ${urgent ? 'text-foreground' : 'text-muted-foreground/50'}`}
    >
      {display}
    </span>
  );
});
