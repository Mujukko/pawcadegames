import { TrackData, TerrainSegment } from './types';

function createCurvedTerrain(
  points: [number, number][],
  surfaceType: TerrainSegment['surfaceType'] = 'grass'
): TerrainSegment[] {
  const segments: TerrainSegment[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    segments.push({
      x1: points[i][0],
      y1: points[i][1],
      x2: points[i + 1][0],
      y2: points[i + 1][1],
      surfaceType,
    });
  }
  return segments;
}

export const TRACK_1: TrackData = {
  id: 'track_1',
  name: 'Pasture Splash Meadows',
  description: 'Gentle grassy hills, water puddle skips, and wooden launch ramps.',
  targetTimes: {
    threeStars: 18.0,
    twoStars: 25.0,
  },
  startX: 100,
  startY: 420,
  finishX: 2500,
  finishY: 420,
  terrain: [
    ...createCurvedTerrain([
      [0, 450],
      [300, 450],
      [450, 420],
      [600, 360],
      [750, 320], // Ramp crest
      [850, 310], // Jump lip
    ], 'grass'),
    ...createCurvedTerrain([
      [1050, 440], // Landing zone
      [1250, 450],
      [1400, 450],
      [1500, 480], // Water pond bank
      [1650, 480],
      [1750, 450],
    ], 'grass'),
    ...createCurvedTerrain([
      [1850, 430],
      [1950, 380], // Wooden ramp
      [2050, 340],
    ], 'wood'),
    ...createCurvedTerrain([
      [2200, 450], // Final plateau
      [2700, 450],
    ], 'grass'),
  ],
  hazards: [
    {
      id: 'h1_water',
      type: 'water_pit',
      x: 1500,
      y: 470,
      width: 150,
      height: 30,
    },
    {
      id: 'h1_spring',
      type: 'springboard',
      x: 2020,
      y: 335,
      width: 40,
      height: 20,
    },
  ],
  checkpoints: [
    { id: 'cp_1_1', x: 1150, y: 440, passed: false },
    { id: 'cp_1_2', x: 1800, y: 450, passed: false },
  ],
};

export const TRACK_2: TrackData = {
  id: 'track_2',
  name: 'Windmill Ridge & Timber Bridge',
  description: 'Steep hill drops, a wooden suspension bridge, and turbo speed pads.',
  targetTimes: {
    threeStars: 22.0,
    twoStars: 30.0,
  },
  startX: 100,
  startY: 320,
  finishX: 3000,
  finishY: 450,
  terrain: [
    ...createCurvedTerrain([
      [0, 350],
      [250, 350],
      [400, 460], // Steep drop
      [600, 500],
      [750, 500],
      [900, 430], // Hill climb
      [1050, 370],
    ], 'grass'),
    ...createCurvedTerrain([
      [1050, 370],
      [1200, 375], // Timber bridge
      [1350, 380],
      [1500, 375],
      [1600, 370],
    ], 'wood'),
    ...createCurvedTerrain([
      [1650, 440],
      [1800, 480],
      [1950, 480],
      [2100, 420], // Leap ramp
      [2250, 350],
    ], 'grass'),
    ...createCurvedTerrain([
      [2450, 450],
      [3200, 450],
    ], 'grass'),
  ],
  hazards: [
    {
      id: 'h2_boost1',
      type: 'speed_boost',
      x: 650,
      y: 495,
      width: 60,
      height: 15,
    },
    {
      id: 'h2_water1',
      type: 'water_pit',
      x: 1800,
      y: 470,
      width: 150,
      height: 30,
    },
    {
      id: 'h2_spring',
      type: 'springboard',
      x: 2220,
      y: 345,
      width: 40,
      height: 20,
    },
  ],
  checkpoints: [
    { id: 'cp_2_1', x: 800, y: 500, passed: false },
    { id: 'cp_2_2', x: 1700, y: 440, passed: false },
    { id: 'cp_2_3', x: 2500, y: 450, passed: false },
  ],
};

export const TRACK_3: TrackData = {
  id: 'track_3',
  name: 'Barnyard Rooftops & TNT Hay',
  description: 'Acrobatic barn rooftop leaps, explosive TNT barrel launches, and mega air!',
  targetTimes: {
    threeStars: 26.0,
    twoStars: 36.0,
  },
  startX: 100,
  startY: 450,
  finishX: 3500,
  finishY: 450,
  terrain: [
    ...createCurvedTerrain([
      [0, 480],
      [250, 480],
      [400, 420],
      [550, 360], // Sky launch ramp
    ], 'wood'),
    ...createCurvedTerrain([
      [750, 260], // Barn roof 1
      [1050, 260],
      [1150, 290],
    ], 'wood'),
    ...createCurvedTerrain([
      [1300, 460], // Valley floor
      [1500, 460],
      [1650, 400],
      [1800, 330], // High kicker
    ], 'grass'),
    ...createCurvedTerrain([
      [2050, 240], // Barn roof 2
      [2300, 240],
      [2400, 270],
    ], 'wood'),
    ...createCurvedTerrain([
      [2600, 460], // Final splash lake
      [2750, 490],
      [2950, 490],
      [3100, 460],
      [3600, 460],
    ], 'grass'),
  ],
  hazards: [
    {
      id: 'h3_tnt1',
      type: 'tnt_barrel',
      x: 1480,
      y: 440,
      width: 32,
      height: 32,
    },
    {
      id: 'h3_boost1',
      type: 'speed_boost',
      x: 2150,
      y: 235,
      width: 60,
      height: 15,
    },
    {
      id: 'h3_water1',
      type: 'water_pit',
      x: 2750,
      y: 480,
      width: 200,
      height: 35,
    },
  ],
  checkpoints: [
    { id: 'cp_3_1', x: 800, y: 260, passed: false },
    { id: 'cp_3_2', x: 1600, y: 440, passed: false },
    { id: 'cp_3_3', x: 2650, y: 460, passed: false },
  ],
};

export const ALL_TRACKS: TrackData[] = [TRACK_1, TRACK_2, TRACK_3];
