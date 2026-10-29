import {
  StuntGameState,
  TractorState,
  WheelState,
  ControlInput,
  TrackData,
  TerrainSegment,
  Vector2D,
} from './types';
import { ALL_TRACKS } from './tracks';

export const GRAVITY = 980; // px/s^2
export const WHEELBASE = 38; // px between rear and front wheel
export const SUSPENSION_REST_Y = 18;
export const REAR_WHEEL_RADIUS = 18;
export const FRONT_WHEEL_RADIUS = 13;
export const DRIVER_HEAD_OFFSET: Vector2D = { x: -4, y: -26 };
export const DRIVER_HEAD_RADIUS = 11;
export const AIR_TORQUE = 4.8; // rad/s^2
export const DRIVE_ACCEL = 480; // px/s^2
export const MAX_FORWARD_SPEED = 550;
export const MAX_REVERSE_SPEED = 180;
export const FLIP_TIME_BONUS = 0.5; // seconds deducted per flip

// Helper: point to segment closest point & distance
export function getClosestPointOnSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): { x: number; y: number; distSq: number } {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    const dSq = (px - x1) * (px - x1) + (py - y1) * (py - y1);
    return { x: x1, y: y1, distSq: dSq };
  }

  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  const distSq = (px - projX) * (px - projX) + (py - projY) * (py - projY);

  return { x: projX, y: projY, distSq };
}

// Find ground height at exact X coordinate (or null if outside terrain)
export function getGroundHeightAtX(terrain: TerrainSegment[], x: number): number | null {
  for (const seg of terrain) {
    const minX = Math.min(seg.x1, seg.x2);
    const maxX = Math.max(seg.x1, seg.x2);
    if (x >= minX && x <= maxX) {
      if (seg.x2 === seg.x1) return Math.min(seg.y1, seg.y2);
      const t = (x - seg.x1) / (seg.x2 - seg.x1);
      return seg.y1 + t * (seg.y2 - seg.y1);
    }
  }
  return null;
}

export function createInitialTractor(startX: number, startY: number): TractorState {
  const rearX = startX - WHEELBASE / 2;
  const frontX = startX + WHEELBASE / 2;

  const rearWheel: WheelState = {
    x: rearX,
    y: startY + SUSPENSION_REST_Y,
    vx: 0,
    vy: 0,
    radius: REAR_WHEEL_RADIUS,
    isGrounded: true,
    angularVelocity: 0,
  };

  const frontWheel: WheelState = {
    x: frontX,
    y: startY + SUSPENSION_REST_Y,
    vx: 0,
    vy: 0,
    radius: FRONT_WHEEL_RADIUS,
    isGrounded: true,
    angularVelocity: 0,
  };

  return {
    x: startX,
    y: startY,
    vx: 0,
    vy: 0,
    angle: 0,
    angularVelocity: 0,
    rearWheel,
    frontWheel,
    driverHead: { x: startX + DRIVER_HEAD_OFFSET.x, y: startY + DRIVER_HEAD_OFFSET.y },
    isGrounded: true,
    isCrashed: false,
  };
}

export function initGame(
  trackIndex = 0,
  unlockedTracks = 1,
  trackBestTimes = [999, 999, 999]
): StuntGameState {
  const safeIndex = Math.max(0, Math.min(trackIndex, ALL_TRACKS.length - 1));
  const track = ALL_TRACKS[safeIndex];

  return {
    trackIndex: safeIndex,
    status: 'ready',
    elapsedTime: 0,
    timeBonus: 0,
    flipsCount: { backflips: 0, frontflips: 0 },
    airborneTime: 0,
    accumulatedAirAngle: 0,
    tractor: createInitialTractor(track.startX, track.startY),
    activeCheckpointIndex: -1,
    floatingTexts: [],
    unlockedTracks: Math.max(1, unlockedTracks),
    trackBestTimes,
  };
}

export function resetToCheckpoint(state: StuntGameState): StuntGameState {
  const track = ALL_TRACKS[state.trackIndex];
  let spawnX = track.startX;
  let spawnY = track.startY;

  if (state.activeCheckpointIndex >= 0 && state.activeCheckpointIndex < track.checkpoints.length) {
    const cp = track.checkpoints[state.activeCheckpointIndex];
    spawnX = cp.x;
    spawnY = cp.y - 20;
  }

  return {
    ...state,
    status: 'playing',
    accumulatedAirAngle: 0,
    airborneTime: 0,
    tractor: createInitialTractor(spawnX, spawnY),
  };
}

export function stepStuntGame(
  state: StuntGameState,
  input: ControlInput,
  dt: number
): StuntGameState {
  if (state.status === 'crashed' || state.status === 'finished') {
    return state;
  }

  const track = ALL_TRACKS[state.trackIndex];
  let nextStatus: StuntGameState['status'] = state.status;
  let nextElapsedTime = state.elapsedTime;
  let nextTimeBonus = state.timeBonus;
  const flipsCount = { ...state.flipsCount };
  let accumulatedAirAngle = state.accumulatedAirAngle;
  let airborneTime = state.airborneTime;
  let activeCheckpointIndex = state.activeCheckpointIndex;
  const floatingTexts = [...state.floatingTexts];

  // Start timer on first throttle / input if ready
  if (state.status === 'ready') {
    if (input.throttle > 0 || input.brake > 0 || input.tiltLeft || input.tiltRight) {
      nextStatus = 'playing';
    } else {
      return state;
    }
  }

  // Cap dt to prevent physics tunneling
  const fixedDt = Math.min(dt, 0.033);
  nextElapsedTime += fixedDt;

  const tractor: TractorState = {
    ...state.tractor,
    rearWheel: { ...state.tractor.rearWheel },
    frontWheel: { ...state.tractor.frontWheel },
  };

  // 1. Air Torque / Tilt Controls
  if (input.tiltLeft) {
    tractor.angularVelocity -= AIR_TORQUE * fixedDt;
  }
  if (input.tiltRight) {
    tractor.angularVelocity += AIR_TORQUE * fixedDt;
  }

  // 2. Throttle & Drive Acceleration
  if (tractor.rearWheel.isGrounded || tractor.frontWheel.isGrounded) {
    if (input.throttle > 0) {
      const driveForce = DRIVE_ACCEL * input.throttle * Math.cos(tractor.angle);
      tractor.vx = Math.min(tractor.vx + driveForce * fixedDt, MAX_FORWARD_SPEED);
      // Small wheelie torque on heavy acceleration
      tractor.angularVelocity -= 0.8 * fixedDt * input.throttle;
    }
    if (input.brake > 0) {
      const brakeForce = DRIVE_ACCEL * 0.7 * input.brake;
      tractor.vx = Math.max(tractor.vx - brakeForce * fixedDt, -MAX_REVERSE_SPEED);
      tractor.angularVelocity += 0.5 * fixedDt * input.brake;
    }
  }

  // 3. Apply Gravity
  tractor.vy += GRAVITY * fixedDt;
  tractor.rearWheel.vy += GRAVITY * fixedDt;
  tractor.frontWheel.vy += GRAVITY * fixedDt;

  // Natural air damping on rotation
  tractor.angularVelocity *= 0.985;
  tractor.angle += tractor.angularVelocity * fixedDt;

  // 4. Update Chassis Position
  tractor.x += tractor.vx * fixedDt;
  tractor.y += tractor.vy * fixedDt;

  // Derive ideal wheel positions based on chassis angle
  const cosA = Math.cos(tractor.angle);
  const sinA = Math.sin(tractor.angle);
  const halfBase = WHEELBASE / 2;

  const targetRearX = tractor.x - halfBase * cosA + SUSPENSION_REST_Y * sinA;
  const targetRearY = tractor.y - halfBase * sinA + SUSPENSION_REST_Y * cosA;

  const targetFrontX = tractor.x + halfBase * cosA + SUSPENSION_REST_Y * sinA;
  const targetFrontY = tractor.y + halfBase * sinA + SUSPENSION_REST_Y * cosA;

  tractor.rearWheel.x = targetRearX;
  tractor.rearWheel.y = targetRearY;
  tractor.frontWheel.x = targetFrontX;
  tractor.frontWheel.y = targetFrontY;

  // 5. Driver Head Position
  tractor.driverHead = {
    x: tractor.x + DRIVER_HEAD_OFFSET.x * cosA - DRIVER_HEAD_OFFSET.y * sinA,
    y: tractor.y + DRIVER_HEAD_OFFSET.x * sinA + DRIVER_HEAD_OFFSET.y * cosA,
  };

  // 6. Terrain Collision for Wheels
  let rearCollided = false;
  let frontCollided = false;

  for (const seg of track.terrain) {
    // Check rear wheel
    const rearProj = getClosestPointOnSegment(
      tractor.rearWheel.x,
      tractor.rearWheel.y,
      seg.x1,
      seg.y1,
      seg.x2,
      seg.y2
    );
    if (rearProj.distSq < tractor.rearWheel.radius * tractor.rearWheel.radius) {
      rearCollided = true;
      const dist = Math.sqrt(rearProj.distSq);
      const overlap = tractor.rearWheel.radius - dist;
      if (dist > 0.001) {
        const nx = (tractor.rearWheel.x - rearProj.x) / dist;
        const ny = (tractor.rearWheel.y - rearProj.y) / dist;
        tractor.y += ny * overlap * 0.5;
        tractor.vy = Math.min(tractor.vy, 0);
      } else {
        tractor.y -= overlap * 0.5;
      }
    }

    // Check front wheel
    const frontProj = getClosestPointOnSegment(
      tractor.frontWheel.x,
      tractor.frontWheel.y,
      seg.x1,
      seg.y1,
      seg.x2,
      seg.y2
    );
    if (frontProj.distSq < tractor.frontWheel.radius * tractor.frontWheel.radius) {
      frontCollided = true;
      const dist = Math.sqrt(frontProj.distSq);
      const overlap = tractor.frontWheel.radius - dist;
      if (dist > 0.001) {
        const nx = (tractor.frontWheel.x - frontProj.x) / dist;
        const ny = (tractor.frontWheel.y - frontProj.y) / dist;
        tractor.y += ny * overlap * 0.5;
        tractor.vy = Math.min(tractor.vy, 0);
      } else {
        tractor.y -= overlap * 0.5;
      }
    }

    // Check Driver Head Collision (Crash condition!)
    const headProj = getClosestPointOnSegment(
      tractor.driverHead.x,
      tractor.driverHead.y,
      seg.x1,
      seg.y1,
      seg.x2,
      seg.y2
    );
    // If head touches boundary or penetrates below terrain segment
    const isPenetrating =
      tractor.driverHead.x >= Math.min(seg.x1, seg.x2) &&
      tractor.driverHead.x <= Math.max(seg.x1, seg.x2) &&
      tractor.driverHead.y >= headProj.y;

    if (headProj.distSq < DRIVER_HEAD_RADIUS * DRIVER_HEAD_RADIUS || isPenetrating) {
      // Driver head slammed into ground -> CRASH!
      tractor.isCrashed = true;
      nextStatus = 'crashed';
      floatingTexts.push({
        id: `crash_${Date.now()}`,
        text: 'CRASH! Head Impact!',
        x: tractor.x,
        y: tractor.y - 30,
        color: '#ef4444',
        alpha: 1,
        scale: 1.2,
      });
      break;
    }
  }

  tractor.rearWheel.isGrounded = rearCollided;
  tractor.frontWheel.isGrounded = frontCollided;
  tractor.isGrounded = rearCollided || frontCollided;

  // Ground slope alignment when both wheels touch ground
  if (rearCollided && frontCollided) {
    const groundSlope = Math.atan2(
      tractor.frontWheel.y - tractor.rearWheel.y,
      tractor.frontWheel.x - tractor.rearWheel.x
    );
    tractor.angle += (groundSlope - tractor.angle) * 0.15;
  }

  // 7. Stunt & Flip Tracking
  if (!tractor.isGrounded) {
    airborneTime += fixedDt;
    accumulatedAirAngle += tractor.angularVelocity * fixedDt;

    // Detect Backflip (counter-clockwise full circle >= 2*PI)
    if (accumulatedAirAngle <= -2 * Math.PI + 0.15) {
      flipsCount.backflips++;
      nextTimeBonus += FLIP_TIME_BONUS;
      accumulatedAirAngle += 2 * Math.PI;
      floatingTexts.push({
        id: `flip_${Date.now()}_${flipsCount.backflips}`,
        text: 'BACKFLIP! -0.5s',
        x: tractor.x,
        y: tractor.y - 40,
        color: '#10b981',
        alpha: 1,
        scale: 1.3,
      });
    }

    // Detect Frontflip (clockwise full circle >= 2*PI)
    if (accumulatedAirAngle >= 2 * Math.PI - 0.15) {
      flipsCount.frontflips++;
      nextTimeBonus += FLIP_TIME_BONUS;
      accumulatedAirAngle -= 2 * Math.PI;
      floatingTexts.push({
        id: `flip_${Date.now()}_${flipsCount.frontflips}`,
        text: 'FRONTFLIP! -0.5s',
        x: tractor.x,
        y: tractor.y - 40,
        color: '#3b82f6',
        alpha: 1,
        scale: 1.3,
      });
    }
  } else {
    // Reset airborne accumulator on landing
    airborneTime = 0;
    accumulatedAirAngle = 0;
  }

  // 8. Hazard Interactions
  for (const hazard of track.hazards) {
    const hx = hazard.x;
    const hy = hazard.y;
    const hw = hazard.width;
    const hh = hazard.height;

    const inHazard =
      tractor.x >= hx &&
      tractor.x <= hx + hw &&
      tractor.y >= hy - 20 &&
      tractor.y <= hy + hh + 20;

    if (inHazard) {
      if (hazard.type === 'water_pit') {
        // Water slows forward velocity
        tractor.vx *= 0.94;
      } else if (hazard.type === 'springboard') {
        // Springboard launches vehicle upward and forward
        tractor.vy = -520;
        tractor.vx = Math.max(tractor.vx, 280);
      } else if (hazard.type === 'speed_boost') {
        // Turbo booster pad
        tractor.vx = Math.max(tractor.vx + 180, 520);
      } else if (hazard.type === 'tnt_barrel' && !hazard.triggered) {
        hazard.triggered = true;
        tractor.vy = -450;
        tractor.vx += 300;
        tractor.angularVelocity += 3.5;
        floatingTexts.push({
          id: `tnt_${hazard.id}`,
          text: 'BOOM! TNT BLAST!',
          x: hazard.x,
          y: hazard.y - 30,
          color: '#f97316',
          alpha: 1,
          scale: 1.4,
        });
      }
    }
  }

  // 9. Checkpoints
  track.checkpoints.forEach((cp, idx) => {
    if (!cp.passed && tractor.x >= cp.x) {
      cp.passed = true;
      activeCheckpointIndex = Math.max(activeCheckpointIndex, idx);
      floatingTexts.push({
        id: `cp_${cp.id}`,
        text: 'CHECKPOINT!',
        x: cp.x,
        y: cp.y - 40,
        color: '#facc15',
        alpha: 1,
        scale: 1.2,
      });
    }
  });

  // 10. Finish Line Check
  let unlockedTracks = state.unlockedTracks;
  const trackBestTimes = [...state.trackBestTimes];

  if (tractor.x >= track.finishX && nextStatus === 'playing') {
    nextStatus = 'finished';
    const finalScoreTime = Math.max(0.1, nextElapsedTime - nextTimeBonus);
    if (finalScoreTime < trackBestTimes[state.trackIndex]) {
      trackBestTimes[state.trackIndex] = parseFloat(finalScoreTime.toFixed(2));
    }
    // Unlock next track if available
    if (state.trackIndex + 1 < ALL_TRACKS.length) {
      unlockedTracks = Math.max(unlockedTracks, state.trackIndex + 2);
    }
  }

  // 11. Animate Floating Texts
  const updatedFloatingTexts = floatingTexts
    .map(ft => ({
      ...ft,
      y: ft.y - 30 * fixedDt,
      alpha: ft.alpha - 1.2 * fixedDt,
    }))
    .filter(ft => ft.alpha > 0);

  return {
    ...state,
    status: nextStatus,
    elapsedTime: nextElapsedTime,
    timeBonus: nextTimeBonus,
    flipsCount,
    airborneTime,
    accumulatedAirAngle,
    tractor,
    activeCheckpointIndex,
    floatingTexts: updatedFloatingTexts,
    unlockedTracks,
    trackBestTimes,
  };
}

export function calculateStars(trackIndex: number, finalTime: number): number {
  const track = ALL_TRACKS[trackIndex] || ALL_TRACKS[0];
  if (finalTime <= track.targetTimes.threeStars) return 3;
  if (finalTime <= track.targetTimes.twoStars) return 2;
  return 1;
}
