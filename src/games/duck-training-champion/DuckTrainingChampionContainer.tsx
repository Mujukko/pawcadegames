import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Trophy,
  Coins,
  ShoppingBag,
  ArrowLeft,
  HelpCircle,
  X,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  CornSeed,
  DuckChampionState,
  DuckHat,
  GameView,
  RunningTrainState,
  FlyingTrainState,
  SwimmingTrainState,
  RaceState,
} from './logic/types';
import {
  initializeDuckGame,
  startRunningTraining,
  stepRunningTraining,
  startFlyingTraining,
  stepFlyingTraining,
  startSwimmingTraining,
  stepSwimmingTraining,
  startRace,
  stepRace,
  addXpToSkill,
  buyHat,
  equipHat,
  buyEnergySeed,
  getXpForNextLevel,
  HAT_INFO,
} from './logic/engine';
import { duckChampionAudio } from './systems/sound';
import { analytics } from '../../lib/analytics';

export const DuckTrainingChampionContainer: React.FC = () => {
  const [gameState, setGameState] = useState<DuckChampionState>(() => initializeDuckGame());
  const [isMuted, setIsMuted] = useState(duckChampionAudio.isMuted());
  const [showHelp, setShowHelp] = useState(false);
  const [jumpPressed, setJumpPressed] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const jumpPressedRef = useRef(false);

  const handleMuteToggle = () => {
    const next = duckChampionAudio.toggleMute();
    setIsMuted(next);
  };

  const handleStartTrain = (skill: 'running' | 'flying' | 'swimming') => {
    duckChampionAudio.playQuack();
    if (skill === 'running') {
      const train = startRunningTraining(gameState.stats);
      setGameState((prev) => ({ ...prev, view: 'train_running', runningTrain: train }));
    } else if (skill === 'flying') {
      const train = startFlyingTraining(gameState.stats);
      setGameState((prev) => ({ ...prev, view: 'train_flying', flyingTrain: train }));
    } else {
      const train = startSwimmingTraining(gameState.stats);
      setGameState((prev) => ({ ...prev, view: 'train_swimming', swimmingTrain: train }));
    }
  };

  const handleStartRace = (raceType: 'sprint' | 'swim_dash' | 'triathlon') => {
    duckChampionAudio.playRaceWhistle();
    const race = startRace(gameState.stats, raceType);
    setGameState((prev) => ({ ...prev, view: 'race', race }));
  };

  const handleFinishTraining = (skill: 'running' | 'flying' | 'swimming', xpEarned: number) => {
    const { stats: nextStats, leveledUp } = addXpToSkill(gameState.stats, skill, xpEarned);
    if (leveledUp) {
      duckChampionAudio.playLevelUp();
      confetti({ particleCount: 40, spread: 60 });
    }
    setGameState((prev) => ({
      ...prev,
      stats: nextStats,
      view: 'hub',
      runningTrain: null,
      flyingTrain: null,
      swimmingTrain: null,
      lastTrainedSkill: skill,
      lastXpGained: xpEarned,
    }));
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        jumpPressedRef.current = true;
        setJumpPressed(true);
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        handleMuteToggle();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) {
        jumpPressedRef.current = false;
        setJumpPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Main Canvas Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Render based on current view
      if (gameState.view === 'train_running' && gameState.runningTrain) {
        // --- RUNNING TRAINING ---
        const { train: nextTrain, seedPicked, collided } = stepRunningTraining(
          gameState.runningTrain,
          jumpPressedRef.current,
          dt
        );
        gameState.runningTrain = nextTrain;

        if (seedPicked) duckChampionAudio.playSeedMunch();
        if (collided) {
          duckChampionAudio.playQuack();
          const xp = Math.floor(nextTrain.distance / 12 + nextTrain.seedsCollected * 6);
          handleFinishTraining('running', xp);
          return;
        }

        // Sky & Track
        ctx.fillStyle = '#7dd3fc';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(0, 240, width, height - 240);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(0, 280, width, height - 280);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.setLineDash([16, 16]);
        ctx.beginPath();
        ctx.moveTo(0, 310);
        ctx.lineTo(width, 310);
        ctx.stroke();
        ctx.setLineDash([]);

        // Duck
        drawDuck(ctx, 80, nextTrain.duckY, gameState.stats.activeHat, jumpPressedRef.current ? 'jumping' : 'running');

        // Obstacles
        nextTrain.obstacles.forEach((obs) => {
          if (obs.x < -30 || obs.x > width + 30) return;
          ctx.fillStyle = obs.type === 'fence' ? '#b45309' : '#64748b';
          if (obs.type === 'fence') {
            ctx.fillRect(obs.x, 280 - 32, 16, 32);
          } else {
            ctx.beginPath();
            ctx.arc(obs.x + 10, 280 - 10, 12, 0, Math.PI * 2);
            ctx.fill();
          }
        });

        // Seeds
        nextTrain.seeds.forEach((s) => {
          if (s.collected || s.x < -20 || s.x > width + 20) return;
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(s.x, s.y, 6, 0, Math.PI * 2);
          ctx.fill();
        });
      } else if (gameState.view === 'train_flying' && gameState.flyingTrain) {
        // --- FLYING TRAINING ---
        const { train: nextTrain, seedPicked, crashed } = stepFlyingTraining(
          gameState.flyingTrain,
          jumpPressedRef.current,
          dt
        );
        gameState.flyingTrain = nextTrain;

        if (seedPicked) duckChampionAudio.playSeedMunch();
        if (crashed) {
          duckChampionAudio.playQuack();
          const xp = Math.floor(nextTrain.distance / 12 + nextTrain.seedsCollected * 6);
          handleFinishTraining('flying', xp);
          return;
        }

        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#16a34a';
        ctx.fillRect(0, 330, width, height - 330);

        drawDuck(ctx, 80, nextTrain.duckY, gameState.stats.activeHat, 'flying');

        nextTrain.seeds.forEach((s) => {
          if (s.collected || s.x < -20 || s.x > width + 20) return;
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(s.x, s.y, 7, 0, Math.PI * 2);
          ctx.fill();
        });
      } else if (gameState.view === 'train_swimming' && gameState.swimmingTrain) {
        // --- SWIMMING TRAINING ---
        const { train: nextTrain, seedPicked, collided } = stepSwimmingTraining(
          gameState.swimmingTrain,
          jumpPressedRef.current,
          dt
        );
        gameState.swimmingTrain = nextTrain;

        if (seedPicked) duckChampionAudio.playSeedMunch();
        if (collided) {
          duckChampionAudio.playQuack();
          const xp = Math.floor(nextTrain.distance / 12 + nextTrain.seedsCollected * 6);
          handleFinishTraining('swimming', xp);
          return;
        }

        ctx.fillStyle = '#7dd3fc';
        ctx.fillRect(0, 0, width, 180);
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(0, 180, width, height - 180);

        drawDuck(ctx, 80, nextTrain.duckY, gameState.stats.activeHat, nextTrain.isDiving ? 'diving' : 'swimming');

        nextTrain.obstacles.forEach((obs) => {
          if (obs.x < -30 || obs.x > width + 30) return;
          ctx.fillStyle = '#78350f';
          ctx.fillRect(obs.x, obs.y - 10, 24, 20);
        });

        nextTrain.seeds.forEach((s) => {
          if (s.collected || s.x < -20 || s.x > width + 20) return;
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(s.x, s.y, 6, 0, Math.PI * 2);
          ctx.fill();
        });
      } else if (gameState.view === 'race' && gameState.race) {
        // --- OLYMPIC RACE ---
        const { race: nextRace, justFinished, wonFirstPlace } = stepRace(
          gameState.race,
          jumpPressedRef.current,
          dt
        );
        gameState.race = nextRace;

        if (justFinished) {
          if (wonFirstPlace) {
            duckChampionAudio.playOlympicVictory();
            confetti({ particleCount: 70, spread: 80 });
            setGameState((prev) => ({
              ...prev,
              stats: {
                ...prev.stats,
                coins: prev.stats.coins + 50,
                racesWon: prev.stats.racesWon + 1,
              },
            }));
          } else {
            duckChampionAudio.playQuack();
          }
        }

        // Draw 4-lane athletic track
        ctx.fillStyle = '#7dd3fc';
        ctx.fillRect(0, 0, width, 80);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(0, 80, width, height - 80);

        for (let l = 0; l <= 4; l++) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, 80 + l * 60);
          ctx.lineTo(width, 80 + l * 60);
          ctx.stroke();
        }

        // Finish line at 800m
        const finishX = ((800 - nextRace.playerProgress) / 800) * (width * 0.7) + 120;
        if (finishX > 0 && finishX < width) {
          ctx.fillStyle = '#ffffff';
          for (let y = 80; y < 320; y += 16) {
            ctx.fillRect(finishX, y, 8, 8);
            ctx.fillRect(finishX + 8, y + 8, 8, 8);
          }
        }

        // Player Duck (Lane 0: Y=110)
        drawDuck(ctx, 120, 110, gameState.stats.activeHat, 'running');

        // Rivals
        nextRace.rivals.forEach((r, idx) => {
          const rx = 120 + ((r.progress - nextRace.playerProgress) / 100) * 40;
          drawRivalDuck(ctx, rx, 170 + idx * 55, r.color, r.hat);
        });
      } else if (gameState.view === 'hub') {
        // --- HUB VIEW ---
        ctx.fillStyle = '#fef3c7';
        ctx.fillRect(0, 0, width, height);

        // Cheerful barn gym floor
        ctx.fillStyle = '#b45309';
        ctx.fillRect(0, 280, width, height - 280);

        // Center Hero Duck
        drawDuck(ctx, width * 0.5, 260, gameState.stats.activeHat, 'happy', 1.6);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [gameState.view, gameState.stats.activeHat]);

  return (
    <div className="relative w-full h-[100dvh] bg-slate-900 overflow-hidden flex flex-col justify-between select-none touch-none text-white">
      {/* Top Header Bar */}
      <header className="z-20 flex items-center justify-between px-3 sm:px-6 py-2.5 bg-slate-900/90 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-2 sm:gap-4">
          {gameState.view !== 'hub' ? (
            <button
              onClick={() => setGameState((prev) => ({ ...prev, view: 'hub' }))}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 active:scale-95 rounded-xl text-xs font-bold transition-transform"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Gym Hub</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 rounded-xl">
              <span className="text-xl">🦆</span>
              <span className="font-display font-extrabold text-sm sm:text-base text-amber-300">
                Duck Champion
              </span>
            </div>
          )}

          <div className="flex items-center gap-1 bg-yellow-500/20 border border-yellow-500/30 px-2.5 py-1 rounded-xl text-xs font-bold text-yellow-300">
            <Coins className="w-3.5 h-3.5 text-yellow-400" />
            <span>{gameState.stats.coins}</span>
          </div>

          <div className="flex items-center gap-1 bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 rounded-xl text-xs font-bold text-emerald-300">
            <Trophy className="w-3.5 h-3.5 text-yellow-400" />
            <span>{gameState.stats.racesWon} Wins</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {gameState.view === 'hub' && (
            <button
              onClick={() => setGameState((prev) => ({ ...prev, view: 'shop' }))}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 rounded-xl font-extrabold text-xs shadow-md transition-transform"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Boutique</span>
            </button>
          )}

          <button
            onClick={handleMuteToggle}
            className="p-1.5 bg-white/10 hover:bg-white/20 active:scale-95 rounded-xl transition-transform"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-white" />}
          </button>

          <button
            onClick={() => setShowHelp(true)}
            className="p-1.5 bg-white/10 hover:bg-white/20 active:scale-95 rounded-xl transition-transform"
            aria-label="Help"
          >
            <HelpCircle className="w-4 h-4 text-white/80" />
          </button>
        </div>
      </header>

      {/* Main Canvas Viewport */}
      <main className="relative flex-1 w-full h-full flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={800}
          height={480}
          className="w-full h-full object-cover touch-none"
        />

        {/* Hub Overlay Controls */}
        {gameState.view === 'hub' && (
          <div className="absolute inset-x-0 bottom-3 px-4 max-w-xl mx-auto flex flex-col gap-2.5">
            {/* Skill Level Cards */}
            <div className="grid grid-cols-3 gap-2">
              {/* Running */}
              <button
                onClick={() => handleStartTrain('running')}
                className="bg-slate-900/90 border border-white/20 p-2.5 rounded-2xl flex flex-col items-center hover:border-amber-400 transition-all active:scale-95 shadow-lg"
              >
                <span className="text-xl">🏃</span>
                <span className="font-extrabold text-xs text-white">Running</span>
                <span className="text-amber-400 text-xs font-bold">Lv {gameState.stats.runningLevel}</span>
                <div className="w-full bg-white/10 h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="bg-amber-400 h-full"
                    style={{
                      width: `${(gameState.stats.runningXp / getXpForNextLevel(gameState.stats.runningLevel)) * 100}%`,
                    }}
                  />
                </div>
              </button>

              {/* Flying */}
              <button
                onClick={() => handleStartTrain('flying')}
                className="bg-slate-900/90 border border-white/20 p-2.5 rounded-2xl flex flex-col items-center hover:border-sky-400 transition-all active:scale-95 shadow-lg"
              >
                <span className="text-xl">🪽</span>
                <span className="font-extrabold text-xs text-white">Flying</span>
                <span className="text-sky-400 text-xs font-bold">Lv {gameState.stats.flyingLevel}</span>
                <div className="w-full bg-white/10 h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="bg-sky-400 h-full"
                    style={{
                      width: `${(gameState.stats.flyingXp / getXpForNextLevel(gameState.stats.flyingLevel)) * 100}%`,
                    }}
                  />
                </div>
              </button>

              {/* Swimming */}
              <button
                onClick={() => handleStartTrain('swimming')}
                className="bg-slate-900/90 border border-white/20 p-2.5 rounded-2xl flex flex-col items-center hover:border-blue-400 transition-all active:scale-95 shadow-lg"
              >
                <span className="text-xl">🏊</span>
                <span className="font-extrabold text-xs text-white">Swimming</span>
                <span className="text-blue-400 text-xs font-bold">Lv {gameState.stats.swimmingLevel}</span>
                <div className="w-full bg-white/10 h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="bg-blue-400 h-full"
                    style={{
                      width: `${(gameState.stats.swimmingXp / getXpForNextLevel(gameState.stats.swimmingLevel)) * 100}%`,
                    }}
                  />
                </div>
              </button>
            </div>

            {/* Championship Race Button */}
            <button
              onClick={() => handleStartRace('sprint')}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:brightness-110 active:scale-95 text-slate-950 font-extrabold text-sm sm:text-base rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-transform"
            >
              <Trophy className="w-5 h-5 text-slate-950" />
              <span>Enter Olympic Sprint Race</span>
            </button>
          </div>
        )}

        {/* Active Action Button during Training / Racing */}
        {gameState.view !== 'hub' && gameState.view !== 'shop' && (
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              jumpPressedRef.current = true;
              setJumpPressed(true);
            }}
            onPointerUp={() => {
              jumpPressedRef.current = false;
              setJumpPressed(false);
            }}
            onPointerCancel={() => {
              jumpPressedRef.current = false;
              setJumpPressed(false);
            }}
            className={`absolute bottom-6 right-6 sm:bottom-10 sm:right-10 w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 font-display font-extrabold text-white text-sm sm:text-base shadow-2xl flex flex-col items-center justify-center transition-transform active:scale-95 ${
              jumpPressed
                ? 'bg-amber-600 border-white scale-90'
                : 'bg-amber-500 hover:bg-amber-400 border-amber-200'
            }`}
          >
            <span className="text-2xl sm:text-3xl">
              {gameState.view === 'train_running'
                ? '🦘'
                : gameState.view === 'train_flying'
                ? '🪽'
                : gameState.view === 'train_swimming'
                ? '🤿'
                : '⚡'}
            </span>
            <span className="mt-1">
              {gameState.view === 'train_running'
                ? 'JUMP'
                : gameState.view === 'train_flying'
                ? 'FLAP'
                : gameState.view === 'train_swimming'
                ? 'DIVE'
                : 'BOOST'}
            </span>
          </button>
        )}

        {/* Race Finish Modal */}
        {gameState.view === 'race' && gameState.race?.finished && (
          <div className="absolute inset-0 z-30 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border-2 border-white/20 rounded-[28px] max-w-sm w-full p-6 text-center text-white shadow-2xl">
              <div className="w-16 h-16 mx-auto mb-3 bg-amber-500/20 border border-amber-400/40 rounded-full flex items-center justify-center text-3xl">
                {gameState.race.playerPlace === 1 ? '🥇' : '🥈'}
              </div>

              <h2 className="font-display font-extrabold text-2xl mb-1 text-amber-400">
                {gameState.race.playerPlace === 1 ? '1st Place Champion!' : `Finished #${gameState.race.playerPlace}`}
              </h2>
              <p className="text-sm text-white/70 mb-5">
                {gameState.race.playerPlace === 1
                  ? 'Incredible speed! You won the Gold Medal and +50 Coins.'
                  : `Winner: ${gameState.race.winnerName}. Train your skills to race faster next time!`}
              </p>

              <button
                onClick={() => setGameState((prev) => ({ ...prev, view: 'hub', race: null }))}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-extrabold text-sm rounded-xl"
              >
                Return to Gym Hub
              </button>
            </div>
          </div>
        )}

        {/* Shop Modal */}
        {gameState.view === 'shop' && (
          <div className="absolute inset-0 z-30 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-white/20 rounded-[28px] max-w-md w-full p-5 text-white shadow-2xl flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🛍️</span>
                  <h3 className="font-display font-extrabold text-xl text-amber-400">Duck Boutique</h3>
                </div>
                <button
                  onClick={() => setGameState((prev) => ({ ...prev, view: 'hub' }))}
                  className="p-1 rounded-lg bg-white/10 hover:bg-white/20"
                >
                  <X className="w-5 h-5 text-white/80" />
                </button>
              </div>

              {/* Energy Seed Upgrade */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">⚡</span>
                  <div>
                    <div className="font-bold text-sm text-amber-300">Energy Seeds</div>
                    <div className="text-xs text-white/60">Lv {gameState.stats.energyLevel} stamina boost</div>
                  </div>
                </div>
                <button
                  onClick={() => setGameState((prev) => ({ ...prev, stats: buyEnergySeed(prev.stats) }))}
                  disabled={gameState.stats.coins < 25}
                  className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs rounded-xl disabled:opacity-40"
                >
                  25 🪙
                </button>
              </div>

              {/* Hats Catalog */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {(Object.keys(HAT_INFO) as DuckHat[]).map((hat) => {
                  const info = HAT_INFO[hat];
                  const unlocked = gameState.stats.unlockedHats.includes(hat);
                  const active = gameState.stats.activeHat === hat;

                  return (
                    <div
                      key={hat}
                      className="p-3 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{info.icon}</span>
                        <div>
                          <div className="font-bold text-sm text-white flex items-center gap-2">
                            <span>{info.name}</span>
                            {active && <span className="text-xs text-emerald-400 font-extrabold">EQUIPPED</span>}
                          </div>
                          <p className="text-xs text-white/60">{info.desc}</p>
                        </div>
                      </div>

                      {unlocked ? (
                        <button
                          onClick={() => setGameState((prev) => ({ ...prev, stats: equipHat(prev.stats, hat) }))}
                          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 font-bold text-xs rounded-xl"
                        >
                          {active ? 'Equipped' : 'Equip'}
                        </button>
                      ) : (
                        <button
                          onClick={() => setGameState((prev) => ({ ...prev, stats: buyHat(prev.stats, hat) }))}
                          disabled={gameState.stats.coins < info.cost}
                          className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs rounded-xl disabled:opacity-40"
                        >
                          {info.cost} 🪙
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Help Modal */}
        {showHelp && (
          <div className="absolute inset-0 z-40 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-white/20 rounded-[28px] max-w-sm w-full p-5 text-white shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                <h3 className="font-display font-extrabold text-lg text-amber-400">How to Play</h3>
                <button onClick={() => setShowHelp(false)} className="p-1 rounded-lg bg-white/10 hover:bg-white/20">
                  <X className="w-5 h-5 text-white/80" />
                </button>
              </div>

              <ul className="space-y-2.5 text-xs text-white/80 mb-5">
                <li className="flex items-start gap-2">
                  <span className="text-base">🏃</span>
                  <span><strong>RUNNING:</strong> Jump over hurdles and rocks to build sprint stamina.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-base">🪽</span>
                  <span><strong>FLYING:</strong> Flap wings to stay aloft and collect flying corn seeds.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-base">🏊</span>
                  <span><strong>SWIMMING:</strong> Dive underwater to avoid floating logs.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-base">🏆</span>
                  <span><strong>OLYMPIC RACES:</strong> Race against farm rivals to win gold medals and coins!</span>
                </li>
              </ul>

              <button
                onClick={() => setShowHelp(false)}
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl"
              >
                Got It!
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// --- Canvas 2D Drawing Utilities ---

function drawDuck(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  hat: DuckHat,
  pose: 'happy' | 'running' | 'jumping' | 'flying' | 'swimming' | 'diving',
  scale: number = 1.0
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Feet
  ctx.fillStyle = '#ea580c';
  if (pose !== 'swimming' && pose !== 'diving') {
    ctx.beginPath();
    ctx.ellipse(-8, 16, 8, 4, 0, 0, Math.PI * 2);
    ctx.ellipse(8, 16, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Body
  ctx.fillStyle = '#facc15';
  ctx.strokeStyle = '#ca8a04';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0, 18, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Wing
  ctx.beginPath();
  if (pose === 'flying') {
    ctx.ellipse(-6, -8, 14, 6, -Math.PI / 4, 0, Math.PI * 2);
  } else {
    ctx.ellipse(-4, 0, 10, 6, 0, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.stroke();

  // Head
  ctx.beginPath();
  ctx.arc(10, -14, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Eye
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(14, -16, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Orange Beak
  ctx.fillStyle = '#ea580c';
  ctx.beginPath();
  ctx.ellipse(22, -12, 6, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hats
  if (hat === 'headband') {
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(10, -18, 12, Math.PI * 0.9, Math.PI * 1.8);
    ctx.stroke();
  } else if (hat === 'cap') {
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.ellipse(10, -22, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (hat === 'crown') {
    ctx.fillStyle = '#fde047';
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(4, -22);
    ctx.lineTo(8, -30);
    ctx.lineTo(12, -24);
    ctx.lineTo(16, -30);
    ctx.lineTo(20, -22);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (hat === 'goggles') {
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.strokeRect(10, -18, 8, 6);
  } else if (hat === 'straw_hat') {
    ctx.fillStyle = '#fef08a';
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(10, -22, 16, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

function drawRivalDuck(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  hat: DuckHat
) {
  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = '#ea580c';
  ctx.beginPath();
  ctx.ellipse(-8, 14, 7, 3, 0, 0, Math.PI * 2);
  ctx.ellipse(8, 14, 7, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, 0, 16, 13, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(8, -12, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(12, -14, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ea580c';
  ctx.beginPath();
  ctx.ellipse(18, -10, 5, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
