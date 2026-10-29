import React, { useEffect, useRef, useState } from 'react';
import {
  initStealthGame,
  stepStealthGame,
  calculateStealthStars,
} from './logic/engine';
import { StealthGameState, StealthInput } from './logic/types';
import { ALL_STEALTH_LEVELS } from './logic/levels';
import { stealthSound } from './systems/sound';

export const BarnyardStealthFoxContainer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<StealthGameState>(() => {
    let unlocked = 1;
    let bests = [999, 999, 999];
    if (typeof window !== 'undefined') {
      try {
        const savedLevels = localStorage.getItem('pawcade_fox_unlocked');
        if (savedLevels) unlocked = parseInt(savedLevels, 10) || 1;
        const savedBests = localStorage.getItem('pawcade_fox_bests');
        if (savedBests) bests = JSON.parse(savedBests);
      } catch {
        // Safe catch
      }
    }
    return initStealthGame(0, unlocked, bests);
  });

  const stateRef = useRef<StealthGameState>(gameState);
  stateRef.current = gameState;

  const [isMuted, setIsMuted] = useState(false);
  const [activeTab, setActiveTab] = useState<'game' | 'levels'>('game');

  const inputRef = useRef<StealthInput>({
    moveLeft: false,
    moveRight: false,
    moveUp: false,
    moveDown: false,
    action: false,
  });

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    stealthSound.setMuted(nextMuted);
  };

  const handleSelectLevel = (idx: number) => {
    if (idx + 1 > stateRef.current.unlockedLevels) return;
    const newState = initStealthGame(
      idx,
      stateRef.current.unlockedLevels,
      stateRef.current.levelBestTimes
    );
    setGameState(newState);
    setActiveTab('game');
  };

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) inputRef.current.moveLeft = true;
      if (['ArrowRight', 'KeyD'].includes(e.code)) inputRef.current.moveRight = true;
      if (['ArrowUp', 'KeyW'].includes(e.code)) inputRef.current.moveUp = true;
      if (['ArrowDown', 'KeyS'].includes(e.code)) inputRef.current.moveDown = true;
      if (['Space', 'KeyE'].includes(e.code)) inputRef.current.action = true;
      if (e.code === 'KeyR') {
        const fresh = initStealthGame(
          stateRef.current.levelIndex,
          stateRef.current.unlockedLevels,
          stateRef.current.levelBestTimes
        );
        setGameState(fresh);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) inputRef.current.moveLeft = false;
      if (['ArrowRight', 'KeyD'].includes(e.code)) inputRef.current.moveRight = false;
      if (['ArrowUp', 'KeyW'].includes(e.code)) inputRef.current.moveUp = false;
      if (['ArrowDown', 'KeyS'].includes(e.code)) inputRef.current.moveDown = false;
      if (['Space', 'KeyE'].includes(e.code)) inputRef.current.action = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      stealthSound.stopAlarm();
    };
  }, []);

  // Main Canvas Render Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const renderLoop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.033);
      lastTime = time;

      const currentState = stateRef.current;
      const prevLoot = currentState.collectedLootValue;
      const prevStatus = currentState.status;
      const prevAlarm = currentState.alarmTriggered;

      const nextState = stepStealthGame(currentState, inputRef.current, dt);

      // Sound triggers
      if (nextState.collectedLootValue > prevLoot) {
        stealthSound.playCoin();
      }
      if (nextState.alarmTriggered && !prevAlarm) {
        stealthSound.startAlarm();
      }
      if (nextState.status === 'busted' && prevStatus !== 'busted') {
        stealthSound.playBusted();
      } else if (nextState.status === 'escaped' && prevStatus !== 'escaped') {
        stealthSound.playVictory();
        try {
          localStorage.setItem('pawcade_fox_unlocked', String(nextState.unlockedLevels));
          localStorage.setItem('pawcade_fox_bests', JSON.stringify(nextState.levelBestTimes));
        } catch {
          // Safe catch
        }
      }

      stateRef.current = nextState;
      setGameState(nextState);

      // Render Canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const width = canvas.width;
          const height = canvas.height;
          const level = ALL_STEALTH_LEVELS[nextState.levelIndex];

          // Dark Manor Barn Background
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, 0, width, height);

          // Wood paneling texture
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 1;
          for (let py = 0; py < height; py += 30) {
            ctx.beginPath();
            ctx.moveTo(0, py);
            ctx.lineTo(width, py);
            ctx.stroke();
          }

          // Draw Floors (Timber platforms)
          level.floors.forEach(floor => {
            // Timber base
            ctx.fillStyle = '#451a03';
            ctx.fillRect(floor.minX, floor.y, floor.maxX - floor.minX, 16);
            // Top beam edge
            ctx.fillStyle = '#78350f';
            ctx.fillRect(floor.minX, floor.y, floor.maxX - floor.minX, 4);
          });

          // Draw Shadows (Hiding doorways & haystacks)
          level.shadows.forEach(shadow => {
            if (shadow.type === 'doorway') {
              // Dark recessed doorway
              ctx.fillStyle = '#020617';
              ctx.beginPath();
              ctx.roundRect(shadow.x, shadow.y, shadow.width, shadow.height, [8, 8, 0, 0]);
              ctx.fill();
              ctx.strokeStyle = '#1e293b';
              ctx.lineWidth = 2;
              ctx.stroke();
            } else if (shadow.type === 'haystack') {
              // Puffy hay mound
              ctx.fillStyle = '#ca8a04';
              ctx.beginPath();
              ctx.arc(shadow.x + shadow.width / 2, shadow.y + shadow.height - 10, shadow.width / 2, Math.PI, 0);
              ctx.fill();
              // Straw strands
              ctx.strokeStyle = '#eab308';
              ctx.lineWidth = 2;
              ctx.stroke();
            } else if (shadow.type === 'curtain') {
              // Velvet hanging curtain
              ctx.fillStyle = '#831843';
              ctx.fillRect(shadow.x, shadow.y, shadow.width, shadow.height);
            }
          });

          // Draw Ladders
          level.ladders.forEach(lad => {
            const h = lad.bottomY - lad.topY;
            ctx.fillStyle = '#92400e';
            // Left and right uprights
            ctx.fillRect(lad.x - 12, lad.topY, 4, h);
            ctx.fillRect(lad.x + 8, lad.topY, 4, h);
            // Rungs
            ctx.fillStyle = '#b45309';
            for (let ry = lad.topY + 8; ry < lad.bottomY; ry += 14) {
              ctx.fillRect(lad.x - 12, ry, 24, 3);
            }
          });

          // Draw Locked Doors
          nextState.doors.forEach(door => {
            ctx.save();
            ctx.translate(door.x, door.floor === 0 ? 320 : door.floor === 1 ? 210 : 80);
            if (door.isLocked) {
              // Solid oak door
              ctx.fillStyle = '#78350f';
              ctx.fillRect(-10, 0, 20, 60);
              // Padlock
              ctx.fillStyle =
                door.requiredKeyType === 'bronze'
                  ? '#d97706'
                  : door.requiredKeyType === 'silver'
                  ? '#94a3b8'
                  : '#facc15';
              ctx.beginPath();
              ctx.arc(0, 30, 6, 0, Math.PI * 2);
              ctx.fill();
              ctx.strokeStyle = '#1e293b';
              ctx.lineWidth = 2;
              ctx.stroke();
            } else {
              // Swung open door
              ctx.fillStyle = '#451a03';
              ctx.fillRect(-10, 0, 6, 60);
            }
            ctx.restore();
          });

          // Draw Escape Hole / Ladder at exit
          ctx.save();
          ctx.translate(level.escapeX, level.escapeY - 30);
          ctx.fillStyle = '#10b981';
          ctx.beginPath();
          ctx.arc(0, 15, 18, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('EXIT', 0, 20);
          ctx.restore();

          // Draw Loot Items
          nextState.loot.forEach(item => {
            if (item.collected) return;
            ctx.save();
            ctx.translate(item.x, item.y);
            // Floating bounce animation
            const bounce = Math.sin(time * 0.006 + item.x) * 3;
            ctx.translate(0, bounce);

            if (item.type === 'golden_egg') {
              ctx.fillStyle = '#facc15';
              ctx.beginPath();
              ctx.ellipse(0, 0, 9, 13, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = '#ffffff';
              ctx.beginPath();
              ctx.ellipse(-3, -4, 2, 4, 0, 0, Math.PI * 2);
              ctx.fill();
            } else if (item.type === 'diamond_horseshoe') {
              ctx.fillStyle = '#38bdf8';
              ctx.font = 'bold 16px sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText('💎', 0, 5);
            } else if (item.type === 'key') {
              ctx.fillStyle =
                item.keyType === 'bronze'
                  ? '#d97706'
                  : item.keyType === 'silver'
                  ? '#cbd5e1'
                  : '#facc15';
              ctx.font = 'bold 16px sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText('🔑', 0, 5);
            } else {
              // Cash sack
              ctx.fillStyle = '#16a34a';
              ctx.font = 'bold 16px sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText('💰', 0, 5);
            }
            ctx.restore();
          });

          // Draw Security Cameras / Spotlights
          nextState.cameras.forEach(cam => {
            ctx.save();
            ctx.translate(cam.x, cam.y);
            // Owl / Camera mount
            ctx.fillStyle = '#475569';
            ctx.beginPath();
            ctx.arc(0, 0, 8, 0, Math.PI * 2);
            ctx.fill();
            // Spotlight cone
            const coneAngle = cam.angle;
            const coneSpan = 0.35;
            ctx.fillStyle = 'rgba(254, 240, 138, 0.22)';
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(
              Math.cos(coneAngle - coneSpan) * cam.range,
              Math.sin(coneAngle - coneSpan) * cam.range
            );
            ctx.lineTo(
              Math.cos(coneAngle + coneSpan) * cam.range,
              Math.sin(coneAngle + coneSpan) * cam.range
            );
            ctx.closePath();
            ctx.fill();
            ctx.restore();
          });

          // Draw Laser Tripwires
          nextState.lasers.forEach(laser => {
            if (!laser.active) return;
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2.5;
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.moveTo(laser.x1, laser.y1);
            ctx.lineTo(laser.x2, laser.y2);
            ctx.stroke();
            ctx.shadowBlur = 0;
          });

          // Draw Guards (Bulldog & Basset Hounds)
          nextState.guards.forEach(guard => {
            ctx.save();
            ctx.translate(guard.x, guard.y - 20);

            // Flashlight vision cone for patrolling guards
            if (guard.state === 'patrolling' || guard.state === 'alerted') {
              const facingRight = guard.direction === 'right';
              ctx.fillStyle =
                guard.state === 'alerted'
                  ? 'rgba(239, 68, 68, 0.35)'
                  : 'rgba(253, 224, 71, 0.22)';
              ctx.beginPath();
              ctx.moveTo(0, 0);
              const dirMult = facingRight ? 1 : -1;
              ctx.lineTo(dirMult * guard.visionRange, -18);
              ctx.lineTo(dirMult * guard.visionRange, 18);
              ctx.closePath();
              ctx.fill();
            }

            // Guard Body (Chunky bulldog)
            ctx.fillStyle = guard.state === 'knocked_out' ? '#64748b' : '#78716c';
            ctx.beginPath();
            ctx.roundRect(-14, -10, 28, 24, 6);
            ctx.fill();

            // Head & Jowls
            ctx.fillStyle = '#57534e';
            ctx.beginPath();
            ctx.arc(guard.direction === 'right' ? 8 : -8, -12, 10, 0, Math.PI * 2);
            ctx.fill();

            // Guard Cap / Nightcap
            ctx.fillStyle = guard.state === 'sleeping' ? '#3b82f6' : '#1e3a8a';
            ctx.fillRect(guard.direction === 'right' ? 0 : -16, -24, 16, 6);

            // Sleeping Zzz bubbles
            if (guard.state === 'sleeping') {
              ctx.fillStyle = '#93c5fd';
              ctx.font = 'bold 12px sans-serif';
              ctx.fillText('Zzz...', 12, -26);
            } else if (guard.state === 'knocked_out') {
              ctx.fillStyle = '#facc15';
              ctx.font = 'bold 12px sans-serif';
              ctx.fillText('💫', -6, -26);
            } else if (guard.state === 'alerted') {
              ctx.fillStyle = '#ef4444';
              ctx.font = 'bold 16px sans-serif';
              ctx.fillText('❗', -4, -28);
            }
            ctx.restore();
          });

          // Draw Player Fox (Sly)
          const player = nextState.player;
          ctx.save();
          ctx.translate(player.x, player.y - 20);

          if (player.isHiding) {
            // Stealth Silhouette in shadows
            ctx.fillStyle = '#1e293b';
            ctx.globalAlpha = 0.55;
            ctx.beginPath();
            ctx.ellipse(0, 4, 8, 12, 0, 0, Math.PI * 2);
            ctx.fill();
            // Glowing thief eyes in the dark!
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.arc(player.direction === 'right' ? 2 : -4, 0, 2, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // Red Fox Body
            ctx.fillStyle = '#ea580c';
            ctx.beginPath();
            ctx.ellipse(0, 4, 10, 14, 0, 0, Math.PI * 2);
            ctx.fill();

            // White Fox Belly
            ctx.fillStyle = '#f8fafc';
            ctx.beginPath();
            ctx.ellipse(player.direction === 'right' ? 3 : -3, 6, 5, 8, 0, 0, Math.PI * 2);
            ctx.fill();

            // Fox Head
            ctx.fillStyle = '#ea580c';
            ctx.beginPath();
            ctx.arc(player.direction === 'right' ? 6 : -6, -8, 8, 0, Math.PI * 2);
            ctx.fill();

            // White Muzzle & Snout
            ctx.fillStyle = '#f8fafc';
            ctx.beginPath();
            ctx.ellipse(player.direction === 'right' ? 10 : -10, -6, 4, 3, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(player.direction === 'right' ? 13 : -13, -7, 1.5, 0, Math.PI * 2);
            ctx.fill();

            // Domino Mask
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.roundRect(player.direction === 'right' ? 2 : -12, -12, 10, 4, 2);
            ctx.fill();

            // Fox Ears
            ctx.fillStyle = '#ea580c';
            ctx.beginPath();
            ctx.moveTo(player.direction === 'right' ? 4 : -8, -14);
            ctx.lineTo(player.direction === 'right' ? 8 : -4, -22);
            ctx.lineTo(player.direction === 'right' ? 12 : 0, -14);
            ctx.closePath();
            ctx.fill();

            // Bushy Fox Tail
            ctx.fillStyle = '#ea580c';
            ctx.beginPath();
            const tailDir = player.direction === 'right' ? -1 : 1;
            ctx.ellipse(tailDir * 12, 8, 8, 5, tailDir * 0.4, 0, Math.PI * 2);
            ctx.fill();
            // White tail tip
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(tailDir * 17, 10, 3.5, 0, Math.PI * 2);
            ctx.fill();

            // Lockpick progress wheel
            if (player.isPickingLock) {
              ctx.strokeStyle = '#facc15';
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.arc(0, -28, 8, -Math.PI / 2, -Math.PI / 2 + player.pickProgress * Math.PI * 2);
              ctx.stroke();
            }
          }
          ctx.restore();

          // Flashing Red Alert Border when alarm sounds
          if (nextState.alarmTriggered) {
            const pulse = (Math.sin(time * 0.015) + 1) * 0.3;
            ctx.strokeStyle = `rgba(239, 68, 68, ${pulse})`;
            ctx.lineWidth = 10;
            ctx.strokeRect(0, 0, width, height);
          }
        }
      }

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, []);

  const level = ALL_STEALTH_LEVELS[gameState.levelIndex];
  const earnedStars = calculateStealthStars(
    gameState.levelIndex,
    gameState.elapsedTime,
    gameState.alarmTriggered
  );

  return (
    <div className="relative w-full h-[600px] max-w-4xl mx-auto bg-slate-950 rounded-3xl overflow-hidden shadow-2xl flex flex-col select-none touch-none">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white z-20">
        <div className="flex items-center gap-2">
          <span className="text-xl">🦊</span>
          <div>
            <h1 className="text-sm font-black tracking-wide text-amber-400">{level.name}</h1>
            <p className="text-[11px] text-slate-400">Floor Heist {gameState.levelIndex + 1} of 3</p>
          </div>
        </div>

        {/* Live HUD Stats */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
            <span className="text-slate-400">LOOT: </span>
            <span
              className={`font-bold ${
                gameState.collectedLootValue >= level.targetLoot
                  ? 'text-emerald-400'
                  : 'text-amber-400'
              }`}
            >
              ${gameState.collectedLootValue} / ${level.targetLoot}
            </span>
          </div>

          {gameState.alarmTriggered && (
            <div className="bg-red-950/80 px-2.5 py-1 rounded-lg border border-red-500 animate-pulse text-red-300 font-bold">
              ALARM: {gameState.alarmCountdown.toFixed(1)}s
            </div>
          )}

          <div className="hidden sm:flex bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
            <span className="text-slate-400">KEYS: </span>
            <span>
              {gameState.player.keysHeld.bronze ? '🥉' : ''}
              {gameState.player.keysHeld.silver ? '🥈' : ''}
              {gameState.player.keysHeld.gold ? '🥇' : ''}
              {!gameState.player.keysHeld.bronze &&
                !gameState.player.keysHeld.silver &&
                !gameState.player.keysHeld.gold &&
                'None'}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab(activeTab === 'levels' ? 'game' : 'levels')}
            className="px-2.5 py-1 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg transition"
          >
            {activeTab === 'levels' ? 'Play' : 'Levels'}
          </button>
          <button
            onClick={toggleMute}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-sm"
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="relative flex-1 bg-black">
        <canvas
          ref={canvasRef}
          width={800}
          height={480}
          className="w-full h-full object-cover"
        />

        {/* Ready Overlay */}
        {gameState.status === 'ready' && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center text-white z-10 pointer-events-none">
            <div className="bg-slate-900/90 border border-amber-500/50 p-6 rounded-2xl text-center max-w-sm shadow-xl">
              <div className="text-4xl mb-2 animate-bounce">🦊🕶️</div>
              <h2 className="text-xl font-black text-amber-400 mb-1">{level.name}</h2>
              <p className="text-xs text-slate-300 mb-3">{level.description}</p>
              <div className="text-xs bg-slate-800 p-2.5 rounded-lg text-slate-300 mb-4 text-left">
                <div className="font-bold text-amber-400 mb-1">🎮 STEALTH CONTROLS:</div>
                <div>• Move: A/D or Left/Right Arrows</div>
                <div>• Climb Ladders: W/S or Up/Down Arrows</div>
                <div>• Duck in Shadows: S or Down Arrow in doorways</div>
                <div>• Pick Lock / Knockout: Spacebar or Action Button</div>
              </div>
              <div className="text-sm font-bold text-amber-300 animate-pulse">
                Move or Tap to Start Heist!
              </div>
            </div>
          </div>
        )}

        {/* Busted Modal */}
        {gameState.status === 'busted' && (
          <div className="absolute inset-0 bg-red-950/70 backdrop-blur-sm flex flex-col items-center justify-center text-white z-10">
            <div className="bg-slate-900 border border-red-500/50 p-6 rounded-2xl text-center max-w-xs shadow-2xl">
              <div className="text-4xl mb-2">🚨🐶</div>
              <h2 className="text-xl font-black text-red-400 mb-1">BUSTED BY GUARDS!</h2>
              <p className="text-xs text-slate-300 mb-4">
                Hide in doorway shadows and knock out guards from behind!
              </p>
              <button
                onClick={() =>
                  setGameState(
                    initStealthGame(
                      gameState.levelIndex,
                      gameState.unlockedLevels,
                      gameState.levelBestTimes
                    )
                  )
                }
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-sm transition"
              >
                Try Again (R)
              </button>
            </div>
          </div>
        )}

        {/* Heist Escaped Victory Modal */}
        {gameState.status === 'escaped' && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-white z-10">
            <div className="bg-slate-900 border border-amber-500/60 p-6 rounded-2xl text-center max-w-sm shadow-2xl">
              <div className="text-3xl mb-1">🏆🦊</div>
              <h2 className="text-2xl font-black text-amber-400 mb-1">HEIST COMPLETE!</h2>
              <div className="flex justify-center gap-2 text-3xl my-2">
                <span className={earnedStars >= 1 ? 'text-amber-400' : 'text-slate-600'}>★</span>
                <span className={earnedStars >= 2 ? 'text-amber-400' : 'text-slate-600'}>★</span>
                <span className={earnedStars >= 3 ? 'text-amber-400' : 'text-slate-600'}>★</span>
              </div>
              <div className="bg-slate-800/90 rounded-xl p-3 my-3 text-xs text-left border border-slate-700 font-mono">
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-400">Loot Plundered:</span>
                  <span className="text-emerald-400 font-bold">${gameState.collectedLootValue}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-400">Clear Time:</span>
                  <span className="text-white font-bold">{gameState.elapsedTime.toFixed(1)}s</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-400">Stealth Bonus:</span>
                  <span
                    className={
                      !gameState.alarmTriggered ? 'text-emerald-400 font-bold' : 'text-red-400'
                    }
                  >
                    {!gameState.alarmTriggered ? 'Clean Ghost Heist! (+1 Star)' : 'Alarm Tripped'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {gameState.levelIndex + 1 < ALL_STEALTH_LEVELS.length ? (
                  <button
                    onClick={() => handleSelectLevel(gameState.levelIndex + 1)}
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl text-sm transition"
                  >
                    Next Heist Level ➔
                  </button>
                ) : (
                  <div className="text-xs text-amber-300 font-bold py-1">
                    🎉 You plundered the entire farm manor! Master thief!
                  </div>
                )}
                <button
                  onClick={() =>
                    setGameState(
                      initStealthGame(
                        gameState.levelIndex,
                        gameState.unlockedLevels,
                        gameState.levelBestTimes
                      )
                    )
                  }
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition"
                >
                  Replay Heist
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Levels Drawer */}
        {activeTab === 'levels' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-4 z-20">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-black text-amber-400">Select Heist Mission</h3>
                <button
                  onClick={() => setActiveTab('game')}
                  className="text-slate-400 hover:text-white text-lg font-bold"
                >
                  ✕
                </button>
              </div>
              <div className="flex flex-col gap-3">
                {ALL_STEALTH_LEVELS.map((lvl, idx) => {
                  const isLocked = idx + 1 > gameState.unlockedLevels;
                  const isCurrent = idx === gameState.levelIndex;
                  const bestTime = gameState.levelBestTimes[idx];

                  return (
                    <button
                      key={lvl.id}
                      disabled={isLocked}
                      onClick={() => handleSelectLevel(idx)}
                      className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition ${
                        isCurrent
                          ? 'bg-amber-500/20 border-amber-500 text-white'
                          : isLocked
                          ? 'bg-slate-800/40 border-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-200'
                      }`}
                    >
                      <div>
                        <div className="font-black text-sm flex items-center gap-1.5">
                          {isLocked ? '🔒' : '🦊'} {lvl.name}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{lvl.description}</div>
                      </div>
                      <div className="text-right font-mono text-xs">
                        {bestTime < 999 ? (
                          <span className="text-emerald-400 font-bold">{bestTime.toFixed(1)}s</span>
                        ) : isLocked ? (
                          <span className="text-slate-600">Locked</span>
                        ) : (
                          <span className="text-slate-400">--:--</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tactile Mobile Controls */}
      <div className="grid grid-cols-2 gap-3 p-3 bg-slate-900/95 border-t border-slate-800 z-10">
        {/* Left Thumb: Directional / Ladder Controls */}
        <div className="grid grid-cols-3 gap-1">
          <button
            onPointerDown={() => {
              inputRef.current.moveLeft = true;
            }}
            onPointerUp={() => {
              inputRef.current.moveLeft = false;
            }}
            onPointerLeave={() => {
              inputRef.current.moveLeft = false;
            }}
            className="py-3 bg-slate-800 active:bg-amber-600 text-white font-black text-base rounded-xl border border-slate-700 active:scale-95 transition"
          >
            ◀
          </button>
          <div className="flex flex-col gap-1">
            <button
              onPointerDown={() => {
                inputRef.current.moveUp = true;
              }}
              onPointerUp={() => {
                inputRef.current.moveUp = false;
              }}
              onPointerLeave={() => {
                inputRef.current.moveUp = false;
              }}
              className="py-1 bg-slate-800 active:bg-amber-600 text-white font-black text-xs rounded-lg border border-slate-700 active:scale-95 transition"
            >
              ▲ CLIMB
            </button>
            <button
              onPointerDown={() => {
                inputRef.current.moveDown = true;
              }}
              onPointerUp={() => {
                inputRef.current.moveDown = false;
              }}
              onPointerLeave={() => {
                inputRef.current.moveDown = false;
              }}
              className="py-1 bg-slate-800 active:bg-amber-600 text-white font-black text-xs rounded-lg border border-slate-700 active:scale-95 transition"
            >
              ▼ DUCK
            </button>
          </div>
          <button
            onPointerDown={() => {
              inputRef.current.moveRight = true;
            }}
            onPointerUp={() => {
              inputRef.current.moveRight = false;
            }}
            onPointerLeave={() => {
              inputRef.current.moveRight = false;
            }}
            className="py-3 bg-slate-800 active:bg-amber-600 text-white font-black text-base rounded-xl border border-slate-700 active:scale-95 transition"
          >
            ▶
          </button>
        </div>

        {/* Right Thumb: Action Buttons */}
        <div className="flex gap-2">
          <button
            onPointerDown={() => {
              inputRef.current.moveDown = true;
            }}
            onPointerUp={() => {
              inputRef.current.moveDown = false;
            }}
            onPointerLeave={() => {
              inputRef.current.moveDown = false;
            }}
            className="flex-1 py-3 bg-slate-800 active:bg-amber-600 text-amber-300 font-black text-xs rounded-xl border border-slate-700 active:scale-95 transition"
          >
            HIDE IN SHADOW
          </button>
          <button
            onPointerDown={() => {
              inputRef.current.action = true;
            }}
            onPointerUp={() => {
              inputRef.current.action = false;
            }}
            onPointerLeave={() => {
              inputRef.current.action = false;
            }}
            className="flex-1 py-3 bg-amber-500 active:bg-amber-400 text-slate-950 font-black text-xs rounded-xl border border-amber-400 active:scale-95 transition shadow-lg shadow-amber-900/40"
          >
            ACTION / PICK
          </button>
        </div>
      </div>
    </div>
  );
};

export default BarnyardStealthFoxContainer;
