import { describe, it, expect } from 'bun:test';
import {
  createInitialState,
  dropBottle,
  updateEngine,
  activateFrenzy,
  refillBottles,
  BUCKET_TOP_Y,
} from './engine';

describe('Bessie Milk Bottle Plinko Core Engine', () => {
  it('initializes game state with proper defaults', () => {
    const state = createInitialState(500);
    expect(state.status).toBe('playing');
    expect(state.bottlesLeft).toBe(30);
    expect(state.score).toBe(0);
    expect(state.highScore).toBe(500);
    expect(state.bottlesInPlay).toHaveLength(0);
    expect(state.pegs.length).toBeGreaterThan(60);
    expect(state.buckets).toHaveLength(7);
    expect(state.buckets[3].isJackpot).toBe(true);
    expect(state.buckets[3].multiplier).toBe(100);
  });

  it('drops a bottle from hopper and updates state', () => {
    let state = createInitialState();
    const res = dropBottle(state);

    expect(res.event?.type).toBe('bottle_dropped');
    expect(res.state.bottlesLeft).toBe(29);
    expect(res.state.bottlesInPlay).toHaveLength(1);
    expect(res.state.totalDropped).toBe(1);

    const bottle = res.state.bottlesInPlay[0];
    expect(bottle.y).toBe(55);
    expect(bottle.radius).toBeGreaterThanOrEqual(10);
  });

  it('clamps manual drop position within hopper travel range', () => {
    const state = createInitialState();
    const resLeft = dropBottle(state, 5);
    expect(resLeft.state.bottlesInPlay[0].x).toBe(state.hopper.minX);

    const resRight = dropBottle(state, 400);
    expect(resRight.state.bottlesInPlay[0].x).toBe(state.hopper.maxX);
  });

  it('moves the hopper horizontally and bounces at limits', () => {
    let state = createInitialState();
    state.hopper.x = state.hopper.maxX - 1;
    state.hopper.dir = 1;

    const res = updateEngine(state, 0.04);
    expect(res.state.hopper.x).toBe(state.hopper.maxX);
    expect(res.state.hopper.dir).toBe(-1);
  });

  it('accelerates bottles downward with gravity and detects peg collision', () => {
    let state = createInitialState();
    const firstPeg = state.pegs[0];

    // Place bottle directly above first peg with downward speed
    state.bottlesInPlay = [
      {
        id: 'test-bottle',
        x: firstPeg.x,
        y: firstPeg.y - 12,
        vx: 0,
        vy: 100,
        radius: 10,
        type: 'standard_milk',
        value: 10,
      },
    ];

    const res = updateEngine(state, 0.04);
    const hitEvent = res.events.find((e) => e.type === 'peg_hit');
    expect(hitEvent).toBeDefined();
    if (hitEvent && hitEvent.type === 'peg_hit') {
      expect(hitEvent.pegId).toBe(firstPeg.id);
      expect(hitEvent.noteFreq).toBeGreaterThan(500);
    }
    expect(res.state.pegs[0].glowTimer).toBeGreaterThan(0);
  });

  it('scores points when bottle enters bottom bucket', () => {
    let state = createInitialState();
    const jackpotBucket = state.buckets[3]; // Center 100x jackpot

    state.bottlesInPlay = [
      {
        id: 'bottle-goal',
        x: (jackpotBucket.minX + jackpotBucket.maxX) / 2,
        y: BUCKET_TOP_Y - 2,
        vx: 0,
        vy: 120,
        radius: 10,
        type: 'golden_milk',
        value: 50,
      },
    ];

    const res = updateEngine(state, 0.04);
    expect(res.state.bottlesInPlay).toHaveLength(0); // settled and removed
    expect(res.state.totalBucketed).toBe(1);

    const scoredEvent = res.events.find((e) => e.type === 'bucket_scored');
    expect(scoredEvent).toBeDefined();
    if (scoredEvent && scoredEvent.type === 'bucket_scored') {
      expect(scoredEvent.multiplier).toBe(100);
      expect(scoredEvent.scoreEarned).toBe(50 * 100);
      expect(scoredEvent.isJackpot).toBe(true);
    }

    expect(res.state.score).toBe(5000);
  });

  it('activates Golden Frenzy when meter is 100', () => {
    let state = createInitialState();
    state.frenzyMeter = 100;

    const res = activateFrenzy(state);
    expect(res.event?.type).toBe('frenzy_activated');
    expect(res.state.frenzyActive).toBe(true);
    expect(res.state.frenzyTimer).toBe(8.0);
    expect(res.state.frenzyMeter).toBe(0);
  });

  it('refills bottles when out of supply', () => {
    let state = createInitialState();
    state.bottlesLeft = 0;
    state.status = 'game_over';

    const refilled = refillBottles(state, 25);
    expect(refilled.bottlesLeft).toBe(25);
    expect(refilled.status).toBe('playing');
  });

  it('triggers game over when 0 bottles left and all in-flight bottles land', () => {
    let state = createInitialState();
    state.bottlesLeft = 0;
    state.bottlesInPlay = [];

    const res = updateEngine(state, 0.02);
    expect(res.state.status).toBe('game_over');
  });
});
