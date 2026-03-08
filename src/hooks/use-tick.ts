import { useState, useEffect } from 'react';

let globalTick = Date.now();
const listeners = new Set<(t: number) => void>();

setInterval(() => {
  globalTick = Date.now();
  listeners.forEach(l => l(globalTick));
}, 1000);

export function useTick(): number {
  const [tick, setTick] = useState(globalTick);

  useEffect(() => {
    listeners.add(setTick);
    return () => { listeners.delete(setTick); };
  }, []);

  return tick;
}
