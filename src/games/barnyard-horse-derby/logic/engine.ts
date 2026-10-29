import {
  DerbyTrackConfig,
  DerbyTrackId,
  DerbyGameState,
  HorseLane,
  PlayerHorse,
  RivalHorse,
  DerbyObstacle,
  DerbyCollectible,
  JumpGrade,
  DerbyEvent,
} from './types';

export const TRACK_CONFIGS: Record<DerbyTrackId, DerbyTrackConfig> = {
  'meadow-cup': {
    id: 'meadow-cup',
    name: 'Green Meadow Sprint',
    totalDistance: 600,
    targetTimeGold: 28,
    rivalCount: 2,
    obstacleInterval: 50,
    collectibleInterval: 35,
  },
  'autumn-steeplechase': {
    id: 'autumn-steeplechase',
    name: 'Autumn Pasture Steeplechase',
    totalDistance: 900,
    targetTimeGold: 40,
    rivalCount: 3,
    obstacleInterval: 42,
    collectibleInterval: 30,
  },
  'sunset-championship': {
    id: 'sunset-championship',
    name: 'Sunset Barnyard Derby',
    totalDistance: 1200,
    targetTimeGold: 52,
    rivalCount: 3,
    obstacleInterval: 36,
    collectibleInterval: 25,
  },
};

const RIVAL_PROFILES = [
  { name: 'Thunder Stallion', color: '#262626', maneColor: '#171717', speedOffset: 0.95 },
  { name: 'Daisy Palomino', color: '#eab308', maneColor: '#fef08a', speedOffset: 0.92 },
  { name: 'Copper Galloper', color: '#c2410c', maneColor: '#7c2d12', speedOffset: 0.90 },
];

export function createDerbyGame(trackId: DerbyTrackId = 'meadow-cup'): DerbyGameState {
  const track = TRACK_CONFIGS[trackId] || TRACK_CONFIGS['meadow-cup'];

  const player: PlayerHorse = {
    lane: 1,
    targetLane: 1,
    laneY: 1,
    distance: 0,
    speed: 0,
    maxSpeed: 22,
    acceleration: 9,
    stamina: 100,
    maxStamina: 100,
    isJumping: false,
    jumpY: 0,
    jumpVelocity: 0,
    lastJumpGrade: 'none',
    gradeTimer: 0,
    boostTimer: 0,
    stumbleTimer: 0,
  };

  const rivals: RivalHorse[] = [];
  for (let i = 0; i < track.rivalCount; i++) {
    const prof = RIVAL_PROFILES[i % RIVAL_PROFILES.length];
    const lane: HorseLane = (i % 3) as HorseLane;
    rivals.push({
      id: `rival-${i}`,
      name: prof.name,
      color: prof.color,
      maneColor: prof.maneColor,
      lane,
      distance: 0,
      speed: 0,
      targetSpeed: 20 * prof.speedOffset,
      jumpTimer: 0,
      isJumping: false,
      finished: false,
      finishTime: null,
    });
  }

  // Generate obstacles along track
  const obstacles: DerbyObstacle[] = [];
  let obsDist = 60;
  let obsId = 1;
  while (obsDist < track.totalDistance - 40) {
    const lane: HorseLane = (Math.floor(Math.random() * 3)) as HorseLane;
    const type = obsDist % 120 === 0 ? 'water' : obsDist % 80 === 0 ? 'hay_bale' : 'fence';
    obstacles.push({
      id: `obs-${obsId++}`,
      distance: obsDist,
      lane,
      type,
      width: type === 'water' ? 6 : 4,
      cleared: false,
      hit: false,
    });
    obsDist += track.obstacleInterval + Math.floor(Math.random() * 15);
  }

  // Generate collectibles
  const collectibles: DerbyCollectible[] = [];
  let colDist = 35;
  let colId = 1;
  while (colDist < track.totalDistance - 25) {
    const lane: HorseLane = (Math.floor(Math.random() * 3)) as HorseLane;
    const type = colDist % 150 === 0 ? 'golden_apple' : colDist % 60 === 0 ? 'carrot' : 'horseshoe';
    collectibles.push({
      id: `col-${colId++}`,
      distance: colDist,
      lane,
      type,
      collected: false,
    });
    colDist += track.collectibleInterval + Math.floor(Math.random() * 10);
  }

  return {
    track,
    status: 'countdown',
    countdownTimer: 3,
    elapsedTime: 0,
    player,
    rivals,
    obstacles,
    collectibles,
    score: 0,
    horseshoesCollected: 0,
    carrotsEaten: 0,
    finalRank: 1,
    trophy: 'none',
    events: [],
  };
}

export function triggerPlayerJump(state: DerbyGameState): DerbyGameState {
  if (state.status !== 'racing' || state.player.isJumping) return state;

  const player = { ...state.player };
  player.isJumping = true;
  player.jumpVelocity = 11; // upward initial impulse
  player.jumpY = 0.05;

  const events: DerbyEvent[] = [...state.events, { type: 'jump_start' }];

  // Evaluate jump grade against nearest upcoming obstacle in current lane
  let lastJumpGrade: JumpGrade = 'none';
  const upcomingObs = state.obstacles.find(
    (o) => o.lane === player.targetLane && !o.cleared && !o.hit && o.distance >= player.distance && o.distance - player.distance <= 20
  );

  let scoreBonus = 0;
  let staminaBonus = 0;
  let boostSeconds = 0;

  if (upcomingObs) {
    const diff = upcomingObs.distance - player.distance;
    if (diff <= 6 && diff >= 1.5) {
      lastJumpGrade = 'perfect';
      scoreBonus = 250;
      staminaBonus = 20;
      boostSeconds = 2.5;
    } else if (diff <= 10 && diff >= 0.5) {
      lastJumpGrade = 'great';
      scoreBonus = 120;
      staminaBonus = 12;
      boostSeconds = 1.5;
    } else if (diff <= 16) {
      lastJumpGrade = 'ok';
      scoreBonus = 50;
      staminaBonus = 5;
    }

    if (lastJumpGrade !== 'none') {
      events.push({ type: 'jump_grade', grade: lastJumpGrade });
      upcomingObs.cleared = true;
    }
  }

  player.lastJumpGrade = lastJumpGrade;
  player.gradeTimer = lastJumpGrade !== 'none' ? 1.2 : 0;
  player.stamina = Math.min(player.maxStamina, player.stamina + staminaBonus);
  if (boostSeconds > 0) {
    player.boostTimer = Math.max(player.boostTimer, boostSeconds);
    events.push({ type: 'boost_start' });
  }

  return {
    ...state,
    player,
    score: state.score + scoreBonus,
    events,
  };
}

export function switchPlayerLane(state: DerbyGameState, deltaLane: -1 | 1): DerbyGameState {
  if (state.status !== 'racing') return state;

  const player = { ...state.player };
  const nextLane = Math.max(0, Math.min(2, player.targetLane + deltaLane)) as HorseLane;
  if (nextLane === player.targetLane) return state;

  player.targetLane = nextLane;
  return { ...state, player };
}

export function updateDerbyGame(state: DerbyGameState, rawDt: number): DerbyGameState {
  let currentState = state;
  let remaining = Math.min(rawDt, 10); // cap max step at 10s

  while (remaining > 0) {
    const dt = Math.min(remaining, 0.05);
    currentState = stepDerbyGame(currentState, dt);
    remaining -= dt;
    if (currentState.status === 'finished') break;
  }

  return currentState;
}

function stepDerbyGame(state: DerbyGameState, dt: number): DerbyGameState {
  const events: DerbyEvent[] = [];

  // Countdown phase
  if (state.status === 'countdown') {
    const nextTimer = state.countdownTimer - dt;
    if (nextTimer <= 0) {
      return {
        ...state,
        status: 'racing',
        countdownTimer: 0,
        events: [{ type: 'gallop_step' }],
      };
    }
    return { ...state, countdownTimer: nextTimer };
  }

  if (state.status === 'finished') {
    return state;
  }

  // Racing phase
  const nextElapsed = state.elapsedTime + dt;
  const player = { ...state.player };
  let nextScore = state.score;
  let nextHorseshoes = state.horseshoesCollected;
  let nextCarrots = state.carrotsEaten;

  // Timers
  if (player.gradeTimer > 0) {
    player.gradeTimer = Math.max(0, player.gradeTimer - dt);
  }
  if (player.boostTimer > 0) {
    player.boostTimer = Math.max(0, player.boostTimer - dt);
  }
  if (player.stumbleTimer > 0) {
    player.stumbleTimer = Math.max(0, player.stumbleTimer - dt);
  }

  // Smooth lane transition
  const laneDiff = player.targetLane - player.laneY;
  if (Math.abs(laneDiff) > 0.01) {
    player.laneY += Math.sign(laneDiff) * Math.min(Math.abs(laneDiff), dt * 6.5);
  } else {
    player.laneY = player.targetLane;
    player.lane = player.targetLane;
  }

  // Jump physics
  if (player.isJumping) {
    player.jumpY += player.jumpVelocity * dt;
    player.jumpVelocity -= 26 * dt; // gravity
    if (player.jumpY <= 0) {
      player.jumpY = 0;
      player.jumpVelocity = 0;
      player.isJumping = false;
      events.push({ type: 'jump_land' });
    }
  }

  // Stamina drain & speed calculation
  let effectiveMaxSpeed = player.maxSpeed;
  if (player.boostTimer > 0) {
    effectiveMaxSpeed += 6.0;
  }
  if (player.stumbleTimer > 0) {
    effectiveMaxSpeed *= 0.45;
  }

  if (player.stamina > 0) {
    const drain = dt * (player.boostTimer > 0 ? 8 : 4.5);
    player.stamina = Math.max(0, player.stamina - drain);
  } else {
    effectiveMaxSpeed *= 0.65; // exhausted speed penalty
  }

  // Accelerate or decelerate to target speed
  if (player.speed < effectiveMaxSpeed) {
    player.speed = Math.min(effectiveMaxSpeed, player.speed + player.acceleration * dt);
  } else if (player.speed > effectiveMaxSpeed) {
    player.speed = Math.max(effectiveMaxSpeed, player.speed - player.acceleration * 1.5 * dt);
  }

  // Move player forward
  player.distance += player.speed * dt;

  // Obstacle collision check (if player is in obstacle lane and at obstacle position)
  const updatedObstacles = state.obstacles.map((obs) => {
    if (obs.cleared || obs.hit) return obs;

    const inRange = Math.abs(player.distance - obs.distance) <= 1.8;
    const sameLane = Math.abs(player.laneY - obs.lane) < 0.45;

    if (inRange && sameLane) {
      // If jumping high enough, obstacle is cleared
      if (player.jumpY >= 0.75) {
        return { ...obs, cleared: true };
      } else {
        // Player stumbled!
        player.stumbleTimer = 1.3;
        player.speed *= 0.4;
        player.stamina = Math.max(0, player.stamina - 15);
        events.push({ type: 'obstacle_hit' });
        return { ...obs, hit: true };
      }
    }

    // Past obstacle
    if (player.distance > obs.distance + 4) {
      return { ...obs, cleared: true };
    }

    return obs;
  });

  // Collectibles check
  const updatedCollectibles = state.collectibles.map((col) => {
    if (col.collected) return col;

    const inRange = Math.abs(player.distance - col.distance) <= 2.2;
    const sameLane = Math.abs(player.laneY - col.lane) < 0.45;

    if (inRange && sameLane) {
      events.push({ type: 'collect_item', itemType: col.type });
      if (col.type === 'horseshoe') {
        nextScore += 100;
        nextHorseshoes += 1;
      } else if (col.type === 'carrot') {
        nextScore += 50;
        nextCarrots += 1;
        player.stamina = Math.min(player.maxStamina, player.stamina + 25);
      } else if (col.type === 'golden_apple') {
        nextScore += 300;
        player.stamina = player.maxStamina;
        player.boostTimer = Math.max(player.boostTimer, 3.5);
      }
      return { ...col, collected: true };
    }

    return col;
  });

  // Update rivals
  const updatedRivals = state.rivals.map((rival) => {
    if (rival.finished) return rival;

    const updated = { ...rival };

    // Simple AI speed adjustment
    const accel = 6;
    if (updated.speed < updated.targetSpeed) {
      updated.speed = Math.min(updated.targetSpeed, updated.speed + accel * dt);
    }
    updated.distance += updated.speed * dt;

    // AI automatic jump when near an obstacle in its lane
    const nearestObs = state.obstacles.find(
      (o) => o.lane === updated.lane && !o.cleared && Math.abs(o.distance - updated.distance) < 5
    );
    if (nearestObs && !updated.isJumping) {
      updated.isJumping = true;
      updated.jumpTimer = 0.65;
    }

    if (updated.isJumping) {
      updated.jumpTimer -= dt;
      if (updated.jumpTimer <= 0) {
        updated.isJumping = false;
      }
    }

    if (updated.distance >= state.track.totalDistance && !updated.finished) {
      updated.finished = true;
      updated.finishTime = nextElapsed;
    }

    return updated;
  });

  // Check player finish
  let nextStatus: 'countdown' | 'racing' | 'finished' = state.status;
  let finalRank = state.finalRank;
  let trophy: 'gold' | 'silver' | 'bronze' | 'none' = state.trophy;

  if (player.distance >= state.track.totalDistance) {
    nextStatus = 'finished';
    // Calculate rank: count how many rivals finished before player
    const rivalsAhead = updatedRivals.filter((r) => r.finished && (r.finishTime ?? 999) < nextElapsed).length;
    finalRank = rivalsAhead + 1;

    if (finalRank === 1) trophy = 'gold';
    else if (finalRank === 2) trophy = 'silver';
    else if (finalRank === 3) trophy = 'bronze';
    else trophy = 'none';

    // Finish bonus
    if (finalRank === 1) nextScore += 1000;
    else if (finalRank === 2) nextScore += 500;
    else if (finalRank === 3) nextScore += 250;

    events.push({ type: 'finish_race', rank: finalRank });
  }

  return {
    ...state,
    status: nextStatus,
    elapsedTime: nextElapsed,
    player,
    rivals: updatedRivals,
    obstacles: updatedObstacles,
    collectibles: updatedCollectibles,
    score: nextScore,
    horseshoesCollected: nextHorseshoes,
    carrotsEaten: nextCarrots,
    finalRank,
    trophy,
    events,
  };
}
