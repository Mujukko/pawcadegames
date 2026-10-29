import { describe, it, expect } from 'bun:test';
import {
  createInitialState,
  updateEngine,
  nextCourse,
  restartCourse,
  FLUME_HALF_WIDTH,
  BASE_RACER_SPEED,
} from './engine';

describe('Duck Water Slide Logic Engine', () => {
  it('initializes with Course 1 (Meadow Creek Flume), 3 lives, 0m distance, and centered duck', () => {
    const state = createInitialState();
    expect(state.currentCourseIndex).toBe(0);
    expect(state.distanceCovered).toBe(0);
    expect(state.lives).toBe(3);
    expect(state.score).toBe(0);
    expect(state.duck.x).toBe(0);
    expect(state.duck.speed).toBe(BASE_RACER_SPEED);
    expect(state.items.length).toBeGreaterThan(0);
    expect(state.courseComplete).toBe(false);
    expect(state.gameOver).toBe(false);
  });

  it('steers duck left and right and clamps within flume walls', () => {
    let state = createInitialState();
    state.items = []; // isolate from random hazards during steering test

    // Steer full left across frames
    for (let i = 0; i < 20; i++) {
      state = updateEngine(state, 0.03, -1.0);
    }
    expect(state.duck.x).toBeLessThan(0);
    expect(state.duck.x).toBeGreaterThanOrEqual(-FLUME_HALF_WIDTH + 18);

    // Steer full right across frames
    for (let i = 0; i < 40; i++) {
      state = updateEngine(state, 0.03, 1.0);
    }
    expect(state.duck.x).toBeGreaterThan(0);
    expect(state.duck.x).toBeLessThanOrEqual(FLUME_HALF_WIDTH - 18);
  });

  it('collects rubber ducks and watermelon slices, increasing score and combo', () => {
    let state = createInitialState();
    state.items = [
      {
        id: 1,
        trackX: 0,
        worldDistance: 10,
        type: 'rubber_duck',
        collected: false,
      },
    ];

    // Position duck to collide with item
    state.distanceCovered = 9.8;
    state.duck.x = 0;

    state = updateEngine(state, 0.016, 0);
    expect(state.score).toBe(50);
    expect(state.combo).toBe(1);
    expect(state.items[0]!.collected).toBe(true);
    expect(state.lastEvents.some((e) => e.type === 'collect_duck')).toBe(true);
  });

  it('activates supersonic turbo boost upon hitting speed booster', () => {
    let state = createInitialState();
    state.items = [
      {
        id: 2,
        trackX: 0,
        worldDistance: 10,
        type: 'speed_boost',
        collected: false,
      },
    ];

    state.distanceCovered = 9.8;
    state.duck.x = 0;

    state = updateEngine(state, 0.016, 0);
    expect(state.duck.boostTimer).toBeGreaterThan(0);
    expect(state.duck.speed).toBeGreaterThan(BASE_RACER_SPEED);
    expect(state.lastEvents.some((e) => e.type === 'hit_boost')).toBe(true);
  });

  it('launches duck into air for stunt flips when hitting a water ramp', () => {
    let state = createInitialState();
    state.items = [
      {
        id: 3,
        trackX: 0,
        worldDistance: 10,
        type: 'water_ramp',
        collected: false,
      },
    ];

    state.distanceCovered = 9.8;
    state.duck.x = 0;

    state = updateEngine(state, 0.016, 0);
    expect(state.duck.inAir).toBe(true);
    expect(state.duck.airTimer).toBeGreaterThan(0);
    expect(state.score).toBeGreaterThanOrEqual(200);
    expect(state.lastEvents.some((e) => e.type === 'hit_ramp')).toBe(true);
  });

  it('triggers spinout when hitting soap bar on ground, but avoids it while airborne', () => {
    let state = createInitialState();
    state.items = [
      {
        id: 4,
        trackX: 0,
        worldDistance: 10,
        type: 'soap_bar',
        collected: false,
      },
    ];

    state.distanceCovered = 9.8;
    state.duck.x = 0;

    state = updateEngine(state, 0.016, 0);
    expect(state.duck.spinTimer).toBeGreaterThan(0);
    expect(state.lastEvents.some((e) => e.type === 'hit_soap')).toBe(true);

    // Airborne test
    let airState = createInitialState();
    airState.duck.inAir = true;
    airState.duck.airTimer = 1.0;
    airState.items = [
      {
        id: 5,
        trackX: 0,
        worldDistance: 10,
        type: 'soap_bar',
        collected: false,
      },
    ];
    airState.distanceCovered = 9.8;
    airState = updateEngine(airState, 0.016, 0);
    expect(airState.duck.spinTimer).toBe(0); // Safely sailed over!
  });

  it('deducts life when hitting beach ball hazard on ground and triggers game over at 0 lives', () => {
    let state = createInitialState();
    state.lives = 1;
    state.items = [
      {
        id: 6,
        trackX: 0,
        worldDistance: 10,
        type: 'beach_ball',
        collected: false,
      },
    ];

    state.distanceCovered = 9.8;
    state.duck.x = 0;

    state = updateEngine(state, 0.016, 0);
    expect(state.lives).toBe(0);
    expect(state.gameOver).toBe(true);
    expect(state.lastEvents.some((e) => e.type === 'game_over')).toBe(true);
  });

  it('completes course splashdown upon reaching total distance', () => {
    let state = createInitialState();
    // Advance duck near finish line
    state.distanceCovered = 319.5;

    state = updateEngine(state, 0.04, 0);
    expect(state.courseComplete).toBe(true);
    expect(state.score).toBeGreaterThanOrEqual(500);
    expect(state.lastEvents.some((e) => e.type === 'course_finish')).toBe(true);
  });

  it('advances through all 4 flume courses and triggers gameComplete', () => {
    let state = createInitialState();
    expect(state.currentCourseIndex).toBe(0);

    state = nextCourse(state);
    expect(state.currentCourseIndex).toBe(1);

    state = nextCourse(state);
    expect(state.currentCourseIndex).toBe(2);

    state = nextCourse(state);
    expect(state.currentCourseIndex).toBe(3);

    state = nextCourse(state);
    expect(state.gameComplete).toBe(true);
  });

  it('resets current course distance and lives on restart', () => {
    let state = createInitialState();
    state.distanceCovered = 150;
    state.lives = 1;

    state = restartCourse(state);
    expect(state.distanceCovered).toBe(0);
    expect(state.lives).toBe(3);
    expect(state.gameOver).toBe(false);
  });
});
