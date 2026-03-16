import { useEffect, useRef } from 'react';

// --- Configuration ---
const PARTICLE_COUNT = Math.min(window.innerWidth > 768 ? 1500 : 800, 2000); 
const BASE_SPEED = 0.5;
const ORBIT_RADIUS = Math.max(window.innerWidth, window.innerHeight) * 0.45;
const REPULSION_RADIUS = 150;
const REPULSION_FORCE = 4;
const RETURN_SPEED = 0.05;

interface Particle {
  x: number;
  y: number;
  baseX: number; // The ideal orbital position
  baseY: number;
  angle: number;
  distance: number;
  speed: number;
  size: number;
  opacity: number;
}

export function CanvasVoidBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 }); // Mouse initially offscreen
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false }); // false for performance (we manually paint background)
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    let width = 0;
    let height = 0;
    let cx = 0;
    let cy = 0;

    const initCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      
      // Explicitly set the CSS size to match the viewport
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      
      // Scale the actual canvas drawing resolution for Retina/high-DPI displays
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      
      cx = width / 2;
      cy = height / 2;
    };

    const initParticles = () => {
      particles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        // Distribute particles in a swirling galaxy pattern
        const angle = Math.random() * Math.PI * 2;
        // Bias distance towards the center, but leave a small hole
        const distance = 40 + (Math.random() ** 1.5) * ORBIT_RADIUS;
        
        particles.push({
          x: cx + Math.cos(angle) * distance,
          y: cy + Math.sin(angle) * distance,
          baseX: cx + Math.cos(angle) * distance,
          baseY: cy + Math.sin(angle) * distance,
          angle: angle,
          distance: distance,
          // Inner particles orbit faster
          speed: (BASE_SPEED / (distance * 0.05)) * (Math.random() > 0.5 ? 1 : 0.8),
          size: Math.random() * 1.2 + 0.3,
          // Inner and extremely outer particles fade out
          opacity: Math.random() * 0.6 * Math.min(1, distance / 100) * Math.max(0, 1 - distance / ORBIT_RADIUS)
        });
      }
    };

    const drawParticles = () => {
      // Paint deep black background with a trailing smear effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'; 
      ctx.fillRect(0, 0, width, height);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      ctx.save();
      
      // We want to reduce global opacity so it's not distracting
      ctx.globalAlpha = 0.6; 

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // 1. Orbital Physics update
        p.angle -= p.speed * 0.02; // Orbit clockwise
        
        // Calculate the ideal orbital position
        p.baseX = cx + Math.cos(p.angle) * p.distance;
        p.baseY = cy + Math.sin(p.angle) * p.distance;

        // 2. Mouse Repulsion physics
        const dx = p.x - mx;
        const dy = p.y - my;
        const distToMouse = Math.sqrt(dx * dx + dy * dy);

        if (distToMouse < REPULSION_RADIUS) {
          // Repel outward from mouse
          const force = (REPULSION_RADIUS - distToMouse) / REPULSION_RADIUS;
          const pushX = (dx / distToMouse) * force * REPULSION_FORCE;
          const pushY = (dy / distToMouse) * force * REPULSION_FORCE;
          
          p.x += pushX;
          p.y += pushY;
        } else {
          // Elastic return to base orbit
          p.x += (p.baseX - p.x) * RETURN_SPEED;
          p.y += (p.baseY - p.y) * RETURN_SPEED;
        }

        // Draw particle
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
      
      // Draw massive central vignette gradient to darken the void
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(width, height) * 0.6);
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
      
      animationFrameId = requestAnimationFrame(drawParticles);
    };

    // Event listeners
    const handleResize = () => {
      initCanvas();
      initParticles(); // Rebuild structure on resize
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    
    const handleMouseLeave = () => {
      // Throw mouse far offscreen so particles settle
      mouseRef.current = { x: -1000, y: -1000 };
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    // Initialization
    initCanvas();
    initParticles();
    drawParticles();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 z-0 pointer-events-auto" // Needs pointer-events auto to catch mouse if absolutely needed, though window mousemove usually suffices
      style={{ background: '#000' }}
    />
  );
}
