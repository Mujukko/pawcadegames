import {
  ParticleType,
  PinParticle,
  LockingPin,
  PinChamberBarrier,
  CreatureTarget,
  PinLevelConfig,
  PinPullGameState,
} from './types';

export const PIN_LEVELS: PinLevelConfig[] = [
  // Level 1: Barn Gate Golden Feast
  {
    id: 1,
    title: 'Granary Gateway',
    subtitle: 'Pull the golden pin to release fresh farm carrots into Barnaby\'s bowl!',
    targetFoodCount: 8,
    barriers: [
      // Top hopper walls
      { x1: 140, y1: 80, x2: 140, y2: 240, thickness: 12 },
      { x1: 340, y1: 80, x2: 340, y2: 240, thickness: 12 },
      // Lower funnel
      { x1: 140, y1: 240, x2: 180, y2: 340, thickness: 12 },
      { x1: 340, y1: 240, x2: 300, y2: 340, thickness: 12 },
      // Puppy holding pen at bottom
      { x1: 160, y1: 440, x2: 160, y2: 560, thickness: 12 },
      { x1: 320, y1: 440, x2: 320, y2: 560, thickness: 12 },
      { x1: 160, y1: 560, x2: 320, y2: 560, thickness: 12 },
    ],
    pins: [
      {
        id: 'pin-1-1',
        orientation: 'horizontal',
        x: 135,
        y: 235,
        length: 210,
        thickness: 14,
        pullDirection: 'right',
        pullProgress: 0,
        isPulled: false,
        pullSpeed: 3.5,
        isPulling: false,
        ringX: 355,
        ringY: 242,
        ringRadius: 22,
      },
    ],
    creatures: [
      {
        id: 'puppy-1',
        type: 'puppy',
        x: 200,
        y: 470,
        width: 80,
        height: 70,
        isSatisfied: false,
        isEliminated: false,
        requiredFoodCount: 8,
        foodReceived: 0,
      },
    ],
    initialParticles: Array.from({ length: 12 }, (_, i) => ({
      id: `p1-${i}`,
      type: 'carrot',
      x: 180 + (i % 4) * 35,
      y: 110 + Math.floor(i / 4) * 30,
      vx: (Math.random() - 0.5) * 15,
      vy: 10,
      radius: 9,
    })),
  },

  // Level 2: Steam Quencher (Water over Lava)
  {
    id: 2,
    title: 'Steam Quencher',
    subtitle: 'Extinguish hot lava with water before releasing treats to Barnaby!',
    targetFoodCount: 8,
    barriers: [
      // Upper chamber (Water)
      { x1: 120, y1: 60, x2: 120, y2: 180, thickness: 12 },
      { x1: 360, y1: 60, x2: 360, y2: 180, thickness: 12 },
      // Mid chamber (Lava & Carrots)
      { x1: 120, y1: 190, x2: 120, y2: 340, thickness: 12 },
      { x1: 360, y1: 190, x2: 360, y2: 340, thickness: 12 },
      // Lower pen
      { x1: 160, y1: 440, x2: 160, y2: 560, thickness: 12 },
      { x1: 320, y1: 440, x2: 320, y2: 560, thickness: 12 },
      { x1: 160, y1: 560, x2: 320, y2: 560, thickness: 12 },
    ],
    pins: [
      // Top pin holding water
      {
        id: 'pin-2-top',
        orientation: 'horizontal',
        x: 115,
        y: 180,
        length: 250,
        thickness: 14,
        pullDirection: 'left',
        pullProgress: 0,
        isPulled: false,
        pullSpeed: 3.5,
        isPulling: false,
        ringX: 105,
        ringY: 187,
        ringRadius: 22,
      },
      // Bottom pin holding lava & carrots
      {
        id: 'pin-2-bot',
        orientation: 'horizontal',
        x: 115,
        y: 340,
        length: 250,
        thickness: 14,
        pullDirection: 'right',
        pullProgress: 0,
        isPulled: false,
        pullSpeed: 3.5,
        isPulling: false,
        ringX: 375,
        ringY: 347,
        ringRadius: 22,
      },
    ],
    creatures: [
      {
        id: 'puppy-2',
        type: 'puppy',
        x: 200,
        y: 470,
        width: 80,
        height: 70,
        isSatisfied: false,
        isEliminated: false,
        requiredFoodCount: 8,
        foodReceived: 0,
      },
    ],
    initialParticles: [
      // Water droplets in top chamber
      ...Array.from({ length: 14 }, (_, i) => ({
        id: `p2-w-${i}`,
        type: 'water' as ParticleType,
        x: 160 + (i % 5) * 35,
        y: 80 + Math.floor(i / 5) * 25,
        vx: (Math.random() - 0.5) * 10,
        vy: 5,
        radius: 7,
      })),
      // Lava droplets in middle chamber
      ...Array.from({ length: 8 }, (_, i) => ({
        id: `p2-l-${i}`,
        type: 'lava' as ParticleType,
        x: 160 + (i % 4) * 40,
        y: 220 + Math.floor(i / 4) * 30,
        vx: (Math.random() - 0.5) * 10,
        vy: 5,
        radius: 8,
      })),
      // Carrots in middle chamber
      ...Array.from({ length: 10 }, (_, i) => ({
        id: `p2-c-${i}`,
        type: 'carrot' as ParticleType,
        x: 180 + (i % 4) * 35,
        y: 270 + Math.floor(i / 4) * 25,
        vx: (Math.random() - 0.5) * 10,
        vy: 5,
        radius: 9,
      })),
    ],
  },

  // Level 3: Fox Ambush (Defeat the Fox)
  {
    id: 3,
    title: 'Fox in the Hayloft',
    subtitle: 'Drop lava on the thieving fox before feeding the puppy!',
    targetFoodCount: 8,
    barriers: [
      // Lava chamber top left
      { x1: 90, y1: 60, x2: 90, y2: 180, thickness: 12 },
      { x1: 220, y1: 60, x2: 220, y2: 180, thickness: 12 },
      // Treats chamber top right
      { x1: 260, y1: 60, x2: 260, y2: 180, thickness: 12 },
      { x1: 390, y1: 60, x2: 390, y2: 180, thickness: 12 },
      // Fox pit mid left
      { x1: 90, y1: 260, x2: 90, y2: 380, thickness: 12 },
      { x1: 220, y1: 260, x2: 220, y2: 380, thickness: 12 },
      { x1: 90, y1: 380, x2: 220, y2: 380, thickness: 12 },
      // Puppy pen bottom
      { x1: 200, y1: 440, x2: 200, y2: 560, thickness: 12 },
      { x1: 360, y1: 440, x2: 360, y2: 560, thickness: 12 },
      { x1: 200, y1: 560, x2: 360, y2: 560, thickness: 12 },
    ],
    pins: [
      // Left pin (holds lava above fox)
      {
        id: 'pin-3-left',
        orientation: 'horizontal',
        x: 85,
        y: 180,
        length: 140,
        thickness: 14,
        pullDirection: 'left',
        pullProgress: 0,
        isPulled: false,
        pullSpeed: 3.5,
        isPulling: false,
        ringX: 75,
        ringY: 187,
        ringRadius: 22,
      },
      // Right pin (holds food above puppy)
      {
        id: 'pin-3-right',
        orientation: 'horizontal',
        x: 255,
        y: 180,
        length: 140,
        thickness: 14,
        pullDirection: 'right',
        pullProgress: 0,
        isPulled: false,
        pullSpeed: 3.5,
        isPulling: false,
        ringX: 405,
        ringY: 187,
        ringRadius: 22,
      },
    ],
    creatures: [
      {
        id: 'fox-3',
        type: 'thief_fox',
        x: 120,
        y: 300,
        width: 70,
        height: 65,
        isSatisfied: false,
        isEliminated: false,
        requiredFoodCount: 0,
        foodReceived: 0,
      },
      {
        id: 'puppy-3',
        type: 'puppy',
        x: 240,
        y: 470,
        width: 80,
        height: 70,
        isSatisfied: false,
        isEliminated: false,
        requiredFoodCount: 8,
        foodReceived: 0,
      },
    ],
    initialParticles: [
      // Lava above fox
      ...Array.from({ length: 12 }, (_, i) => ({
        id: `p3-l-${i}`,
        type: 'lava' as ParticleType,
        x: 120 + (i % 3) * 35,
        y: 90 + Math.floor(i / 3) * 25,
        vx: (Math.random() - 0.5) * 10,
        vy: 5,
        radius: 8,
      })),
      // Golden corn treats above puppy
      ...Array.from({ length: 10 }, (_, i) => ({
        id: `p3-g-${i}`,
        type: 'gold' as ParticleType,
        x: 290 + (i % 3) * 35,
        y: 90 + Math.floor(i / 3) * 25,
        vx: (Math.random() - 0.5) * 10,
        vy: 5,
        radius: 8,
      })),
    ],
  },

  // Level 4: Treasure Granary (Vertical Pin Splitter)
  {
    id: 4,
    title: 'Treasure Granary',
    subtitle: 'Slide vertical partition pins to guide gold and corn into Barnaby\'s chest!',
    targetFoodCount: 10,
    barriers: [
      { x1: 100, y1: 80, x2: 100, y2: 320, thickness: 12 },
      { x1: 380, y1: 80, x2: 380, y2: 320, thickness: 12 },
      // Bottom funnel
      { x1: 100, y1: 320, x2: 180, y2: 440, thickness: 12 },
      { x1: 380, y1: 320, x2: 300, y2: 440, thickness: 12 },
      // Puppy chest
      { x1: 180, y1: 440, x2: 180, y2: 560, thickness: 12 },
      { x1: 300, y1: 440, x2: 300, y2: 560, thickness: 12 },
      { x1: 180, y1: 560, x2: 300, y2: 560, thickness: 12 },
    ],
    pins: [
      {
        id: 'pin-4-center',
        orientation: 'vertical',
        x: 235,
        y: 80,
        length: 180,
        thickness: 14,
        pullDirection: 'up',
        pullProgress: 0,
        isPulled: false,
        pullSpeed: 3.5,
        isPulling: false,
        ringX: 242,
        ringY: 70,
        ringRadius: 22,
      },
      {
        id: 'pin-4-gate',
        orientation: 'horizontal',
        x: 165,
        y: 430,
        length: 150,
        thickness: 14,
        pullDirection: 'right',
        pullProgress: 0,
        isPulled: false,
        pullSpeed: 3.5,
        isPulling: false,
        ringX: 325,
        ringY: 437,
        ringRadius: 22,
      },
    ],
    creatures: [
      {
        id: 'puppy-4',
        type: 'puppy',
        x: 200,
        y: 470,
        width: 80,
        height: 70,
        isSatisfied: false,
        isEliminated: false,
        requiredFoodCount: 10,
        foodReceived: 0,
      },
    ],
    initialParticles: [
      ...Array.from({ length: 8 }, (_, i) => ({
        id: `p4-g-${i}`,
        type: 'gold' as ParticleType,
        x: 140 + (i % 2) * 35,
        y: 120 + Math.floor(i / 2) * 30,
        vx: (Math.random() - 0.5) * 10,
        vy: 5,
        radius: 8,
      })),
      ...Array.from({ length: 8 }, (_, i) => ({
        id: `p4-c-${i}`,
        type: 'carrot' as ParticleType,
        x: 280 + (i % 2) * 35,
        y: 120 + Math.floor(i / 2) * 30,
        vx: (Math.random() - 0.5) * 10,
        vy: 5,
        radius: 9,
      })),
    ],
  },

  // Level 5: Barnyard Fortress (The Grand Finale)
  {
    id: 5,
    title: 'Barnyard Fortress',
    subtitle: 'Master the 3-pin sequence: quench the lava, blast the thief, and rescue the feast!',
    targetFoodCount: 10,
    barriers: [
      // Top Left: Water
      { x1: 80, y1: 60, x2: 80, y2: 170, thickness: 12 },
      { x1: 220, y1: 60, x2: 220, y2: 170, thickness: 12 },
      // Top Right: Lava
      { x1: 260, y1: 60, x2: 260, y2: 170, thickness: 12 },
      { x1: 400, y1: 60, x2: 400, y2: 170, thickness: 12 },
      // Middle mixing chamber
      { x1: 150, y1: 240, x2: 150, y2: 360, thickness: 12 },
      { x1: 330, y1: 240, x2: 330, y2: 360, thickness: 12 },
      // Bottom puppy room
      { x1: 170, y1: 440, x2: 170, y2: 560, thickness: 12 },
      { x1: 310, y1: 440, x2: 310, y2: 560, thickness: 12 },
      { x1: 170, y1: 560, x2: 310, y2: 560, thickness: 12 },
    ],
    pins: [
      {
        id: 'pin-5-water',
        orientation: 'horizontal',
        x: 75,
        y: 170,
        length: 150,
        thickness: 14,
        pullDirection: 'left',
        pullProgress: 0,
        isPulled: false,
        pullSpeed: 3.5,
        isPulling: false,
        ringX: 65,
        ringY: 177,
        ringRadius: 22,
      },
      {
        id: 'pin-5-lava',
        orientation: 'horizontal',
        x: 255,
        y: 170,
        length: 150,
        thickness: 14,
        pullDirection: 'right',
        pullProgress: 0,
        isPulled: false,
        pullSpeed: 3.5,
        isPulling: false,
        ringX: 415,
        ringY: 177,
        ringRadius: 22,
      },
      {
        id: 'pin-5-gate',
        orientation: 'horizontal',
        x: 145,
        y: 360,
        length: 190,
        thickness: 14,
        pullDirection: 'right',
        pullProgress: 0,
        isPulled: false,
        pullSpeed: 3.5,
        isPulling: false,
        ringX: 345,
        ringY: 367,
        ringRadius: 22,
      },
    ],
    creatures: [
      {
        id: 'puppy-5',
        type: 'puppy',
        x: 200,
        y: 470,
        width: 80,
        height: 70,
        isSatisfied: false,
        isEliminated: false,
        requiredFoodCount: 10,
        foodReceived: 0,
      },
    ],
    initialParticles: [
      // Water
      ...Array.from({ length: 16 }, (_, i) => ({
        id: `p5-w-${i}`,
        type: 'water' as ParticleType,
        x: 120 + (i % 4) * 25,
        y: 80 + Math.floor(i / 4) * 22,
        vx: (Math.random() - 0.5) * 10,
        vy: 5,
        radius: 7,
      })),
      // Lava
      ...Array.from({ length: 8 }, (_, i) => ({
        id: `p5-l-${i}`,
        type: 'lava' as ParticleType,
        x: 300 + (i % 3) * 30,
        y: 80 + Math.floor(i / 3) * 22,
        vx: (Math.random() - 0.5) * 10,
        vy: 5,
        radius: 8,
      })),
      // Golden carrots in mixing chamber
      ...Array.from({ length: 12 }, (_, i) => ({
        id: `p5-c-${i}`,
        type: 'carrot' as ParticleType,
        x: 180 + (i % 4) * 35,
        y: 280 + Math.floor(i / 4) * 22,
        vx: (Math.random() - 0.5) * 10,
        vy: 5,
        radius: 9,
      })),
    ],
  },
];

export function initPinPullGame(levelId: number = 1): PinPullGameState {
  const config = PIN_LEVELS.find((l) => l.id === levelId) || PIN_LEVELS[0];

  return {
    level: config.id,
    levelConfig: config,
    pins: config.pins.map((p) => ({ ...p })),
    particles: config.initialParticles.map((pt) => ({ ...pt })),
    creatures: config.creatures.map((c) => ({ ...c })),
    steamParticles: [],
    status: 'playing',
    score: 0,
    foodCollected: 0,
    isPaused: false,
  };
}

export function pullPin(state: PinPullGameState, pinId: string): PinPullGameState {
  if (state.status !== 'playing') return state;

  const updatedPins = state.pins.map((pin) => {
    if (pin.id === pinId && !pin.isPulled && !pin.isPulling) {
      return { ...pin, isPulling: true };
    }
    return pin;
  });

  return {
    ...state,
    pins: updatedPins,
  };
}

export function updatePinPullGame(state: PinPullGameState, dt: number): PinPullGameState {
  if (state.status !== 'playing' || state.isPaused) return state;

  const clampedDt = Math.min(0.05, Math.max(0.001, dt));
  const gravity = 550; // px/s^2

  // 1. Update Pulling Pins
  const updatedPins = state.pins.map((pin) => {
    if (!pin.isPulling || pin.isPulled) return pin;

    const nextProgress = Math.min(1, pin.pullProgress + pin.pullSpeed * clampedDt);
    const isPulled = nextProgress >= 1;

    return {
      ...pin,
      pullProgress: nextProgress,
      isPulled,
      isPulling: !isPulled,
    };
  });

  // 2. Update Particles with Physics
  let newParticles: PinParticle[] = [];
  const steamParticles = [...state.steamParticles];
  let newScore = state.score;
  let newFoodCollected = state.foodCollected;
  let gameStatus: 'playing' | 'won' | 'lost' = state.status;

  const puppy = state.creatures.find((c) => c.type === 'puppy');
  const fox = state.creatures.find((c) => c.type === 'thief_fox');

  let puppyFoodCount = puppy ? puppy.foodReceived : 0;
  let foxEliminated = fox ? fox.isEliminated : false;

  for (let i = 0; i < state.particles.length; i++) {
    const p = { ...state.particles[i] };

    // Apply gravity
    p.vy += gravity * clampedDt;

    // Terminal velocity clamp
    p.vy = Math.min(420, p.vy);

    // Apply velocity
    p.x += p.vx * clampedDt;
    p.y += p.vy * clampedDt;

    // Check collisions with active (unpulled or partially pulled) pins
    for (const pin of updatedPins) {
      if (pin.isPulled) continue;

      // Calculate effective pin bounds considering pull progress
      let pinX1 = pin.x;
      let pinY1 = pin.y;
      let pinX2 = pin.orientation === 'horizontal' ? pin.x + pin.length : pin.x + pin.thickness;
      let pinY2 = pin.orientation === 'vertical' ? pin.y + pin.length : pin.y + pin.thickness;

      // Adjust based on pull direction
      if (pin.pullDirection === 'right') {
        pinX1 += pin.length * pin.pullProgress;
      } else if (pin.pullDirection === 'left') {
        pinX2 -= pin.length * pin.pullProgress;
      } else if (pin.pullDirection === 'up') {
        pinY2 -= pin.length * pin.pullProgress;
      } else if (pin.pullDirection === 'down') {
        pinY1 += pin.length * pin.pullProgress;
      }

      // Check particle overlap with pin box
      if (
        p.x + p.radius > pinX1 &&
        p.x - p.radius < pinX2 &&
        p.y + p.radius > pinY1 &&
        p.y - p.radius < pinY2
      ) {
        // Bounce / Rest on top of horizontal pin
        if (pin.orientation === 'horizontal') {
          p.y = pinY1 - p.radius;
          p.vy = -Math.abs(p.vy) * 0.15;
          p.vx += (Math.random() - 0.5) * 20; // gentle rolling
        } else {
          // Horizontal deflection on vertical pin
          if (p.x < (pinX1 + pinX2) * 0.5) {
            p.x = pinX1 - p.radius;
            p.vx = -Math.abs(p.vx) * 0.3;
          } else {
            p.x = pinX2 + p.radius;
            p.vx = Math.abs(p.vx) * 0.3;
          }
        }
      }
    }

    // Check collisions with static chamber barriers
    for (const b of state.levelConfig.barriers) {
      const isVertical = Math.abs(b.x1 - b.x2) < 2;
      const isHorizontal = Math.abs(b.y1 - b.y2) < 2;

      if (isVertical) {
        const minY = Math.min(b.y1, b.y2);
        const maxY = Math.max(b.y1, b.y2);
        if (p.y >= minY && p.y <= maxY) {
          if (Math.abs(p.x - b.x1) < p.radius + b.thickness * 0.5) {
            p.x = p.x < b.x1 ? b.x1 - p.radius - b.thickness * 0.5 : b.x1 + p.radius + b.thickness * 0.5;
            p.vx = -p.vx * 0.35;
          }
        }
      } else if (isHorizontal) {
        const minX = Math.min(b.x1, b.x2);
        const maxX = Math.max(b.x1, b.x2);
        if (p.x >= minX && p.x <= maxX) {
          if (Math.abs(p.y - b.y1) < p.radius + b.thickness * 0.5) {
            p.y = p.y < b.y1 ? b.y1 - p.radius - b.thickness * 0.5 : b.y1 + p.radius + b.thickness * 0.5;
            p.vy = -Math.abs(p.vy) * 0.2;
            p.vx *= 0.85; // friction
          }
        }
      }
    }

    // Water vs Lava chemical quenching
    if (p.type === 'lava') {
      for (const other of state.particles) {
        if (other.type === 'water') {
          const dx = other.x - p.x;
          const dy = other.y - p.y;
          if (Math.hypot(dx, dy) < p.radius + other.radius + 6) {
            p.type = 'stone'; // solidifies into harmless stone
            p.radius = 8;
            other.type = 'stone'; // absorbs water
            // Spawn steam puff
            steamParticles.push({
              x: (p.x + other.x) * 0.5,
              y: (p.y + other.y) * 0.5,
              vx: (Math.random() - 0.5) * 30,
              vy: -50 - Math.random() * 40,
              life: 0,
              maxLife: 1.2,
              size: 14,
            });
            break;
          }
        }
      }
    }

    // Check Creature Targets
    let consumed = false;

    // 1. Fox Interaction
    if (fox && !foxEliminated) {
      if (
        p.x >= fox.x &&
        p.x <= fox.x + fox.width &&
        p.y >= fox.y &&
        p.y <= fox.y + fox.height
      ) {
        if (p.type === 'lava') {
          foxEliminated = true;
          consumed = true;
          newScore += 250;
        } else if (p.type === 'carrot' || p.type === 'gold') {
          // Sneaky fox steals food!
          consumed = true;
        }
      }
    }

    // 2. Puppy Target Interaction
    if (puppy && !consumed) {
      if (
        p.x >= puppy.x &&
        p.x <= puppy.x + puppy.width &&
        p.y >= puppy.y &&
        p.y <= puppy.y + puppy.height
      ) {
        if (p.type === 'lava') {
          // Puppy burned! Game Over
          gameStatus = 'lost';
          consumed = true;
        } else if (p.type === 'carrot' || p.type === 'gold') {
          consumed = true;
          puppyFoodCount++;
          newFoodCollected++;
          newScore += p.type === 'gold' ? 100 : 50;
        } else if (p.type === 'water' || p.type === 'stone') {
          // Harmless splash/thud
          consumed = true;
        }
      }
    }

    if (!consumed && p.y < 640) {
      newParticles.push(p);
    }
  }

  // Update Steam Particles
  const activeSteam = [];
  for (const s of steamParticles) {
    s.life += clampedDt;
    s.x += s.vx * clampedDt;
    s.y += s.vy * clampedDt;
    s.size += clampedDt * 8;
    if (s.life < s.maxLife) {
      activeSteam.push(s);
    }
  }

  // Update Creatures
  const updatedCreatures = state.creatures.map((c) => {
    if (c.type === 'puppy') {
      const satisfied = puppyFoodCount >= c.requiredFoodCount;
      return {
        ...c,
        foodReceived: puppyFoodCount,
        isSatisfied: satisfied,
      };
    }
    if (c.type === 'thief_fox') {
      return {
        ...c,
        isEliminated: foxEliminated,
      };
    }
    return c;
  });

  // Evaluate Win Condition
  if (gameStatus === 'playing') {
    if (puppyFoodCount >= state.levelConfig.targetFoodCount) {
      gameStatus = 'won';
      newScore += 500;
    } else {
      // Check if enough food particles still exist to satisfy target
      const availableFood = newParticles.filter((p) => p.type === 'carrot' || p.type === 'gold').length;
      if (puppyFoodCount + availableFood < state.levelConfig.targetFoodCount) {
        // Starved! Not enough food remaining
        gameStatus = 'lost';
      }
    }
  }

  return {
    ...state,
    pins: updatedPins,
    particles: newParticles,
    creatures: updatedCreatures,
    steamParticles: activeSteam,
    status: gameStatus,
    score: newScore,
    foodCollected: newFoodCollected,
  };
}

export function advanceToNextPinLevel(state: PinPullGameState): PinPullGameState {
  if (state.level >= PIN_LEVELS.length) {
    return state;
  }
  const nextLevelId = state.level + 1;
  const next = initPinPullGame(nextLevelId);
  return {
    ...next,
    score: state.score,
  };
}
