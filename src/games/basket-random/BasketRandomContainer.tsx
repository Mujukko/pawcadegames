import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  COURT_HEIGHT,
  COURT_WIDTH,
  FLOOR_Y,
  initBasketRandomGame,
  stepBasketRandomGame,
  TARGET_SCORE,
} from './logic/engine';
import { BasketRandomInput, BasketRandomState } from './logic/types';
import { basketRandomAudio } from './systems/sound';
import { RotateCcw, Volume2, VolumeX, Users, User } from 'lucide-react';

export const BasketRandomContainer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<BasketRandomState>(initBasketRandomGame('vs_ai'));
  const inputRef = useRef<BasketRandomInput>({});

  const [hudState, setHudState] = useState({
    scoreP1: 0,
    scoreP2: 0,
    mode: 'vs_ai' as 'vs_ai' | 'two_player',
    status: 'playing',
    scoredBy: null as 1 | 2 | null,
    winner: null as 1 | 2 | null,
    isMuted: basketRandomAudio.isMuted(),
  });

  const [showWinnerModal, setShowWinnerModal] = useState(false);

  const resetMatch = useCallback(() => {
    stateRef.current = initBasketRandomGame(stateRef.current.mode);
    setShowWinnerModal(false);
  }, []);

  const switchMode = (newMode: 'vs_ai' | 'two_player') => {
    stateRef.current = initBasketRandomGame(newMode);
    setShowWinnerModal(false);
    setHudState((prev) => ({ ...prev, mode: newMode }));
  };

  const toggleSound = () => {
    const muted = basketRandomAudio.toggleMute();
    setHudState((prev) => ({ ...prev, isMuted: muted }));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space'].includes(e.code)) {
        inputRef.current.p1Jump = true;
      }
      if (['ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight', 'Enter'].includes(e.code)) {
        inputRef.current.p2Jump = true;
      }
      if (e.code === 'KeyR') resetMatch();
      if (e.code === 'KeyM') toggleSound();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space'].includes(e.code)) {
        inputRef.current.p1Jump = false;
      }
      if (['ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight', 'Enter'].includes(e.code)) {
        inputRef.current.p2Jump = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let animId: number;
    let lastTime = performance.now();
    let prevScoreP1 = 0;
    let prevScoreP2 = 0;

    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const prevState = stateRef.current;
      const nextState = stepBasketRandomGame(prevState, inputRef.current, dt);
      stateRef.current = nextState;

      // Sound triggers on new score
      if (nextState.score.p1 > prevScoreP1 || nextState.score.p2 > prevScoreP2) {
        basketRandomAudio.playBasket();
        prevScoreP1 = nextState.score.p1;
        prevScoreP2 = nextState.score.p2;
      }

      if (nextState.status === 'game_over' && !showWinnerModal) {
        basketRandomAudio.playCheer();
        setShowWinnerModal(true);
      }

      // Sync HUD
      setHudState({
        scoreP1: nextState.score.p1,
        scoreP2: nextState.score.p2,
        mode: nextState.mode,
        status: nextState.status,
        scoredBy: nextState.scoredBy,
        winner: nextState.winner,
        isMuted: basketRandomAudio.isMuted(),
      });

      // Canvas Rendering
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, COURT_WIDTH, COURT_HEIGHT);

          // 1. Background
          const courtBg = ctx.createLinearGradient(0, 0, 0, COURT_HEIGHT);
          if (nextState.courtTheme === 'snow') {
            courtBg.addColorStop(0, '#e0f2fe');
            courtBg.addColorStop(1, '#93c5fd');
          } else if (nextState.courtTheme === 'sunset') {
            courtBg.addColorStop(0, '#fdba74');
            courtBg.addColorStop(1, '#f43f5e');
          } else {
            courtBg.addColorStop(0, '#fef3c7');
            courtBg.addColorStop(0.7, '#fde68a');
            courtBg.addColorStop(1, '#d97706');
          }
          ctx.fillStyle = courtBg;
          ctx.fillRect(0, 0, COURT_WIDTH, COURT_HEIGHT);

          // Bleachers / Wall Silhouette
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(0, FLOOR_Y, COURT_WIDTH, COURT_HEIGHT - FLOOR_Y);
          // Hardwood / Turf Floor
          ctx.fillStyle = nextState.courtTheme === 'snow' ? '#f8fafc' : '#b45309';
          ctx.fillRect(0, FLOOR_Y - 4, COURT_WIDTH, 14);

          // Center court circle
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(COURT_WIDTH / 2, FLOOR_Y, 60, Math.PI, 0);
          ctx.stroke();

          // 2. Hoops & Backboards
          const drawHoop = (hoop: typeof nextState.hoopLeft, isLeft: boolean) => {
            ctx.save();
            // Pole
            ctx.fillStyle = '#64748b';
            ctx.fillRect(isLeft ? 20 : 772, hoop.rimY - 60, 8, FLOOR_Y - (hoop.rimY - 60));

            // Backboard
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#dc2626';
            ctx.lineWidth = 3;
            ctx.fillRect(isLeft ? 48 : 744, hoop.backboardTop, 8, hoop.backboardBottom - hoop.backboardTop);
            ctx.strokeRect(isLeft ? 48 : 744, hoop.backboardTop, 8, hoop.backboardBottom - hoop.backboardTop);

            // Rim
            ctx.fillStyle = '#ea580c';
            ctx.fillRect(hoop.x - (isLeft ? 0 : hoop.rimWidth), hoop.rimY - 2, hoop.rimWidth, 5);

            // Net
            ctx.strokeStyle = '#f8fafc';
            ctx.lineWidth = 1.5;
            const netStartX = hoop.x - (isLeft ? 0 : hoop.rimWidth);
            for (let i = 0; i < 4; i++) {
              ctx.beginPath();
              ctx.moveTo(netStartX + i * 11, hoop.rimY);
              ctx.lineTo(netStartX + i * 8 + 6, hoop.rimY + 28);
              ctx.stroke();
            }
            ctx.restore();
          };

          drawHoop(nextState.hoopLeft, true);
          drawHoop(nextState.hoopRight, false);

          // 3. Players
          nextState.players.forEach((p) => {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.angle);

            // Floppy Legs
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(-6, 12);
            ctx.lineTo(-10, 36);
            ctx.moveTo(6, 12);
            ctx.lineTo(10, 36);
            ctx.stroke();

            // Torso
            ctx.fillStyle = p.bodyColor;
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.roundRect(-14, -14, 28, 30, 8);
            ctx.fill();
            ctx.stroke();

            // Head & Animal Face
            ctx.fillStyle = p.team === 1 ? '#fef08a' : '#fbcfe8';
            ctx.beginPath();
            ctx.arc(0, -26, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Eyes
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(p.team === 1 ? 4 : -4, -28, 2.5, 0, Math.PI * 2);
            ctx.fill();

            // Snout / Beak
            if (p.faceType === 'chick') {
              ctx.fillStyle = '#f97316';
              ctx.beginPath();
              ctx.moveTo(6, -26);
              ctx.lineTo(13, -24);
              ctx.lineTo(6, -21);
              ctx.closePath();
              ctx.fill();
            } else if (p.faceType === 'pig') {
              ctx.fillStyle = '#f472b6';
              ctx.beginPath();
              ctx.ellipse(-6, -24, 5, 4, 0, 0, Math.PI * 2);
              ctx.fill();
            } else if (p.faceType === 'dog') {
              ctx.fillStyle = '#78350f';
              ctx.beginPath();
              ctx.arc(4, -24, 3, 0, Math.PI * 2);
              ctx.fill();
            } else {
              // Cow
              ctx.fillStyle = '#ffffff';
              ctx.beginPath();
              ctx.ellipse(-4, -24, 6, 4, 0, 0, Math.PI * 2);
              ctx.fill();
            }

            // Arm
            ctx.save();
            ctx.translate(p.team === 1 ? 8 : -8, -6);
            ctx.rotate(p.armAngle);
            ctx.fillStyle = p.bodyColor;
            ctx.fillRect(0, -4, p.team === 1 ? 20 : -20, 8);
            ctx.restore();

            ctx.restore();
          });

          // 4. Ball
          const b = nextState.ball;
          ctx.save();
          ctx.translate(b.x, b.y);
          ctx.rotate(b.rotation);

          if (b.ballType === 'watermelon') {
            ctx.fillStyle = '#16a34a';
            ctx.beginPath();
            ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#14532d';
            ctx.lineWidth = 3;
            ctx.stroke();
          } else if (b.ballType === 'pumpkin') {
            ctx.fillStyle = '#ea580c';
            ctx.beginPath();
            ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#9a3412';
            ctx.lineWidth = 3;
            ctx.stroke();
          } else if (b.ballType === 'egg') {
            ctx.fillStyle = '#f8fafc';
            ctx.beginPath();
            ctx.ellipse(0, 0, b.radius, b.radius * 1.3, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 2;
            ctx.stroke();
          } else {
            // Basketball
            ctx.fillStyle = '#f97316';
            ctx.beginPath();
            ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 2;
            ctx.stroke();
            // Ribs
            ctx.beginPath();
            ctx.moveTo(-b.radius, 0);
            ctx.lineTo(b.radius, 0);
            ctx.moveTo(0, -b.radius);
            ctx.lineTo(0, b.radius);
            ctx.stroke();
          }
          ctx.restore();

          // 5. Goal Celebration Banner
          if (nextState.status === 'scored') {
            ctx.save();
            ctx.fillStyle = nextState.scoredBy === 1 ? '#eab308' : '#ec4899';
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.roundRect(COURT_WIDTH / 2 - 120, 100, 240, 50, 16);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#0f172a';
            ctx.font = '900 24px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(
              nextState.scoredBy === 1 ? 'TEAM 1 SCORED! 🏀' : 'TEAM 2 SCORED! 🏀',
              COURT_WIDTH / 2,
              134
            );
            ctx.restore();
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [resetMatch, showWinnerModal]);

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col items-center justify-between overflow-hidden select-none touch-none">
      {/* Top Header */}
      <header className="w-full max-w-4xl px-4 py-2.5 flex items-center justify-between text-white border-b border-white/10 z-10 bg-slate-900/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="text-xl">🏀</span>
          <div className="flex flex-col">
            <span className="font-display font-bold text-base sm:text-lg text-amber-400">
              Basket Random: Barnyard Dunkers
            </span>
            <span className="text-xs text-white/70">First to {TARGET_SCORE} Points Wins</span>
          </div>
        </div>

        {/* Scoreboard */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-800 border border-white/15 px-3 py-1 rounded-xl">
            <span className="text-xs font-bold text-yellow-400">P1</span>
            <span className="font-display font-black text-lg sm:text-xl text-white">
              {hudState.scoreP1} - {hudState.scoreP2}
            </span>
            <span className="text-xs font-bold text-pink-400">P2</span>
          </div>

          {/* Mode Switcher */}
          <button
            onClick={() => switchMode(hudState.mode === 'vs_ai' ? 'two_player' : 'vs_ai')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors"
          >
            {hudState.mode === 'vs_ai' ? <User className="w-3.5 h-3.5 text-amber-400" /> : <Users className="w-3.5 h-3.5 text-blue-400" />}
            <span>{hudState.mode === 'vs_ai' ? 'VS AI' : '2-Player'}</span>
          </button>

          <button
            onClick={resetMatch}
            aria-label="Restart match"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={toggleSound}
            aria-label="Toggle sound"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            {hudState.isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-green-400" />}
          </button>
        </div>
      </header>

      {/* Main Canvas */}
      <main className="relative flex-1 w-full max-w-4xl flex items-center justify-center p-2 sm:p-4">
        <div className="relative w-full aspect-[800/480] max-h-[75dvh] rounded-2xl overflow-hidden shadow-2xl border border-white/15 bg-slate-900">
          <canvas
            ref={canvasRef}
            width={COURT_WIDTH}
            height={COURT_HEIGHT}
            className="w-full h-full object-contain"
          />

          {/* Victory Modal */}
          {showWinnerModal && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center text-white p-6 z-20">
              <span className="text-6xl mb-3">🏆</span>
              <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-amber-400 mb-2">
                {hudState.winner === 1 ? 'TEAM 1 WINS! 🐥' : hudState.winner === 2 ? 'TEAM 2 WINS! 🐷' : 'MATCH OVER!'}
              </h2>
              <p className="text-base text-white/90 mb-6">
                Final Score: {hudState.scoreP1} - {hudState.scoreP2}
              </p>
              <button
                onClick={resetMatch}
                className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-base rounded-2xl shadow-xl transition-transform active:scale-95"
              >
                Play Again 🔄
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Mobile Touch Bar */}
      <footer className="w-full max-w-4xl px-4 py-3 flex items-center justify-between pb-safe z-10 sm:hidden">
        <button
          onTouchStart={() => (inputRef.current.p1Jump = true)}
          onTouchEnd={() => (inputRef.current.p1Jump = false)}
          onMouseDown={() => (inputRef.current.p1Jump = true)}
          onMouseUp={() => (inputRef.current.p1Jump = false)}
          aria-label="P1 Jump & Shoot"
          className="w-28 h-14 rounded-2xl bg-yellow-500 border border-yellow-400 font-extrabold text-slate-950 flex items-center justify-center gap-1 active:scale-95 transition-transform"
        >
          <span>P1 JUMP</span>
        </button>

        <button
          onTouchStart={() => (inputRef.current.p2Jump = true)}
          onTouchEnd={() => (inputRef.current.p2Jump = false)}
          onMouseDown={() => (inputRef.current.p2Jump = true)}
          onMouseUp={() => (inputRef.current.p2Jump = false)}
          aria-label="P2 Jump & Shoot"
          className="w-28 h-14 rounded-2xl bg-pink-500 border border-pink-400 font-extrabold text-slate-950 flex items-center justify-center gap-1 active:scale-95 transition-transform"
        >
          <span>P2 JUMP</span>
        </button>
      </footer>
    </div>
  );
};
