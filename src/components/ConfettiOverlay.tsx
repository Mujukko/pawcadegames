import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  color: string;
  rotation: number;
  vRot: number;
  tilt: number;
  tiltSpeed: number;
  type: 'ribbon' | 'star' | 'circle';
  alpha: number;
  decay: number;
}

const COLORS = [
  '#f59e0b', // Gold
  '#fbbf24', // Amber
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#ec4899', // Pink
  '#8b5cf6', // Purple
  '#f97316', // Orange
  '#ffffff', // Sparkle white
];

export const ConfettiOverlay: React.FC<{ active: boolean }> = ({ active }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const particles: Particle[] = [];
    const particleCount = 140;

    // Dual cannon launch from left and right lower sides
    for (let i = 0; i < particleCount; i++) {
      const isLeft = i % 2 === 0;
      const originX = isLeft ? width * 0.15 : width * 0.85;
      const originY = height * 0.85;

      const angle = isLeft
        ? -Math.PI / 2 + (Math.random() * 0.7 - 0.1) // Left cannon angles towards center
        : -Math.PI / 2 - (Math.random() * 0.7 - 0.1); // Right cannon angles towards center

      const speed = Math.random() * 18 + 14;
      const typeRoll = Math.random();
      const type: 'ribbon' | 'star' | 'circle' =
        typeRoll < 0.65 ? 'ribbon' : typeRoll < 0.88 ? 'star' : 'circle';

      particles.push({
        x: originX + (Math.random() * 60 - 30),
        y: originY + (Math.random() * 40 - 20),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        w: type === 'star' ? Math.random() * 8 + 8 : Math.random() * 8 + 6,
        h: type === 'ribbon' ? Math.random() * 14 + 10 : Math.random() * 8 + 6,
        color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
        rotation: Math.random() * 360,
        vRot: (Math.random() * 8 - 4),
        tilt: Math.random() * 10,
        tiltSpeed: Math.random() * 0.08 + 0.04,
        type,
        alpha: 1,
        decay: Math.random() * 0.003 + 0.002,
      });
    }

    let animId: number;
    let startTime = performance.now();

    const drawStar = (cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number, color: string, alpha: number) => {
      let rot = (Math.PI / 2) * 3;
      let x = cx;
      let y = cy;
      const step = Math.PI / spikes;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy - outerRadius);
      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
      }
      ctx.lineTo(cx, cy - outerRadius);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha;
      ctx.fill();
      ctx.restore();
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const elapsed = performance.now() - startTime;
      const isDying = elapsed > 3200;

      let aliveCount = 0;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]!;

        // Gravity & air drag
        p.vy += 0.42; // Gravity
        p.vx *= 0.985; // Drag
        p.vy *= 0.985;
        p.x += p.vx;
        p.y += p.vy;

        p.rotation += p.vRot;
        p.tilt += p.tiltSpeed;

        if (isDying) {
          p.alpha -= p.decay * 3;
        }

        if (p.alpha <= 0 || p.y > height + 50) {
          continue;
        }

        aliveCount++;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);

        // 3D flutter effect using cosine scaling
        const scaleY = Math.cos(p.tilt);

        if (p.type === 'star') {
          drawStar(0, 0, 5, p.w, p.w * 0.45, p.color, p.alpha);
        } else if (p.type === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha;
          ctx.fill();
        } else {
          // Ribbon
          ctx.scale(1, scaleY);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha;
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        }

        ctx.restore();
      }

      if (aliveCount > 0 && elapsed < 4500) {
        animId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, width, height);
      }
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      if (ctx) ctx.clearRect(0, 0, width, height);
    };
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50 w-full h-full"
      style={{ pointerEvents: 'none' }}
    />
  );
};
