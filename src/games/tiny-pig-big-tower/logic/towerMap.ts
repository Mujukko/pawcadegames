import { TowerBlock, MovingLaser, CheckpointFlag } from './types';

export const CHECKPOINTS: CheckpointFlag[] = [
  { id: 'cp_0', x: 80, y: 1360, floorName: 'Silo Entrance', reached: true },
  { id: 'cp_1', x: 420, y: 1060, floorName: 'Crumbling Lofts', reached: false },
  { id: 'cp_2', x: 80, y: 720, floorName: 'Electric Shaft', reached: false },
  { id: 'cp_3', x: 420, y: 380, floorName: 'Pinnacle Gauntlet', reached: false },
];

export const INITIAL_BLOCKS: TowerBlock[] = [
  // Outer Silo Walls (x: 40 to 460)
  { id: 'wall_left', type: 'solid', x: 20, y: 0, width: 20, height: 1450 },
  { id: 'wall_right', type: 'solid', x: 460, y: 0, width: 20, height: 1450 },
  { id: 'floor_base', type: 'solid', x: 20, y: 1420, width: 460, height: 30 },

  // --- SECTION 1: Silo Entrance & Shaft (y: 1400 -> 1100) ---
  { id: 's1_plat1', type: 'solid', x: 40, y: 1380, width: 140, height: 16 },
  { id: 's1_plat2', type: 'solid', x: 240, y: 1340, width: 120, height: 16 },
  { id: 's1_plat3', type: 'solid', x: 100, y: 1290, width: 100, height: 16 },
  // Vertical Wall Jump Chute
  { id: 's1_chute_l', type: 'solid', x: 280, y: 1120, width: 16, height: 160 },
  { id: 's1_chute_r', type: 'solid', x: 350, y: 1120, width: 16, height: 160 },
  { id: 's1_exit_plat', type: 'solid', x: 340, y: 1100, width: 120, height: 16 },

  // --- SECTION 2: Crumbling Lofts & Syrup Pit (y: 1100 -> 750) ---
  { id: 's2_lava', type: 'lava', x: 40, y: 1085, width: 340, height: 15 },
  { id: 's2_crumb1', type: 'crumble', x: 80, y: 1030, width: 60, height: 14 },
  { id: 's2_crumb2', type: 'crumble', x: 200, y: 990, width: 60, height: 14 },
  { id: 's2_tramp', type: 'trampoline', x: 320, y: 960, width: 50, height: 14 },
  { id: 's2_plat4', type: 'solid', x: 180, y: 880, width: 100, height: 16 },
  { id: 's2_crumb3', type: 'crumble', x: 70, y: 820, width: 60, height: 14 },
  { id: 's2_exit_plat', type: 'solid', x: 40, y: 760, width: 140, height: 16 },

  // --- SECTION 3: Electric Shaft & Lasers (y: 750 -> 400) ---
  { id: 's3_chute_l', type: 'solid', x: 160, y: 440, width: 16, height: 300 },
  { id: 's3_chute_r', type: 'solid', x: 240, y: 440, width: 16, height: 300 },
  { id: 's3_mid_plat', type: 'solid', x: 290, y: 580, width: 90, height: 16 },
  { id: 's3_tramp2', type: 'trampoline', x: 400, y: 520, width: 45, height: 14 },
  { id: 's3_exit_plat', type: 'solid', x: 340, y: 420, width: 120, height: 16 },

  // --- SECTION 4: Pinnacle Gauntlet & Golden Acorn (y: 400 -> 50) ---
  { id: 's4_crumb1', type: 'crumble', x: 240, y: 350, width: 50, height: 14 },
  { id: 's4_plat1', type: 'solid', x: 100, y: 290, width: 80, height: 16 },
  { id: 's4_crumb2', type: 'crumble', x: 220, y: 230, width: 50, height: 14 },
  { id: 's4_tramp3', type: 'trampoline', x: 340, y: 180, width: 45, height: 14 },
  { id: 's4_altar', type: 'solid', x: 180, y: 100, width: 120, height: 20 },
  // The Prize!
  { id: 's4_acorn', type: 'golden_acorn', x: 230, y: 65, width: 20, height: 24 },
];

export const INITIAL_LASERS: MovingLaser[] = [
  {
    id: 'laser_1',
    x: 80,
    y: 1220,
    width: 60,
    height: 10,
    minX: 60,
    maxX: 200,
    speed: 80,
    direction: 1,
  },
  {
    id: 'laser_2',
    x: 280,
    y: 660,
    width: 70,
    height: 10,
    minX: 260,
    maxX: 420,
    speed: 95,
    direction: 1,
  },
  {
    id: 'laser_3',
    x: 120,
    y: 200,
    width: 80,
    height: 10,
    minX: 80,
    maxX: 280,
    speed: 110,
    direction: 1,
  },
];
