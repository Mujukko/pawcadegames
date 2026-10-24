/**
 * Duck Hunt Classic: Barnyard Shoot — Core Game Logic Engine
 * Pure TypeScript logic independent of DOM/Phaser for 100% deterministic testing.
 */

export const WORLD_WIDTH = 800;
export const WORLD_HEIGHT = 500;
export const MAX_SHOTS_PER_FLUSH = 3;
export const DUCKS_PER_ROUND = 10;
export const BUSH_Y = 410; // Reed grass line

export type DuckType = 'greenhead' | 'redhead' | 'golden';
export type DuckState = 'flying' | 'flying_away' | 'hit_pause' | 'falling' | 'retrieved' | 'escaped';
export type DogState = 'intro_walk' | 'intro_sniff' | 'intro_jump' | 'hidden' | 'show_duck' | 'laugh';
export type GamePhase = 'intro' | 'playing' | 'duck_resolution' | 'round_clear' | 'game_over';

export interface Duck {
  id: string;
  type: DuckType;
  state: DuckState;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  facing: 'left' | 'right';
  wingFrame: number;
  wingTimer: number;
  stateTimer: number; // time spent in current state
  flightDuration: number; // total flight time before flying away
  points: number;
}

export interface Feather {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  rotation: number;
  life: number;
}

export interface Dog {
  state: DogState;
  x: number;
  y: number;
  timer: number;
  ducksHeld: number; // 1 or 2 ducks shown
}

export type TrackerStatus = 'pending' | 'active' | 'hit' | 'miss';

export interface GameState {
  phase: GamePhase;
  round: number;
  score: number;
  highScore: number;
  shells: number;
  ducksSpawnedInRound: number;
  roundHits: number;
  duckTracker: TrackerStatus[];
  activeDucks: Duck[];
  feathers: Feather[];
  dog: Dog;
  quota: number;
  isFlashActive: boolean;
  flashTimer: number;
  roundTransitionTimer: number;
  resolutionTimer: number;
}

export interface ShotResult {
  fired: boolean;
  hit: boolean;
  hitDuck?: Duck;
  pointsAwarded: number;
  remainingShells: number;
}

/**
 * Generates quota required to pass round
 */
export function getQuotaForRound(round: number): number {
  if (round <= 2) return 6;
  if (round <= 5) return 7;
  if (round <= 8) return 8;
  return 9;
}

/**
 * Creates initial game state
 */
export function createInitialState(savedHighScore: number = 0): GameState {
  return {
    phase: 'intro',
    round: 1,
    score: 0,
    highScore: savedHighScore,
    shells: MAX_SHOTS_PER_FLUSH,
    ducksSpawnedInRound: 0,
    roundHits: 0,
    duckTracker: Array(DUCKS_PER_ROUND).fill('pending'),
    activeDucks: [],
    feathers: [],
    dog: {
      state: 'intro_walk',
      x: 100,
      y: BUSH_Y - 15,
      timer: 0,
      ducksHeld: 0,
    },
    quota: getQuotaForRound(1),
    isFlashActive: false,
    flashTimer: 0,
    roundTransitionTimer: 0,
    resolutionTimer: 0,
  };
}

/**
 * Spawns 1 or 2 ducks for current flush
 */
export function spawnFlushDucks(state: GameState): Duck[] {
  const isDual = state.round >= 3; // Round 3+ flushes 2 ducks at once
  const ducksToSpawn = isDual ? 2 : 1;
  const newDucks: Duck[] = [];

  const baseSpeed = 220 + state.round * 22;

  for (let i = 0; i < ducksToSpawn; i++) {
    const trackerIndex = state.ducksSpawnedInRound + i;
    if (trackerIndex >= DUCKS_PER_ROUND) break;

    // Duck Type Distribution
    const roll = Math.random();
    let type: DuckType = 'greenhead';
    let points = 500;
    let speedMult = 1.0;

    if (roll > 0.85 || (state.round >= 6 && roll > 0.7)) {
      type = 'golden';
      points = 1500;
      speedMult = 1.5;
    } else if (roll > 0.5 || state.round >= 4) {
      type = 'redhead';
      points = 1000;
      speedMult = 1.25;
    }

    const spawnX = 220 + Math.random() * 360 + (i === 1 ? (Math.random() > 0.5 ? 90 : -90) : 0);
    const angleDeg = 35 + Math.random() * 45; // 35° to 80° upward
    const angleRad = (angleDeg * Math.PI) / 180;
    const direction = i === 1 ? -1 : Math.random() > 0.5 ? 1 : -1;

    const speed = baseSpeed * speedMult;
    const vx = Math.cos(angleRad) * speed * direction;
    const vy = -Math.sin(angleRad) * speed;

    newDucks.push({
      id: `duck-${Date.now()}-${trackerIndex}-${i}`,
      type,
      state: 'flying',
      x: Math.max(120, Math.min(WORLD_WIDTH - 120, spawnX)),
      y: BUSH_Y - 10,
      vx,
      vy,
      width: 54,
      height: 48,
      facing: vx >= 0 ? 'right' : 'left',
      wingFrame: 0,
      wingTimer: 0,
      stateTimer: 0,
      flightDuration: Math.max(4.0, 7.0 - state.round * 0.25),
      points,
    });
  }

  return newDucks;
}

/**
 * Fires shotgun blast at target coordinates (targetX, targetY)
 */
export function fireShot(state: GameState, targetX: number, targetY: number): ShotResult {
  // Can only fire in 'playing' phase with active ducks and remaining shells
  if (state.phase !== 'playing') {
    return { fired: false, hit: false, pointsAwarded: 0, remainingShells: state.shells };
  }

  if (state.shells <= 0) {
    return { fired: false, hit: false, pointsAwarded: 0, remainingShells: 0 };
  }

  // Deduct shell and trigger retro Zapper CRT flash
  state.shells--;
  state.isFlashActive = true;
  state.flashTimer = 0.08; // 80ms flash

  // Hitbox collision check against active flying ducks
  let hitDuck: Duck | undefined = undefined;

  // Search from last to first so top rendered duck is hit
  for (let i = state.activeDucks.length - 1; i >= 0; i--) {
    const duck = state.activeDucks[i]!;
    if (duck.state !== 'flying' && duck.state !== 'flying_away') continue;

    // Generous hitbox for rewarding touch & mouse aim
    const halfW = duck.width * 0.65;
    const halfH = duck.height * 0.65;

    if (
      targetX >= duck.x - halfW &&
      targetX <= duck.x + halfW &&
      targetY >= duck.y - halfH &&
      targetY <= duck.y + halfH
    ) {
      hitDuck = duck;
      break;
    }
  }

  if (hitDuck) {
    hitDuck.state = 'hit_pause';
    hitDuck.stateTimer = 0;
    hitDuck.vx = 0;
    hitDuck.vy = 0;

    // Award points
    state.score += hitDuck.points;
    if (state.score > state.highScore) {
      state.highScore = state.score;
    }
    state.roundHits++;

    // Mark hit in duckTracker
    const duckIndex = state.duckTracker.findIndex((s) => s === 'active');
    if (duckIndex !== -1) {
      state.duckTracker[duckIndex] = 'hit';
    }

    // Spawn explosion feather particles
    const featherColors =
      hitDuck.type === 'golden'
        ? ['#fbbf24', '#f59e0b', '#d97706', '#fef3c7']
        : hitDuck.type === 'redhead'
        ? ['#ef4444', '#b91c1c', '#f87171', '#ffffff']
        : ['#10b981', '#047857', '#34d399', '#ffffff', '#78350f'];

    for (let f = 0; f < 14; f++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 140;
      state.feathers.push({
        x: hitDuck.x,
        y: hitDuck.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 40,
        color: featherColors[Math.floor(Math.random() * featherColors.length)]!,
        rotation: Math.random() * 360,
        life: 1.0,
      });
    }

    return {
      fired: true,
      hit: true,
      hitDuck,
      pointsAwarded: hitDuck.points,
      remainingShells: state.shells,
    };
  }

  // Missed shot
  // If out of shells and any duck is still flying, duck begins to fly away
  if (state.shells === 0) {
    for (const d of state.activeDucks) {
      if (d.state === 'flying') {
        d.state = 'flying_away';
        d.stateTimer = 0;
        d.vy = -340; // Zoom straight up
        d.vx *= 0.5;
      }
    }
  }

  return {
    fired: true,
    hit: false,
    pointsAwarded: 0,
    remainingShells: state.shells,
  };
}

/**
 * Updates duck flight, wing flap, dog movements, and round transitions
 */
export function updateGameEngine(state: GameState, dt: number): void {
  // 1. Zapper Flash timer
  if (state.isFlashActive) {
    state.flashTimer -= dt;
    if (state.flashTimer <= 0) {
      state.isFlashActive = false;
    }
  }

  // 2. Feather physics
  for (let i = state.feathers.length - 1; i >= 0; i--) {
    const f = state.feathers[i]!;
    f.x += f.vx * dt;
    f.y += f.vy * dt;
    f.vy += 120 * dt; // gravity
    f.vx *= 0.98; // air resistance
    f.rotation += 180 * dt;
    f.life -= dt * 1.2;
    if (f.life <= 0 || f.y > BUSH_Y + 40) {
      state.feathers.splice(i, 1);
    }
  }

  // 3. Intro Dog State Machine
  if (state.phase === 'intro') {
    const dog = state.dog;
    dog.timer += dt;

    if (dog.state === 'intro_walk') {
      dog.x += 80 * dt;
      if (dog.x >= 280) {
        dog.state = 'intro_sniff';
        dog.timer = 0;
      }
    } else if (dog.state === 'intro_sniff') {
      if (dog.timer >= 1.2) {
        dog.state = 'intro_jump';
        dog.timer = 0;
      }
    } else if (dog.state === 'intro_jump') {
      // Leap into bush
      dog.x += 65 * dt;
      dog.y = BUSH_Y - 15 - Math.sin((dog.timer / 0.8) * Math.PI) * 70;
      if (dog.timer >= 0.8) {
        dog.state = 'hidden';
        dog.y = BUSH_Y + 60;
        // Start flush!
        startNextFlush(state);
      }
    }
    return;
  }

  // 4. Playing Phase: Update Ducks
  if (state.phase === 'playing') {
    let allDucksFinished = true;

    for (const duck of state.activeDucks) {
      duck.stateTimer += dt;

      // Wing flap animation
      duck.wingTimer += dt;
      if (duck.wingTimer >= 0.08) {
        duck.wingTimer = 0;
        duck.wingFrame = (duck.wingFrame + 1) % 3;
      }

      if (duck.state === 'flying') {
        allDucksFinished = false;

        // Position movement
        duck.x += duck.vx * dt;
        duck.y += duck.vy * dt;

        // Screen boundary bounces
        const minX = duck.width * 0.5 + 20;
        const maxX = WORLD_WIDTH - duck.width * 0.5 - 20;
        const minY = duck.height * 0.5 + 20;
        const maxY = BUSH_Y - 20;

        if (duck.x <= minX) {
          duck.x = minX;
          duck.vx = Math.abs(duck.vx);
          duck.facing = 'right';
        } else if (duck.x >= maxX) {
          duck.x = maxX;
          duck.vx = -Math.abs(duck.vx);
          duck.facing = 'left';
        }

        if (duck.y <= minY) {
          duck.y = minY;
          duck.vy = Math.abs(duck.vy);
        } else if (duck.y >= maxY && duck.stateTimer > 0.5) {
          duck.y = maxY;
          duck.vy = -Math.abs(duck.vy);
        }

        // Check flight duration timeout -> Fly Away!
        if (duck.stateTimer >= duck.flightDuration) {
          duck.state = 'flying_away';
          duck.stateTimer = 0;
          duck.vy = -360; // Shoot straight up into stratosphere
          duck.vx *= 0.4;
        }
      } else if (duck.state === 'flying_away') {
        allDucksFinished = false;
        duck.x += duck.vx * dt;
        duck.y += duck.vy * dt;

        // Once escaped off-screen top
        if (duck.y < -duck.height) {
          duck.state = 'escaped';
          // Mark miss in tracker
          const trackerIndex = state.duckTracker.findIndex((s) => s === 'active');
          if (trackerIndex !== -1) {
            state.duckTracker[trackerIndex] = 'miss';
          }
        }
      } else if (duck.state === 'hit_pause') {
        allDucksFinished = false;
        // Pause 0.3s in air with spinning eyes before falling
        if (duck.stateTimer >= 0.3) {
          duck.state = 'falling';
          duck.stateTimer = 0;
          duck.vy = 420; // Fall downward
        }
      } else if (duck.state === 'falling') {
        allDucksFinished = false;
        duck.y += duck.vy * dt;
        // Reached reed grass
        if (duck.y >= BUSH_Y + 10) {
          duck.state = 'retrieved';
        }
      }
    }

    // Check if flush is resolved
    if (allDucksFinished) {
      state.phase = 'duck_resolution';
      state.resolutionTimer = 0;

      // Determine dog reaction
      const hitsInFlush = state.activeDucks.filter((d) => d.state === 'retrieved').length;
      if (hitsInFlush > 0) {
        state.dog.state = 'show_duck';
        state.dog.ducksHeld = hitsInFlush;
        state.dog.x = state.activeDucks[0]!.x;
        state.dog.y = BUSH_Y + 50;
        state.dog.timer = 0;
      } else {
        // Buster Laughs!
        state.dog.state = 'laugh';
        state.dog.ducksHeld = 0;
        state.dog.x = 400;
        state.dog.y = BUSH_Y + 50;
        state.dog.timer = 0;
      }
    }
    return;
  }

  // 5. Resolution Phase (Dog Pops up, then next flush or round evaluation)
  if (state.phase === 'duck_resolution') {
    state.resolutionTimer += dt;
    const dog = state.dog;
    dog.timer += dt;

    // Dog rises up from behind reeds
    if (dog.timer <= 0.4) {
      dog.y = BUSH_Y + 50 - (dog.timer / 0.4) * 85;
    } else if (dog.timer >= 1.6 && dog.timer <= 2.0) {
      dog.y = BUSH_Y - 35 + ((dog.timer - 1.6) / 0.4) * 85;
    }

    if (state.resolutionTimer >= 2.1) {
      // Check if 10 ducks in round completed
      if (state.ducksSpawnedInRound >= DUCKS_PER_ROUND) {
        evaluateRoundEnd(state);
      } else {
        startNextFlush(state);
      }
    }
    return;
  }

  // 6. Round Clear Transition
  if (state.phase === 'round_clear') {
    state.roundTransitionTimer += dt;
    if (state.roundTransitionTimer >= 2.5) {
      // Advance to next round
      state.round++;
      state.quota = getQuotaForRound(state.round);
      state.ducksSpawnedInRound = 0;
      state.roundHits = 0;
      state.duckTracker = Array(DUCKS_PER_ROUND).fill('pending');
      state.activeDucks = [];
      state.phase = 'intro';
      state.dog = {
        state: 'intro_walk',
        x: 100,
        y: BUSH_Y - 15,
        timer: 0,
        ducksHeld: 0,
      };
    }
  }
}

/**
 * Starts next duck flush in current round
 */
export function startNextFlush(state: GameState): void {
  const newDucks = spawnFlushDucks(state);
  state.activeDucks = newDucks;
  state.shells = MAX_SHOTS_PER_FLUSH;
  state.phase = 'playing';

  // Mark tracker items as active
  for (let i = 0; i < newDucks.length; i++) {
    const idx = state.ducksSpawnedInRound + i;
    if (idx < DUCKS_PER_ROUND) {
      state.duckTracker[idx] = 'active';
    }
  }

  state.ducksSpawnedInRound += newDucks.length;
}

/**
 * Checks whether player met the round quota
 */
export function evaluateRoundEnd(state: GameState): void {
  if (state.roundHits >= state.quota) {
    state.phase = 'round_clear';
    state.roundTransitionTimer = 0;
  } else {
    state.phase = 'game_over';
  }
}

/**
 * Restarts game to round 1
 */
export function restartGame(state: GameState): void {
  const highScore = state.highScore;
  const fresh = createInitialState(highScore);
  Object.assign(state, fresh);
}
