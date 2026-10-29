import {
  ActivePowerUps,
  CartUpgrades,
  EggCartGameState,
  PowerUpType,
} from './types';
import { createInitialCart, stepCartPhysics } from './physics';
import { generateItemsForSegment } from './terrain';

export const STORAGE_PREFIX = 'pawcade_egg_cart_';

export const UPGRADE_INFO: Record<
  keyof CartUpgrades,
  { name: string; icon: string; desc: string; baseCost: number }
> = {
  suspension: {
    name: 'Air Springs',
    icon: '🌀',
    desc: 'Smoother dampers soften bumps over rugged hills.',
    baseCost: 20,
  },
  eggCupCushion: {
    name: 'Hay Cushion',
    icon: '🌾',
    desc: 'Soft golden straw absorbs vertical kinetic shocks.',
    baseCost: 25,
  },
  tireTraction: {
    name: 'Grip Tires',
    icon: '🚜',
    desc: 'Heavy knobby rubber for fast hill climb acceleration.',
    baseCost: 30,
  },
  cupDepth: {
    name: 'Deep Basket',
    icon: '🧺',
    desc: 'Higher rim walls prevent egg from bouncing out.',
    baseCost: 40,
  },
};

export function getUpgradeCost(key: keyof CartUpgrades, currentLevel: number): number {
  if (currentLevel >= 5) return Infinity;
  const base = UPGRADE_INFO[key].baseCost;
  return Math.floor(base * Math.pow(1.6, currentLevel));
}

export function getDefaultUpgrades(): CartUpgrades {
  return {
    suspension: 0,
    eggCupCushion: 0,
    tireTraction: 0,
    cupDepth: 0,
  };
}

export function loadSavedUpgrades(): CartUpgrades {
  if (typeof window === 'undefined') return getDefaultUpgrades();
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}upgrades`);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        suspension: Math.min(5, Math.max(0, Number(parsed.suspension) || 0)),
        eggCupCushion: Math.min(5, Math.max(0, Number(parsed.eggCupCushion) || 0)),
        tireTraction: Math.min(5, Math.max(0, Number(parsed.tireTraction) || 0)),
        cupDepth: Math.min(5, Math.max(0, Number(parsed.cupDepth) || 0)),
      };
    }
  } catch {
    // fallback
  }
  return getDefaultUpgrades();
}

export function saveUpgrades(upgrades: CartUpgrades): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}upgrades`, JSON.stringify(upgrades));
  } catch {
    // fallback
  }
}

export function loadSavedCoins(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}coins`);
    return raw ? Math.max(0, parseInt(raw, 10) || 0) : 0;
  } catch {
    return 0;
  }
}

export function saveCoins(coins: number): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}coins`, coins.toString());
  } catch {
    // fallback
  }
}

export function loadHighScoreDistance(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}high_score`);
    return raw ? Math.max(0, parseInt(raw, 10) || 0) : 0;
  } catch {
    return 0;
  }
}

export function saveHighScoreDistance(best: number): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}high_score`, best.toString());
  } catch {
    // fallback
  }
}

export function initializeEggCartGame(
  savedCoins?: number,
  savedUpgrades?: CartUpgrades,
  savedBest?: number
): EggCartGameState {
  const coins = savedCoins !== undefined ? savedCoins : loadSavedCoins();
  const upgrades = savedUpgrades !== undefined ? savedUpgrades : loadSavedUpgrades();
  const highScoreDistance = savedBest !== undefined ? savedBest : loadHighScoreDistance();

  const cart = createInitialCart(60);
  const { coins: coinsPickups, powerUps: powerUpPickups } = generateItemsForSegment(100, 1600);

  const activePowerUps: ActivePowerUps = {
    shieldTimer: 0,
    magnetTimer: 0,
    turboTimer: 0,
  };

  return {
    cart,
    distanceMeters: 0,
    highScoreDistance,
    coins,
    coinsThisRun: 0,
    gameOver: false,
    gameOverReason: null,
    upgrades,
    activePowerUps,
    gasPressed: false,
    brakePressed: false,
    elapsedTime: 0,
    coinsPickups,
    powerUpPickups,
  };
}

export interface TickEvents {
  coinCollected?: boolean;
  powerUpCollected?: PowerUpType;
  eggCracked?: boolean;
  newHighScore?: boolean;
}

export function tickEggCartGame(
  state: EggCartGameState,
  dt: number
): { state: EggCartGameState; events: TickEvents } {
  if (state.gameOver) {
    return { state, events: {} };
  }

  const events: TickEvents = {};
  const safeDt = Math.min(dt, 0.05);

  // 1. Tick Powerup Timers
  const shieldTimer = Math.max(0, state.activePowerUps.shieldTimer - safeDt);
  const magnetTimer = Math.max(0, state.activePowerUps.magnetTimer - safeDt);
  const turboTimer = Math.max(0, state.activePowerUps.turboTimer - safeDt);

  const nextPowerUps: ActivePowerUps = {
    shieldTimer,
    magnetTimer,
    turboTimer,
  };

  // 2. Physics Step
  const { cart, cracked, reason } = stepCartPhysics(
    state.cart,
    state.gasPressed,
    state.brakePressed,
    state.upgrades,
    nextPowerUps,
    safeDt
  );

  let isGameOver = false;
  let gameOverReason = state.gameOverReason;

  if (cracked) {
    isGameOver = true;
    gameOverReason = reason;
    events.eggCracked = true;
  }

  // 3. Distance Calculation (10px = 1 meter)
  const currentDist = Math.max(0, Math.floor((cart.x - 60) / 10));
  const newDistance = Math.max(state.distanceMeters, currentDist);

  let newHighScore = state.highScoreDistance;
  if (newDistance > newHighScore) {
    newHighScore = newDistance;
    saveHighScoreDistance(newHighScore);
    events.newHighScore = true;
  }

  // 4. Ensure Terrain Item Generation Ahead of Cart
  let coinsPickups = state.coinsPickups;
  let powerUpPickups = state.powerUpPickups;

  const maxItemX = coinsPickups.length > 0 ? coinsPickups[coinsPickups.length - 1].x : 0;
  if (cart.x + 1200 > maxItemX) {
    const more = generateItemsForSegment(maxItemX + 10, maxItemX + 1600);
    coinsPickups = [...coinsPickups, ...more.coins];
    powerUpPickups = [...powerUpPickups, ...more.powerUps];
  }

  // Cull old items behind cart by 400px
  coinsPickups = coinsPickups.filter((c) => c.x > cart.x - 400);
  powerUpPickups = powerUpPickups.filter((p) => p.x > cart.x - 400);

  // 5. Coin Pickups & Magnet Effect
  let addedCoins = 0;
  const magnetActive = magnetTimer > 0;
  const magnetRadius = 180;
  const cartCenterX = cart.x;
  const cartCenterY = cart.y;

  coinsPickups = coinsPickups.map((c) => {
    if (c.collected) return c;

    let cx = c.x;
    let cy = c.y;

    if (magnetActive) {
      const dist = Math.hypot(cx - cartCenterX, cy - cartCenterY);
      if (dist < magnetRadius) {
        const pull = 380 * safeDt;
        const angle = Math.atan2(cartCenterY - cy, cartCenterX - cx);
        cx += Math.cos(angle) * pull;
        cy += Math.sin(angle) * pull;
      }
    }

    const pickupDist = Math.hypot(cx - cartCenterX, cy - cartCenterY);
    if (pickupDist < 36) {
      addedCoins += c.value;
      events.coinCollected = true;
      return { ...c, x: cx, y: cy, collected: true };
    }

    return cx !== c.x || cy !== c.y ? { ...c, x: cx, y: cy } : c;
  });

  // 6. Power-up Pickups
  powerUpPickups = powerUpPickups.map((p) => {
    if (p.collected) return p;
    const dist = Math.hypot(p.x - cartCenterX, p.y - cartCenterY);
    if (dist < 40) {
      events.powerUpCollected = p.type;
      if (p.type === 'shield') nextPowerUps.shieldTimer = 10;
      if (p.type === 'magnet') nextPowerUps.magnetTimer = 12;
      if (p.type === 'turbo') nextPowerUps.turboTimer = 6;
      return { ...p, collected: true };
    }
    return p;
  });

  const nextCoins = state.coins + addedCoins;
  const nextCoinsThisRun = state.coinsThisRun + addedCoins;

  if (addedCoins > 0) {
    saveCoins(nextCoins);
  }

  return {
    state: {
      ...state,
      cart,
      distanceMeters: newDistance,
      highScoreDistance: newHighScore,
      coins: nextCoins,
      coinsThisRun: nextCoinsThisRun,
      gameOver: isGameOver,
      gameOverReason,
      activePowerUps: nextPowerUps,
      elapsedTime: state.elapsedTime + safeDt,
      coinsPickups,
      powerUpPickups,
    },
    events,
  };
}

export function purchaseCartUpgrade(
  state: EggCartGameState,
  upgradeKey: keyof CartUpgrades
): EggCartGameState {
  const currentLevel = state.upgrades[upgradeKey];
  if (currentLevel >= 5) return state;

  const cost = getUpgradeCost(upgradeKey, currentLevel);
  if (state.coins < cost) return state;

  const newCoins = state.coins - cost;
  const newUpgrades: CartUpgrades = {
    ...state.upgrades,
    [upgradeKey]: currentLevel + 1,
  };

  saveCoins(newCoins);
  saveUpgrades(newUpgrades);

  return {
    ...state,
    coins: newCoins,
    upgrades: newUpgrades,
  };
}
