import { describe, expect, test } from 'bun:test';
import {
  initializeEggCartGame,
  tickEggCartGame,
  purchaseCartUpgrade,
  getUpgradeCost,
} from './engine';
import { getTerrainHeight, getTerrainSlopeAngle, GROUND_BASELINE } from './terrain';
import { createInitialCart, stepCartPhysics } from './physics';

describe('Barnyard Egg Cart: Pasture Hill Logic Engine', () => {
  test('initializes game with valid defaults and cart on ground baseline', () => {
    const state = initializeEggCartGame(50, undefined, 120);
    expect(state.coins).toBe(50);
    expect(state.highScoreDistance).toBe(120);
    expect(state.distanceMeters).toBe(0);
    expect(state.gameOver).toBe(false);
    expect(state.gameOverReason).toBeNull();
    expect(state.cart.egg.inCup).toBe(true);
    expect(state.cart.egg.cracked).toBe(false);
    expect(state.cart.egg.distress).toBe('happy');
    expect(state.cart.y).toBeCloseTo(GROUND_BASELINE - 28, 1);
  });

  test('generates continuous flat terrain in start zone and rolling hills beyond', () => {
    expect(getTerrainHeight(0)).toBe(GROUND_BASELINE);
    expect(getTerrainHeight(60)).toBe(GROUND_BASELINE);
    expect(getTerrainHeight(110)).toBe(GROUND_BASELINE);

    const hillHeight = getTerrainHeight(280);
    expect(typeof hillHeight).toBe('number');
    expect(Number.isFinite(hillHeight)).toBe(true);

    const slopeAngle = getTerrainSlopeAngle(280);
    expect(Number.isFinite(slopeAngle)).toBe(true);
  });

  test('accelerates cart forward when gas pedal is pressed', () => {
    let state = initializeEggCartGame(0);
    state.gasPressed = true;

    // Simulate 10 ticks with gas pressed
    for (let i = 0; i < 10; i++) {
      const res = tickEggCartGame(state, 0.02);
      state = res.state;
    }

    expect(state.cart.rearWheel.vx).toBeGreaterThan(0);
    expect(state.cart.vx).toBeGreaterThan(0);
    expect(state.cart.x).toBeGreaterThan(60);
  });

  test('decelerates or reverses wheels when brake pedal is pressed', () => {
    let state = initializeEggCartGame(0);
    state.cart.rearWheel.vx = 80;
    state.cart.frontWheel.vx = 80;
    state.brakePressed = true;

    const res = tickEggCartGame(state, 0.03);
    expect(res.state.cart.rearWheel.vx).toBeLessThan(80);
  });

  test('prevents cart from reversing backwards past the starting line barrier', () => {
    let state = initializeEggCartGame(0);
    state.brakePressed = true;

    // Simulate 30 frames of continuous reversing at the start
    for (let i = 0; i < 30; i++) {
      const res = tickEggCartGame(state, 0.033);
      state = res.state;
    }

    // Rear wheel cannot go behind starting barrier (20)
    expect(state.cart.rearWheel.x).toBeGreaterThanOrEqual(20);
    expect(state.cart.x).toBeGreaterThanOrEqual(50);
    expect(state.cart.egg.inCup).toBe(true);
    expect(state.gameOver).toBe(false);
  });

  test('switches egg distress to nervous when tilted or driving fast', () => {
    const cart = createInitialCart(100);
    // Position wheels with steep tilt angle (0.85 rad > 0.65)
    const tiltAngle = 0.85;
    cart.frontWheel.x = cart.rearWheel.x + 68 * Math.cos(tiltAngle);
    cart.frontWheel.y = cart.rearWheel.y + 68 * Math.sin(tiltAngle);

    const { cart: nextCart } = stepCartPhysics(
      cart,
      false,
      false,
      { suspension: 0, eggCupCushion: 0, tireTraction: 0, cupDepth: 0 },
      { shieldTimer: 0, magnetTimer: 0, turboTimer: 0 },
      0.02
    );

    expect(nextCart.egg.distress).toBe('nervous');
  });

  test('cracks egg and triggers game over when cart overturns', () => {
    let state = initializeEggCartGame(0);
    state.cart = createInitialCart(150);
    // Invert front and rear wheels to simulate cart flipping upside down (angle ~ 2.6 rad > 2.2)
    const flipAngle = 2.6;
    state.cart.frontWheel.x = state.cart.rearWheel.x + 68 * Math.cos(flipAngle);
    state.cart.frontWheel.y = state.cart.rearWheel.y + 68 * Math.sin(flipAngle);

    const res = tickEggCartGame(state, 0.02);
    expect(res.state.gameOver).toBe(true);
    expect(res.state.cart.egg.cracked).toBe(true);
    expect(res.events.eggCracked).toBe(true);
    expect(res.state.gameOverReason).toBe('tipped');
  });

  test('shield power-up prevents egg cracking on ground impact', () => {
    const cart = createInitialCart(100);
    cart.egg.inCup = false;
    cart.egg.x = 100;
    // Position egg below terrain ground
    const groundY = getTerrainHeight(100);
    cart.egg.y = groundY + 10;

    const { cracked } = stepCartPhysics(
      cart,
      false,
      false,
      { suspension: 0, eggCupCushion: 0, tireTraction: 0, cupDepth: 0 },
      { shieldTimer: 8.0, magnetTimer: 0, turboTimer: 0 }, // Shield ACTIVE!
      0.02
    );

    expect(cracked).toBe(false);
    expect(cart.egg.cracked).toBe(false);
  });

  test('collects coins and updates running wallet and high score distance', () => {
    let state = initializeEggCartGame(10, undefined, 5);
    // Place a coin directly on cart center
    state.coinsPickups = [
      { id: 'test_c1', x: state.cart.x, y: state.cart.y, value: 5, collected: false },
    ];

    const res = tickEggCartGame(state, 0.02);
    expect(res.events.coinCollected).toBe(true);
    expect(res.state.coins).toBe(15);
    expect(res.state.coinsThisRun).toBe(5);
  });

  test('magnet pulls distant coins towards the cart when active', () => {
    let state = initializeEggCartGame(0);
    state.activePowerUps.magnetTimer = 8;
    // Place coin 100px away within magnet radius (180px)
    state.coinsPickups = [
      { id: 'mag_c1', x: state.cart.x + 100, y: state.cart.y, value: 1, collected: false },
    ];

    const res = tickEggCartGame(state, 0.02);
    const updatedCoin = res.state.coinsPickups.find((c) => c.id === 'mag_c1')!;
    expect(updatedCoin.x).toBeLessThan(state.cart.x + 100);
  });

  test('purchases cart upgrades with valid cost progression and caps at level 5', () => {
    let state = initializeEggCartGame(200);

    const cost0 = getUpgradeCost('suspension', 0);
    expect(cost0).toBe(20);

    state = purchaseCartUpgrade(state, 'suspension');
    expect(state.upgrades.suspension).toBe(1);
    expect(state.coins).toBe(180);

    // Max out upgrade to level 5
    state.coins = 5000;
    for (let i = 1; i < 5; i++) {
      state = purchaseCartUpgrade(state, 'suspension');
    }
    expect(state.upgrades.suspension).toBe(5);

    // Attempt purchase past level 5 should be rejected
    const coinsBefore = state.coins;
    state = purchaseCartUpgrade(state, 'suspension');
    expect(state.upgrades.suspension).toBe(5);
    expect(state.coins).toBe(coinsBefore);
  });
});
