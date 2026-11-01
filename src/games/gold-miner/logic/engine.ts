import { ClawState, GoldMinerState, MineItem } from './types';

export const MINE_WIDTH = 800;
export const MINE_HEIGHT = 480;
export const CLAW_ORIGIN_X = 400;
export const CLAW_ORIGIN_Y = 70;
export const SWING_SPEED = 1.35;
export const SHOOT_SPEED = 380;
export const BASE_REEL_SPEED = 280;
export const TOTAL_SHIFTS = 4;

export const SHIFT_TARGETS = [650, 1400, 2200, 3200];

export function createInitialClaw(): ClawState {
  return {
    originX: CLAW_ORIGIN_X,
    originY: CLAW_ORIGIN_Y,
    angle: 0,
    angleDir: 1,
    length: 30,
    maxLength: 430,
    state: 'swinging',
    grabbedItem: null,
  };
}

export function getShiftItems(shift: number): MineItem[] {
  switch (shift) {
    case 1:
      return [
        { id: 'g_s1', type: 'small_gold', x: 280, y: 190, radius: 14, value: 100, weight: 1.0, collected: false },
        { id: 'g_s2', type: 'small_gold', x: 520, y: 210, radius: 14, value: 100, weight: 1.0, collected: false },
        { id: 'g_m1', type: 'medium_gold', x: 380, y: 260, radius: 22, value: 250, weight: 2.2, collected: false },
        { id: 'g_m2', type: 'medium_gold', x: 200, y: 340, radius: 22, value: 250, weight: 2.2, collected: false },
        { id: 'g_b1', type: 'giant_gold', x: 620, y: 350, radius: 34, value: 500, weight: 4.5, collected: false },
        { id: 'r_1', type: 'rock', x: 400, y: 360, radius: 26, value: 20, weight: 3.5, collected: false },
        { id: 'd_1', type: 'diamond', x: 480, y: 380, radius: 11, value: 600, weight: 0.8, collected: false },
      ];

    case 2:
      return [
        { id: 'd_1', type: 'diamond', x: 340, y: 220, radius: 11, value: 600, weight: 0.8, collected: false },
        { id: 'd_2', type: 'diamond', x: 460, y: 240, radius: 11, value: 600, weight: 0.8, collected: false },
        { id: 'g_b1', type: 'giant_gold', x: 220, y: 360, radius: 34, value: 500, weight: 4.5, collected: false },
        { id: 'g_b2', type: 'giant_gold', x: 580, y: 350, radius: 34, value: 500, weight: 4.5, collected: false },
        { id: 'tnt_1', type: 'tnt', x: 400, y: 320, radius: 18, value: 0, weight: 1.0, collected: false },
        { id: 'r_1', type: 'rock', x: 370, y: 350, radius: 28, value: 20, weight: 3.8, collected: false },
        { id: 'r_2', type: 'rock', x: 430, y: 350, radius: 28, value: 20, weight: 3.8, collected: false },
        { id: 'mys_1', type: 'mystery', x: 500, y: 380, radius: 16, value: 350, weight: 1.5, collected: false },
      ];

    case 3:
      return [
        { id: 'd_1', type: 'diamond', x: 250, y: 220, radius: 11, value: 600, weight: 0.8, collected: false },
        { id: 'd_2', type: 'diamond', x: 550, y: 220, radius: 11, value: 600, weight: 0.8, collected: false },
        { id: 'g_b1', type: 'giant_gold', x: 400, y: 340, radius: 34, value: 500, weight: 4.5, collected: false },
        { id: 'g_m1', type: 'medium_gold', x: 310, y: 370, radius: 22, value: 250, weight: 2.2, collected: false },
        { id: 'g_m2', type: 'medium_gold', x: 490, y: 370, radius: 22, value: 250, weight: 2.2, collected: false },
        { id: 'r_1', type: 'rock', x: 400, y: 240, radius: 30, value: 20, weight: 4.0, collected: false },
        { id: 'tnt_1', type: 'tnt', x: 280, y: 320, radius: 18, value: 0, weight: 1.0, collected: false },
      ];

    case 4:
    default:
      return [
        { id: 'd_1', type: 'diamond', x: 400, y: 200, radius: 11, value: 600, weight: 0.8, collected: false },
        { id: 'd_2', type: 'diamond', x: 300, y: 300, radius: 11, value: 600, weight: 0.8, collected: false },
        { id: 'd_3', type: 'diamond', x: 500, y: 300, radius: 11, value: 600, weight: 0.8, collected: false },
        { id: 'g_b1', type: 'giant_gold', x: 200, y: 360, radius: 34, value: 500, weight: 4.5, collected: false },
        { id: 'g_b2', type: 'giant_gold', x: 600, y: 360, radius: 34, value: 500, weight: 4.5, collected: false },
        { id: 'tnt_1', type: 'tnt', x: 400, y: 320, radius: 18, value: 0, weight: 1.0, collected: false },
        { id: 'r_1', type: 'rock', x: 350, y: 370, radius: 28, value: 20, weight: 3.8, collected: false },
        { id: 'r_2', type: 'rock', x: 450, y: 370, radius: 28, value: 20, weight: 3.8, collected: false },
      ];
  }
}

export function initGoldMinerGame(shift: number = 1, currentMoney: number = 0, currentDynamite: number = 1): GoldMinerState {
  const safeShift = Math.max(1, Math.min(TOTAL_SHIFTS, shift));
  const targetMoney = SHIFT_TARGETS[safeShift - 1];

  return {
    shift: safeShift,
    targetMoney,
    money: currentMoney,
    timeLeft: 60,
    dynamiteCount: currentDynamite,
    hasStrengthDrink: false,
    claw: createInitialClaw(),
    items: getShiftItems(safeShift),
    status: 'playing',
    totalShifts: TOTAL_SHIFTS,
  };
}

export function triggerClawShoot(state: GoldMinerState): GoldMinerState {
  if (state.claw.state !== 'swinging' || state.status !== 'playing') {
    return state;
  }
  return {
    ...state,
    claw: {
      ...state.claw,
      state: 'shooting',
    },
  };
}

export function useDynamite(state: GoldMinerState): GoldMinerState {
  if (
    state.status !== 'playing' ||
    state.dynamiteCount <= 0 ||
    state.claw.state !== 'reeling' ||
    !state.claw.grabbedItem
  ) {
    return state;
  }

  // Blow up currently held item!
  return {
    ...state,
    dynamiteCount: state.dynamiteCount - 1,
    claw: {
      ...state.claw,
      grabbedItem: null,
    },
  };
}

export function stepGoldMinerGame(state: GoldMinerState, dt: number): GoldMinerState {
  if (state.status !== 'playing') {
    return state;
  }

  const safeDt = Math.min(dt, 0.05);
  const timeLeft = Math.max(0, state.timeLeft - safeDt);

  // Time-up Check
  if (timeLeft <= 0) {
    if (state.money >= state.targetMoney) {
      const isVictory = state.shift >= TOTAL_SHIFTS;
      return {
        ...state,
        timeLeft: 0,
        status: isVictory ? 'victory' : 'shift_clear',
      };
    } else {
      return {
        ...state,
        timeLeft: 0,
        status: 'game_over',
      };
    }
  }

  const claw: ClawState = { ...state.claw };
  let items = [...state.items];
  let money = state.money;

  // 1. Swinging State
  if (claw.state === 'swinging') {
    claw.angle += claw.angleDir * SWING_SPEED * safeDt;
    if (claw.angle >= 1.25) {
      claw.angle = 1.25;
      claw.angleDir = -1;
    } else if (claw.angle <= -1.25) {
      claw.angle = -1.25;
      claw.angleDir = 1;
    }
    return { ...state, claw, timeLeft };
  }

  // 2. Shooting State
  if (claw.state === 'shooting') {
    claw.length += SHOOT_SPEED * safeDt;

    const tipX = claw.originX + Math.sin(claw.angle) * claw.length;
    const tipY = claw.originY + Math.cos(claw.angle) * claw.length;

    // Boundary check
    if (claw.length >= claw.maxLength || tipX <= 20 || tipX >= MINE_WIDTH - 20 || tipY >= MINE_HEIGHT - 10) {
      claw.state = 'reeling';
      claw.grabbedItem = null;
      return { ...state, claw, timeLeft };
    }

    // Check hit on active items
    for (let i = 0; i < items.length; i++) {
      const itm = items[i];
      if (itm.collected || itm.exploded) continue;

      const dist = Math.hypot(tipX - itm.x, tipY - itm.y);
      if (dist <= itm.radius + 14) {
        // Hit!
        if (itm.type === 'tnt') {
          // Explode all items within radius 95
          items = items.map((other) => {
            if (other.id === itm.id) return { ...other, exploded: true };
            const d = Math.hypot(other.x - itm.x, other.y - itm.y);
            if (d < 95) return { ...other, exploded: true };
            return other;
          });
          claw.state = 'reeling';
          claw.grabbedItem = null;
        } else {
          // Grab item
          items = items.filter((x) => x.id !== itm.id);
          claw.state = 'reeling';
          claw.grabbedItem = itm;
        }
        break;
      }
    }

    return { ...state, claw, items, timeLeft };
  }

  // 3. Reeling State
  if (claw.state === 'reeling') {
    let reelSpeed = BASE_REEL_SPEED;
    if (claw.grabbedItem) {
      const weightFactor = claw.grabbedItem.weight * 0.45 + 0.55;
      reelSpeed = BASE_REEL_SPEED / weightFactor;
      if (state.hasStrengthDrink) {
        reelSpeed = Math.max(reelSpeed, 240);
      }
    }

    claw.length = Math.max(30, claw.length - reelSpeed * safeDt);

    // Returned to winch
    if (claw.length <= 30) {
      claw.state = 'swinging';
      if (claw.grabbedItem) {
        money += claw.grabbedItem.value;
        claw.grabbedItem = null;
      }
    }

    return { ...state, claw, money, timeLeft };
  }

  return { ...state, timeLeft };
}
