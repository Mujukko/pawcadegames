import React, { useEffect, useRef, useState, useCallback } from 'react';
import { KoiPondState, KoiFish } from './logic/types';
import {
  initKoiPond,
  dropFoodPellet,
  triggerSingingBowl,
  activatePetalShower,
  updateKoiPond,
  advanceToNextStage,
  STAGES,
} from './logic/engine';
import { koiPondAudio } from './systems/sound';
import { analytics } from '../../lib/analytics';

export const KoiPondZenContainer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<KoiPondState>(initKoiPond(1, 480, 640));

  const [uiStage, setUiStage] = useState(1);
  const [uiZen, setUiZen] = useState(0);
  const [uiTargetZen, setUiTargetZen] = useState(150);
  const [uiMultiplier, setUiMultiplier] = useState(1);
  const [uiBowlCooldown, setUiBowlCooldown] = useState(0);
  const [uiStageCompleted, setUiStageCompleted] = useState(false);
  const [uiGameCompleted, setUiGameCompleted] = useState(false);
  const [isMuted, setIsMuted] = useState(koiPondAudio.getMuted());
  const [pelletMode, setPelletMode] = useState<'normal' | 'golden'>('normal');

  // Sync canvas size
  const updatePondDimensions = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const w = parent.clientWidth || 480;
    const h = parent.clientHeight || 640;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = w * dpr;
    canvas.height = h * dpr;

    stateRef.current.pondWidth = w;
    stateRef.current.pondHeight = h;
  }, []);

  // Initialize and resize
  useEffect(() => {
    updatePondDimensions();
    window.addEventListener('resize', updatePondDimensions);
    analytics.track('game_started', { gameId: 'koi-pond-zen' });
    analytics.track('level_started', { gameId: 'koi-pond-zen', levelId: 1 });

    return () => {
      window.removeEventListener('resize', updatePondDimensions);
    };
  }, [updatePondDimensions]);

  // Main 60 FPS Game Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min(0.05, (time - lastTime) / 1000);
      lastTime = time;

      const { newState, result } = updateKoiPond(stateRef.current, dt);
      stateRef.current = newState;

      // Audio feedback for game events
      if (result.fedEvents.length > 0) {
        koiPondAudio.playFishNibble();
      }
      if (result.bloomedPadsCount > 0) {
        koiPondAudio.playLotusBloom();
      }
      if (result.stageJustCompleted) {
        koiPondAudio.playZenLevelComplete();
        analytics.track('level_completed', {
          gameId: 'koi-pond-zen',
          levelId: newState.stage,
          stars: 3,
        });
        setUiStageCompleted(true);
      }
      if (result.gameJustCompleted) {
        analytics.track('game_won', { gameId: 'koi-pond-zen' });
        setUiGameCompleted(true);
      }

      // Update UI state periodically
      setUiZen(newState.zenPoints);
      setUiTargetZen(newState.targetZen);
      setUiMultiplier(newState.multiplier);
      setUiBowlCooldown(Math.ceil(newState.singingBowlCooldown));

      // Render Canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          renderCanvas(ctx, newState, canvas.width, canvas.height);
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Canvas 2D Rendering
  const renderCanvas = (
    ctx: CanvasRenderingContext2D,
    state: KoiPondState,
    pixelW: number,
    pixelH: number
  ) => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    ctx.save();
    ctx.scale(dpr, dpr);

    const w = state.pondWidth;
    const h = state.pondHeight;

    // 1. Water Background with Soft Zen Gradient
    const bgGrad = ctx.createRadialGradient(
      w * 0.5,
      h * 0.45,
      w * 0.15,
      w * 0.5,
      h * 0.5,
      Math.max(w, h) * 0.7
    );

    if (state.stage === 4) {
      // Moonlit night theme
      bgGrad.addColorStop(0, '#0f2c3a');
      bgGrad.addColorStop(0.5, '#0a1d28');
      bgGrad.addColorStop(1, '#050f15');
    } else if (state.stage === 2) {
      // Cherry blossom basin theme
      bgGrad.addColorStop(0, '#134e4a');
      bgGrad.addColorStop(0.6, '#0f3d3a');
      bgGrad.addColorStop(1, '#0b2b29');
    } else {
      // Lush turquoise zen pond
      bgGrad.addColorStop(0, '#115e59');
      bgGrad.addColorStop(0.6, '#0f766e');
      bgGrad.addColorStop(1, '#042f2e');
    }

    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Caustic Water Highlights
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.ellipse(
        w * 0.3 + (i % 2) * (w * 0.4),
        h * 0.25 + Math.floor(i / 2) * (h * 0.45),
        w * 0.22,
        h * 0.14,
        (i * Math.PI) / 4,
        0,
        Math.PI * 2
      );
      ctx.stroke();
    }

    // 3. Water Lily Pads (Bottom Layer)
    for (const pad of state.lilyPads) {
      renderLilyPad(ctx, pad);
    }

    // 4. Food Pellets Sinking
    for (const pellet of state.pellets) {
      renderPellet(ctx, pellet);
    }

    // 5. Koi Fish Swimming (Mid Layer)
    for (const fish of state.fish) {
      renderKoiFish(ctx, fish);
    }

    // 6. Lotus Blossoms on Top of Lily Pads
    for (const pad of state.lilyPads) {
      if (pad.bloomProgress > 0) {
        renderLotusFlower(ctx, pad);
      }
    }

    // 7. Water Ripples (Top Water Layer)
    for (const rip of state.ripples) {
      ctx.beginPath();
      ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
      ctx.strokeStyle = rip.color || `rgba(255, 255, 255, ${rip.alpha * 0.7})`;
      ctx.lineWidth = Math.max(1, 3.5 * rip.alpha);
      ctx.stroke();
    }

    // 8. Ambient Falling Petals / Fireflies
    for (const p of state.particles) {
      renderAmbientParticle(ctx, p);
    }

    ctx.restore();
  };

  // Render a Single Koi Fish with Natural Curves & Fins
  const renderKoiFish = (ctx: CanvasRenderingContext2D, fish: KoiFish) => {
    ctx.save();
    ctx.translate(fish.x, fish.y);
    ctx.rotate(fish.angle);

    const len = fish.length;
    const wid = fish.width;
    const tailWiggle = Math.sin(fish.wigglePhase) * 6;

    // A. Soft Fish Shadow Under Water
    ctx.beginPath();
    ctx.ellipse(4, 10, len * 0.45, wid * 0.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(2, 44, 34, 0.35)';
    ctx.fill();

    // B. Flowing Tail Fin with Sine Sway
    ctx.save();
    ctx.translate(-len * 0.48, tailWiggle * 0.5);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-len * 0.3, tailWiggle - wid * 0.6, -len * 0.45, tailWiggle * 1.2 - wid * 0.4);
    ctx.quadraticCurveTo(-len * 0.3, tailWiggle * 0.5, -len * 0.45, tailWiggle * 1.2 + wid * 0.4);
    ctx.quadraticCurveTo(-len * 0.3, tailWiggle + wid * 0.6, 0, 0);

    const tailGrad = ctx.createLinearGradient(0, 0, -len * 0.45, 0);
    if (fish.breed === 'yamabuki') {
      tailGrad.addColorStop(0, 'rgba(250, 204, 21, 0.85)');
      tailGrad.addColorStop(1, 'rgba(254, 240, 138, 0.35)');
    } else if (fish.breed === 'butterfly_sakura') {
      tailGrad.addColorStop(0, 'rgba(244, 114, 182, 0.85)');
      tailGrad.addColorStop(1, 'rgba(253, 232, 242, 0.4)');
    } else {
      tailGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
      tailGrad.addColorStop(1, 'rgba(226, 232, 240, 0.35)');
    }
    ctx.fillStyle = tailGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // C. Pectoral Fins (Flapping left & right)
    const finFlap = Math.cos(fish.wigglePhase * 0.8) * 0.15;
    // Left Fin
    ctx.save();
    ctx.translate(len * 0.15, -wid * 0.65);
    ctx.rotate(-0.4 + finFlap);
    ctx.beginPath();
    ctx.ellipse(0, 0, len * 0.22, wid * 0.35, -0.4, 0, Math.PI * 2);
    ctx.fillStyle = tailGrad;
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Right Fin
    ctx.save();
    ctx.translate(len * 0.15, wid * 0.65);
    ctx.rotate(0.4 - finFlap);
    ctx.beginPath();
    ctx.ellipse(0, 0, len * 0.22, wid * 0.35, 0.4, 0, Math.PI * 2);
    ctx.fillStyle = tailGrad;
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // D. Main Body (Streamlined fish silhouette)
    ctx.beginPath();
    // Head tip at (len * 0.48, 0)
    ctx.moveTo(len * 0.48, 0);
    // Right flank curve
    ctx.bezierCurveTo(
      len * 0.3,
      wid * 0.8,
      -len * 0.1,
      wid * 0.85,
      -len * 0.48,
      tailWiggle * 0.4
    );
    // Left flank curve
    ctx.bezierCurveTo(
      -len * 0.1,
      -wid * 0.85,
      len * 0.3,
      -wid * 0.8,
      len * 0.48,
      0
    );
    ctx.closePath();

    // Body Base Color
    if (fish.breed === 'yamabuki') {
      const g = ctx.createLinearGradient(len * 0.4, 0, -len * 0.4, 0);
      g.addColorStop(0, '#fef08a');
      g.addColorStop(0.4, '#facc15');
      g.addColorStop(1, '#ca8a04');
      ctx.fillStyle = g;
    } else if (fish.breed === 'showa') {
      ctx.fillStyle = '#1e293b'; // deep ink black base
    } else if (fish.breed === 'butterfly_sakura') {
      const g = ctx.createLinearGradient(len * 0.4, 0, -len * 0.4, 0);
      g.addColorStop(0, '#fce7f3');
      g.addColorStop(0.5, '#fbcfe8');
      g.addColorStop(1, '#f472b6');
      ctx.fillStyle = g;
    } else {
      // Kohaku & Tancho (Snow white base)
      ctx.fillStyle = '#f8fafc';
    }
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // E. Breed Specific Markings
    if (fish.breed === 'kohaku') {
      // Scarlet Menkaburi patch on forehead & saddle
      ctx.fillStyle = '#dc2626';
      // Head patch
      ctx.beginPath();
      ctx.ellipse(len * 0.28, 0, len * 0.14, wid * 0.48, 0, 0, Math.PI * 2);
      ctx.fill();
      // Mid saddle patch
      ctx.beginPath();
      ctx.ellipse(-len * 0.08, -wid * 0.1, len * 0.16, wid * 0.55, 0.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (fish.breed === 'tancho') {
      // Perfect Crimson Sun Circle on Crown
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(len * 0.28, 0, wid * 0.45, 0, Math.PI * 2);
      ctx.fill();
    } else if (fish.breed === 'showa') {
      // Crimson & White blotches on black
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.ellipse(len * 0.2, -wid * 0.15, len * 0.12, wid * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.ellipse(-len * 0.15, wid * 0.15, len * 0.14, wid * 0.38, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // F. Cute Eyes & Barbels (Whiskers)
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(len * 0.34, -wid * 0.42, 2.5, 0, Math.PI * 2);
    ctx.arc(len * 0.34, wid * 0.42, 2.5, 0, Math.PI * 2);
    ctx.fill();
    // Eye shine
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(len * 0.35, -wid * 0.44, 1, 0, Math.PI * 2);
    ctx.arc(len * 0.35, wid * 0.4, 1, 0, Math.PI * 2);
    ctx.fill();

    // Whiskers
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(len * 0.46, -wid * 0.2);
    ctx.lineTo(len * 0.58, -wid * 0.35);
    ctx.moveTo(len * 0.46, wid * 0.2);
    ctx.lineTo(len * 0.58, wid * 0.35);
    ctx.stroke();

    ctx.restore();
  };

  // Render Water Lily Pad
  const renderLilyPad = (ctx: CanvasRenderingContext2D, pad: any) => {
    ctx.save();
    ctx.translate(pad.x, pad.y);
    ctx.rotate(pad.rotation);

    // Soft Shadow
    ctx.beginPath();
    ctx.ellipse(3, 5, pad.radius, pad.radius * 0.9, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(2, 44, 34, 0.4)';
    ctx.fill();

    // Lily Pad Leaf with V-shaped slit notch
    const r = pad.radius;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(r * 0.25, -r * 0.95);
    ctx.arc(0, 0, r, -Math.PI * 0.4, Math.PI * 1.4, false);
    ctx.closePath();

    const leafGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, r);
    leafGrad.addColorStop(0, '#15803d');
    leafGrad.addColorStop(0.7, '#16a34a');
    leafGrad.addColorStop(1, '#166534');
    ctx.fillStyle = leafGrad;
    ctx.fill();

    // Veins radiating from center
    ctx.strokeStyle = 'rgba(134, 239, 172, 0.35)';
    ctx.lineWidth = 1.2;
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * r * 0.85, Math.sin(a) * r * 0.85);
      ctx.stroke();
    }

    ctx.restore();
  };

  // Render Lotus Flower on Lily Pad
  const renderLotusFlower = (ctx: CanvasRenderingContext2D, pad: any) => {
    ctx.save();
    ctx.translate(pad.x, pad.y);

    const progress = pad.bloomProgress; // 0 to 1
    const petalScale = 0.4 + progress * 0.6;
    const petalCount = 8;

    for (let i = 0; i < petalCount; i++) {
      const angle = (Math.PI * 2 * i) / petalCount + (pad.rotation || 0);
      ctx.save();
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.ellipse(0, -pad.radius * 0.45 * progress, 7 * petalScale, 14 * petalScale, 0, 0, Math.PI * 2);
      ctx.fillStyle = pad.bloomColor || '#f472b6';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.8;
      ctx.stroke();
      ctx.restore();
    }

    // Golden Stamen Center
    ctx.beginPath();
    ctx.arc(0, 0, 5 * petalScale, 0, Math.PI * 2);
    ctx.fillStyle = '#fde047';
    ctx.fill();
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  };

  // Render Food Pellet
  const renderPellet = (ctx: CanvasRenderingContext2D, pellet: any) => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(pellet.x, pellet.y, pellet.radius, 0, Math.PI * 2);
    ctx.fillStyle = pellet.isGolden ? '#facc15' : '#b45309';
    ctx.fill();
    ctx.strokeStyle = pellet.isGolden ? '#fef08a' : '#78350f';
    ctx.lineWidth = 1;
    ctx.stroke();

    if (pellet.isGolden) {
      // Golden glow ring
      ctx.beginPath();
      ctx.arc(pellet.x, pellet.y, pellet.radius + 3, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(253, 224, 71, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.restore();
  };

  // Render Ambient Particles
  const renderAmbientParticle = (ctx: CanvasRenderingContext2D, p: any) => {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);

    if (p.type === 'sakura_petal') {
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size * 0.6, p.size, 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(253, 164, 175, ${p.alpha})`;
      ctx.fill();
    } else if (p.type === 'firefly') {
      ctx.beginPath();
      ctx.arc(0, 0, p.size * 0.8, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(254, 240, 138, ${p.alpha})`;
      ctx.fill();
      // Glow
      ctx.beginPath();
      ctx.arc(0, 0, p.size * 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(250, 204, 21, ${p.alpha * 0.35})`;
      ctx.fill();
    } else {
      // Sparkle
      ctx.beginPath();
      ctx.arc(0, 0, p.size * 0.7, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * 0.8})`;
      ctx.fill();
    }
    ctx.restore();
  };

  // Touch & Click Interaction
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const isGolden = pelletMode === 'golden';
    stateRef.current = dropFoodPellet(stateRef.current, x, y, isGolden);
    koiPondAudio.playWaterPlink(isGolden);
  };

  // Singing Bowl Action
  const handleSingingBowl = () => {
    const res = triggerSingingBowl(stateRef.current);
    if (res.success) {
      stateRef.current = res.state;
      koiPondAudio.playSingingBowl();
    }
  };

  // Petal Shower Action
  const handlePetalShower = () => {
    stateRef.current = activatePetalShower(stateRef.current);
    koiPondAudio.playBambooClack();
  };

  // Advance Stage
  const handleNextStage = () => {
    const nextState = advanceToNextStage(stateRef.current);
    stateRef.current = nextState;
    setUiStage(nextState.stage);
    setUiStageCompleted(false);
    analytics.track('level_started', {
      gameId: 'koi-pond-zen',
      levelId: nextState.stage,
    });
  };

  // Restart / Reset
  const handleRestart = () => {
    stateRef.current = initKoiPond(1, stateRef.current.pondWidth, stateRef.current.pondHeight);
    setUiStage(1);
    setUiStageCompleted(false);
    setUiGameCompleted(false);
    analytics.track('game_restarted', { gameId: 'koi-pond-zen' });
  };

  const progressPct = Math.min(100, Math.floor((uiZen / uiTargetZen) * 100));

  return (
    <div className="relative w-full h-[620px] max-w-lg mx-auto bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-teal-500/20 select-none touch-none">
      {/* 60 FPS Interactive Pond Canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        className="w-full h-full block cursor-pointer"
        style={{ touchAction: 'none' }}
      />

      {/* Top Zen HUD */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
        {/* Stage & Zen Meter */}
        <div className="bg-slate-900/85 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-teal-500/30 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-teal-300">
              {STAGES[uiStage - 1]?.title || 'Zen Pond'}
            </span>
            {uiMultiplier > 1 && (
              <span className="bg-gradient-to-r from-amber-400 to-pink-500 text-slate-950 font-black text-[11px] px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                {uiMultiplier}x ZEN
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-28 sm:w-36 h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 transition-all duration-300 rounded-full"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-xs font-mono font-bold text-teal-200">
              {uiZen} / {uiTargetZen}
            </span>
          </div>
        </div>

        {/* Audio & Control Buttons */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => {
              const muted = koiPondAudio.toggleMute();
              setIsMuted(muted);
            }}
            className="w-10 h-10 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-teal-500/30 flex items-center justify-center text-lg shadow-lg active:scale-95 transition-transform"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>
      </div>

      {/* Bottom Zen Tools & Boosters Tray */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-auto">
        {/* Food Pellet Mode Toggle */}
        <div className="flex items-center bg-slate-900/90 backdrop-blur-md p-1 rounded-2xl border border-teal-500/30 shadow-lg">
          <button
            onClick={() => setPelletMode('normal')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 min-h-[44px] ${
              pelletMode === 'normal'
                ? 'bg-teal-500 text-slate-950 shadow-md font-extrabold'
                : 'text-teal-300 hover:bg-slate-800/60'
            }`}
          >
            <span>🟤</span>
            <span>Food</span>
          </button>
          <button
            onClick={() => setPelletMode('golden')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 min-h-[44px] ${
              pelletMode === 'golden'
                ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold'
                : 'text-amber-300 hover:bg-slate-800/60'
            }`}
          >
            <span>🟡</span>
            <span>Gold</span>
          </button>
        </div>

        {/* Singing Bowl & Petal Shower Boosters */}
        <div className="flex items-center gap-2">
          {/* Singing Bowl */}
          <button
            onClick={handleSingingBowl}
            disabled={uiBowlCooldown > 0}
            className={`min-h-[44px] px-3.5 py-2 rounded-2xl font-bold text-xs backdrop-blur-md flex items-center gap-1.5 shadow-lg transition-transform active:scale-95 border ${
              uiBowlCooldown > 0
                ? 'bg-slate-800/80 border-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-500/90 to-yellow-500/90 border-amber-400 text-slate-950'
            }`}
          >
            <span>🔔</span>
            <span>{uiBowlCooldown > 0 ? `${uiBowlCooldown}s` : 'Chime'}</span>
          </button>

          {/* Petal Shower */}
          <button
            onClick={handlePetalShower}
            className="min-h-[44px] px-3.5 py-2 rounded-2xl font-bold text-xs backdrop-blur-md flex items-center gap-1.5 shadow-lg transition-transform active:scale-95 border border-pink-400/80 bg-pink-500/80 text-white"
          >
            <span>🌸</span>
            <span>Sakura</span>
          </button>
        </div>
      </div>

      {/* Stage Completed Modal */}
      {uiStageCompleted && !uiGameCompleted && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-6 z-20">
          <div className="bg-slate-900 border border-teal-500/40 rounded-3xl p-6 text-center max-w-sm shadow-2xl animate-fade-in">
            <div className="text-5xl mb-3">🪷🎏</div>
            <h3 className="text-xl font-black text-teal-300">
              Zen Garden Flourishing!
            </h3>
            <p className="text-sm text-teal-100/80 mt-2">
              You achieved {uiZen} Zen Points. The lotus lilies are in glorious bloom and new koi swim into your sanctuary!
            </p>
            <div className="mt-5 flex flex-col gap-2.5">
              <button
                onClick={handleNextStage}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 font-black text-sm shadow-lg hover:brightness-110 active:scale-95 transition-all min-h-[44px]"
              >
                Enter Next Sanctuary ({uiStage + 1}/{STAGES.length}) 🌿
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grand Finale Victory Modal */}
      {uiGameCompleted && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 z-30">
          <div className="bg-slate-900 border border-amber-400/60 rounded-3xl p-6 text-center max-w-sm shadow-2xl animate-fade-in">
            <div className="text-5xl mb-3">👑🎏🌸</div>
            <h3 className="text-2xl font-black text-amber-300">
              Master of Zen Waters!
            </h3>
            <p className="text-sm text-slate-300 mt-2">
              All 4 sanctuaries have attained total peace. The legendary Butterfly Sakura Koi and Tancho grace your crystal pond!
            </p>
            <div className="mt-5 flex flex-col gap-2.5">
              <button
                onClick={handleRestart}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black text-sm shadow-lg hover:brightness-110 active:scale-95 transition-all min-h-[44px]"
              >
                Relax in Gardens Again 🌸
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
