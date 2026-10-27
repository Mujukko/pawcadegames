import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Volume2, VolumeX, RotateCcw, HelpCircle, Trophy, Sparkles, Timer } from 'lucide-react';
import {
  createInitialPiggyGame,
  updatePiggyPhysics,
  WORLD_WIDTH,
  WORLD_HEIGHT,
  TIER_CONFIG,
  type HungryPiggyGame,
  type FoodItem,
} from './logic/engine';
import { hungryPiggyAudio } from './systems/sound';

interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  opacity: number;
  scale: number;
  vy: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  radius: number;
  alpha: number;
  life: number;
}

export const HungryPiggyContainer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [game, setGame] = useState<HungryPiggyGame>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('pawcade_hungry_piggy_highscore') : null;
    return createInitialPiggyGame(saved ? parseInt(saved, 10) : 0);
  });

  const [isMuted, setIsMuted] = useState(false);
  const [hudScore, setHudScore] = useState(0);
  const [hudHighScore, setHudHighScore] = useState(0);
  const [hudTier, setHudTier] = useState(1);
  const [hudTierTitle, setHudTierTitle] = useState('Little Piglet');
  const [hudTimeLeft, setHudTimeLeft] = useState(60);
  const [hudMultiplier, setHudMultiplier] = useState(1);
  const [isGameOver, setIsGameOver] = useState(false);

  // References for continuous 60fps loop
  const gameStateRef = useRef<HungryPiggyGame>(game);
  const pointerTargetRef = useRef<{ x: number; y: number } | null>(null);
  const isPointerDownRef = useRef(false);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const keysRef = useRef<{ [key: string]: boolean }>({});

  // Sync ref with state
  useEffect(() => {
    gameStateRef.current = game;
  }, [game]);

  const handleRestart = useCallback(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('pawcade_hungry_piggy_highscore') : null;
    const newGame = createInitialPiggyGame(saved ? parseInt(saved, 10) : 0);
    gameStateRef.current = newGame;
    setGame(newGame);
    setIsGameOver(false);
    setHudScore(0);
    setHudTier(1);
    setHudTierTitle('Little Piglet');
    setHudTimeLeft(60);
    setHudMultiplier(1);
    floatingTextsRef.current = [];
    particlesRef.current = [];
    pointerTargetRef.current = null;
    isPointerDownRef.current = false;
  }, []);

  const toggleMute = () => {
    const muted = hungryPiggyAudio.toggleMute();
    setIsMuted(muted);
  };

  // Keyboard controls
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // Main 60 FPS Canvas Game Loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const spawnParticles = (x: number, y: number, color: string, count = 8) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 40 + Math.random() * 120;
        particlesRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color,
          radius: 2 + Math.random() * 3,
          alpha: 1,
          life: 0.4 + Math.random() * 0.3,
        });
      }
    };

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const currentGame = gameStateRef.current;

      // Process Keyboard Direction
      let keyTarget: { x: number; y: number } | null = null;
      let kx = 0;
      let ky = 0;
      if (keysRef.current['arrowup'] || keysRef.current['w']) ky -= 1;
      if (keysRef.current['arrowdown'] || keysRef.current['s']) ky += 1;
      if (keysRef.current['arrowleft'] || keysRef.current['a']) kx -= 1;
      if (keysRef.current['arrowright'] || keysRef.current['d']) kx += 1;

      if (kx !== 0 || ky !== 0) {
        keyTarget = {
          x: currentGame.piggy.x + kx * 300,
          y: currentGame.piggy.y + ky * 300,
        };
      }

      // Pointer Target takes priority when active
      const activeTarget = isPointerDownRef.current && pointerTargetRef.current ? pointerTargetRef.current : keyTarget;

      // Update Physics
      const { eatEvents } = updatePiggyPhysics(
        currentGame,
        activeTarget ? activeTarget.x : null,
        activeTarget ? activeTarget.y : null,
        dt
      );

      // Handle Eat Events
      for (const ev of eatEvents) {
        hungryPiggyAudio.playMunch(currentGame.piggy.tier);
        if (currentGame.piggy.multiplier > 1) {
          hungryPiggyAudio.playMultiplierChime(currentGame.piggy.multiplier);
        }

        // Add Floating Text
        const multText = currentGame.piggy.multiplier > 1 ? ` x${currentGame.piggy.multiplier}` : '';
        floatingTextsRef.current.push({
          id: Math.random().toString(),
          x: ev.item.x,
          y: ev.item.y - 10,
          text: `+${ev.pointsEarned}${multText}`,
          color: currentGame.piggy.multiplier >= 3 ? '#f59e0b' : '#10b981',
          opacity: 1,
          scale: currentGame.piggy.multiplier >= 3 ? 1.4 : 1.0,
          vy: -60,
        });

        // Add crumbs
        spawnParticles(ev.item.x, ev.item.y, ev.item.type === 'apple' ? '#ef4444' : '#fbbf24', 6);

        if (ev.tierUp) {
          hungryPiggyAudio.playTierUp();
          hungryPiggyAudio.playOink();
          spawnParticles(currentGame.piggy.x, currentGame.piggy.y, '#f472b6', 24);
          floatingTextsRef.current.push({
            id: Math.random().toString(),
            x: currentGame.piggy.x,
            y: currentGame.piggy.y - 40,
            text: `GROWTH! ${currentGame.piggy.tierTitle.toUpperCase()}`,
            color: '#f43f5e',
            opacity: 1,
            scale: 1.6,
            vy: -40,
          });
        }
      }

      // Check Game Over
      if (currentGame.gameOver && !isGameOver) {
        setIsGameOver(true);
        hungryPiggyAudio.playGameOver();
        if (typeof window !== 'undefined') {
          localStorage.setItem('pawcade_hungry_piggy_highscore', currentGame.piggy.highScore.toString());
        }
      }

      // Update HUD periodically
      setHudScore(currentGame.piggy.score);
      setHudHighScore(currentGame.piggy.highScore);
      setHudTier(currentGame.piggy.tier);
      setHudTierTitle(currentGame.piggy.tierTitle);
      setHudTimeLeft(Math.ceil(currentGame.timeLeft));
      setHudMultiplier(currentGame.piggy.multiplier);

      // Update Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        p.alpha = Math.max(0, p.life / 0.5);
        if (p.life <= 0) {
          particlesRef.current.splice(i, 1);
        }
      }

      // Update Floating Texts
      for (let i = floatingTextsRef.current.length - 1; i >= 0; i--) {
        const ft = floatingTextsRef.current[i];
        ft.y += ft.vy * dt;
        ft.opacity -= dt * 1.5;
        if (ft.opacity <= 0) {
          floatingTextsRef.current.splice(i, 1);
        }
      }

      // RENDER CANVAS
      const viewW = canvas.width;
      const viewH = canvas.height;

      // Camera: centered on piggy, clamped to arena bounds
      const camX = Math.max(viewW / 2, Math.min(WORLD_WIDTH - viewW / 2, currentGame.piggy.x));
      const camY = Math.max(viewH / 2, Math.min(WORLD_HEIGHT - viewH / 2, currentGame.piggy.y));

      ctx.save();
      ctx.clearRect(0, 0, viewW, viewH);

      // Camera transform
      ctx.translate(viewW / 2 - camX, viewH / 2 - camY);

      // Draw Pasture Arena Background
      ctx.fillStyle = '#4ade80'; // soft pasture green
      ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

      // Farm field grid pattern (subtle checkered grass tiles)
      const tileSize = 60;
      ctx.fillStyle = 'rgba(34, 197, 94, 0.2)';
      for (let gx = 0; gx < WORLD_WIDTH; gx += tileSize) {
        for (let gy = 0; gy < WORLD_HEIGHT; gy += tileSize) {
          if ((gx / tileSize + gy / tileSize) % 2 === 0) {
            ctx.fillRect(gx, gy, tileSize, tileSize);
          }
        }
      }

      // Wooden Fence Boundary
      ctx.lineWidth = 10;
      ctx.strokeStyle = '#92400e'; // dark wood
      ctx.strokeRect(5, 5, WORLD_WIDTH - 10, WORLD_HEIGHT - 10);
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#b45309';
      ctx.strokeRect(10, 10, WORLD_WIDTH - 20, WORLD_HEIGHT - 20);

      // Draw Food Items
      for (const item of currentGame.items) {
        drawFoodItem(ctx, item, currentGame.piggy.tier);
      }

      // Draw Barnaby the Piggy
      drawPiggy(ctx, currentGame.piggy);

      // Draw Particles
      for (const p of particlesRef.current) {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Draw Floating Texts
      for (const ft of floatingTextsRef.current) {
        ctx.save();
        ctx.globalAlpha = ft.opacity;
        ctx.font = `bold ${Math.round(14 * ft.scale)}px sans-serif`;
        ctx.fillStyle = ft.color;
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 4;
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      }

      // Draw Virtual Steering Arrow / Touch Indicator
      if (isPointerDownRef.current && pointerTargetRef.current) {
        const dx = pointerTargetRef.current.x - currentGame.piggy.x;
        const dy = pointerTargetRef.current.y - currentGame.piggy.y;
        const angle = Math.atan2(dy, dx);
        ctx.save();
        ctx.translate(currentGame.piggy.x, currentGame.piggy.y);
        ctx.rotate(angle);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.moveTo(currentGame.piggy.radius + 15, -6);
        ctx.lineTo(currentGame.piggy.radius + 35, 0);
        ctx.lineTo(currentGame.piggy.radius + 15, 6);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      ctx.restore(); // end camera transform

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isGameOver]);

  // Touch and Mouse Handling
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    isPointerDownRef.current = true;
    updatePointerCoords(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isPointerDownRef.current) {
      updatePointerCoords(e);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    isPointerDownRef.current = false;
  };

  const updatePointerCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const screenX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const screenY = (e.clientY - rect.top) * (canvas.height / rect.height);

    // Convert screen coords to world coords based on camera
    const currentGame = gameStateRef.current;
    const camX = Math.max(canvas.width / 2, Math.min(WORLD_WIDTH - canvas.width / 2, currentGame.piggy.x));
    const camY = Math.max(canvas.height / 2, Math.min(WORLD_HEIGHT - canvas.height / 2, currentGame.piggy.y));

    pointerTargetRef.current = {
      x: screenX - canvas.width / 2 + camX,
      y: screenY - canvas.height / 2 + camY,
    };
  };

  // Helper Drawing Functions
  const drawPiggy = (ctx: CanvasRenderingContext2D, p: HungryPiggyGame['piggy']) => {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);

    const chompScale = p.isChomping ? 1.15 : 1.0;
    ctx.scale(chompScale, chompScale);

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(0, p.radius * 0.4, p.radius * 1.1, p.radius * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Curly Tail (wiggles)
    ctx.strokeStyle = '#f472b6';
    ctx.lineWidth = Math.max(2, p.radius * 0.12);
    ctx.beginPath();
    const tailWiggle = Math.sin(p.wobblePhase) * 4;
    ctx.arc(-p.radius * 0.9, tailWiggle, p.radius * 0.3, 0, Math.PI * 1.6);
    ctx.stroke();

    // Pink Body
    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
    ctx.fill();

    // Body Outline
    ctx.lineWidth = Math.max(2, p.radius * 0.08);
    ctx.strokeStyle = '#db2777';
    ctx.stroke();

    // Floppy Ears
    ctx.fillStyle = '#ec4899';
    // Top Ear
    ctx.beginPath();
    ctx.ellipse(-p.radius * 0.2, -p.radius * 0.85, p.radius * 0.35, p.radius * 0.22, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Bottom Ear
    ctx.beginPath();
    ctx.ellipse(-p.radius * 0.2, p.radius * 0.85, p.radius * 0.35, p.radius * 0.22, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Snout
    ctx.fillStyle = '#fbcfe8';
    ctx.beginPath();
    ctx.ellipse(p.radius * 0.7, 0, p.radius * 0.4, p.radius * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#db2777';
    ctx.lineWidth = Math.max(1.5, p.radius * 0.06);
    ctx.stroke();

    // Nostrils
    ctx.fillStyle = '#be185d';
    ctx.beginPath();
    ctx.ellipse(p.radius * 0.78, -p.radius * 0.1, p.radius * 0.08, p.radius * 0.1, 0, 0, Math.PI * 2);
    ctx.ellipse(p.radius * 0.78, p.radius * 0.1, p.radius * 0.08, p.radius * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyes (Kawaii anime gleam)
    const eyeOffsetX = p.radius * 0.35;
    const eyeOffsetY = p.radius * 0.35;

    [ -eyeOffsetY, eyeOffsetY ].forEach((ey) => {
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.arc(eyeOffsetX, ey, p.radius * 0.18, 0, Math.PI * 2);
      ctx.fill();

      // Gleam
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(eyeOffsetX + p.radius * 0.05, ey - p.radius * 0.05, p.radius * 0.07, 0, Math.PI * 2);
      ctx.fill();
    });

    // Rosy Cheeks
    ctx.fillStyle = 'rgba(244, 63, 94, 0.4)';
    ctx.beginPath();
    ctx.arc(p.radius * 0.2, -p.radius * 0.6, p.radius * 0.18, 0, Math.PI * 2);
    ctx.arc(p.radius * 0.2, p.radius * 0.6, p.radius * 0.18, 0, Math.PI * 2);
    ctx.fill();

    // Tier 4 Crown or Tier 3 Bandana
    if (p.tier >= 4) {
      // Shiny Golden Boss Crown
      ctx.fillStyle = '#fbbf24';
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-p.radius * 0.3, -p.radius * 0.9);
      ctx.lineTo(-p.radius * 0.4, -p.radius * 1.5);
      ctx.lineTo(-p.radius * 0.1, -p.radius * 1.2);
      ctx.lineTo(p.radius * 0.1, -p.radius * 1.6);
      ctx.lineTo(p.radius * 0.3, -p.radius * 1.2);
      ctx.lineTo(p.radius * 0.5, -p.radius * 1.5);
      ctx.lineTo(p.radius * 0.4, -p.radius * 0.9);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (p.tier === 3) {
      // Red Farm Bandana
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(0, 0, p.radius, Math.PI * 0.7, Math.PI * 1.3);
      ctx.lineTo(-p.radius * 1.2, 0);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  };

  const drawFoodItem = (ctx: CanvasRenderingContext2D, item: FoodItem, currentTier: number) => {
    ctx.save();
    ctx.translate(item.x, item.y);

    const isLocked = currentTier < item.minTier;
    if (isLocked) {
      // Draw dim translucent locked indicator
      ctx.globalAlpha = 0.45;
    }

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
    ctx.beginPath();
    ctx.ellipse(0, item.radius * 0.6, item.radius, item.radius * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    switch (item.type) {
      case 'apple':
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(0, 0, item.radius, 0, Math.PI * 2);
        ctx.fill();
        // Leaf
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.ellipse(item.radius * 0.4, -item.radius * 0.8, item.radius * 0.4, item.radius * 0.2, 0.4, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'acorn':
        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.arc(0, item.radius * 0.2, item.radius * 0.8, 0, Math.PI);
        ctx.fill();
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.ellipse(0, -item.radius * 0.2, item.radius * 0.9, item.radius * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'carrot':
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(0, item.radius * 1.2);
        ctx.lineTo(-item.radius * 0.7, -item.radius * 0.6);
        ctx.lineTo(item.radius * 0.7, -item.radius * 0.6);
        ctx.closePath();
        ctx.fill();
        // Greens
        ctx.fillStyle = '#16a34a';
        ctx.fillRect(-item.radius * 0.3, -item.radius * 1.2, item.radius * 0.6, item.radius * 0.6);
        break;

      case 'milk_can':
        ctx.fillStyle = '#e2e8f0';
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-item.radius * 0.7, -item.radius, item.radius * 1.4, item.radius * 2, 4);
        ctx.fill();
        ctx.stroke();
        // Blue stripe
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(-item.radius * 0.7, -item.radius * 0.3, item.radius * 1.4, item.radius * 0.6);
        break;

      case 'wood_crate':
        ctx.fillStyle = '#d97706';
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 2;
        ctx.strokeRect(-item.radius, -item.radius, item.radius * 2, item.radius * 2);
        ctx.fillRect(-item.radius, -item.radius, item.radius * 2, item.radius * 2);
        // X cross
        ctx.beginPath();
        ctx.moveTo(-item.radius, -item.radius);
        ctx.lineTo(item.radius, item.radius);
        ctx.moveTo(item.radius, -item.radius);
        ctx.lineTo(-item.radius, item.radius);
        ctx.stroke();
        break;

      case 'pumpkin':
        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.ellipse(0, 0, item.radius * 1.1, item.radius * 0.9, 0, 0, Math.PI * 2);
        ctx.fill();
        // Stem
        ctx.fillStyle = '#15803d';
        ctx.fillRect(-item.radius * 0.2, -item.radius * 1.2, item.radius * 0.4, item.radius * 0.4);
        break;

      case 'hay_bale':
        ctx.fillStyle = '#fde047';
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-item.radius * 1.1, -item.radius * 0.7, item.radius * 2.2, item.radius * 1.4, 6);
        ctx.fill();
        ctx.stroke();
        // Twine straps
        ctx.strokeStyle = '#b45309';
        ctx.beginPath();
        ctx.moveTo(-item.radius * 0.4, -item.radius * 0.7);
        ctx.lineTo(-item.radius * 0.4, item.radius * 0.7);
        ctx.moveTo(item.radius * 0.4, -item.radius * 0.7);
        ctx.lineTo(item.radius * 0.4, item.radius * 0.7);
        ctx.stroke();
        break;

      case 'fence_post':
        ctx.fillStyle = '#b45309';
        ctx.fillRect(-item.radius * 0.5, -item.radius, item.radius, item.radius * 2);
        ctx.fillStyle = '#fde047';
        ctx.fillRect(-item.radius, -item.radius * 0.4, item.radius * 2, item.radius * 0.3);
        break;

      case 'tractor':
        ctx.fillStyle = '#22c55e'; // Green John Deere
        ctx.fillRect(-item.radius * 0.9, -item.radius * 0.6, item.radius * 1.8, item.radius * 1.2);
        // Cabin
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(-item.radius * 0.4, -item.radius * 0.9, item.radius * 0.8, item.radius * 0.6);
        // Chunky Black Wheels
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(-item.radius * 0.7, item.radius * 0.7, item.radius * 0.4, 0, Math.PI * 2);
        ctx.arc(item.radius * 0.7, item.radius * 0.7, item.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'grain_silo':
        ctx.fillStyle = '#ef4444'; // Red silo
        ctx.fillRect(-item.radius * 0.7, -item.radius, item.radius * 1.4, item.radius * 2);
        // Silver Dome Roof
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.arc(0, -item.radius, item.radius * 0.7, Math.PI, 0);
        ctx.fill();
        break;
    }

    if (isLocked) {
      // Mini lock badge
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(0, 0, item.radius * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.max(9, Math.round(item.radius * 0.45))}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`T${item.minTier}`, 0, 1);
    }

    ctx.restore();
  };

  const currentTierConfig = TIER_CONFIG[hudTier - 1] || TIER_CONFIG[0];
  const nextTierThreshold = currentTierConfig.threshold;
  const prevTierThreshold = hudTier > 1 ? TIER_CONFIG[hudTier - 2].threshold : 0;
  const progressPercent =
    nextTierThreshold === Infinity
      ? 100
      : Math.min(100, Math.max(0, ((hudScore - prevTierThreshold) / (nextTierThreshold - prevTierThreshold)) * 100));

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-lg mx-auto flex flex-col items-center select-none touch-none bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl p-2 sm:p-4"
    >
      {/* Top Header HUD */}
      <div className="w-full flex items-center justify-between px-2 py-2 mb-2 bg-slate-800/80 rounded-2xl border border-slate-700/60 backdrop-blur-md">
        {/* Score & Trophy */}
        <div className="flex items-center gap-2">
          <div className="bg-amber-500/20 text-amber-300 p-2 rounded-xl border border-amber-500/30">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400">SCORE</div>
            <div className="text-lg sm:text-xl font-black text-white">{hudScore}</div>
          </div>
        </div>

        {/* 60s Countdown Timer */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-black transition-colors ${
            hudTimeLeft <= 10
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
          }`}
        >
          <Timer className="w-4 h-4" />
          <span className="text-base sm:text-lg">{hudTimeLeft}s</span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleMute}
            className="w-11 h-11 min-w-[44px] min-h-[44px] bg-slate-700 hover:bg-slate-600 active:scale-95 text-slate-200 rounded-xl transition-all flex items-center justify-center cursor-pointer"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <button
            onClick={handleRestart}
            className="w-11 h-11 min-w-[44px] min-h-[44px] bg-slate-700 hover:bg-slate-600 active:scale-95 text-slate-200 rounded-xl transition-all flex items-center justify-center cursor-pointer"
            aria-label="Restart Game"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Piggy Tier & Multiplier Progress Ribbon */}
      <div className="w-full flex items-center justify-between gap-3 px-3 py-1.5 mb-2 bg-slate-800/50 rounded-xl border border-slate-700/40">
        <div className="flex items-center gap-2">
          <span className="text-xl">🐷</span>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-pink-300">
              Tier {hudTier}: {hudTierTitle}
            </span>
            <div className="w-32 sm:w-40 h-2 bg-slate-700 rounded-full overflow-hidden mt-0.5">
              <div
                className="h-full bg-gradient-to-r from-pink-500 to-rose-400 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Multiplier Badge */}
        {hudMultiplier > 1 && (
          <div className="flex items-center gap-1 px-2.5 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-xs sm:text-sm rounded-full shadow-lg shadow-orange-500/30 animate-bounce">
            <Sparkles className="w-3 h-3" />
            <span>{hudMultiplier}X COMBO</span>
          </div>
        )}
      </div>

      {/* 60 FPS Interactive Canvas Viewport */}
      <div className="relative w-full aspect-[4/5] sm:aspect-[4/5] rounded-2xl overflow-hidden border-2 border-slate-700/80 shadow-inner bg-slate-950">
        <canvas
          ref={canvasRef}
          width={400}
          height={500}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full h-full cursor-crosshair touch-none"
        />

        {/* Game Over Modal Overlay */}
        {isGameOver && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in z-20 overflow-y-auto max-h-full py-4">
            <div className="w-16 h-16 rounded-full bg-pink-500/20 border-2 border-pink-500/40 flex items-center justify-center text-4xl mb-3 shadow-lg shadow-pink-500/30">
              🐷
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-1">HARVEST CHOMPED!</h2>
            <p className="text-slate-300 text-sm mb-4">
              Barnaby reached <span className="text-pink-400 font-bold">{hudTierTitle}</span>!
            </p>

            <div className="w-full max-w-xs bg-slate-800/90 rounded-2xl p-4 border border-slate-700/60 mb-5 flex justify-around">
              <div>
                <div className="text-xs text-slate-400 font-semibold">FINAL SCORE</div>
                <div className="text-2xl font-black text-white">{hudScore}</div>
              </div>
              <div className="w-px bg-slate-700" />
              <div>
                <div className="text-xs text-slate-400 font-semibold">BEST SCORE</div>
                <div className="text-2xl font-black text-amber-400">{hudHighScore}</div>
              </div>
            </div>

            <button
              onClick={handleRestart}
              className="w-full max-w-xs py-3.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 active:scale-95 text-white font-black text-base rounded-2xl shadow-xl shadow-pink-500/30 transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              <span>PLAY AGAIN</span>
            </button>
          </div>
        )}
      </div>

      {/* Control Hint Footer */}
      <div className="w-full mt-2.5 px-3 py-2 bg-slate-800/40 rounded-xl border border-slate-700/30 flex items-center justify-between text-xs text-slate-400">
        <span>Touch & Drag anywhere to steer • Keyboard: WASD / Arrows</span>
        <span className="text-amber-400 font-medium">Eat smaller items to grow!</span>
      </div>
    </div>
  );
};
export default HungryPiggyContainer;
