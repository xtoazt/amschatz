import { useEffect, useRef } from 'react';

// --- Configuration ---
const PARTICLE_COUNT = Math.min(window.innerWidth > 768 ? 2500 : 1200, 3000);
const ARMS = 3; // Number of galaxy spiral arms
const ARM_SPREAD = 0.4; // How messy the arms are
const GALAXY_RADIUS = Math.max(window.innerWidth, window.innerHeight) * 0.4;
const BASE_SPEED = 0.0005;

interface Particle {
  x: number;
  y: number;
  angle: number;
  distance: number;
  size: number;
  opacity: number;
  speed: number;
}

export function GalaxyVoidBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
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

      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

      cx = width / 2;
      cy = height / 2;
    };

    const initParticles = () => {
      particles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        // Logarithmic spiral math
        const armIndex = i % ARMS;
        const baseAngle = (armIndex * 2 * Math.PI) / ARMS;

        // Distribute distance with a bias towards the center (core is denser)
        const distance = Math.pow(Math.random(), 1.5) * GALAXY_RADIUS;

        // Spiral wrapping effect: the further out, the more it wraps around
        const spiralAngle = distance * 0.005;

        // Add some noise/spread so it's not a perfect line
        const noise = (Math.random() - 0.5) * distance * ARM_SPREAD;
        const angle = baseAngle + spiralAngle + (noise / distance);

        particles.push({
          x: cx + Math.cos(angle) * distance,
          y: cy + Math.sin(angle) * distance,
          angle: angle,
          distance: distance,
          size: Math.random() * 1.5 + 0.2, // Tiny dots
          // Opacity fades out towards the edges
          opacity: Math.random() * 0.8 * Math.max(0, 1 - distance / GALAXY_RADIUS),
          // Inner particles orbit much faster than outer ones
          speed: BASE_SPEED + (BASE_SPEED * (GALAXY_RADIUS / Math.max(distance, 10))),
        });
      }
    };

    const drawParticles = () => {
      // Paint deep black background with a trailing smear effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; // Smear creates motion blur
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.globalAlpha = 0.7;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Orbit update
        p.angle += p.speed;

        // Calculate new position
        p.x = cx + Math.cos(p.angle) * p.distance;
        p.y = cy + Math.sin(p.angle) * p.distance;

        // Draw dot
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      // Deep void core (black hole in the center)
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, GALAXY_RADIUS * 1.5);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.8)'); // Very dark center
      grad.addColorStop(0.2, 'transparent'); // Shows the dense inner stars
      grad.addColorStop(0.8, 'rgba(0,0,0,0.6)'); // Vignette
      grad.addColorStop(1, 'rgba(0, 0, 0, 1)'); // Total darkness at edges
      
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      animationFrameId = requestAnimationFrame(drawParticles);
    };

    const handleResize = () => {
      initCanvas();
      initParticles();
    };

    window.addEventListener('resize', handleResize);

    initCanvas();
    initParticles();
    drawParticles();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ background: '#000' }}
    />
  );
}
