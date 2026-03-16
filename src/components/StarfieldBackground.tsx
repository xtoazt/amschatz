import { useMemo } from 'react';

/**
 * Generates a CSS box-shadow string for N random "star" positions.
 * Each star is a 1px white dot at a random position within the given dimensions.
 */
function generateStars(count: number, width: number, height: number, opacity: number): string {
  const shadows: string[] = [];
  for (let i = 0; i < count; i++) {
    const x = Math.floor(Math.random() * width);
    const y = Math.floor(Math.random() * height);
    shadows.push(`${x}px ${y}px 0 rgba(255,255,255,${opacity})`);
  }
  return shadows.join(', ');
}

/**
 * A pure-CSS starfield background with three layers of tiny white dots
 * drifting upward at different speeds. Designed for the Void aesthetic:
 * strictly black & white, subtle, non-distracting.
 *
 * Renders as a fixed overlay — mount only on the JoinScreen.
 */
export function StarfieldBackground() {
  const layers = useMemo(() => {
    const w = 2000;
    const h = 2000;
    return {
      small:  generateStars(120, w, h, 0.4),
      medium: generateStars(50, w, h, 0.6),
      large:  generateStars(20, w, h, 0.8),
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
      aria-hidden="true"
    >
      {/* Layer 1: many tiny dim stars, slowest drift */}
      <div
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          background: 'transparent',
          boxShadow: layers.small,
          animation: 'starfield-drift 100s linear infinite',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          top: '2000px',
          background: 'transparent',
          boxShadow: layers.small,
          animation: 'starfield-drift 100s linear infinite',
        }}
      />

      {/* Layer 2: fewer mid-brightness stars, medium drift */}
      <div
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          background: 'transparent',
          boxShadow: layers.medium,
          animation: 'starfield-drift 70s linear infinite',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          top: '2000px',
          background: 'transparent',
          boxShadow: layers.medium,
          animation: 'starfield-drift 70s linear infinite',
        }}
      />

      {/* Layer 3: sparse bright stars, fastest drift */}
      <div
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          background: 'transparent',
          boxShadow: layers.large,
          animation: 'starfield-drift 50s linear infinite',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          top: '2000px',
          background: 'transparent',
          boxShadow: layers.large,
          animation: 'starfield-drift 50s linear infinite',
        }}
      />

      {/* Subtle pulsing opacity overlay for breathing effect */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)',
          animation: 'starfield-pulse 6s ease-in-out infinite',
        }}
      />
    </div>
  );
}
