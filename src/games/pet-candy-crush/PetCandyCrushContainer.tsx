import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  RotateCcw,
  Volume2,
  VolumeX,
  HelpCircle,
  Star,
  Shuffle,
  X,
  CheckCircle2,
  Hammer,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  createInitialGameState,
  executeSwap,
  detonateSpecialTile,
  smashTileWithHammer,
  createInitialBoard,
  findBestTutorialMove,
  getLevelGoal,
  LEVEL_CONFIGS,
  BOARD_ROWS,
  BOARD_COLS,
} from './logic/engine';
import {
  CascadeStep,
  PetCrushGameState,
  TileData,
  TREAT_CONFIGS,
  TreatType,
} from './logic/types';
import { petCrushSound } from './systems/sound';

interface PoppingCellEffect {
  row: number;
  col: number;
  color: string;
  innerGlow: string;
  emoji: string;
  isBomb: boolean;
}

interface FloatingHayPopup {
  id: string;
  row: number;
  col: number;
  hay: number;
  label?: string;
  color: string;
}

const BURST_ANGLES = [
  { tx: '0px', ty: '-34px', size: 8 },
  { tx: '25px', ty: '-25px', size: 6 },
  { tx: '34px', ty: '0px', size: 8 },
  { tx: '25px', ty: '25px', size: 6 },
  { tx: '0px', ty: '34px', size: 8 },
  { tx: '-25px', ty: '25px', size: 6 },
  { tx: '-34px', ty: '0px', size: 8 },
  { tx: '-25px', ty: '-25px', size: 6 },
];

const UNLOCKED_LEVEL_STORAGE_KEY = 'pawcade_farm_crush_unlocked_level';

export const PetCandyCrushContainer: React.FC = () => {
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [unlockedMaxLevel, setUnlockedMaxLevel] = useState<number>(() => {
    try {
      const saved = window.localStorage.getItem(UNLOCKED_LEVEL_STORAGE_KEY);
      const parsed = saved ? parseInt(saved, 10) : 1;
      return Number.isFinite(parsed) && parsed >= 1
        ? Math.min(LEVEL_CONFIGS.length, parsed)
        : 1;
    } catch {
      return 1;
    }
  });
  const [gameState, setGameState] = useState<PetCrushGameState>(() => {
    return createInitialGameState(getLevelGoal(1));
  });

  const [displayBoard, setDisplayBoard] = useState<TileData[][]>(() => gameState.board);
  const [isMuted, setIsMuted] = useState<boolean>(() => petCrushSound.isMuted());
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  // Level 1 pre-game interactive finger intro screen ("What to do & how to do with fingers -> Then level starts")
  const [isLevel1IntroOpen, setIsLevel1IntroOpen] = useState<boolean>(true);
  const [comboBanner, setComboBanner] = useState<{ text: string; subtext?: string } | null>(null);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [swappingTiles, setSwappingTiles] = useState<string[]>([]);
  const [poppingCells, setPoppingCells] = useState<Record<string, PoppingCellEffect>>({});
  const [floatingPopups, setFloatingPopups] = useState<FloatingHayPopup[]>([]);
  const [landingTiles, setLandingTiles] = useState<Set<string>>(new Set());
  const [isBoardShaking, setIsBoardShaking] = useState<boolean>(false);

  // Top-Left Boosters: Each starts at 1 per level (ready for future monetization hooks!)
  const [hammerCount, setHammerCount] = useState<number>(1);
  const [isHammerActive, setIsHammerActive] = useState<boolean>(false);
  const [extraMovesCount, setExtraMovesCount] = useState<number>(1);
  const [shuffleCount, setShuffleCount] = useState<number>(1);

  const touchStartRef = useRef<{ row: number; col: number; x: number; y: number } | null>(null);
  const timeoutsRef = useRef<number[]>([]);

  const clearScheduledTimeouts = () => {
    timeoutsRef.current.forEach((id) => window.clearTimeout(id));
    timeoutsRef.current = [];
  };

  useEffect(() => {
    return () => clearScheduledTimeouts();
  }, []);

  useEffect(() => {
    if (!isAnimating) {
      setDisplayBoard(gameState.board);
    }
  }, [gameState.board, isAnimating]);

  useEffect(() => {
    if (gameState.hasWon) {
      // Unlock next level upon winning current level!
      setUnlockedMaxLevel((prevMax) => {
        const nextMax = Math.min(LEVEL_CONFIGS.length, Math.max(prevMax, currentLevel + 1));
        try {
          window.localStorage.setItem(UNLOCKED_LEVEL_STORAGE_KEY, String(nextMax));
        } catch {}
        return nextMax;
      });

      petCrushSound.playSugarCrush();
      try {
        confetti({
          particleCount: 140,
          spread: 90,
          origin: { y: 0.58 },
          colors: ['#38bdf8', '#fb7185', '#4ade80', '#facc15', '#c084fc', '#fb923c'],
        });
      } catch {}
    }
  }, [gameState.hasWon, currentLevel]);

  useEffect(() => {
    if (gameState.isGameOver && !gameState.hasWon) {
      petCrushSound.playGameOver();
    }
  }, [gameState.isGameOver, gameState.hasWon]);

  const startLevel = useCallback(
    (lvl: number, allowNewUnlock: boolean = false) => {
      const clamped = Math.max(1, Math.min(LEVEL_CONFIGS.length, lvl));
      // Prevent skipping to locked levels before beating the current one!
      if (!allowNewUnlock && clamped > unlockedMaxLevel) {
        petCrushSound.playInvalid();
        return;
      }

      clearScheduledTimeouts();
      const goal = getLevelGoal(clamped);
      const freshState = createInitialGameState(goal);
      setCurrentLevel(clamped);
      setGameState(freshState);
      setDisplayBoard(freshState.board);
      setIsAnimating(false);
      setSwappingTiles([]);
      setPoppingCells({});
      setFloatingPopups([]);
      setLandingTiles(new Set());
      setComboBanner(null);
      setHammerCount(1);
      setIsHammerActive(false);
      setExtraMovesCount(1);
      setShuffleCount(1);
      if (clamped === 1) {
        setIsLevel1IntroOpen(true);
      } else {
        setIsLevel1IntroOpen(false);
      }
    },
    [unlockedMaxLevel]
  );

  /**
   * Plays through each CascadeStep sequentially with bubble-burst shockwaves,
   * lock-shatter effects, and Golden Hay (+🌾) floating popups!
   */
  const playCascadeSteps = useCallback(
    (
      initialBoardSnapshot: TileData[][],
      steps: CascadeStep[],
      finalState: PetCrushGameState,
      usedSpecial: boolean,
      usedRainbow: boolean
    ) => {
      if (steps.length === 0) {
        setDisplayBoard(finalState.board);
        setGameState(finalState);
        setIsAnimating(false);
        return;
      }

      let currentStepIndex = 0;
      let boardBeforeStep = initialBoardSnapshot;

      const runNextStep = () => {
        const step = steps[currentStepIndex];
        if (!step) {
          setPoppingCells({});
          setLandingTiles(new Set());
          setDisplayBoard(finalState.board);
          setGameState(finalState);
          setIsAnimating(false);
          return;
        }

        const clearedCount = step.clearedCoords.length;
        const unlockedCount = step.unlockedCoords?.length || 0;
        const createdSpecial = step.matches.some((m) => m.createdSpecial !== undefined);
        const comboNum = currentStepIndex + 1;

        const newPopping: Record<string, PoppingCellEffect> = {};
        let sumRow = 0;
        let sumCol = 0;

        step.clearedCoords.forEach(({ row, col }) => {
          const tile = boardBeforeStep[row]?.[col];
          const cfg = tile ? TREAT_CONFIGS[tile.type] : TREAT_CONFIGS.cow;
          const isBomb = tile ? tile.special !== 'none' : false;

          let burstColor = cfg.bubbleColor;
          let burstEmoji = cfg.emoji;
          if (tile?.blocker === 'swirl') {
            burstColor = '#94a3b8';
            burstEmoji = '🌀';
          } else if (tile?.special === 'square_bomb') {
            burstColor = '#ef4444';
            burstEmoji = '🧨';
          } else if (tile?.special === 'wrapped_bomb') {
            burstColor = '#c084fc';
            burstEmoji = '💣';
          } else if (tile?.special === 'striped_h' || tile?.special === 'striped_v') {
            burstColor = '#38bdf8';
            burstEmoji = '⚡';
          } else if (tile?.special === 'rainbow_star') {
            burstColor = '#facc15';
            burstEmoji = '🌟';
          }

          newPopping[`${row}-${col}`] = {
            row,
            col,
            color: burstColor,
            innerGlow: cfg.innerGlowHex,
            emoji: burstEmoji,
            isBomb,
          };
          sumRow += row;
          sumCol += col;
        });

        setPoppingCells(newPopping);

        if (clearedCount > 0) {
          const centerRow = sumRow / clearedCount;
          const centerCol = sumCol / clearedCount;
          const firstTile = boardBeforeStep[step.clearedCoords[0]!.row]?.[step.clearedCoords[0]!.col];
          const popupColor = firstTile ? TREAT_CONFIGS[firstTile.type].bubbleColor : '#facc15';

          const popupLabel =
            unlockedCount > 0
              ? `🔓 ${unlockedCount} LOCK BROKEN!`
              : clearedCount >= 10
              ? 'MEGA BLAST!'
              : createdSpecial
              ? 'BOOSTER CRAFTED!'
              : comboNum >= 2
              ? `COMBO x${comboNum}!`
              : undefined;

          const popupId = `hay-${Date.now()}-${currentStepIndex}`;
          setFloatingPopups((prev) => [
            ...prev,
            {
              id: popupId,
              row: centerRow,
              col: centerCol,
              hay: step.scoreGained,
              label: popupLabel,
              color: popupColor,
            },
          ]);

          const cleanupPopupTimer = window.setTimeout(() => {
            setFloatingPopups((prev) => prev.filter((p) => p.id !== popupId));
          }, 950);
          timeoutsRef.current.push(cleanupPopupTimer);
        }

        if (currentStepIndex === 0 && usedRainbow) {
          petCrushSound.playRainbowBlast();
        } else if (
          (currentStepIndex === 0 && usedSpecial) ||
          createdSpecial ||
          clearedCount >= 6 ||
          unlockedCount > 0
        ) {
          petCrushSound.playSpecialExplosion();
        }

        petCrushSound.playMatch(comboNum, clearedCount);

        const primaryMatch = step.matches[0];
        if (primaryMatch) {
          petCrushSound.playAnimalVocal(primaryMatch.type);
        }

        if (clearedCount >= 5 || comboNum >= 2 || usedSpecial || createdSpecial || unlockedCount > 0) {
          setIsBoardShaking(true);
          const stopShake = window.setTimeout(() => setIsBoardShaking(false), 320);
          timeoutsRef.current.push(stopShake);
        }

        if (clearedCount >= 8 || comboNum >= 3) {
          try {
            confetti({
              particleCount: 28,
              spread: 65,
              origin: { y: 0.62 },
              colors: ['#38bdf8', '#fb7185', '#4ade80', '#facc15', '#c084fc', '#fb923c'],
            });
          } catch {}
        }

        if (unlockedCount > 0) {
          setComboBanner({ text: 'CAGE UNLOCKED! 🔓✨', subtext: `+${step.scoreGained} 🌾 HAY` });
        } else if (clearedCount >= 12) {
          setComboBanner({ text: 'SUPER BLAST! 💥🧨', subtext: `+${step.scoreGained} 🌾 HAY` });
        } else if (createdSpecial) {
          setComboBanner({ text: 'BOOSTER READY! 🧨⚡', subtext: 'Sweet Crush!' });
        } else if (comboNum >= 3) {
          setComboBanner({ text: 'DELICIOUS! 🌾👑', subtext: `Combo x${comboNum}!` });
        } else if (comboNum === 2) {
          setComboBanner({ text: 'TASTY! 🫧✨', subtext: `Combo x2!` });
        }

        const bannerTimer = window.setTimeout(() => {
          setComboBanner(null);
        }, 1050);
        timeoutsRef.current.push(bannerTimer);

        const dropTimer = window.setTimeout(() => {
          setPoppingCells({});
          setDisplayBoard(step.boardAfterDrop);

          const newLanding = new Set<string>();
          for (let r = 0; r < BOARD_ROWS; r++) {
            for (let c = 0; c < BOARD_COLS; c++) {
              const droppedTile = step.boardAfterDrop[r]?.[c];
              if (droppedTile?.isNew || step.boardAfterClear[r]?.[c] === null) {
                newLanding.add(`${r}-${c}`);
              }
            }
          }
          setLandingTiles(newLanding);

          boardBeforeStep = step.boardAfterDrop;
          currentStepIndex++;

          const nextStepTimer = window.setTimeout(() => {
            runNextStep();
          }, 240);
          timeoutsRef.current.push(nextStepTimer);
        }, 300);

        timeoutsRef.current.push(dropTimer);
      };

      runNextStep();
    },
    []
  );

  const handleTileClick = useCallback(
    (row: number, col: number) => {
      if (isAnimating || gameState.isGameOver || gameState.hasWon) return;

      // If Hammer Booster is active, smash this tile/lock/swirl immediately!
      if (isHammerActive && hammerCount > 0) {
        setIsHammerActive(false);
        setHammerCount((c) => Math.max(0, c - 1));
        setIsAnimating(true);
        petCrushSound.playSpecialExplosion();
        const res = smashTileWithHammer(gameState, row, col);
        playCascadeSteps(gameState.board, res.steps, res.nextState, true, false);
        return;
      }

      const clickedTile = gameState.board[row]?.[col];
      if (!clickedTile) return;

      // Cannot select a locked X-cage or Swirl blocker directly
      if (clickedTile.isLocked || clickedTile.blocker === 'swirl') {
        petCrushSound.playInvalid();
        return;
      }

      const selected = gameState.selectedTile;

      if (!selected) {
        petCrushSound.playSelect();
        setGameState((prev) => ({ ...prev, selectedTile: { row, col } }));
        return;
      }

      if (selected.row === row && selected.col === col) {
        if (clickedTile.special !== 'none') {
          executeDirectDetonation(row, col);
          return;
        }
        setGameState((prev) => ({ ...prev, selectedTile: null }));
        return;
      }

      const dist = Math.abs(selected.row - row) + Math.abs(selected.col - col);
      if (dist !== 1) {
        petCrushSound.playSelect();
        setGameState((prev) => ({ ...prev, selectedTile: { row, col } }));
        return;
      }

      executePlayerSwap(selected.row, selected.col, row, col);
    },
    [gameState, isAnimating, isHammerActive, hammerCount, playCascadeSteps]
  );

  const executeDirectDetonation = (r: number, c: number) => {
    setIsAnimating(true);
    const tile = gameState.board[r]?.[c];
    const usedRainbow = tile?.special === 'rainbow_star';

    const result = detonateSpecialTile(gameState, r, c);
    if (!result.valid) {
      setIsAnimating(false);
      return;
    }

    playCascadeSteps(gameState.board, result.steps, result.nextState, true, usedRainbow);
  };

  const executePlayerSwap = (r1: number, c1: number, r2: number, c2: number) => {
    setIsAnimating(true);
    setSwappingTiles([`${r1}-${c1}`, `${r2}-${c2}`]);

    const t1 = gameState.board[r1]?.[c1];
    const t2 = gameState.board[r2]?.[c2];
    const usedSpecial = Boolean(
      (t1 && t1.special !== 'none') || (t2 && t2.special !== 'none')
    );
    const usedRainbow = Boolean(
      t1?.special === 'rainbow_star' || t2?.special === 'rainbow_star'
    );

    const result = executeSwap(gameState, r1, c1, r2, c2);

    if (!result.valid) {
      petCrushSound.playInvalid();
      const invalidTimer = window.setTimeout(() => {
        setSwappingTiles([]);
        setIsAnimating(false);
        setGameState((prev) => ({ ...prev, selectedTile: null }));
      }, 240);
      timeoutsRef.current.push(invalidTimer);
      return;
    }

    petCrushSound.playSwap();

    const swappedPreview = gameState.board.map((row) => row.map((tile) => ({ ...tile })));
    if (t1 && t2) {
      swappedPreview[r1]![c1] = { ...t2, row: r1, col: c1 };
      swappedPreview[r2]![c2] = { ...t1, row: r2, col: c2 };
    }
    setDisplayBoard(swappedPreview);

    const swapDoneTimer = window.setTimeout(() => {
      setSwappingTiles([]);
      playCascadeSteps(
        swappedPreview,
        result.steps,
        result.nextState,
        usedSpecial,
        usedRainbow
      );
    }, 150);
    timeoutsRef.current.push(swapDoneTimer);
  };

  const handleTouchStart = (row: number, col: number, e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      touchStartRef.current = {
        row,
        col,
        x: e.touches[0]!.clientX,
        y: e.touches[0]!.clientY,
      };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || e.changedTouches.length === 0) return;
    const start = touchStartRef.current;
    const endX = e.changedTouches[0]!.clientX;
    const endY = e.changedTouches[0]!.clientY;
    const dx = endX - start.x;
    const dy = endY - start.y;
    touchStartRef.current = null;

    if (Math.abs(dx) < 24 && Math.abs(dy) < 24) {
      handleTileClick(start.row, start.col);
      return;
    }

    let targetRow = start.row;
    let targetCol = start.col;

    if (Math.abs(dx) > Math.abs(dy)) {
      targetCol += dx > 0 ? 1 : -1;
    } else {
      targetRow += dy > 0 ? 1 : -1;
    }

    if (
      targetRow >= 0 &&
      targetRow < BOARD_ROWS &&
      targetCol >= 0 &&
      targetCol < BOARD_COLS
    ) {
      executePlayerSwap(start.row, start.col, targetRow, targetCol);
    }
  };

  const handleShuffle = () => {
    if (shuffleCount <= 0 || isAnimating || gameState.hasWon) return;
    petCrushSound.playSelect();
    setShuffleCount((c) => Math.max(0, c - 1));
    const remainingLocked: { row: number; col: number; animal?: TreatType }[] = [];
    const remainingSwirls: { row: number; col: number }[] = [];
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        const tile = gameState.board[r]?.[c];
        if (tile?.isLocked) remainingLocked.push({ row: r, col: c, animal: tile.type });
        if (tile?.blocker === 'swirl') remainingSwirls.push({ row: r, col: c });
      }
    }
    const freshBoard = createInitialBoard(remainingLocked, remainingSwirls);
    setDisplayBoard(freshBoard);
    setGameState((prev) => ({
      ...prev,
      board: freshBoard,
      selectedTile: null,
    }));
  };

  const handleAddExtraMoves = () => {
    if (extraMovesCount <= 0 || isAnimating || gameState.hasWon) return;
    petCrushSound.playRainbowBlast();
    setExtraMovesCount((c) => Math.max(0, c - 1));
    setGameState((prev) => ({
      ...prev,
      movesRemaining: prev.movesRemaining + 5,
      isGameOver: false,
    }));
    setComboBanner({ text: '+5 EXTRA MOVES! 🎁', subtext: 'Keep Harvesting!' });
    setTimeout(() => setComboBanner(null), 1100);
  };

  const handleRestart = () => {
    petCrushSound.playSelect();
    startLevel(currentLevel, true);
  };

  const handleNextLevel = () => {
    petCrushSound.playSelect();
    const nextLvl = currentLevel < LEVEL_CONFIGS.length ? currentLevel + 1 : 1;
    startLevel(nextLvl, true);
  };

  const toggleSound = () => {
    const next = petCrushSound.toggleMute();
    setIsMuted(next);
  };

  // Compute Caged Animal Rescue Progress per species & total
  const lockedCellsList = gameState.goal.lockedCells || [];
  let remainingLocksCount = 0;
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      if (displayBoard[r]?.[c]?.isLocked) remainingLocksCount++;
    }
  }
  const totalLevelLocks = gameState.goal.targetLocks || lockedCellsList.length;
  const unlockedSoFar = Math.max(0, totalLevelLocks - remainingLocksCount);

  // Group caged animals by species (e.g. cow: { total: 2, rescued: 1 })
  const cagedSpeciesTargets: {
    animal: TreatType;
    total: number;
    rescued: number;
  }[] = [];
  const speciesMap = new Map<TreatType, { total: number; rescued: number }>();
  for (const cell of lockedCellsList) {
    const animalType = cell.animal || displayBoard[cell.row]?.[cell.col]?.type || 'cow';
    const entry = speciesMap.get(animalType) || { total: 0, rescued: 0 };
    entry.total += 1;
    const isStillLocked = Boolean(displayBoard[cell.row]?.[cell.col]?.isLocked);
    if (!isStillLocked) {
      entry.rescued += 1;
    }
    speciesMap.set(animalType, entry);
  }
  speciesMap.forEach((val, key) => {
    cagedSpeciesTargets.push({ animal: key, total: val.total, rescued: val.rescued });
  });

  // Live On-Board Animated Finger Hint for Level 1 (guides player until Level 1 is won)
  const tutorialMove =
    currentLevel === 1 &&
    !isLevel1IntroOpen &&
    !gameState.hasWon &&
    !gameState.isGameOver &&
    !isAnimating
      ? findBestTutorialMove(displayBoard)
      : null;

  // Golden Hay Thermometer Percentage (based on 3-star threshold max or targetHay)
  const maxHayBar = gameState.goal.starThresholds[2] || gameState.goal.targetScore * 1.4;
  const hayPercent = Math.min(100, Math.round((gameState.score / maxHayBar) * 100));
  const star1Pct = Math.round((gameState.goal.starThresholds[0] / maxHayBar) * 100);
  const star2Pct = Math.round((gameState.goal.starThresholds[1] / maxHayBar) * 100);
  const star3Pct = 96;

  // Helper to get organic Candy Crush shape CSS for each of the 6 animals
  const getCandyShapeStyle = (type: TreatType, config: (typeof TREAT_CONFIGS)[TreatType]) => {
    const baseShadow = `0 4px 0 ${config.lipHex}, 0 6px 10px rgba(0, 0, 0, 0.38), inset 0 3px 4px rgba(255, 255, 255, 0.78), inset 0 -4px 6px rgba(0, 0, 0, 0.25)`;
    const baseGrad = `radial-gradient(circle at 35% 28%, ${config.topHex} 0%, ${config.midHex} 52%, ${config.bottomHex} 100%)`;

    switch (config.shape) {
      case 'sphere': // Blue Lollipop Sphere (Cow)
        return {
          width: '88%',
          height: '88%',
          borderRadius: '9999px',
          background: baseGrad,
          boxShadow: baseShadow,
        };
      case 'bean': // Red Jelly Bean Capsule (Pig)
        return {
          width: '90%',
          height: '78%',
          borderRadius: '48% 52% 46% 54% / 55% 48% 52% 45%',
          transform: 'rotate(-10deg)',
          background: baseGrad,
          boxShadow: baseShadow,
        };
      case 'cushion': // Green Soft Pillow Gummy (Sheep)
        return {
          width: '84%',
          height: '84%',
          borderRadius: '30%',
          background: baseGrad,
          boxShadow: baseShadow,
        };
      case 'teardrop': // Yellow Lemon Drop (Chicken)
        return {
          width: '84%',
          height: '88%',
          borderRadius: '50% 50% 45% 45% / 60% 60% 40% 40%',
          background: baseGrad,
          boxShadow: baseShadow,
        };
      case 'flower': // Purple Scalloped Flower Cluster (Duck)
        return {
          width: '88%',
          height: '88%',
          borderRadius: '38% 62% 38% 62% / 62% 38% 62% 38%',
          background: baseGrad,
          boxShadow: baseShadow,
        };
      case 'lozenge': // Orange Vertical Oval Candy (Horse)
        return {
          width: '78%',
          height: '90%',
          borderRadius: '9999px',
          background: baseGrad,
          boxShadow: baseShadow,
        };
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-2 py-1 select-none">
      {/* Keyframe Animations */}
      <style>{`
        @keyframes bubble-shockwave {
          0% { transform: scale(0.35); opacity: 1; }
          70% { transform: scale(1.65); opacity: 0.75; }
          100% { transform: scale(2.15); opacity: 0; }
        }
        @keyframes droplet-fly {
          0% { transform: translate(0px, 0px) scale(1.1); opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) scale(0.15); opacity: 0; }
        }
        @keyframes block-pop-burst {
          0% { transform: scale(1); filter: brightness(1); }
          45% { transform: scale(1.28); filter: brightness(1.45); }
          100% { transform: scale(0.12); opacity: 0; }
        }
        @keyframes jelly-drop-bounce {
          0% { transform: translateY(-20%) scale(0.88, 1.14); }
          55% { transform: translateY(4%) scale(1.08, 0.91); }
          80% { transform: translateY(-2%) scale(0.98, 1.02); }
          100% { transform: translateY(0) scale(1, 1); }
        }
        @keyframes score-float-up {
          0% { transform: translate(-50%, -20%) scale(0.65); opacity: 0; }
          25% { transform: translate(-50%, -55%) scale(1.15); opacity: 1; }
          80% { transform: translate(-50%, -110%) scale(1.02); opacity: 1; }
          100% { transform: translate(-50%, -145%) scale(0.9); opacity: 0; }
        }
        @keyframes tray-shake {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          20% { transform: translate(-4px, 3px) rotate(-0.6deg); }
          40% { transform: translate(4px, -3px) rotate(0.6deg); }
          60% { transform: translate(-3px, -2px) rotate(-0.4deg); }
          80% { transform: translate(3px, 2px) rotate(0.4deg); }
        }
        @keyframes windmill-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes intro-finger-swipe {
          0%, 12% { transform: translate(0px, 0px) scale(1); opacity: 0.95; }
          22% { transform: translate(0px, 4px) scale(0.9); opacity: 1; }
          62% { transform: translate(54px, 4px) scale(0.92); opacity: 1; }
          78% { transform: translate(54px, -4px) scale(1.08); opacity: 0.95; }
          100% { transform: translate(0px, 0px) scale(1); opacity: 0.95; }
        }
        @keyframes board-finger-glide {
          0%, 12% { transform: translate(0%, 0%) scale(1); }
          22% { transform: translate(0%, 4%) scale(0.9); }
          65% { transform: translate(var(--finger-dx), var(--finger-dy)) scale(0.92); }
          82% { transform: translate(var(--finger-dx), var(--finger-dy)) scale(1.08); }
          100% { transform: translate(0%, 0%) scale(1); }
        }
        .farm-wood-frame {
          background-image: repeating-linear-gradient(
            -45deg,
            #d97706,
            #d97706 12px,
            #b45309 12px,
            #b45309 24px
          );
          box-shadow: 0 6px 0 #451a03, 0 10px 22px rgba(0, 0, 0, 0.35), inset 0 2px 2px rgba(254, 243, 199, 0.55);
          border: 2px solid #fde68a;
        }
        .silo-stave-body {
          background-image:
            repeating-linear-gradient(
              90deg,
              #991b1b 0px,
              #b91c1c 10px,
              #7f1d1d 10px,
              #7f1d1d 12px
            );
          box-shadow: inset 8px 0 14px rgba(0, 0, 0, 0.35), inset -8px 0 14px rgba(0, 0, 0, 0.4), 0 8px 20px rgba(0, 0, 0, 0.38);
        }
      `}</style>

      {/* Main Scenic Container with Blurred Farm Landscape Background */}
      <div
        style={{
          boxShadow: '0 14px 36px rgba(15, 23, 42, 0.32)',
        }}
        className="relative w-full rounded-[32px] p-3 sm:p-5 border-4 border-amber-700/80 overflow-hidden bg-amber-950"
      >
        {/* BLURRED SCENIC FARM ILLUSTRATION BACKDROP */}
        <div
          style={{
            filter: 'blur(4px)',
            transform: 'scale(1.06)',
          }}
          className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
        >
          <svg
            viewBox="0 0 800 600"
            preserveAspectRatio="xMidYMid slice"
            className="w-full h-full"
          >
            <defs>
              <linearGradient id="farmSky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="48%" stopColor="#bae6fd" />
                <stop offset="78%" stopColor="#fef08a" />
                <stop offset="100%" stopColor="#fde047" />
              </linearGradient>
              <linearGradient id="distantHills" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#65a30d" />
                <stop offset="100%" stopColor="#3f6212" />
              </linearGradient>
              <linearGradient id="wheatField" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#facc15" />
                <stop offset="50%" stopColor="#eab308" />
                <stop offset="100%" stopColor="#ca8a04" />
              </linearGradient>
              <linearGradient id="frontMeadow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#84cc16" />
                <stop offset="55%" stopColor="#4d7c0f" />
                <stop offset="100%" stopColor="#365314" />
              </linearGradient>
            </defs>

            {/* 1. Golden Hour Farm Sky */}
            <rect width="800" height="600" fill="url(#farmSky)" />

            {/* Glowing Sun */}
            <circle cx="660" cy="110" r="68" fill="#fef9c3" opacity="0.85" />
            <circle cx="660" cy="110" r="46" fill="#fde047" />

            {/* Soft Drifting Clouds */}
            <g fill="#ffffff" opacity="0.85">
              <ellipse cx="150" cy="95" rx="55" ry="22" />
              <ellipse cx="185" cy="85" rx="42" ry="26" />
              <ellipse cx="220" cy="98" rx="45" ry="18" />

              <ellipse cx="440" cy="70" rx="48" ry="18" />
              <ellipse cx="475" cy="62" rx="36" ry="22" />
            </g>

            {/* 2. Distant Rolling Hills */}
            <path
              d="M0 340 Q180 250 390 320 T800 295 L800 600 L0 600 Z"
              fill="url(#distantHills)"
            />

            {/* 3. Golden Wheat Field Hill on Right */}
            <path
              d="M240 370 Q520 275 800 355 L800 600 L240 600 Z"
              fill="url(#wheatField)"
            />
            {/* Wheat Furrow Stripes */}
            <path
              d="M360 365 Q560 310 780 375"
              stroke="#a16207"
              strokeWidth="4"
              fill="none"
              opacity="0.45"
            />
            <path
              d="M320 400 Q540 345 790 415"
              stroke="#a16207"
              strokeWidth="5"
              fill="none"
              opacity="0.45"
            />

            {/* 4. Classic Red Gambrel Barn on Left Hill */}
            <g transform="translate(65, 205)">
              {/* Barn Silo Behind */}
              <rect x="125" y="15" width="38" height="95" rx="6" fill="#b91c1c" stroke="#7f1d1d" strokeWidth="3" />
              <path d="M123 18 A20 20 0 0 1 165 18 Z" fill="#cbd5e1" stroke="#64748b" strokeWidth="2" />
              {/* Barn Body */}
              <rect x="10" y="48" width="120" height="75" fill="#dc2626" stroke="#7f1d1d" strokeWidth="3" />
              {/* Gambrel Roof */}
              <polygon
                points="2,50 32,14 108,14 138,50"
                fill="#991b1b"
                stroke="#fef3c7"
                strokeWidth="4"
              />
              {/* Hayloft Window */}
              <rect x="56" y="26" width="28" height="20" fill="#451a03" stroke="#fef3c7" strokeWidth="2.5" />
              {/* White X-Braced Barn Doors */}
              <rect x="42" y="68" width="56" height="54" fill="#b91c1c" stroke="#fef3c7" strokeWidth="3.5" />
              <line x1="42" y1="68" x2="98" y2="122" stroke="#fef3c7" strokeWidth="3.5" />
              <line x1="98" y1="68" x2="42" y2="122" stroke="#fef3c7" strokeWidth="3.5" />
              <line x1="70" y1="68" x2="70" y2="122" stroke="#fef3c7" strokeWidth="3" />
            </g>

            {/* 5. Farm Windmill on Right Hill */}
            <g transform="translate(650, 210)">
              <polygon points="20,120 33,25 43,25 56,120" fill="#78350f" stroke="#451a03" strokeWidth="3" />
              <line x1="25" y1="55" x2="51" y2="55" stroke="#451a03" strokeWidth="3" />
              <line x1="22" y1="85" x2="54" y2="85" stroke="#451a03" strokeWidth="3" />
              {/* Windmill Blades */}
              <g transform="translate(38, 28)">
                <line x1="-38" y1="-38" x2="38" y2="38" stroke="#fef3c7" strokeWidth="5" />
                <line x1="38" y1="-38" x2="-38" y2="38" stroke="#fef3c7" strokeWidth="5" />
                <circle cx="0" cy="0" r="7" fill="#dc2626" stroke="#fef3c7" strokeWidth="2" />
              </g>
            </g>

            {/* 6. Foreground Emerald Pasture */}
            <path
              d="M0 400 Q260 335 530 410 T800 390 L800 600 L0 600 Z"
              fill="url(#frontMeadow)"
            />

            {/* 7. Golden Rolled Hay Bales */}
            <g transform="translate(540, 395)">
              <ellipse cx="32" cy="24" rx="28" ry="20" fill="#eab308" stroke="#a16207" strokeWidth="3" />
              <ellipse cx="44" cy="24" rx="10" ry="18" fill="#facc15" stroke="#a16207" strokeWidth="2" />
              <circle cx="44" cy="24" r="4" fill="#854d0e" />
            </g>
            <g transform="translate(190, 425)">
              <ellipse cx="26" cy="20" rx="24" ry="16" fill="#eab308" stroke="#a16207" strokeWidth="3" />
              <ellipse cx="36" cy="20" rx="9" ry="15" fill="#facc15" stroke="#a16207" strokeWidth="2" />
            </g>

            {/* 8. Rustic Wooden Post-and-Rail Fence Along Bottom */}
            <g stroke="#451a03" strokeWidth="2" fill="#92400e">
              <rect x="20" y="485" width="760" height="9" rx="3" />
              <rect x="20" y="512" width="760" height="9" rx="3" />
              {[45, 135, 225, 315, 405, 495, 585, 675, 755].map((xPos) => (
                <rect key={xPos} x={xPos} y="472" width="12" height="65" rx="3" fill="#78350f" />
              ))}
            </g>

            {/* 9. Leafy Farm Apple Trees on Sides */}
            <g transform="translate(10, 290)">
              <rect x="28" y="65" width="16" height="55" fill="#78350f" />
              <circle cx="36" cy="48" r="36" fill="#15803d" />
              <circle cx="18" cy="60" r="26" fill="#16a34a" />
              <circle cx="54" cy="58" r="26" fill="#166534" />
              <circle cx="26" cy="40" r="5" fill="#ef4444" />
              <circle cx="48" cy="52" r="5" fill="#ef4444" />
              <circle cx="34" cy="62" r="5" fill="#ef4444" />
            </g>
          </svg>
        </div>

        {/* Subtle Warm Sunlight Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 via-transparent to-amber-950/35 pointer-events-none z-0" />

        {/* Top Bar: Level Selector & Farm Utility Buttons */}
        <div className="relative z-20 flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="farm-wood-frame p-1 rounded-2xl">
              <div className="bg-amber-50 px-3 py-1 rounded-xl flex items-center gap-1.5 border border-amber-300 shadow-inner">
                <button
                  onClick={() => startLevel(currentLevel - 1)}
                  disabled={currentLevel <= 1}
                  title="Previous Level"
                  className="p-0.5 rounded-lg hover:bg-amber-200/80 disabled:opacity-35 text-amber-950 cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs sm:text-sm font-black text-amber-950 tracking-tight">
                  🌾 Level {currentLevel}/{LEVEL_CONFIGS.length}:{' '}
                  {gameState.goal.levelName || 'Sunny Meadow'}
                </span>
                <button
                  onClick={() => startLevel(currentLevel + 1)}
                  disabled={
                    currentLevel >= unlockedMaxLevel || currentLevel >= LEVEL_CONFIGS.length
                  }
                  title={
                    currentLevel >= unlockedMaxLevel && currentLevel < LEVEL_CONFIGS.length
                      ? 'Rescue all caged animals in this level to unlock the next level!'
                      : 'Next Level'
                  }
                  className="p-0.5 rounded-lg hover:bg-amber-200/80 disabled:opacity-40 text-amber-950 cursor-pointer disabled:cursor-not-allowed flex items-center gap-0.5"
                >
                  {currentLevel >= unlockedMaxLevel &&
                  currentLevel < LEVEL_CONFIGS.length ? (
                    <span className="text-[11px] leading-none" title="Locked">
                      🔒
                    </span>
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {isHammerActive && (
              <span className="px-3 py-1 rounded-full bg-amber-400 text-amber-950 font-black text-xs animate-bounce shadow-md border-2 border-white">
                🔨 Tap any Locked Cage or Animal to Smash!
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsHelpOpen(true)}
              title="How to Play"
              className="p-2 rounded-xl bg-amber-50/95 hover:bg-amber-100 text-amber-950 border-2 border-amber-500 shadow-sm cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            <button
              onClick={toggleSound}
              title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
              className="p-2 rounded-xl bg-amber-50/95 hover:bg-amber-100 text-amber-950 border-2 border-amber-500 shadow-sm cursor-pointer"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-red-600" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-700" />
              )}
            </button>
            <button
              onClick={handleRestart}
              title="Restart Level"
              style={{ boxShadow: '0 4px 0 #14532d' }}
              className="p-2 px-3 rounded-xl bg-gradient-to-b from-lime-500 to-emerald-700 hover:from-lime-600 hover:to-emerald-800 text-white font-black text-xs border-2 border-lime-200 flex items-center gap-1 cursor-pointer active:translate-y-0.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restart</span>
            </button>
          </div>
        </div>

        {/* 3-COLUMN FARM CRUSH LAYOUT:
            Left: Rustic Timber Boosters + Harvest Targets + Moves/Hay
            Center: Frosted Pasture Glass 8x8 Grid
            Right: Authentic 3D Farm Grain & Hay Silo with Dome, Ladder & 3 Stars */}
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-stretch justify-center gap-3 sm:gap-4">
          {/* LEFT PANEL: Farm Timber Frame with Boosters, Level Targets & Moves */}
          <div className="w-full md:w-48 flex flex-row md:flex-col justify-between gap-2.5 shrink-0">
            {/* Top-Left 3 Glossy Green 3D Booster Buttons + Target Box */}
            <div className="farm-wood-frame p-2 rounded-2xl flex-1 md:flex-none">
              {/* 3 Glossy Green Farm Booster Buttons (Hammer: 1, +5 Moves: 1, Shuffle: 1) */}
              <div className="grid grid-cols-3 gap-1.5 mb-2">
                {/* 1. Hammer Smash Booster (Starts with 1 charge) */}
                <button
                  onClick={() => {
                    if (hammerCount > 0) {
                      petCrushSound.playSelect();
                      setIsHammerActive((v) => !v);
                    }
                  }}
                  disabled={hammerCount <= 0}
                  title="Barn Hammer (1 per level): Smash any Locked Cage or Tile!"
                  style={{
                    boxShadow: isHammerActive
                      ? '0 2px 0 #14532d, 0 0 0 3px #fde047'
                      : '0 4px 0 #14532d',
                  }}
                  className={`relative h-11 rounded-xl bg-gradient-to-b from-lime-400 via-emerald-500 to-green-700 border-2 border-lime-200 flex items-center justify-center transition-transform cursor-pointer ${
                    isHammerActive ? 'translate-y-0.5 scale-105' : 'hover:-translate-y-0.5'
                  } disabled:opacity-45 disabled:cursor-not-allowed`}
                >
                  <Hammer className="w-5 h-5 text-white drop-shadow-sm" />
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-700 border border-amber-200 text-[10px] font-black text-amber-50 flex items-center justify-center shadow-xs">
                    {hammerCount}
                  </span>
                </button>

                {/* 2. +5 Extra Moves Booster (Starts with 1 charge) */}
                <button
                  onClick={handleAddExtraMoves}
                  disabled={extraMovesCount <= 0}
                  title="Add +5 Extra Moves (1 per level)!"
                  style={{ boxShadow: '0 4px 0 #14532d' }}
                  className="relative h-11 rounded-xl bg-gradient-to-b from-lime-400 via-emerald-500 to-green-700 border-2 border-lime-200 flex items-center justify-center hover:-translate-y-0.5 active:translate-y-0.5 transition-transform cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                >
                  <span
                    style={{ textShadow: '0 2px 0 #14532d' }}
                    className="text-sm font-black text-amber-200 tracking-tighter"
                  >
                    +5
                  </span>
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-700 border border-amber-200 text-[10px] font-black text-amber-50 flex items-center justify-center shadow-xs">
                    {extraMovesCount}
                  </span>
                </button>

                {/* 3. Shuffle Pasture Booster (Starts with 1 charge) */}
                <button
                  onClick={handleShuffle}
                  disabled={shuffleCount <= 0}
                  title="Shuffle Pasture (1 per level)!"
                  style={{ boxShadow: '0 4px 0 #14532d' }}
                  className="relative h-11 rounded-xl bg-gradient-to-b from-lime-400 via-emerald-500 to-green-700 border-2 border-lime-200 flex items-center justify-center hover:-translate-y-0.5 active:translate-y-0.5 transition-transform cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                >
                  <Shuffle className="w-5 h-5 text-white drop-shadow-sm" />
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-700 border border-amber-200 text-[10px] font-black text-amber-50 flex items-center justify-center shadow-xs">
                    {shuffleCount}
                  </span>
                </button>
              </div>

              {/* Warm Parchment Target Box: RESCUE CAGED ANIMALS! */}
              <div className="bg-gradient-to-b from-amber-50 to-orange-50/95 border-2 border-amber-400 rounded-xl p-2 shadow-inner">
                <div className="text-[10px] font-black uppercase tracking-wider text-amber-900 text-center mb-1.5">
                  🔓 Harvest Targets
                </div>

                {/* Caged Animal Species to Rescue */}
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  {cagedSpeciesTargets.map(({ animal, total, rescued }) => {
                    const config = TREAT_CONFIGS[animal];
                    const isDone = rescued >= total;
                    return (
                      <div
                        key={animal}
                        title={`Rescue ${total} caged ${config.name}(s)`}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg border shadow-2xs transition-colors ${
                          isDone
                            ? 'bg-emerald-50 border-emerald-400'
                            : 'bg-white border-amber-300'
                        }`}
                      >
                        <div className="relative flex items-center">
                          <span className="text-base leading-none">{config.emoji}</span>
                          <span className="text-[9px] -ml-1 -mt-2">
                            {isDone ? '🔓' : '🔒'}
                          </span>
                        </div>
                        <span
                          className={`text-xs font-black ${
                            isDone ? 'text-emerald-700' : 'text-amber-950'
                          }`}
                        >
                          {rescued}/{total}
                        </span>
                        {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                      </div>
                    );
                  })}
                </div>

                {/* Overall Cage Rescue Summary Pill */}
                {totalLevelLocks > 0 && (
                  <div className="mt-1.5 pt-1 border-t border-amber-200/80 flex items-center justify-center gap-1 text-[10px] font-black text-amber-900">
                    <span>{remainingLocksCount === 0 ? '🔓' : '🔒'}</span>
                    <span>
                      Rescued: {unlockedSoFar} / {totalLevelLocks} Caged
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Moves & Hay Collected Farm-Timber Panel */}
            <div className="farm-wood-frame p-2 rounded-2xl flex-1 flex flex-col justify-center gap-2">
              <div className="bg-gradient-to-b from-amber-50 to-amber-100/95 border-2 border-amber-400 rounded-xl py-2 px-3 text-center shadow-inner">
                <div
                  style={{ fontFamily: 'Georgia, serif' }}
                  className="text-xs sm:text-sm font-black text-amber-900 italic"
                >
                  Moves Left:
                </div>
                <div
                  style={{ textShadow: '0 2px 0 rgba(255,255,255,0.9)' }}
                  className="text-2xl sm:text-3xl font-black text-amber-950 leading-none mt-0.5"
                >
                  {gameState.movesRemaining}
                </div>
              </div>

              <div className="bg-gradient-to-b from-amber-50 to-amber-100/95 border-2 border-amber-400 rounded-xl py-2 px-3 text-center shadow-inner">
                <div
                  style={{ fontFamily: 'Georgia, serif' }}
                  className="text-xs sm:text-sm font-black text-amber-900 italic"
                >
                  Hay Stored:
                </div>
                <div className="text-lg sm:text-xl font-black text-amber-800 leading-tight mt-0.5 flex items-center justify-center gap-1">
                  <span>🌾</span>
                  <span>{gameState.score}</span>
                </div>
              </div>
            </div>
          </div>

          {/* CENTER PANEL: Semi-Transparent Frosted Pasture Board with Warm Timber Trim */}
          <div
            style={{
              animation: isBoardShaking ? 'tray-shake 0.32s ease-in-out' : undefined,
              background:
                'linear-gradient(180deg, rgba(20, 52, 92, 0.66) 0%, rgba(15, 38, 72, 0.76) 100%)',
              boxShadow:
                '0 10px 28px rgba(15, 23, 42, 0.45), 0 0 0 4px #b45309, inset 0 2px 6px rgba(254, 243, 199, 0.4)',
            }}
            onTouchMove={(e) => {
              if (e.cancelable) e.preventDefault();
            }}
            className="relative w-full aspect-square max-w-[460px] backdrop-blur-md border-[3px] border-amber-200/80 rounded-[26px] p-1.5 sm:p-3 touch-none select-none"
          >
            {/* Celebratory Praise Banner */}
            {comboBanner && (
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center z-40 pointer-events-none animate-bounce">
                <div
                  style={{
                    boxShadow: '0 6px 0 #78350f, 0 12px 24px rgba(0,0,0,0.5)',
                  }}
                  className="px-5 py-2 rounded-2xl bg-gradient-to-b from-yellow-300 via-amber-400 to-orange-500 text-amber-950 text-base sm:text-xl font-black border-2 border-amber-100 tracking-wide text-center"
                >
                  <div>{comboBanner.text}</div>
                  {comboBanner.subtext && (
                    <div className="text-[11px] font-black uppercase tracking-widest text-amber-950">
                      {comboBanner.subtext}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Floating "+180 🌾" Hay Popups */}
            {floatingPopups.map((popup) => (
              <div
                key={popup.id}
                style={{
                  left: `${((popup.col + 0.5) / BOARD_COLS) * 100}%`,
                  top: `${((popup.row + 0.5) / BOARD_ROWS) * 100}%`,
                  animation: 'score-float-up 0.92s cubic-bezier(0.22, 1, 0.36, 1) forwards',
                }}
                className="absolute z-40 pointer-events-none flex flex-col items-center"
              >
                {popup.label && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-950/90 text-yellow-300 text-[10px] font-black uppercase tracking-wider border border-yellow-400/60 shadow-md whitespace-nowrap mb-0.5">
                    {popup.label}
                  </span>
                )}
                <span
                  style={{
                    textShadow: '0 2px 0 #451a03, 0 4px 8px rgba(0,0,0,0.65)',
                  }}
                  className="text-base sm:text-xl font-black text-amber-300 drop-shadow-md whitespace-nowrap"
                >
                  +{popup.hay} 🌾
                </span>
              </div>
            ))}

            {/* 8x8 Frosted Cells */}
            <div className="relative grid grid-cols-8 grid-rows-8 gap-1 sm:gap-1.5 w-full h-full">
              {displayBoard.map((row, r) =>
                row.map((tile, c) => {
                  const config = TREAT_CONFIGS[tile.type];
                  const isSelected =
                    gameState.selectedTile?.row === r && gameState.selectedTile?.col === c;
                  const cellKey = `${r}-${c}`;
                  const isSwapping = swappingTiles.includes(cellKey);
                  const popEffect = poppingCells[cellKey];
                  const isLanding = landingTiles.has(cellKey);
                  const isTutorialCell = Boolean(
                    tutorialMove &&
                      ((tutorialMove.r1 === r && tutorialMove.c1 === c) ||
                        (tutorialMove.r2 === r && tutorialMove.c2 === c))
                  );

                  const shapeStyle = getCandyShapeStyle(tile.type, config);

                  return (
                    <div
                      key={tile.id || cellKey}
                      onClick={() => handleTileClick(r, c)}
                      onTouchStart={(e) => handleTouchStart(r, c, e)}
                      onTouchEnd={handleTouchEnd}
                      style={{
                        backgroundColor: isTutorialCell
                          ? 'rgba(250, 204, 21, 0.36)'
                          : (r + c) % 2 === 0
                          ? 'rgba(56, 118, 195, 0.34)'
                          : 'rgba(30, 82, 155, 0.38)',
                        boxShadow: isTutorialCell
                          ? '0 0 0 2.5px #fde047, 0 0 14px rgba(250, 204, 21, 0.85), inset 0 2px 5px rgba(254, 240, 138, 0.5)'
                          : 'inset 0 2px 5px rgba(15, 23, 42, 0.35)',
                      }}
                      className={`relative rounded-xl border flex items-center justify-center aspect-square cursor-pointer ${
                        isTutorialCell
                          ? 'border-yellow-300 z-20 animate-pulse'
                          : 'border-amber-100/25'
                      }`}
                    >
                      {/* 1. SWIRL BLOCKER (Hay / Licorice Coil) */}
                      {tile.blocker === 'swirl' ? (
                        <div
                          style={{
                            background:
                              'radial-gradient(circle at 50% 50%, #fef3c7 0%, #fef3c7 12%, #451a03 14%, #78350f 32%, #d97706 36%, #451a03 56%, #92400e 62%, #270e02 100%)',
                            boxShadow:
                              '0 4px 0 #270e02, 0 6px 10px rgba(0,0,0,0.45), inset 0 2px 3px rgba(255,255,255,0.35)',
                            animation: popEffect
                              ? 'block-pop-burst 0.29s ease-out forwards'
                              : undefined,
                          }}
                          className="relative w-[86%] h-[86%] rounded-[28%] border-2 border-amber-500/70 flex items-center justify-center"
                        >
                          <div className="w-2.5 h-2.5 rounded-full bg-amber-200 shadow-xs" />
                        </div>
                      ) : tile.special === 'square_bomb' ? (
                        /* 2. DEDICATED 3D DYNAMITE BOOSTER (2x2 Square) */
                        <div
                          style={{
                            background:
                              'radial-gradient(circle at 35% 30%, #ff758f 0%, #ef4444 55%, #991b1b 100%)',
                            boxShadow:
                              '0 4px 0 #450a0a, 0 6px 10px rgba(0,0,0,0.45), inset 0 3px 4px rgba(255,255,255,0.75)',
                            animation: popEffect
                              ? 'block-pop-burst 0.29s ease-out forwards'
                              : isLanding
                              ? 'jelly-drop-bounce 0.26s cubic-bezier(0.34, 1.56, 0.64, 1)'
                              : undefined,
                          }}
                          className={`relative w-[88%] h-[88%] rounded-[32%] border-2 border-yellow-300 flex flex-col items-center justify-center transition-transform ${
                            isSelected ? 'scale-110 ring-4 ring-yellow-300 z-20' : 'hover:scale-105'
                          }`}
                        >
                          <div className="absolute top-1 left-2 w-2.5 h-1.5 rounded-full bg-white/85 -rotate-12 pointer-events-none" />
                          <span className="text-xl sm:text-2xl leading-none drop-shadow-md">
                            🧨
                          </span>
                          <span className="text-[7px] font-black text-yellow-200 uppercase tracking-wider bg-red-950/90 px-1 rounded">
                            TNT
                          </span>
                        </div>
                      ) : tile.special === 'wrapped_bomb' ? (
                        /* 3. DEDICATED 3D BARREL BOMB BOOSTER (L / T Match) */
                        <div
                          style={{
                            background:
                              'radial-gradient(circle at 35% 30%, #fbbf24 0%, #b45309 55%, #451a03 100%)',
                            boxShadow:
                              '0 4px 0 #270e02, 0 6px 10px rgba(0,0,0,0.45), inset 0 3px 4px rgba(255,255,255,0.75)',
                            animation: popEffect
                              ? 'block-pop-burst 0.29s ease-out forwards'
                              : isLanding
                              ? 'jelly-drop-bounce 0.26s cubic-bezier(0.34, 1.56, 0.64, 1)'
                              : undefined,
                          }}
                          className={`relative w-[88%] h-[88%] rounded-full border-2 border-yellow-300 flex flex-col items-center justify-center transition-transform ${
                            isSelected ? 'scale-110 ring-4 ring-yellow-300 z-20' : 'hover:scale-105'
                          }`}
                        >
                          <div className="absolute top-1.5 left-2 w-2.5 h-1.5 rounded-full bg-white/85 -rotate-12 pointer-events-none" />
                          <span className="text-xl sm:text-2xl leading-none drop-shadow-md">
                            💣
                          </span>
                          <span className="text-[7px] font-black text-yellow-200 uppercase tracking-wider bg-amber-950/90 px-1 rounded">
                            3×3
                          </span>
                        </div>
                      ) : tile.special === 'striped_h' || tile.special === 'striped_v' ? (
                        /* 4. DEDICATED 3D STRIPED ROCKET (4-in-a-Row) */
                        <div
                          style={{
                            background:
                              tile.special === 'striped_h'
                                ? 'repeating-linear-gradient(0deg, #16a34a 0px, #16a34a 5px, #fef08a 5px, #fef08a 9px)'
                                : 'repeating-linear-gradient(90deg, #0284c7 0px, #0284c7 5px, #ffffff 5px, #ffffff 9px)',
                            boxShadow:
                              '0 4px 0 #14532d, 0 6px 10px rgba(0,0,0,0.45), inset 0 3px 4px rgba(255,255,255,0.8)',
                            animation: popEffect
                              ? 'block-pop-burst 0.29s ease-out forwards'
                              : isLanding
                              ? 'jelly-drop-bounce 0.26s cubic-bezier(0.34, 1.56, 0.64, 1)'
                              : undefined,
                          }}
                          className={`relative w-[88%] h-[88%] rounded-[36%] border-2 border-yellow-300 flex items-center justify-center transition-transform ${
                            isSelected ? 'scale-110 ring-4 ring-yellow-300 z-20' : 'hover:scale-105'
                          }`}
                        >
                          <div className="px-1.5 py-0.5 rounded-full bg-amber-950/85 border border-yellow-300 flex items-center gap-0.5 shadow-sm">
                            <span className="text-[8px] text-yellow-300 font-black">
                              {tile.special === 'striped_h' ? '◀' : '▲'}
                            </span>
                            <span className="text-sm sm:text-base leading-none">⚡</span>
                            <span className="text-[8px] text-yellow-300 font-black">
                              {tile.special === 'striped_h' ? '▶' : '▼'}
                            </span>
                          </div>
                        </div>
                      ) : tile.special === 'rainbow_star' ? (
                        /* 5. DEDICATED 3D GOLDEN BARN STAR (5-in-a-Row) */
                        <div
                          style={{
                            background:
                              'radial-gradient(circle at 38% 32%, #78350f 0%, #451a03 55%, #1c0a00 100%)',
                            boxShadow:
                              '0 4px 0 #090400, 0 6px 10px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.45)',
                            animation: popEffect
                              ? 'block-pop-burst 0.29s ease-out forwards'
                              : isLanding
                              ? 'jelly-drop-bounce 0.26s cubic-bezier(0.34, 1.56, 0.64, 1)'
                              : undefined,
                          }}
                          className={`relative w-[88%] h-[88%] rounded-full border-2 border-amber-300 flex items-center justify-center transition-transform ${
                            isSelected ? 'scale-110 ring-4 ring-yellow-300 z-20' : 'hover:scale-105'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 absolute top-1.5 left-2.5" />
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 absolute top-2 right-2" />
                          <span className="w-1.5 h-1.5 rounded-full bg-lime-400 absolute bottom-2 left-2" />
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-300 absolute bottom-1.5 right-2.5" />
                          <span className="text-xl sm:text-2xl leading-none drop-shadow-md relative z-10">
                            🌟
                          </span>
                        </div>
                      ) : (
                        /* 6. ORGANIC 3D GLOSSY SCULPTED ANIMAL CANDY (No Sharp Edges!) */
                        <div
                          style={{
                            ...shapeStyle,
                            animation: popEffect
                              ? 'block-pop-burst 0.29s ease-out forwards'
                              : isLanding
                              ? 'jelly-drop-bounce 0.26s cubic-bezier(0.34, 1.56, 0.64, 1)'
                              : undefined,
                          }}
                          className={`relative flex items-center justify-center transition-transform duration-150 ${
                            isSelected
                              ? 'scale-112 ring-3 ring-white z-20'
                              : isSwapping
                              ? 'scale-90 opacity-85'
                              : 'hover:scale-105'
                          }`}
                        >
                          {/* Glossy Curved Candy Specular Highlight */}
                          <div className="absolute top-[10%] left-[18%] w-[44%] h-[26%] rounded-full bg-gradient-to-b from-white/75 to-white/10 -rotate-12 pointer-events-none" />
                          <div className="absolute top-[14%] left-[20%] w-2 h-1 rounded-full bg-white/95 -rotate-12 pointer-events-none" />

                          {/* Animal Emoji */}
                          <span
                            style={{
                              filter: 'drop-shadow(0 2px 2px rgba(0, 0, 0, 0.35))',
                            }}
                            className="relative z-10 text-lg sm:text-[23px] leading-none select-none"
                          >
                            {config.emoji}
                          </span>
                        </div>
                      )}

                      {/* IRON X-CAGE LOCK OVERLAY */}
                      {tile.isLocked && (
                        <div
                          title="Locked Cage! Match with this animal or adjacent tiles to break the lock!"
                          className="absolute inset-0.5 z-25 pointer-events-none rounded-lg border-[3px] border-slate-900 shadow-md overflow-hidden flex items-center justify-center"
                          style={{
                            boxShadow:
                              'inset 0 0 0 1px rgba(255,255,255,0.28), 0 3px 6px rgba(0,0,0,0.55)',
                          }}
                        >
                          <div
                            style={{
                              width: '140%',
                              height: '4px',
                              background: 'linear-gradient(90deg, #0f172a, #475569, #0f172a)',
                              transform: 'rotate(45deg)',
                            }}
                            className="absolute shadow-xs"
                          />
                          <div
                            style={{
                              width: '140%',
                              height: '4px',
                              background: 'linear-gradient(90deg, #0f172a, #475569, #0f172a)',
                              transform: 'rotate(-45deg)',
                            }}
                            className="absolute shadow-xs"
                          />
                          <div className="relative z-10 w-3 h-3 rounded-full bg-gradient-to-b from-slate-500 to-slate-950 border border-slate-300 shadow-xs" />
                        </div>
                      )}

                      {/* Level 1 Caged Target Callout Badge */}
                      {currentLevel === 1 && tile.isLocked && !isLevel1IntroOpen && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 pointer-events-none px-1.5 py-0.2 rounded-full bg-red-600 border border-yellow-300 text-[8px] font-black text-white uppercase tracking-tighter whitespace-nowrap shadow-md animate-bounce">
                          🎯 RESCUE
                        </div>
                      )}

                      {/* BUBBLE POP BURST OVERLAY */}
                      {popEffect && (
                        <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
                          <div
                            style={{
                              borderColor: popEffect.color,
                              boxShadow: `0 0 12px ${popEffect.color}, inset 0 0 8px #ffffff`,
                              animation: 'bubble-shockwave 0.3s ease-out forwards',
                            }}
                            className="absolute w-full h-full rounded-full border-4 bg-white/30"
                          />
                          {BURST_ANGLES.map((angle, idx) => (
                            <span
                              key={idx}
                              style={
                                {
                                  '--tx': angle.tx,
                                  '--ty': angle.ty,
                                  width: `${angle.size}px`,
                                  height: `${angle.size}px`,
                                  backgroundColor: idx % 2 === 0 ? popEffect.color : '#ffffff',
                                  boxShadow: `0 0 6px ${popEffect.color}`,
                                  animation: 'droplet-fly 0.3s ease-out forwards',
                                } as React.CSSProperties
                              }
                              className="absolute rounded-full"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {/* LIVE ON-BOARD ANIMATED FINGER GUIDE (Level 1) */}
              {tutorialMove && (
                <>
                  {/* Floating Hint Pill at Top of Board */}
                  <div className="absolute -top-2.5 inset-x-2 z-35 pointer-events-none flex justify-center">
                    <div
                      style={{
                        boxShadow: '0 4px 0 #78350f, 0 8px 16px rgba(0,0,0,0.45)',
                      }}
                      className="px-3 py-1 rounded-full bg-gradient-to-b from-amber-300 to-amber-500 border-2 border-amber-100 text-amber-950 text-[10px] sm:text-xs font-black tracking-tight flex items-center gap-1.5"
                    >
                      <span>👆</span>
                      <span>
                        {tutorialMove.breaksCage
                          ? 'Slide your finger here to rescue the Caged Cow!'
                          : 'Slide your finger between the 2 glowing animals!'}
                      </span>
                    </div>
                  </div>

                  {/* Animated 3D Pointing Finger Gliding Between (r1,c1) and (r2,c2) */}
                  <div
                    style={
                      {
                        left: `${((tutorialMove.c1 + 0.5) / BOARD_COLS) * 100}%`,
                        top: `${((tutorialMove.r1 + 0.55) / BOARD_ROWS) * 100}%`,
                        '--finger-dx': `${(tutorialMove.c2 - tutorialMove.c1) * 100}%`,
                        '--finger-dy': `${(tutorialMove.r2 - tutorialMove.r1) * 100}%`,
                        animation: 'board-finger-glide 1.65s ease-in-out infinite',
                      } as React.CSSProperties
                    }
                    className="absolute z-35 pointer-events-none w-[12.5%] h-[12.5%] -ml-[6.25%] -mt-[2%] flex flex-col items-center justify-start"
                  >
                    <span
                      style={{
                        filter:
                          'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.65)) drop-shadow(0 0 8px rgba(250, 204, 21, 0.9))',
                      }}
                      className="text-2xl sm:text-3xl leading-none select-none"
                    >
                      👆
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Bottom Row Green Exit/Gravity Indicators */}
            <div className="grid grid-cols-8 gap-1 px-2 mt-1 pointer-events-none">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="flex justify-center">
                  <span className="w-4 h-4 rounded-full bg-emerald-500/85 border border-lime-200/80 text-[9px] text-white font-black flex items-center justify-center shadow-xs">
                    ↓
                  </span>
                </div>
              ))}
            </div>

            {/* LEVEL 1 PRE-START INTERACTIVE FINGER INTRO OVERLAY */}
            {currentLevel === 1 && isLevel1IntroOpen && !gameState.hasWon && (
              <div className="absolute inset-0 bg-amber-950/92 backdrop-blur-md rounded-[24px] flex flex-col items-center justify-between p-4 sm:p-5 text-center z-45 animate-in fade-in duration-200">
                {/* Header */}
                <div>
                  <span className="inline-block px-3 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/50 text-amber-200 text-[10px] font-black uppercase tracking-widest mb-1">
                    🌾 Level 1 Tutorial • Sunny Meadow
                  </span>
                  <h2
                    style={{ textShadow: '0 2px 0 #451a03' }}
                    className="text-xl sm:text-2xl font-black text-amber-300 tracking-tight"
                  >
                    How to Play with Your Finger 👆
                  </h2>
                </div>

                {/* Step 1 + Step 2 Visual Demonstration Cards */}
                <div className="w-full max-w-sm space-y-2.5 my-1">
                  {/* STEP 1: Animated Finger Swipe Demo */}
                  <div className="bg-amber-900/75 border-2 border-amber-400/70 rounded-2xl p-2.5 sm:p-3 text-left shadow-inner">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-black text-amber-200 uppercase tracking-wider">
                        1. Slide or Tap 2 Adjacent Animals
                      </span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                        Match 3+
                      </span>
                    </div>

                    {/* Mini Animated Tile Row with Sliding Finger */}
                    <div className="relative flex items-center justify-center gap-2 py-2 bg-slate-900/65 rounded-xl border border-amber-200/25 overflow-hidden">
                      {/* Tile 1: Glowing Swap Source */}
                      <div className="relative w-11 h-11 rounded-full bg-gradient-to-b from-sky-300 to-blue-600 border-2 border-yellow-300 ring-2 ring-yellow-300/70 flex items-center justify-center text-xl shadow-md">
                        🐮
                      </div>

                      {/* Swap Arrow */}
                      <span className="text-yellow-300 font-black text-sm animate-pulse">⇄</span>

                      {/* Tile 2: Glowing Swap Target */}
                      <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-b from-rose-300 to-red-600 border-2 border-yellow-300 ring-2 ring-yellow-300/70 flex items-center justify-center text-xl shadow-md">
                        🐷
                      </div>

                      {/* Tile 3 & 4: Matching Cows */}
                      <div className="w-11 h-11 rounded-full bg-gradient-to-b from-sky-300 to-blue-600 border border-white/50 flex items-center justify-center text-xl shadow-md">
                        🐮
                      </div>
                      <div className="w-11 h-11 rounded-full bg-gradient-to-b from-sky-300 to-blue-600 border border-white/50 flex items-center justify-center text-xl shadow-md">
                        🐮
                      </div>

                      {/* Animated Sliding Finger Over Tiles 1 & 2 */}
                      <div
                        style={{
                          left: 'calc(50% - 92px)',
                          bottom: '-2px',
                          animation: 'intro-finger-swipe 1.6s ease-in-out infinite',
                        }}
                        className="absolute z-20 pointer-events-none text-3xl drop-shadow-[0_4px_6px_rgba(0,0,0,0.75)]"
                      >
                        👆
                      </div>
                    </div>

                    <p className="text-[11px] text-amber-100/90 mt-1.5 leading-snug">
                      Touch an animal with your finger (or mouse) and{' '}
                      <strong className="text-yellow-300">slide Left, Right, Up, or Down</strong> to
                      line up 3 or more matching animals!
                    </p>
                  </div>

                  {/* STEP 2: What to Do (Break the Cage & Fill the Silo) */}
                  <div className="bg-amber-900/75 border-2 border-amber-400/70 rounded-2xl p-2.5 sm:p-3 text-left shadow-inner">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-black text-amber-200 uppercase tracking-wider">
                        2. Your Goal: Rescue Caged Animals!
                      </span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500 text-amber-950">
                        1 Caged 🐮
                      </span>
                    </div>

                    <div className="flex items-center justify-around gap-2 py-1.5 px-2 bg-slate-900/65 rounded-xl border border-amber-200/25">
                      {/* Caged Cow Icon */}
                      <div className="flex items-center gap-1.5">
                        <div className="relative w-10 h-10 rounded-xl bg-sky-600/80 border-2 border-slate-900 flex items-center justify-center text-lg shadow-md">
                          <span>🐮</span>
                          <span className="absolute -bottom-1 -right-1 text-xs">🔒</span>
                        </div>
                        <span className="text-yellow-300 font-black text-xs">➔</span>
                        <div className="relative w-10 h-10 rounded-xl bg-emerald-600/80 border-2 border-lime-300 flex items-center justify-center text-lg shadow-md">
                          <span>🐮</span>
                          <span className="absolute -bottom-1 -right-1 text-xs">🔓</span>
                        </div>
                      </div>

                      <div className="h-7 w-px bg-amber-500/30" />

                      {/* Silo Target */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-xl">🌾</span>
                        <div className="text-[10px] font-black text-amber-100 leading-tight">
                          <div className="text-yellow-300">Fill the Silo</div>
                          <div>on the right!</div>
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-amber-100/90 mt-1.5 leading-snug">
                      Match <strong className="text-yellow-300">with or right next to</strong> the{' '}
                      <strong className="text-white">Caged Cow (🐮🔒)</strong> to shatter the iron
                      bars and harvest Golden Hay!
                    </p>
                  </div>
                </div>

                {/* Start Level 1 CTA Button */}
                <button
                  onClick={() => {
                    petCrushSound.playSelect();
                    setIsLevel1IntroOpen(false);
                  }}
                  style={{
                    boxShadow: '0 5px 0 #14532d, 0 10px 24px rgba(0, 0, 0, 0.5)',
                  }}
                  className="w-full max-w-xs py-3 px-6 rounded-2xl bg-gradient-to-b from-lime-400 via-emerald-500 to-green-700 hover:from-lime-500 hover:to-green-800 text-white font-black text-base sm:text-lg border-2 border-lime-200 cursor-pointer active:translate-y-0.5 transition-all flex items-center justify-center gap-2"
                >
                  <span>👆</span>
                  <span>Start Level 1!</span>
                  <span>🌾</span>
                </button>
              </div>
            )}

            {/* Victory Celebration Modal Overlay */}
            {gameState.hasWon && (
              <div className="absolute inset-0 bg-amber-950/90 backdrop-blur-md rounded-[24px] flex flex-col items-center justify-center p-6 text-center z-40 animate-in fade-in duration-300">
                <div className="text-5xl mb-2 animate-bounce">🏆🌾🐮✨</div>
                <h2 className="text-2xl sm:text-3xl font-black text-amber-300 tracking-tight mb-1">
                  Level {currentLevel} Complete!
                </h2>
                <p className="text-xs sm:text-sm text-amber-100/90 max-w-xs mb-4">
                  Grand Harvest! You unlocked all cages and filled the Farm Hay Silo!
                </p>

                <div className="flex items-center gap-2 mb-4">
                  {[1, 2, 3].map((starIndex) => (
                    <Star
                      key={starIndex}
                      className={`w-8 h-8 ${
                        gameState.stars >= starIndex
                          ? 'fill-amber-400 text-amber-400 drop-shadow-md animate-bounce'
                          : 'text-amber-900'
                      }`}
                    />
                  ))}
                </div>

                <div className="bg-amber-900/70 border border-amber-400/40 rounded-2xl p-3 mb-5 w-full max-w-xs flex justify-around">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-amber-200">
                      Silo Hay
                    </div>
                    <div className="text-xl font-black text-amber-300">
                      🌾 {gameState.score}
                    </div>
                  </div>
                  <div className="border-r border-amber-700" />
                  <div>
                    <div className="text-[10px] uppercase font-bold text-amber-200">
                      Moves Left
                    </div>
                    <div className="text-xl font-black text-lime-400">
                      {gameState.movesRemaining}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleNextLevel}
                  className="w-full max-w-xs py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 border-2 border-lime-300"
                >
                  <span>Play Level {(currentLevel % LEVEL_CONFIGS.length) + 1} 🚜</span>
                </button>
              </div>
            )}

            {/* Game Over Modal Overlay */}
            {gameState.isGameOver && !gameState.hasWon && (
              <div className="absolute inset-0 bg-amber-950/90 backdrop-blur-md rounded-[24px] flex flex-col items-center justify-center p-6 text-center z-40 animate-in fade-in duration-300">
                <div className="text-4xl mb-2">🚜🌙</div>
                <h2 className="text-2xl sm:text-3xl font-black text-amber-100 tracking-tight mb-1">
                  Out of Moves!
                </h2>
                <p className="text-xs sm:text-sm text-amber-200/80 mb-4">
                  Try again or use the Barn Hammer booster to crack locked cages faster!
                </p>

                <div className="bg-amber-900/70 border border-amber-500/40 rounded-2xl p-3 mb-5 w-full max-w-xs flex items-center justify-between px-5">
                  <div className="text-left">
                    <div className="text-[10px] uppercase font-bold text-amber-200">
                      Hay Gathered
                    </div>
                    <div className="text-lg font-black text-amber-300">
                      🌾 {gameState.score}
                    </div>
                  </div>
                  <div className="border-r border-amber-700" />
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-bold text-amber-200">
                      Silo Target
                    </div>
                    <div className="text-lg font-black text-amber-100">
                      🌾 {gameState.goal.targetScore}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleRestart}
                  className="w-full max-w-xs py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-sm shadow-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 border-2 border-amber-300"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Try Again 🐮</span>
                </button>
              </div>
            )}
          </div>

          {/* RIGHT PANEL: AUTHENTIC 3D FARM GRAIN & HAY SILO TOWER */}
          <div className="w-full md:w-28 flex flex-col items-center justify-between shrink-0 select-none">
            {/* 1. Silo Top Ventilator Cap & Ribbed Galvanized Metal Dome Roof */}
            <div className="w-full flex flex-col items-center">
              {/* Top Weather Cupola Cap */}
              <div className="w-10 h-3 rounded-t-lg bg-gradient-to-r from-slate-500 via-slate-200 to-slate-500 border-2 border-b-0 border-slate-700 flex items-center justify-center shadow-xs">
                <div className="w-2 h-2 rounded-full bg-amber-400 border border-amber-900" />
              </div>

              {/* Hemispherical Ribbed Metal Silo Dome */}
              <div
                style={{
                  background:
                    'repeating-linear-gradient(90deg, #94a3b8 0px, #e2e8f0 7px, #64748b 14px)',
                  boxShadow:
                    'inset 0 4px 8px rgba(255,255,255,0.75), inset 0 -4px 6px rgba(15,23,42,0.45)',
                }}
                className="w-full h-11 rounded-t-[48px] border-[3px] border-b-0 border-slate-700 flex flex-col items-center justify-end pb-1 relative overflow-hidden"
              >
                <span className="px-2 py-0.5 rounded-full bg-amber-950/90 border border-amber-300 text-[9px] font-black uppercase tracking-wider text-amber-200 shadow-xs">
                  🌾 SILO {hayPercent}%
                </span>
              </div>

              {/* Galvanized Steel Roof Rim Collar */}
              <div className="w-[104%] h-2.5 rounded-full bg-gradient-to-r from-slate-600 via-slate-200 to-slate-600 border-2 border-slate-800 shadow-md z-10" />
            </div>

            {/* 2. Cylindrical Barn-Red Silo Tower Body with Steel Hoops, Ladder & Sight-Glass */}
            <div className="silo-stave-body relative w-full flex-1 min-h-[54px] md:min-h-[305px] border-x-[3px] border-amber-950 px-2.5 py-2 flex items-center justify-center">
              {/* Horizontal Galvanized Steel Reinforcement Hoop Bands */}
              <div className="hidden md:flex absolute inset-0 flex-col justify-evenly pointer-events-none z-0">
                <div className="w-full h-1.5 bg-gradient-to-r from-slate-600 via-slate-300 to-slate-700 border-y border-slate-900/80 opacity-80" />
                <div className="w-full h-1.5 bg-gradient-to-r from-slate-600 via-slate-300 to-slate-700 border-y border-slate-900/80 opacity-80" />
                <div className="w-full h-1.5 bg-gradient-to-r from-slate-600 via-slate-300 to-slate-700 border-y border-slate-900/80 opacity-80" />
                <div className="w-full h-1.5 bg-gradient-to-r from-slate-600 via-slate-300 to-slate-700 border-y border-slate-900/80 opacity-80" />
              </div>

              {/* External Silo Inspection Ladder on Left Side */}
              <div className="hidden md:flex absolute left-1.5 inset-y-2 w-2.5 border-x-2 border-slate-300/75 flex-col justify-between py-1 pointer-events-none z-10">
                {Array.from({ length: 14 }).map((_, i) => (
                  <div key={i} className="w-full h-[2px] bg-slate-200/80" />
                ))}
              </div>

              {/* Central Glass Observation Window (Sight-Glass where Golden Hay Piles Up!) */}
              <div className="relative z-10 w-full md:w-12 h-8 md:h-full min-h-[32px] md:min-h-[285px] bg-stone-950/90 rounded-2xl border-[3px] border-amber-300/90 p-1 shadow-inner overflow-visible flex items-end">
                {/* Measurement Ticks on Glass Window */}
                <div className="hidden md:flex absolute inset-y-3 left-1 flex-col justify-between pointer-events-none z-20">
                  <span className="w-2 h-[1.5px] bg-amber-200/50" />
                  <span className="w-3 h-[1.5px] bg-amber-200/70" />
                  <span className="w-2 h-[1.5px] bg-amber-200/50" />
                  <span className="w-3 h-[1.5px] bg-amber-200/70" />
                  <span className="w-2 h-[1.5px] bg-amber-200/50" />
                </div>

                {/* Rising Golden Straw / Hay Fill */}
                <div
                  style={{
                    height: `${hayPercent}%`,
                    width: '100%',
                    background:
                      'repeating-linear-gradient(-30deg, #d97706 0px, #f59e0b 6px, #fde047 12px, #ca8a04 18px)',
                    boxShadow: '0 0 14px rgba(250, 204, 21, 0.75), inset 0 3px 5px #fef08a',
                  }}
                  className="w-full rounded-xl transition-all duration-500 relative overflow-hidden"
                >
                  {/* Glossy Glass Reflection Strip */}
                  <div className="absolute inset-y-0 left-1 w-1.5 bg-white/40 rounded-full" />
                  {/* Top Golden Straw Crest */}
                  <div className="w-full h-2 bg-yellow-200/90 blur-[0.5px]" />
                </div>

                {/* 1st Star Marker (Harvest Amber Star) */}
                <div
                  style={{ bottom: `${star1Pct}%` }}
                  className="hidden md:flex absolute -left-2 -right-4 items-center justify-end pointer-events-none z-30"
                >
                  <div className="w-full h-0.5 bg-amber-200/90 shadow-xs" />
                  <div
                    className={`w-6 h-6 rounded-full border-2 border-amber-100 flex items-center justify-center shadow-md -ml-1 ${
                      gameState.stars >= 1 ? 'bg-amber-600 scale-110' : 'bg-stone-800'
                    }`}
                  >
                    <Star className="w-3.5 h-3.5 fill-amber-200 text-amber-200" />
                  </div>
                </div>

                {/* 2nd Star Marker (Meadow Emerald Star) */}
                <div
                  style={{ bottom: `${star2Pct}%` }}
                  className="hidden md:flex absolute -left-2 -right-4 items-center justify-end pointer-events-none z-30"
                >
                  <div className="w-full h-0.5 bg-amber-200/90 shadow-xs" />
                  <div
                    className={`w-6 h-6 rounded-full border-2 border-amber-100 flex items-center justify-center shadow-md -ml-1 ${
                      gameState.stars >= 2 ? 'bg-emerald-600 scale-110' : 'bg-stone-800'
                    }`}
                  >
                    <Star className="w-3.5 h-3.5 fill-amber-200 text-amber-200" />
                  </div>
                </div>

                {/* 3rd Star Marker (Grand Golden Silo Star) */}
                <div
                  style={{ bottom: `${star3Pct}%` }}
                  className="hidden md:flex absolute -left-2 -right-4 items-center justify-end pointer-events-none z-30"
                >
                  <div className="w-full h-0.5 bg-amber-200/90 shadow-xs" />
                  <div
                    className={`w-7 h-7 rounded-full border-2 border-amber-100 flex items-center justify-center shadow-md -ml-1 ${
                      gameState.stars >= 3 ? 'bg-yellow-500 scale-115' : 'bg-stone-800'
                    }`}
                  >
                    <Star className="w-4 h-4 fill-yellow-100 text-yellow-100" />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Stone & Concrete Silo Foundation Base with Unloading Chute */}
            <div className="w-[105%] bg-gradient-to-b from-stone-500 via-stone-600 to-stone-800 border-[3px] border-stone-900 rounded-b-2xl px-2 py-1.5 text-center shadow-lg">
              <div className="bg-amber-950/90 border border-amber-400/70 rounded-lg px-1.5 py-0.5">
                <span className="text-[10px] font-black text-amber-200 whitespace-nowrap">
                  🌾 {gameState.score} / {gameState.goal.targetScore}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Farm Booster Recipe Legend */}
        <div className="relative z-10 mt-3 grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          <div className="flex items-center gap-1.5 bg-amber-950/85 backdrop-blur-xs border border-amber-400/50 rounded-xl px-2.5 py-1.5 text-amber-50 shadow-sm">
            <span className="text-base">🧨</span>
            <div className="leading-tight">
              <div className="text-[10px] font-black text-yellow-300">2×2 Square</div>
              <div className="text-[9px] text-amber-200">TNT Dynamite Box</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-amber-950/85 backdrop-blur-xs border border-amber-400/50 rounded-xl px-2.5 py-1.5 text-amber-50 shadow-sm">
            <span className="text-base">⚡</span>
            <div className="leading-tight">
              <div className="text-[10px] font-black text-yellow-300">4 in a Line</div>
              <div className="text-[9px] text-amber-200">Striped Rocket Box</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-amber-950/85 backdrop-blur-xs border border-amber-400/50 rounded-xl px-2.5 py-1.5 text-amber-50 shadow-sm">
            <span className="text-base">💣</span>
            <div className="leading-tight">
              <div className="text-[10px] font-black text-yellow-300">L / T Shape</div>
              <div className="text-[9px] text-amber-200">3×3 Bomb Box</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-amber-950/85 backdrop-blur-xs border border-amber-400/50 rounded-xl px-2.5 py-1.5 text-amber-50 shadow-sm">
            <span className="text-base">🔒</span>
            <div className="leading-tight">
              <div className="text-[10px] font-black text-yellow-300">Locked Cages</div>
              <div className="text-[9px] text-amber-200">Match to Break Lock!</div>
            </div>
          </div>
        </div>
      </div>

      {/* How to Play Help Modal (Warm Farm Timber Theme) */}
      {isHelpOpen && (
        <div className="fixed inset-0 bg-amber-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-amber-950 border-2 border-amber-400/70 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-amber-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🐮</span>
                <h3 className="text-lg font-black text-amber-200">How to Play Farm Animal Crush</h3>
              </div>
              <button
                onClick={() => setIsHelpOpen(false)}
                className="p-1.5 rounded-lg bg-amber-900 hover:bg-amber-800 text-amber-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-amber-100 leading-relaxed">
              <div className="flex items-start gap-2.5">
                <span className="text-base">🔒</span>
                <p>
                  <strong>Locked X-Cages & Hay Coils:</strong> Locked animals cannot be moved directly, but matching with them (or matching next to them) shatters the iron cage!
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-base">🌾</span>
                <p>
                  <strong>Farm Hay Silo (Right Tower):</strong> Every popped animal sends Golden Hay into the red Farm Silo on the right to unlock 1, 2, and 3 Stars!
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-base">🧨</span>
                <p>
                  <strong>Booster Boxes:</strong> Match a <strong>2×2 Square</strong> for a TNT Dynamite Box, <strong>4-in-line</strong> for a Striped Rocket, <strong>L/T shape</strong> for a 3×3 Bomb, or <strong>5-in-line</strong> for a Golden Barn Star!
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-base">🔨</span>
                <p>
                  <strong>Top-Left Boosters:</strong> Use the green <strong>Barn Hammer</strong> button to smash any stubborn lock or tile without spending a move!
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsHelpOpen(false)}
              className="mt-6 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-colors cursor-pointer shadow-md border border-lime-300"
            >
              Got It, Let's Harvest! 🌾
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

