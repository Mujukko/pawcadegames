import { describe, expect, it } from 'bun:test';
import { GAMES_REGISTRY } from '../lib/gamesRegistry';
import { GAME_INTROS } from '../components/GameIntroModal';
import { ANALYTICS_EXCLUDE_KEY, GA_MEASUREMENT_ID } from '../lib/analytics';
import { GAME_COMPONENTS } from './gameComponents';

describe('112-Game Playability & Instant-Play UX Audit', () => {
  const playable = GAMES_REGISTRY.filter((g) => g.status === 'playable');

  it('registers all 112 playable games in GAME_COMPONENTS by id', () => {
    expect(playable.length).toBeGreaterThanOrEqual(112);

    for (const game of playable) {
      expect(GAME_COMPONENTS[game.id]).toBeDefined();
    }
  });

  it('provides complete How-to-Play intro instructions and controls for all 112 games', () => {
    for (const game of playable) {
      const intro = GAME_INTROS[game.id];
      expect(intro).toBeDefined();
      expect(intro!.goal.length).toBeGreaterThan(10);
      expect(intro!.steps.length).toBeGreaterThanOrEqual(2);
      expect(game.controls.desktop.length).toBeGreaterThanOrEqual(1);
      expect(game.controls.mobile.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('defines owner analytics exclusion constants for G-6QENGPZ73F', () => {
    expect(ANALYTICS_EXCLUDE_KEY).toBe('pawcade_exclude_analytics');
    expect(GA_MEASUREMENT_ID).toBe('G-6QENGPZ73F');
  });
});
