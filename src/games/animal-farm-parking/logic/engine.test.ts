import { describe, expect, test } from 'bun:test';
import {
  createInitialState,
  updateGamePhysics,
  calculateParkingAccuracy,
  checkCollisions,
  normalizeAngle,
  updateObstacles,
} from './engine';
import { LEVELS } from '../levels/levelsData';
import { PlayerInput } from './types';

describe('Animal Farm Parking Core Engine', () => {
  const level1 = LEVELS[0]!;

  test('Initial state initializes properly', () => {
    const state = createInitialState(level1);

    expect(state.levelId).toBe(1);
    expect(state.cow.health).toBe(100);
    expect(state.cow.x).toBe(level1.cowStart.x);
    expect(state.cow.y).toBe(level1.cowStart.y);
    expect(state.parkingAccuracy).toBe(0);
    expect(state.isCompleted).toBe(false);
    expect(state.isGameOver).toBe(false);
  });

  test('Forward, reverse, and steering update cow physics properly', () => {
    let state = createInitialState(level1);

    // Forward drive
    const forwardInput: PlayerInput = {
      forward: true,
      reverse: false,
      turnLeft: false,
      turnRight: false,
      brake: false,
    };

    state = updateGamePhysics(state, forwardInput, 0.1, level1);
    expect(state.cow.speed).toBeGreaterThan(0);
    expect(state.cow.x).toBeGreaterThan(level1.cowStart.x);

    // Steer right while moving
    const steerInput: PlayerInput = {
      forward: true,
      reverse: false,
      turnLeft: false,
      turnRight: true,
      brake: false,
    };

    const prevRot = state.cow.rotation;
    state = updateGamePhysics(state, steerInput, 0.1, level1);
    expect(state.cow.rotation).toBeGreaterThan(prevRot);

    // Reverse drive
    const reverseInput: PlayerInput = {
      forward: false,
      reverse: true,
      turnLeft: false,
      turnRight: false,
      brake: false,
    };

    state.cow.speed = 0;
    state = updateGamePhysics(state, reverseInput, 0.1, level1);
    expect(state.cow.speed).toBeLessThan(0);
  });

  test('4-directional movement (Up, Down, Left, Right) updates position and auto-orients rotation', () => {
    // 1. Move Up (y decreases)
    let state = createInitialState(level1);
    const initialY = state.cow.y;
    state = updateGamePhysics(state, { up: true }, 0.1, level1);
    expect(state.cow.y).toBeLessThan(initialY);
    expect(state.cow.rotation).toBeCloseTo(-Math.PI / 2, 1);

    // 2. Move Down (y increases)
    state = createInitialState(level1);
    state = updateGamePhysics(state, { down: true }, 0.1, level1);
    expect(state.cow.y).toBeGreaterThan(initialY);
    expect(state.cow.rotation).toBeCloseTo(Math.PI / 2, 1);

    // 3. Move Left (x decreases)
    state = createInitialState(level1);
    const initialX = state.cow.x;
    state = updateGamePhysics(state, { left: true }, 0.25, level1);
    expect(state.cow.x).toBeLessThan(initialX);
    expect(Math.abs(state.cow.rotation)).toBeCloseTo(Math.PI, 1);

    // 4. Move Right (x increases)
    state = createInitialState(level1);
    state = updateGamePhysics(state, { right: true }, 0.1, level1);
    expect(state.cow.x).toBeGreaterThan(initialX);
    expect(state.cow.rotation).toBeCloseTo(0, 1);
  });

  test('Parking accuracy computes high % when inside slot and 0% far away', () => {
    const state = createInitialState(level1);
    const slot = level1.parkingSlot;

    // Initially far away
    const farAccuracy = calculateParkingAccuracy(state.cow, slot);
    expect(farAccuracy).toBe(0);

    // Positioned directly in the center of the slot
    const alignedCow = {
      ...state.cow,
      x: slot.x,
      y: slot.y,
      rotation: slot.rotation,
    };
    const perfectAccuracy = calculateParkingAccuracy(alignedCow, slot);
    expect(perfectAccuracy).toBeGreaterThanOrEqual(95);

    // Reverse-in parking also valid
    const reverseParkedCow = {
      ...state.cow,
      x: slot.x,
      y: slot.y,
      rotation: normalizeAngle(slot.rotation + Math.PI),
    };
    const reverseAccuracy = calculateParkingAccuracy(reverseParkedCow, slot);
    expect(reverseAccuracy).toBeGreaterThanOrEqual(95);

    // Sideways / perpendicular parking (90 degrees off) must be rejected with 0% accuracy
    const perpendicularCow = {
      ...state.cow,
      x: slot.x,
      y: slot.y,
      rotation: normalizeAngle(slot.rotation + Math.PI / 2),
    };
    const perpendicularAccuracy = calculateParkingAccuracy(perpendicularCow, slot);
    expect(perpendicularAccuracy).toBe(0);

    // Diagonal parking (> 35 degrees off) must also be rejected with 0% accuracy
    const diagonalCow = {
      ...state.cow,
      x: slot.x,
      y: slot.y,
      rotation: normalizeAngle(slot.rotation + Math.PI * (45 / 180)),
    };
    const diagonalAccuracy = calculateParkingAccuracy(diagonalCow, slot);
    expect(diagonalAccuracy).toBe(0);
  });

  test('Obstacle collisions drain health continuously', () => {
    let state = createInitialState(level1);
    const obs = level1.obstacles[0]!;

    // Teleport cow directly into obstacle
    state.cow.x = obs.x;
    state.cow.y = obs.y;

    const noInput: PlayerInput = {
      forward: false,
      reverse: false,
      turnLeft: false,
      turnRight: false,
      brake: false,
    };

    state = updateGamePhysics(state, noInput, 0.5, level1);
    expect(state.isColliding).toBe(true);
    expect(state.cow.health).toBeLessThan(100);

    // Continued contact drains health until game over
    state.cow.health = 5;
    state = updateGamePhysics(state, noInput, 0.5, level1);
    expect(state.cow.health).toBe(0);
    expect(state.isGameOver).toBe(true);
  });

  test('Achieving target accuracy requires collecting all milk bottles before completion', () => {
    let state = createInitialState(level1);
    const slot = level1.parkingSlot;

    // Place cow perfectly in slot with 0 speed, but with 0 milk collected
    state.cow.x = slot.x;
    state.cow.y = slot.y;
    state.cow.rotation = slot.rotation;
    state.cow.speed = 0;

    const noInput: PlayerInput = {
      forward: false,
      reverse: false,
      turnLeft: false,
      turnRight: false,
      brake: false,
    };

    // Hold for required duration without collecting milk
    const holdTime = slot.requiredHoldSeconds + 0.1;
    state = updateGamePhysics(state, noInput, holdTime, level1);

    expect(state.parkingAccuracy).toBeGreaterThanOrEqual(level1.targetAccuracy);
    // MUST NOT complete because milk bottles are still uncollected
    expect(state.isCompleted).toBe(false);

    // Now collect all milk bottles
    state.milkBottles = state.milkBottles.map((b) => ({ ...b, collected: true }));
    state.milkCollected = state.totalMilk;

    // Hold for required duration again
    state = updateGamePhysics(state, noInput, holdTime, level1);
    expect(state.isCompleted).toBe(true);
  });

  test('Milk bottles are collected when Bessie moves over them', () => {
    let state = createInitialState(level1);
    expect(state.milkCollected).toBe(0);
    expect(state.milkBottles.length).toBe(2);

    const firstBottle = state.milkBottles[0]!;

    // Move cow directly to first milk bottle position
    state.cow.x = firstBottle.x;
    state.cow.y = firstBottle.y;

    state = updateGamePhysics(state, {}, 0.05, level1);

    expect(state.milkCollected).toBe(1);
    expect(state.justCollectedMilkId).toBe(firstBottle.id);
    expect(state.milkBottles[0]!.collected).toBe(true);
  });

  test('Smooth wall sliding allows diagonal sliding without oscillation', () => {
    let state = createInitialState(level1);

    // Place cow below the long fence_top (x: 320, y: 180, w: 280, h: 20; bottom edge is y: 190)
    // Moving diagonally (right and up) against the fence bottom
    state.cow.x = 350;
    state.cow.y = 212;
    state.cow.rotation = 0;
    state.cow.speed = 100;

    const diagonalInput: PlayerInput = {
      right: true,
      up: true,
    };

    const initialX = state.cow.x;
    state = updateGamePhysics(state, diagonalInput, 0.05, level1);

    // X axis should still advance smoothly even when Y axis hits fence boundary
    expect(state.cow.x).toBeGreaterThan(initialX);
    // Speed must not invert into negative oscillation
    expect(state.cow.speed).toBeGreaterThanOrEqual(0);
  });

  test('All 8 levels have clean spawn points free of obstacle collisions', () => {
    for (const lvl of LEVELS) {
      const state = createInitialState(lvl);
      const { isColliding, collidingWithIds } = checkCollisions(
        state.cow,
        lvl.obstacles,
        lvl.farmWidth,
        lvl.farmHeight
      );

      if (isColliding) {
        throw new Error(
          `Level ${lvl.id} (${lvl.name}) spawns cow inside obstacle: ${collidingWithIds.join(', ')}`
        );
      }
      expect(isColliding).toBe(false);
    }
  });

  test('All milk bottles across all 8 levels are strictly clear of obstacles and perimeter', () => {
    for (const lvl of LEVELS) {
      for (const bottle of lvl.milkBottles) {
        // Must be well within pasture boundaries
        expect(bottle.x).toBeGreaterThanOrEqual(60);
        expect(bottle.x).toBeLessThanOrEqual(lvl.farmWidth - 60);
        expect(bottle.y).toBeGreaterThanOrEqual(60);
        expect(bottle.y).toBeLessThanOrEqual(lvl.farmHeight - 60);

        // Must not touch or be within 40px of any obstacle
        for (const obs of lvl.obstacles) {
          const hw = obs.width / 2;
          const hh = obs.height / 2;
          const dx = Math.max(0, Math.abs(bottle.x - obs.x) - hw);
          const dy = Math.max(0, Math.abs(bottle.y - obs.y) - hh);
          const dist = Math.hypot(dx, dy);

          if (dist < 40) {
            throw new Error(
              `Level ${lvl.id} (${lvl.name}) milk bottle ${bottle.id} is too close (${Math.round(dist)}px) to obstacle ${obs.id}`
            );
          }
          expect(dist).toBeGreaterThanOrEqual(40);
        }

        // Must not overlap parking stall
        const distToStall = Math.hypot(bottle.x - lvl.parkingSlot.x, bottle.y - lvl.parkingSlot.y);
        expect(distToStall).toBeGreaterThanOrEqual(60);
      }
    }
  });

  test('updateObstacles accurately performs linear back-and-forth ping-pong patrol', () => {
    const testObstacles = [
      {
        id: 'test_sheep_x',
        type: 'sheep' as const,
        x: 200,
        y: 300,
        width: 42,
        height: 32,
        patrol: {
          axis: 'x' as const,
          min: 200,
          max: 400,
          speed: 50, // 200px range @ 50px/s -> 4s one way, 8s full cycle
        },
      },
    ];

    // At t = 0s: starts at min (200), moving forward (+X), facing 0 rad
    const t0 = updateObstacles(testObstacles, 0);
    expect(t0[0]!.x).toBe(200);
    expect(t0[0]!.rotation).toBe(0);

    // At t = 2s: at midpoint (300), still moving forward, facing 0 rad
    const t2 = updateObstacles(testObstacles, 2);
    expect(t2[0]!.x).toBe(300);
    expect(t2[0]!.rotation).toBe(0);

    // At t = 4s: at max boundary (400), turning around, facing PI rad (left)
    const t4 = updateObstacles(testObstacles, 4);
    expect(t4[0]!.x).toBe(400);
    expect(t4[0]!.rotation).toBe(Math.PI);

    // At t = 6s: at midpoint (300) moving backward (-X), facing PI rad
    const t6 = updateObstacles(testObstacles, 6);
    expect(t6[0]!.x).toBe(300);
    expect(t6[0]!.rotation).toBe(Math.PI);

    // At t = 8s: full cycle complete, back at min (200) facing right
    const t8 = updateObstacles(testObstacles, 8);
    expect(t8[0]!.x).toBe(200);
    expect(t8[0]!.rotation).toBe(0);
  });

  test('Patrolling sheep in Level 6, 7, 8 remain clear of static obstacles throughout their entire patrol interval', () => {
    for (const lvl of LEVELS.filter((l) => l.id >= 6)) {
      const movingSheep = lvl.obstacles.filter((o) => o.type === 'sheep' && o.patrol);
      expect(movingSheep.length).toBeGreaterThanOrEqual(1);

      for (const sheep of movingSheep) {
        const { axis, min, max, speed } = sheep.patrol!;
        const legTime = (max - min) / speed;
        const cycleTime = legTime * 2;

        // Sample 20 time steps throughout the complete cycle
        for (let s = 0; s <= 20; s++) {
          const sampleTime = (s / 20) * cycleTime;
          const updated = updateObstacles([sheep], sampleTime)[0]!;

          // 1. Must stay within pasture perimeter
          expect(updated.x).toBeGreaterThanOrEqual(sheep.width / 2 + 10);
          expect(updated.x).toBeLessThanOrEqual(lvl.farmWidth - sheep.width / 2 - 10);
          expect(updated.y).toBeGreaterThanOrEqual(sheep.height / 2 + 10);
          expect(updated.y).toBeLessThanOrEqual(lvl.farmHeight - sheep.height / 2 - 10);

          // 2. Must not collide with static obstacles
          for (const obs of lvl.obstacles.filter((o) => o.id !== sheep.id && !o.patrol)) {
            const hwS = sheep.width / 2;
            const hhS = sheep.height / 2;
            const hwO = obs.width / 2;
            const hhO = obs.height / 2;

            const dx = Math.max(0, Math.abs(updated.x - obs.x) - (hwS + hwO));
            const dy = Math.max(0, Math.abs(updated.y - obs.y) - (hhS + hhO));
            const dist = Math.hypot(dx, dy);

            if (dist < 15) {
              throw new Error(
                `Level ${lvl.id} sheep ${sheep.id} at sample t=${sampleTime.toFixed(1)}s (pos=${axis === 'x' ? updated.x : updated.y}) clips static obstacle ${obs.id} (dist=${dist.toFixed(1)}px)`
              );
            }
            expect(dist).toBeGreaterThanOrEqual(15);
          }

          // 3. Must not touch milk bottles along route
          for (const bottle of lvl.milkBottles) {
            const hwS = sheep.width / 2;
            const hhS = sheep.height / 2;
            const dx = Math.max(0, Math.abs(bottle.x - updated.x) - hwS);
            const dy = Math.max(0, Math.abs(bottle.y - updated.y) - hhS);
            const dist = Math.hypot(dx, dy);

            if (dist < 20) {
              throw new Error(
                `Level ${lvl.id} sheep ${sheep.id} at sample t=${sampleTime.toFixed(1)}s passes too close (${dist.toFixed(1)}px) to milk bottle ${bottle.id}`
              );
            }
            expect(dist).toBeGreaterThanOrEqual(20);
          }

          // 4. Must not overlap cow start spawn point
          const distToCowStart = Math.hypot(updated.x - lvl.cowStart.x, updated.y - lvl.cowStart.y);
          expect(distToCowStart).toBeGreaterThanOrEqual(50);
        }
      }
    }
  });

  test('Bessie collision with moving sheep drains health and flags sheep ID', () => {
    const level6 = LEVELS.find((l) => l.id === 6)!;
    let state = createInitialState(level6);
    const sheep = state.obstacles?.find((o) => o.id === 'sheep_patrol_6')!;
    expect(sheep).toBeDefined();

    // Teleport cow directly onto moving sheep
    state.cow.x = sheep.x;
    state.cow.y = sheep.y;

    const noInput: PlayerInput = {};
    state = updateGamePhysics(state, noInput, 0.2, level6);

    expect(state.isColliding).toBe(true);
    expect(state.collidingWithIds).toContain('sheep_patrol_6');
    expect(state.cow.health).toBeLessThan(100);
  });
});

