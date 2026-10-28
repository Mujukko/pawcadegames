import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  CropMowerState,
  Direction,
} from './logic/types';
import {
  createInitialState,
  setMowerDirection,
  stopMower,
  updateEngine,
  restartStage,
  nextStage,
  STAGES,
  TILE_SIZE,
  FIELD_OFFSET_X,
  FIELD_OFFSET_Y,
} from './logic/engine';
import { cropMowerAudio } from './systems/sound';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
  size: number;
}

interface ScorePopup {
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
}

export const CropMowerHarvestContainer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [highScore, setHighScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('pawcade_crop_mower_hi');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const stateRef = useRef<CropMowerState>(createInitialState(highScore));
  const [hudState, setHudState] = useState<{
    score: number;
    stageIndex: number;
    stageName: string;
    totalCut: number;
    totalCrops: number;
    basket: number;
    maxBasket: number;
    status: 'playing' | 'stage_clear' | 'game_over';
  }>({
    score: 0,
    stageIndex: 0,
    stageName: STAGES[0].name,
    totalCut: 0,
    totalCrops: 100,
    basket: 0,
    maxBasket: 30,
    status: 'playing',
  });

  const [isMuted, setIsMuted] = useState<boolean>(() => cropMowerAudio.getMuted());
  const particlesRef = useRef<Particle[]>([]);
  const popupsRef = useRef<ScorePopup[]>([]);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  const spawnStrawParticles = (x: number, y: number, color: string = '#fde047', count = 6) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 60;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 15,
        alpha: 1,
        color,
        size: 2.5 + Math.random() * 2.5,
      });
    }
  };

  const spawnPopup = (x: number, y: number, text: string, color: string = '#facc15') => {
    popupsRef.current.push({
      x,
      y,
      text,
      color,
      alpha: 1,
    });
  };

  const handleDirection = useCallback((dir: Direction) => {
    stateRef.current = setMowerDirection(stateRef.current, dir);
  }, []);

  const handleStop = useCallback(() => {
    stateRef.current = stopMower(stateRef.current);
  }, []);

  const handleNextStage = () => {
    stateRef.current = nextStage(stateRef.current);
    particlesRef.current = [];
    popupsRef.current = [];
  };

  const handleRestartStage = () => {
    stateRef.current = restartStage(stateRef.current);
    particlesRef.current = [];
    popupsRef.current = [];
  };

  const toggleSound = () => {
    const next = cropMowerAudio.toggleMute();
    setIsMuted(next);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        handleDirection('up');
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        handleDirection('down');
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        handleDirection('left');
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        handleDirection('right');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (
        ['ArrowUp', 'w', 'W', 'ArrowDown', 's', 'S', 'ArrowLeft', 'a', 'A', 'ArrowRight', 'd', 'D'].includes(
          e.key
        )
      ) {
        handleStop();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleDirection, handleStop]);

  // Touch Swipe & Drag Handling on Canvas
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    dragStartRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragStartRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const curX = e.clientX - rect.left;
    const curY = e.clientY - rect.top;

    const dx = curX - dragStartRef.current.x;
    const dy = curY - dragStartRef.current.y;

    if (Math.abs(dx) > 12 || Math.abs(dy) > 12) {
      if (Math.abs(dx) > Math.abs(dy)) {
        handleDirection(dx > 0 ? 'right' : 'left');
      } else {
        handleDirection(dy > 0 ? 'down' : 'up');
      }
      dragStartRef.current = { x: curX, y: curY };
    }
  };

  const handlePointerUp = () => {
    dragStartRef.current = null;
    handleStop();
  };

  // Main 60 FPS Game Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min(0.04, Math.max(0.001, (currentTime - lastTime) / 1000));
      lastTime = currentTime;

      const engineRes = updateEngine(stateRef.current, dt);
      stateRef.current = engineRes.state;

      // Handle Engine Events
      engineRes.events.forEach((ev) => {
        if (ev.type === 'crop_cut') {
          cropMowerAudio.playCropCut();
          const posX = FIELD_OFFSET_X + ev.col * TILE_SIZE + TILE_SIZE / 2;
          const posY = FIELD_OFFSET_Y + ev.row * TILE_SIZE + TILE_SIZE / 2;
          const strawColor = ev.cropType === 'sunflower' ? '#fbbf24' : ev.cropType === 'corn' ? '#fde047' : '#facc15';
          spawnStrawParticles(posX, posY, strawColor, 5);
        } else if (ev.type === 'basket_deposited') {
          cropMowerAudio.playBasketDeposit();
          spawnPopup(stateRef.current.player.x, stateRef.current.player.y - 20, `+${ev.points} DEPOSIT!`, '#4ade80');
          spawnStrawParticles(stateRef.current.player.x, stateRef.current.player.y, '#4ade80', 18);
        } else if (ev.type === 'stage_clear') {
          cropMowerAudio.playStageClear();
          spawnPopup(200, 240, 'STAGE COMPLETED! 100%', '#facc15');
          if (stateRef.current.score > highScore) {
            setHighScore(stateRef.current.score);
            try {
              localStorage.setItem('pawcade_crop_mower_hi', stateRef.current.score.toString());
            } catch {}
          }
        }
      });

      // Update Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.alpha -= dt * 2.5;
        if (p.alpha <= 0) {
          particlesRef.current.splice(i, 1);
        }
      }

      // Update Popups
      for (let i = popupsRef.current.length - 1; i >= 0; i--) {
        const pop = popupsRef.current[i];
        pop.y -= 40 * dt;
        pop.alpha -= dt * 1.6;
        if (pop.alpha <= 0) {
          popupsRef.current.splice(i, 1);
        }
      }

      // Update React HUD
      const st = stateRef.current;
      const stage = STAGES[st.currentStageIndex] || STAGES[0];
      setHudState({
        score: st.score,
        stageIndex: st.currentStageIndex,
        stageName: stage.name,
        totalCut: st.totalCut,
        totalCrops: st.totalCropsInStage,
        basket: st.player.basket,
        maxBasket: st.player.maxBasket,
        status: st.status,
      });

      // Render Canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          renderCanvas(ctx, st, currentTime / 1000);
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [highScore]);

  // Canvas 2D Rendering
  const renderCanvas = (ctx: CanvasRenderingContext2D, state: CropMowerState, time: number) => {
    ctx.save();
    ctx.clearRect(0, 0, 400, 540);

    const stage = STAGES[state.currentStageIndex] || STAGES[0];

    // 1. Surrounding Farm Dirt Ground
    ctx.fillStyle = '#713f12';
    ctx.fillRect(0, 0, 400, 540);

    // 2. Playfield Pasture Background
    const fieldW = stage.cols * TILE_SIZE;
    const fieldH = stage.rows * TILE_SIZE;

    ctx.fillStyle = '#65a30d'; // mowed green base
    ctx.fillRect(FIELD_OFFSET_X, FIELD_OFFSET_Y, fieldW, fieldH);

    // 3. Render Field Tiles
    for (let r = 0; r < stage.rows; r++) {
      for (let c = 0; c < stage.cols; c++) {
        const tile = state.grid[r][c];
        const tx = FIELD_OFFSET_X + c * TILE_SIZE;
        const ty = FIELD_OFFSET_Y + r * TILE_SIZE;

        if (tile.state === 'uncut') {
          // Uncut Crops (Wheat, Corn, Sunflower)
          const sway = Math.sin(time * 6 + r * 0.5 + c * 0.3) * 2;

          if (tile.type === 'wheat') {
            ctx.fillStyle = '#facc15'; // golden wheat
            ctx.fillRect(tx + 1, ty + 1, TILE_SIZE - 2, TILE_SIZE - 2);

            // Stalk details
            ctx.strokeStyle = '#eab308';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(tx + 8, ty + TILE_SIZE - 2);
            ctx.lineTo(tx + 8 + sway, ty + 4);
            ctx.moveTo(tx + 20, ty + TILE_SIZE - 2);
            ctx.lineTo(tx + 20 + sway, ty + 4);
            ctx.stroke();
          } else if (tile.type === 'corn') {
            ctx.fillStyle = '#ca8a04';
            ctx.fillRect(tx + 1, ty + 1, TILE_SIZE - 2, TILE_SIZE - 2);
            // Green leaves
            ctx.fillStyle = '#15803d';
            ctx.beginPath();
            ctx.arc(tx + TILE_SIZE / 2 + sway, ty + TILE_SIZE / 2, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fde047';
            ctx.beginPath();
            ctx.arc(tx + TILE_SIZE / 2 + sway, ty + TILE_SIZE / 2, 4, 0, Math.PI * 2);
            ctx.fill();
          } else if (tile.type === 'sunflower') {
            ctx.fillStyle = '#166534';
            ctx.fillRect(tx + 1, ty + 1, TILE_SIZE - 2, TILE_SIZE - 2);
            // Yellow petals
            ctx.fillStyle = '#fde047';
            ctx.beginPath();
            ctx.arc(tx + TILE_SIZE / 2 + sway, ty + TILE_SIZE / 2, 8, 0, Math.PI * 2);
            ctx.fill();
            // Dark center
            ctx.fillStyle = '#451a03';
            ctx.beginPath();
            ctx.arc(tx + TILE_SIZE / 2 + sway, ty + TILE_SIZE / 2, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (tile.state === 'cut') {
          // Mowed Stripes (Alternating lawn stripes)
          ctx.fillStyle = (r + c) % 2 === 0 ? '#84cc16' : '#65a30d';
          ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
        } else if (tile.state === 'obstacle') {
          // Wooden Stumps or Boulders
          ctx.fillStyle = '#3f3f46';
          ctx.beginPath();
          ctx.arc(tx + TILE_SIZE / 2, ty + TILE_SIZE / 2, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#18181b';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.fillStyle = '#71717a';
          ctx.beginPath();
          ctx.arc(tx + TILE_SIZE / 2 - 2, ty + TILE_SIZE / 2 - 2, 4, 0, Math.PI * 2);
          ctx.fill();
        } else if (tile.state === 'barn_chute') {
          // Red Wooden Silo Chute
          ctx.fillStyle = '#b91c1c';
          ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 2;
          ctx.strokeRect(tx + 2, ty + 2, TILE_SIZE - 4, TILE_SIZE - 4);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('SILO', tx + TILE_SIZE / 2, ty + TILE_SIZE / 2);
        }
      }
    }

    // 4. Wooden Fences Surrounding Field
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 4;
    ctx.strokeRect(FIELD_OFFSET_X, FIELD_OFFSET_Y, fieldW, fieldH);

    // 5. Render Player Tractor
    renderTractor(ctx, state.player, time);

    // 6. Sparkle Particles
    particlesRef.current.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 7. Score Popups
    popupsRef.current.forEach((pop) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, pop.alpha);
      ctx.fillStyle = pop.color;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.font = '900 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeText(pop.text, pop.x, pop.y);
      ctx.fillText(pop.text, pop.x, pop.y);
      ctx.restore();
    });

    ctx.restore();
  };

  const renderTractor = (ctx: CanvasRenderingContext2D, player: CropMowerState['player'], time: number) => {
    ctx.save();
    ctx.translate(player.x, player.y);

    // Rotate according to driving direction
    let rot = 0;
    if (player.dir === 'down') rot = Math.PI;
    if (player.dir === 'left') rot = -Math.PI / 2;
    if (player.dir === 'right') rot = Math.PI / 2;
    ctx.rotate(rot);

    // Tractor Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 4, 15, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Rear Wheels
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-14, 2, 5, 12);
    ctx.fillRect(9, 2, 5, 12);

    // Front Steer Wheels
    ctx.fillRect(-12, -12, 4, 8);
    ctx.fillRect(8, -12, 4, 8);

    // Red Hood Body
    ctx.fillStyle = '#ef4444';
    ctx.strokeStyle = '#991b1b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-9, -13, 18, 22, 4);
    ctx.fill();
    ctx.stroke();

    // Yellow Engine Grille
    ctx.fillStyle = '#fde047';
    ctx.fillRect(-6, -12, 12, 4);

    // Front Rotary Mower Blade Deck
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.roundRect(-13, -17, 26, 5, 2);
    ctx.fill();

    // Spinning Blades
    ctx.save();
    ctx.translate(0, -15);
    ctx.rotate(player.bladeAngle);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(10, 0);
    ctx.stroke();
    ctx.restore();

    // Driver: Barnaby in Straw Hat
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(0, -1, 7, 0, Math.PI);
    ctx.fill();

    // Harvest Basket on Rear
    if (player.basket > 0) {
      const fillHeight = Math.min(8, Math.floor((player.basket / player.maxBasket) * 8));
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(-6, 4, 12, fillHeight);
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1;
      ctx.strokeRect(-6, 4, 12, 8);
    }

    ctx.restore();
  };

  const percentCut = hudState.totalCrops > 0 ? Math.floor((hudState.totalCut / hudState.totalCrops) * 100) : 0;

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-[420px] mx-auto select-none touch-none">
      {/* Top Header Stats Bar */}
      <div className="w-full bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-t-2xl p-3 flex items-center justify-between text-white shadow-lg">
        {/* Stage & Progress */}
        <div className="flex flex-col">
          <div className="text-xs font-bold text-amber-300">
            🌾 STAGE {hudState.stageIndex + 1}/4
          </div>
          <div className="text-[10px] text-slate-400 font-medium truncate max-w-[110px]">
            {hudState.stageName}
          </div>
        </div>

        {/* Harvest Progress Meter */}
        <div className="flex flex-col items-center w-32">
          <div className="flex justify-between w-full text-[10px] font-bold text-slate-300 mb-0.5">
            <span>MOWED</span>
            <span className="text-emerald-400">{percentCut}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-150 rounded-full"
              style={{ width: `${percentCut}%` }}
            />
          </div>
        </div>

        {/* Basket & Controls */}
        <div className="flex items-center space-x-1.5">
          <div className="text-right text-xs">
            <div className="text-slate-400 text-[10px]">BASKET</div>
            <div className={`font-bold ${hudState.basket >= hudState.maxBasket ? 'text-amber-400 animate-pulse' : 'text-slate-200'}`}>
              🧺 {hudState.basket}/{hudState.maxBasket}
            </div>
          </div>
          <button
            onClick={toggleSound}
            className="w-9 h-9 min-w-[36px] min-h-[36px] sm:w-10 sm:h-10 sm:min-w-[40px] sm:min-h-[40px] rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 flex items-center justify-center text-sm sm:text-base border border-slate-700 transition touch-manipulation"
            aria-label="Toggle Sound"
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
          <button
            onClick={handleRestartStage}
            className="w-9 h-9 min-w-[36px] min-h-[36px] sm:w-10 sm:h-10 sm:min-w-[40px] sm:min-h-[40px] rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 flex items-center justify-center text-sm border border-slate-700 transition text-slate-300 hover:text-white touch-manipulation"
            aria-label="Restart Stage"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Main Interactive Field Canvas */}
      <div className="relative w-full aspect-[400/540] bg-slate-950 overflow-hidden shadow-2xl border-x border-slate-800 touch-none">
        <canvas
          ref={canvasRef}
          width={400}
          height={540}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="w-full h-full cursor-pointer touch-none select-none"
        />

        {/* Silo Prompt When Basket is Full */}
        {hudState.basket >= hudState.maxBasket && (
          <div className="absolute top-2 inset-x-0 flex justify-center pointer-events-none">
            <div className="bg-amber-500 text-slate-950 text-xs font-black px-3 py-1 rounded-full animate-bounce shadow-lg">
              🧺 BASKET FULL! DRIVE TO TOP SILO TO DEPOSIT!
            </div>
          </div>
        )}
      </div>

      {/* Bottom Virtual D-Pad for Mobile Touch */}
      <div className="w-full bg-slate-900/95 border border-slate-800 rounded-b-2xl p-2.5 flex items-center justify-between">
        <div className="flex flex-col">
          <div className="text-xs text-slate-400 font-bold">SCORE</div>
          <div className="text-lg font-black text-amber-300">🏆 {hudState.score.toLocaleString()}</div>
        </div>

        {/* 4-Way Tactile D-Pad */}
        <div className="flex items-center space-x-1.5">
          <button
            onPointerDown={() => handleDirection('left')}
            onPointerUp={handleStop}
            onPointerCancel={handleStop}
            onPointerLeave={handleStop}
            className="w-12 h-12 rounded-xl bg-slate-800 active:bg-orange-600 text-white font-bold text-lg border border-slate-700 flex items-center justify-center active:scale-95 transition touch-manipulation"
            aria-label="Move Left"
          >
            ⬅️
          </button>

          <div className="flex flex-col space-y-1">
            <button
              onPointerDown={() => handleDirection('up')}
              onPointerUp={handleStop}
              onPointerCancel={handleStop}
              onPointerLeave={handleStop}
              className="w-12 h-12 rounded-xl bg-slate-800 active:bg-orange-600 text-white font-bold text-lg border border-slate-700 flex items-center justify-center active:scale-95 transition touch-manipulation"
              aria-label="Move Up"
            >
              ⬆️
            </button>
            <button
              onPointerDown={() => handleDirection('down')}
              onPointerUp={handleStop}
              onPointerCancel={handleStop}
              onPointerLeave={handleStop}
              className="w-12 h-12 rounded-xl bg-slate-800 active:bg-orange-600 text-white font-bold text-lg border border-slate-700 flex items-center justify-center active:scale-95 transition touch-manipulation"
              aria-label="Move Down"
            >
              ⬇️
            </button>
          </div>

          <button
            onPointerDown={() => handleDirection('right')}
            onPointerUp={handleStop}
            onPointerCancel={handleStop}
            onPointerLeave={handleStop}
            className="w-12 h-12 rounded-xl bg-slate-800 active:bg-orange-600 text-white font-bold text-lg border border-slate-700 flex items-center justify-center active:scale-95 transition touch-manipulation"
            aria-label="Move Right"
          >
            ➡️
          </button>
        </div>
      </div>

      {/* Stage Clear Modal */}
      {hudState.status === 'stage_clear' && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 rounded-2xl animate-fade-in">
          <div className="bg-slate-900 border-2 border-amber-500/50 rounded-2xl p-6 text-center text-white max-w-xs w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="text-4xl mb-2">🚜🎉</div>
            <h2 className="text-2xl font-black text-amber-400 mb-1">FIELD CLEARED!</h2>
            <p className="text-xs text-slate-400 mb-4">100% of the harvest has been collected!</p>

            <div className="bg-slate-800/80 rounded-xl p-3 mb-4 space-y-2 border border-slate-700/60">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Total Score:</span>
                <span className="font-bold text-amber-300">{hudState.score.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Crops Cut:</span>
                <span className="font-bold text-white">{hudState.totalCut}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Best Score:</span>
                <span className="font-bold text-amber-200">{highScore.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={handleNextStage}
              className="w-full min-h-[48px] bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-black text-base rounded-xl shadow-lg active:scale-95 transition touch-manipulation"
            >
              NEXT STAGE 🌾
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
