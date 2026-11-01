import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  initRetroBowlPlay,
  stepRetroBowlPlay,
  FIELD_LENGTH,
  FIELD_WIDTH,
} from './logic/engine';
import {
  ReceiverMoveInput,
  RetroBowlAimInput,
  RetroBowlState,
} from './logic/types';
import { retroBowlAudio } from './systems/sound';
import {
  RotateCcw,
  Volume2,
  VolumeX,
  ArrowUp,
  ArrowDown,
  Trophy,
  Zap,
} from 'lucide-react';

export const RetroBowlContainer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<RetroBowlState>(initRetroBowlPlay(20));

  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const aimInputRef = useRef<RetroBowlAimInput>({
    isAiming: false,
    aimAngle: 0,
    aimPower: 0,
    releaseThrow: false,
  });
  const runnerInputRef = useRef<ReceiverMoveInput>({ moveY: 0, turbo: false });

  const [hudState, setHudState] = useState({
    score: 0,
    opponentScore: 0,
    down: 1,
    yardsToGo: 10,
    yardLine: 20,
    quarter: 1,
    phase: 'aiming',
    isMuted: retroBowlAudio.isMuted(),
  });

  const [showTDModal, setShowTDModal] = useState(false);
  const [showTurnoverModal, setShowTurnoverModal] = useState(false);

  const resetDrive = useCallback((yardLine: number = 20) => {
    stateRef.current = initRetroBowlPlay(
      yardLine,
      1,
      10,
      stateRef.current.score,
      stateRef.current.opponentScore,
      stateRef.current.quarter
    );
    setShowTDModal(false);
    setShowTurnoverModal(false);
  }, []);

  const nextPlay = useCallback(() => {
    const s = stateRef.current;
    stateRef.current = initRetroBowlPlay(
      s.yardLine,
      s.down,
      s.yardsToGo,
      s.score,
      s.opponentScore,
      s.quarter
    );
  }, []);

  const toggleSound = () => {
    const muted = retroBowlAudio.toggleMute();
    setHudState((prev) => ({ ...prev, isMuted: muted }));
  };

  // Keyboard runner steering
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) {
        runnerInputRef.current.moveY = -1;
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        runnerInputRef.current.moveY = 1;
      } else if (e.code === 'Space') {
        runnerInputRef.current.turbo = true;
      } else if (e.code === 'KeyR') {
        resetDrive(20);
      } else if (e.code === 'KeyM') {
        toggleSound();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW', 'ArrowDown', 'KeyS'].includes(e.code)) {
        runnerInputRef.current.moveY = 0;
      }
      if (e.code === 'Space') {
        runnerInputRef.current.turbo = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [resetDrive]);

  // Main Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      const { state: nextState, event } = stepRetroBowlPlay(
        stateRef.current,
        aimInputRef.current,
        runnerInputRef.current,
        dt
      );
      stateRef.current = nextState;

      // Consume release trigger
      if (aimInputRef.current.releaseThrow) {
        aimInputRef.current.releaseThrow = false;
        aimInputRef.current.isAiming = false;
      }

      if (event === 'throw') retroBowlAudio.playThrow();
      if (event === 'catch') retroBowlAudio.playCatch();
      if (event === 'tackle') retroBowlAudio.playTackle();
      if (event === 'touchdown') {
        retroBowlAudio.playTouchdown();
        setShowTDModal(true);
      }
      if (event === 'turnover') {
        retroBowlAudio.playWhistle();
        setShowTurnoverModal(true);
      }
      if (event === 'incomplete' || event === 'first_down' || event === 'tackle') {
        retroBowlAudio.playWhistle();
        // Auto reset next play after brief pause if not TD/Turnover
        setTimeout(() => {
          if (stateRef.current.phase === 'play_ended') {
            nextPlay();
          }
        }, 1200);
      }

      setHudState((prev) => ({
        ...prev,
        score: nextState.score,
        opponentScore: nextState.opponentScore,
        down: nextState.down,
        yardsToGo: nextState.yardsToGo,
        yardLine: nextState.yardLine,
        quarter: nextState.quarter,
        phase: nextState.phase,
      }));

      // Render
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          renderGridironCanvas(ctx, canvas.width, canvas.height, nextState, aimInputRef.current);
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [nextPlay]);

  // Mouse & Touch Drag Aim Handlers
  const handlePointerDown = (clientX: number, clientY: number) => {
    if (stateRef.current.phase !== 'aiming') return;
    dragStartRef.current = { x: clientX, y: clientY };
    aimInputRef.current.isAiming = true;
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!dragStartRef.current || stateRef.current.phase !== 'aiming') return;
    const dx = dragStartRef.current.x - clientX; // Pulling back aims forward
    const dy = dragStartRef.current.y - clientY;
    const dist = Math.hypot(dx, dy);

    aimInputRef.current.aimAngle = Math.atan2(dy, dx);
    aimInputRef.current.aimPower = Math.min(1.0, dist / 120);
  };

  const handlePointerUp = () => {
    if (!dragStartRef.current || stateRef.current.phase !== 'aiming') return;
    dragStartRef.current = null;
    if (aimInputRef.current.aimPower > 0.15) {
      aimInputRef.current.releaseThrow = true;
    } else {
      aimInputRef.current.isAiming = false;
      aimInputRef.current.aimPower = 0;
    }
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto flex flex-col items-center select-none touch-none bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
      {/* Retro Scoreboard Top Bar */}
      <div className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-800/90 backdrop-blur border-b border-slate-700/60 z-10 text-white font-mono">
        <div className="flex items-center gap-3">
          <div className="text-xs bg-slate-950 px-2.5 py-1 rounded border border-slate-700">
            <span className="text-amber-400 font-bold">PAW</span> <span className="text-white font-black text-sm">{hudState.score}</span>
          </div>
          <div className="text-xs bg-slate-950 px-2.5 py-1 rounded border border-slate-700">
            <span className="text-rose-400 font-bold">BULLS</span> <span className="text-white font-black text-sm">{hudState.opponentScore}</span>
          </div>
          <div className="text-xs font-bold text-slate-300">
            Q{hudState.quarter}
          </div>
        </div>

        {/* Down & Distance */}
        <div className="text-xs font-bold text-amber-400 bg-amber-950/60 px-3 py-1 rounded-full border border-amber-800/50">
          {hudState.down === 1 ? '1st' : hudState.down === 2 ? '2nd' : hudState.down === 3 ? '3rd' : '4th'} & {hudState.yardsToGo} • Ball on {hudState.yardLine}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => resetDrive(20)}
            aria-label="Restart Drive"
            className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={toggleSound}
            aria-label="Toggle Sound"
            className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition active:scale-95"
          >
            {hudState.isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Main Interactive Field Canvas */}
      <div
        className="relative w-full aspect-[16/9] max-h-[70vh] flex items-center justify-center bg-emerald-950 cursor-crosshair overflow-hidden"
        onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
        onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
        onMouseUp={handlePointerUp}
        onTouchStart={(e) => handlePointerDown(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchMove={(e) => handlePointerMove(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={handlePointerUp}
      >
        <canvas
          ref={canvasRef}
          width={960}
          height={540}
          className="w-full h-full object-contain block"
        />

        {/* Touchdown Banner Modal */}
        {showTDModal && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-md flex flex-col items-center justify-center text-white p-4 z-20">
            <Trophy className="w-16 h-16 text-amber-400 mb-2 animate-bounce" />
            <h3 className="text-4xl font-black text-amber-400 mb-1 tracking-wider">TOUCHDOWN!</h3>
            <p className="text-sm text-slate-200 mb-5 text-center">
              Sensational catch and sprint into the end zone! +7 Points!
            </p>
            <button
              onClick={() => resetDrive(20)}
              className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-lg text-base transition transform active:scale-95"
            >
              Next Drive
            </button>
          </div>
        )}

        {/* Turnover Modal */}
        {showTurnoverModal && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center text-white p-4 z-20">
            <div className="text-5xl mb-2">🛑</div>
            <h3 className="text-2xl font-black text-rose-400 mb-1">Turnover on Downs!</h3>
            <p className="text-sm text-slate-300 mb-5 text-center">
              The Bull defense held firm! Time to start a new offensive drive.
            </p>
            <button
              onClick={() => resetDrive(20)}
              className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-lg text-base transition transform active:scale-95"
            >
              Reset Drive
            </button>
          </div>
        )}
      </div>

      {/* Runner Lateral Controls / Instructions */}
      <div className="w-full py-2.5 px-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-1.5 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-ping" />
          <span><b>Drag & release</b> to pass. Use buttons or W/S to steer receiver!</span>
        </div>

        {/* Mobile Receiver Steer Buttons */}
        <div className="flex items-center gap-2">
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              runnerInputRef.current.moveY = -1;
            }}
            onTouchEnd={() => (runnerInputRef.current.moveY = 0)}
            onMouseDown={() => (runnerInputRef.current.moveY = -1)}
            onMouseUp={() => (runnerInputRef.current.moveY = 0)}
            className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 active:bg-amber-600 flex items-center justify-center text-white"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              runnerInputRef.current.moveY = 1;
            }}
            onTouchEnd={() => (runnerInputRef.current.moveY = 0)}
            onMouseDown={() => (runnerInputRef.current.moveY = 1)}
            onMouseUp={() => (runnerInputRef.current.moveY = 0)}
            className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 active:bg-amber-600 flex items-center justify-center text-white"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              runnerInputRef.current.turbo = true;
            }}
            onTouchEnd={() => (runnerInputRef.current.turbo = false)}
            onMouseDown={() => (runnerInputRef.current.turbo = true)}
            onMouseUp={() => (runnerInputRef.current.turbo = false)}
            className="px-3 h-10 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center gap-1 shadow-md active:scale-95 transition"
          >
            <Zap className="w-4 h-4 fill-slate-950" /> Sprint
          </button>
        </div>
      </div>
    </div>
  );
};

// Canvas 2D Drawing
function renderGridironCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: RetroBowlState,
  aimInput: RetroBowlAimInput
) {
  // Camera scroll tracking player / ball
  const focusX = state.phase === 'receiver_running' && state.controlledReceiverIndex !== null
    ? state.receivers[state.controlledReceiverIndex].x
    : state.phase === 'ball_in_air'
    ? state.ball.x
    : state.yardLine;

  const fieldScaleX = width / 55; // Show ~55 yards at once
  const fieldScaleY = height / FIELD_WIDTH;
  const camX = Math.max(0, Math.min(FIELD_LENGTH - 45, focusX - 15));

  ctx.save();
  ctx.translate(-camX * fieldScaleX, 0);

  // Field Grass Stripes
  for (let yd = 0; yd < FIELD_LENGTH + 15; yd += 5) {
    ctx.fillStyle = (yd / 5) % 2 === 0 ? '#15803d' : '#166534';
    ctx.fillRect(yd * fieldScaleX, 0, 5 * fieldScaleX, height);
  }

  // End Zone (100 - 110)
  ctx.fillStyle = '#b91c1c';
  ctx.fillRect(100 * fieldScaleX, 0, 15 * fieldScaleX, height);
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('TOUCHDOWN', 107.5 * fieldScaleX, height / 2);

  // Yard lines & Hash marks
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  for (let yd = 0; yd <= 100; yd += 10) {
    const x = yd * fieldScaleX;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();

    // Numbers
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    const num = yd <= 50 ? yd : 100 - yd;
    ctx.fillText(String(num), x, 25);
    ctx.fillText(String(num), x, height - 15);
  }

  // Line of Scrimmage (Blue)
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(state.yardLine * fieldScaleX, 0);
  ctx.lineTo(state.yardLine * fieldScaleX, height);
  ctx.stroke();

  // First Down Line (Yellow)
  const firstDownYd = Math.min(100, state.yardLine + state.yardsToGo);
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(firstDownYd * fieldScaleX, 0);
  ctx.lineTo(firstDownYd * fieldScaleX, height);
  ctx.stroke();

  // Draw Aiming Trajectory Arc
  if (aimInput.isAiming && state.phase === 'aiming') {
    const throwDist = 12 + aimInput.aimPower * 35;
    const targetX = state.qb.x + Math.cos(aimInput.aimAngle) * throwDist;
    const targetY = state.qb.y + Math.sin(aimInput.aimAngle) * throwDist;

    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(state.qb.x * fieldScaleX, state.qb.y * fieldScaleY);
    ctx.lineTo(targetX * fieldScaleX, targetY * fieldScaleY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Target reticle
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(targetX * fieldScaleX, targetY * fieldScaleY, 14, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Draw Quarterback (Milo Collie)
  renderPlayerIcon(ctx, state.qb.x * fieldScaleX, state.qb.y * fieldScaleY, '#3b82f6', 'QB');

  // Draw Receivers (Blue Jerseys)
  state.receivers.forEach((wr, i) => {
    renderPlayerIcon(ctx, wr.x * fieldScaleX, wr.y * fieldScaleY, '#2563eb', wr.name === 'Pip Chick' ? 'WR1' : 'WR2');
  });

  // Draw Defenders (Red Bull Jerseys)
  state.defenders.forEach((def, i) => {
    renderPlayerIcon(ctx, def.x * fieldScaleX, def.y * fieldScaleY, '#dc2626', 'CB');
  });

  // Draw Football
  if (state.ball.inFlight) {
    const bx = state.ball.x * fieldScaleX;
    const by = state.ball.y * fieldScaleY;
    ctx.save();
    ctx.translate(bx, by);
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.ellipse(0, 0, 7, 4, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

function renderPlayerIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  label: string
) {
  ctx.save();
  ctx.translate(x, y);

  // Helmet / Circle
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, 0, 13, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Label text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 9px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 0, 0);

  ctx.restore();
}
