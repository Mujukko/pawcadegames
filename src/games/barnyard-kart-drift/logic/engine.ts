import {
  BarnyardKartState,
  KartEvent,
  KartInput,
  KartRacer,
  TrackConfig,
  TrackObstacle,
  TrackPickup,
  TrackPoint,
} from './types';

export const MAX_FORWARD_SPEED = 280; // px/sec
export const REVERSE_SPEED = 90;
export const ACCELERATION = 240;
export const BRAKE_FORCE = 320;
export const NATURAL_FRICTION = 110;
export const TURN_RATE = 3.2; // rad/sec
export const DRIFT_TURN_MULTIPLIER = 1.35;
export const DRIFT_SLIP_ANGLE = 0.35; // rad
export const MINI_TURBO_SPEED_BONUS = 140; // px/sec
export const NITRO_SPEED_BONUS = 180;
export const GRASS_SPEED_MULTIPLIER = 0.45;

export const TRACK_CONFIGS: TrackConfig[] = [
  {
    id: 'clover-meadow',
    name: 'Clover Meadow Circuit',
    lapsRequired: 3,
    trackWidth: 120,
    waypoints: [
      { x: 200, y: 150 },
      { x: 500, y: 140 },
      { x: 800, y: 220 },
      { x: 920, y: 450 },
      { x: 820, y: 700 },
      { x: 500, y: 740 },
      { x: 220, y: 680 },
      { x: 120, y: 420 },
    ],
    obstacles: [
      { id: 'mud-1', type: 'mud', x: 880, y: 350, radius: 45 },
      { id: 'mud-2', type: 'mud', x: 300, y: 720, radius: 40 },
      { id: 'slick-1', type: 'slick', x: 650, y: 730, radius: 35 },
    ],
    pickups: [
      { id: 'turbo-1', type: 'turbo_corn', x: 500, y: 140, radius: 24, collected: false, respawnTimer: 0 },
      { id: 'turbo-2', type: 'turbo_corn', x: 850, y: 550, radius: 24, collected: false, respawnTimer: 0 },
      { id: 'turbo-3', type: 'turbo_corn', x: 400, y: 740, radius: 24, collected: false, respawnTimer: 0 },
      { id: 'carrot-1', type: 'golden_carrot', x: 140, y: 300, radius: 24, collected: false, respawnTimer: 0 },
    ],
    startPositions: [
      { x: 180, y: 280, angle: -Math.PI / 2 },
      { x: 140, y: 330, angle: -Math.PI / 2 },
      { x: 220, y: 340, angle: -Math.PI / 2 },
      { x: 170, y: 390, angle: -Math.PI / 2 },
    ],
  },
  {
    id: 'autumn-orchard',
    name: 'Autumn Orchard S-Curves',
    lapsRequired: 3,
    trackWidth: 110,
    waypoints: [
      { x: 180, y: 160 },
      { x: 450, y: 150 },
      { x: 620, y: 260 },
      { x: 460, y: 400 },
      { x: 680, y: 520 },
      { x: 880, y: 460 },
      { x: 920, y: 680 },
      { x: 740, y: 820 },
      { x: 420, y: 800 },
      { x: 200, y: 680 },
      { x: 120, y: 450 },
      { x: 130, y: 260 },
    ],
    obstacles: [
      { id: 'mud-1', type: 'mud', x: 550, y: 320, radius: 40 },
      { id: 'slick-1', type: 'slick', x: 760, y: 480, radius: 35 },
      { id: 'hay-1', type: 'hay_bale', x: 450, y: 790, radius: 30 },
      { id: 'mud-2', type: 'mud', x: 220, y: 550, radius: 45 },
    ],
    pickups: [
      { id: 'turbo-1', type: 'turbo_corn', x: 450, y: 150, radius: 24, collected: false, respawnTimer: 0 },
      { id: 'turbo-2', type: 'turbo_corn', x: 880, y: 580, radius: 24, collected: false, respawnTimer: 0 },
      { id: 'turbo-3', type: 'turbo_corn', x: 580, y: 810, radius: 24, collected: false, respawnTimer: 0 },
      { id: 'carrot-1', type: 'golden_carrot', x: 120, y: 350, radius: 24, collected: false, respawnTimer: 0 },
    ],
    startPositions: [
      { x: 150, y: 280, angle: -Math.PI / 2 },
      { x: 110, y: 330, angle: -Math.PI / 2 },
      { x: 190, y: 340, angle: -Math.PI / 2 },
      { x: 150, y: 390, angle: -Math.PI / 2 },
    ],
  },
  {
    id: 'sunset-speedway',
    name: 'Sunset Barnyard Speedway',
    lapsRequired: 3,
    trackWidth: 115,
    waypoints: [
      { x: 180, y: 160 },
      { x: 520, y: 140 },
      { x: 820, y: 180 },
      { x: 920, y: 360 },
      { x: 750, y: 450 },
      { x: 890, y: 600 },
      { x: 820, y: 780 },
      { x: 520, y: 820 },
      { x: 300, y: 740 },
      { x: 380, y: 540 },
      { x: 220, y: 420 },
      { x: 130, y: 280 },
    ],
    obstacles: [
      { id: 'slick-1', type: 'slick', x: 820, y: 260, radius: 35 },
      { id: 'mud-1', type: 'mud', x: 820, y: 520, radius: 45 },
      { id: 'hay-1', type: 'hay_bale', x: 600, y: 820, radius: 30 },
      { id: 'slick-2', type: 'slick', x: 260, y: 480, radius: 35 },
    ],
    pickups: [
      { id: 'turbo-1', type: 'turbo_corn', x: 520, y: 140, radius: 24, collected: false, respawnTimer: 0 },
      { id: 'turbo-2', type: 'turbo_corn', x: 900, y: 480, radius: 24, collected: false, respawnTimer: 0 },
      { id: 'turbo-3', type: 'turbo_corn', x: 420, y: 790, radius: 24, collected: false, respawnTimer: 0 },
      { id: 'carrot-1', type: 'golden_carrot', x: 130, y: 360, radius: 24, collected: false, respawnTimer: 0 },
    ],
    startPositions: [
      { x: 150, y: 290, angle: -Math.PI / 2 },
      { x: 110, y: 340, angle: -Math.PI / 2 },
      { x: 190, y: 350, angle: -Math.PI / 2 },
      { x: 150, y: 400, angle: -Math.PI / 2 },
    ],
  },
  {
    id: 'mountain-rally',
    name: 'Muddy Mountain Rally',
    lapsRequired: 3,
    trackWidth: 105,
    waypoints: [
      { x: 200, y: 150 },
      { x: 540, y: 130 },
      { x: 850, y: 160 },
      { x: 940, y: 380 },
      { x: 720, y: 430 },
      { x: 560, y: 350 },
      { x: 480, y: 520 },
      { x: 740, y: 640 },
      { x: 900, y: 740 },
      { x: 700, y: 860 },
      { x: 380, y: 840 },
      { x: 180, y: 720 },
      { x: 120, y: 460 },
      { x: 140, y: 280 },
    ],
    obstacles: [
      { id: 'mud-1', type: 'mud', x: 780, y: 240, radius: 45 },
      { id: 'slick-1', type: 'slick', x: 620, y: 380, radius: 35 },
      { id: 'mud-2', type: 'mud', x: 620, y: 580, radius: 45 },
      { id: 'hay-1', type: 'hay_bale', x: 520, y: 850, radius: 30 },
      { id: 'slick-2', type: 'slick', x: 150, y: 580, radius: 35 },
    ],
    pickups: [
      { id: 'turbo-1', type: 'turbo_corn', x: 540, y: 130, radius: 24, collected: false, respawnTimer: 0 },
      { id: 'turbo-2', type: 'turbo_corn', x: 800, y: 410, radius: 24, collected: false, respawnTimer: 0 },
      { id: 'turbo-3', type: 'turbo_corn', x: 820, y: 700, radius: 24, collected: false, respawnTimer: 0 },
      { id: 'turbo-4', type: 'turbo_corn', x: 260, y: 790, radius: 24, collected: false, respawnTimer: 0 },
      { id: 'carrot-1', type: 'golden_carrot', x: 120, y: 360, radius: 24, collected: false, respawnTimer: 0 },
    ],
    startPositions: [
      { x: 160, y: 290, angle: -Math.PI / 2 },
      { x: 120, y: 340, angle: -Math.PI / 2 },
      { x: 200, y: 350, angle: -Math.PI / 2 },
      { x: 160, y: 400, angle: -Math.PI / 2 },
    ],
  },
];

export function createInitialRacers(track: TrackConfig): KartRacer[] {
  return [
    {
      id: 'player',
      name: 'Sunny Corgi',
      animal: 'corgi',
      color: '#f59e0b',
      x: track.startPositions[0].x,
      y: track.startPositions[0].y,
      angle: track.startPositions[0].angle,
      speed: 0,
      steerAngle: 0,
      isDrifting: false,
      driftDirection: 0,
      driftCharge: 0,
      spinTimer: 0,
      mudTimer: 0,
      turboTimer: 0,
      lap: 1,
      currentCheckpoint: 0,
      totalDistance: 0,
      totalTime: 0,
      isAI: false,
      aiTargetWaypoint: 0,
      rank: 1,
      finished: false,
    },
    {
      id: 'ai-bessie',
      name: 'Bessie Cow',
      animal: 'cow',
      color: '#10b981',
      x: track.startPositions[1].x,
      y: track.startPositions[1].y,
      angle: track.startPositions[1].angle,
      speed: 0,
      steerAngle: 0,
      isDrifting: false,
      driftDirection: 0,
      driftCharge: 0,
      spinTimer: 0,
      mudTimer: 0,
      turboTimer: 0,
      lap: 1,
      currentCheckpoint: 0,
      totalDistance: 0,
      totalTime: 0,
      isAI: true,
      aiTargetWaypoint: 0,
      rank: 2,
      finished: false,
    },
    {
      id: 'ai-clucky',
      name: 'Clucky Hen',
      animal: 'chicken',
      color: '#ef4444',
      x: track.startPositions[2].x,
      y: track.startPositions[2].y,
      angle: track.startPositions[2].angle,
      speed: 0,
      steerAngle: 0,
      isDrifting: false,
      driftDirection: 0,
      driftCharge: 0,
      spinTimer: 0,
      mudTimer: 0,
      turboTimer: 0,
      lap: 1,
      currentCheckpoint: 0,
      totalDistance: 0,
      totalTime: 0,
      isAI: true,
      aiTargetWaypoint: 0,
      rank: 3,
      finished: false,
    },
    {
      id: 'ai-penny',
      name: 'Penny Piglet',
      animal: 'piglet',
      color: '#ec4899',
      x: track.startPositions[3].x,
      y: track.startPositions[3].y,
      angle: track.startPositions[3].angle,
      speed: 0,
      steerAngle: 0,
      isDrifting: false,
      driftDirection: 0,
      driftCharge: 0,
      spinTimer: 0,
      mudTimer: 0,
      turboTimer: 0,
      lap: 1,
      currentCheckpoint: 0,
      totalDistance: 0,
      totalTime: 0,
      isAI: true,
      aiTargetWaypoint: 0,
      rank: 4,
      finished: false,
    },
  ];
}

export function createInitialState(trackIndex = 0): BarnyardKartState {
  const safeIndex = Math.max(0, Math.min(trackIndex, TRACK_CONFIGS.length - 1));
  const track = JSON.parse(JSON.stringify(TRACK_CONFIGS[safeIndex])) as TrackConfig;
  const racers = createInitialRacers(track);

  return {
    track,
    trackIndex: safeIndex,
    racers,
    playerRank: 1,
    playerLap: 1,
    totalLaps: track.lapsRequired,
    raceTime: 0,
    bestLapTime: 0,
    currentLapTime: 0,
    status: 'ready',
    countdown: 3.0,
    events: [],
  };
}

// Distance from point to line segment
export function distanceToSegment(p: TrackPoint, a: TrackPoint, b: TrackPoint): number {
  const l2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
  if (l2 === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  const projX = a.x + t * (b.x - a.x);
  const projY = a.y + t * (b.y - a.y);
  return Math.hypot(p.x - projX, p.y - projY);
}

// Checks distance of racer to track spline
export function isRacerOnTrack(x: number, y: number, track: TrackConfig): { onTrack: boolean; dist: number } {
  let minDist = Infinity;
  const pts = track.waypoints;
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const next = (i + 1) % n;
    const d = distanceToSegment({ x, y }, pts[i], pts[next]);
    if (d < minDist) minDist = d;
  }
  return {
    onTrack: minDist <= track.trackWidth * 0.58,
    dist: minDist,
  };
}

export function normalizeAngle(angle: number): number {
  while (angle > Math.PI) angle -= 2 * Math.PI;
  while (angle < -Math.PI) angle += 2 * Math.PI;
  return angle;
}

export function updateEngine(
  state: BarnyardKartState,
  playerInput: KartInput,
  dt: number
): BarnyardKartState {
  const clampedDt = Math.max(0.001, Math.min(dt, 0.1));
  const events: KartEvent[] = [];

  // Countdown handling
  if (state.status === 'ready') {
    const newCountdown = state.countdown - clampedDt;
    if (newCountdown <= 0) {
      events.push({ type: 'engine_rev', racerId: 'player', timestamp: state.raceTime });
      return {
        ...state,
        status: 'racing',
        countdown: 0,
        events,
      };
    }
    return {
      ...state,
      countdown: newCountdown,
      events,
    };
  }

  if (state.status === 'finished') {
    return {
      ...state,
      events,
    };
  }

  // Update pickups respawn
  const updatedPickups = state.track.pickups.map((p) => {
    if (p.collected) {
      const remaining = p.respawnTimer - clampedDt;
      if (remaining <= 0) {
        return { ...p, collected: false, respawnTimer: 0 };
      }
      return { ...p, respawnTimer: remaining };
    }
    return p;
  });

  const currentTrack: TrackConfig = {
    ...state.track,
    pickups: updatedPickups,
  };

  const newRaceTime = state.raceTime + clampedDt;
  let newCurrentLapTime = state.currentLapTime + clampedDt;
  let newBestLapTime = state.bestLapTime;

  // Process all racers
  const updatedRacers: KartRacer[] = state.racers.map((racer) => {
    if (racer.finished) return racer;

    let input: KartInput;
    if (!racer.isAI) {
      input = playerInput;
    } else {
      // AI Steering & Throttle
      const targetWp = currentTrack.waypoints[racer.aiTargetWaypoint];
      const dx = targetWp.x - racer.x;
      const dy = targetWp.y - racer.y;
      const targetAngle = Math.atan2(dy, dx);
      let diff = normalizeAngle(targetAngle - racer.angle);

      const steer = Math.max(-1, Math.min(1, diff * 2.2));
      const distToWp = Math.hypot(dx, dy);

      // AI drift on sharp turns
      const wantDrift = Math.abs(diff) > 0.65 && racer.speed > 160;

      input = {
        steer,
        gas: true,
        reverse: false,
        drift: wantDrift,
      };

      // Advance AI target waypoint if close
      if (distToWp < currentTrack.trackWidth * 0.75) {
        racer = {
          ...racer,
          aiTargetWaypoint: (racer.aiTargetWaypoint + 1) % currentTrack.waypoints.length,
        };
      }
    }

    let racerCopy = { ...racer };

    // Spin out timer
    if (racerCopy.spinTimer > 0) {
      const remainingSpin = racerCopy.spinTimer - clampedDt;
      racerCopy.spinTimer = Math.max(0, remainingSpin);
      racerCopy.angle += (Math.PI * 4) * clampedDt;
      racerCopy.speed = Math.max(0, racerCopy.speed - BRAKE_FORCE * clampedDt * 0.8);
      return racerCopy;
    }

    // Mud timer decay
    if (racerCopy.mudTimer > 0) {
      racerCopy.mudTimer = Math.max(0, racerCopy.mudTimer - clampedDt);
    }

    // Turbo timer decay
    if (racerCopy.turboTimer > 0) {
      racerCopy.turboTimer = Math.max(0, racerCopy.turboTimer - clampedDt);
    }

    // Steering & Drift
    const isDrifting = input.drift && input.steer !== 0 && racerCopy.speed > 100;
    if (isDrifting && !racerCopy.isDrifting) {
      racerCopy.isDrifting = true;
      racerCopy.driftDirection = input.steer > 0 ? 1 : -1;
      racerCopy.driftCharge = 0;
      events.push({ type: 'drift_start', racerId: racerCopy.id, x: racerCopy.x, y: racerCopy.y, timestamp: newRaceTime });
    } else if (!isDrifting && racerCopy.isDrifting) {
      // Releasing drift -> check for mini turbo boost
      if (racerCopy.driftCharge >= 0.5) {
        racerCopy.turboTimer = 1.2;
        events.push({ type: 'drift_boost', racerId: racerCopy.id, x: racerCopy.x, y: racerCopy.y, timestamp: newRaceTime });
      }
      racerCopy.isDrifting = false;
      racerCopy.driftCharge = 0;
      racerCopy.driftDirection = 0;
    }

    if (racerCopy.isDrifting) {
      racerCopy.driftCharge = Math.min(1.0, racerCopy.driftCharge + clampedDt * 0.7);
    }

    // Angular update
    const speedRatio = Math.min(1.0, Math.abs(racerCopy.speed) / (MAX_FORWARD_SPEED * 0.6));
    const effectiveTurnRate = TURN_RATE * (racerCopy.isDrifting ? DRIFT_TURN_MULTIPLIER : 1.0);
    racerCopy.angle = normalizeAngle(racerCopy.angle + input.steer * effectiveTurnRate * speedRatio * clampedDt);

    // Speed calculation
    let maxSpeed = MAX_FORWARD_SPEED;
    if (racerCopy.turboTimer > 0) {
      maxSpeed += NITRO_SPEED_BONUS;
    } else if (racerCopy.mudTimer > 0) {
      maxSpeed *= 0.45;
    }

    // Check on-track status
    const trackCheck = isRacerOnTrack(racerCopy.x, racerCopy.y, currentTrack);
    if (!trackCheck.onTrack) {
      maxSpeed *= GRASS_SPEED_MULTIPLIER;
    }

    if (input.gas) {
      racerCopy.speed = Math.min(maxSpeed, racerCopy.speed + ACCELERATION * clampedDt);
    } else if (input.reverse) {
      racerCopy.speed = Math.max(-REVERSE_SPEED, racerCopy.speed - BRAKE_FORCE * clampedDt);
    } else {
      // Natural deceleration
      if (racerCopy.speed > 0) {
        racerCopy.speed = Math.max(0, racerCopy.speed - NATURAL_FRICTION * clampedDt);
      } else if (racerCopy.speed < 0) {
        racerCopy.speed = Math.min(0, racerCopy.speed + NATURAL_FRICTION * clampedDt);
      }
    }

    // Clamp speed if exceeding max
    if (racerCopy.speed > maxSpeed) {
      racerCopy.speed = Math.max(maxSpeed, racerCopy.speed - BRAKE_FORCE * clampedDt * 0.5);
    }

    // Actual motion vector with drift slip
    let travelAngle = racerCopy.angle;
    if (racerCopy.isDrifting) {
      travelAngle -= racerCopy.driftDirection * DRIFT_SLIP_ANGLE;
    }

    const moveDist = racerCopy.speed * clampedDt;
    racerCopy.x += Math.cos(travelAngle) * moveDist;
    racerCopy.y += Math.sin(travelAngle) * moveDist;
    racerCopy.totalDistance += Math.abs(moveDist);
    racerCopy.totalTime += clampedDt;

    // Obstacle collisions
    for (const obs of currentTrack.obstacles) {
      const d = Math.hypot(racerCopy.x - obs.x, racerCopy.y - obs.y);
      if (d <= obs.radius + 18) {
        if (obs.type === 'mud' && racerCopy.mudTimer <= 0) {
          racerCopy.mudTimer = 1.0;
          racerCopy.speed *= 0.5;
          events.push({ type: 'mud_hit', racerId: racerCopy.id, x: obs.x, y: obs.y, timestamp: newRaceTime });
        } else if (obs.type === 'slick' && racerCopy.spinTimer <= 0) {
          racerCopy.spinTimer = 0.5;
          events.push({ type: 'slick_spin', racerId: racerCopy.id, x: obs.x, y: obs.y, timestamp: newRaceTime });
        } else if (obs.type === 'hay_bale') {
          // Bounce off
          racerCopy.speed = -40;
          const pushAngle = Math.atan2(racerCopy.y - obs.y, racerCopy.x - obs.x);
          racerCopy.x = obs.x + Math.cos(pushAngle) * (obs.radius + 20);
          racerCopy.y = obs.y + Math.sin(pushAngle) * (obs.radius + 20);
        }
      }
    }

    // Pickup collisions
    for (const p of currentTrack.pickups) {
      if (!p.collected) {
        const d = Math.hypot(racerCopy.x - p.x, racerCopy.y - p.y);
        if (d <= p.radius + 18) {
          p.collected = true;
          p.respawnTimer = 6.0;
          racerCopy.turboTimer = 2.0;
          events.push({ type: 'turbo_collect', racerId: racerCopy.id, x: p.x, y: p.y, timestamp: newRaceTime });
        }
      }
    }

    // Checkpoint & Lap Detection
    const waypoints = currentTrack.waypoints;
    const targetCheckpoint = racerCopy.currentCheckpoint;
    const targetWp = waypoints[targetCheckpoint];
    const distToCheckpoint = Math.hypot(racerCopy.x - targetWp.x, racerCopy.y - targetWp.y);

    if (distToCheckpoint < currentTrack.trackWidth * 0.85) {
      const nextCheckpoint = (targetCheckpoint + 1) % waypoints.length;
      racerCopy.currentCheckpoint = nextCheckpoint;
      events.push({ type: 'checkpoint_pass', racerId: racerCopy.id, timestamp: newRaceTime });

      // Check for Lap Completion
      if (nextCheckpoint === 1 && targetCheckpoint === 0) {
        // Just crossed finish line
        racerCopy.lap += 1;
        events.push({ type: 'lap_complete', racerId: racerCopy.id, timestamp: newRaceTime });

        if (racerCopy.id === 'player') {
          if (newBestLapTime === 0 || newCurrentLapTime < newBestLapTime) {
            newBestLapTime = newCurrentLapTime;
          }
          newCurrentLapTime = 0;

          if (racerCopy.lap === currentTrack.lapsRequired) {
            events.push({ type: 'final_lap', racerId: racerCopy.id, timestamp: newRaceTime });
          }
        }

        if (racerCopy.lap > currentTrack.lapsRequired) {
          racerCopy.finished = true;
          racerCopy.lap = currentTrack.lapsRequired;
          events.push({ type: 'race_finish', racerId: racerCopy.id, timestamp: newRaceTime });
        }
      }
    }

    return racerCopy;
  });

  // Calculate Ranks based on lap, checkpoint, and distance to next checkpoint
  const rankedIndices = updatedRacers.map((r, idx) => {
    const targetWp = currentTrack.waypoints[r.currentCheckpoint];
    const distToNext = Math.hypot(r.x - targetWp.x, r.y - targetWp.y);
    const score = r.finished
      ? 100000 - r.totalTime
      : r.lap * 10000 + r.currentCheckpoint * 500 - distToNext;
    return { idx, score };
  });

  rankedIndices.sort((a, b) => b.score - a.score);

  rankedIndices.forEach((item, pos) => {
    updatedRacers[item.idx].rank = pos + 1;
  });

  const playerRacer = updatedRacers.find((r) => r.id === 'player')!;
  const isPlayerFinished = playerRacer.finished;

  return {
    ...state,
    track: currentTrack,
    racers: updatedRacers,
    playerRank: playerRacer.rank,
    playerLap: Math.min(state.totalLaps, playerRacer.lap),
    raceTime: newRaceTime,
    bestLapTime: newBestLapTime,
    currentLapTime: newCurrentLapTime,
    status: isPlayerFinished ? 'finished' : 'racing',
    events,
  };
}
