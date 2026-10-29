import { NinjaChickLevel } from './types';

export const NINJA_CHICK_LEVELS: NinjaChickLevel[] = [
  {
    id: 1,
    title: 'Act 1: Lower Barn Loft',
    targetTimeSeconds: 25,
    spawnPoint: { x: 50, y: 380 },
    exitDoor: { x: 740, y: 120, w: 32, h: 48 },
    platforms: [
      // Ground floor
      { x: 0, y: 420, w: 320, h: 60 },
      // Step up platforms
      { x: 260, y: 360, w: 90, h: 20 },
      { x: 380, y: 300, w: 100, h: 20 },
      // Wall climbing corridor
      { x: 520, y: 140, w: 24, h: 220 }, // Left wall
      { x: 590, y: 140, w: 24, h: 220 }, // Right wall
      // Upper loft
      { x: 614, y: 168, w: 180, h: 30 },
      // Perimeter boundaries
      { x: -20, y: 0, w: 20, h: 480 },
      { x: 800, y: 0, w: 20, h: 480 },
      { x: 0, y: 470, w: 800, h: 30 },
    ],
    hazards: [
      // Spikes on ground pit
      { id: 'h1', x: 340, y: 440, radius: 14, type: 'spikes' },
      { id: 'h2', x: 420, y: 440, radius: 14, type: 'spikes' },
    ],
    bouncers: [
      // Trampoline bouncer to help reach high wall corridor
      { id: 'b1', x: 440, y: 290, w: 40, h: 10, bounceForce: -580 },
    ],
    checkpoints: [
      { id: 'cp1', x: 390, y: 275, activated: false },
    ],
    starCoins: [
      { id: 'sc1', x: 300, y: 330, collected: false },
      { id: 'sc2', x: 555, y: 220, collected: false },
      { id: 'sc3', x: 680, y: 140, collected: false },
    ],
  },
  {
    id: 2,
    title: 'Act 2: Windmill Cogs & Saws',
    targetTimeSeconds: 35,
    spawnPoint: { x: 50, y: 380 },
    exitDoor: { x: 740, y: 80, w: 32, h: 48 },
    platforms: [
      // Ground
      { x: 0, y: 420, w: 180, h: 60 },
      // Low slide tunnel (h=22)
      { x: 180, y: 385, w: 140, h: 18 },
      { x: 180, y: 420, w: 140, h: 60 },
      // Mid platforms
      { x: 360, y: 340, w: 90, h: 20 },
      { x: 480, y: 270, w: 90, h: 20 },
      // Vertical ascent shaft
      { x: 600, y: 100, w: 24, h: 260 },
      { x: 680, y: 100, w: 24, h: 260 },
      // Exit perch
      { x: 704, y: 128, w: 100, h: 30 },
      // Borders
      { x: -20, y: 0, w: 20, h: 480 },
      { x: 800, y: 0, w: 20, h: 480 },
      { x: 0, y: 470, w: 800, h: 30 },
    ],
    hazards: [
      // Rotating saw above low slide tunnel
      { id: 's1', x: 250, y: 355, radius: 18, type: 'saw', rotation: 0, rotationSpeed: 5 },
      // Rotating saw between mid platforms
      { id: 's2', x: 440, y: 300, radius: 20, type: 'saw', rotation: 0, rotationSpeed: -4 },
      // Spikes in bottom pit
      { id: 's3', x: 530, y: 440, radius: 14, type: 'spikes' },
    ],
    bouncers: [
      { id: 'b1', x: 520, y: 260, w: 36, h: 10, bounceForce: -600 },
    ],
    checkpoints: [
      { id: 'cp1', x: 380, y: 315, activated: false },
    ],
    starCoins: [
      { id: 'sc1', x: 250, y: 405, collected: false },
      { id: 'sc2', x: 520, y: 230, collected: false },
      { id: 'sc3', x: 640, y: 180, collected: false },
    ],
  },
  {
    id: 3,
    title: 'Act 3: Silo Pinnacle Rush',
    targetTimeSeconds: 45,
    spawnPoint: { x: 50, y: 380 },
    exitDoor: { x: 730, y: 60, w: 32, h: 48 },
    platforms: [
      // Starting base
      { x: 0, y: 420, w: 140, h: 60 },
      // Stepping stones
      { x: 180, y: 360, w: 60, h: 18 },
      { x: 280, y: 300, w: 60, h: 18 },
      { x: 380, y: 240, w: 60, h: 18 },
      // Narrow high ledge
      { x: 490, y: 180, w: 70, h: 18 },
      // Wall slide chute
      { x: 600, y: 80, w: 20, h: 240 },
      { x: 670, y: 80, w: 20, h: 240 },
      // Roof spire
      { x: 690, y: 108, w: 110, h: 30 },
      // Out of bounds
      { x: -20, y: 0, w: 20, h: 480 },
      { x: 800, y: 0, w: 20, h: 480 },
      { x: 0, y: 470, w: 800, h: 30 },
    ],
    hazards: [
      { id: 's1', x: 230, y: 325, radius: 18, type: 'saw', rotation: 0, rotationSpeed: 6 },
      { id: 's2', x: 330, y: 265, radius: 18, type: 'saw', rotation: 0, rotationSpeed: -6 },
      { id: 's3', x: 435, y: 205, radius: 20, type: 'saw', rotation: 0, rotationSpeed: 5 },
      { id: 's4', x: 635, y: 160, radius: 16, type: 'saw', rotation: 0, rotationSpeed: -7 },
    ],
    bouncers: [
      { id: 'b1', x: 395, y: 230, w: 30, h: 10, bounceForce: -620 },
    ],
    checkpoints: [
      { id: 'cp1', x: 290, y: 275, activated: false },
      { id: 'cp2', x: 500, y: 155, activated: false },
    ],
    starCoins: [
      { id: 'sc1', x: 230, y: 290, collected: false },
      { id: 'sc2', x: 435, y: 160, collected: false },
      { id: 'sc3', x: 635, y: 110, collected: false },
    ],
  },
];
