import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  initRagdollHitGame,
  stepRagdollHitGame,
  TOTAL_ROUNDS,
  ARENA_WIDTH,
  ARENA_FLOOR_Y,
} from './logic/engine';
import { FighterInput, RagdollHitState } from './logic/types';
import { ragdollHitAudio } from './systems/sound';
import {
  RotateCcw,
  Volume2,
  VolumeX,
  ArrowRight,
  Trophy,
  ArrowUp,
  ArrowLeft,
  ArrowRight as ArrowRightIcon,
  Swords,
  Heart,
} from 'lucide-react';

export const RagdollHitContainer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<RagdollHitState>(initRagdollHitGame(1));
  const playerInputRef = useRef<FighterInput>({ moveX: 0, jump: false, attack: false });

  const [hudState, setHudState] = useState({
    round: 1,
    playerHealth: 100,
    enemyHealth: 80,
    enemyName: 'Sneaky Fox',
    status: 'fighting',
    isMuted: ragdollHitAudio.isMuted(),
  });

  const [showRoundModal, setShowRoundModal] = useState(false);
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [showGameOverModal, setShowGameOverModal] = useState(false);

  const resetCurrentRound = useCallback(() => {
    stateRef.current = initRagdollHitGame(stateRef.current.round);
    setShowRoundModal(false);
    setShowVictoryModal(false);
    setShowGameOverModal(false);
    ragdollHitAudio.playBell();
  }, []);

  const advanceNextRound = useCallback(() => {
    const nextR = stateRef.current.round + 1;
    if (nextR <= TOTAL_ROUNDS) {
      stateRef.current = initRagdollHitGame(nextR);
      setShowRoundModal(false);
      ragdollHitAudio.playBell();
    }
  }, []);

  const restartEntireGame = useCallback(() => {
    stateRef.current = initRagdollHitGame(1);
    setShowVictoryModal(false);
    setShowGameOverModal(false);
    setShowRoundModal(false);
    ragdollHitAudio.playBell();
  }, []);

  const toggleSound = () => {
    const muted = ragdollHitAudio.toggleMute();
    setHudState((prev) => ({ ...prev, isMuted: muted }));
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        playerInputRef.current.moveX = -1;
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        playerInputRef.current.moveX = 1;
      } else if (['ArrowUp', 'KeyW'].includes(e.code)) {
        playerInputRef.current.jump = true;
      } else if (['Space', 'KeyF', 'KeyJ'].includes(e.code)) {
        playerInputRef.current.attack = true;
      } else if (e.code === 'KeyR') {
        resetCurrentRound();
      } else if (e.code === 'KeyM') {
        toggleSound();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code) && playerInputRef.current.moveX < 0) {
        playerInputRef.current.moveX = 0;
      }
      if (['ArrowRight', 'KeyD'].includes(e.code) && playerInputRef.current.moveX > 0) {
        playerInputRef.current.moveX = 0;
      }
      if (['ArrowUp', 'KeyW'].includes(e.code)) {
        playerInputRef.current.jump = false;
      }
      if (['Space', 'KeyF', 'KeyJ'].includes(e.code)) {
        playerInputRef.current.attack = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [resetCurrentRound]);

  // Main Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      const { state: nextState, event } = stepRagdollHitGame(
        stateRef.current,
        playerInputRef.current,
        undefined,
        dt
      );
      stateRef.current = nextState;

      // Reset one-shot inputs
      if (playerInputRef.current.attack) {
        playerInputRef.current.attack = false;
      }

      if (event === 'swing') ragdollHitAudio.playSwing();
      if (event === 'hit') ragdollHitAudio.playPunch();
      if (event === 'round_won') {
        ragdollHitAudio.playVictory();
        setShowRoundModal(true);
      }
      if (event === 'match_victory') {
        ragdollHitAudio.playVictory();
        setShowVictoryModal(true);
      }
      if (event === 'match_game_over') {
        ragdollHitAudio.playPunch();
        setShowGameOverModal(true);
      }

      setHudState({
        round: nextState.round,
        playerHealth: nextState.player.health,
        enemyHealth: nextState.enemy.health,
        enemyName: nextState.enemy.name,
        status: nextState.status,
        isMuted: ragdollHitAudio.isMuted(),
      });

      // Render
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          renderBrawlerCanvas(ctx, canvas.width, canvas.height, nextState);
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="relative w-full max-w-4xl mx-auto flex flex-col items-center select-none touch-none bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
      {/* Top HUD with Fighter Health Bars */}
      <div className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-800/90 backdrop-blur border-b border-slate-700/60 z-10 text-white">
        {/* Player Health */}
        <div className="flex items-center gap-2 flex-1 max-w-[200px] sm:max-w-[260px]">
          <span className="text-sm font-black text-amber-400">🐶 Buster</span>
          <div className="flex-1 h-3 bg-slate-700 rounded-full overflow-hidden border border-slate-600">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-all duration-100 ease-out"
              style={{ width: `${Math.max(0, hudState.playerHealth)}%` }}
            />
          </div>
        </div>

        {/* Round Badge */}
        <div className="text-xs font-black text-amber-400 bg-amber-950/80 px-3 py-1 rounded-full border border-amber-700/60 flex items-center gap-1.5">
          <Swords className="w-3.5 h-3.5 text-amber-400" />
          <span>ROUND {hudState.round} / {TOTAL_ROUNDS}</span>
        </div>

        {/* Enemy Health */}
        <div className="flex items-center gap-2 flex-1 max-w-[200px] sm:max-w-[260px] justify-end">
          <div className="flex-1 h-3 bg-slate-700 rounded-full overflow-hidden border border-slate-600">
            <div
              className="h-full bg-gradient-to-l from-rose-500 to-amber-400 transition-all duration-100 ease-out"
              style={{ width: `${Math.max(0, (hudState.enemyHealth / (hudState.round === 1 ? 80 : hudState.round === 2 ? 100 : 120)) * 100)}%` }}
            />
          </div>
          <span className="text-sm font-black text-rose-400">{hudState.enemyName}</span>

          <div className="flex items-center gap-1 pl-2">
            <button
              onClick={resetCurrentRound}
              aria-label="Restart Round"
              className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={toggleSound}
              aria-label="Toggle Sound"
              className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200"
            >
              {hudState.isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-amber-400" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Arena Canvas */}
      <div className="relative w-full aspect-[16/9] max-h-[70vh] flex items-center justify-center bg-slate-950 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={800}
          height={450}
          className="w-full h-full object-contain block"
        />

        {/* Round Won Modal */}
        {showRoundModal && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center text-white p-4 z-20">
            <div className="text-5xl mb-2 animate-bounce">🥊💥</div>
            <h3 className="text-3xl font-black text-amber-400 mb-1">KNOCKOUT!</h3>
            <p className="text-sm text-slate-200 mb-5 text-center">
              Buster floored {hudState.enemyName} in Round {hudState.round}!
            </p>
            <button
              onClick={advanceNextRound}
              className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-lg flex items-center gap-2 text-base transition transform active:scale-95"
            >
              Next Round <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Victory Modal */}
        {showVictoryModal && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center text-white p-4 z-20">
            <Trophy className="w-16 h-16 text-amber-400 mb-3 animate-pulse" />
            <h3 className="text-3xl font-black text-amber-400 mb-1">Barnyard Champion!</h3>
            <p className="text-sm text-slate-200 mb-6 text-center max-w-sm">
              Buster Hound defeated all challengers to rule the hayloft brawler ring!
            </p>
            <button
              onClick={restartEntireGame}
              className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-lg flex items-center gap-2 text-base transition transform active:scale-95"
            >
              <RotateCcw className="w-5 h-5" /> Fight From Round 1
            </button>
          </div>
        )}

        {/* Game Over Modal */}
        {showGameOverModal && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center text-white p-4 z-20">
            <div className="text-5xl mb-2">😵</div>
            <h3 className="text-3xl font-black text-rose-400 mb-1">Knocked Down!</h3>
            <p className="text-sm text-slate-300 mb-5 text-center">
              Time your punches and dodge opponent weapon swings to stay on your paws!
            </p>
            <button
              onClick={resetCurrentRound}
              className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-lg flex items-center gap-2 text-base transition transform active:scale-95"
            >
              <RotateCcw className="w-5 h-5" /> Retry Round
            </button>
          </div>
        )}
      </div>

      {/* Mobile Responsive Controls Bar */}
      <div className="w-full py-2.5 px-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-3">
        {/* Direction Controls */}
        <div className="flex items-center gap-2">
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              playerInputRef.current.moveX = -1;
            }}
            onTouchEnd={() => (playerInputRef.current.moveX = 0)}
            onMouseDown={() => (playerInputRef.current.moveX = -1)}
            onMouseUp={() => (playerInputRef.current.moveX = 0)}
            className="w-12 h-11 rounded-xl bg-slate-800 border border-slate-700 active:bg-amber-600 flex items-center justify-center text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              playerInputRef.current.moveX = 1;
            }}
            onTouchEnd={() => (playerInputRef.current.moveX = 0)}
            onMouseDown={() => (playerInputRef.current.moveX = 1)}
            onMouseUp={() => (playerInputRef.current.moveX = 0)}
            className="w-12 h-11 rounded-xl bg-slate-800 border border-slate-700 active:bg-amber-600 flex items-center justify-center text-white"
          >
            <ArrowRightIcon className="w-5 h-5" />
          </button>
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              playerInputRef.current.jump = true;
            }}
            onTouchEnd={() => (playerInputRef.current.jump = false)}
            onMouseDown={() => (playerInputRef.current.jump = true)}
            onMouseUp={() => (playerInputRef.current.jump = false)}
            className="w-12 h-11 rounded-xl bg-slate-800 border border-slate-700 active:bg-amber-600 flex items-center justify-center text-white"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        </div>

        {/* Big Punch / Swing Button */}
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            playerInputRef.current.attack = true;
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            playerInputRef.current.attack = true;
          }}
          className="flex-1 max-w-xs h-11 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-95 transition"
        >
          <span>🥊 PUNCH / SWING (Space)</span>
        </button>
      </div>
    </div>
  );
};

// Canvas 2D Drawing
function renderBrawlerCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: RagdollHitState
) {
  // Barn Background
  ctx.fillStyle = '#1c1917';
  ctx.fillRect(0, 0, width, height);

  // Hayloft Wooden Planks
  ctx.strokeStyle = '#292524';
  ctx.lineWidth = 2;
  for (let y = 0; y < height; y += 35) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Boxing Ring Arena Platform
  const ringX = 100;
  const ringW = 600;
  const floorY = state.arenaFloorY;

  // Platform Straw & Wood Base
  const woodGrad = ctx.createLinearGradient(ringX, floorY, ringX, floorY + 40);
  woodGrad.addColorStop(0, '#78350f');
  woodGrad.addColorStop(1, '#451a03');
  ctx.fillStyle = woodGrad;
  ctx.fillRect(ringX, floorY, ringW, 50);

  // Ring Canvas Mat
  ctx.fillStyle = '#b45309';
  ctx.fillRect(ringX + 10, floorY - 6, ringW - 20, 8);

  // Corner Posts & Ropes
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(ringX + 10, floorY - 90, 10, 90);
  ctx.fillRect(ringX + ringW - 20, floorY - 90, 10, 90);

  // Ropes
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(ringX + 15, floorY - 75);
  ctx.lineTo(ringX + ringW - 15, floorY - 75);
  ctx.moveTo(ringX + 15, floorY - 45);
  ctx.lineTo(ringX + ringW - 15, floorY - 45);
  ctx.moveTo(ringX + 15, floorY - 15);
  ctx.lineTo(ringX + ringW - 15, floorY - 15);
  ctx.stroke();

  // Draw Fighters
  // Buster Hound (Player)
  renderRagdollCharacter(ctx, state.player, '#f59e0b', '#b45309', 'dog');

  // Opponent (Enemy)
  renderRagdollCharacter(
    ctx,
    state.enemy,
    state.round === 1 ? '#ea580c' : state.round === 2 ? '#475569' : '#dc2626',
    state.round === 1 ? '#9a3412' : state.round === 2 ? '#1e293b' : '#991b1b',
    state.round === 1 ? 'fox' : state.round === 2 ? 'badger' : 'rooster'
  );
}

function renderRagdollCharacter(
  ctx: CanvasRenderingContext2D,
  f: RagdollHitState['player'],
  primaryColor: string,
  secondaryColor: string,
  animal: 'dog' | 'fox' | 'badger' | 'rooster'
) {
  ctx.save();
  ctx.translate(f.x, f.y);
  if (f.facing < 0) ctx.scale(-1, 1);

  // Legs
  ctx.strokeStyle = secondaryColor;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-6, 12);
  ctx.lineTo(-8, 28);
  ctx.moveTo(6, 12);
  ctx.lineTo(8, 28);
  ctx.stroke();

  // Torso
  ctx.fillStyle = primaryColor;
  ctx.beginPath();
  ctx.roundRect(-12, -12, 24, 26, 6);
  ctx.fill();

  // Head
  ctx.beginPath();
  ctx.arc(0, -22, 14, 0, Math.PI * 2);
  ctx.fill();

  // Animal Face/Ears
  ctx.fillStyle = secondaryColor;
  if (animal === 'dog') {
    // Floppy ears
    ctx.beginPath();
    ctx.ellipse(-12, -22, 4, 10, -0.2, 0, Math.PI * 2);
    ctx.ellipse(12, -22, 4, 10, 0.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (animal === 'fox') {
    // Pointed ears
    ctx.beginPath();
    ctx.moveTo(-10, -30);
    ctx.lineTo(-6, -42);
    ctx.lineTo(-2, -30);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(2, -30);
    ctx.lineTo(6, -42);
    ctx.lineTo(10, -30);
    ctx.fill();
  } else if (animal === 'rooster') {
    // Red comb
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, -36, 6, 0, Math.PI * 2);
    ctx.arc(-4, -34, 4, 0, Math.PI * 2);
    ctx.arc(4, -34, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Eyes
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(4, -22, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Swinging Arm with Weapon
  ctx.save();
  ctx.translate(6, -4);
  ctx.rotate(f.armAngle);

  // Arm limb
  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(16, 0);
  ctx.stroke();

  // Weapon / Glove
  if (f.weapon === 'fists') {
    ctx.fillStyle = '#ef4444'; // Red Boxing Glove
    ctx.beginPath();
    ctx.arc(20, 0, 8, 0, Math.PI * 2);
    ctx.fill();
  } else if (f.weapon === 'broom') {
    ctx.fillStyle = '#78350f';
    ctx.fillRect(16, -2, 26, 4); // Handle
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(38, -8, 14, 16); // Straw
  } else if (f.weapon === 'pitchfork') {
    ctx.fillStyle = '#78350f';
    ctx.fillRect(16, -2, 30, 4); // Pole
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(44, -10, 4, 20); // Cross
    ctx.fillRect(48, -10, 10, 3); // Tine 1
    ctx.fillRect(48, -1, 10, 3); // Tine 2
    ctx.fillRect(48, 8, 10, 3); // Tine 3
  }

  ctx.restore();

  ctx.restore();
}
