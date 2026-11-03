import { describe, expect, it } from 'bun:test';
import {
  createTunnelRunnerGame,
  rotateTunnel,
  jumpTunnelPlayer,
  updateTunnelRunnerGame,
  TOTAL_LANES,
} from './engine';

describe('Barnyard Tunnel Runner Engine', () => {
  it('initializes tunnel game with 8 lanes and player on floor', () => {
    const game = createTunnelRunnerGame(600);
    expect(game.status).toBe('ready');
    expect(game.score).toBe(0);
    expect(game.highScore).toBe(600);
    expect(game.player.lane).toBe(0);
    expect(game.player.isJumping).toBe(false);
    expect(game.tiles.length).toBeGreaterThan(50);
  });

  it('rotates tunnel left and right around 8 lanes', () => {
    let game = createTunnelRunnerGame();
    game = rotateTunnel(game, 1);
    expect(game.player.lane).toBe(1);

    game = rotateTunnel(game, -1);
    expect(game.player.lane).toBe(0);

    game = rotateTunnel(game, -1);
    expect(game.player.lane).toBe(TOTAL_LANES - 1); // 7
  });

  it('triggers jump and prevents falling on gaps', () => {
    const game = createTunnelRunnerGame();
    const jumped = jumpTunnelPlayer(game);
    expect(jumped.player.isJumping).toBe(true);
    expect(jumped.player.jumpVelocity).toBeGreaterThan(0);
    expect(jumped.events.some((e) => e.type === 'jump')).toBe(true);
  });

  it('causes game over when running over missing floor tile', () => {
    const game = createTunnelRunnerGame();
    game.status = 'running';
    game.player.lane = 0;
    game.player.isJumping = false;
    game.tiles = [
      {
        z: 0.5,
        lane: 0,
        hasFloor: false, // gap in floor!
        hasObstacle: false,
      },
    ];

    const next = updateTunnelRunnerGame(game, 0.05);
    expect(next.status).toBe('game_over');
    expect(next.events.some((e) => e.type === 'fall')).toBe(true);
  });

  it('survives missing tile while jumping over it', () => {
    const game = createTunnelRunnerGame();
    game.status = 'running';
    game.player.lane = 0;
    game.player.isJumping = true;
    game.player.jumpHeight = 2.0;
    game.tiles = [
      {
        z: 0.5,
        lane: 0,
        hasFloor: false,
        hasObstacle: false,
      },
    ];

    const next = updateTunnelRunnerGame(game, 0.05);
    expect(next.status).toBe('running');
  });
});
