import { describe, expect, it } from 'bun:test';
import {
  INGREDIENTS,
  RECIPES,
  SHIFT_CONFIGS,
  addIngredientToPrepBoard,
  clearPrepBoard,
  createInitialGameState,
  discardStove,
  findMatchingRecipe,
  serveDish,
  startCookingOnStove,
  updateEngineTick,
} from './engine';

describe('Chef Rat Rush Core Engine', () => {
  it('initializes game state with Shift 1 defaults', () => {
    const state = createInitialGameState(1);
    expect(state.shiftNumber).toBe(1);
    expect(state.status).toBe('playing');
    expect(state.score).toBe(0);
    expect(state.combo).toBe(0);
    expect(state.activeTickets.length).toBe(1);
    expect(state.prepBoard.length).toBe(0);
    expect(state.stove.status).toBe('empty');
    expect(state.timeRemaining).toBe(SHIFT_CONFIGS[0]!.shiftDuration);
  });

  describe('Prep Board Mechanics', () => {
    it('adds valid ingredients up to capacity of 5', () => {
      let state = createInitialGameState(1);
      state = addIngredientToPrepBoard(state, 'tomato');
      state = addIngredientToPrepBoard(state, 'cheese');
      state = addIngredientToPrepBoard(state, 'baguette');

      expect(state.prepBoard).toEqual(['tomato', 'cheese', 'baguette']);

      // Add 2 more
      state = addIngredientToPrepBoard(state, 'berries');
      state = addIngredientToPrepBoard(state, 'croissant');
      expect(state.prepBoard.length).toBe(5);

      // Attempt 6th should be rejected
      state = addIngredientToPrepBoard(state, 'lettuce');
      expect(state.prepBoard.length).toBe(5);
    });

    it('rejects invalid or unknown ingredients', () => {
      let state = createInitialGameState(1);
      state = addIngredientToPrepBoard(state, 'dragonfruit_invalid');
      expect(state.prepBoard.length).toBe(0);
    });

    it('clears prep board properly', () => {
      let state = createInitialGameState(1);
      state = addIngredientToPrepBoard(state, 'tomato');
      state = clearPrepBoard(state);
      expect(state.prepBoard).toEqual([]);
    });
  });

  describe('Recipe Matching Logic', () => {
    it('matches cold recipes regardless of ingredient addition order', () => {
      const cheeseBaguette = findMatchingRecipe(['tomato', 'baguette', 'cheese']);
      expect(cheeseBaguette).not.toBeNull();
      expect(cheeseBaguette?.id).toBe('cheese-baguette');
      expect(cheeseBaguette?.requiresCooking).toBe(false);

      const bistroSalad = findMatchingRecipe(['lettuce', 'cheese', 'tomato']);
      expect(bistroSalad?.id).toBe('bistro-salad');
    });

    it('matches hot cookable recipes', () => {
      const ratatouille = findMatchingRecipe(['zucchini', 'eggplant', 'tomato']);
      expect(ratatouille?.id).toBe('ratatouille');
      expect(ratatouille?.requiresCooking).toBe(true);

      const crepe = findMatchingRecipe(['berries', 'cheese']);
      expect(crepe?.id).toBe('berry-crepe');
      expect(crepe?.requiresCooking).toBe(true);
    });

    it('returns null for incomplete or invalid combinations', () => {
      expect(findMatchingRecipe([])).toBeNull();
      expect(findMatchingRecipe(['tomato'])).toBeNull();
      expect(findMatchingRecipe(['eggplant', 'cheese'])).toBeNull();
    });
  });

  describe('Stove Cooking & Burning', () => {
    it('starts cooking hot recipe and clears prep board', () => {
      let state = createInitialGameState(3);
      state = addIngredientToPrepBoard(state, 'eggplant');
      state = addIngredientToPrepBoard(state, 'tomato');
      state = addIngredientToPrepBoard(state, 'zucchini');

      const result = startCookingOnStove(state);
      expect(result.success).toBe(true);
      expect(result.state.prepBoard.length).toBe(0);
      expect(result.state.stove.status).toBe('cooking');
      expect(result.state.stove.recipeId).toBe('ratatouille');
      expect(result.state.stove.cookingProgress).toBe(0);
    });

    it('rejects cooking if dish does not require cooking (served cold)', () => {
      let state = createInitialGameState(1);
      state = addIngredientToPrepBoard(state, 'baguette');
      state = addIngredientToPrepBoard(state, 'cheese');
      state = addIngredientToPrepBoard(state, 'tomato');

      const result = startCookingOnStove(state);
      expect(result.success).toBe(false);
      expect(result.message).toContain('served cold');
      expect(result.state.stove.status).toBe('empty');
    });

    it('rejects cooking if stove is already occupied', () => {
      let state = createInitialGameState(3);
      state.stove.status = 'cooking';
      state.stove.recipeId = 'ratatouille';
      state = addIngredientToPrepBoard(state, 'berries');
      state = addIngredientToPrepBoard(state, 'cheese');

      const result = startCookingOnStove(state);
      expect(result.success).toBe(false);
      expect(result.message).toContain('occupied');
    });

    it('allows discarding/emptying stove', () => {
      let state = createInitialGameState(3);
      state.stove.status = 'burnt';
      state.stove.recipeId = 'ratatouille';

      state = discardStove(state);
      expect(state.stove.status).toBe('empty');
      expect(state.stove.recipeId).toBeNull();
    });
  });

  describe('Order Serving Mechanics', () => {
    it('serves a cold dish directly from prep board to matching customer', () => {
      let state = createInitialGameState(1);
      state.activeTickets = [
        {
          id: 'test-1',
          recipeId: 'cheese-baguette',
          customerName: 'Pierre',
          customerIcon: '🦊',
          isVIP: false,
          totalPatience: 20,
          currentPatience: 20,
        },
      ];

      state = addIngredientToPrepBoard(state, 'baguette');
      state = addIngredientToPrepBoard(state, 'cheese');
      state = addIngredientToPrepBoard(state, 'tomato');

      const res = serveDish(state);
      expect(res.success).toBe(true);
      expect(res.servedRecipeName).toBe('French Cheese Baguette');
      expect(res.pointsEarned).toBeGreaterThan(0);
      expect(res.state.activeTickets.length).toBe(0);
      expect(res.state.prepBoard.length).toBe(0);
      expect(res.state.combo).toBe(1);
      expect(res.state.ordersServed).toBe(1);
    });

    it('fails to serve hot recipe directly from prep board without cooking', () => {
      let state = createInitialGameState(3);
      state.activeTickets = [
        {
          id: 'test-2',
          recipeId: 'ratatouille',
          customerName: 'Anton',
          customerIcon: '🦉',
          isVIP: false,
          totalPatience: 20,
          currentPatience: 20,
        },
      ];

      state = addIngredientToPrepBoard(state, 'eggplant');
      state = addIngredientToPrepBoard(state, 'tomato');
      state = addIngredientToPrepBoard(state, 'zucchini');

      const res = serveDish(state);
      expect(res.success).toBe(false);
      expect(res.message).toContain('needs to be cooked on the stove first');
    });

    it('serves cooked dish from stove when ready', () => {
      let state = createInitialGameState(3);
      state.activeTickets = [
        {
          id: 'test-3',
          recipeId: 'ratatouille',
          customerName: 'Anton',
          customerIcon: '🦉',
          isVIP: true,
          totalPatience: 20,
          currentPatience: 18,
        },
      ];

      state.stove = {
        status: 'ready',
        recipeId: 'ratatouille',
        cookingProgress: 1.0,
        burnProgress: 0.1,
        elapsedSeconds: 0.5,
      };

      const res = serveDish(state);
      expect(res.success).toBe(true);
      expect(res.servedRecipeName).toBe('Gourmet Ratatouille');
      expect(res.state.activeTickets.length).toBe(0);
      expect(res.state.stove.status).toBe('empty');
      expect(res.state.ordersServed).toBe(1);
      expect(res.pointsEarned).toBeGreaterThan(RECIPES['ratatouille']!.baseReward); // VIP + speed
    });

    it('resets combo when dish does not match any active customer ticket', () => {
      let state = createInitialGameState(1);
      state.combo = 3;
      state.activeTickets = [
        {
          id: 'test-4',
          recipeId: 'golden-croissant',
          customerName: 'Madame Colette',
          customerIcon: '🐰',
          isVIP: false,
          totalPatience: 20,
          currentPatience: 20,
        },
      ];

      // Prepare cheese baguette instead
      state = addIngredientToPrepBoard(state, 'baguette');
      state = addIngredientToPrepBoard(state, 'cheese');
      state = addIngredientToPrepBoard(state, 'tomato');

      const res = serveDish(state);
      expect(res.success).toBe(false);
      expect(res.message).toContain('No customer ordered');
      expect(res.state.combo).toBe(0); // Reset
    });
  });

  describe('Engine Tick Simulation', () => {
    it('simulates stove cooking progression from cooking to ready to burnt', () => {
      const config = SHIFT_CONFIGS[2]!;
      let state = createInitialGameState(3);
      state.stove = {
        status: 'cooking',
        recipeId: 'ratatouille',
        cookingProgress: 0,
        burnProgress: 0,
        elapsedSeconds: 0,
      };

      // Ratatouille takes 3.2s to cook
      let tick = updateEngineTick(state, 1.6, config, 0);
      expect(tick.state.stove.status).toBe('cooking');
      expect(tick.state.stove.cookingProgress).toBeCloseTo(0.5, 1);

      // Cook remaining 1.7s -> triggers ready
      tick = updateEngineTick(tick.state, 1.7, config, 0);
      expect(tick.state.stove.status).toBe('ready');
      expect(tick.state.stove.cookingProgress).toBe(1.0);

      // Burn timer is 4.8s. Advance 5s -> triggers burnt!
      tick = updateEngineTick(tick.state, 5.0, config, 0);
      expect(tick.state.stove.status).toBe('burnt');
    });

    it('decays customer patience and drops ticket when expired', () => {
      const config = SHIFT_CONFIGS[0]!;
      let state = createInitialGameState(1);
      state.combo = 4;
      state.activeTickets = [
        {
          id: 'expiring-ticket',
          recipeId: 'cheese-baguette',
          customerName: 'Pierre',
          customerIcon: '🦊',
          isVIP: false,
          totalPatience: 10,
          currentPatience: 2,
        },
      ];

      // Tick 3 seconds
      const tick = updateEngineTick(state, 3, config, 0);
      expect(tick.expiredTicketId).toBe('expiring-ticket');
      expect(tick.state.activeTickets.length).toBe(0);
      expect(tick.state.ordersLost).toBe(1);
      expect(tick.state.combo).toBe(0); // combo reset
    });

    it('triggers shift-won when time expires with target score achieved', () => {
      const config = SHIFT_CONFIGS[0]!;
      let state = createInitialGameState(1);
      state.timeRemaining = 1;
      state.score = config.targetScore * 1.6; // High score for 3 stars

      const tick = updateEngineTick(state, 1.5, config, 0);
      expect(tick.state.timeRemaining).toBe(0);
      expect(tick.state.status).toBe('shift-won');
      expect(tick.state.stars).toBe(3);
    });

    it('triggers shift-lost when time expires without target score', () => {
      const config = SHIFT_CONFIGS[0]!;
      let state = createInitialGameState(1);
      state.timeRemaining = 1;
      state.score = 20; // Target is 100

      const tick = updateEngineTick(state, 1.5, config, 0);
      expect(tick.state.timeRemaining).toBe(0);
      expect(tick.state.status).toBe('shift-lost');
      expect(tick.state.stars).toBe(0);
    });
  });
});
