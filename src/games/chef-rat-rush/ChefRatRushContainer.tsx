import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  BookOpen,
  X,
  Flame,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Trophy,
  Trash2,
  Bell,
  Star,
  ChevronRight,
} from 'lucide-react';
import {
  INGREDIENTS,
  RECIPES,
  SHIFT_CONFIGS,
  GameState,
  OrderTicket,
  Recipe,
  addIngredientToPrepBoard,
  clearPrepBoard,
  createInitialGameState,
  discardStove,
  findMatchingRecipe,
  serveDish,
  startCookingOnStove,
  updateEngineTick,
} from './logic/engine';
import { chefRatAudio } from './systems/sound';

const STORAGE_KEY_HIGHEST_SHIFT = 'pawcade_chef_rat_highest_shift';
const STORAGE_KEY_BEST_TIPS = 'pawcade_chef_rat_best_tips';

export const ChefRatRushContainer: React.FC = () => {
  const [currentShift, setCurrentShift] = useState<number>(() => {
    try {
      const val = localStorage.getItem(STORAGE_KEY_HIGHEST_SHIFT);
      return val ? parseInt(val, 10) || 1 : 1;
    } catch {
      return 1;
    }
  });

  const [gameState, setGameState] = useState<GameState>(() => createInitialGameState(currentShift));
  const [isMuted, setIsMuted] = useState<boolean>(() => chefRatAudio.getMuted());
  const [isRecipeBookOpen, setIsRecipeBookOpen] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'warning' | 'info' } | null>(null);

  // Time tracker for order spawning in engine tick
  const spawnTimerRef = useRef<number>(0);
  const lastTickTimeRef = useRef<number>(performance.now());
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((text: string, type: 'success' | 'warning' | 'info' = 'info') => {
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    setFeedbackMessage({ text, type });
    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedbackMessage(null);
    }, 2400);
  }, []);

  // Sync best tips to localStorage
  useEffect(() => {
    try {
      const curBest = parseInt(localStorage.getItem(STORAGE_KEY_BEST_TIPS) || '0', 10);
      if (gameState.coins > curBest) {
        localStorage.setItem(STORAGE_KEY_BEST_TIPS, String(gameState.coins));
      }
    } catch {}
  }, [gameState.coins]);

  // Main 60FPS Game Loop using requestAnimationFrame
  useEffect(() => {
    let animationId: number;

    const tick = (now: number) => {
      const deltaSec = Math.min(0.1, (now - lastTickTimeRef.current) / 1000);
      lastTickTimeRef.current = now;

      setGameState((prevState) => {
        if (prevState.status !== 'playing') return prevState;

        const config = SHIFT_CONFIGS[prevState.shiftNumber - 1] || SHIFT_CONFIGS[0]!;
        const { state: nextState, newSpawnTimer, expiredTicketId } = updateEngineTick(
          prevState,
          deltaSec,
          config,
          spawnTimerRef.current
        );

        spawnTimerRef.current = newSpawnTimer;

        // Sound on burnt stove
        if (prevState.stove.status !== 'burnt' && nextState.stove.status === 'burnt') {
          chefRatAudio.playBurntWarning();
          showToast('⚠️ A dish burnt on the stove!', 'warning');
        }

        // Sound on lost ticket
        if (expiredTicketId) {
          chefRatAudio.playCustomerLost();
          showToast('Customer left unhappy! Combo lost.', 'warning');
        }

        // Win / Loss fanfare
        if (prevState.status === 'playing' && nextState.status === 'shift-won') {
          chefRatAudio.playShiftWon();
          try {
            confetti({
              particleCount: 140,
              spread: 90,
              origin: { y: 0.55 },
              colors: ['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#ec4899'],
            });
          } catch {}
        }

        return nextState;
      });

      animationId = requestAnimationFrame(tick);
    };

    lastTickTimeRef.current = performance.now();
    animationId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animationId);
  }, [showToast]);

  // Keyboard shortcut listener (1-8 for pantry ingredients, Space for Serve, C for Cook)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isRecipeBookOpen) {
        if (e.key === 'Escape') setIsRecipeBookOpen(false);
        return;
      }

      // Pantry Shortcuts '1' - '8'
      const key = e.key;
      for (const ing of Object.values(INGREDIENTS)) {
        if (ing.keyShortcut === key) {
          e.preventDefault();
          handlePickIngredient(ing.id);
          return;
        }
      }

      // Space: Serve Dish
      if (e.code === 'Space') {
        e.preventDefault();
        handleServe();
      }

      // Key C: Cook on Stove
      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        handleCook();
      }

      // Key X: Clear Prep Board
      if (e.key === 'x' || e.key === 'X') {
        e.preventDefault();
        handleClearBoard();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRecipeBookOpen, gameState]);

  // Actions
  const handlePickIngredient = (id: string) => {
    chefRatAudio.playChop();
    setGameState((prev) => addIngredientToPrepBoard(prev, id));
  };

  const handleClearBoard = () => {
    chefRatAudio.playTrash();
    setGameState((prev) => clearPrepBoard(prev));
  };

  const handleCook = () => {
    const res = startCookingOnStove(gameState);
    if (res.success) {
      chefRatAudio.playSizzle();
      setGameState(res.state);
      showToast(res.message, 'info');
    } else {
      showToast(res.message, 'warning');
    }
  };

  const handleDiscardStove = () => {
    chefRatAudio.playTrash();
    setGameState((prev) => discardStove(prev));
    showToast('Stove cleared', 'info');
  };

  const handleServe = () => {
    const res = serveDish(gameState);
    if (res.success) {
      chefRatAudio.playBellDing();
      chefRatAudio.playCashTip();
      setGameState(res.state);
      showToast(res.message, 'success');
    } else {
      chefRatAudio.playTrash();
      showToast(res.message, 'warning');
    }
  };

  const handleRestartShift = (shiftNum = gameState.shiftNumber) => {
    chefRatAudio.playChop();
    spawnTimerRef.current = 0;
    setGameState(createInitialGameState(shiftNum));
  };

  const handleNextShift = () => {
    const nextShift = Math.min(5, gameState.shiftNumber + 1);
    setCurrentShift(nextShift);
    try {
      localStorage.setItem(STORAGE_KEY_HIGHEST_SHIFT, String(nextShift));
    } catch {}
    handleRestartShift(nextShift);
  };

  const toggleSound = () => {
    const next = !isMuted;
    chefRatAudio.setMuted(next);
    setIsMuted(next);
  };

  // Inspect current prep board to see what's being made
  const matchingRecipe = findMatchingRecipe(gameState.prepBoard);
  const currentConfig = SHIFT_CONFIGS[gameState.shiftNumber - 1] || SHIFT_CONFIGS[0]!;
  const scorePercent = Math.min(100, Math.round((gameState.score / currentConfig.targetScore) * 100));

  return (
    <div className="flex flex-col items-center justify-start w-full max-w-4xl mx-auto px-2 sm:px-4 py-1 select-none text-slate-100">
      {/* 1. Header Bar: Shift Title, Timer, Target Goal & Controls */}
      <div className="w-full bg-slate-800/90 border border-amber-500/30 rounded-2xl p-2.5 sm:p-3 mb-2 shadow-xl backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Chef Pip & Shift Info */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-2xl shadow-inner">
              🐭
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                  {currentConfig.title}
                </span>
                {gameState.combo > 1 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/50 text-rose-300 font-extrabold text-[10px] animate-pulse flex items-center gap-1">
                    <Flame className="w-3 h-3 text-rose-400" />
                    {gameState.combo}x Combo
                  </span>
                )}
              </div>
              <h1 className="text-base sm:text-lg font-black text-white tracking-tight">
                Chef Rat Rush • <span className="text-amber-200">French Bistro</span>
              </h1>
            </div>
          </div>

          {/* Time Remaining & Score Target */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Countdown Clock */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono font-black text-sm sm:text-base ${
                gameState.timeRemaining <= 10
                  ? 'bg-rose-950/80 border-rose-500/60 text-rose-300 animate-pulse'
                  : 'bg-slate-900/80 border-slate-700 text-amber-300'
              }`}
            >
              <Clock className="w-4 h-4 text-amber-400" />
              <span>
                {Math.floor(gameState.timeRemaining / 60)}:
                {Math.floor(gameState.timeRemaining % 60)
                  .toString()
                  .padStart(2, '0')}
              </span>
            </div>

            {/* Shift Score Progress */}
            <div className="bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-1 text-center min-w-[110px]">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                <span>Earned</span>
                <span className="text-amber-400 font-black">${gameState.score}/${currentConfig.targetScore}</span>
              </div>
              {/* Progress Bar */}
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-1 border border-slate-700/50">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-300"
                  style={{ width: `${scorePercent}%` }}
                />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsRecipeBookOpen(true)}
                title="Open Recipe Book"
                aria-label="Open Recipe Book"
                className="w-10 h-10 sm:w-9 sm:h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 transition-all active:scale-95 cursor-pointer flex items-center justify-center touch-manipulation"
              >
                <BookOpen className="w-4 h-4" />
              </button>
              <button
                onClick={toggleSound}
                title={isMuted ? 'Unmute' : 'Mute'}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
                className="w-10 h-10 sm:w-9 sm:h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all active:scale-95 cursor-pointer flex items-center justify-center touch-manipulation"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
              </button>
              <button
                onClick={() => handleRestartShift()}
                title="Restart Shift"
                aria-label="Restart Shift"
                className="w-10 h-10 sm:w-9 sm:h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all active:scale-95 cursor-pointer flex items-center justify-center touch-manipulation"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Feedback Toast */}
      {feedbackMessage && (
        <div
          className={`fixed top-18 z-50 px-4 py-2 rounded-full text-xs font-black shadow-2xl flex items-center gap-1.5 transition-all animate-in fade-in duration-200 border ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-600/90 text-white border-emerald-400'
              : feedbackMessage.type === 'warning'
              ? 'bg-rose-600/90 text-white border-rose-400'
              : 'bg-amber-600/90 text-white border-amber-400'
          }`}
        >
          {feedbackMessage.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
          {feedbackMessage.type === 'warning' && <AlertTriangle className="w-4 h-4" />}
          {feedbackMessage.type === 'info' && <Sparkles className="w-4 h-4" />}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* 2. Customer Order Ticket Rail (Hanging tickets) */}
      <div className="w-full mb-3">
        <div className="flex items-center justify-between mb-1 px-1">
          <div className="text-xs font-black uppercase tracking-wider text-amber-300/80 flex items-center gap-1">
            <span>Customer Ticket Rail</span>
            <span className="text-slate-400 font-normal">({gameState.activeTickets.length}/{currentConfig.maxActiveTickets})</span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium">
            Serve fast for <span className="text-emerald-400 font-bold">+50% Speed Tip!</span>
          </div>
        </div>

        {/* Tickets Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 w-full">
          {gameState.activeTickets.map((ticket) => {
            const recipe = RECIPES[ticket.recipeId];
            if (!recipe) return null;

            const patienceRatio = ticket.currentPatience / ticket.totalPatience;
            const isCritical = patienceRatio < 0.28;
            const isSpeedy = patienceRatio > 0.6;

            return (
              <div
                key={ticket.id}
                className={`relative rounded-xl border p-2.5 transition-all shadow-md ${
                  ticket.isVIP
                    ? 'bg-gradient-to-b from-purple-950/60 to-slate-900 border-purple-500/60 ring-1 ring-purple-400/40'
                    : 'bg-slate-800/90 border-slate-700'
                } ${isCritical ? 'animate-bounce border-rose-500/80' : ''}`}
              >
                {/* Customer Row */}
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xl leading-none">{ticket.customerIcon}</span>
                    <span className="text-xs font-bold text-slate-200 truncate max-w-[100px]">
                      {ticket.customerName}
                    </span>
                  </div>
                  {ticket.isVIP ? (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40">
                      2x VIP Tip
                    </span>
                  ) : (
                    <span className="text-xs font-black text-amber-400 font-mono">${recipe.baseReward}</span>
                  )}
                </div>

                {/* Ordered Dish */}
                <div className="flex items-center gap-2 my-1.5 bg-slate-900/60 rounded-lg p-1.5 border border-slate-700/50">
                  <span className="text-2xl">{recipe.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-black text-amber-100 truncate">{recipe.name}</div>
                    {/* Ingredients needed */}
                    <div className="flex items-center gap-1 mt-0.5">
                      {recipe.requiredIngredients.map((ingId) => (
                        <span key={ingId} title={INGREDIENTS[ingId]?.name} className="text-xs">
                          {INGREDIENTS[ingId]?.icon}
                        </span>
                      ))}
                      {recipe.requiresCooking && (
                        <span className="text-[10px] text-rose-400 font-bold ml-1 flex items-center">
                          <Flame className="w-2.5 h-2.5 inline" /> Cook
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Patience Bar */}
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800 relative">
                  <div
                    className={`h-full transition-all duration-150 ${
                      isSpeedy
                        ? 'bg-emerald-500'
                        : isCritical
                        ? 'bg-rose-500 animate-pulse'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.max(0, Math.min(100, patienceRatio * 100))}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Kitchen Workstations: Prep Board, Stove Skillet, Service Counter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full mb-3">
        {/* Workstation A: Cutting & Prep Board 🪵 */}
        <div className="bg-slate-800/90 border border-amber-900/50 rounded-2xl p-3 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-base">🪵</span>
                <span className="text-xs font-black uppercase tracking-wider text-amber-200">
                  Prep Cutting Board
                </span>
              </div>
              {gameState.prepBoard.length > 0 && (
                <button
                  onClick={handleClearBoard}
                  title="Clear Board (Key X)"
                  className="px-2 py-0.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            {/* Board Slots */}
            <div className="min-h-[64px] bg-amber-950/30 border-2 border-dashed border-amber-700/50 rounded-xl p-2 flex items-center justify-center gap-2 flex-wrap mb-2">
              {gameState.prepBoard.length === 0 ? (
                <span className="text-xs text-amber-200/50 italic text-center">
                  Tap pantry ingredients below to chop on board (Max 5)
                </span>
              ) : (
                gameState.prepBoard.map((ingId, idx) => {
                  const ing = INGREDIENTS[ingId];
                  return (
                    <div
                      key={`${ingId}-${idx}`}
                      className="w-10 h-10 rounded-xl bg-slate-900/90 border border-amber-500/40 flex items-center justify-center text-xl shadow-md transform hover:scale-110 transition-transform"
                      title={ing?.name}
                    >
                      {ing?.icon}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Dish Identification Preview on Board */}
          <div className="mt-1">
            {matchingRecipe ? (
              <div className="bg-slate-900/90 border border-emerald-500/40 rounded-xl p-2 text-center">
                <div className="text-xs font-bold text-emerald-300 flex items-center justify-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{matchingRecipe.name} {matchingRecipe.icon}</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {matchingRecipe.requiresCooking ? (
                    <span className="text-amber-300 font-semibold">Ready to simmer! Click "Cook on Stove" ➔</span>
                  ) : (
                    <span className="text-emerald-400 font-semibold">Ready cold! Ring the Service Bell 🛎️</span>
                  )}
                </div>
              </div>
            ) : gameState.prepBoard.length > 0 ? (
              <div className="text-center text-[11px] text-slate-400 bg-slate-900/50 rounded-lg py-1 border border-slate-800">
                Custom mix ({gameState.prepBoard.length}/5) • Check recipe book
              </div>
            ) : null}
          </div>
        </div>

        {/* Workstation B: Copper Skillet Stove 🍳 */}
        <div className="bg-slate-800/90 border border-rose-900/40 rounded-2xl p-3 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-base">🍳</span>
                <span className="text-xs font-black uppercase tracking-wider text-rose-300">
                  Copper Skillet Stove
                </span>
              </div>
              {gameState.stove.status === 'burnt' && (
                <button
                  onClick={handleDiscardStove}
                  className="px-2 py-0.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black uppercase flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Discard Burnt</span>
                </button>
              )}
            </div>

            {/* Stove Display */}
            <div
              className={`min-h-[64px] rounded-xl border-2 p-2 flex flex-col items-center justify-center transition-all ${
                gameState.stove.status === 'empty'
                  ? 'bg-slate-950/40 border-slate-800 text-slate-500'
                  : gameState.stove.status === 'cooking'
                  ? 'bg-amber-950/40 border-amber-500/60 text-amber-200 ring-2 ring-amber-500/20'
                  : gameState.stove.status === 'ready'
                  ? 'bg-emerald-950/60 border-emerald-400 text-emerald-100 ring-4 ring-emerald-400/30 animate-pulse'
                  : 'bg-rose-950/80 border-rose-500 text-rose-200'
              }`}
            >
              {gameState.stove.status === 'empty' && (
                <span className="text-xs text-slate-500 italic text-center">
                  Stove empty • Ready for Ratatouille or Berry Crepes
                </span>
              )}

              {gameState.stove.status === 'cooking' && (
                <div className="w-full text-center">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-black text-amber-300">
                    <Flame className="w-4 h-4 text-rose-400 animate-bounce" />
                    <span>Simmering {RECIPES[gameState.stove.recipeId!]?.name}...</span>
                  </div>
                  {/* Cooking progress bar */}
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden mt-1.5 border border-amber-900/50">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-rose-400 transition-all duration-100"
                      style={{ width: `${Math.round(gameState.stove.cookingProgress * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {gameState.stove.status === 'ready' && (
                <div className="w-full text-center">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-black text-emerald-300">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>{RECIPES[gameState.stove.recipeId!]?.name} IS READY! 🔥</span>
                  </div>
                  <div className="text-[10px] text-amber-300 font-bold mt-0.5">
                    Ring Service Bell! Burns in {Math.max(0, Math.round((1.0 - gameState.stove.burnProgress) * (RECIPES[gameState.stove.recipeId!]?.burnTimeSeconds || 4)))}s
                  </div>
                  {/* Burning countdown bar */}
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden mt-1 border border-slate-700">
                    <div
                      className="h-full bg-rose-500 transition-all duration-100"
                      style={{ width: `${Math.round(gameState.stove.burnProgress * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {gameState.stove.status === 'burnt' && (
                <div className="text-center">
                  <div className="text-xs font-black text-rose-400 flex items-center justify-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    <span>BURNT TO A CRISP!</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Discard dish to free the burner</div>
                </div>
              )}
            </div>
          </div>

          {/* Stove Action Button */}
          <div className="mt-2">
            {matchingRecipe && matchingRecipe.requiresCooking && gameState.stove.status === 'empty' ? (
              <button
                onClick={handleCook}
                className="w-full min-h-[44px] py-2 px-3 rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-black text-xs uppercase tracking-wider shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation"
              >
                <Flame className="w-4 h-4" />
                <span>Simmer on Stove (Key C)</span>
              </button>
            ) : gameState.stove.status === 'ready' ? (
              <div className="text-center text-[11px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/40 rounded-lg py-1.5">
                Ready! Hit Service Bell 🛎️ ➔
              </div>
            ) : (
              <button
                disabled
                className="w-full py-1.5 px-3 rounded-xl bg-slate-900 text-slate-600 font-bold text-xs border border-slate-800 cursor-not-allowed text-center"
              >
                {gameState.stove.status === 'cooking' ? 'Simmering...' : 'Assemble hot dish first'}
              </button>
            )}
          </div>
        </div>

        {/* Workstation C: Service Bell & Counter 🛎️ */}
        <div className="bg-slate-800/90 border border-amber-500/30 rounded-2xl p-3 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                  Service Counter
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Served: <strong className="text-white">{gameState.ordersServed}</strong>
              </span>
            </div>

            <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800 text-center mb-2">
              <div className="text-[11px] text-slate-400">
                {gameState.stove.status === 'ready' ? (
                  <span className="text-emerald-300 font-bold">Stove has cooked dish ready to serve!</span>
                ) : matchingRecipe && !matchingRecipe.requiresCooking ? (
                  <span className="text-amber-300 font-bold">Cold dish assembled on prep board!</span>
                ) : (
                  <span>Prepare ingredients to match a waiting ticket</span>
                )}
              </div>
            </div>
          </div>

          {/* Large Brass Service Bell Button */}
          <button
            onClick={handleServe}
            className="w-full min-h-[50px] py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer border border-amber-300 touch-manipulation"
          >
            <Bell className="w-5 h-5 animate-pulse" />
            <span>SERVE DISH (SPACE)</span>
          </button>
        </div>
      </div>

      {/* 4. Fresh Ingredients Pantry (8 items with keyboard shortcuts) */}
      <div className="w-full bg-slate-800/90 border border-slate-700/80 rounded-2xl p-3 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1">
            <span>Bistro Pantry Ingredients</span>
            <span className="text-slate-400 text-[10px] font-normal">(Tap or press keys 1-8)</span>
          </div>
          <button
            onClick={() => setIsRecipeBookOpen(true)}
            className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>View 5 Recipes</span>
          </button>
        </div>

        {/* 8 Ingredients Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {Object.values(INGREDIENTS).map((ing) => (
            <button
              key={ing.id}
              onClick={() => handlePickIngredient(ing.id)}
              className="min-h-[58px] rounded-xl bg-slate-900 hover:bg-slate-700/80 active:bg-amber-600/30 border border-slate-700 hover:border-amber-500/50 p-1.5 flex flex-col items-center justify-center gap-0.5 transition-all active:scale-90 shadow-md cursor-pointer group touch-manipulation"
              title={`Add ${ing.name} (Key ${ing.keyShortcut})`}
            >
              <span className="text-2xl transform group-hover:scale-115 transition-transform">
                {ing.icon}
              </span>
              <span className="text-[10px] font-bold text-slate-200 truncate max-w-full">
                {ing.name}
              </span>
              <span className="text-[9px] font-mono font-bold text-amber-400/80 px-1 rounded bg-slate-800">
                {ing.keyShortcut}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 5. Recipe Book Modal (Pop-up Reference) */}
      {isRecipeBookOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-slate-900 border border-amber-500/40 rounded-2xl p-5 shadow-2xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📖</span>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">Chef Pip's Recipe Book</h3>
                  <p className="text-xs text-slate-400">Master all 5 signature bistro delicacies</p>
                </div>
              </div>
              <button
                onClick={() => setIsRecipeBookOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Recipes List */}
            <div className="overflow-y-auto space-y-2.5 pr-1 flex-1">
              {Object.values(RECIPES).map((recipe) => (
                <div
                  key={recipe.id}
                  className="bg-slate-850/80 border border-slate-700/80 rounded-xl p-3 flex items-start gap-3 shadow-md"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-900 border border-amber-500/30 flex items-center justify-center text-3xl shadow-inner shrink-0">
                    {recipe.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-sm font-black text-amber-100">{recipe.name}</h4>
                      <span className="text-xs font-black text-amber-400 font-mono">${recipe.baseReward}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{recipe.description}</p>
                    {/* Ingredients Required */}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <span className="text-[10px] font-bold uppercase text-slate-500">Ingredients:</span>
                      {recipe.requiredIngredients.map((ingId) => {
                        const ing = INGREDIENTS[ingId];
                        return (
                          <span
                            key={ingId}
                            className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1"
                          >
                            <span>{ing?.icon}</span>
                            <span>{ing?.name}</span>
                          </span>
                        );
                      })}
                      {recipe.requiresCooking ? (
                        <span className="px-2 py-0.5 rounded-md bg-rose-500/20 border border-rose-500/50 text-rose-300 text-[10px] font-black uppercase flex items-center gap-1">
                          <Flame className="w-3 h-3" /> Simmer 3s
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-[10px] font-black uppercase">
                          Cold Assemble
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Close Button */}
            <div className="mt-4 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsRecipeBookOpen(false)}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md transition-colors cursor-pointer"
              >
                Back to the Kitchen!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Shift Won Celebration Modal Overlay */}
      {gameState.status === 'shift-won' && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="relative w-full max-w-md bg-slate-900 border-2 border-amber-500/60 rounded-3xl p-6 text-center shadow-2xl flex flex-col items-center max-h-[90vh] overflow-y-auto">
            {/* Stars Celebration */}
            <div className="flex items-center justify-center gap-2 mb-3">
              {[1, 2, 3].map((starIdx) => (
                <Star
                  key={starIdx}
                  className={`w-9 h-9 transition-transform ${
                    starIdx <= gameState.stars
                      ? 'text-amber-400 fill-amber-400 scale-110 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]'
                      : 'text-slate-700'
                  }`}
                />
              ))}
            </div>

            <div className="text-4xl mb-1">👨‍🍳✨</div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Shift Complete!
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xs">
              Magnifique! Chef Pip and the bistro guests loved your culinary precision!
            </p>

            {/* Score Summary Box */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 my-4 w-full flex justify-around">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Tips</div>
                <div className="text-xl sm:text-2xl font-black text-amber-400">${gameState.score}</div>
              </div>
              <div className="border-r border-slate-800" />
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Orders Served</div>
                <div className="text-xl sm:text-2xl font-black text-emerald-400">{gameState.ordersServed}</div>
              </div>
              <div className="border-r border-slate-800" />
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Max Combo</div>
                <div className="text-xl sm:text-2xl font-black text-rose-400">{gameState.maxCombo}x</div>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex gap-2 w-full">
              <button
                onClick={() => handleRestartShift()}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider border border-slate-700 transition-colors cursor-pointer"
              >
                Replay Shift
              </button>
              {gameState.shiftNumber < 5 ? (
                <button
                  onClick={handleNextShift}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Next Shift</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => handleRestartShift(1)}
                  className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg transition-transform active:scale-95 cursor-pointer"
                >
                  Play All Shifts Again!
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7. Shift Lost / Time Expired Modal Overlay */}
      {gameState.status === 'shift-lost' && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="relative w-full max-w-md bg-slate-900 border-2 border-rose-500/50 rounded-3xl p-6 text-center shadow-2xl flex flex-col items-center max-h-[90vh] overflow-y-auto">
            <div className="text-4xl mb-2">⏰💨</div>
            <h2 className="text-2xl font-black text-white tracking-tight">Shift Ended!</h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xs">
              Time ran out before reaching the target goal of{' '}
              <strong className="text-amber-400">${currentConfig.targetScore}</strong>.
            </p>

            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 my-4 w-full flex justify-around">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Score Achieved</div>
                <div className="text-lg font-black text-amber-400">${gameState.score}</div>
              </div>
              <div className="border-r border-slate-800" />
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Orders Lost</div>
                <div className="text-lg font-black text-rose-400">{gameState.ordersLost}</div>
              </div>
            </div>

            <button
              onClick={() => handleRestartShift()}
              className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retry Shift</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
