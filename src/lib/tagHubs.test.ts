import { describe, expect, it } from 'bun:test';
import { GAMES_REGISTRY } from './gamesRegistry';
import { TAG_HUBS, TAG_HUB_BY_SLUG, getHubsForGame } from './tagHubs';
import { buildGameFaqs, getRelatedGames } from './gameSeo';
import { GAME_INTROS } from '../components/GameIntroModal';

describe('Tag Hubs & Programmatic Collection SEO Architecture', () => {
  const playable = GAMES_REGISTRY.filter((g) => g.status === 'playable');

  it('defines 14 unique sub-category tag hubs with valid routes and SERP-safe metadata lengths', () => {
    expect(TAG_HUBS.length).toBe(14);
    const slugs = new Set<string>();
    for (const hub of TAG_HUBS) {
      expect(slugs.has(hub.slug)).toBe(false);
      slugs.add(hub.slug);
      expect(hub.route).toBe(`/category/${hub.slug}/`);
      expect(TAG_HUB_BY_SLUG[hub.slug]).toBe(hub);
      expect(hub.metaTitle.length).toBeLessThanOrEqual(60);
      expect(hub.metaTitle.length).toBeGreaterThanOrEqual(40);
      expect(hub.metaDescription.length).toBeLessThanOrEqual(160);
      expect(hub.metaDescription.length).toBeGreaterThanOrEqual(120);
      expect(hub.faqs.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('populates every tag hub with at least 6 playable games (zero thin pages)', () => {
    for (const hub of TAG_HUBS) {
      const matched = playable.filter(hub.filter);
      expect(matched.length).toBeGreaterThanOrEqual(6);
    }
  });

  it('assigns every playable game in GAMES_REGISTRY to at least one topic hub', () => {
    for (const game of playable) {
      const hubs = getHubsForGame(game);
      expect(hubs.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('injects query-cluster FAQs for top GSC impression games', () => {
    const truckGame = playable.find((g) => g.id === 'barnyard-truck-jumper')!;
    const faqs = buildGameFaqs(truckGame, GAME_INTROS[truckGame.id], getRelatedGames(truckGame, playable, 8));
    expect(faqs.some((f) => f.question.toLowerCase().includes('jumping on trucks game'))).toBe(true);

    const duckHunt = playable.find((g) => g.id === 'duck-hunt-classic')!;
    const dhFaqs = buildGameFaqs(duckHunt, GAME_INTROS[duckHunt.id], getRelatedGames(duckHunt, playable, 8));
    expect(dhFaqs.some((f) => f.question.toLowerCase().includes('free duck hunt game online'))).toBe(true);
  });
});
