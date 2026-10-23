import { describe, it, expect } from 'bun:test';
import {
  initializePantryLevel,
  handleSlotClick,
  moveItem,
  resolveMatchesAndHiddenItems,
  tickPantryTimer,
  Shelf,
} from './engine';

describe('Farm Pantry Sort: Triple Pick Core Engine', () => {
  it('initializes Level 1 with 3 shelves and 6 total items', () => {
    const state = initializePantryLevel(1);
    expect(state.level).toBe(1);
    expect(state.shelves.length).toBe(3);
    expect(state.totalItemsRemaining).toBe(6);
    expect(state.shelves[0].items.length).toBe(3);
    expect(state.shelves[1].items.length).toBe(3);
    expect(state.shelves[2].items.length).toBe(0); // empty sorting shelf
    expect(state.isWon).toBe(false);
    expect(state.isGameOver).toBe(false);
  });

  it('selects an item on a shelf when clicked', () => {
    const state = initializePantryLevel(1);
    const selectedState = handleSlotClick(state, 's1', 0);
    expect(selectedState.selectedShelfId).toBe('s1');
    expect(selectedState.selectedItemIndex).toBe(0);
  });

  it('deselects the item if clicked again', () => {
    const state = initializePantryLevel(1);
    const selectedState = handleSlotClick(state, 's1', 0);
    const deselectedState = handleSlotClick(selectedState, 's1', 0);
    expect(deselectedState.selectedShelfId).toBeNull();
    expect(deselectedState.selectedItemIndex).toBeNull();
  });

  it('moves an item to an empty slot on another shelf', () => {
    const state = initializePantryLevel(1);
    const nextState = moveItem(state, 's1', 0, 's3');
    expect(nextState.shelves[0].items.length).toBe(2);
    expect(nextState.shelves[2].items.length).toBe(1);
    expect(nextState.moves).toBe(1);
  });

  it('detects a 3-match on a shelf, clears it and awards 300 points', () => {
    const testShelves: Shelf[] = [
      {
        id: 's1',
        capacity: 3,
        items: [
          { id: '1', type: 'honey' },
          { id: '2', type: 'honey' },
          { id: '3', type: 'honey' },
        ],
        hiddenQueue: [],
      },
    ];

    const result = resolveMatchesAndHiddenItems(testShelves);
    expect(result.clearedCount).toBe(3);
    expect(result.pointsEarned).toBe(300);
    expect(result.updatedShelves[0].items.length).toBe(0);
  });

  it('pulls forward hidden reserve items when front shelf clears', () => {
    const testShelves: Shelf[] = [
      {
        id: 's1',
        capacity: 3,
        items: [
          { id: '1', type: 'milk' },
          { id: '2', type: 'milk' },
          { id: '3', type: 'milk' },
        ],
        hiddenQueue: [
          { id: '4', type: 'eggs' },
          { id: '5', type: 'eggs' },
        ],
      },
    ];

    const result = resolveMatchesAndHiddenItems(testShelves);
    expect(result.clearedCount).toBe(3);
    expect(result.updatedShelves[0].items.length).toBe(2);
    expect(result.updatedShelves[0].items[0].type).toBe('eggs');
    expect(result.updatedShelves[0].hiddenQueue.length).toBe(0);
  });

  it('triggers victory when all items in pantry are cleared', () => {
    const state = initializePantryLevel(1);
    // Artificially set total items to 3 and assemble a match
    state.totalItemsRemaining = 3;
    state.shelves[0].items = [
      { id: '1', type: 'honey' },
      { id: '2', type: 'honey' },
    ];
    state.shelves[1].items = [
      { id: '3', type: 'honey' },
    ];

    const winState = moveItem(state, 's1', 0, 's1'); // or moving from s2 to s1
    const finalMove = moveItem(state, 's2', 0, 's1');
    expect(finalMove.isWon).toBe(true);
    expect(finalMove.totalItemsRemaining).toBe(0);
  });

  it('handles timer countdown and game over when time runs out', () => {
    const state = initializePantryLevel(1);
    const ticked = tickPantryTimer(state, 10);
    expect(ticked.timeRemaining).toBe(80);
    expect(ticked.isGameOver).toBe(false);

    const expired = tickPantryTimer(ticked, 90);
    expect(expired.timeRemaining).toBe(0);
    expect(expired.isGameOver).toBe(true);
  });
});
