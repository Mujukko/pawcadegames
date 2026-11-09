import { GlowOrb, SlitherEvent, SlitherGameState, Vec2, WormAgent } from './types';

export const WORLD_RADIUS = 920;
export const SEGMENT_GAP = 10;
export const BASE_SPEED = 148;
export const BOOST_SPEED = 258;
export const TURN_RATE = 4.4; // rad/sec
export const MIN_BOOST_MASS = 44;
const TARGET_ORB_COUNT = 135;

const ORB_PALETTE = ['#fbbf24', '#4ade80', '#fb7185', '#38bdf8', '#c084fc', '#f97316', '#facc15'];

const BOT_PROFILES: Array<{ name: string; colors: [string, string] }> = [
  { name: 'Berry', colors: ['#fb7185', '#f43f5e'] },
  { name: 'Sunny', colors: ['#facc15', '#eab308'] },
  { name: 'Melon', colors: ['#4ade80', '#ec4899'] },
  { name: 'Bluebell', colors: ['#38bdf8', '#2563eb'] },
  { name: 'Plum', colors: ['#c084fc', '#9333ea'] },
  { name: 'Tangerine', colors: ['#fb923c', '#ea580c'] },
  { name: 'Minty', colors: ['#2dd4bf', '#0d9488'] },
];

export function wormSegmentCount(mass: number): number {
  return Math.min(110, Math.max(8, Math.floor(mass / 5)));
}

export function wormRadius(mass: number): number {
  return Math.min(17, 8.5 + Math.sqrt(mass) * 0.28);
}

export function wormDisplayLength(mass: number): number {
  return Math.floor(mass);
}

function normalizeAngle(a: number): number {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

function randomPointInArena(maxR: number): Vec2 {
  const angle = Math.random() * Math.PI * 2;
  const r = Math.sqrt(Math.random()) * maxR;
  return { x: Math.cos(angle) * r, y: Math.sin(angle) * r };
}

function buildWormSegments(head: Vec2, angle: number, count: number): Vec2[] {
  const segs: Vec2[] = [];
  for (let i = 0; i < count; i++) {
    segs.push({
      x: head.x - Math.cos(angle) * SEGMENT_GAP * i,
      y: head.y - Math.sin(angle) * SEGMENT_GAP * i,
    });
  }
  return segs;
}

function spawnRandomOrb(id: number): GlowOrb {
  const p = randomPointInArena(WORLD_RADIUS - 35);
  const big = Math.random() < 0.14;
  return {
    id,
    x: p.x,
    y: p.y,
    value: big ? 6 : 2.5,
    radius: big ? 6.5 : 4.2,
    color: ORB_PALETTE[id % ORB_PALETTE.length]!,
    jumbo: big,
  };
}

export function createSlitherGame(bestLength = 40): SlitherGameState {
  let nextOrbId = 1;
  const orbs: GlowOrb[] = [];
  for (let i = 0; i < TARGET_ORB_COUNT; i++) {
    orbs.push(spawnRandomOrb(nextOrbId++));
  }

  const startMass = 40;
  const player: WormAgent = {
    id: 0,
    name: 'Sprout',
    colors: ['#84cc16', '#22c55e'],
    angle: 0,
    targetAngle: 0,
    boosting: false,
    alive: true,
    respawnTimer: 0,
    mass: startMass,
    segments: buildWormSegments({ x: 0, y: 0 }, 0, wormSegmentCount(startMass)),
    kills: 0,
    boostDropAcc: 0,
  };

  const worms: WormAgent[] = [player];
  BOT_PROFILES.forEach((prof, idx) => {
    const theta = (idx / BOT_PROFILES.length) * Math.PI * 2;
    const dist = 340 + (idx % 3) * 140;
    const head = { x: Math.cos(theta) * dist, y: Math.sin(theta) * dist };
    const botMass = 35 + idx * 14;
    const ang = theta + Math.PI * 0.6;
    worms.push({
      id: idx + 1,
      name: prof.name,
      colors: prof.colors,
      angle: ang,
      targetAngle: ang,
      boosting: false,
      alive: true,
      respawnTimer: 0,
      mass: botMass,
      segments: buildWormSegments(head, ang, wormSegmentCount(botMass)),
      kills: 0,
      boostDropAcc: 0,
    });
  });

  return {
    worldRadius: WORLD_RADIUS,
    worms,
    orbs,
    nextOrbId,
    status: 'ready',
    bestLength: Math.max(bestLength, wormDisplayLength(startMass)),
    events: [],
  };
}

export function setSlitherInput(
  state: SlitherGameState,
  targetAngle: number | null,
  boosting?: boolean
): SlitherGameState {
  if (state.status === 'game_over') return state;
  const p = state.worms[0];
  if (!p || !p.alive) return state;

  const worms = state.worms.slice();
  worms[0] = {
    ...p,
    targetAngle: targetAngle !== null ? targetAngle : p.targetAngle,
    angle: state.status === 'ready' && targetAngle !== null ? targetAngle : p.angle,
    boosting: boosting !== undefined ? boosting : p.boosting,
  };

  return {
    ...state,
    status: state.status === 'ready' ? 'playing' : state.status,
    worms,
  };
}

export function nudgeSlitherAngle(state: SlitherGameState, deltaRad: number): SlitherGameState {
  const p = state.worms[0];
  if (!p) return state;
  return setSlitherInput(state, normalizeAngle(p.targetAngle + deltaRad));
}

function updateBotAi(bot: WormAgent, worms: WormAgent[], orbs: GlowOrb[], worldRadius: number): void {
  const head = bot.segments[0]!;
  const distFromCenter = Math.hypot(head.x, head.y);

  // 1. Strong pull back inside if approaching red orchard fence
  if (distFromCenter > worldRadius - 140) {
    bot.targetAngle = Math.atan2(-head.y, -head.x);
    bot.boosting = false;
    return;
  }

  // 2. Dodge nearby enemy body segments
  for (const other of worms) {
    if (!other.alive || other.id === bot.id) continue;
    for (let k = 0; k < other.segments.length; k += 3) {
      const seg = other.segments[k]!;
      const dx = seg.x - head.x;
      const dy = seg.y - head.y;
      const d = Math.hypot(dx, dy);
      if (d < 85) {
        bot.targetAngle = Math.atan2(-dy, -dx);
        bot.boosting = bot.mass > 70 && d < 50;
        return;
      }
    }
  }

  // 3. Seek nearest valuable orb
  let bestScore = -Infinity;
  let bestOrb: GlowOrb | null = null;
  for (let i = 0; i < orbs.length; i += 2) {
    const o = orbs[i]!;
    const d = Math.hypot(o.x - head.x, o.y - head.y);
    if (d < 280) {
      const val = (o.jumbo ? 35 : 10) - d * 0.08;
      if (val > bestScore) {
        bestScore = val;
        bestOrb = o;
      }
    }
  }

  if (bestOrb) {
    bot.targetAngle = Math.atan2(bestOrb.y - head.y, bestOrb.x - head.x);
    bot.boosting = bestOrb.jumbo && bot.mass > 65;
  } else if (Math.random() < 0.04) {
    bot.targetAngle = normalizeAngle(bot.angle + (Math.random() - 0.5) * 1.4);
    bot.boosting = false;
  }
}

function burstWormIntoOrbs(worm: WormAgent, orbs: GlowOrb[], nextIdRef: { id: number }): void {
  const step = Math.max(1, Math.floor(worm.segments.length / 18));
  for (let i = 0; i < worm.segments.length; i += step) {
    const seg = worm.segments[i]!;
    orbs.push({
      id: nextIdRef.id++,
      x: seg.x + (Math.random() - 0.5) * 12,
      y: seg.y + (Math.random() - 0.5) * 12,
      value: 8,
      radius: 8,
      color: worm.colors[i % 2]!,
      jumbo: true,
    });
  }
}

export function updateSlitherGame(state: SlitherGameState, rawDt: number): SlitherGameState {
  if (state.status !== 'playing') {
    return state.events.length ? { ...state, events: [] } : state;
  }

  const dt = Math.min(rawDt, 0.05);
  const worms = state.worms.map((w) => ({
    ...w,
    segments: w.segments.map((s) => ({ ...s })),
  }));
  const orbs = state.orbs.slice();
  const nextIdRef = { id: state.nextOrbId };
  const events: SlitherEvent[] = [];
  let status: SlitherGameState['status'] = state.status;
  let deathReason: SlitherGameState['deathReason'];
  let killerName: string | undefined;

  // 1. Advance all alive worms & respawn dead bots
  for (const w of worms) {
    if (!w.alive) {
      if (w.id !== 0) {
        w.respawnTimer -= dt;
        if (w.respawnTimer <= 0) {
          const sp = randomPointInArena(state.worldRadius - 220);
          const ang = Math.random() * Math.PI * 2;
          w.mass = 38 + Math.floor(Math.random() * 25);
          w.angle = ang;
          w.targetAngle = ang;
          w.boosting = false;
          w.segments = buildWormSegments(sp, ang, wormSegmentCount(w.mass));
          w.alive = true;
        }
      }
      continue;
    }

    if (w.id !== 0) {
      updateBotAi(w, worms, orbs, state.worldRadius);
    }

    // Smooth steering toward targetAngle
    const diff = normalizeAngle(w.targetAngle - w.angle);
    const maxTurn = TURN_RATE * dt;
    if (Math.abs(diff) <= maxTurn) {
      w.angle = w.targetAngle;
    } else {
      w.angle = normalizeAngle(w.angle + Math.sign(diff) * maxTurn);
    }

    const canBoost = w.boosting && w.mass > MIN_BOOST_MASS;
    const speed = canBoost ? BOOST_SPEED : BASE_SPEED;
    if (canBoost) {
      w.mass = Math.max(MIN_BOOST_MASS, w.mass - 14 * dt);
      w.boostDropAcc += 14 * dt;
      if (w.boostDropAcc >= 3.5) {
        w.boostDropAcc -= 3.5;
        const tail = w.segments[w.segments.length - 1]!;
        orbs.push({
          id: nextIdRef.id++,
          x: tail.x,
          y: tail.y,
          value: 2.5,
          radius: 4.5,
          color: w.colors[0],
          jumbo: false,
        });
      }
    }

    const head = w.segments[0]!;
    const newHead: Vec2 = {
      x: head.x + Math.cos(w.angle) * speed * dt,
      y: head.y + Math.sin(w.angle) * speed * dt,
    };
    w.segments[0] = newHead;

    // Follow-the-leader chain kinematics
    const desiredCount = wormSegmentCount(w.mass);
    for (let i = 1; i < w.segments.length; i++) {
      const prev = w.segments[i - 1]!;
      const cur = w.segments[i]!;
      const dx = cur.x - prev.x;
      const dy = cur.y - prev.y;
      const d = Math.hypot(dx, dy) || 0.001;
      if (d > SEGMENT_GAP) {
        cur.x = prev.x + (dx / d) * SEGMENT_GAP;
        cur.y = prev.y + (dy / d) * SEGMENT_GAP;
      }
    }
    while (w.segments.length < desiredCount) {
      const last = w.segments[w.segments.length - 1]!;
      w.segments.push({ x: last.x, y: last.y });
    }
    if (w.segments.length > desiredCount) {
      w.segments.length = desiredCount;
    }

    // Eat nearby orbs (magnetic pull radius)
    const eatR = wormRadius(w.mass) + 12;
    for (let o = orbs.length - 1; o >= 0; o--) {
      const orb = orbs[o]!;
      const dx = orb.x - newHead.x;
      const dy = orb.y - newHead.y;
      if (dx * dx + dy * dy <= (eatR + orb.radius) * (eatR + orb.radius)) {
        w.mass += orb.value;
        if (w.id === 0) {
          events.push({ type: 'eat', jumbo: orb.jumbo });
        }
        orbs.splice(o, 1);
      }
    }
  }

  // 2. Collision checks: arena fence + head hitting OTHER worm's body
  for (const w of worms) {
    if (!w.alive) continue;
    const head = w.segments[0]!;
    const r = wormRadius(w.mass);

    // Arena fence check
    if (Math.hypot(head.x, head.y) + r * 0.6 > state.worldRadius) {
      w.alive = false;
      burstWormIntoOrbs(w, orbs, nextIdRef);
      if (w.id === 0) {
        status = 'game_over';
        deathReason = 'wall';
        events.push({ type: 'die', reason: 'wall' });
        break;
      } else {
        w.respawnTimer = 3.0;
        continue;
      }
    }

    // Head vs OTHER worms' body segments (never own body!)
    for (const other of worms) {
      if (!other.alive || other.id === w.id) continue;
      const otherR = wormRadius(other.mass);
      const hitDistSq = (r * 0.78 + otherR * 0.82) ** 2;
      let crashed = false;
      for (let s = 0; s < other.segments.length; s++) {
        const seg = other.segments[s]!;
        const dx = head.x - seg.x;
        const dy = head.y - seg.y;
        if (dx * dx + dy * dy <= hitDistSq) {
          crashed = true;
          break;
        }
      }
      if (crashed) {
        w.alive = false;
        other.kills += 1;
        burstWormIntoOrbs(w, orbs, nextIdRef);
        if (w.id === 0) {
          status = 'game_over';
          deathReason = 'worm';
          killerName = other.name;
          events.push({ type: 'die', reason: 'worm', killerName: other.name });
        } else {
          w.respawnTimer = 3.0;
          if (other.id === 0) {
            events.push({ type: 'kill', victimName: w.name });
          }
        }
        break;
      }
    }
    if (status === 'game_over') break;
  }

  // Replenish ambient orbs up to TARGET_ORB_COUNT (cap max orbs at 260 for 60fps mobile perf)
  while (orbs.length < TARGET_ORB_COUNT) {
    orbs.push(spawnRandomOrb(nextIdRef.id++));
  }
  if (orbs.length > 260) {
    orbs.splice(0, orbs.length - 260);
  }

  const playerLen = wormDisplayLength(worms[0]!.mass);
  const bestLength = Math.max(state.bestLength, playerLen);

  return {
    ...state,
    worms,
    orbs,
    nextOrbId: nextIdRef.id,
    status,
    deathReason,
    killerName,
    bestLength,
    events,
  };
}
