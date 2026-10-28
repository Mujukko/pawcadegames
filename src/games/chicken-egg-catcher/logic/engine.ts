import {
  ChickenEggCatcherState,
  FallingEgg,
  EggType,
  EggCatcherEvent,
  ChickenPerch,
} from './types';

export const GAME_WIDTH = 400;
export const GAME_HEIGHT = 520;
export const BASKET_Y = 460;
export const BASKET_WIDTH = 76;
export const BASKET_HEIGHT = 26;
export const FLOOR_Y = 490;

export const PERCHES_CONFIG: Array<{ id: number; x: number; y: number }> = [
  { id: 1, x: 60, y: 70 },
  { id: 2, x: 150, y: 70 },
  { id: 3, x: 250, y: 70 },
  { id: 4, x: 340, y: 70 },
];

export function createInitialCatcherState(savedHighScore: number = 0): ChickenEggCatcherState {
  const perches: ChickenPerch[] = PERCHES_CONFIG.map((p) => ({
    id: p.id,
    x: p.x,
    y: p.y,
    eggCooldown: 1.0 + Math.random() * 1.5,
    isClucking: false,
  }));

  return {
    status: 'playing',
    score: 0,
    highScore: savedHighScore,
    lives: 3,
    maxLives: 3,
    basket: {
      x: GAME_WIDTH / 2,
      targetX: GAME_WIDTH / 2,
      y: BASKET_Y,
      width: BASKET_WIDTH,
      height: BASKET_HEIGHT,
      speed: 18,
    },
    perches,
    fallingEggs: [],
    splats: [],
    combo: 0,
    maxCombo: 0,
    feverTime: 0,
    timeElapsed: 0,
    eggsCaught: 0,
    eggsDropped: 0,
    wave: 1,
  };
}

export function setBasketTargetX(state: ChickenEggCatcherState, targetX: number): ChickenEggCatcherState {
  const halfWidth = state.basket.width / 2;
  const clampedX = Math.max(halfWidth, Math.min(GAME_WIDTH - halfWidth, targetX));
  return {
    ...state,
    basket: {
      ...state.basket,
      targetX: clampedX,
    },
  };
}

export function moveBasketDirection(state: ChickenEggCatcherState, dir: 'left' | 'right', delta = 45): ChickenEggCatcherState {
  const current = state.basket.targetX;
  const targetX = dir === 'left' ? current - delta : current + delta;
  return setBasketTargetX(state, targetX);
}

export function stepEggCatcherEngine(
  state: ChickenEggCatcherState,
  dt: number
): { state: ChickenEggCatcherState; events: EggCatcherEvent[] } {
  if (state.status !== 'playing') {
    return { state, events: [] };
  }

  const safeDt = Math.min(0.05, Math.max(0.001, dt));
  const events: EggCatcherEvent[] = [];

  let nextScore = state.score;
  let nextLives = state.lives;
  let nextCombo = state.combo;
  let nextMaxCombo = state.maxCombo;
  let nextFeverTime = Math.max(0, state.feverTime - safeDt);
  let nextEggsCaught = state.eggsCaught;
  let nextEggsDropped = state.eggsDropped;
  let nextWave = 1 + Math.floor(nextEggsCaught / 15);

  // 1. Update Basket X interpolation
  const basket = { ...state.basket };
  basket.x += (basket.targetX - basket.x) * Math.min(1, safeDt * basket.speed);

  // 2. Update Perches and Egg Spawning
  let eggIdCounter = Date.now();
  const nextPerches: ChickenPerch[] = state.perches.map((p) => {
    let cd = p.eggCooldown - safeDt;
    let clucking = cd <= 0.4 && cd > 0;
    return {
      ...p,
      eggCooldown: cd,
      isClucking: clucking,
    };
  });

  const nextFallingEggs: FallingEgg[] = [...state.fallingEggs];

  nextPerches.forEach((p, idx) => {
    if (p.eggCooldown <= 0) {
      // Spawn new egg from this perch
      const roll = Math.random();
      let type: EggType = 'regular';
      let points = 10;
      let radius = 10;

      if (roll < 0.62) {
        type = 'regular';
        points = 10;
        radius = 10;
      } else if (roll < 0.82) {
        type = 'speckled';
        points = 25;
        radius = 11;
      } else if (roll < 0.92) {
        type = 'golden';
        points = 100;
        radius = 12;
      } else {
        type = 'rotten';
        points = -50;
        radius = 11;
      }

      const eggVy = 130 + nextWave * 20;

      nextFallingEggs.push({
        id: `egg-${idx}-${eggIdCounter++}-${Math.random().toString(36).substr(2, 4)}`,
        x: p.x,
        y: p.y + 16,
        vy: eggVy,
        type,
        points,
        radius,
        wobble: Math.random() * Math.PI * 2,
      });

      // Reset cooldown (faster with higher wave)
      const baseCd = Math.max(1.1, 2.6 - nextWave * 0.18);
      p.eggCooldown = baseCd + Math.random() * 1.4;
    }
  });

  // 3. Update Falling Eggs Physics & Collisions
  const remainingEggs: FallingEgg[] = [];

  nextFallingEggs.forEach((egg) => {
    egg.y += egg.vy * safeDt;
    egg.wobble += safeDt * 6;

    // Check Basket Catch
    const basketLeft = basket.x - basket.width / 2;
    const basketRight = basket.x + basket.width / 2;
    const basketTop = basket.y - basket.height / 2;
    const basketBottom = basket.y + basket.height / 2;

    const inX = egg.x >= basketLeft - 4 && egg.x <= basketRight + 4;
    const inY = egg.y >= basketTop && egg.y <= basketBottom + 12;

    if (inX && inY) {
      // Egg caught in basket!
      if (egg.type === 'rotten') {
        // Rotten egg penalized!
        nextLives = Math.max(0, nextLives - 1);
        nextCombo = 0;
        events.push({
          type: 'egg_splat',
          eggType: 'rotten',
          livesRemaining: nextLives,
        });
      } else {
        // Good egg caught!
        nextCombo += 1;
        if (nextCombo > nextMaxCombo) nextMaxCombo = nextCombo;
        nextEggsCaught += 1;

        const isFever = nextFeverTime > 0;
        const multiplier = isFever ? 2 : 1;
        const comboBonus = Math.min(2.5, 1 + nextCombo * 0.08);
        const gainedPoints = Math.round(egg.points * multiplier * comboBonus);

        nextScore += gainedPoints;

        if (egg.type === 'golden') {
          nextFeverTime = 6.0; // 6 seconds golden frenzy
          events.push({ type: 'fever_start' });
        }

        events.push({
          type: 'egg_caught',
          eggType: egg.type,
          points: gainedPoints,
          combo: nextCombo,
        });
      }
      return; // egg consumed
    }

    // Check Floor Splat
    if (egg.y >= FLOOR_Y) {
      if (egg.type === 'rotten') {
        // Good dodge! Rotten egg safely broke on floor without penalty
      } else {
        // Normal egg broke on floor!
        nextLives = Math.max(0, nextLives - 1);
        nextCombo = 0;
        nextEggsDropped += 1;
        events.push({
          type: 'egg_splat',
          eggType: egg.type,
          livesRemaining: nextLives,
        });
      }
      return; // egg consumed
    }

    remainingEggs.push(egg);
  });

  // 4. Check Game Over
  let nextStatus: ChickenEggCatcherState['status'] = state.status;
  if (nextLives <= 0) {
    nextStatus = 'game_over';
    events.push({ type: 'game_over', finalScore: nextScore });
  }

  const nextHighScore = Math.max(state.highScore, nextScore);

  return {
    state: {
      ...state,
      status: nextStatus,
      score: nextScore,
      highScore: nextHighScore,
      lives: nextLives,
      combo: nextCombo,
      maxCombo: nextMaxCombo,
      feverTime: nextFeverTime,
      basket,
      perches: nextPerches,
      fallingEggs: remainingEggs,
      timeElapsed: state.timeElapsed + safeDt,
      eggsCaught: nextEggsCaught,
      eggsDropped: nextEggsDropped,
      wave: nextWave,
    },
    events,
  };
}
