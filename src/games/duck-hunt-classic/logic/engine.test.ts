import { describe, it, expect, beforeEach } from 'bun:test';
import {
  createInitialState,
  getQuotaForRound,
  spawnFlushDucks,
  fireShot,
  updateGameEngine,
  startNextFlush,
  evaluateRoundEnd,
  restartGame,
  GameState,
  WORLD_WIDTH,
  WORLD_HEIGHT,
  BUSH_Y,
} from './engine';

describe('Duck Hunt Classic Core Game Engine', () => {
  let state: GameState;

  beforeEach(() => {
    state = createInitialState(12000);
  });

  describe('Initial State & Round Quota', () => {
    it('initializes game state with proper retro defaults', () => {
      expect(state.phase).toBe('intro');
      expect(state.round).toBe(1);
      expect(state.score).toBe(0);
      expect(state.highScore).toBe(12000);
      expect(state.shells).toBe(3);
      expect(state.quota).toBe(6);
      expect(state.duckTracker.length).toBe(10);
      expect(state.duckTracker.every((s) => s === 'pending')).toBe(true);
      expect(state.dog.state).toBe('intro_walk');
    });

    it('calculates progressive round quotas correctly', () => {
      expect(getQuotaForRound(1)).toBe(6);
      expect(getQuotaForRound(2)).toBe(6);
      expect(getQuotaForRound(3)).toBe(7);
      expect(getQuotaForRound(5)).toBe(7);
      expect(getQuotaForRound(6)).toBe(8);
      expect(getQuotaForRound(8)).toBe(8);
      expect(getQuotaForRound(9)).toBe(9);
      expect(getQuotaForRound(15)).toBe(9);
    });
  });

  describe('Duck Spawning & Flight Dynamics', () => {
    it('spawns 1 duck per flush in rounds 1 and 2', () => {
      state.round = 1;
      const ducks = spawnFlushDucks(state);
      expect(ducks.length).toBe(1);
      expect(ducks[0]!.state).toBe('flying');
      expect(ducks[0]!.y).toBeLessThanOrEqual(BUSH_Y);
      expect(ducks[0]!.points).toBeGreaterThanOrEqual(500);
    });

    it('spawns 2 ducks per flush in round 3 and beyond', () => {
      state.round = 3;
      const ducks = spawnFlushDucks(state);
      expect(ducks.length).toBe(2);
      expect(ducks[0]!.id).not.toBe(ducks[1]!.id);
      expect(ducks[0]!.state).toBe('flying');
      expect(ducks[1]!.state).toBe('flying');
    });

    it('clamps ducks within world bounds during flight and bounces off walls', () => {
      state.phase = 'playing';
      state.activeDucks = [
        {
          id: 'test-duck-1',
          type: 'greenhead',
          state: 'flying',
          x: WORLD_WIDTH - 25,
          y: 200,
          vx: 200, // moving right towards edge
          vy: -50,
          width: 50,
          height: 40,
          facing: 'right',
          wingFrame: 0,
          wingTimer: 0,
          stateTimer: 0.1,
          flightDuration: 6.0,
          points: 500,
        },
      ];

      updateGameEngine(state, 0.1);

      const duck = state.activeDucks[0]!;
      expect(duck.vx).toBeLessThan(0); // bounced left
      expect(duck.facing).toBe('left');
    });
  });

  describe('Shooting & Hit Detection', () => {
    beforeEach(() => {
      state.phase = 'playing';
      state.activeDucks = [
        {
          id: 'duck-target',
          type: 'greenhead',
          state: 'flying',
          x: 350,
          y: 200,
          vx: 150,
          vy: -80,
          width: 50,
          height: 40,
          facing: 'right',
          wingFrame: 0,
          wingTimer: 0,
          stateTimer: 0.1,
          flightDuration: 6.0,
          points: 500,
        },
      ];
      state.duckTracker[0] = 'active';
    });

    it('deducts a shell on firing and registers a direct hit', () => {
      const result = fireShot(state, 350, 200);

      expect(result.fired).toBe(true);
      expect(result.hit).toBe(true);
      expect(result.pointsAwarded).toBe(500);
      expect(result.remainingShells).toBe(2);
      expect(state.score).toBe(500);
      expect(state.roundHits).toBe(1);
      expect(state.duckTracker[0]).toBe('hit');
      expect(state.activeDucks[0]!.state).toBe('hit_pause');
      expect(state.feathers.length).toBeGreaterThan(0);
    });

    it('updates high score when current score exceeds it', () => {
      state.score = 11800;
      state.highScore = 12000;
      state.activeDucks[0]!.points = 500;

      fireShot(state, 350, 200);

      expect(state.score).toBe(12300);
      expect(state.highScore).toBe(12300);
    });

    it('registers a miss if shooting away from duck', () => {
      const result = fireShot(state, 100, 100);

      expect(result.fired).toBe(true);
      expect(result.hit).toBe(false);
      expect(result.pointsAwarded).toBe(0);
      expect(result.remainingShells).toBe(2);
      expect(state.score).toBe(0);
      expect(state.activeDucks[0]!.state).toBe('flying');
    });

    it('prevents firing when shells are 0', () => {
      state.shells = 0;
      const result = fireShot(state, 350, 200);

      expect(result.fired).toBe(false);
      expect(result.hit).toBe(false);
      expect(result.remainingShells).toBe(0);
    });

    it('causes duck to fly away when 3rd shell is spent with a miss', () => {
      state.shells = 1;
      const result = fireShot(state, 10, 10); // miss

      expect(result.fired).toBe(true);
      expect(result.hit).toBe(false);
      expect(state.shells).toBe(0);
      expect(state.activeDucks[0]!.state).toBe('flying_away');
      expect(state.activeDucks[0]!.vy).toBeLessThan(0); // rising upward
    });
  });

  describe('Duck Flight Expiration & Escape', () => {
    it('triggers flying away after duck flight duration expires', () => {
      state.phase = 'playing';
      state.activeDucks = [
        {
          id: 'duck-timeout',
          type: 'redhead',
          state: 'flying',
          x: 400,
          y: 200,
          vx: 100,
          vy: 50,
          width: 50,
          height: 40,
          facing: 'right',
          wingFrame: 0,
          wingTimer: 0,
          stateTimer: 6.9,
          flightDuration: 7.0,
          points: 1000,
        },
      ];

      updateGameEngine(state, 0.2); // crosses 7.0s

      expect(state.activeDucks[0]!.state).toBe('flying_away');
    });

    it('marks duck as escaped and sets miss in tracker once it leaves top of screen', () => {
      state.phase = 'playing';
      state.duckTracker[0] = 'active';
      state.activeDucks = [
        {
          id: 'duck-escape',
          type: 'redhead',
          state: 'flying_away',
          x: 400,
          y: -40,
          vx: 10,
          vy: -300,
          width: 50,
          height: 40,
          facing: 'right',
          wingFrame: 0,
          wingTimer: 0,
          stateTimer: 1.0,
          flightDuration: 7.0,
          points: 1000,
        },
      ];

      updateGameEngine(state, 0.1);

      expect(state.activeDucks[0]!.state).toBe('escaped');
      expect(state.duckTracker[0]).toBe('miss');
    });
  });

  describe('Dog Behavior & Transitions', () => {
    it('progresses dog from intro walk to sniff and jump into reeds', () => {
      state.phase = 'intro';
      state.dog.state = 'intro_walk';
      state.dog.x = 270;

      updateGameEngine(state, 0.2); // moves past 280

      expect(state.dog.state).toBe('intro_sniff');

      state.dog.timer = 1.3;
      updateGameEngine(state, 0.1);

      expect(state.dog.state).toBe('intro_jump');
    });

    it('shows dog holding duck after successful shot resolution', () => {
      state.phase = 'playing';
      state.activeDucks = [
        {
          id: 'duck-hit',
          type: 'greenhead',
          state: 'hit_pause',
          x: 300,
          y: 200,
          vx: 0,
          vy: 0,
          width: 50,
          height: 40,
          facing: 'right',
          wingFrame: 0,
          wingTimer: 0,
          stateTimer: 0.35,
          flightDuration: 6.0,
          points: 500,
        },
      ];

      // Step to falling
      updateGameEngine(state, 0.1);
      expect(state.activeDucks[0]!.state).toBe('falling');

      // Step until duck lands in bushes
      state.activeDucks[0]!.y = BUSH_Y + 15;
      updateGameEngine(state, 0.1);
      expect(state.activeDucks[0]!.state).toBe('retrieved');

      // Next tick triggers resolution phase with dog showing duck
      updateGameEngine(state, 0.05);
      expect(state.phase).toBe('duck_resolution');
      expect(state.dog.state).toBe('show_duck');
      expect(state.dog.ducksHeld).toBe(1);
    });

    it('shows dog laughing when all ducks escape', () => {
      state.phase = 'playing';
      state.activeDucks = [
        {
          id: 'duck-escaped',
          type: 'greenhead',
          state: 'escaped',
          x: 300,
          y: -60,
          vx: 0,
          vy: -300,
          width: 50,
          height: 40,
          facing: 'right',
          wingFrame: 0,
          wingTimer: 0,
          stateTimer: 2.0,
          flightDuration: 6.0,
          points: 500,
        },
      ];

      updateGameEngine(state, 0.05);

      expect(state.phase).toBe('duck_resolution');
      expect(state.dog.state).toBe('laugh');
    });
  });

  describe('Round Evaluation & Restart', () => {
    it('advances to round_clear if round hits meet quota', () => {
      state.round = 1;
      state.quota = 6;
      state.roundHits = 7;

      evaluateRoundEnd(state);

      expect(state.phase).toBe('round_clear');
    });

    it('triggers game_over if round hits fail to meet quota', () => {
      state.round = 1;
      state.quota = 6;
      state.roundHits = 5;

      evaluateRoundEnd(state);

      expect(state.phase).toBe('game_over');
    });

    it('resets game to round 1 on restart while preserving high score', () => {
      state.score = 8500;
      state.highScore = 15000;
      state.round = 4;
      state.phase = 'game_over';

      restartGame(state);

      expect(state.phase).toBe('intro');
      expect(state.round).toBe(1);
      expect(state.score).toBe(0);
      expect(state.highScore).toBe(15000);
      expect(state.shells).toBe(3);
      expect(state.quota).toBe(6);
      expect(state.duckTracker.length).toBe(10);
    });
  });
});
