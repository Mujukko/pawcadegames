import {
  PusherState,
  PusherEvent,
  CoinItem,
  CoinType,
  PusherRake,
  PowerUps,
  PusherSpecialProgress,
} from './types';

export const TABLE_LEFT_WALL = 48;
export const TABLE_RIGHT_WALL = 372;
export const FRONT_LEDGE_Y = 380;
export const PUSHER_MIN_Y = 95;
export const PUSHER_MAX_Y = 165;
export const NORMAL_COIN_RADIUS = 14;
export const MEGA_COIN_RADIUS = 24;

export function createInitialCoins(): CoinItem[] {
  const coins: CoinItem[] = [];
  let idCount = 0;

  // Pre-seed table with layers of coins to start with an exciting full board!
  // Top Pusher Bed (y: 110 to 150)
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 8; c++) {
      const x = TABLE_LEFT_WALL + 26 + c * 38 + (r % 2 === 1 ? 18 : 0);
      const y = 110 + r * 22;
      coins.push({
        id: `coin-init-${idCount++}`,
        x,
        y,
        radius: NORMAL_COIN_RADIUS,
        vx: 0,
        vy: 0,
        type: 'gold_corn',
        value: 1,
      });
    }
  }

  // Lower Main Bed (y: 200 to 365)
  for (let r = 0; r < 7; r++) {
    const cols = r % 2 === 0 ? 8 : 7;
    for (let c = 0; c < cols; c++) {
      const x = TABLE_LEFT_WALL + 24 + c * 40 + (r % 2 === 1 ? 20 : 0);
      const y = 200 + r * 25;

      let type: CoinType = 'gold_corn';
      let value = 1;

      // Sprinkle in clovers and prize eggs
      if ((r + c) % 5 === 0) {
        type = 'clover_silver';
        value = 2;
      } else if (r === 4 && c === 3) {
        type = 'prize_egg';
        value = 5;
      } else if (r === 6 && c === 4) {
        type = 'milk_bottle';
        value = 8;
      }

      coins.push({
        id: `coin-init-${idCount++}`,
        x,
        y,
        radius: NORMAL_COIN_RADIUS,
        vx: 0,
        vy: 0,
        type,
        value,
      });
    }
  }

  return coins;
}

export function createInitialState(savedHighScore: number = 0): PusherState {
  return {
    status: 'playing',
    coinsInWallet: 45,
    score: 0,
    highScore: savedHighScore,
    coinsOnTable: createInitialCoins(),
    pusher: {
      y: PUSHER_MIN_Y,
      speed: 36,
      minY: PUSHER_MIN_Y,
      maxY: PUSHER_MAX_Y,
      dir: 1,
    },
    powerUps: {
      quakeTimer: 0,
      coinWallsTimer: 0,
    },
    progress: {
      quakeProgress: 35,
      wallProgress: 40,
    },
    totalPushedFront: 0,
    totalLostSide: 0,
  };
}

export function dropCoin(
  state: PusherState,
  targetX: number,
  coinType: CoinType = 'gold_corn'
): { state: PusherState; event?: PusherEvent } {
  if (state.coinsInWallet <= 0 && state.status !== 'playing') {
    return { state };
  }

  const clampedX = Math.max(TABLE_LEFT_WALL + 26, Math.min(TABLE_RIGHT_WALL - 26, targetX));
  const isMega = coinType === 'giant_mega';
  const radius = isMega ? MEGA_COIN_RADIUS : NORMAL_COIN_RADIUS;

  let value = 1;
  switch (coinType) {
    case 'gold_corn':
      value = 1;
      break;
    case 'clover_silver':
      value = 2;
      break;
    case 'giant_mega':
      value = 10;
      break;
    case 'prize_egg':
      value = 5;
      break;
    case 'milk_bottle':
      value = 8;
      break;
  }

  const newCoin: CoinItem = {
    id: `coin-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    x: clampedX + (Math.random() - 0.5) * 6,
    y: 65,
    radius,
    vx: (Math.random() - 0.5) * 15,
    vy: 140, // Drops down chute
    type: coinType,
    value,
  };

  const nextWallet = Math.max(0, state.coinsInWallet - 1);
  const nextCoins = [newCoin, ...state.coinsOnTable];

  return {
    state: {
      ...state,
      coinsInWallet: nextWallet,
      coinsOnTable: nextCoins,
    },
    event: { type: 'coin_dropped', x: clampedX, coinType },
  };
}

export function activateQuake(state: PusherState): { state: PusherState; event?: PusherEvent } {
  if (state.progress.quakeProgress < 100) return { state };

  return {
    state: {
      ...state,
      powerUps: {
        ...state.powerUps,
        quakeTimer: 6.5,
      },
      progress: {
        ...state.progress,
        quakeProgress: 0,
      },
    },
    event: { type: 'powerup_activated', powerUp: 'quake' },
  };
}

export function activateWalls(state: PusherState): { state: PusherState; event?: PusherEvent } {
  if (state.progress.wallProgress < 100) return { state };

  return {
    state: {
      ...state,
      powerUps: {
        ...state.powerUps,
        coinWallsTimer: 10.0,
      },
      progress: {
        ...state.progress,
        wallProgress: 0,
      },
    },
    event: { type: 'powerup_activated', powerUp: 'walls' },
  };
}

export function refillCoins(state: PusherState, amount: number = 30): PusherState {
  return {
    ...state,
    status: 'playing',
    coinsInWallet: state.coinsInWallet + amount,
  };
}

export function updateEngine(
  state: PusherState,
  dt: number
): { state: PusherState; events: PusherEvent[] } {
  const events: PusherEvent[] = [];
  const safeDt = Math.min(0.05, Math.max(0.001, dt));

  // Update Power-Up timers
  let nextQuakeTimer = Math.max(0, state.powerUps.quakeTimer - safeDt);
  let nextWallsTimer = Math.max(0, state.powerUps.coinWallsTimer - safeDt);

  // Pusher Motion
  const isQuaking = nextQuakeTimer > 0;
  const speedMult = isQuaking ? 1.8 : 1.0;
  const pusherSpeed = state.pusher.speed * speedMult;

  let nextPusherY = state.pusher.y + state.pusher.dir * pusherSpeed * safeDt;
  let nextPusherDir = state.pusher.dir;

  if (nextPusherY >= state.pusher.maxY) {
    nextPusherY = state.pusher.maxY;
    nextPusherDir = -1;
  } else if (nextPusherY <= state.pusher.minY) {
    nextPusherY = state.pusher.minY;
    nextPusherDir = 1;
  }

  const pusherMovingDown = nextPusherDir === 1;

  // Update Coins
  let nextCoins: CoinItem[] = [];
  let addedScore = 0;
  let addedWallet = 0;
  let pushedFrontCount = 0;
  let lostSideCount = 0;

  let nextQuakeProgress = state.progress.quakeProgress;
  let nextWallProgress = state.progress.wallProgress;

  for (let i = 0; i < state.coinsOnTable.length; i++) {
    const coin = { ...state.coinsOnTable[i] };

    // Apply friction and subtle downward tilt
    coin.vx *= Math.pow(0.85, safeDt * 60);
    coin.vy *= Math.pow(0.85, safeDt * 60);

    // Natural slight table slope forward
    coin.vy += 8.5 * safeDt;

    // Quake vibration
    if (isQuaking) {
      coin.vx += (Math.random() - 0.5) * 35 * safeDt;
      coin.vy += Math.random() * 25 * safeDt;
    }

    // Move
    coin.x += coin.vx * safeDt;
    coin.y += coin.vy * safeDt;

    // Pusher Interaction
    // Upper bed pusher edge pushes coins down when moving down
    if (coin.y < nextPusherY && coin.y > 60) {
      if (pusherMovingDown) {
        coin.y = nextPusherY;
        coin.vy = Math.max(coin.vy, pusherSpeed * 1.3);
      }
    }

    // Lower bed shelf drop: coins that step off upper bed step (y ~ 175) cascade down
    if (coin.y > 165 && coin.y < 185) {
      coin.vy += 45 * safeDt;
    }

    // Side Walls & Gutters
    const hasWalls = nextWallsTimer > 0;
    if (hasWalls) {
      // Barrier Bounce
      if (coin.x - coin.radius < TABLE_LEFT_WALL) {
        coin.x = TABLE_LEFT_WALL + coin.radius;
        coin.vx = Math.abs(coin.vx) * 0.5;
      } else if (coin.x + coin.radius > TABLE_RIGHT_WALL) {
        coin.x = TABLE_RIGHT_WALL - coin.radius;
        coin.vx = -Math.abs(coin.vx) * 0.5;
      }
    } else {
      // Side Gutters
      if (coin.x < TABLE_LEFT_WALL - 5 || coin.x > TABLE_RIGHT_WALL + 5) {
        // Lost into side gutter!
        lostSideCount++;
        events.push({ type: 'coin_lost_side', coinType: coin.type });
        continue;
      }
    }

    // Front Ledge Detection
    if (coin.y >= FRONT_LEDGE_Y) {
      // Pushed over front! Success!
      pushedFrontCount++;
      const returnCoins = coin.value;
      addedWallet += returnCoins;
      addedScore += coin.value * 25;

      nextQuakeProgress = Math.min(100, nextQuakeProgress + 3.5);
      nextWallProgress = Math.min(100, nextWallProgress + 4.5);

      events.push({
        type: 'coin_pushed_front',
        coinType: coin.type,
        value: coin.value,
      });

      continue;
    }

    nextCoins.push(coin);
  }

  // Circle-circle coin collision relaxation (2 sub-steps for smooth non-overlapping pack)
  for (let step = 0; step < 2; step++) {
    for (let i = 0; i < nextCoins.length; i++) {
      for (let j = i + 1; j < nextCoins.length; j++) {
        const c1 = nextCoins[i];
        const c2 = nextCoins[j];

        const dx = c2.x - c1.x;
        const dy = c2.y - c1.y;
        const dist = Math.hypot(dx, dy);
        const minDist = c1.radius + c2.radius;

        if (dist < minDist && dist > 0.001) {
          const overlap = (minDist - dist) * 0.5;
          const nx = dx / dist;
          const ny = dy / dist;

          // Push apart
          c1.x -= nx * overlap;
          c1.y -= ny * overlap;
          c2.x += nx * overlap;
          c2.y += ny * overlap;

          // Transfer momentum forward
          if (c1.y < c2.y) {
            c2.vy += Math.abs(c1.vy) * 0.3;
          } else {
            c1.vy += Math.abs(c2.vy) * 0.3;
          }
        }
      }
    }
  }

  const newScore = state.score + addedScore;
  const newHighScore = Math.max(state.highScore, newScore);
  const newWallet = state.coinsInWallet + addedWallet;

  // Check Game Over (Wallet empty and no coins are falling/moving)
  let nextStatus = state.status;
  if (newWallet === 0 && nextCoins.length > 0) {
    const isAnyMoving = nextCoins.some((c) => Math.hypot(c.vx, c.vy) > 12);
    if (!isAnyMoving) {
      nextStatus = 'game_over';
    }
  }

  return {
    state: {
      ...state,
      status: nextStatus,
      coinsInWallet: newWallet,
      score: newScore,
      highScore: newHighScore,
      coinsOnTable: nextCoins,
      pusher: {
        ...state.pusher,
        y: nextPusherY,
        dir: nextPusherDir,
      },
      powerUps: {
        quakeTimer: nextQuakeTimer,
        coinWallsTimer: nextWallsTimer,
      },
      progress: {
        quakeProgress: nextQuakeProgress,
        wallProgress: nextWallProgress,
      },
      totalPushedFront: state.totalPushedFront + pushedFrontCount,
      totalLostSide: state.totalLostSide + lostSideCount,
    },
    events,
  };
}
