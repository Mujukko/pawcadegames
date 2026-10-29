import {
  AppleModel,
  BarnyardRopeCutState,
  BubbleModel,
  PiggyTarget,
  RopeCutEvent,
  RopeCutLevelConfig,
  RopeModel,
  RopeSegment,
  StarModel,
  ThistleModel,
  TrampolineModel,
} from './types';

export const GRAVITY = 520; // px/sec^2
export const BUBBLE_FLOAT_ACCEL = -190; // px/sec^2 upward
export const AIR_DAMPING = 0.995;
export const CONSTRAINT_ITERATIONS = 6;
export const STAGE_WIDTH = 500;
export const STAGE_HEIGHT = 600;

export const ROPE_CUT_LEVELS: RopeCutLevelConfig[] = [
  {
    id: 'kitchen-drop',
    name: 'Barnyard Kitchen',
    appleStart: { x: 250, y: 220 },
    ropes: [
      { id: 'rope-1', anchorX: 250, anchorY: 60, numSegments: 8, segmentLength: 20 },
    ],
    stars: [
      { id: 'star-1', x: 250, y: 290 },
      { id: 'star-2', x: 250, y: 360 },
      { id: 'star-3', x: 250, y: 430 },
    ],
    bubbles: [],
    trampolines: [],
    thistles: [],
    piggy: { x: 250, y: 510 },
  },
  {
    id: 'orchard-swing',
    name: 'Apple Orchard Swing',
    appleStart: { x: 250, y: 200 },
    ropes: [
      { id: 'rope-left', anchorX: 140, anchorY: 80, numSegments: 8, segmentLength: 19 },
      { id: 'rope-right', anchorX: 360, anchorY: 80, numSegments: 8, segmentLength: 19 },
    ],
    stars: [
      { id: 'star-1', x: 200, y: 310 },
      { id: 'star-2', x: 280, y: 350 },
      { id: 'star-3', x: 350, y: 390 },
    ],
    bubbles: [],
    trampolines: [],
    thistles: [
      { id: 'thistle-1', x: 120, y: 400 },
    ],
    piggy: { x: 380, y: 490 },
  },
  {
    id: 'windmill-bubble',
    name: 'Windmill Loft Bubble',
    appleStart: { x: 180, y: 220 },
    ropes: [
      { id: 'rope-1', anchorX: 180, anchorY: 70, numSegments: 7, segmentLength: 21 },
    ],
    stars: [
      { id: 'star-1', x: 180, y: 320 },
      { id: 'star-2', x: 260, y: 260 },
      { id: 'star-3', x: 340, y: 190 },
    ],
    bubbles: [
      { id: 'bubble-1', x: 180, y: 330 },
    ],
    trampolines: [],
    thistles: [
      { id: 'thistle-1', x: 260, y: 380 },
      { id: 'thistle-2', x: 260, y: 100 },
    ],
    piggy: { x: 360, y: 140 },
  },
  {
    id: 'silo-bounce',
    name: 'Grand Silo Summit',
    appleStart: { x: 220, y: 180 },
    ropes: [
      { id: 'rope-left', anchorX: 130, anchorY: 80, numSegments: 7, segmentLength: 20 },
      { id: 'rope-right', anchorX: 320, anchorY: 80, numSegments: 7, segmentLength: 20 },
    ],
    stars: [
      { id: 'star-1', x: 180, y: 290 },
      { id: 'star-2', x: 250, y: 440 },
      { id: 'star-3', x: 370, y: 340 },
    ],
    bubbles: [
      { id: 'bubble-1', x: 250, y: 390 },
    ],
    trampolines: [
      { id: 'tramp-1', x: 220, y: 520, width: 80, height: 16, angle: 0.15 },
    ],
    thistles: [
      { id: 'thistle-1', x: 100, y: 450 },
      { id: 'thistle-2', x: 420, y: 460 },
    ],
    piggy: { x: 390, y: 260 },
  },
];

export function buildRopeModel(
  id: string,
  anchorX: number,
  anchorY: number,
  numSegments: number,
  segmentLength: number,
  targetEnd: { x: number; y: number }
): RopeModel {
  const segments: RopeSegment[] = [];
  const dx = (targetEnd.x - anchorX) / numSegments;
  const dy = (targetEnd.y - anchorY) / numSegments;

  for (let i = 0; i <= numSegments; i++) {
    const x = anchorX + dx * i;
    const y = anchorY + dy * i;
    segments.push({
      x,
      y,
      oldX: x,
      oldY: y,
      pinned: i === 0,
    });
  }

  return {
    id,
    anchorX,
    anchorY,
    segments,
    segmentLength,
    cut: false,
  };
}

export function createInitialState(levelIndex = 0): BarnyardRopeCutState {
  const safeIdx = Math.max(0, Math.min(levelIndex, ROPE_CUT_LEVELS.length - 1));
  const level = ROPE_CUT_LEVELS[safeIdx];

  const apple: AppleModel = {
    x: level.appleStart.x,
    y: level.appleStart.y,
    oldX: level.appleStart.x,
    oldY: level.appleStart.y,
    radius: 18,
    inBubble: false,
    lost: false,
  };

  const ropes: RopeModel[] = level.ropes.map((r) =>
    buildRopeModel(r.id, r.anchorX, r.anchorY, r.numSegments, r.segmentLength, level.appleStart)
  );

  const stars: StarModel[] = level.stars.map((s) => ({
    id: s.id,
    x: s.x,
    y: s.y,
    radius: 16,
    collected: false,
  }));

  const bubbles: BubbleModel[] = level.bubbles.map((b) => ({
    id: b.id,
    x: b.x,
    y: b.y,
    radius: 26,
    popped: false,
  }));

  const trampolines: TrampolineModel[] = level.trampolines.map((t) => ({
    id: t.id,
    x: t.x,
    y: t.y,
    width: t.width,
    height: t.height,
    angle: t.angle,
    bounceFactor: 1.45,
  }));

  const thistles: ThistleModel[] = level.thistles.map((t) => ({
    id: t.id,
    x: t.x,
    y: t.y,
    radius: 18,
  }));

  const piggy: PiggyTarget = {
    x: level.piggy.x,
    y: level.piggy.y,
    radius: 36,
    mouthOpen: false,
  };

  return {
    levelIndex: safeIdx,
    level,
    apple,
    ropes,
    stars,
    bubbles,
    trampolines,
    thistles,
    piggy,
    starsCollected: 0,
    status: 'playing',
    timeSpent: 0,
    events: [],
  };
}

// 2D Line segment intersection check
export function linesIntersect(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  p4: { x: number; y: number }
): boolean {
  const ccw = (a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }) => {
    return (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x);
  };
  return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);
}

// Swipe cutting across rope links
export function cutRopesAlongLine(
  state: BarnyardRopeCutState,
  start: { x: number; y: number },
  end: { x: number; y: number }
): BarnyardRopeCutState {
  if (state.status !== 'playing') return state;

  const events: RopeCutEvent[] = [...state.events];
  let anyCut = false;

  const updatedRopes = state.ropes.map((rope) => {
    if (rope.cut) return rope;

    const segs = rope.segments;
    for (let i = 0; i < segs.length - 1; i++) {
      if (linesIntersect(start, end, segs[i], segs[i + 1])) {
        anyCut = true;
        events.push({
          type: 'rope_cut',
          x: (segs[i].x + segs[i + 1].x) / 2,
          y: (segs[i].y + segs[i + 1].y) / 2,
          timestamp: state.timeSpent,
        });
        return {
          ...rope,
          cut: true,
          cutIndex: i,
        };
      }
    }
    return rope;
  });

  if (!anyCut) return state;

  return {
    ...state,
    ropes: updatedRopes,
    events,
  };
}

// Pop bubble on tap
export function popBubble(state: BarnyardRopeCutState, bubbleId?: string): BarnyardRopeCutState {
  if (state.status !== 'playing') return state;

  const events: RopeCutEvent[] = [...state.events];
  let updatedApple = { ...state.apple };

  const updatedBubbles = state.bubbles.map((b) => {
    if ((!bubbleId || b.id === bubbleId) && !b.popped) {
      events.push({ type: 'bubble_pop', x: b.x, y: b.y, timestamp: state.timeSpent });
      if (updatedApple.inBubble) {
        updatedApple.inBubble = false;
      }
      return { ...b, popped: true };
    }
    return b;
  });

  return {
    ...state,
    apple: updatedApple,
    bubbles: updatedBubbles,
    events,
  };
}

// Main physics update step using Verlet integration
export function updateEngine(state: BarnyardRopeCutState, dt: number): BarnyardRopeCutState {
  if (state.status !== 'playing') {
    return { ...state, events: [] };
  }

  const clampedDt = Math.max(0.001, Math.min(dt, 0.05));
  const events: RopeCutEvent[] = [];
  const timeSpent = state.timeSpent + clampedDt;

  let apple = { ...state.apple };
  const dtsq = clampedDt * clampedDt;

  // 1. Verlet Integration for Apple
  const appleAccelY = apple.inBubble ? BUBBLE_FLOAT_ACCEL : GRAVITY;
  const appleVx = (apple.x - apple.oldX) * AIR_DAMPING;
  const appleVy = (apple.y - apple.oldY) * AIR_DAMPING;

  apple.oldX = apple.x;
  apple.oldY = apple.y;
  apple.x += appleVx;
  apple.y += appleVy + appleAccelY * dtsq;

  // 2. Verlet Integration for Rope Segments
  const updatedRopes: RopeModel[] = state.ropes.map((rope) => {
    const segs = rope.segments.map((seg) => {
      if (seg.pinned) return seg;
      const vx = (seg.x - seg.oldX) * AIR_DAMPING;
      const vy = (seg.y - seg.oldY) * AIR_DAMPING;
      return {
        ...seg,
        oldX: seg.x,
        oldY: seg.y,
        x: seg.x + vx,
        y: seg.y + vy + GRAVITY * dtsq,
      };
    });
    return { ...rope, segments: segs };
  });

  // 3. Relax Rope Constraints & Attach Uncut Rope End to Apple
  for (let iter = 0; iter < CONSTRAINT_ITERATIONS; iter++) {
    updatedRopes.forEach((rope) => {
      const segs = rope.segments;
      const maxIdx = rope.cut ? (rope.cutIndex || 0) : segs.length - 1;

      for (let i = 0; i < maxIdx; i++) {
        const s1 = segs[i];
        const s2 = segs[i + 1];
        const dx = s2.x - s1.x;
        const dy = s2.y - s1.y;
        const dist = Math.hypot(dx, dy);
        if (dist === 0) continue;
        const diff = (dist - rope.segmentLength) / dist;

        if (!s1.pinned && !s2.pinned) {
          s1.x += dx * 0.5 * diff;
          s1.y += dy * 0.5 * diff;
          s2.x -= dx * 0.5 * diff;
          s2.y -= dy * 0.5 * diff;
        } else if (s1.pinned) {
          s2.x -= dx * diff;
          s2.y -= dy * diff;
        } else if (s2.pinned) {
          s1.x += dx * diff;
          s1.y += dy * diff;
        }
      }

      // If rope is NOT cut, connect the last segment to the Apple
      if (!rope.cut) {
        const lastSeg = segs[segs.length - 1];
        const dx = apple.x - lastSeg.x;
        const dy = apple.y - lastSeg.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0) {
          const diff = (dist - rope.segmentLength * 0.6) / dist;
          // Apply mutual constraint between last segment and apple
          lastSeg.x += dx * 0.5 * diff;
          lastSeg.y += dy * 0.5 * diff;
          apple.x -= dx * 0.5 * diff;
          apple.y -= dy * 0.5 * diff;
        }
      }
    });
  }

  // 4. Bubble Collisions (Apple entering floating bubble)
  const updatedBubbles = state.bubbles.map((b) => {
    if (!b.popped) {
      if (apple.inBubble) {
        // Move bubble with apple
        return { ...b, x: apple.x, y: apple.y };
      }
      const dist = Math.hypot(apple.x - b.x, apple.y - b.y);
      if (dist <= apple.radius + b.radius) {
        apple.inBubble = true;
        events.push({ type: 'bubble_enter', x: b.x, y: b.y, timestamp: timeSpent });
        return { ...b, x: apple.x, y: apple.y };
      }
    }
    return b;
  });

  // 5. Trampoline Bounces
  for (const t of state.trampolines) {
    const halfW = t.width / 2;
    const dx = apple.x - t.x;
    const dy = apple.y - t.y;
    // Rotate relative point by -t.angle
    const cos = Math.cos(-t.angle);
    const sin = Math.sin(-t.angle);
    const localX = dx * cos - dy * sin;
    const localY = dx * sin + dy * cos;

    if (Math.abs(localX) <= halfW + 10 && Math.abs(localY) <= t.height / 2 + apple.radius) {
      if (apple.y > apple.oldY) {
        // Falling down into trampoline -> reflect with bounce factor
        const prevVy = (apple.y - apple.oldY);
        apple.y = apple.oldY - Math.abs(prevVy) * t.bounceFactor;
        events.push({ type: 'trampoline_bounce', x: t.x, y: t.y, timestamp: timeSpent });
      }
    }
  }

  // 6. Star Collection
  let newStarsCount = state.starsCollected;
  const updatedStars = state.stars.map((s) => {
    if (!s.collected) {
      const dist = Math.hypot(apple.x - s.x, apple.y - s.y);
      if (dist <= apple.radius + s.radius) {
        newStarsCount += 1;
        events.push({ type: 'star_collect', x: s.x, y: s.y, timestamp: timeSpent });
        return { ...s, collected: true };
      }
    }
    return s;
  });

  // 7. Thistle Hazard Collision
  let isLost = false;
  for (const th of state.thistles) {
    const dist = Math.hypot(apple.x - th.x, apple.y - th.y);
    if (dist <= apple.radius + th.radius) {
      isLost = true;
      apple.lost = true;
      events.push({ type: 'thistle_hit', x: th.x, y: th.y, timestamp: timeSpent });
      events.push({ type: 'level_lost', timestamp: timeSpent });
      break;
    }
  }

  // Check out of bounds
  if (apple.y > STAGE_HEIGHT + 60 || apple.x < -60 || apple.x > STAGE_WIDTH + 60) {
    isLost = true;
    apple.lost = true;
    events.push({ type: 'level_lost', timestamp: timeSpent });
  }

  // 8. Piggy Mouth Feeding Check
  let isWon = false;
  const mouthDist = Math.hypot(apple.x - state.piggy.x, apple.y - state.piggy.y);
  const piggyMouthOpen = mouthDist < state.piggy.radius + 60;

  if (mouthDist <= state.piggy.radius + 10 && !isLost) {
    isWon = true;
    events.push({ type: 'piggy_fed', x: state.piggy.x, y: state.piggy.y, timestamp: timeSpent });
    events.push({ type: 'level_won', timestamp: timeSpent });
  }

  return {
    ...state,
    apple,
    ropes: updatedRopes,
    stars: updatedStars,
    bubbles: updatedBubbles,
    piggy: { ...state.piggy, mouthOpen: piggyMouthOpen },
    starsCollected: newStarsCount,
    status: isWon ? 'won' : isLost ? 'lost' : 'playing',
    timeSpent,
    events,
  };
}
