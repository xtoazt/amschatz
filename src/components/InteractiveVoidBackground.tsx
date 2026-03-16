import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export function InteractiveVoidBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const { clientX, clientY } = e;
      const xPos = (clientX / window.innerWidth - 0.5) * 20; // -10 to 10
      const yPos = (clientY / window.innerHeight - 0.5) * 20;

      containerRef.current.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-background">
      
      {/* Deep Void Core (The Black Hole) */}
      <div 
        ref={containerRef}
        className="absolute inset-[-10%] w-[120%] h-[120%] transition-transform duration-1000 ease-out"
      >
        
        {/* Accretion Disk / Nebula Glows */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[1200px] max-h-[1200px] rounded-full mix-blend-screen opacity-40"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 30%, transparent 70%)',
            filter: 'blur(60px)',
          }}
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 90, 180, 270, 360],
          }}
          transition={{
            scale: { duration: 15, repeat: Infinity, ease: 'easeInOut' },
            rotate: { duration: 120, repeat: Infinity, ease: 'linear' },
          }}
        />

        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[40vw] max-w-[1000px] max-h-[600px] rounded-full mix-blend-screen opacity-30"
          style={{
            background: 'radial-gradient(ellipse, rgba(255,255,255,0.05) 0%, transparent 60%)',
            filter: 'blur(80px)',
          }}
          animate={{
            rotate: [360, 270, 180, 90, 0],
            scale: [1.2, 0.8, 1.2],
          }}
          transition={{
            rotate: { duration: 180, repeat: Infinity, ease: 'linear' },
            scale: { duration: 20, repeat: Infinity, ease: 'easeInOut' },
          }}
        />

        {/* Foreground drifting particles (Subtle stars) */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 opacity-50" style={{
            backgroundImage: 'radial-gradient(circle at center, rgba(255,255,255,0.8) 0.5px, transparent 1px)',
            backgroundSize: '120px 120px',
            animation: 'starfield-drift 120s linear infinite',
          }} />
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: 'radial-gradient(circle at center, rgba(255,255,255,0.6) 1px, transparent 1.5px)',
            backgroundSize: '250px 250px',
            backgroundPosition: '50px 50px',
            animation: 'starfield-drift 80s linear infinite',
          }} />
        </div>
        
      </div>

      {/* Extreme dark vignette to focus the center */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]" />
    </div>
  );
}
