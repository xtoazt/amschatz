import { useState, useEffect } from 'react';

let globalTick = Date.now();
const listeners = new Set<(t: number) => void>();
let intervalId: ReturnType<typeof setInterval> | null = null;

function startInterval() {
  if (intervalId) return;
  intervalId = setInterval(() => {
    globalTick = Date.now();
    listeners.forEach(l => l(globalTick));
  }, 1000);
}

function stopInterval() {
  if (intervalId && listeners.size === 0) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

export function useTick(): number {
  const [tick, setTick] = useState(globalTick);

  useEffect(() => {
    listeners.add(setTick);
    startInterval();
    return () => {
      listeners.delete(setTick);
      stopInterval();
    };
  }, []);

  return tick;
}
