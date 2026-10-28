import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  createInitialState,
  selectTool,
  applyScrub,
  nextStage,
  restartStage,
  STAGES,
} from './logic/engine';
import { CleaningTool, PiggyMudWashState } from './logic/types';
import { piggyWashAudio } from './systems/sound';

interface SparkleParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface BubbleParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
}

export const PiggyMudWashContainer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<PiggyMudWashState>(() => createInitialState());
  const [isMuted, setIsMuted] = useState<boolean>(() => piggyWashAudio.getMuted());
  const [isScrubbing, setIsScrubbing] = useState<boolean>(false);

  // References for continuous 60 FPS animation loop
  const stateRef = useRef<PiggyMudWashState>(gameState);
  stateRef.current = gameState;

  const sparklesRef = useRef<SparkleParticle[]>([]);
  const bubblesRef = useRef<BubbleParticle[]>([]);
  const lastPointerPos = useRef<{ x: number; y: number } | null>(null);

  // Handle Tool Selection
  const handleSelectTool = (tool: CleaningTool) => {
    setGameState((prev) => selectTool(prev, tool));
    if (tool === 'sponge') piggyWashAudio.playSpongeScrub();
    else if (tool === 'water') piggyWashAudio.playWaterSpray();
    else piggyWashAudio.playTowelDry();
  };

  // Toggle audio
  const handleToggleMute = () => {
    const nextMuted = piggyWashAudio.toggleMute();
    setIsMuted(nextMuted);
  };

  // Scrub action at coordinate
  const performScrub = useCallback((canvasX: number, canvasY: number) => {
    const current = stateRef.current;
    if (current.stageComplete || current.gameComplete) return;

    const { nextState, result } = applyScrub(current, canvasX, canvasY, 40);

    // Play sounds
    if (current.selectedTool === 'sponge' && result.soapApplied > 0) {
      piggyWashAudio.playSpongeScrub();
      // Add foaming bubbles
      for (let i = 0; i < 2; i++) {
        bubblesRef.current.push({
          x: canvasX + (Math.random() * 30 - 15),
          y: canvasY + (Math.random() * 30 - 15),
          vx: (Math.random() - 0.5) * 1.5,
          vy: -Math.random() * 2 - 0.5,
          size: 6 + Math.random() * 8,
          life: 1.0,
        });
      }
    } else if (current.selectedTool === 'water' && (result.rinsedAmount > 0 || result.cleanedAmount > 0)) {
      piggyWashAudio.playWaterSpray();
      // Water spray particles
      for (let i = 0; i < 3; i++) {
        bubblesRef.current.push({
          x: canvasX + (Math.random() * 20 - 10),
          y: canvasY + (Math.random() * 20 - 10),
          vx: (Math.random() - 0.5) * 3,
          vy: Math.random() * 4 + 1,
          size: 3 + Math.random() * 4,
          life: 0.8,
        });
      }
    } else if (current.selectedTool === 'towel' && result.driedAmount > 0) {
      piggyWashAudio.playTowelDry();
      piggyWashAudio.playSparkle();
      // Add clean star sparkles
      for (let i = 0; i < 4; i++) {
        sparklesRef.current.push({
          x: canvasX + (Math.random() * 20 - 10),
          y: canvasY + (Math.random() * 20 - 10),
          vx: (Math.random() - 0.5) * 2.5,
          vy: (Math.random() - 0.5) * 2.5,
          life: 1.0,
          maxLife: 1.0,
          color: '#facc15',
          size: 4 + Math.random() * 4,
        });
      }
    }

    if (result.isStageNowComplete && !current.stageComplete) {
      piggyWashAudio.playRibbonFanfare();
      const currentAnimal = STAGES[current.currentStageIndex]!.id;
      setTimeout(() => piggyWashAudio.playAnimalSound(currentAnimal), 300);

      // Huge celebratory sparkle burst
      for (let i = 0; i < 30; i++) {
        sparklesRef.current.push({
          x: 200 + (Math.random() * 100 - 50),
          y: 250 + (Math.random() * 100 - 50),
          vx: (Math.random() - 0.5) * 6,
          vy: (Math.random() - 0.5) * 6 - 2,
          life: 1.0,
          maxLife: 1.0,
          color: ['#facc15', '#38bdf8', '#ec4899', '#a855f7'][Math.floor(Math.random() * 4)]!,
          size: 5 + Math.random() * 6,
        });
      }
    }

    setGameState(nextState);
  }, []);

  // Pointer event handlers for Canvas
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = 400 / rect.width;
    const scaleY = 500 / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    setIsScrubbing(true);
    lastPointerPos.current = { x, y };
    performScrub(x, y);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isScrubbing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = 400 / rect.width;
    const scaleY = 500 / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    lastPointerPos.current = { x, y };
    performScrub(x, y);
  };

  const handlePointerUp = () => {
    setIsScrubbing(false);
    lastPointerPos.current = null;
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === '1') handleSelectTool('sponge');
      else if (key === '2') handleSelectTool('water');
      else if (key === '3') handleSelectTool('towel');
      else if (key === 'm') handleToggleMute();
      else if (key === 'r') setGameState((prev) => restartStage(prev));
      else if (key === ' ' || key === 'enter') {
        if (stateRef.current.stageComplete && !stateRef.current.gameComplete) {
          setGameState((prev) => nextStage(prev));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Canvas 2D render loop (60 FPS)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const state = stateRef.current;
      const stage = STAGES[state.currentStageIndex]!;

      // 1. Draw Countryside Spa Background
      ctx.clearRect(0, 0, 400, 500);

      // Warm pastel sky & wall
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 500);
      skyGrad.addColorStop(0, '#bae6fd');
      skyGrad.addColorStop(0.5, '#fef08a');
      skyGrad.addColorStop(1, '#bbf7d0');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, 400, 500);

      // Back Wood Wash Tub Rim
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.ellipse(200, 360, 160, 38, 0, 0, Math.PI * 2);
      ctx.fill();

      // 2. Draw Clean Animal Character Silhouette
      ctx.save();
      if (stage.id === 'piggy') {
        // Penny the Piglet
        // Ears
        ctx.fillStyle = '#f472b6';
        ctx.strokeStyle = '#db2777';
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.ellipse(140, 175, 24, 38, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(260, 175, 24, 38, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Body / Head
        ctx.fillStyle = '#fbcfe8';
        ctx.beginPath();
        ctx.arc(200, 240, 85, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Cheeks
        ctx.fillStyle = '#f43f5e';
        ctx.globalAlpha = 0.45;
        ctx.beginPath();
        ctx.arc(145, 260, 16, 0, Math.PI * 2);
        ctx.arc(255, 260, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // Eyes
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(165, 220, 8, 0, Math.PI * 2);
        ctx.arc(235, 220, 8, 0, Math.PI * 2);
        ctx.fill();

        // Eye glints
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(167, 218, 3, 0, Math.PI * 2);
        ctx.arc(237, 218, 3, 0, Math.PI * 2);
        ctx.fill();

        // Snout
        ctx.fillStyle = '#f472b6';
        ctx.beginPath();
        ctx.ellipse(200, 265, 34, 22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Nostrils
        ctx.fillStyle = '#9d174d';
        ctx.beginPath();
        ctx.ellipse(190, 265, 5, 8, 0, 0, Math.PI * 2);
        ctx.ellipse(210, 265, 5, 8, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (stage.id === 'puppy') {
        // Barnaby Golden Pup
        // Ears
        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        ctx.ellipse(135, 190, 22, 42, -0.2, 0, Math.PI * 2);
        ctx.ellipse(265, 190, 22, 42, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.fillStyle = '#fbbf24';
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(200, 230, 80, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Muzzle
        ctx.fillStyle = '#fef3c7';
        ctx.beginPath();
        ctx.ellipse(200, 255, 32, 24, 0, 0, Math.PI * 2);
        ctx.fill();

        // Nose
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.ellipse(200, 245, 12, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.beginPath();
        ctx.arc(170, 215, 8, 0, Math.PI * 2);
        ctx.arc(230, 215, 8, 0, Math.PI * 2);
        ctx.fill();

        // Tongue
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.arc(200, 275, 10, 0, Math.PI);
        ctx.fill();
      } else if (stage.id === 'calf') {
        // Daisy Baby Calf
        // Ears & little horns
        ctx.fillStyle = '#fdba74';
        ctx.beginPath();
        ctx.ellipse(140, 160, 14, 20, -0.4, 0, Math.PI * 2);
        ctx.ellipse(260, 160, 14, 20, 0.4, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(200, 235, 80, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Cow Spot
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(170, 195, 26, 0, Math.PI * 2);
        ctx.fill();

        // Big Pink Snout
        ctx.fillStyle = '#fbcfe8';
        ctx.strokeStyle = '#db2777';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(200, 270, 42, 26, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Nostrils
        ctx.fillStyle = '#be185d';
        ctx.beginPath();
        ctx.arc(185, 270, 6, 0, Math.PI * 2);
        ctx.arc(215, 270, 6, 0, Math.PI * 2);
        ctx.fill();

        // Big gentle calf eyes
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(165, 215, 9, 0, Math.PI * 2);
        ctx.arc(235, 215, 9, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Woolly the Lamb
        // Woolly cloud body
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 3;

        // Cloud puffs around head
        const puffs = [
          { x: 150, y: 170, r: 28 },
          { x: 200, y: 150, r: 32 },
          { x: 250, y: 170, r: 28 },
          { x: 130, y: 220, r: 30 },
          { x: 270, y: 220, r: 30 },
          { x: 140, y: 280, r: 32 },
          { x: 260, y: 280, r: 32 },
        ];
        puffs.forEach((p) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        });

        // Face
        ctx.fillStyle = '#fed7aa';
        ctx.strokeStyle = '#ea580c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(200, 235, 42, 48, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Eyes
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(180, 225, 6, 0, Math.PI * 2);
        ctx.arc(220, 225, 6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 3. Draw Mud Patches (Dirt layer on top of animal)
      state.patches.forEach((p) => {
        if (p.dirtLevel > 0.02) {
          ctx.save();
          ctx.fillStyle = '#713f12';
          ctx.globalAlpha = Math.min(0.92, p.dirtLevel * 0.95);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();

          // Darker center core
          ctx.fillStyle = '#451a03';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 0.65, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // 4. Draw Soapy Foam Clusters
        if (p.soapLevel > 0.05) {
          ctx.save();
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#bae6fd';
          ctx.lineWidth = 1.5;
          ctx.globalAlpha = Math.min(0.9, p.soapLevel);

          // Render 3 small bubble circles per soapy patch
          const bubbleOffsets = [
            { ox: -p.radius * 0.35, oy: -p.radius * 0.25, r: 12 },
            { ox: p.radius * 0.3, oy: -p.radius * 0.2, r: 14 },
            { ox: 0, oy: p.radius * 0.3, r: 16 },
          ];
          bubbleOffsets.forEach((bo) => {
            ctx.beginPath();
            ctx.arc(p.x + bo.ox, p.y + bo.oy, bo.r * p.soapLevel, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          });
          ctx.restore();
        }

        // 5. Draw Wet Sheen Beads
        if (p.isWet) {
          ctx.save();
          ctx.fillStyle = '#38bdf8';
          ctx.globalAlpha = 0.55;
          ctx.beginPath();
          ctx.arc(p.x - 10, p.y - 10, 4, 0, Math.PI * 2);
          ctx.arc(p.x + 12, p.y + 8, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });

      // 6. Draw Wooden Tub Front Rim & Planks
      ctx.fillStyle = '#92400e';
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(40, 360);
      ctx.lineTo(65, 470);
      ctx.quadraticCurveTo(200, 495, 335, 470);
      ctx.lineTo(360, 360);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Metal Hoop
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(50, 400);
      ctx.quadraticCurveTo(200, 420, 350, 400);
      ctx.stroke();

      // Foam Overflow on Tub Edge
      ctx.fillStyle = '#f8fafc';
      const foamBumps = [
        { x: 90, y: 360, r: 18 },
        { x: 130, y: 355, r: 22 },
        { x: 200, y: 365, r: 24 },
        { x: 270, y: 355, r: 22 },
        { x: 310, y: 360, r: 18 },
      ];
      foamBumps.forEach((fb) => {
        ctx.beginPath();
        ctx.arc(fb.x, fb.y, fb.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // 7. Render Particle Effects (Sparkles & Bubbles)
      // Bubbles
      for (let i = bubblesRef.current.length - 1; i >= 0; i--) {
        const b = bubblesRef.current[i]!;
        b.x += b.vx;
        b.y += b.vy;
        b.life -= 0.02;

        if (b.life <= 0) {
          bubblesRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, b.life * 0.7);
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // Sparkles
      for (let i = sparklesRef.current.length - 1; i >= 0; i--) {
        const sp = sparklesRef.current[i]!;
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.life -= 0.025;

        if (sp.life <= 0) {
          sparklesRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, sp.life);
        ctx.fillStyle = sp.color;
        ctx.beginPath();
        // 4-point star
        ctx.moveTo(sp.x, sp.y - sp.size);
        ctx.lineTo(sp.x + sp.size * 0.3, sp.y - sp.size * 0.3);
        ctx.lineTo(sp.x + sp.size, sp.y);
        ctx.lineTo(sp.x + sp.size * 0.3, sp.y + sp.size * 0.3);
        ctx.lineTo(sp.x, sp.y + sp.size);
        ctx.lineTo(sp.x - sp.size * 0.3, sp.y + sp.size * 0.3);
        ctx.lineTo(sp.x - sp.size, sp.y);
        ctx.lineTo(sp.x - sp.size * 0.3, sp.y - sp.size * 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // 8. Tool Brush Reticle at Cursor during scrub
      if (lastPointerPos.current && !state.stageComplete) {
        ctx.save();
        ctx.strokeStyle = state.selectedTool === 'sponge' ? '#f59e0b' : state.selectedTool === 'water' ? '#0ea5e9' : '#ec4899';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(lastPointerPos.current.x, lastPointerPos.current.y, 36, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  const currentStage = STAGES[gameState.currentStageIndex]!;

  return (
    <div className="flex flex-col items-center w-full max-w-[500px] mx-auto select-none touch-none">
      {/* Top Header & Stage Progress Bar */}
      <div className="w-full bg-slate-800/90 backdrop-blur-md rounded-2xl p-3 border border-slate-700/60 shadow-xl mb-3">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🐷🧼</span>
              <h2 className="text-sm font-bold text-white tracking-wide">{currentStage.name}</h2>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                Stage {gameState.currentStageIndex + 1}/{STAGES.length}
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium">{currentStage.title}</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-700 text-right">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Score</span>
              <span className="text-sm font-extrabold text-amber-400">{gameState.score}</span>
            </div>

            <button
              onClick={handleToggleMute}
              className="p-2 rounded-xl bg-slate-700/60 hover:bg-slate-700 border border-slate-600 text-slate-200 transition-all text-xs"
              title="Toggle Audio (M)"
            >
              {isMuted ? '🔇' : '🔊'}
            </button>
            <button
              onClick={() => setGameState((prev) => restartStage(prev))}
              className="p-2 rounded-xl bg-slate-700/60 hover:bg-slate-700 border border-slate-600 text-slate-200 transition-all text-xs font-bold"
              title="Reset Mud (R)"
            >
              🔄
            </button>
          </div>
        </div>

        {/* Cleanliness Progress Gauge */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-300">Cleanliness:</span>
          <div className="flex-1 h-3.5 bg-slate-900/90 rounded-full overflow-hidden border border-slate-700 p-0.5">
            <div
              className="h-full rounded-full transition-all duration-300 ease-out bg-gradient-to-r from-amber-500 via-pink-500 to-emerald-400 shadow-sm"
              style={{ width: `${gameState.cleanPercent}%` }}
            />
          </div>
          <span className="text-xs font-extrabold text-emerald-400 min-w-[38px] text-right">
            {gameState.cleanPercent}%
          </span>
        </div>
      </div>

      {/* Main Interactive Canvas Area */}
      <div className="relative w-full aspect-[4/5] max-w-[400px] rounded-3xl overflow-hidden border-2 border-slate-700/80 shadow-2xl bg-slate-900">
        <canvas
          ref={canvasRef}
          width={400}
          height={500}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="w-full h-full cursor-crosshair touch-none"
        />

        {/* County Fair Blue Ribbon Stage Complete Overlay */}
        {gameState.stageComplete && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in z-20">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center border-4 border-amber-400 shadow-[0_0_24px_rgba(37,99,235,0.8)] mb-3 animate-bounce">
              <span className="text-4xl">🏅</span>
            </div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-300 mb-1">
              County Fair 1st Prize!
            </span>
            <h3 className="text-2xl font-black text-white mb-2">
              {currentStage.name} is Squeaky Clean!
            </h3>
            <p className="text-xs text-slate-300 max-w-[280px] mb-4">
              {gameState.gameComplete
                ? 'All 4 farm animals are sparkling clean and won the Grand Champion Trophies!'
                : '100% of the mud is washed away and dried to perfection. +500 Bonus Points!'}
            </p>

            <button
              onClick={() => {
                if (gameState.gameComplete) {
                  setGameState(createInitialState());
                } else {
                  setGameState((prev) => nextStage(prev));
                }
              }}
              className="w-full max-w-[260px] py-3 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-400 hover:to-pink-400 text-white font-extrabold shadow-lg shadow-pink-500/30 transition-all text-sm uppercase tracking-wider"
            >
              {gameState.gameComplete ? 'Play Again 🏆' : 'Next Animal (Space) ➡️'}
            </button>
          </div>
        )}
      </div>

      {/* Tactile Tool Switcher Dock */}
      <div className="w-full mt-3 bg-slate-800/90 backdrop-blur-md rounded-2xl p-2.5 border border-slate-700/60 shadow-xl">
        <div className="grid grid-cols-3 gap-2">
          {/* Tool 1: Sponge */}
          <button
            onClick={() => handleSelectTool('sponge')}
            className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl font-bold transition-all min-h-[50px] border ${
              gameState.selectedTool === 'sponge'
                ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-[0_0_14px_rgba(245,158,11,0.5)] scale-102'
                : 'bg-slate-700/60 text-slate-300 border-slate-600/70 hover:bg-slate-700'
            }`}
          >
            <span className="text-xl leading-none mb-1">🧽</span>
            <span className="text-[11px] leading-tight font-extrabold">1. Sponge</span>
            <span className="text-[9px] opacity-80 leading-none">Soap Lather</span>
          </button>

          {/* Tool 2: Water Jet */}
          <button
            onClick={() => handleSelectTool('water')}
            className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl font-bold transition-all min-h-[50px] border ${
              gameState.selectedTool === 'water'
                ? 'bg-sky-500 text-slate-950 border-sky-300 shadow-[0_0_14px_rgba(14,165,233,0.5)] scale-102'
                : 'bg-slate-700/60 text-slate-300 border-slate-600/70 hover:bg-slate-700'
            }`}
          >
            <span className="text-xl leading-none mb-1">🚿</span>
            <span className="text-[11px] leading-tight font-extrabold">2. Hose</span>
            <span className="text-[9px] opacity-80 leading-none">Water Rinse</span>
          </button>

          {/* Tool 3: Fluffy Towel */}
          <button
            onClick={() => handleSelectTool('towel')}
            className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl font-bold transition-all min-h-[50px] border ${
              gameState.selectedTool === 'towel'
                ? 'bg-pink-500 text-slate-950 border-pink-300 shadow-[0_0_14px_rgba(236,72,153,0.5)] scale-102'
                : 'bg-slate-700/60 text-slate-300 border-slate-600/70 hover:bg-slate-700'
            }`}
          >
            <span className="text-xl leading-none mb-1">🧖</span>
            <span className="text-[11px] leading-tight font-extrabold">3. Towel</span>
            <span className="text-[9px] opacity-80 leading-none">Dry & Shine</span>
          </button>
        </div>
      </div>

      {/* Helpful Hint Strip */}
      <p className="text-[11px] text-slate-400 mt-2 text-center font-medium">
        💡 Drag finger across muddy patches: Soap with Sponge, Rinse with Hose, then Dry with Towel!
      </p>
    </div>
  );
};

export default PiggyMudWashContainer;
