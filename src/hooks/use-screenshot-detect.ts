import { useEffect, useCallback, useRef } from 'react';

/**
 * Detects screenshots via the keyboard shortcut (PrintScreen, Cmd+Shift+3/4)
 * and visibility change heuristics, then fires a callback.
 */
export function useScreenshotDetect(onDetected: () => void, enabled: boolean) {
  const lastAlert = useRef(0);
  const COOLDOWN = 5000; // 5s cooldown between alerts

  const fire = useCallback(() => {
    const now = Date.now();
    if (now - lastAlert.current < COOLDOWN) return;
    lastAlert.current = now;
    onDetected();
  }, [onDetected]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Windows/Linux: PrintScreen
      if (e.key === 'PrintScreen') {
        fire();
        return;
      }
      // macOS: Cmd+Shift+3 or Cmd+Shift+4 or Cmd+Shift+5
      if (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key)) {
        fire();
        return;
      }
      // Windows Snipping Tool: Win+Shift+S
      if (e.metaKey && e.shiftKey && e.key.toLowerCase() === 's') {
        fire();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [enabled, fire]);
}
