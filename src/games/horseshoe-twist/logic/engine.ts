export interface RingSlot {
  id: string;
  angleDeg: number; // Angle of the notch relative to the ring's 0 deg
  widthDeg: number; // Width of notch (e.g. 35 deg)
}

export interface RingConfig {
  id: number; // 0 = innermost ring, 1 = middle, 2 = outer
  radius: number; // visual radius in px
  currentAngleDeg: number; // Current rotation angle [0..359]
  notches: RingSlot[];
  color: string;
  label: string;
  linkedRingId?: number; // Geared linkage: rotating this ring moves another
  gearRatio?: number; // e.g. -0.5 (half speed opposite direction)
}

export interface HorseshoePin {
  id: number;
  currentRingIndex: number; // 0 = at center hub, 1 = between ring 0 & 1, 2 = between ring 1 & 2, 3 = escaped!
  angleDeg: number; // Current pin position angle
  escaped: boolean;
}

export interface HorseshoeTwistLevelConfig {
  level: number;
  title: string;
  exitAngleDeg: number; // Target escape angle (usually 90 deg / Top or 0 deg / Right)
  rings: RingConfig[];
  pins: HorseshoePin[];
  moveLimit?: number;
}

export interface HorseshoeTwistState {
  level: number;
  title: string;
  exitAngleDeg: number;
  rings: RingConfig[];
  pins: HorseshoePin[];
  movesCount: number;
  score: number;
  status: 'playing' | 'won';
  selectedRingId: number | null;
}

// 4 Handcrafted levels
export const HORSESHOE_TWIST_LEVELS: HorseshoeTwistLevelConfig[] = [
  {
    level: 1,
    title: 'Beginner Barn Lock: Dual Rings',
    exitAngleDeg: 0, // Exit is to the Right (0°)
    rings: [
      {
        id: 0,
        radius: 70,
        currentAngleDeg: 90,
        notches: [{ id: 'n0_1', angleDeg: 0, widthDeg: 40 }],
        color: '#f59e0b',
        label: 'Inner Iron Ring',
      },
      {
        id: 1,
        radius: 120,
        currentAngleDeg: 180,
        notches: [{ id: 'n1_1', angleDeg: 0, widthDeg: 40 }],
        color: '#d97706',
        label: 'Outer Brass Ring',
      },
    ],
    pins: [
      { id: 1, currentRingIndex: 0, angleDeg: 0, escaped: false },
    ],
  },
  {
    level: 2,
    title: 'Triple Tumbler: Lucky Horseshoe',
    exitAngleDeg: 270, // Exit is to the Top (270°)
    rings: [
      {
        id: 0,
        radius: 65,
        currentAngleDeg: 60,
        notches: [{ id: 'l2_n0', angleDeg: 0, widthDeg: 40 }],
        color: '#f59e0b',
        label: 'Core Ring',
      },
      {
        id: 1,
        radius: 105,
        currentAngleDeg: 150,
        notches: [{ id: 'l2_n1', angleDeg: 0, widthDeg: 40 }],
        color: '#b45309',
        label: 'Middle Iron Ring',
      },
      {
        id: 2,
        radius: 145,
        currentAngleDeg: 240,
        notches: [{ id: 'l2_n2', angleDeg: 0, widthDeg: 40 }],
        color: '#78350f',
        label: 'Outer Timber Ring',
      },
    ],
    pins: [
      { id: 1, currentRingIndex: 0, angleDeg: 270, escaped: false },
      { id: 2, currentRingIndex: 0, angleDeg: 270, escaped: false },
    ],
  },
  {
    level: 3,
    title: 'Geared Barn Mechanism: Linked Wheels',
    exitAngleDeg: 0, // Exit is to the Right (0°)
    rings: [
      {
        id: 0,
        radius: 65,
        currentAngleDeg: 120,
        notches: [{ id: 'l3_n0', angleDeg: 0, widthDeg: 40 }],
        color: '#f59e0b',
        label: 'Spur Core',
        linkedRingId: 1,
        gearRatio: -1, // Turning ring 0 turns ring 1 opposite direction!
      },
      {
        id: 1,
        radius: 105,
        currentAngleDeg: 240,
        notches: [
          { id: 'l3_n1_a', angleDeg: 0, widthDeg: 40 },
          { id: 'l3_n1_b', angleDeg: 180, widthDeg: 40 },
        ],
        color: '#b45309',
        label: 'Geared Middle',
      },
      {
        id: 2,
        radius: 145,
        currentAngleDeg: 90,
        notches: [{ id: 'l3_n2', angleDeg: 0, widthDeg: 40 }],
        color: '#78350f',
        label: 'Outer Rim',
      },
    ],
    pins: [
      { id: 1, currentRingIndex: 0, angleDeg: 0, escaped: false },
    ],
  },
  {
    level: 4,
    title: 'Master Blacksmith Vault: Quad Lock',
    exitAngleDeg: 90, // Exit is to the Bottom (90°)
    rings: [
      {
        id: 0,
        radius: 55,
        currentAngleDeg: 180,
        notches: [{ id: 'l4_n0', angleDeg: 0, widthDeg: 40 }],
        color: '#fbbf24',
        label: 'Golden Hub',
      },
      {
        id: 1,
        radius: 90,
        currentAngleDeg: 45,
        notches: [{ id: 'l4_n1', angleDeg: 0, widthDeg: 40 }],
        color: '#f59e0b',
        label: 'Brass Tumbler',
        linkedRingId: 2,
        gearRatio: 0.5,
      },
      {
        id: 2,
        radius: 125,
        currentAngleDeg: 225,
        notches: [
          { id: 'l4_n2_a', angleDeg: 0, widthDeg: 38 },
          { id: 'l4_n2_b', angleDeg: 120, widthDeg: 38 },
        ],
        color: '#b45309',
        label: 'Iron Gear',
      },
      {
        id: 3,
        radius: 160,
        currentAngleDeg: 300,
        notches: [{ id: 'l4_n3', angleDeg: 0, widthDeg: 40 }],
        color: '#78350f',
        label: 'Oak Vault Outer',
      },
    ],
    pins: [
      { id: 1, currentRingIndex: 0, angleDeg: 90, escaped: false },
      { id: 2, currentRingIndex: 0, angleDeg: 90, escaped: false },
    ],
  },
];

export function normalizeAngle(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

export function isAngleMatchingNotch(
  targetAngleDeg: number,
  ringAngleDeg: number,
  notch: RingSlot
): boolean {
  // The absolute angle of the notch on the canvas is ringAngleDeg + notch.angleDeg
  const absoluteNotchAngle = normalizeAngle(ringAngleDeg + notch.angleDeg);
  const targetNorm = normalizeAngle(targetAngleDeg);

  let diff = Math.abs(absoluteNotchAngle - targetNorm);
  if (diff > 180) diff = 360 - diff;

  // Check if target falls within notch half-width
  return diff <= notch.widthDeg / 2;
}

export function isRingAlignedWithExit(ring: RingConfig, exitAngleDeg: number): boolean {
  return ring.notches.some((n) =>
    isAngleMatchingNotch(exitAngleDeg, ring.currentAngleDeg, n)
  );
}

export function checkLockSolvability(
  rings: RingConfig[],
  exitAngleDeg: number
): boolean {
  // All rings must have an aligned notch with the exit angle
  return rings.every((r) => isRingAlignedWithExit(r, exitAngleDeg));
}

export function initializeHorseshoeTwistLevel(levelNum: number = 1): HorseshoeTwistState {
  const cfg =
    HORSESHOE_TWIST_LEVELS.find((l) => l.level === levelNum) ||
    HORSESHOE_TWIST_LEVELS[0]!;

  return {
    level: cfg.level,
    title: cfg.title,
    exitAngleDeg: cfg.exitAngleDeg,
    rings: cfg.rings.map((r) => ({ ...r })),
    pins: cfg.pins.map((p) => ({ ...p })),
    movesCount: 0,
    score: 0,
    status: 'playing',
    selectedRingId: null,
  };
}

export function rotateRing(
  state: HorseshoeTwistState,
  ringId: number,
  deltaAngleDeg: number
): HorseshoeTwistState {
  if (state.status === 'won') return state;

  const targetRing = state.rings.find((r) => r.id === ringId);
  if (!targetRing) return state;

  const updatedRings = state.rings.map((ring) => {
    if (ring.id === ringId) {
      return {
        ...ring,
        currentAngleDeg: normalizeAngle(ring.currentAngleDeg + deltaAngleDeg),
      };
    }
    // Check geared linkage
    if (targetRing.linkedRingId === ring.id && targetRing.gearRatio !== undefined) {
      return {
        ...ring,
        currentAngleDeg: normalizeAngle(
          ring.currentAngleDeg + deltaAngleDeg * targetRing.gearRatio
        ),
      };
    }
    return ring;
  });

  const isSolved = checkLockSolvability(updatedRings, state.exitAngleDeg);

  let nextPins = state.pins;
  let nextScore = state.score;
  let nextStatus: 'playing' | 'won' = state.status;

  if (isSolved) {
    nextPins = state.pins.map((p) => ({
      ...p,
      currentRingIndex: updatedRings.length,
      escaped: true,
    }));
    nextStatus = 'won';
    const moveBonus = Math.max(0, 500 - state.movesCount * 20);
    nextScore = 1000 + moveBonus;
  }

  return {
    ...state,
    rings: updatedRings,
    movesCount: state.movesCount + 1,
    pins: nextPins,
    status: nextStatus,
    score: nextScore,
  };
}
