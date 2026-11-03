import { describe, expect, it } from 'bun:test';
import {
  createMilkPailGame,
  addPointToCurrentLine,
  finishCurrentLine,
  startPouring,
  updateMilkPailGame,
  MAX_INK,
} from './engine';

describe('Happy Milk Pail Engine', () => {
  it('creates initial state for level 1', () => {
    const game = createMilkPailGame(1, 400);
    expect(game.status).toBe('drawing');
    expect(game.level).toBe(1);
    expect(game.highScore).toBe(400);
    expect(game.inkRemaining).toBe(MAX_INK);
    expect(game.pail.isHappy).toBe(false);
  });

  it('draws line points and consumes ink', () => {
    let game = createMilkPailGame(1);
    game = addPointToCurrentLine(game, { x: 50, y: 100 });
    game = addPointToCurrentLine(game, { x: 100, y: 100 });
    expect(game.currentLine.length).toBe(2);
    expect(game.inkRemaining).toBeLessThan(MAX_INK);

    const finished = finishCurrentLine(game);
    expect(finished.lines.length).toBe(1);
    expect(finished.currentLine.length).toBe(0);
  });

  it('starts pouring droplets', () => {
    const game = createMilkPailGame(1);
    const pouring = startPouring(game);
    expect(pouring.status).toBe('pouring');
    expect(pouring.droplets.length).toBe(40);
    expect(pouring.events.some((e) => e.type === 'pour')).toBe(true);
  });

  it('collects droplet in pail and triggers happy state', () => {
    const game = createMilkPailGame(1);
    game.status = 'pouring';
    game.pail.capacityNeeded = 1;
    game.pail.dropletCount = 0;
    game.droplets = [
      {
        id: 1,
        x: game.pail.x + 20,
        y: game.pail.y + 15,
        vx: 0,
        vy: 50,
        radius: 4,
        inPail: false,
        lost: false,
      },
    ];

    const next = updateMilkPailGame(game, 0.02);
    expect(next.pail.dropletCount).toBe(1);
    expect(next.pail.isHappy).toBe(true);
    expect(next.events.some((e) => e.type === 'happy')).toBe(true);
  });

  it('fails level when all droplets finish without filling pail', () => {
    const game = createMilkPailGame(1);
    game.status = 'pouring';
    game.pail.capacityNeeded = 10;
    game.pail.dropletCount = 1;
    // Droplet is already lost
    game.droplets = [
      {
        id: 1,
        x: 10,
        y: 800,
        vx: 0,
        vy: 100,
        radius: 4,
        inPail: false,
        lost: true,
      },
    ];

    const next = updateMilkPailGame(game, 0.02);
    expect(next.status).toBe('failed');
    expect(next.events.some((e) => e.type === 'fail')).toBe(true);
  });
});
