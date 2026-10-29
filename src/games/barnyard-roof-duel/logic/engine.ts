import {
  Bullet,
  DuelEvent,
  DuelGameState,
  DuelPlayer,
  GameMode,
  MapType,
  RoofSegment,
  WindmillEntity,
} from './types';

export const BOARD_WIDTH = 640;
export const BOARD_HEIGHT = 480;
export const GRAVITY = 580;
export const TARGET_WINS = 5;

export function getMapGeometry(mapType: MapType): {
  roofSegments: RoofSegment[];
  windmill?: WindmillEntity;
  p1Spawn: { x: number; y: number };
  p2Spawn: { x: number; y: number };
} {
  if (mapType === 'windmill') {
    return {
      roofSegments: [
        { x1: 130, y1: 340, x2: 510, y2: 340 },
      ],
      windmill: {
        cx: 320,
        cy: 250,
        angle: 0,
        vAngle: 1.2,
        bladeLength: 75,
      },
      p1Spawn: { x: 190, y: 310 },
      p2Spawn: { x: 450, y: 310 },
    };
  } else if (mapType === 'silo_catwalk') {
    return {
      roofSegments: [
        { x1: 100, y1: 330, x2: 270, y2: 330, isSlippery: true },
        { x1: 370, y1: 330, x2: 540, y2: 330, isSlippery: true },
      ],
      p1Spawn: { x: 180, y: 300 },
      p2Spawn: { x: 460, y: 300 },
    };
  }

  // Default: Red Barn Gable
  return {
    roofSegments: [
      { x1: 110, y1: 360, x2: 320, y2: 310 },
      { x1: 320, y1: 310, x2: 530, y2: 360 },
    ],
    p1Spawn: { x: 180, y: 315 },
    p2Spawn: { x: 460, y: 315 },
  };
}

export function createInitialState(
  gameMode: GameMode = 'vs_ai',
  mapType: MapType = 'red_barn'
): DuelGameState {
  const { roofSegments, windmill, p1Spawn, p2Spawn } = getMapGeometry(mapType);

  const p1: DuelPlayer = {
    id: 'p1',
    x: p1Spawn.x,
    y: p1Spawn.y,
    vx: 0,
    vy: 0,
    angle: 0,
    vAngle: 0,
    armAngle: 0,
    armDirection: 1,
    isAiming: false,
    isGrounded: true,
    character: 'rooster',
    score: 0,
  };

  const p2: DuelPlayer = {
    id: 'p2',
    x: p2Spawn.x,
    y: p2Spawn.y,
    vx: 0,
    vy: 0,
    angle: 0,
    vAngle: 0,
    armAngle: 0,
    armDirection: -1,
    isAiming: false,
    isGrounded: true,
    character: 'fox',
    score: 0,
  };

  return {
    status: 'dueling',
    gameMode,
    mapType,
    round: 1,
    targetWins: TARGET_WINS,
    p1,
    p2,
    bullets: [],
    roofSegments,
    windmill,
    aiTimer: 0.5,
    events: [],
    boardWidth: BOARD_WIDTH,
    boardHeight: BOARD_HEIGHT,
  };
}

export function playerJump(state: DuelGameState, playerId: 'p1' | 'p2'): DuelGameState {
  if (state.status !== 'dueling') return state;

  const player = playerId === 'p1' ? state.p1 : state.p2;
  if (!player.isGrounded) return state;

  const updatedPlayer: DuelPlayer = {
    ...player,
    vy: -350,
    vAngle: (Math.random() - 0.5) * 4.5,
    isGrounded: false,
  };

  const events: DuelEvent[] = [...state.events, { type: 'jump', playerId }];

  return {
    ...state,
    p1: playerId === 'p1' ? updatedPlayer : state.p1,
    p2: playerId === 'p2' ? updatedPlayer : state.p2,
    events,
  };
}

let bulletCounter = 1;

export function playerShoot(state: DuelGameState, playerId: 'p1' | 'p2'): DuelGameState {
  if (state.status !== 'dueling') return state;

  const player = playerId === 'p1' ? state.p1 : state.p2;
  const isP1 = playerId === 'p1';

  // Calculate firing vector based on arm angle and player face orientation
  const baseAngle = isP1 ? 0 : Math.PI;
  const aimAngle = baseAngle + (isP1 ? -player.armAngle : player.armAngle);
  const muzzleDist = 28;
  const muzzleX = player.x + Math.cos(aimAngle) * muzzleDist;
  const muzzleY = player.y - 15 + Math.sin(aimAngle) * muzzleDist;

  const bulletSpeed = 750;
  const bvx = Math.cos(aimAngle) * bulletSpeed;
  const bvy = Math.sin(aimAngle) * bulletSpeed;

  const newBullet: Bullet = {
    id: `bullet-${bulletCounter++}`,
    x: muzzleX,
    y: muzzleY,
    vx: bvx,
    vy: bvy,
    shooterId: playerId,
    ricochets: 0,
    active: true,
  };

  // Recoil pushes player back and adds floppy ragdoll spin
  const updatedPlayer: DuelPlayer = {
    ...player,
    vx: player.vx - bvx * 0.12,
    vy: player.vy - 50,
    vAngle: player.vAngle + (isP1 ? -3.0 : 3.0),
  };

  const events: DuelEvent[] = [
    ...state.events,
    { type: 'shoot', playerId, x: muzzleX, y: muzzleY, vx: bvx, vy: bvy },
  ];

  return {
    ...state,
    p1: isP1 ? updatedPlayer : state.p1,
    p2: !isP1 ? updatedPlayer : state.p2,
    bullets: [...state.bullets, newBullet],
    events,
  };
}

// Line segment intersection helper
function getRoofYAt(segments: RoofSegment[], x: number): { y: number; normalY: number } | null {
  for (const seg of segments) {
    const minX = Math.min(seg.x1, seg.x2);
    const maxX = Math.max(seg.x1, seg.x2);
    if (x >= minX && x <= maxX) {
      const t = (x - seg.x1) / (seg.x2 - seg.x1);
      const y = seg.y1 + t * (seg.y2 - seg.y1);
      return { y, normalY: -1 };
    }
  }
  return null;
}

export function updateGame(state: DuelGameState, dt: number): DuelGameState {
  if (state.status !== 'dueling') {
    return state;
  }

  const events: DuelEvent[] = [];
  const clampedDt = Math.min(0.04, Math.max(0.001, dt));

  let p1 = { ...state.p1 };
  let p2 = { ...state.p2 };
  let bullets = state.bullets.map((b) => ({ ...b }));
  let windmill = state.windmill ? { ...state.windmill } : undefined;

  // 1. Rotate Windmill if present
  if (windmill) {
    windmill.angle += windmill.vAngle * clampedDt;
  }

  // 2. Oscillate Aiming Arms
  const armSpeed = 3.5;
  p1.armAngle += p1.armDirection * armSpeed * clampedDt;
  if (p1.armAngle > 0.8) {
    p1.armAngle = 0.8;
    p1.armDirection = -1;
  } else if (p1.armAngle < -0.8) {
    p1.armAngle = -0.8;
    p1.armDirection = 1;
  }

  p2.armAngle += p2.armDirection * armSpeed * clampedDt;
  if (p2.armAngle > 0.8) {
    p2.armAngle = 0.8;
    p2.armDirection = -1;
  } else if (p2.armAngle < -0.8) {
    p2.armAngle = -0.8;
    p2.armDirection = 1;
  }

  // 3. AI Behavior Controller for P2
  let nextAiTimer = state.aiTimer - clampedDt;
  if (state.gameMode === 'vs_ai') {
    if (nextAiTimer <= 0) {
      nextAiTimer = 0.7 + Math.random() * 0.9;

      // AI jumps periodically or when incoming bullet detected
      const incomingBullet = bullets.find((b) => b.shooterId === 'p1' && b.x > p2.x - 220 && b.x < p2.x);
      if (incomingBullet && p2.isGrounded) {
        p2.vy = -340;
        p2.isGrounded = false;
        events.push({ type: 'jump', playerId: 'p2' });
      } else if (Math.random() < 0.4 && p2.isGrounded) {
        p2.vy = -320;
        p2.isGrounded = false;
        events.push({ type: 'jump', playerId: 'p2' });
      }

      // AI shoots when arm aligns towards p1
      const dy = p1.y - p2.y;
      const dx = p1.x - p2.x; // negative
      const targetAim = Math.atan2(dy, dx) - Math.PI; // relative to left
      if (Math.abs(p2.armAngle - targetAim) < 0.4 || Math.random() < 0.35) {
        // Trigger shoot
        const aimAngle = Math.PI + p2.armAngle;
        const bvx = Math.cos(aimAngle) * 750;
        const bvy = Math.sin(aimAngle) * 750;
        bullets.push({
          id: `bullet-${bulletCounter++}`,
          x: p2.x - 28,
          y: p2.y - 15,
          vx: bvx,
          vy: bvy,
          shooterId: 'p2',
          ricochets: 0,
          active: true,
        });
        p2.vx -= bvx * 0.12;
        p2.vAngle -= 3.0;
        events.push({ type: 'shoot', playerId: 'p2', x: p2.x - 28, y: p2.y - 15, vx: bvx, vy: bvy });
      }
    }
  }

  // 4. Update Ragdoll Physics for Both Players
  const players = [p1, p2];
  for (const p of players) {
    p.vy += GRAVITY * clampedDt;
    p.x += p.vx * clampedDt;
    p.y += p.vy * clampedDt;
    p.angle += p.vAngle * clampedDt;

    // Angular damping & friction
    p.vAngle *= 0.92;
    p.vx *= 0.94;

    // Check roof ground collision
    const roof = getRoofYAt(state.roofSegments, p.x);
    if (roof && p.y >= roof.y - 28 && p.vy >= 0) {
      p.y = roof.y - 28;
      p.vy = 0;
      p.isGrounded = true;
      // Body upright spring
      p.angle *= 0.82;
      p.vAngle *= 0.7;
    } else {
      p.isGrounded = false;
    }
  }

  // 5. Update Bullets and Hit Detection
  for (const b of bullets) {
    if (!b.active) continue;

    b.x += b.vx * clampedDt;
    b.y += b.vy * clampedDt;

    // Out of bounds check
    if (b.x < 0 || b.x > BOARD_WIDTH || b.y < 0 || b.y > BOARD_HEIGHT) {
      b.active = false;
      continue;
    }

    // Hit opponent check
    const victim = b.shooterId === 'p1' ? p2 : p1;
    const hitBoxDist = Math.hypot(b.x - victim.x, b.y - (victim.y - 10));

    if (hitBoxDist < 26) {
      b.active = false;
      // Transfer kinetic impulse to victim
      victim.vx += b.vx * 0.38;
      victim.vy -= 140;
      victim.vAngle += (b.shooterId === 'p1' ? 6.5 : -6.5);
      victim.isGrounded = false;
      events.push({ type: 'hit', victimId: victim.id });
      continue;
    }

    // Ricochet off roof segments
    const roof = getRoofYAt(state.roofSegments, b.x);
    if (roof && Math.abs(b.y - roof.y) < 14) {
      if (b.ricochets < 1) {
        b.ricochets++;
        b.vy = -Math.abs(b.vy) * 0.75;
        b.vx *= 0.85;
        events.push({ type: 'ricochet', x: b.x, y: b.y });
      } else {
        b.active = false;
      }
    }
  }

  // Clean inactive bullets
  bullets = bullets.filter((b) => b.active);

  // 6. Check Fall-Off Victory / Round Over
  let nextStatus: DuelGameState['status'] = state.status;
  let roundWinner: 'p1' | 'p2' | undefined = undefined;
  let matchWinner: 'p1' | 'p2' | undefined = undefined;

  const p1Fell = p1.y > 470 || p1.x < 30 || p1.x > BOARD_WIDTH - 30;
  const p2Fell = p2.y > 470 || p2.x < 30 || p2.x > BOARD_WIDTH - 30;

  if (p1Fell || p2Fell) {
    if (p1Fell && !p2Fell) {
      roundWinner = 'p2';
      p2.score += 1;
    } else if (p2Fell && !p1Fell) {
      roundWinner = 'p1';
      p1.score += 1;
    } else {
      // Both fell simultaneously, higher scorer or tie-breaker
      roundWinner = p1.y < p2.y ? 'p1' : 'p2';
      if (roundWinner === 'p1') p1.score += 1;
      else p2.score += 1;
    }

    events.push({
      type: 'round_win',
      winnerId: roundWinner,
      p1Score: p1.score,
      p2Score: p2.score,
    });

    if (p1.score >= TARGET_WINS || p2.score >= TARGET_WINS) {
      nextStatus = 'match_over';
      matchWinner = p1.score >= TARGET_WINS ? 'p1' : 'p2';
      events.push({ type: 'match_win', winnerId: matchWinner });
    } else {
      nextStatus = 'round_over';
    }
  }

  return {
    ...state,
    status: nextStatus,
    roundWinner,
    matchWinner,
    p1,
    p2,
    bullets,
    windmill,
    aiTimer: nextAiTimer,
    events,
  };
}

export function startNextRound(state: DuelGameState): DuelGameState {
  const { p1Spawn, p2Spawn } = getMapGeometry(state.mapType);

  return {
    ...state,
    status: 'dueling',
    round: state.round + 1,
    roundWinner: undefined,
    bullets: [],
    p1: {
      ...state.p1,
      x: p1Spawn.x,
      y: p1Spawn.y,
      vx: 0,
      vy: 0,
      angle: 0,
      vAngle: 0,
      armAngle: 0,
      isGrounded: true,
    },
    p2: {
      ...state.p2,
      x: p2Spawn.x,
      y: p2Spawn.y,
      vx: 0,
      vy: 0,
      angle: 0,
      vAngle: 0,
      armAngle: 0,
      isGrounded: true,
    },
    events: [],
  };
}

export function restartMatch(state: DuelGameState): DuelGameState {
  return createInitialState(state.gameMode, state.mapType);
}
