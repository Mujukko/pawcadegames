import { describe, expect, it } from 'bun:test';
import {
  initCookieStackGame,
  movePlate,
  updateCookieStackGame,
  advanceToNextBakeryStage,
  BAKERY_STAGES,
} from './engine';

describe('Hamster Cookie Stack Logic Engine', () => {
  it('initializes Stage 1 with plate centered, 3 lives, and 0 stacked sweets', () => {
    const game = initCookieStackGame(1);
    expect(game.stage).toBe(1);
    expect(game.plateX).toBe(240);
    expect(game.plateY).toBe(560);
    expect(game.lives).toBe(3);
    expect(game.stackedSweets.length).toBe(0);
    expect(game.status).toBe('playing');
  });

  it('moves and clamps plate within screen margins', () => {
    let game = initCookieStackGame(1);
    game = movePlate(game, 300);
    expect(game.plateX).toBe(300);

    // Clamp left
    game = movePlate(game, -100);
    expect(game.plateX).toBe(70);

    // Clamp right
    game = movePlate(game, 999);
    expect(game.plateX).toBe(410);
  });

  it('catches falling sweet when aligned with plate', () => {
    let game = initCookieStackGame(1);
    // Spawn sweet right above plate at landing altitude
    game.fallingSweets = [
      {
        id: 'test-cookie',
        type: 'cookie',
        x: 240,
        y: 545,
        width: 56,
        height: 18,
        vx: 0,
        vy: 100,
        points: 50,
        color: '#d97706',
        frostingColor: '#78350f',
      },
    ];

    const { newState, events } = updateCookieStackGame(game, 0.05);

    expect(events.length).toBe(1);
    expect(newState.stackedSweets.length).toBe(1);
    expect(newState.stackedSweets[0].type).toBe('cookie');
    expect(newState.score).toBeGreaterThan(0);
    expect(newState.fallingSweets.length).toBe(0);
  });

  it('registers perfect landing and combo multiplier when centered', () => {
    let game = initCookieStackGame(1);
    game.fallingSweets = [
      {
        id: 'perf-cookie',
        type: 'cookie',
        x: 240, // exactly centered at plateX = 240
        y: 545,
        width: 56,
        height: 18,
        vx: 0,
        vy: 100,
        points: 50,
        color: '#d97706',
        frostingColor: '#78350f',
      },
    ];

    const { newState, events } = updateCookieStackGame(game, 0.05);

    expect(events[0].isPerfect).toBe(true);
    expect(newState.combo).toBe(1);
    expect(events[0].pointsEarned).toBeGreaterThanOrEqual(150); // 50 base + 100 perfect bonus
  });

  it('triggers stage victory when target sweets count is reached', () => {
    let game = initCookieStackGame(1);
    const target = game.stageConfig.targetCount;

    // Fill stack to target - 1
    for (let i = 0; i < target - 1; i++) {
      game.stackedSweets.push({
        id: `s-${i}`,
        type: 'cookie',
        offsetX: 0,
        y: 540 - i * 18,
        width: 56,
        height: 18,
        angle: 0,
        points: 50,
        color: '#d97706',
        frostingColor: '#78350f',
        isPerfect: true,
      });
    }

    // Land final sweet at top of the stack (y = 560 - 9 * 18 - 5 = 393)
    const topStackY = 560 - (target - 1) * 18;
    game.fallingSweets = [
      {
        id: 'final-cookie',
        type: 'cookie',
        x: 240,
        y: topStackY - 5,
        width: 56,
        height: 18,
        vx: 0,
        vy: 50,
        points: 50,
        color: '#d97706',
        frostingColor: '#78350f',
      },
    ];

    const { newState, events } = updateCookieStackGame(game, 0.05);

    expect(events[0].stageCompleted).toBe(true);
    expect(newState.status).toBe('won');
  });

  it('sheds items and deducts a life if wobble angle exceeds threshold', () => {
    let game = initCookieStackGame(1);
    // Put 5 stacked sweets
    for (let i = 0; i < 5; i++) {
      game.stackedSweets.push({
        id: `w-${i}`,
        type: 'cookie',
        offsetX: 0,
        y: 540 - i * 18,
        width: 56,
        height: 18,
        angle: 0,
        points: 50,
        color: '#d97706',
        frostingColor: '#78350f',
        isPerfect: true,
      });
    }

    // Force an extreme wobble angle (> 0.48)
    game.wobbleAngle = 0.55;

    const { newState, events } = updateCookieStackGame(game, 0.05);

    expect(events.some((e) => e.towerCollapsed)).toBe(true);
    expect(newState.lives).toBe(2);
    expect(newState.stackedSweets.length).toBe(2); // shed top 3
    expect(newState.wobbleAngle).toBe(0); // reset balance
  });

  it('advances cleanly across all 4 bakery stages up to the summit', () => {
    let game = initCookieStackGame(1);
    expect(game.stage).toBe(1);

    game = advanceToNextBakeryStage(game);
    expect(game.stage).toBe(2);
    expect(game.stageConfig.title).toBe('Macaron Wonderland');
    expect(game.stageConfig.allowedTypes).toContain('macaron');

    game = advanceToNextBakeryStage(game);
    expect(game.stage).toBe(3);
    expect(game.stageConfig.title).toBe('Donut Carnival');
    expect(game.stageConfig.allowedTypes).toContain('donut');

    game = advanceToNextBakeryStage(game);
    expect(game.stage).toBe(4);
    expect(game.stageConfig.title).toBe('Royal Wedding Cake Summit');
    expect(game.stageConfig.allowedTypes).toContain('cake');
  });
});
