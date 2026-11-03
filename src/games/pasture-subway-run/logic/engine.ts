import {
  SubwayGameState,
  PlayerRunner,
  SubwayObstacle,
  SubwayCoin,
  SubwayPowerUp,
  TrackLane,
  ObstacleType,
} from './types';

export const BASE_SPEED = 320;
export const MAX_SPEED = 640;
export const LANE_WIDTH = 95;
export const JUMP_VELOCITY = 460;
export const SNEAKER_JUMP_VELOCITY = 620;
export const GRAVITY = 1250;
export const ROLL_DURATION = 0.65;
export const POWERUP_DURATION = 8.0;

export function createSubwayGame(highScore = 0): SubwayGameState {
  const player: PlayerRunner = {
    lane: 0,
    targetLane: 0,
    laneX: 0,
    y: 0,
    vy: 0,
    isJumping: false,
    isRolling: false,
    rollTimer: 0,
    activePowerUp: null,
    powerUpTimeRemaining: 0,
  };

  return {
    status: 'ready',
    speed: BASE_SPEED,
    distance: 0,
    coins: 0,
    score: 0,
    highScore,
    multiplier: 1,
    player,
    obstacles: spawnInitialObstacles(),
    coinsList: spawnInitialCoins(),
    powerUps: [],
    events: [],
  };
}

function spawnInitialObstacles(): SubwayObstacle[] {
  const obs: SubwayObstacle[] = [];
  let z = 450;
  for (let i = 0; i < 6; i++) {
    const lane: TrackLane = (Math.floor(Math.random() * 3) - 1) as TrackLane;
    const type: ObstacleType = i % 4 === 0 ? 'fence' : i % 4 === 1 ? 'tractor' : i % 4 === 2 ? 'low_beam' : 'hay_bale';
    obs.push({
      id: `obs_${i}_${Date.now()}`,
      lane,
      z,
      type,
      width: 70,
      height: type === 'tractor' ? 80 : 40,
      canJumpOver: type === 'fence' || type === 'hay_bale',
      canRollUnder: type === 'low_beam',
    });
    z += 280 + Math.random() * 80;
  }
  return obs;
}

function spawnInitialCoins(): SubwayCoin[] {
  const coins: SubwayCoin[] = [];
  let z = 300;
  for (let i = 0; i < 12; i++) {
    const lane: TrackLane = (Math.floor(Math.random() * 3) - 1) as TrackLane;
    coins.push({
      id: `coin_${i}`,
      lane,
      z,
      y: 0,
      collected: false,
    });
    z += 60;
  }
  return coins;
}

export function changeLane(state: SubwayGameState, dir: 'left' | 'right'): SubwayGameState {
  if (state.status !== 'playing' && state.status !== 'ready') return state;

  const current = state.player.targetLane;
  let nextLane: TrackLane = current;
  if (dir === 'left' && current > -1) nextLane = (current - 1) as TrackLane;
  else if (dir === 'right' && current < 1) nextLane = (current + 1) as TrackLane;

  if (nextLane === current) return state;

  return {
    ...state,
    status: 'playing',
    player: {
      ...state.player,
      targetLane: nextLane,
    },
  };
}

export function jumpPlayer(state: SubwayGameState): SubwayGameState {
  if (state.status !== 'playing' && state.status !== 'ready') return state;
  if (state.player.isJumping) return state;

  const jumpPower = state.player.activePowerUp === 'sneakers' ? SNEAKER_JUMP_VELOCITY : JUMP_VELOCITY;

  return {
    ...state,
    status: 'playing',
    player: {
      ...state.player,
      isJumping: true,
      isRolling: false,
      rollTimer: 0,
      vy: jumpPower,
    },
    events: [{ type: 'jump' }],
  };
}

export function rollPlayer(state: SubwayGameState): SubwayGameState {
  if (state.status !== 'playing' && state.status !== 'ready') return state;

  const player = { ...state.player };
  if (player.isJumping) {
    // Fast fall onto ground!
    player.vy = -750;
  }
  player.isRolling = true;
  player.rollTimer = ROLL_DURATION;

  return {
    ...state,
    status: 'playing',
    player,
    events: [{ type: 'roll' }],
  };
}

export function updateSubwayGame(state: SubwayGameState, rawDt: number): SubwayGameState {
  if (state.status !== 'playing') return state;

  const dt = Math.min(rawDt, 0.05);
  const events: SubwayGameState['events'] = [];
  let status: SubwayGameState['status'] = state.status;
  let coins = state.coins;
  let score = state.score;
  let highScore = state.highScore;

  // Accelerate slightly over distance
  const speed = Math.min(MAX_SPEED, state.speed + dt * 4.5);
  const distance = state.distance + speed * dt;
  score = Math.floor(distance * 0.1) * state.multiplier + coins * 10;

  const player = { ...state.player };

  // Smooth lane interpolation
  const targetX = player.targetLane * LANE_WIDTH;
  player.laneX += (targetX - player.laneX) * Math.min(1, dt * 16);
  if (Math.abs(targetX - player.laneX) < 2) {
    player.lane = player.targetLane;
    player.laneX = targetX;
  }

  // Jump physics
  if (player.isJumping || player.y > 0) {
    player.vy -= GRAVITY * dt;
    player.y += player.vy * dt;
    if (player.y <= 0) {
      player.y = 0;
      player.vy = 0;
      player.isJumping = false;
    }
  }

  // Roll timer
  if (player.isRolling) {
    player.rollTimer -= dt;
    if (player.rollTimer <= 0) {
      player.isRolling = false;
      player.rollTimer = 0;
    }
  }

  // Power-up timer
  if (player.activePowerUp) {
    player.powerUpTimeRemaining -= dt;
    if (player.powerUpTimeRemaining <= 0) {
      player.activePowerUp = null;
      player.powerUpTimeRemaining = 0;
    }
  }

  // Move and check obstacles
  let obstacles = state.obstacles.map((o) => ({ ...o, z: o.z - speed * dt }));

  for (const obs of obstacles) {
    // Collision box: z within -10 to +25
    if (obs.z >= -10 && obs.z <= 25) {
      // Must be in same track lane
      const inLane = Math.abs(player.laneX - obs.lane * LANE_WIDTH) < 45;
      if (inLane) {
        let avoids = false;
        if (obs.canJumpOver && player.y > 35) avoids = true;
        if (obs.canRollUnder && player.isRolling) avoids = true;

        if (!avoids) {
          status = 'crashed';
          events.push({ type: 'crash' });
          break;
        }
      }
    }
  }

  // Filter passed obstacles and spawn new ahead
  obstacles = obstacles.filter((o) => o.z > -50);
  const maxObsZ = obstacles.reduce((max, o) => Math.max(max, o.z), 0);
  if (maxObsZ < 850) {
    const lane: TrackLane = (Math.floor(Math.random() * 3) - 1) as TrackLane;
    const rand = Math.random();
    const type: ObstacleType = rand < 0.3 ? 'fence' : rand < 0.55 ? 'tractor' : rand < 0.8 ? 'low_beam' : 'hay_bale';
    obstacles.push({
      id: `obs_${Date.now()}_${Math.random()}`,
      lane,
      z: maxObsZ + 250 + Math.random() * 90,
      type,
      width: 70,
      height: type === 'tractor' ? 80 : 40,
      canJumpOver: type === 'fence' || type === 'hay_bale',
      canRollUnder: type === 'low_beam',
    });
  }

  // Move and collect coins
  let coinsList = state.coinsList.map((c) => ({ ...c, z: c.z - speed * dt }));
  const hasMagnet = player.activePowerUp === 'magnet';

  for (const coin of coinsList) {
    if (coin.collected) continue;

    const inRangeZ = coin.z >= -20 && coin.z <= 30;
    const sameLane = Math.abs(player.laneX - coin.lane * LANE_WIDTH) < 35;
    const sameHeight = Math.abs(player.y - coin.y) < 50;

    // Magnet drag
    if (hasMagnet && coin.z > -20 && coin.z < 260) {
      coin.lane = player.lane;
    }

    if (inRangeZ && (sameLane || hasMagnet) && sameHeight) {
      coin.collected = true;
      coins += 1;
      events.push({ type: 'coin' });
    }
  }

  // Filter passed coins and spawn new
  coinsList = coinsList.filter((c) => c.z > -40);
  const maxCoinZ = coinsList.reduce((max, c) => Math.max(max, c.z), 0);
  if (maxCoinZ < 700) {
    const lane: TrackLane = (Math.floor(Math.random() * 3) - 1) as TrackLane;
    for (let i = 0; i < 4; i++) {
      coinsList.push({
        id: `coin_${Date.now()}_${i}`,
        lane,
        z: maxCoinZ + 90 + i * 40,
        y: 0,
        collected: false,
      });
    }
  }

  // PowerUps check and spawn
  let powerUps = state.powerUps.map((p) => ({ ...p, z: p.z - speed * dt }));
  for (const pu of powerUps) {
    if (!pu.collected && pu.z >= -20 && pu.z <= 30 && Math.abs(player.laneX - pu.lane * LANE_WIDTH) < 40) {
      pu.collected = true;
      player.activePowerUp = pu.type;
      player.powerUpTimeRemaining = POWERUP_DURATION;
      events.push({ type: 'powerup' });
    }
  }
  powerUps = powerUps.filter((p) => p.z > -40 && !p.collected);
  if (powerUps.length === 0 && Math.random() < 0.008) {
    const pType: SubwayPowerUp['type'] = Math.random() < 0.5 ? 'magnet' : 'sneakers';
    powerUps.push({
      id: `pu_${Date.now()}`,
      lane: (Math.floor(Math.random() * 3) - 1) as TrackLane,
      z: 750,
      type: pType,
      collected: false,
    });
  }

  if (score > highScore) {
    highScore = score;
  }

  return {
    ...state,
    status,
    speed,
    distance,
    coins,
    score,
    highScore,
    player,
    obstacles,
    coinsList,
    powerUps,
    events,
  };
}
