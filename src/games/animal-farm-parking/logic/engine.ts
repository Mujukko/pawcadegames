import { CowState, GameState, LevelConfig, Obstacle, ParkingSlot, PlayerInput } from './types';

/**
 * Normalizes an angle into [-PI, PI]
 */
export function normalizeAngle(angle: number): number {
  let a = angle % (Math.PI * 2);
  if (a > Math.PI) a -= Math.PI * 2;
  if (a < -Math.PI) a += Math.PI * 2;
  return a;
}

/**
 * Updates dynamic obstacle positions (such as patrolling sheep) deterministically.
 */
export function updateObstacles(obstacles: Obstacle[], elapsedTime: number): Obstacle[] {
  return obstacles.map((obs) => {
    if (!obs.patrol) return obs;
    const { axis, min, max, speed } = obs.patrol;
    const range = max - min;
    if (range <= 0 || speed <= 0) return obs;

    const legTime = range / speed;
    const cycleTime = legTime * 2;
    // Calculate phase offset so obstacle begins at its initial position at t = 0
    const initialCoord = axis === 'x' ? obs.x : obs.y;
    const clampedCoord = Math.max(min, Math.min(max, initialCoord));
    const startOffset = (clampedCoord - min) / speed;

    const t = (elapsedTime + startOffset) % cycleTime;
    let currentCoord: number;
    let rotation = obs.rotation ?? 0;

    if (t < legTime) {
      // Forward leg (increasing coordinate: min -> max)
      const fraction = t / legTime;
      currentCoord = min + fraction * range;
      if (axis === 'x') {
        rotation = 0; // Facing right
      } else {
        rotation = Math.PI / 2; // Facing down
      }
    } else {
      // Return leg (decreasing coordinate: max -> min)
      const fraction = (t - legTime) / legTime;
      currentCoord = max - fraction * range;
      if (axis === 'x') {
        rotation = Math.PI; // Facing left
      } else {
        rotation = -Math.PI / 2; // Facing up
      }
    }

    if (axis === 'x') {
      return { ...obs, x: currentCoord, rotation };
    } else {
      return { ...obs, y: currentCoord, rotation };
    }
  });
}

/**
 * Creates initial game state for Animal Farm Parking
 */
export function createInitialState(level: LevelConfig): GameState {
  const cow: CowState = {
    x: level.cowStart.x,
    y: level.cowStart.y,
    rotation: level.cowStart.rotation,
    speed: 0,
    width: 60, // length along facing direction
    height: 36, // width across body
    health: 100, // 100% HP
    maxSpeed: 180,
    maxReverseSpeed: 95,
    acceleration: 240,
    turnSpeed: 2.8,
    friction: 0.92,
  };

  const milkBottles = level.milkBottles
    ? level.milkBottles.map((b) => ({ ...b, collected: false }))
    : [];

  const initialObstacles = level.obstacles.map((o) => ({ ...o, rotation: o.rotation ?? 0 }));
  const obstacles = updateObstacles(initialObstacles, 0);

  return {
    levelId: level.id,
    cow,
    obstacles,
    parkingAccuracy: 0,
    isColliding: false,
    collidingWithIds: [],
    parkedHoldTime: 0,
    milkBottles,
    milkCollected: 0,
    totalMilk: milkBottles.length,
    justCollectedMilkId: null,
    elapsedTime: 0,
    isCompleted: false,
    isGameOver: false,
  };
}

/**
 * Calculates circles along the cow's body for robust multi-point collision checks.
 */
export function getCowCollisionCircles(cow: CowState): { x: number; y: number; r: number }[] {
  const r = cow.height / 2;
  const offset = cow.width / 2 - r;
  const cos = Math.cos(cow.rotation);
  const sin = Math.sin(cow.rotation);

  return [
    // Front circle (head/chest)
    { x: cow.x + cos * offset, y: cow.y + sin * offset, r },
    // Center circle (belly)
    { x: cow.x, y: cow.y, r: r * 0.95 },
    // Rear circle (rump)
    { x: cow.x - cos * offset, y: cow.y - sin * offset, r },
  ];
}

/**
 * Checks if a circle intersects an axis-aligned bounding box (AABB) or rotated box
 */
export function circleIntersectsRect(
  cx: number,
  cy: number,
  cr: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number,
  rRot: number = 0
): boolean {
  // Transform circle into rectangle local coordinate space
  let localX = cx - rx;
  let localY = cy - ry;

  if (rRot !== 0) {
    const cos = Math.cos(-rRot);
    const sin = Math.sin(-rRot);
    const tx = localX * cos - localY * sin;
    const ty = localX * sin + localY * cos;
    localX = tx;
    localY = ty;
  }

  // Find closest point in local AABB [-rw/2, rw/2], [-rh/2, rh/2]
  const halfW = rw / 2;
  const halfH = rh / 2;

  const closestX = Math.max(-halfW, Math.min(halfW, localX));
  const closestY = Math.max(-halfH, Math.min(halfH, localY));

  const distX = localX - closestX;
  const distY = localY - closestY;

  return distX * distX + distY * distY < cr * cr;
}

/**
 * Checks collisions between the cow and all obstacles + outer farm boundaries
 */
export function checkCollisions(
  cow: CowState,
  obstacles: Obstacle[],
  farmWidth: number,
  farmHeight: number
): { isColliding: boolean; collidingWithIds: string[] } {
  const circles = getCowCollisionCircles(cow);
  const collidingIds: string[] = [];

  // Check outer farm perimeter walls
  let hitsPerimeter = false;
  for (const c of circles) {
    if (c.x - c.r < 14 || c.x + c.r > farmWidth - 14 || c.y - c.r < 14 || c.y + c.r > farmHeight - 14) {
      hitsPerimeter = true;
      break;
    }
  }
  if (hitsPerimeter) {
    collidingIds.push('fence_perimeter');
  }

  // Check obstacles
  for (const obs of obstacles) {
    let hit = false;
    for (const c of circles) {
      if (circleIntersectsRect(c.x, c.y, c.r, obs.x, obs.y, obs.width, obs.height, obs.rotation || 0)) {
        hit = true;
        break;
      }
    }
    if (hit) {
      collidingIds.push(obs.id);
    }
  }

  return {
    isColliding: collidingIds.length > 0,
    collidingWithIds: collidingIds,
  };
}

/**
 * Computes percentage parking accuracy (0% to 100%) of the cow inside the target stall.
 */
export function calculateParkingAccuracy(cow: CowState, slot: ParkingSlot): number {
  const dx = cow.x - slot.x;
  const dy = cow.y - slot.y;
  const dist = Math.hypot(dx, dy);

  // Maximum distance allowance where accuracy is still > 0%
  const maxAllowedDist = Math.hypot(slot.width, slot.height) * 0.75;
  if (dist > maxAllowedDist) return 0;

  // 1. Angular Alignment Verification (forward or reverse docking accepted)
  // Perpendicular or sideways parking (> 35 degrees) strictly receives 0% accuracy
  const diffAngle1 = Math.abs(normalizeAngle(cow.rotation - slot.rotation));
  const diffAngle2 = Math.abs(normalizeAngle(cow.rotation - (slot.rotation + Math.PI)));
  const minAngleDiff = Math.min(diffAngle1, diffAngle2);

  const maxAngleTolerance = Math.PI * (35 / 180); // 35 degrees (~0.61 rad)
  if (minAngleDiff > maxAngleTolerance) {
    return 0; // Strictly prevent sideways/cross-stall parking
  }

  // 2. Distance Score (0.0 to 1.0)
  const distScore = Math.max(0, 1 - dist / maxAllowedDist);

  // 3. Local Coordinates Containment inside Slot
  // Transform cow center into slot local coordinates
  const cos = Math.cos(-slot.rotation);
  const sin = Math.sin(-slot.rotation);
  const localX = Math.abs(dx * cos - dy * sin);
  const localY = Math.abs(dx * sin + dy * cos);

  const halfSlotW = slot.width / 2;
  const halfSlotH = slot.height / 2;

  const inXScore = Math.max(0, 1 - localX / (halfSlotW * 1.25));
  const inYScore = Math.max(0, 1 - localY / (halfSlotH * 1.25));
  const containmentScore = inXScore * inYScore;

  const angleScore = Math.max(0, 1 - minAngleDiff / maxAngleTolerance);

  // Weighted combination:
  // - Containment: 45%
  // - Distance: 25%
  // - Angular Alignment: 30%
  const rawScore = containmentScore * 0.45 + distScore * 0.25 + angleScore * 0.3;

  // Curve response so entering the box feels progressive and rewarding
  const accuracyPercent = Math.min(100, Math.round(Math.pow(rawScore, 1.2) * 100));

  return Math.max(0, accuracyPercent);
}

/**
 * Updates physics, collisions, health drain, milk collection, and parking completion.
 */
export function updateGamePhysics(
  state: GameState,
  input: PlayerInput,
  dt: number,
  level: LevelConfig
): GameState {
  if (state.isCompleted || state.isGameOver) {
    return state;
  }

  const newElapsedTime = state.elapsedTime + dt;
  const obstacles = updateObstacles(level.obstacles, newElapsedTime);

  const cow = { ...state.cow };

  // 1. Calculate input vector and orientation
  let moveX = 0;
  let moveY = 0;

  if (input.right) moveX += 1;
  if (input.left) moveX -= 1;
  if (input.down) moveY += 1;
  if (input.up) moveY -= 1;

  // Manual rotation override if turnLeft or turnRight is passed without left/right
  if (input.turnRight && !input.right) {
    cow.rotation = normalizeAngle(cow.rotation + 2.8 * dt);
  }
  if (input.turnLeft && !input.left) {
    cow.rotation = normalizeAngle(cow.rotation - 2.8 * dt);
  }

  // Legacy forward / reverse support
  if (input.forward && !input.up && !input.down && !input.left && !input.right) {
    moveX += Math.cos(cow.rotation);
    moveY += Math.sin(cow.rotation);
  }
  if (input.reverse && !input.up && !input.down && !input.left && !input.right) {
    cow.speed = Math.max(-cow.maxReverseSpeed, cow.speed - cow.acceleration * 0.75 * dt);
  }

  const hasDirectionalInput = moveX !== 0 || moveY !== 0;

  let deltaMoveX = 0;
  let deltaMoveY = 0;

  if (hasDirectionalInput) {
    const len = Math.hypot(moveX, moveY);
    const normX = moveX / len;
    const normY = moveY / len;

    // Smooth auto-orient cow rotation toward 4-directional motion
    if (input.up || input.down || input.left || input.right) {
      const targetAngle = Math.atan2(normY, normX);
      const angleDiff = normalizeAngle(targetAngle - cow.rotation);
      const turnRate = 18; // rad/s for snappy, responsive turning
      const maxTurnThisFrame = turnRate * dt;
      let newRot = cow.rotation;

      if (Math.abs(angleDiff) <= maxTurnThisFrame) {
        newRot = targetAngle;
      } else {
        newRot += Math.sign(angleDiff) * maxTurnThisFrame;
      }
      newRot = normalizeAngle(newRot);

      // Verify that the new orientation does not rotate cow's body/horns into an obstacle
      const testCowRot: CowState = { ...cow, rotation: newRot };
      const rotCol = checkCollisions(testCowRot, obstacles, level.farmWidth, level.farmHeight);
      if (!rotCol.isColliding) {
        cow.rotation = newRot;
      } else {
        // If diagonal rotation collides, try primary axis orientation (parallel to wall)
        const primaryAngle = moveX !== 0 ? (moveX > 0 ? 0 : Math.PI) : (moveY > 0 ? Math.PI / 2 : -Math.PI / 2);
        const testPrimaryRot: CowState = { ...cow, rotation: primaryAngle };
        if (!checkCollisions(testPrimaryRot, obstacles, level.farmWidth, level.farmHeight).isColliding) {
          cow.rotation = primaryAngle;
        }
      }
    }

    // Accelerate speed smoothly
    cow.speed = Math.min(cow.maxSpeed, cow.speed + cow.acceleration * dt);

    // Calculate motion step
    deltaMoveX = normX * cow.speed * dt;
    deltaMoveY = normY * cow.speed * dt;
  } else if (input.reverse && !input.up && !input.down && !input.left && !input.right) {
    // Reverse movement along facing direction
    deltaMoveX = Math.cos(cow.rotation) * cow.speed * dt;
    deltaMoveY = Math.sin(cow.rotation) * cow.speed * dt;
  } else {
    // Natural friction deceleration when no movement keys are held
    cow.speed *= Math.pow(cow.friction, dt * 60);
    if (Math.abs(cow.speed) < 2) cow.speed = 0;

    deltaMoveX = Math.cos(cow.rotation) * cow.speed * dt;
    deltaMoveY = Math.sin(cow.rotation) * cow.speed * dt;
  }

  // Active braking
  if (input.brake) {
    cow.speed *= Math.pow(0.72, dt * 60);
    if (Math.abs(cow.speed) < 3) cow.speed = 0;
  }

  // 2. Axis-Separated Collision Resolution with Wall Sliding (Stutter-Free!)
  // Instead of blocking all motion or reversing speed (which causes violent jitter),
  // test X and Y independently to allow smooth sliding along walls and fences.
  let resolvedX = cow.x;
  let resolvedY = cow.y;
  let blockedX = false;
  let blockedY = false;
  const collidingIdsList: string[] = [];

  // Try moving along X axis
  if (deltaMoveX !== 0) {
    const testCowX: CowState = { ...cow, x: cow.x + deltaMoveX, y: cow.y };
    const colX = checkCollisions(testCowX, obstacles, level.farmWidth, level.farmHeight);
    if (!colX.isColliding) {
      resolvedX = cow.x + deltaMoveX;
    } else {
      blockedX = true;
      collidingIdsList.push(...colX.collidingWithIds);
    }
  }

  // Try moving along Y axis (incorporating resolved X to enable corner sliding)
  if (deltaMoveY !== 0) {
    const testCowY: CowState = { ...cow, x: resolvedX, y: cow.y + deltaMoveY };
    const colY = checkCollisions(testCowY, obstacles, level.farmWidth, level.farmHeight);
    if (!colY.isColliding) {
      resolvedY = cow.y + deltaMoveY;
    } else {
      blockedY = true;
      collidingIdsList.push(...colY.collidingWithIds);
    }
  }

  // If both axes are blocked, damp speed to zero without oscillation
  if (blockedX && blockedY) {
    cow.speed = 0;
  } else if (blockedX || blockedY) {
    // Wall sliding: reduce speed slightly from wall friction
    cow.speed *= 0.88;
  }

  // Clamp within pasture perimeter bounds
  cow.x = Math.max(25, Math.min(level.farmWidth - 25, resolvedX));
  cow.y = Math.max(25, Math.min(level.farmHeight - 25, resolvedY));

  // Check collision status at final settled position
  const currentCollision = checkCollisions(cow, obstacles, level.farmWidth, level.farmHeight);
  const isColliding = blockedX || blockedY || currentCollision.isColliding;
  const collidingWithIds = Array.from(
    new Set([...collidingIdsList, ...currentCollision.collidingWithIds])
  );

  // 3. Health Damage Over Time
  // While touching any obstacle, drain health % continuously
  let newHealth = cow.health;
  if (isColliding) {
    const DAMAGE_RATE_PER_SECOND = 28; // ~28% damage per second of contact
    newHealth = Math.max(0, cow.health - DAMAGE_RATE_PER_SECOND * dt);
  }
  cow.health = Math.round(newHealth * 10) / 10;

  const isGameOver = cow.health <= 0;

  // 4. Collectible Milk Bottles Pickup Detection
  let milkCollected = state.milkCollected || 0;
  let justCollectedMilkId: string | null = null;
  const currentBottles = state.milkBottles || [];
  const updatedMilkBottles = currentBottles.map((bottle) => {
    if (bottle.collected) return bottle;
    const dist = Math.hypot(cow.x - bottle.x, cow.y - bottle.y);
    // Pickup radius: 38px (half cow width + bottle margin)
    if (dist < 38) {
      milkCollected++;
      justCollectedMilkId = bottle.id;
      return { ...bottle, collected: true };
    }
    return bottle;
  });

  const totalMilk = state.totalMilk || currentBottles.length;
  const hasCollectedAllMilk = milkCollected >= totalMilk;

  // 5. Parking Accuracy Calculation
  const parkingAccuracy = calculateParkingAccuracy(cow, level.parkingSlot);

  // 6. Win Condition Check
  // Must achieve target accuracy (e.g. >= 80%), stay stopped, have no collisions,
  // AND must have collected all milk bottles in the level!
  let parkedHoldTime = state.parkedHoldTime;
  let isCompleted = false;

  const isPositionedWell = parkingAccuracy >= level.targetAccuracy;
  const isStopped = Math.abs(cow.speed) < 18;

  if (isPositionedWell && isStopped && !isColliding && hasCollectedAllMilk) {
    parkedHoldTime += dt;
    if (parkedHoldTime >= level.parkingSlot.requiredHoldSeconds) {
      isCompleted = true;
    }
  } else {
    parkedHoldTime = Math.max(0, parkedHoldTime - dt * 2);
  }

  return {
    ...state,
    cow,
    obstacles,
    parkingAccuracy,
    isColliding,
    collidingWithIds,
    parkedHoldTime,
    milkBottles: updatedMilkBottles,
    milkCollected,
    totalMilk,
    justCollectedMilkId,
    elapsedTime: newElapsedTime,
    isCompleted,
    isGameOver,
  };
}
