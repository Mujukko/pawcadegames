import { LevelConfig } from '../logic/types';

export const FARM_WIDTH = 640;
export const FARM_HEIGHT = 540;

export const LEVELS: LevelConfig[] = [
  // Level 1: Sunny Meadow Pasture (Gentle introductory park & milk pickup)
  {
    id: 1,
    name: 'Sunny Meadow Pasture',
    difficulty: 'Easy',
    farmWidth: FARM_WIDTH,
    farmHeight: FARM_HEIGHT,
    cowStart: { x: 120, y: 380, rotation: 0 }, // Facing right
    parkingSlot: {
      id: 'stall_1',
      x: 480,
      y: 380,
      width: 100,
      height: 60,
      rotation: 0,
      targetAccuracy: 80,
      requiredHoldSeconds: 0.7,
    },
    obstacles: [
      { id: 'fence_top', type: 'fence', x: 320, y: 180, width: 280, height: 20 },
      { id: 'bale_1', type: 'hay_bale', x: 260, y: 260, width: 44, height: 44 },
    ],
    milkBottles: [
      { id: 'milk_1_1', x: 220, y: 100 },
      { id: 'milk_1_2', x: 380, y: 280 },
    ],
    targetAccuracy: 80,
    hint: 'Collect the 2 milk bottles and guide Bessie into the marked stall!',
  },

  // Level 2: Haystack Alley
  {
    id: 2,
    name: 'Haystack Alley',
    difficulty: 'Easy',
    farmWidth: FARM_WIDTH,
    farmHeight: FARM_HEIGHT,
    cowStart: { x: 100, y: 140, rotation: 0 },
    parkingSlot: {
      id: 'stall_2',
      x: 500,
      y: 400,
      width: 100,
      height: 60,
      rotation: 0,
      targetAccuracy: 80,
      requiredHoldSeconds: 0.7,
    },
    obstacles: [
      { id: 'bale_1', type: 'hay_bale', x: 300, y: 160, width: 48, height: 48 },
      { id: 'bale_2', type: 'hay_bale', x: 300, y: 340, width: 48, height: 48 },
      { id: 'fence_mid', type: 'fence', x: 420, y: 240, width: 20, height: 160 },
    ],
    milkBottles: [
      { id: 'milk_2_1', x: 180, y: 250 },
      { id: 'milk_2_2', x: 300, y: 250 },
      { id: 'milk_2_3', x: 500, y: 200 },
    ],
    targetAccuracy: 80,
    hint: 'Collect all 3 milk bottles while slaloming through the hay bales.',
  },

  // Level 3: Tractor Turnaround
  {
    id: 3,
    name: 'Tractor Turnaround',
    difficulty: 'Medium',
    farmWidth: FARM_WIDTH,
    farmHeight: FARM_HEIGHT,
    cowStart: { x: 120, y: 440, rotation: -Math.PI / 2 }, // Facing up
    parkingSlot: {
      id: 'stall_3',
      x: 480,
      y: 140,
      width: 100,
      height: 60,
      rotation: -Math.PI / 2, // Vertical stall facing up
      targetAccuracy: 80,
      requiredHoldSeconds: 0.8,
    },
    obstacles: [
      { id: 'tractor_1', type: 'tractor', x: 280, y: 260, width: 110, height: 65, rotation: 0 },
      { id: 'fence_corner', type: 'fence', x: 480, y: 300, width: 16, height: 160 },
      { id: 'bale_top', type: 'hay_bale', x: 220, y: 120, width: 44, height: 44 },
    ],
    milkBottles: [
      { id: 'milk_3_1', x: 140, y: 260 },
      { id: 'milk_3_2', x: 360, y: 140 },
      { id: 'milk_3_3', x: 390, y: 350 },
    ],
    targetAccuracy: 80,
    hint: 'Gather the 3 milk bottles around the tractor and dock in the stall.',
  },

  // Level 4: Water Trough Corner
  {
    id: 4,
    name: 'Water Trough Corner',
    difficulty: 'Medium',
    farmWidth: FARM_WIDTH,
    farmHeight: FARM_HEIGHT,
    cowStart: { x: 140, y: 120, rotation: 0 },
    parkingSlot: {
      id: 'stall_4',
      x: 160,
      y: 420,
      width: 100,
      height: 60,
      rotation: 0,
      targetAccuracy: 82,
      requiredHoldSeconds: 0.8,
    },
    obstacles: [
      { id: 'trough_1', type: 'water_trough', x: 340, y: 180, width: 75, height: 35 },
      { id: 'barn_wall_1', type: 'barn_wall', x: 380, y: 340, width: 180, height: 30 },
      { id: 'bale_mid', type: 'hay_bale', x: 260, y: 300, width: 45, height: 45 },
    ],
    milkBottles: [
      { id: 'milk_4_1', x: 240, y: 140 },
      { id: 'milk_4_2', x: 470, y: 190 },
      { id: 'milk_4_3', x: 380, y: 440 },
    ],
    targetAccuracy: 82,
    hint: 'Collect the 3 milk bottles near the trough and make a clean U-turn to park.',
  },

  // Level 5: The Sheep Pen Squeeze
  {
    id: 5,
    name: 'The Sheep Pen Squeeze',
    difficulty: 'Hard',
    farmWidth: FARM_WIDTH,
    farmHeight: FARM_HEIGHT,
    cowStart: { x: 500, y: 120, rotation: Math.PI }, // Facing left
    parkingSlot: {
      id: 'stall_5',
      x: 140,
      y: 420,
      width: 100,
      height: 60,
      rotation: Math.PI / 2, // Vertical stall facing down
      targetAccuracy: 82,
      requiredHoldSeconds: 0.8,
    },
    obstacles: [
      { id: 'sheep_pen', type: 'fence', x: 280, y: 220, width: 150, height: 18 },
      { id: 'sheep_1', type: 'sheep', x: 280, y: 270, width: 42, height: 32 },
      { id: 'tractor_parked', type: 'tractor', x: 160, y: 220, width: 100, height: 60 },
      { id: 'bale_1', type: 'hay_bale', x: 440, y: 360, width: 44, height: 44 },
    ],
    milkBottles: [
      { id: 'milk_5_1', x: 380, y: 120 },
      { id: 'milk_5_2', x: 470, y: 230 },
      { id: 'milk_5_3', x: 280, y: 390 },
    ],
    targetAccuracy: 82,
    hint: 'Carefully grab the milk bottles in the sheep pen squeeze without touching fences.',
  },

  // Level 6: The Barnyard Reverse
  {
    id: 6,
    name: 'The Barnyard Reverse',
    difficulty: 'Hard',
    farmWidth: FARM_WIDTH,
    farmHeight: FARM_HEIGHT,
    cowStart: { x: 460, y: 440, rotation: Math.PI },
    parkingSlot: {
      id: 'stall_6',
      x: 150,
      y: 150,
      width: 100,
      height: 60,
      rotation: 0,
      targetAccuracy: 85,
      requiredHoldSeconds: 0.8,
    },
    obstacles: [
      { id: 'barn_wall_long', type: 'barn_wall', x: 300, y: 280, width: 240, height: 28 },
      { id: 'trough_top', type: 'water_trough', x: 350, y: 130, width: 80, height: 35 },
      { id: 'bale_corner', type: 'hay_bale', x: 150, y: 270, width: 46, height: 46 },
      {
        id: 'sheep_patrol_6',
        type: 'sheep',
        x: 260,
        y: 360,
        width: 42,
        height: 32,
        patrol: {
          axis: 'x',
          min: 240,
          max: 440,
          speed: 46,
        },
      },
    ],
    milkBottles: [
      { id: 'milk_6_1', x: 280, y: 440 },
      { id: 'milk_6_2', x: 520, y: 200 },
      { id: 'milk_6_3', x: 240, y: 130 },
      { id: 'milk_6_4', x: 100, y: 380 },
    ],
    targetAccuracy: 85,
    hint: 'Collect all 4 barnyard bottles and maneuver cleanly into the stall.',
  },

  // Level 7: Windmill Crossing
  {
    id: 7,
    name: 'Windmill Crossing',
    difficulty: 'Hard',
    farmWidth: FARM_WIDTH,
    farmHeight: FARM_HEIGHT,
    cowStart: { x: 100, y: 440, rotation: -Math.PI / 4 },
    parkingSlot: {
      id: 'stall_7',
      x: 480,
      y: 150,
      width: 100,
      height: 60,
      rotation: 0,
      targetAccuracy: 85,
      requiredHoldSeconds: 0.8,
    },
    obstacles: [
      { id: 'fence_1', type: 'fence', x: 260, y: 180, width: 18, height: 160 },
      { id: 'fence_2', type: 'fence', x: 400, y: 340, width: 18, height: 160 },
      { id: 'bale_center', type: 'hay_bale', x: 330, y: 280, width: 48, height: 48 },
      { id: 'trough_corner', type: 'water_trough', x: 160, y: 280, width: 70, height: 30 },
      {
        id: 'sheep_patrol_7',
        type: 'sheep',
        x: 90,
        y: 200,
        width: 42,
        height: 32,
        patrol: {
          axis: 'x',
          min: 80,
          max: 180,
          speed: 44,
        },
      },
    ],
    milkBottles: [
      { id: 'milk_7_1', x: 140, y: 390 },
      { id: 'milk_7_2', x: 330, y: 130 },
      { id: 'milk_7_3', x: 330, y: 430 },
      { id: 'milk_7_4', x: 520, y: 290 },
    ],
    targetAccuracy: 85,
    hint: 'Weave through the windmill chicane to collect all 4 milk bottles.',
  },

  // Level 8: Grand Farm Master
  {
    id: 8,
    name: 'Grand Farm Master',
    difficulty: 'Expert',
    farmWidth: FARM_WIDTH,
    farmHeight: FARM_HEIGHT,
    cowStart: { x: 100, y: 100, rotation: 0 },
    parkingSlot: {
      id: 'stall_8',
      x: 520,
      y: 440,
      width: 95,
      height: 58,
      rotation: 0,
      targetAccuracy: 88,
      requiredHoldSeconds: 0.9,
    },
    obstacles: [
      { id: 'tractor_center', type: 'tractor', x: 310, y: 260, width: 110, height: 65 },
      { id: 'barn_wall_1', type: 'barn_wall', x: 450, y: 160, width: 140, height: 26 },
      { id: 'fence_bottom', type: 'fence', x: 220, y: 400, width: 150, height: 18 },
      { id: 'trough_mid', type: 'water_trough', x: 170, y: 240, width: 75, height: 32 },
      { id: 'bale_tight', type: 'hay_bale', x: 400, y: 410, width: 44, height: 44 },
      {
        id: 'sheep_patrol_8_1',
        type: 'sheep',
        x: 470,
        y: 330,
        width: 42,
        height: 32,
        patrol: {
          axis: 'x',
          min: 460,
          max: 560,
          speed: 48,
        },
      },
      {
        id: 'sheep_patrol_8_2',
        type: 'sheep',
        x: 100,
        y: 470,
        width: 42,
        height: 32,
        patrol: {
          axis: 'x',
          min: 90,
          max: 210,
          speed: 42,
        },
      },
    ],
    milkBottles: [
      { id: 'milk_8_1', x: 240, y: 110 },
      { id: 'milk_8_2', x: 520, y: 250 },
      { id: 'milk_8_3', x: 120, y: 340 },
      { id: 'milk_8_4', x: 360, y: 480 },
    ],
    targetAccuracy: 88,
    hint: 'Grand Master challenge! Collect all 4 tricky milk bottles without crashing.',
  },
];
