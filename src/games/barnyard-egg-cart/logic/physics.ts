import {
  ActivePowerUps,
  CartPhysicsState,
  CartUpgrades,
  EggState,
  WheelState,
} from './types';
import { getTerrainHeight, getTerrainSlopeAngle } from './terrain';

export const GRAVITY = 780; // px/s^2
export const CART_WHEELBASE = 68; // px between rear and front wheel
export const WHEEL_RADIUS = 14; // px
export const CUP_BASE_DEPTH = 16; // px
export const CUP_BASE_WIDTH = 26; // px
export const EGG_RADIUS_X = 12; // px
export const EGG_RADIUS_Y = 16; // px
export const START_BARRIER_X = 20; // px - Rear wheel resting boundary at starting line fence

export function createInitialCart(startX: number = 60): CartPhysicsState {
  const groundY = getTerrainHeight(startX);
  const chassisY = groundY - 28;

  const rearWheel: WheelState = {
    x: startX - CART_WHEELBASE / 2,
    y: groundY - WHEEL_RADIUS,
    vx: 0,
    vy: 0,
    radius: WHEEL_RADIUS,
    onGround: true,
    angularVelocity: 0,
    angle: 0,
  };

  const frontWheel: WheelState = {
    x: startX + CART_WHEELBASE / 2,
    y: groundY - WHEEL_RADIUS,
    vx: 0,
    vy: 0,
    radius: WHEEL_RADIUS,
    onGround: true,
    angularVelocity: 0,
    angle: 0,
  };

  const egg: EggState = {
    x: startX,
    y: chassisY - 14,
    vx: 0,
    vy: 0,
    angle: 0,
    angularVelocity: 0,
    radiusX: EGG_RADIUS_X,
    radiusY: EGG_RADIUS_Y,
    inCup: true,
    cracked: false,
    distress: 'happy',
  };

  return {
    x: startX,
    y: chassisY,
    vx: 0,
    vy: 0,
    angle: 0,
    angularVelocity: 0,
    length: CART_WHEELBASE + 24,
    height: 24,
    frontWheel,
    rearWheel,
    egg,
  };
}

/**
 * Step the cart physics forward by dt seconds.
 */
export function stepCartPhysics(
  cart: CartPhysicsState,
  gas: boolean,
  brake: boolean,
  upgrades: CartUpgrades,
  powerUps: ActivePowerUps,
  dt: number
): { cart: CartPhysicsState; cracked: boolean; reason: 'cracked' | 'lost_egg' | 'tipped' | null } {
  // Clamp dt to prevent tunneling on frame stutter
  const safeDt = Math.min(dt, 0.033);

  // Upgrade modifiers
  const suspensionDamp = 0.88 + upgrades.suspension * 0.02; // max 0.98
  const cupDepth = CUP_BASE_DEPTH + upgrades.cupDepth * 2.5; // up to 28.5px
  const shockAbsorption = 1 - upgrades.eggCupCushion * 0.08; // up to 40% shock reduction
  const tractionBonus = 1 + upgrades.tireTraction * 0.15; // up to +75% torque
  const turboActive = powerUps.turboTimer > 0;
  const shieldActive = powerUps.shieldTimer > 0;

  // 1. Driving Torques & Motor Acceleration
  let motorForce = 0;
  if (gas) {
    motorForce += 380 * tractionBonus * (turboActive ? 1.4 : 1.0);
  }
  if (brake) {
    motorForce -= 340 * tractionBonus;
  }

  // 2. Wheel Ground Collisions and Chassis Pitch
  const rearGroundY = getTerrainHeight(cart.rearWheel.x);
  const frontGroundY = getTerrainHeight(cart.frontWheel.x);

  const rearTargetY = rearGroundY - WHEEL_RADIUS;
  const frontTargetY = frontGroundY - WHEEL_RADIUS;

  // Spring suspension against terrain
  const springStiffness = 320;
  const damper = 14 * suspensionDamp;

  // Rear wheel physics
  cart.rearWheel.vy += GRAVITY * safeDt;
  if (cart.rearWheel.y >= rearTargetY) {
    const pen = cart.rearWheel.y - rearTargetY;
    const springForce = pen * springStiffness - cart.rearWheel.vy * damper;
    cart.rearWheel.vy += springForce * safeDt;
    cart.rearWheel.y = Math.min(cart.rearWheel.y, rearTargetY + 2);
    cart.rearWheel.onGround = true;

    // Apply motor traction along slope
    const rearSlope = getTerrainSlopeAngle(cart.rearWheel.x);
    const driveVx = motorForce * Math.cos(rearSlope);
    const driveVy = motorForce * Math.sin(rearSlope);
    cart.rearWheel.vx += driveVx * safeDt;
    cart.rearWheel.vy += driveVy * safeDt;
  } else {
    cart.rearWheel.onGround = false;
  }

  // Front wheel physics
  cart.frontWheel.vy += GRAVITY * safeDt;
  if (cart.frontWheel.y >= frontTargetY) {
    const pen = cart.frontWheel.y - frontTargetY;
    const springForce = pen * springStiffness - cart.frontWheel.vy * damper;
    cart.frontWheel.vy += springForce * safeDt;
    cart.frontWheel.y = Math.min(cart.frontWheel.y, frontTargetY + 2);
    cart.frontWheel.onGround = true;

    const frontSlope = getTerrainSlopeAngle(cart.frontWheel.x);
    const driveVx = (motorForce * 0.5) * Math.cos(frontSlope);
    const driveVy = (motorForce * 0.5) * Math.sin(frontSlope);
    cart.frontWheel.vx += driveVx * safeDt;
    cart.frontWheel.vy += driveVy * safeDt;
  } else {
    cart.frontWheel.onGround = false;
  }

  // Rolling friction & air resistance
  const rollingFriction = 0.985;
  cart.rearWheel.vx *= rollingFriction;
  cart.frontWheel.vx *= rollingFriction;

  // Move wheels
  cart.rearWheel.x += cart.rearWheel.vx * safeDt;
  cart.rearWheel.y += cart.rearWheel.vy * safeDt;
  cart.frontWheel.x += cart.frontWheel.vx * safeDt;
  cart.frontWheel.y += cart.frontWheel.vy * safeDt;

  // Maintain rigid wheelbase constraint
  const dx = cart.frontWheel.x - cart.rearWheel.x;
  const dy = cart.frontWheel.y - cart.rearWheel.y;
  const currentDist = Math.hypot(dx, dy);
  if (currentDist > 0.001) {
    const diff = (currentDist - CART_WHEELBASE) * 0.5;
    const nx = dx / currentDist;
    const ny = dy / currentDist;
    cart.rearWheel.x += nx * diff;
    cart.rearWheel.y += ny * diff;
    cart.frontWheel.x -= nx * diff;
    cart.frontWheel.y -= ny * diff;
  }

  // Enforce Start Line Barrier: Neither wheel can pass behind the start wall at START_BARRIER_X
  if (cart.rearWheel.x < START_BARRIER_X) {
    cart.rearWheel.x = START_BARRIER_X;
    if (cart.rearWheel.vx < 0) cart.rearWheel.vx = 0;
  }
  if (cart.frontWheel.x < START_BARRIER_X) {
    cart.frontWheel.x = START_BARRIER_X;
    if (cart.frontWheel.vx < 0) cart.frontWheel.vx = 0;
  }

  // Rotate wheels visual angle
  cart.rearWheel.angle += (cart.rearWheel.vx / WHEEL_RADIUS) * safeDt;
  cart.frontWheel.angle += (cart.frontWheel.vx / WHEEL_RADIUS) * safeDt;

  // 3. Chassis Position & Orientation derived from wheels
  const targetChassisX = (cart.rearWheel.x + cart.frontWheel.x) * 0.5;
  const targetChassisY = (cart.rearWheel.y + cart.frontWheel.y) * 0.5 - 14;
  const targetAngle = Math.atan2(cart.frontWheel.y - cart.rearWheel.y, cart.frontWheel.x - cart.rearWheel.x);

  cart.vx = (targetChassisX - cart.x) / safeDt;
  cart.vy = (targetChassisY - cart.y) / safeDt;
  cart.x = targetChassisX;
  cart.y = targetChassisY;
  cart.angle = targetAngle;

  // 4. Egg Cup Target Location in World Space
  // Cup sits slightly above chassis center
  const cupOffsetY = -10;
  const cupCos = Math.cos(cart.angle);
  const cupSin = Math.sin(cart.angle);
  const cupWorldX = cart.x - cupSin * cupOffsetY;
  const cupWorldY = cart.y + cupCos * cupOffsetY;

  // 5. Egg Physics Simulation
  let cracked = false;
  let reason: 'cracked' | 'lost_egg' | 'tipped' | null = null;

  const egg = cart.egg;

  if (egg.inCup) {
    // Egg is nestled in the cart cup
    // Compute displacement relative to cup center
    const relX = egg.x - cupWorldX;
    const relY = egg.y - cupWorldY;

    // Projection along cup axis
    // cup normal (upwards relative to cart): (-cupSin, -cupCos)
    // cup tangent (rightwards relative to cart): (cupCos, -cupSin)
    const cupNormalX = -cupSin;
    const cupNormalY = cupCos;
    const cupTangentX = cupCos;
    const cupTangentY = cupSin;

    // Displacements along cup coordinate system
    const tangDist = relX * cupTangentX + relY * cupTangentY;
    const normDist = relX * cupNormalX + relY * cupNormalY;

    // Inertial spring keeping egg in bottom of cup
    const cupSpring = 420;
    const cupDamp = 18;

    const springForceX = -tangDist * cupSpring - (egg.vx - cart.vx) * cupDamp;
    const springForceY = -normDist * cupSpring - (egg.vy - cart.vy) * cupDamp;

    egg.vx += (springForceX * shockAbsorption) * safeDt;
    egg.vy += (springForceY * shockAbsorption + GRAVITY * 0.3) * safeDt;

    egg.x += egg.vx * safeDt;
    egg.y += egg.vy * safeDt;

    // Soft clamp inside cup rim
    const maxTang = CUP_BASE_WIDTH * 0.5;
    if (Math.abs(tangDist) > maxTang) {
      // Reached rim lip!
      // Check if vertical ejection occurred
      if (normDist > cupDepth || Math.abs(cart.angle) > 1.85) {
        // Ejected from cup!
        egg.inCup = false;
        egg.vx = cart.vx + (tangDist > 0 ? 30 : -30);
        egg.vy = cart.vy - 50;
        egg.angularVelocity = (Math.random() - 0.5) * 8;
      }
    }

    // Egg orientation follows cup angle with slight lag
    egg.angle = cart.angle + tangDist * 0.02;

    // Distress state
    const speed = Math.hypot(cart.vx, cart.vy);
    const absAngle = Math.abs(cart.angle);
    if (absAngle > 0.65 || speed > 420) {
      egg.distress = 'nervous';
    } else {
      egg.distress = 'happy';
    }
  } else {
    // Egg is airborne outside of cup!
    egg.distress = 'screaming';
    egg.vy += GRAVITY * safeDt;
    egg.vx *= 0.995; // light air drag
    egg.x += egg.vx * safeDt;
    egg.y += egg.vy * safeDt;
    egg.angle += egg.angularVelocity * safeDt;

    // Bounce egg off start barrier if knocked backward
    if (egg.x < START_BARRIER_X - 10) {
      egg.x = START_BARRIER_X - 10;
      if (egg.vx < 0) egg.vx = -egg.vx * 0.3;
    }

    // Check collision with ground
    const eggGroundY = getTerrainHeight(egg.x);
    if (egg.y + egg.radiusY >= eggGroundY) {
      // Impact with ground!
      if (!shieldActive) {
        cracked = true;
        egg.cracked = true;
        egg.distress = 'cracked';
        reason = 'cracked';
      } else {
        // Shield bounces the egg back gently
        egg.y = eggGroundY - egg.radiusY;
        egg.vy = -Math.abs(egg.vy) * 0.5;
      }
    }

    // If egg falls too far behind the cart
    if (cart.x - egg.x > 180 || Math.abs(egg.y - cart.y) > 220) {
      if (!cracked) {
        cracked = true;
        egg.cracked = true;
        egg.distress = 'cracked';
        reason = 'lost_egg';
      }
    }
  }

  // Cart rollover check (tipped upside down)
  if (Math.abs(cart.angle) > 2.2) {
    if (egg.inCup) {
      egg.inCup = false;
      egg.distress = 'screaming';
    }
    if (!shieldActive) {
      cracked = true;
      egg.cracked = true;
      egg.distress = 'cracked';
      reason = 'tipped';
    }
  }

  return { cart, cracked, reason };
}
