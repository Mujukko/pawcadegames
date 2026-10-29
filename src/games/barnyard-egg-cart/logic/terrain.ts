import { CoinPickup, PowerUpItem, PowerUpType } from './types';

/**
 * Procedural continuous terrain height generator for Barnyard Egg Cart.
 * Continuous function returning ground Y for any world X position.
 * Coordinate system: X is forward, Y is downward (Canvas standard: Y increases downward).
 * Higher ground means smaller Y values. Ground baseline is around Y = 360.
 */

export const GROUND_BASELINE = 360;

export function getTerrainHeight(x: number): number {
  // Safe flat start zone for the first 120 pixels/meters
  if (x < 120) {
    return GROUND_BASELINE;
  }

  // Smooth blending transition from flat to pasture hills
  const blend = Math.min(1, (x - 120) / 100);

  // Difficulty scaling factor based on distance
  const difficulty = 1 + Math.min(2.5, (x - 120) / 1200);

  // Composite multi-frequency rolling hills
  const wave1 = Math.sin((x - 120) * 0.004) * 55 * difficulty;
  const wave2 = Math.sin((x - 120) * 0.012 + 1.2) * 25 * Math.min(1.8, difficulty);
  const wave3 = Math.cos((x - 120) * 0.0018) * 40;

  // Occasional fun features:
  // Steep hill climb at x % 800 between 300 and 500
  const featureCycle = x % 850;
  let featureBump = 0;
  if (featureCycle > 250 && featureCycle < 480) {
    const p = (featureCycle - 250) / 230;
    featureBump = -Math.sin(p * Math.PI) * 50 * difficulty; // Upward climb
  } else if (featureCycle > 600 && featureCycle < 750) {
    const p = (featureCycle - 600) / 150;
    featureBump = Math.sin(p * Math.PI) * 35; // Gentle valley dip
  }

  const heightOffset = (wave1 + wave2 + wave3 + featureBump) * blend;
  return GROUND_BASELINE + heightOffset;
}

/**
 * Calculates terrain slope angle (in radians) at world X.
 */
export function getTerrainSlopeAngle(x: number): number {
  const delta = 2.0;
  const y1 = getTerrainHeight(x - delta);
  const y2 = getTerrainHeight(x + delta);
  return Math.atan2(y2 - y1, delta * 2);
}

/**
 * Generates coin and power-up pickups along a segment of terrain.
 */
export function generateItemsForSegment(
  startX: number,
  endX: number
): { coins: CoinPickup[]; powerUps: PowerUpItem[] } {
  const coins: CoinPickup[] = [];
  const powerUps: PowerUpItem[] = [];

  // Spawn spacing
  const step = 60;
  const firstStep = Math.ceil(Math.max(160, startX) / step) * step;

  for (let x = firstStep; x <= endX; x += step) {
    const groundY = getTerrainHeight(x);

    // Occasional powerups every ~350m
    const isPowerUpSlot = Math.floor(x / 350) !== Math.floor((x - step) / 350);
    if (isPowerUpSlot && x > 200) {
      const types: PowerUpType[] = ['shield', 'magnet', 'turbo'];
      const typeIndex = Math.floor(x / 350) % types.length;
      powerUps.push({
        id: `pw_${Math.floor(x)}`,
        type: types[typeIndex],
        x,
        y: groundY - 55,
        collected: false,
      });
      continue;
    }

    // Regular coin arcs over hills
    const coinPattern = Math.floor(x / 40) % 6;
    if (coinPattern < 4) {
      const arcHeight = Math.sin((coinPattern / 4) * Math.PI) * 20;
      coins.push({
        id: `c_${Math.floor(x)}`,
        x,
        y: groundY - 45 - arcHeight,
        value: 1,
        collected: false,
      });
    }
  }

  return { coins, powerUps };
}
