import { describe, it, expect } from 'bun:test';
import {
  createInitialState,
  pickTile,
  undoMove,
  shuffleBoard,
  CAMPAIGN_LEVELS,
  MAX_TRAY_CAPACITY,
} from './engine';

describe('Barnyard Tile Match: Triple Pick Logic Engine', () => {
  it('initializes Level 1 with 18 tiles and empty tray', () => {
    const state = createInitialState(0, 500);
    expect(state.level).toBe(1);
    expect(state.tiles.length).toBe(18);
    expect(state.tray.length).toBe(0);
    expect(state.score).toBe(0);
    expect(state.highScore).toBe(500);
    expect(state.status).toBe('playing');
  });

  it('correctly marks covered layer 0 tiles as blocked', () => {
    const state = createInitialState(0);
    // In Level 1, layer 1 tiles are at (100, 105), (160, 105), (100, 175), etc.
    // Base tile at (70, 70) overlaps (100, 105) since |100-70|=30 < 54*0.85 (45.9) and |105-70|=35 < 62*0.85 (52.7)
    const baseTile1 = state.tiles.find(t => t.layer === 0 && t.x === 70 && t.y === 70);
    expect(baseTile1).toBeDefined();
    expect(baseTile1!.isBlocked).toBe(true);

    // Layer 1 tiles should never be blocked because no higher layer covers them
    const topTiles = state.tiles.filter(t => t.layer === 1);
    expect(topTiles.length).toBe(6);
    topTiles.forEach(t => {
      expect(t.isBlocked).toBe(false);
    });
  });

  it('allows picking an unblocked tile into the tray', () => {
    const state = createInitialState(0);
    const unblockedTile = state.tiles.find(t => !t.isBlocked && t.layer === 1)!;
    expect(unblockedTile).toBeDefined();

    const res = pickTile(state, unblockedTile.id);
    expect(res.success).toBe(true);
    expect(state.tray.length).toBe(1);
    expect(state.tray[0]!.id).toBe(unblockedTile.id);
    expect(state.moves).toBe(1);
  });

  it('rejects picking a blocked tile', () => {
    const state = createInitialState(0);
    const blockedTile = state.tiles.find(t => t.isBlocked)!;
    expect(blockedTile).toBeDefined();

    const res = pickTile(state, blockedTile.id);
    expect(res.success).toBe(false);
    expect(state.tray.length).toBe(0);
    expect(state.moves).toBe(0);
  });

  it('unblocks covered tiles once the covering tile is picked', () => {
    const state = createInitialState(0);
    // Find the layer 1 tile at (100, 105)
    const topTile = state.tiles.find(t => t.layer === 1 && t.x === 100 && t.y === 105)!;
    expect(topTile).toBeDefined();

    pickTile(state, topTile.id);

    // Check if any covered base tile became unblocked
    const nowUnblocked = state.tiles.filter(t => t.layer === 0 && !t.isBlocked);
    expect(nowUnblocked.length).toBeGreaterThan(0);
  });

  it('matches 3 identical tiles in tray, clears them, and awards +300 points', () => {
    const state = createInitialState(0);
    // Pick three strawberry tiles (layer 1 has three strawberry tiles)
    const straw1 = state.tiles.find(t => t.type === 'strawberry' && t.layer === 1)!;
    pickTile(state, straw1.id);

    const straw2 = state.tiles.find(t => t.type === 'strawberry' && t.layer === 1 && !t.inTray)!;
    pickTile(state, straw2.id);

    expect(state.tray.length).toBe(2);
    expect(state.score).toBe(0);

    const straw3 = state.tiles.find(t => t.type === 'strawberry' && t.layer === 1 && !t.inTray)!;
    const res = pickTile(state, straw3.id);

    expect(res.success).toBe(true);
    expect(res.matchedType).toBe('strawberry');
    expect(res.comboScore).toBe(300);
    expect(state.tray.length).toBe(0); // 3-match cleared from tray
    expect(state.score).toBe(300);
    expect(state.matchesMade).toBe(1);
  });

  it('triggers game over when tray fills to 7 tiles with no match', () => {
    const state = createInitialState(0);
    // Manually set up tray with 6 distinct/mismatched tiles
    state.tray = [
      { id: 101, type: 'apple', x: 0, y: 0, layer: 0, width: 50, height: 50, isBlocked: false, inTray: true, cleared: false },
      { id: 102, type: 'corn', x: 0, y: 0, layer: 0, width: 50, height: 50, isBlocked: false, inTray: true, cleared: false },
      { id: 103, type: 'pumpkin', x: 0, y: 0, layer: 0, width: 50, height: 50, isBlocked: false, inTray: true, cleared: false },
      { id: 104, type: 'honey', x: 0, y: 0, layer: 0, width: 50, height: 50, isBlocked: false, inTray: true, cleared: false },
      { id: 105, type: 'chick', x: 0, y: 0, layer: 0, width: 50, height: 50, isBlocked: false, inTray: true, cleared: false },
      { id: 106, type: 'eggplant', x: 0, y: 0, layer: 0, width: 50, height: 50, isBlocked: false, inTray: true, cleared: false },
    ];

    // Pick 1 unblocked tile that doesn't match 3 of anything
    const available = state.tiles.find(t => !t.isBlocked && t.type === 'strawberry')!;
    pickTile(state, available.id);

    expect(state.tray.length).toBe(MAX_TRAY_CAPACITY);
    expect(state.status).toBe('lost');
  });

  it('triggers victory and awards +500 completion bonus when all tiles are cleared', () => {
    const state = createInitialState(0);
    // Mark all tiles cleared except 3 matching tiles
    state.tiles.forEach(t => {
      t.cleared = true;
    });

    state.tiles[0]!.cleared = false;
    state.tiles[0]!.isBlocked = false;
    state.tiles[0]!.type = 'apple';

    state.tiles[1]!.cleared = false;
    state.tiles[1]!.isBlocked = false;
    state.tiles[1]!.type = 'apple';

    state.tiles[2]!.cleared = false;
    state.tiles[2]!.isBlocked = false;
    state.tiles[2]!.type = 'apple';

    pickTile(state, state.tiles[0]!.id);
    pickTile(state, state.tiles[1]!.id);
    const res = pickTile(state, state.tiles[2]!.id);

    expect(res.success).toBe(true);
    expect(state.status).toBe('won');
    expect(state.score).toBe(800); // 300 for match + 500 level clear bonus
  });

  it('allows undoing the previous move and restores tray and board', () => {
    const state = createInitialState(0);
    const tile = state.tiles.find(t => !t.isBlocked)!;

    pickTile(state, tile.id);
    expect(state.tray.length).toBe(1);
    expect(state.moves).toBe(1);

    const undid = undoMove(state);
    expect(undid).toBe(true);
    expect(state.tray.length).toBe(0);
    expect(state.moves).toBe(0);

    const restoredTile = state.tiles.find(t => t.id === tile.id)!;
    expect(restoredTile.inTray).toBe(false);
  });

  it('shuffles the types of uncleared tiles on the board', () => {
    const state = createInitialState(0);
    const initialTypes = state.tiles.map(t => t.type);

    const shuffled = shuffleBoard(state);
    expect(shuffled).toBe(true);

    const afterTypes = state.tiles.map(t => t.type);
    expect(afterTypes.length).toBe(initialTypes.length);

    // Total counts of each type should remain identical
    const countTypes = (arr: string[]) => {
      const counts: Record<string, number> = {};
      arr.forEach(t => {
        counts[t] = (counts[t] || 0) + 1;
      });
      return counts;
    };

    expect(countTypes(afterTypes)).toEqual(countTypes(initialTypes));
  });

  it('loads all 4 campaign levels with multiples of 3 tiles', () => {
    CAMPAIGN_LEVELS.forEach(level => {
      expect(level.tileDefs.length % 3).toBe(0);
      const state = createInitialState(level.id - 1);
      expect(state.level).toBe(level.id);
      expect(state.tiles.length).toBe(level.tileDefs.length);
    });
  });
});
