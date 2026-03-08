import { useEffect, useState } from 'react';

interface Clover {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  rotation: number;
}

export function CloverRain() {
  const [clovers, setClovers] = useState<Clover[]>([]);

  useEffect(() => {
    const initial: Clover[] = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 4 + Math.random() * 6,
      size: 12 + Math.random() * 20,
      rotation: Math.random() * 360,
    }));
    setClovers(initial);

    let counter = 30;
    const interval = setInterval(() => {
      setClovers(prev => [
        ...prev.slice(-50),
        {
          id: counter++,
          left: Math.random() * 100,
          delay: 0,
          duration: 4 + Math.random() * 6,
          size: 12 + Math.random() * 20,
          rotation: Math.random() * 360,
        },
      ]);
    }, 400);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {clovers.map(c => (
        <span
          key={c.id}
          className="absolute animate-clover-fall"
          style={{
            left: `${c.left}%`,
            top: '-40px',
            animationDelay: `${c.delay}s`,
            animationDuration: `${c.duration}s`,
            fontSize: `${c.size}px`,
            transform: `rotate(${c.rotation}deg)`,
          }}
        >
          ☘️
        </span>
      ))}
    </div>
  );
}
