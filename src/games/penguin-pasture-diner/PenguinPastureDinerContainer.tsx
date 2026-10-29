import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  advanceDay,
  buyUpgrade,
  clearTable,
  createInitialState,
  DISH_PRICES,
  pickupDish,
  restartShift,
  seatCustomer,
  serveDish,
  takeOrder,
  updateGame,
} from './logic/engine';
import { DinerGameState } from './logic/types';
import { sound } from './systems/sound';

const BOARD_WIDTH = 540;
const BOARD_HEIGHT = 420;

export const PenguinPastureDinerContainer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [gameState, setGameState] = useState<DinerGameState>(() => createInitialState(1));
  const [isMuted, setIsMuted] = useState(sound.isMuted());
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const stateRef = useRef<DinerGameState>(gameState);
  stateRef.current = gameState;

  const toggleMute = useCallback(() => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  }, []);

  // Dispatch interactive click/tap coordinates
  const handleCanvasClick = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = BOARD_WIDTH / rect.width;
    const scaleY = BOARD_HEIGHT / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    const state = stateRef.current;
    if (state.status !== 'shift_active') return;

    // 1. Check if clicked a waiting customer near the door (x < 100)
    const clickedCustomer = state.customers.find(
      (c) => c.state === 'at_door' && Math.hypot(x - c.x, y - c.y) < 30
    );
    if (clickedCustomer) {
      setSelectedCustomerId(clickedCustomer.id);
      return;
    }

    // 2. Check if clicked a dining table
    for (const table of state.tables) {
      const dist = Math.hypot(x - table.x, y - table.y);
      if (dist < 40) {
        // If customer is selected and table is empty -> seat customer!
        if (selectedCustomerId && table.status === 'empty') {
          setGameState((prev) => seatCustomer(prev, selectedCustomerId, table.id));
          setSelectedCustomerId(null);
          return;
        }

        // If table has dirty dishes/tips -> clear table!
        if (table.status === 'dirty') {
          setGameState((prev) => clearTable(prev, table.id));
          return;
        }

        // If table has customer ready to order -> take order!
        const cust = state.customers.find((c) => c.id === table.customerId);
        if (cust && cust.state === 'ordering') {
          setGameState((prev) => takeOrder(prev, table.id));
          return;
        }

        // If waitress is carrying dish matching table customer -> serve meal!
        if (state.waitress.carriedDish && cust && cust.state === 'waiting_food') {
          if (cust.order === state.waitress.carriedDish) {
            setGameState((prev) => serveDish(prev, table.id));
            return;
          }
        }
      }
    }

    // 3. Check if clicked kitchen food counter at top (y < 95)
    if (y < 95) {
      const readyOrder = state.kitchenOrders.find((o) => o.ready);
      if (readyOrder && !state.waitress.carriedDish) {
        setGameState((prev) => pickupDish(prev, readyOrder.id));
        return;
      }
    }

    // Unselect customer if clicked elsewhere
    setSelectedCustomerId(null);
  }, [selectedCustomerId]);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    handleCanvasClick(e.clientX, e.clientY);
  }, [handleCanvasClick]);

  // Main 60 FPS Game Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.04);
      lastTime = time;

      const currentState = stateRef.current;
      const nextState = updateGame(currentState, dt);

      // Play Web Audio triggers
      if (nextState.events.length > 0) {
        for (const ev of nextState.events) {
          if (ev.type === 'seat_customer') {
            sound.playServe();
          } else if (ev.type === 'take_order') {
            sound.playOrderBell();
          } else if (ev.type === 'dish_ready') {
            sound.playDishReady();
          } else if (ev.type === 'serve_dish') {
            sound.playServe();
          } else if (ev.type === 'clear_table') {
            sound.playRegister();
          } else if (ev.type === 'customer_left') {
            sound.playCustomerSad();
          } else if (ev.type === 'shift_complete' || ev.type === 'victory') {
            sound.playShiftComplete();
          }
        }
      }

      setGameState(nextState);

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          drawScene(ctx, nextState, selectedCustomerId);
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [selectedCustomerId]);

  // Canvas Drawing
  const drawScene = (
    ctx: CanvasRenderingContext2D,
    state: DinerGameState,
    selectedId: string | null
  ) => {
    ctx.clearRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);

    // 1. Cozy Antarctic Cafe Ice Wood Floor
    const floorGrad = ctx.createLinearGradient(0, 0, 0, BOARD_HEIGHT);
    floorGrad.addColorStop(0, '#E0F2FE');
    floorGrad.addColorStop(1, '#BAE6FD');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);

    // Subtle checkered floor border
    ctx.strokeStyle = 'rgba(2, 132, 199, 0.15)';
    ctx.lineWidth = 1;
    for (let x = 0; x < BOARD_WIDTH; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, BOARD_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < BOARD_HEIGHT; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(BOARD_WIDTH, y);
      ctx.stroke();
    }

    // 2. Kitchen Food Counter at Top
    ctx.fillStyle = '#0284C7';
    ctx.fillRect(140, 20, 260, 50);
    ctx.fillStyle = '#38BDF8';
    ctx.fillRect(144, 24, 252, 42);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🍳 KITCHEN ORDER STATION 🍱', 270, 38);

    // Render cooking/ready orders on the counter
    const maxOrdersToShow = Math.min(3, state.kitchenOrders.length);
    for (let i = 0; i < maxOrdersToShow; i++) {
      const order = state.kitchenOrders[i];
      const ox = 175 + i * 90;
      const oy = 52;

      ctx.fillStyle = order.ready ? '#10B981' : '#F59E0B';
      ctx.beginPath();
      ctx.arc(ox, oy, 11, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '9px sans-serif';
      ctx.fillText(order.ready ? 'READY!' : `${order.prepTimeLeft.toFixed(1)}s`, ox, oy + 3);
    }

    // 3. Entrance Mat on Left
    ctx.fillStyle = '#F43F5E';
    ctx.fillRect(15, 180, 60, 80);
    ctx.strokeStyle = '#BE123C';
    ctx.lineWidth = 2;
    ctx.strokeRect(15, 180, 60, 80);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('DOOR', 45, 225);

    // 4. Dining Tables
    for (const table of state.tables) {
      drawTable(ctx, table, state);
    }

    // 5. Waiting Customers at the Door
    const waitingGuests = state.customers.filter((c) => c.state === 'at_door');
    waitingGuests.forEach((cust, idx) => {
      const isSelected = cust.id === selectedId;
      const gx = 45;
      const gy = 190 + idx * 40;
      drawCustomer(ctx, cust, gx, gy, isSelected);
    });

    // 6. Draw Penny the Waitress
    drawWaitress(ctx, state.waitress);
  };

  // Helper: Draw Table
  const drawTable = (ctx: CanvasRenderingContext2D, table: DinerGameState['tables'][0], state: DinerGameState) => {
    ctx.save();
    ctx.translate(table.x, table.y);

    // Wooden Booth Chairs (Top and Bottom)
    ctx.fillStyle = '#78350F';
    ctx.fillRect(-34, -28, 68, 8);
    ctx.fillRect(-34, 20, 68, 8);

    // Tabletop
    ctx.fillStyle = '#DC2626'; // Red checkered tablecloth
    ctx.beginPath();
    ctx.ellipse(0, 0, 30, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    // White checker stripes
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-20, -10);
    ctx.lineTo(20, 10);
    ctx.moveTo(-20, 10);
    ctx.lineTo(20, -10);
    ctx.stroke();

    // Table Number
    ctx.fillStyle = '#FEF3C7';
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#78350F';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(table.number), 0, 1);

    // If occupied by customer
    if (table.customerId) {
      const cust = state.customers.find((c) => c.id === table.customerId);
      if (cust) {
        drawCustomer(ctx, cust, 0, -12, false);

        // Status speech bubble
        if (cust.state === 'ordering') {
          // Bouncing Order Bell
          ctx.fillStyle = '#FBBF24';
          ctx.beginPath();
          ctx.arc(18, -25, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 11px sans-serif';
          ctx.fillText('🛎️', 18, -25);
        } else if (cust.state === 'waiting_food') {
          // Food desired + patience bar
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.fillRect(10, -35, 28, 14);
          ctx.strokeRect(10, -35, 28, 14);
          ctx.fillStyle = '#EF4444';
          ctx.fillRect(10, -20, (cust.patience / 100) * 28, 3);
          ctx.fillStyle = '#000000';
          ctx.font = '9px sans-serif';
          ctx.fillText('🍲', 24, -28);
        } else if (cust.state === 'eating') {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.fillRect(10, -35, 26, 14);
          ctx.strokeRect(10, -35, 26, 14);
          ctx.fillStyle = '#000000';
          ctx.font = '9px sans-serif';
          ctx.fillText('😋', 23, -28);
        }
      }
    }

    // If table is dirty (Cash Tip waiting)
    if (table.status === 'dirty') {
      ctx.fillStyle = '#10B981';
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(`$${table.tipAmount}`, 0, 1);
    }

    ctx.restore();
  };

  // Helper: Draw Customer
  const drawCustomer = (
    ctx: CanvasRenderingContext2D,
    cust: DinerGameState['customers'][0],
    x: number,
    y: number,
    isSelected: boolean
  ) => {
    ctx.save();
    ctx.translate(x, y);

    // Selection halo
    if (isSelected) {
      ctx.strokeStyle = '#FBBF24';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (cust.species === 'penguin') {
      // Little penguin guest
      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.ellipse(0, 0, 9, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      // White belly
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.ellipse(0, 2, 5, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      // Beak
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.moveTo(-3, -4);
      ctx.lineTo(0, -9);
      ctx.lineTo(3, -4);
      ctx.fill();
    } else if (cust.species === 'polar_bear') {
      // White fluffy bear
      ctx.fillStyle = '#F8FAFC';
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();
      // Ears
      ctx.beginPath();
      ctx.arc(-8, -10, 4, 0, Math.PI * 2);
      ctx.arc(8, -10, 4, 0, Math.PI * 2);
      ctx.fill();
      // Black nose
      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Spotted seal
      ctx.fillStyle = '#94A3B8';
      ctx.beginPath();
      ctx.ellipse(0, 0, 11, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      // Whiskers
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-8, 0);
      ctx.lineTo(8, 0);
      ctx.stroke();
    }

    ctx.restore();
  };

  // Helper: Draw Penny the Waitress
  const drawWaitress = (ctx: CanvasRenderingContext2D, w: DinerGameState['waitress']) => {
    ctx.save();
    ctx.translate(w.x, w.y);

    // Silver Skates
    ctx.fillStyle = '#94A3B8';
    ctx.fillRect(-8, 12, 6, 3);
    ctx.fillRect(2, 12, 6, 3);

    // Penguin Body
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.ellipse(0, 0, 11, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    // White Apron & Belly
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(0, 2, 7, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pink Bowtie on Head
    ctx.fillStyle = '#F43F5E';
    ctx.beginPath();
    ctx.moveTo(-6, -14);
    ctx.lineTo(0, -11);
    ctx.lineTo(-6, -8);
    ctx.moveTo(6, -14);
    ctx.lineTo(0, -11);
    ctx.lineTo(6, -8);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -11, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Eyes & Beak
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.moveTo(-3, -7);
    ctx.lineTo(0, -3);
    ctx.lineTo(3, -7);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(-3, -8, 1.5, 0, Math.PI * 2);
    ctx.arc(3, -8, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Silver Tray & Carried Dish
    ctx.fillStyle = '#E2E8F0';
    ctx.fillRect(8, -6, 14, 3);
    if (w.carriedDish) {
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.arc(15, -12, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '8px sans-serif';
      ctx.fillText('🍲', 15, -10);
    }

    ctx.restore();
  };

  const handleNextDay = () => {
    setGameState((prev) => advanceDay(prev));
  };

  const handleRestart = () => {
    setGameState((prev) => restartShift(prev));
  };

  const handleBuy = (id: string) => {
    setGameState((prev) => buyUpgrade(prev, id));
  };

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col items-center justify-center w-full min-h-[580px] max-h-[85vh] bg-[#0C1A2E] text-white select-none touch-none overflow-hidden rounded-2xl shadow-2xl p-2"
      style={{ touchAction: 'none', overscrollBehavior: 'none' }}
    >
      {/* Top HUD Header */}
      <div className="w-full max-w-[540px] flex items-center justify-between px-3 py-1.5 bg-[#1E293B]/90 border border-sky-500/30 rounded-xl mb-1.5 text-xs backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-sky-400">Day {gameState.day}</span>
          <span className="text-slate-300">
            Shift Clock: <strong>{Math.ceil(gameState.shiftTimer)}s</strong>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold">
            <span className="text-amber-300 font-mono text-sm">${gameState.money}</span>
            <span className="text-slate-400 text-[11px]">/ ${gameState.targetMoney}</span>
          </div>
          <button
            onClick={toggleMute}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
            aria-label="Toggle Sound"
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div className="relative w-full max-w-[540px] aspect-[540/420] flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={BOARD_WIDTH}
          height={BOARD_HEIGHT}
          onPointerDown={onPointerDown}
          className="w-full h-full rounded-xl border border-sky-500/40 shadow-inner cursor-pointer"
        />

        {/* Shift Summary Modal */}
        {gameState.status === 'shift_summary' && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 text-center rounded-xl backdrop-blur-sm z-20">
            <h2 className="text-2xl font-black text-amber-400 mb-1">DAY {gameState.day} COMPLETED! 🐧</h2>
            <p className="text-slate-200 text-xs mb-3">
              Daily quota reached! Total tip earnings: <strong className="text-emerald-400">${gameState.money}</strong>
            </p>

            {/* Upgrades Shop */}
            <div className="w-full max-w-[340px] bg-slate-900/90 rounded-xl p-3 border border-slate-700 mb-4 text-left">
              <h3 className="text-xs font-bold text-amber-300 mb-2">Cafe Upgrade Shop:</h3>
              <div className="space-y-1.5">
                {gameState.upgrades.map((up) => (
                  <div key={up.id} className="flex items-center justify-between text-[11px] bg-slate-800/80 p-1.5 rounded-lg">
                    <div>
                      <span className="font-bold mr-1">{up.icon} {up.name}</span>
                      <span className="text-slate-400 text-[10px]">(${up.cost})</span>
                    </div>
                    {up.purchased ? (
                      <span className="text-emerald-400 font-bold text-[10px]">OWNED</span>
                    ) : (
                      <button
                        onClick={() => handleBuy(up.id)}
                        disabled={gameState.money < up.cost}
                        className="px-2 py-0.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-bold text-[10px] rounded"
                      >
                        BUY
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleNextDay}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-sm rounded-xl shadow-lg transition"
            >
              Start Next Day ⛸️
            </button>
          </div>
        )}

        {/* Victory Modal */}
        {gameState.status === 'victory' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center rounded-xl backdrop-blur-sm z-20">
            <h2 className="text-3xl font-black text-amber-400 mb-1">CAFE TYCOON CHAMPION! 🏆</h2>
            <p className="text-slate-200 text-xs mb-3">
              Penny mastered all 3 restaurant shifts and saved enough money for the grand voyage home!
            </p>
            <div className="text-xl font-bold text-white mb-4">
              Total Career Bank: <span className="text-emerald-400">${gameState.totalBank + gameState.money}</span>
            </div>
            <button
              onClick={handleRestart}
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-bold text-sm rounded-xl shadow-lg transition"
            >
              Play Again 🐧
            </button>
          </div>
        )}

        {/* Game Over Modal */}
        {gameState.status === 'game_over' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center rounded-xl backdrop-blur-sm z-20">
            <h2 className="text-2xl font-black text-rose-400 mb-1">SHIFT QUOTA MISSED! 😿</h2>
            <p className="text-slate-300 text-xs mb-3">
              Earned ${gameState.money} of the ${gameState.targetMoney} required tip target.
            </p>
            <button
              onClick={handleRestart}
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-sm rounded-xl shadow-lg transition"
            >
              Try Again 🔄
            </button>
          </div>
        )}
      </div>

      {/* Helpful Hint Footer */}
      <div className="text-[11px] text-slate-400 text-center mt-1">
        Tap guest at door &rarr; tap empty table &rarr; take order &rarr; pick up from kitchen &rarr; serve & collect tips!
      </div>
    </div>
  );
};
export default PenguinPastureDinerContainer;
