import {
  RescueGameState,
  MamaDuckState,
  LostDuckling,
  RowboatHazard,
  SnappingTurtle,
  ReedsNest,
  PondInput,
  DuckHat,
} from './types';

export const POND_WIDTH = 900;
export const POND_HEIGHT = 650;
export const MAMA_BASE_SPEED = 160;
export const MAMA_BOOST_SPEED = 230;
export const TRAIL_STEP_DIST = 6;
export const DUCKLING_SPACING_POINTS = 5; // Trail points between each duckling in line

export const WAVE_TARGETS = [6, 14, 24, 36, 50, 66, 84, 105];

export const WAVE_NAMES = [
  'Peaceful Lily Bay',
  'Cattail Shallows',
  'Motorboat Rapids',
  'Snapping Turtle Cove',
  'Twin Rapids Passage',
  'Fisherman Harbor',
  'Stormy Waterway',
  'Royal Sanctuary Lagoon',
];

export function spawnPondDucklings(count: number, startId = 1): LostDuckling[] {
  const ducklings: LostDuckling[] = [];
  for (let i = 0; i < count; i++) {
    ducklings.push({
      id: `duckling_${startId + i}`,
      x: 100 + Math.random() * (POND_WIDTH - 200),
      y: 80 + Math.random() * (POND_HEIGHT - 220),
      isFollowing: false,
      followIndex: -1,
    });
  }
  return ducklings;
}

export function spawnRowboats(wave: number): RowboatHazard[] {
  const baseSpeed = 80 + wave * 12;
  const boats: RowboatHazard[] = [
    {
      id: 'boat_1',
      x: 150,
      y: 190,
      width: 90,
      height: 34,
      speedX: baseSpeed,
      minX: 70,
      maxX: POND_WIDTH - 110,
    },
    {
      id: 'boat_2',
      x: 600,
      y: 360,
      width: 100,
      height: 36,
      speedX: -(baseSpeed + 10),
      minX: 70,
      maxX: POND_WIDTH - 110,
    },
  ];

  if (wave >= 2) {
    boats.push({
      id: 'boat_3',
      x: 350,
      y: 480,
      width: 80,
      height: 32,
      speedX: baseSpeed * 0.9,
      minX: 90,
      maxX: POND_WIDTH - 90,
    });
  }

  if (wave >= 4) {
    boats.push({
      id: 'boat_4',
      x: 200,
      y: 275,
      width: 75,
      height: 30,
      speedX: -(baseSpeed * 1.15),
      minX: 100,
      maxX: POND_WIDTH - 100,
    });
  }

  if (wave >= 6) {
    boats.push({
      id: 'boat_5',
      x: 520,
      y: 115,
      width: 85,
      height: 32,
      speedX: baseSpeed * 1.2,
      minX: 80,
      maxX: POND_WIDTH - 80,
    });
  }

  return boats;
}

export function spawnTurtles(wave: number): SnappingTurtle[] {
  if (wave <= 1) return [];

  const turtles: SnappingTurtle[] = [
    {
      id: 'turtle_1',
      x: 280,
      y: 290,
      radius: 16,
      patrolAngle: 0,
      orbitCenterX: 280,
      orbitCenterY: 290,
      orbitRadius: 45,
      speed: 1.4 + wave * 0.08,
    },
  ];

  if (wave >= 3) {
    turtles.push({
      id: 'turtle_2',
      x: 700,
      y: 230,
      radius: 16,
      patrolAngle: Math.PI,
      orbitCenterX: 700,
      orbitCenterY: 230,
      orbitRadius: 55,
      speed: 1.6 + wave * 0.08,
    });
  }

  if (wave >= 5) {
    turtles.push({
      id: 'turtle_3',
      x: 450,
      y: 420,
      radius: 17,
      patrolAngle: Math.PI * 0.5,
      orbitCenterX: 450,
      orbitCenterY: 420,
      orbitRadius: 60,
      speed: 1.8 + wave * 0.08,
    });
  }

  if (wave >= 7) {
    turtles.push({
      id: 'turtle_4',
      x: 220,
      y: 150,
      radius: 18,
      patrolAngle: Math.PI * 1.5,
      orbitCenterX: 220,
      orbitCenterY: 150,
      orbitRadius: 65,
      speed: 2.0 + wave * 0.08,
    });
  }

  return turtles;
}

export function initRescueGame(
  wave = 1,
  unlockedHats: DuckHat[] = ['none'],
  highScore = 0
): RescueGameState {
  const initialMama: MamaDuckState = {
    x: POND_WIDTH / 2,
    y: POND_HEIGHT - 90,
    vx: 0,
    vy: 0,
    angle: -Math.PI / 2, // Facing up
    speed: MAMA_BASE_SPEED,
    activeHat: unlockedHats.length > 1 ? unlockedHats[unlockedHats.length - 1] : 'none',
    trail: [{ x: POND_WIDTH / 2, y: POND_HEIGHT - 90 }],
  };

  const nest: ReedsNest = {
    x: POND_WIDTH / 2,
    y: POND_HEIGHT - 60,
    radius: 55,
    totalRescued: 0,
    nestLevel: 1,
  };

  return {
    wave,
    status: 'ready',
    score: 0,
    ducksInLine: 0,
    highestLine: 0,
    elapsedTime: 0,
    mama: initialMama,
    ducklings: spawnPondDucklings(8),
    boats: spawnRowboats(wave),
    turtles: spawnTurtles(wave),
    nest,
    unlockedHats,
    highScore,
  };
}

export function stepRescueGame(
  state: RescueGameState,
  input: PondInput,
  dt: number
): RescueGameState {
  if (state.status === 'game_over' || state.status === 'victory') {
    return state;
  }

  let nextStatus: RescueGameState['status'] = state.status;
  let score = state.score;
  let ducksInLine = state.ducksInLine;
  let highestLine = state.highestLine;
  let elapsedTime = state.elapsedTime;
  let wave = state.wave;
  const nest = { ...state.nest };
  const unlockedHats = [...state.unlockedHats];
  let highScore = state.highScore;

  // Start on first movement
  if (state.status === 'ready') {
    const hasInput =
      input.targetX !== undefined ||
      input.moveLeft ||
      input.moveRight ||
      input.moveUp ||
      input.moveDown;
    if (hasInput) {
      nextStatus = 'playing';
    } else {
      return state;
    }
  }

  const fixedDt = Math.min(dt, 0.033);
  elapsedTime += fixedDt;

  const mama: MamaDuckState = {
    ...state.mama,
    trail: [...state.mama.trail],
  };

  // 1. Calculate Mama Duck Steering & Velocity
  let moveDirX = 0;
  let moveDirY = 0;

  if (input.targetX !== undefined && input.targetY !== undefined) {
    const dx = input.targetX - mama.x;
    const dy = input.targetY - mama.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 10) {
      moveDirX = dx / dist;
      moveDirY = dy / dist;
      mama.angle = Math.atan2(dy, dx);
    }
  } else {
    if (input.moveLeft) moveDirX -= 1;
    if (input.moveRight) moveDirX += 1;
    if (input.moveUp) moveDirY -= 1;
    if (input.moveDown) moveDirY += 1;

    const len = Math.hypot(moveDirX, moveDirY);
    if (len > 0) {
      moveDirX /= len;
      moveDirY /= len;
      mama.angle = Math.atan2(moveDirY, moveDirX);
    }
  }

  const currentSpeed = input.boost ? MAMA_BOOST_SPEED : MAMA_BASE_SPEED;
  mama.vx = moveDirX * currentSpeed;
  mama.vy = moveDirY * currentSpeed;

  mama.x += mama.vx * fixedDt;
  mama.y += mama.vy * fixedDt;

  // Clamp inside pond
  mama.x = Math.max(30, Math.min(POND_WIDTH - 30, mama.x));
  mama.y = Math.max(30, Math.min(POND_HEIGHT - 30, mama.y));

  // Update follow trail
  const lastTrail = mama.trail[0];
  const distFromLast = Math.hypot(mama.x - lastTrail.x, mama.y - lastTrail.y);
  if (distFromLast >= TRAIL_STEP_DIST) {
    mama.trail.unshift({ x: mama.x, y: mama.y });
    const maxTrailPoints = (ducksInLine + 2) * DUCKLING_SPACING_POINTS + 10;
    if (mama.trail.length > maxTrailPoints) {
      mama.trail.pop();
    }
  }

  // 2. Duckling Pickup Check
  let ducklings = state.ducklings.map(d => ({ ...d }));

  ducklings.forEach(duckling => {
    if (!duckling.isFollowing) {
      const dDist = Math.hypot(mama.x - duckling.x, mama.y - duckling.y);
      if (dDist < 30) {
        duckling.isFollowing = true;
        duckling.followIndex = ducksInLine;
        ducksInLine++;
        highestLine = Math.max(highestLine, ducksInLine);
        score += 25 * ducksInLine;
      }
    }
  });

  // 3. Update Position of Following Ducklings
  ducklings.forEach(duckling => {
    if (duckling.isFollowing) {
      const trailIdx = (duckling.followIndex + 1) * DUCKLING_SPACING_POINTS;
      if (mama.trail[trailIdx]) {
        duckling.x = mama.trail[trailIdx].x;
        duckling.y = mama.trail[trailIdx].y;
      }
    }
  });

  // 4. Rowboat Hazards Movement & Collision
  const boats = state.boats.map(boat => {
    const b = { ...boat };
    b.x += b.speedX * fixedDt;
    if (b.x >= b.maxX) {
      b.x = b.maxX;
      b.speedX = -Math.abs(b.speedX);
    } else if (b.x <= b.minX) {
      b.x = b.minX;
      b.speedX = Math.abs(b.speedX);
    }

    // Check hit on Mama Duck (Direct hit = Game Over)
    const hitMama =
      mama.x >= b.x - 10 &&
      mama.x <= b.x + b.width + 10 &&
      mama.y >= b.y - 10 &&
      mama.y <= b.y + b.height + 10;

    if (hitMama) {
      nextStatus = 'game_over';
    }

    // Check hit on Following Duckling line (Breaks line!)
    ducklings.forEach(d => {
      if (d.isFollowing) {
        const hitDuckling =
          d.x >= b.x && d.x <= b.x + b.width && d.y >= b.y && d.y <= b.y + b.height;
        if (hitDuckling) {
          // Break line starting from this duckling
          const severedIndex = d.followIndex;
          ducklings.forEach(scatter => {
            if (scatter.isFollowing && scatter.followIndex >= severedIndex) {
              scatter.isFollowing = false;
              scatter.followIndex = -1;
              scatter.x += (Math.random() - 0.5) * 40;
              scatter.y += (Math.random() - 0.5) * 40;
            }
          });
          ducksInLine = severedIndex;
        }
      }
    });

    return b;
  });

  // 5. Snapping Turtles Patrol & Hit
  const turtles = state.turtles.map(turtle => {
    const t = { ...turtle };
    t.patrolAngle += t.speed * fixedDt;
    t.x = t.orbitCenterX + Math.cos(t.patrolAngle) * t.orbitRadius;
    t.y = t.orbitCenterY + Math.sin(t.patrolAngle) * t.orbitRadius;

    // Turtle hit on Mama
    if (Math.hypot(mama.x - t.x, mama.y - t.y) < t.radius + 14) {
      nextStatus = 'game_over';
    }
    return t;
  });

  // 6. Reeds Nest Safe Deposit
  const distToNest = Math.hypot(mama.x - nest.x, mama.y - nest.y);
  if (distToNest < nest.radius && ducksInLine > 0) {
    // Deposit ducklings!
    nest.totalRescued += ducksInLine;
    const bonus = ducksInLine * 100 * (1 + ducksInLine * 0.1);
    score += Math.round(bonus);

    // Remove deposited ducklings from field
    ducklings = ducklings.filter(d => !d.isFollowing);
    ducksInLine = 0;

    // Nest upgrade thresholds (up to Level 8)
    nest.nestLevel = Math.min(8, Math.floor(nest.totalRescued / 12) + 1);

    // Unlock cosmetic hats (7 unlockable hats!)
    if (nest.totalRescued >= 8 && !unlockedHats.includes('flower')) {
      unlockedHats.push('flower');
      mama.activeHat = 'flower';
    }
    if (nest.totalRescued >= 16 && !unlockedHats.includes('straw')) {
      unlockedHats.push('straw');
      mama.activeHat = 'straw';
    }
    if (nest.totalRescued >= 24 && !unlockedHats.includes('sailor')) {
      unlockedHats.push('sailor');
      mama.activeHat = 'sailor';
    }
    if (nest.totalRescued >= 36 && !unlockedHats.includes('pirate')) {
      unlockedHats.push('pirate');
      mama.activeHat = 'pirate';
    }
    if (nest.totalRescued >= 50 && !unlockedHats.includes('chef')) {
      unlockedHats.push('chef');
      mama.activeHat = 'chef';
    }
    if (nest.totalRescued >= 66 && !unlockedHats.includes('crown')) {
      unlockedHats.push('crown');
      mama.activeHat = 'crown';
    }
    if (nest.totalRescued >= 84 && !unlockedHats.includes('wizard')) {
      unlockedHats.push('wizard');
      mama.activeHat = 'wizard';
    }

    // Spawn replacement lost ducklings in the pond
    if (ducklings.length < 6) {
      ducklings.push(...spawnPondDucklings(6, Date.now() % 1000));
    }

    // Wave Progression (8 progressive waves!)
    const target = WAVE_TARGETS[wave - 1] || 105;
    if (nest.totalRescued >= target) {
      if (wave < WAVE_TARGETS.length) {
        wave++;
        // Refresh hazards for next wave
        state.boats = spawnRowboats(wave);
        state.turtles = spawnTurtles(wave);
      } else {
        nextStatus = 'victory';
      }
    }
  }

  if (score > highScore) {
    highScore = score;
  }

  return {
    ...state,
    wave,
    status: nextStatus,
    score,
    ducksInLine,
    highestLine,
    elapsedTime,
    mama,
    ducklings,
    boats,
    turtles,
    nest,
    unlockedHats,
    highScore,
  };
}

export function calculateRescueStars(totalRescued: number, wave: number): number {
  if (totalRescued >= 66 || wave >= 6) return 3;
  if (totalRescued >= 24 || wave >= 3) return 2;
  return 1;
}
